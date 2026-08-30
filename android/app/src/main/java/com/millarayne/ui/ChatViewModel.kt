package com.millarayne.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.millarayne.agent.OfflineResponseGenerator
import com.millarayne.api.MillaApiClient
import com.millarayne.data.AppDatabase
import com.millarayne.data.ChatRequest
import com.millarayne.data.Message
import com.millarayne.data.MessageDao
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class ChatViewModel(application: Application) : AndroidViewModel(application) {
    private val _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages: StateFlow<List<Message>> = _messages

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    private val _isOfflineMode = MutableStateFlow(false)
    val isOfflineMode: StateFlow<Boolean> = _isOfflineMode

    private val messageDao: MessageDao
    private val offlineGenerator: OfflineResponseGenerator

    init {
        val database = AppDatabase.getDatabase(application)
        messageDao = database.messageDao()
        offlineGenerator = OfflineResponseGenerator(application)
        loadMessages()
        syncPendingMessages() // Try to sync any offline messages on startup
    }

    override fun onCleared() {
        super.onCleared()
        offlineGenerator.shutdown()
    }

    private fun loadMessages() {
        viewModelScope.launch {
            try {
                messageDao.getAllMessages().collect { msgs ->
                    _messages.value = msgs
                }
            } catch (e: Exception) {
                _error.value = "Failed to load messages: ${e.localizedMessage}"
            }
        }
    }

    // Basic sync function to retry sending unsynced messages
    fun syncPendingMessages() {
        viewModelScope.launch {
            val unsynced = messageDao.getUnsyncedMessages()
            if (unsynced.isEmpty()) return@launch

            unsynced.forEach { msg ->
                try {
                    val response = MillaApiClient.apiService.sendMessage(ChatRequest(message = msg.content))
                    if (response.isSuccessful) {
                        messageDao.markAsSynced(msg.id)
                        // Note: We might get a duplicate response if we don't handle it carefully,
                        // but for now, we just ensure the user message reaches the server.
                        // Ideally, the server would handle deduping or we'd handle the delayed response.
                    }
                } catch (e: Exception) {
                    // Still offline, skip
                }
            }
        }
    }

    fun sendMessage(content: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            // 1. Save User Message Locally (marked as unsynced initially)
            val userMessage = Message(
                content = content.trim(),
                role = "user",
                timestamp = System.currentTimeMillis(),
                isSynced = false
            )

            var messageId: Long = 0
            try {
                messageId = messageDao.insertMessage(userMessage)
            } catch (e: Exception) {
                _error.value = "Failed to save message: ${e.message}"
                _isLoading.value = false
                return@launch
            }

            // 2. Attempt to Send to API
            var assistantResponseText: String? = null

            try {
                // Check if offline mode is explicitly enabled or try to connect
                val response = MillaApiClient.apiService.sendMessage(ChatRequest(message = content))

                if (response.isSuccessful && response.body() != null) {
                    assistantResponseText = response.body()?.response
                    _isOfflineMode.value = false // Successful connection

                    // Mark as synced since it reached the server
                    messageDao.markAsSynced(messageId)
                } else {
                    throw Exception("Server returned ${response.code()}")
                }
            } catch (e: Exception) {
                // 3. Fallback to Offline Mode
                android.util.Log.w("ChatViewModel", "Online failed, switching to offline: ${e.message}")
                _isOfflineMode.value = true

                try {
                    assistantResponseText = offlineGenerator.generateResponse(content)
                } catch (offlineErr: Exception) {
                    _error.value = "Both online and offline assistants failed."
                }
            }

            // 4. Save Assistant Response
            if (assistantResponseText != null) {
                val assistantMessage = Message(
                    content = assistantResponseText,
                    role = "assistant",
                    timestamp = System.currentTimeMillis(),
                    isSynced = true // Local responses considered synced/local-only
                )
                try {
                    messageDao.insertMessage(assistantMessage)
                } catch (e: Exception) {
                    _error.value = "Failed to save response: ${e.message}"
                }
            }

            _isLoading.value = false
        }
    }

    fun clearError() {
        _error.value = null
    }
}
