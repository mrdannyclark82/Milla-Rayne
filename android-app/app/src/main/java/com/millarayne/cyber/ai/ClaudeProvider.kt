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
 * Direct REST integration with Anthropic Claude Messages API.
 * Multimodal: images via base64 source on image content blocks.
 */
class ClaudeProvider(private val settings: SettingsRepository) : AiProvider {
    override val id: String = "claude"
    override val displayName: String = "Claude (Anthropic)"
    override val supportsStreaming: Boolean = false
    override val supportsMultimodal: Boolean = true

    override fun isConfigured(): Boolean = settings.state.value.anthropicKey.isNotBlank()

    override fun send(history: List<AiMessage>): Flow<AiChunk> = flow {
        val s = settings.state.value
        if (s.anthropicKey.isBlank()) throw ProviderUnavailable("Claude key missing")
        val model = s.anthropicModel
        emit(AiChunk.Meta(id, model))

        val root = JsonObject()
        root.addProperty("model", model)
        root.addProperty("max_tokens", 2048)
        history.firstOrNull { it.role == "system" }?.let { root.addProperty("system", it.content) }

        val msgs = JsonArray()
        for (m in history) {
            if (m.role == "system") continue
            val msg = JsonObject()
            msg.addProperty("role", if (m.role == "assistant") "assistant" else "user")
            val content = JsonArray()
            if (m.content.isNotBlank()) {
                val tp = JsonObject(); tp.addProperty("type", "text"); tp.addProperty("text", m.content); content.add(tp)
            }
            for (att in m.attachments.filter { it.mime.startsWith("image/") }) {
                val ip = JsonObject(); ip.addProperty("type", "image")
                val src = JsonObject()
                src.addProperty("type", "base64")
                src.addProperty("media_type", att.mime)
                src.addProperty("data", Base64.encodeToString(att.bytes, Base64.NO_WRAP))
                ip.add("source", src)
                content.add(ip)
            }
            msg.add("content", content)
            msgs.add(msg)
        }
        root.add("messages", msgs)

        val req = Request.Builder()
            .url("https://api.anthropic.com/v1/messages")
            .addHeader("x-api-key", s.anthropicKey)
            .addHeader("anthropic-version", "2023-06-01")
            .addHeader("Content-Type", "application/json")
            .post(root.toString().toRequestBody("application/json".toMediaType()))
            .build()

        Http.client.newCall(req).execute().use { resp ->
            val str = resp.body?.string().orEmpty()
            if (!resp.isSuccessful) {
                if (resp.code == 401 || resp.code == 403) throw ProviderUnavailable("Claude auth ${resp.code}")
                throw RuntimeException("Claude ${resp.code}: $str")
            }
            val arr = JsonParser.parseString(str).asJsonObject.getAsJsonArray("content") ?: JsonArray()
            for (c in arr) {
                val obj = c.asJsonObject
                if (obj.get("type")?.asString == "text") {
                    val t = obj.get("text")?.asString.orEmpty()
                    if (t.isNotEmpty()) emit(AiChunk.Token(t))
                }
            }
            emit(AiChunk.Done(id, model))
        }
    }.flowOn(Dispatchers.IO)
}
