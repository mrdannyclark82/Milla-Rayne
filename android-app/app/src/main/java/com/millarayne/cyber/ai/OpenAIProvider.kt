package com.millarayne.cyber.ai

import android.util.Base64
import com.google.gson.JsonArray
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
 * Direct REST integration with OpenAI Chat Completions.
 * Multimodal: images supported via base64 data URLs as image_url parts.
 */
class OpenAIProvider(private val settings: SettingsRepository) : AiProvider {
    override val id: String = "openai"
    override val displayName: String = "OpenAI"
    override val supportsStreaming: Boolean = false  // simple non-stream impl below
    override val supportsMultimodal: Boolean = true

    override fun isConfigured(): Boolean = settings.state.value.openAiKey.isNotBlank()

    override fun send(history: List<AiMessage>): Flow<AiChunk> = flow {
        val s = settings.state.value
        if (s.openAiKey.isBlank()) throw ProviderUnavailable("OpenAI key missing")
        val model = s.openAiModel
        emit(AiChunk.Meta(id, model))

        val root = JsonObject()
        root.addProperty("model", model)
        root.addProperty("temperature", 0.8)
        val msgs = JsonArray()
        for (m in history) {
            val msg = JsonObject()
            msg.addProperty("role", if (m.role == "assistant") "assistant" else m.role)
            // For multimodal, content must be an array of parts
            if (m.attachments.isEmpty()) {
                msg.addProperty("content", m.content)
            } else {
                val parts = JsonArray()
                if (m.content.isNotBlank()) {
                    val tp = JsonObject(); tp.addProperty("type", "text"); tp.addProperty("text", m.content)
                    parts.add(tp)
                }
                for (att in m.attachments.filter { it.mime.startsWith("image/") }) {
                    val ip = JsonObject()
                    ip.addProperty("type", "image_url")
                    val u = JsonObject()
                    u.addProperty("url", "data:${att.mime};base64,${Base64.encodeToString(att.bytes, Base64.NO_WRAP)}")
                    ip.add("image_url", u)
                    parts.add(ip)
                }
                msg.add("content", parts)
            }
            msgs.add(msg)
        }
        root.add("messages", msgs)

        val req = Request.Builder()
            .url("https://api.openai.com/v1/chat/completions")
            .addHeader("Authorization", "Bearer ${s.openAiKey}")
            .addHeader("Content-Type", "application/json")
            .post(root.toString().toRequestBody("application/json".toMediaType()))
            .build()

        Http.client.newCall(req).execute().use { resp ->
            val str = resp.body?.string().orEmpty()
            if (!resp.isSuccessful) {
                if (resp.code == 401 || resp.code == 403) throw ProviderUnavailable("OpenAI auth ${resp.code}")
                throw RuntimeException("OpenAI ${resp.code}: $str")
            }
            val text = JsonParser.parseString(str).asJsonObject
                .getAsJsonArray("choices")?.firstOrNull()
                ?.asJsonObject?.getAsJsonObject("message")?.get("content")?.asString
                ?: ""
            if (text.isNotEmpty()) emit(AiChunk.Token(text))
            emit(AiChunk.Done(id, model))
        }
    }.flowOn(Dispatchers.IO)
}
