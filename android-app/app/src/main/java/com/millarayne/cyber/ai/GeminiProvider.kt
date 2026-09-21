package com.millarayne.cyber.ai

import android.util.Base64
import com.google.gson.Gson
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
 * Direct REST integration with Google Gemini.
 *
 * Endpoint:  https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent
 * Auth:      x-goog-api-key header
 * Streaming: emits SSE-style "data: {...}" JSON chunks. We parse out
 *            candidates[0].content.parts[*].text.
 *
 * Multimodal: images/audio/video/etc inline as base64 in inline_data.data
 * (max ~20 MB inline; for larger files use the Gemini File API — TODO).
 */
class GeminiProvider(private val settings: SettingsRepository) : AiProvider {
    override val id: String = "gemini"
    override val displayName: String = "Gemini (Google)"
    override val supportsStreaming: Boolean = true
    override val supportsMultimodal: Boolean = true

    override fun isConfigured(): Boolean = settings.state.value.geminiKey.isNotBlank()

    override fun send(history: List<AiMessage>): Flow<AiChunk> = flow {
        val s = settings.state.value
        if (s.geminiKey.isBlank()) throw ProviderUnavailable("Gemini key missing")

        // Try primary model, then a configured fallback model on hard failure.
        val candidates = listOf(s.geminiModel, "gemini-3-pro", "gemini-2.5-pro", "gemini-2.5-flash").distinct()
        var lastErr: Throwable? = null
        for (model in candidates) {
            try {
                emit(AiChunk.Meta(id, model))
                streamModel(model, history, s.geminiKey, s.useStreaming).collect { tok -> emit(tok) }
                emit(AiChunk.Done(id, model))
                return@flow
            } catch (e: Throwable) {
                lastErr = e
                if (!isRetriableModelError(e)) throw e
                // try next model
            }
        }
        throw ProviderUnavailable("Gemini exhausted models: ${lastErr?.message}", lastErr)
    }.flowOn(Dispatchers.IO)

    private fun streamModel(
        model: String,
        history: List<AiMessage>,
        apiKey: String,
        stream: Boolean
    ): Flow<AiChunk> = flow {
        val body = buildBody(history)
        val verb = if (stream) "streamGenerateContent?alt=sse" else "generateContent"
        val url = "https://generativelanguage.googleapis.com/v1beta/models/$model:$verb"

        val req = Request.Builder()
            .url(url)
            .addHeader("x-goog-api-key", apiKey)
            .addHeader("Content-Type", "application/json")
            .post(body.toString().toRequestBody("application/json".toMediaType()))
            .build()

        Http.client.newCall(req).execute().use { resp ->
            if (!resp.isSuccessful) {
                val errStr = resp.body?.string().orEmpty()
                if (resp.code == 401 || resp.code == 403) throw ProviderUnavailable("Gemini auth: ${resp.code} $errStr")
                throw RuntimeException("Gemini ${resp.code}: $errStr")
            }
            val source = resp.body?.source() ?: throw RuntimeException("Gemini empty body")
            if (stream) {
                while (!source.exhausted()) {
                    val line = source.readUtf8Line() ?: break
                    if (line.startsWith("data: ")) {
                        val jsonStr = line.removePrefix("data: ").trim()
                        if (jsonStr.isEmpty() || jsonStr == "[DONE]") continue
                        runCatching { parseTextDeltas(jsonStr) }.getOrNull()?.forEach { emit(AiChunk.Token(it)) }
                    }
                }
            } else {
                val full = source.readUtf8()
                parseTextDeltas(full).forEach { emit(AiChunk.Token(it)) }
            }
        }
    }

    private fun isRetriableModelError(e: Throwable): Boolean {
        val msg = e.message ?: return false
        return "404" in msg || "400" in msg || "model" in msg.lowercase()
    }

    private fun buildBody(history: List<AiMessage>): JsonObject {
        val root = JsonObject()
        val contents = com.google.gson.JsonArray()
        for (m in history) {
            if (m.role == "system") continue
            val obj = JsonObject()
            obj.addProperty("role", if (m.role == "assistant") "model" else "user")
            val parts = com.google.gson.JsonArray()
            if (m.content.isNotBlank()) {
                val p = JsonObject(); p.addProperty("text", m.content); parts.add(p)
            }
            for (att in m.attachments) {
                val inline = JsonObject()
                inline.addProperty("mimeType", att.mime)
                inline.addProperty("data", Base64.encodeToString(att.bytes, Base64.NO_WRAP))
                val p = JsonObject(); p.add("inline_data", inline); parts.add(p)
            }
            obj.add("parts", parts)
            contents.add(obj)
        }
        // Inject system prompt if provided
        history.firstOrNull { it.role == "system" }?.let { sys ->
            val sysObj = JsonObject()
            val parts = com.google.gson.JsonArray()
            val p = JsonObject(); p.addProperty("text", sys.content); parts.add(p)
            sysObj.add("parts", parts)
            root.add("systemInstruction", sysObj)
        }
        root.add("contents", contents)

        val gen = JsonObject()
        gen.addProperty("temperature", 0.8)
        gen.addProperty("maxOutputTokens", 2048)
        root.add("generationConfig", gen)
        return root
    }

    private fun parseTextDeltas(json: String): List<String> {
        val out = ArrayList<String>(2)
        val root = JsonParser.parseString(json)
        if (!root.isJsonObject) return out
        val cands = root.asJsonObject.getAsJsonArray("candidates") ?: return out
        for (c in cands) {
            val parts = c.asJsonObject.getAsJsonObject("content")?.getAsJsonArray("parts") ?: continue
            for (p in parts) {
                val t = p.asJsonObject.get("text")
                if (t != null && !t.isJsonNull) out.add(t.asString)
            }
        }
        return out
    }
}
