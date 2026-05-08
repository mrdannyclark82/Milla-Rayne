package com.millarayne.cyber.ai

import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.millarayne.cyber.data.prefs.SettingsRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

/**
 * Talks to the user's Milla-Rayne Node.js server (`POST /api/chat`).
 * Body shape (best-effort, matches server/routes/chat in the repo):
 *   { "message": "<text>", "history": [...] }
 * Response shape we accept (any of):
 *   { "response": "..." } | { "content": "..." } | { "message": "..." } | { "text": "..." }
 *
 * If the user has not configured a backend URL this provider reports
 * `isConfigured() == false` so the orchestrator skips it.
 */
class MillaBackendProvider(private val settings: SettingsRepository) : AiProvider {
    override val id: String = "backend"
    override val displayName: String = "Milla-Rayne backend"
    override val supportsStreaming: Boolean = false
    override val supportsMultimodal: Boolean = false   // attachments are sent as text fallback

    override fun isConfigured(): Boolean = settings.state.value.backendUrl.isNotBlank()

    override fun send(history: List<AiMessage>): Flow<AiChunk> = flow {
        val s = settings.state.value
        val base = s.backendUrl.trimEnd('/').ifBlank { throw ProviderUnavailable("backend URL missing") }
        emit(AiChunk.Meta(id, "milla-rayne"))

        val last = history.lastOrNull { it.role == "user" } ?: throw ProviderUnavailable("no user message")
        val attachmentNote = if (last.attachments.isNotEmpty()) {
            "\n\n[Attached: ${last.attachments.joinToString { it.mime }}]"
        } else ""
        val root = JsonObject().apply {
            addProperty("message", last.content + attachmentNote)
        }

        val req = Request.Builder()
            .url("$base/api/chat")
            .addHeader("Content-Type", "application/json")
            .post(root.toString().toRequestBody("application/json".toMediaType()))
            .build()

        Http.client.newCall(req).execute().use { resp ->
            val str = resp.body?.string().orEmpty()
            if (!resp.isSuccessful) {
                if (resp.code in 500..599) throw RuntimeException("Backend ${resp.code}")
                throw ProviderUnavailable("Backend ${resp.code}: $str")
            }
            val obj = runCatching { JsonParser.parseString(str).asJsonObject }.getOrNull()
            val text = obj?.let { o ->
                listOf("response", "content", "message", "text", "reply").firstNotNullOfOrNull {
                    o.get(it)?.takeIf { e -> !e.isJsonNull }?.asString
                }
            } ?: str
            if (text.isNotEmpty()) emit(AiChunk.Token(text))
            emit(AiChunk.Done(id, "milla-rayne"))
        }
    }.flowOn(Dispatchers.IO)
}
