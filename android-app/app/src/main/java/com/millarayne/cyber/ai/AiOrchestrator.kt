package com.millarayne.cyber.ai

import com.millarayne.cyber.data.prefs.SettingsRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

/**
 * Iterates the user's configured fallback order. The first configured provider
 * is tried first; on `ProviderUnavailable` (auth / config / unreachable) or
 * transient error, falls through to the next.
 *
 * If a provider has begun emitting tokens and then errors mid-stream, we DO NOT
 * fall through (to avoid duplicating partial output). Use the `Done` chunk to
 * detect successful completion.
 */
class AiOrchestrator(settings: SettingsRepository) {
    private val byId: Map<String, AiProvider> = listOf(
        MillaBackendProvider(settings),
        GeminiProvider(settings),
        OpenAIProvider(settings),
        ClaudeProvider(settings)
    ).associateBy { it.id }

    private val settingsRef = settings

    fun availability(): List<Pair<AiProvider, Boolean>> =
        byId.values.map { it to it.isConfigured() }

    fun send(history: List<AiMessage>): Flow<AiChunk> = flow {
        val order = settingsRef.state.value.fallbackOrder
        val ordered = order.mapNotNull { byId[it] }.ifEmpty { byId.values.toList() }
        val configured = ordered.filter { it.isConfigured() }

        if (configured.isEmpty()) {
            emit(AiChunk.Token("⚠ No provider configured. Open SYSTEM // CONFIG and add a backend URL or API key."))
            emit(AiChunk.Done("none", "none"))
            return@flow
        }

        var lastError: Throwable? = null
        for (provider in configured) {
            var emittedAnyToken = false
            var completed = false
            try {
                provider.send(history).collect { chunk ->
                    when (chunk) {
                        is AiChunk.Token -> emittedAnyToken = true
                        is AiChunk.Done -> completed = true
                        else -> Unit
                    }
                    emit(chunk)
                }
                if (completed) return@flow
            } catch (e: ProviderUnavailable) {
                lastError = e
                if (emittedAnyToken) {
                    // Mid-stream failure — do not fall through to avoid duplicate output
                    emit(AiChunk.Token("\n\n[provider ${provider.id} failed mid-stream: ${e.message}]"))
                    emit(AiChunk.Done(provider.id, "interrupted"))
                    return@flow
                }
                // try next provider
            } catch (e: Throwable) {
                lastError = e
                if (emittedAnyToken) {
                    emit(AiChunk.Token("\n\n[provider ${provider.id} error: ${e.message}]"))
                    emit(AiChunk.Done(provider.id, "interrupted"))
                    return@flow
                }
            }
        }

        emit(AiChunk.Token("⚠ All providers failed. Last error: ${lastError?.message ?: "unknown"}"))
        emit(AiChunk.Done("none", "none"))
    }
}
