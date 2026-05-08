package com.millarayne.cyber.ui.chat

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.millarayne.cyber.MillaApp
import com.millarayne.cyber.ai.AiChunk
import com.millarayne.cyber.ai.AiMessage
import com.millarayne.cyber.ai.AiOrchestrator
import com.millarayne.cyber.data.db.MessageEntity
import com.millarayne.cyber.data.model.Attachment
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

/**
 * Single-source-of-truth state for the chat:
 *  - persisted messages (from Room)
 *  - ephemeral streaming buffer for the current assistant turn
 *  - pending attachments staged for next send
 *  - error / loading
 */
class ChatViewModel(app: Application) : AndroidViewModel(app) {

    private val appRef = app as MillaApp
    private val dao = appRef.database.messageDao()
    private val orchestrator = AiOrchestrator(appRef.settings)

    private val _messages = MutableStateFlow<List<MessageEntity>>(emptyList())
    val messages: StateFlow<List<MessageEntity>> = _messages.asStateFlow()

    private val _streamingBuffer = MutableStateFlow<String?>(null)
    val streamingBuffer: StateFlow<String?> = _streamingBuffer.asStateFlow()

    private val _activeProvider = MutableStateFlow<String?>(null)
    val activeProvider: StateFlow<String?> = _activeProvider.asStateFlow()

    private val _isSending = MutableStateFlow(false)
    val isSending: StateFlow<Boolean> = _isSending.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _pending = MutableStateFlow<List<Attachment>>(emptyList())
    val pending: StateFlow<List<Attachment>> = _pending.asStateFlow()

    init {
        viewModelScope.launch {
            dao.observeAll().collectLatest { _messages.value = it }
        }
    }

    fun stageAttachment(attachment: Attachment) {
        _pending.value = _pending.value + attachment
    }

    fun removeAttachment(attachment: Attachment) {
        _pending.value = _pending.value - attachment
    }

    fun clearError() { _error.value = null }

    fun sendUserMessage(text: String) {
        if (_isSending.value) return
        if (text.isBlank() && _pending.value.isEmpty()) return
        val attachments = _pending.value
        _pending.value = emptyList()

        viewModelScope.launch {
            _isSending.value = true
            _error.value = null
            try {
                // Persist user message (attachments stored as note for now)
                val attachNote = if (attachments.isNotEmpty())
                    attachments.joinToString { it.mime + " (" + it.sizeKb + "kb)" }
                else null
                dao.insert(
                    MessageEntity(
                        role = "user",
                        content = text,
                        attachmentMime = attachNote
                    )
                )

                // Build AI history from persisted messages (already includes this user
                // turn). For the final user message, attach the staged attachments
                // since they're not stored in Room.
                val all = dao.loadAll()
                val history = all.mapIndexed { idx, m ->
                    val isLast = idx == all.lastIndex
                    AiMessage(
                        role = m.role,
                        content = m.content,
                        attachments = if (isLast && m.role == "user") attachments else emptyList()
                    )
                }.takeLast(40)

                val sb = StringBuilder()
                var providerId: String? = null
                var modelId: String? = null
                _streamingBuffer.value = ""
                orchestrator.send(history).collect { chunk ->
                    when (chunk) {
                        is AiChunk.Meta -> {
                            providerId = chunk.provider
                            modelId = chunk.model
                            _activeProvider.value = "${chunk.provider} · ${chunk.model}"
                        }
                        is AiChunk.Token -> {
                            sb.append(chunk.text)
                            _streamingBuffer.value = sb.toString()
                        }
                        is AiChunk.Done -> {
                            // persist final assistant message
                            val finalText = sb.toString().ifBlank { "(no response)" }
                            dao.insert(
                                MessageEntity(
                                    role = "assistant",
                                    content = finalText,
                                    provider = providerId ?: chunk.provider,
                                    model = modelId ?: chunk.model
                                )
                            )
                            _streamingBuffer.value = null
                        }
                    }
                }
            } catch (t: Throwable) {
                _error.value = t.message ?: "send failed"
                _streamingBuffer.value = null
            } finally {
                _isSending.value = false
            }
        }
    }

    fun clearChat() {
        viewModelScope.launch { dao.clear() }
    }
}
