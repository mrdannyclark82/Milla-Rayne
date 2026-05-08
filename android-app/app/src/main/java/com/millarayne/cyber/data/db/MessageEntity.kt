package com.millarayne.cyber.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val role: String,            // "user" | "assistant" | "system"
    val content: String,
    val provider: String? = null, // which AI provider produced this
    val model: String? = null,
    val attachmentUri: String? = null,
    val attachmentMime: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)
