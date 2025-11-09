package com.millarayne.data

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Message entity for Room database
 */
@Entity(tableName = "messages")
data class Message(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val content: String,
    val role: String, // "user" or "assistant"
    val timestamp: Long = System.currentTimeMillis()
)

/**
 * Scene context data
 */
data class SceneContext(
    val location: String,
    val mood: String,
    val timeOfDay: String
)

/**
 * API request for sending a message
 */
data class ChatRequest(
    val message: String
)

/**
 * API response from chat endpoint
 */
data class ChatResponse(
    val response: String,
    val sceneContext: SceneContext? = null
)
