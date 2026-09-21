package com.millarayne.cyber.data.model

/**
 * In-memory attachment chosen by the user, prior to send.
 * `bytes` are kept compact; for very large media we'd switch to streaming uploads
 * (Gemini File API) — TODO marked in GeminiProvider.
 */
data class Attachment(
    val bytes: ByteArray,
    val mime: String,
    val filename: String? = null
) {
    val sizeKb: Int get() = (bytes.size / 1024).coerceAtLeast(1)

    override fun equals(other: Any?): Boolean = this === other
    override fun hashCode(): Int = System.identityHashCode(this)
}
