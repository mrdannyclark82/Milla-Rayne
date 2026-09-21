package com.millarayne.cyber.ai

import com.millarayne.cyber.data.model.Attachment
import kotlinx.coroutines.flow.Flow

/** Single message in a chat history (no Room dependency to keep AI module pure). */
data class AiMessage(
    val role: String,        // "user" | "assistant" | "system"
    val content: String,
    val attachments: List<Attachment> = emptyList()
)

sealed interface AiChunk {
    data class Token(val text: String) : AiChunk
    data class Meta(val provider: String, val model: String) : AiChunk
    data class Done(val provider: String, val model: String) : AiChunk
}

/**
 * AiProvider: a streamable text generator backed by some service.
 * Implementations should throw on hard failure (bad key / 4xx other than 429)
 * so the orchestrator can fall through to the next provider.
 */
interface AiProvider {
    val id: String           // "backend" | "gemini" | "openai" | "claude"
    val displayName: String
    val supportsStreaming: Boolean
    val supportsMultimodal: Boolean

    /** Returns true if this provider is currently configured (has key/url). */
    fun isConfigured(): Boolean

    /** Send a multi-turn message; emit AiChunks. */
    fun send(history: List<AiMessage>): Flow<AiChunk>
}

/** Marker exception so orchestrator knows to skip to next provider. */
class ProviderUnavailable(reason: String, cause: Throwable? = null) : RuntimeException(reason, cause)
