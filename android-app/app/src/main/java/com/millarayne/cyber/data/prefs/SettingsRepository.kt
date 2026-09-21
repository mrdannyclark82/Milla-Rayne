package com.millarayne.cyber.data.prefs

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Secure settings repository:
 *  - API keys are stored in EncryptedSharedPreferences (AES256_GCM via Android KeyStore)
 *  - Non-sensitive prefs (URL, model, fallback order, theme) are mirrored as flows.
 */
class SettingsRepository(context: Context) {

    private val key: MasterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "api_credentials",
        key,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    private val _state = MutableStateFlow(loadSnapshot())
    val state: StateFlow<Settings> = _state.asStateFlow()

    private fun loadSnapshot() = Settings(
        backendUrl       = prefs.getString(K_BACKEND_URL, "") ?: "",
        geminiKey        = prefs.getString(K_GEMINI, "") ?: "",
        openAiKey        = prefs.getString(K_OPENAI, "") ?: "",
        anthropicKey     = prefs.getString(K_CLAUDE, "") ?: "",
        geminiModel      = prefs.getString(K_GEMINI_MODEL, DEFAULT_GEMINI) ?: DEFAULT_GEMINI,
        openAiModel      = prefs.getString(K_OPENAI_MODEL, DEFAULT_OPENAI) ?: DEFAULT_OPENAI,
        anthropicModel   = prefs.getString(K_CLAUDE_MODEL, DEFAULT_CLAUDE) ?: DEFAULT_CLAUDE,
        fallbackOrderCsv = prefs.getString(K_FALLBACK_ORDER, DEFAULT_ORDER) ?: DEFAULT_ORDER,
        useStreaming     = prefs.getBoolean(K_STREAM, true),
        themeName        = prefs.getString(K_THEME, "Neon Night") ?: "Neon Night"
    )

    fun update(transform: (Settings) -> Settings) {
        val next = transform(_state.value)
        prefs.edit().apply {
            putString(K_BACKEND_URL,    next.backendUrl)
            putString(K_GEMINI,         next.geminiKey)
            putString(K_OPENAI,         next.openAiKey)
            putString(K_CLAUDE,         next.anthropicKey)
            putString(K_GEMINI_MODEL,   next.geminiModel)
            putString(K_OPENAI_MODEL,   next.openAiModel)
            putString(K_CLAUDE_MODEL,   next.anthropicModel)
            putString(K_FALLBACK_ORDER, next.fallbackOrderCsv)
            putBoolean(K_STREAM,        next.useStreaming)
            putString(K_THEME,          next.themeName)
        }.apply()
        _state.value = next
    }

    companion object {
        const val DEFAULT_GEMINI = "gemini-3-flash"
        const val DEFAULT_OPENAI = "gpt-5.2"
        const val DEFAULT_CLAUDE = "claude-sonnet-4.5"
        // First-match wins; falls through on failure / 429 / 5xx / timeout
        const val DEFAULT_ORDER  = "backend,gemini,openai,claude"

        private const val K_BACKEND_URL = "backend_url"
        private const val K_GEMINI = "gemini_key"
        private const val K_OPENAI = "openai_key"
        private const val K_CLAUDE = "anthropic_key"
        private const val K_GEMINI_MODEL = "gemini_model"
        private const val K_OPENAI_MODEL = "openai_model"
        private const val K_CLAUDE_MODEL = "anthropic_model"
        private const val K_FALLBACK_ORDER = "fallback_order"
        private const val K_STREAM = "use_streaming"
        private const val K_THEME = "theme_name"
    }
}

data class Settings(
    val backendUrl: String,
    val geminiKey: String,
    val openAiKey: String,
    val anthropicKey: String,
    val geminiModel: String,
    val openAiModel: String,
    val anthropicModel: String,
    val fallbackOrderCsv: String,
    val useStreaming: Boolean,
    val themeName: String,
) {
    val fallbackOrder: List<String> get() = fallbackOrderCsv.split(",").map { it.trim() }.filter { it.isNotEmpty() }
    fun hasAnyProvider() = backendUrl.isNotBlank() || geminiKey.isNotBlank() ||
            openAiKey.isNotBlank() || anthropicKey.isNotBlank()
}
