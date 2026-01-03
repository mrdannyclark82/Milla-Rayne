package com.millarayne.agent

import android.content.Context
import android.util.Log
import java.text.SimpleDateFormat
import java.util.*

/**
 * Offline Response Generator
 * 
 * Provides intelligent responses when server is unavailable.
 * Uses pattern matching and local knowledge to respond to common queries.
 */
class OfflineResponseGenerator(private val context: Context) {
    
    companion object {
        private const val TAG = "OfflineResponseGen"
    }
    
    private val localEdgeAgent = LocalEdgeAgent(context)
    
    /**
     * Generate a response for the given user message
     * Returns a response and whether it was handled locally
     */
    suspend fun generateResponse(userMessage: String): Pair<String, Boolean> {
        val lowercaseMessage = userMessage.lowercase().trim()
        
        // First, try to handle as an edge command
        val edgeResult = localEdgeAgent.processNaturalLanguage(userMessage)
        if (edgeResult.success && !edgeResult.requiresServer) {
            return Pair(edgeResult.message, true)
        }
        
        // Pattern-based response matching
        val response = when {
            // Greetings
            isGreeting(lowercaseMessage) -> generateGreeting()
            
            // Time queries
            "time" in lowercaseMessage && ("what" in lowercaseMessage || "current" in lowercaseMessage) -> 
                "The current time is ${getCurrentTime()}."
            
            "date" in lowercaseMessage && ("what" in lowercaseMessage || "today" in lowercaseMessage) -> 
                "Today is ${getCurrentDate()}."
            
            // Identity questions
            "who are you" in lowercaseMessage || "what are you" in lowercaseMessage ->
                "I'm Milla Rayne, your AI companion. I'm currently running in offline mode, so I have limited capabilities, but I can still help with basic tasks!"
            
            "your name" in lowercaseMessage ->
                "My name is Milla Rayne. Nice to meet you!"
            
            // Help/capabilities
            "help" in lowercaseMessage || "can you do" in lowercaseMessage ->
                "In offline mode, I can:\n• Answer basic questions\n• Help with device controls (volume, WiFi)\n• Provide the time and date\n• Have simple conversations\n\nFor more advanced features, I'll need a connection to my server."
            
            // Device controls
            "volume" in lowercaseMessage && ("up" in lowercaseMessage || "increase" in lowercaseMessage) ->
                "I'll increase the volume for you."
            
            "volume" in lowercaseMessage && ("down" in lowercaseMessage || "decrease" in lowercaseMessage) ->
                "I'll decrease the volume for you."
            
            // Goodbyes
            isGoodbye(lowercaseMessage) ->
                "Goodbye! It was nice chatting with you. 👋"
            
            // Thank you
            "thank" in lowercaseMessage ->
                "You're welcome! Happy to help! 😊"
            
            // Weather (when offline)
            "weather" in lowercaseMessage ->
                "I can't check the weather in offline mode. When connected to my server, I can provide detailed weather information for you."
            
            // Complex queries
            "how to" in lowercaseMessage || "tutorial" in lowercaseMessage ->
                "I need a server connection to help with detailed tutorials or how-to guides. In offline mode, my knowledge is limited."
            
            // Default fallback
            else -> generateFallbackResponse(lowercaseMessage)
        }
        
        return Pair(response, true)
    }
    
    /**
     * Check if message is a greeting
     */
    private fun isGreeting(message: String): Boolean {
        val greetings = listOf("hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening")
        return greetings.any { it in message }
    }
    
    /**
     * Check if message is a goodbye
     */
    private fun isGoodbye(message: String): Boolean {
        val goodbyes = listOf("bye", "goodbye", "see you", "farewell", "later")
        return goodbyes.any { it in message }
    }
    
    /**
     * Generate a contextual greeting
     */
    private fun generateGreeting(): String {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val timeOfDay = when {
            hour < 12 -> "Good morning"
            hour < 18 -> "Good afternoon"
            else -> "Good evening"
        }
        
        val greetings = listOf(
            "$timeOfDay! I'm Milla Rayne. How can I help you today?",
            "$timeOfDay! Great to see you! What's on your mind?",
            "Hello! $timeOfDay to you! I'm here to help.",
            "Hi there! $timeOfDay! What can I do for you?"
        )
        
        return greetings.random()
    }
    
    /**
     * Get current time formatted
     */
    private fun getCurrentTime(): String {
        val format = SimpleDateFormat("h:mm a", Locale.getDefault())
        return format.format(Date())
    }
    
    /**
     * Get current date formatted
     */
    private fun getCurrentDate(): String {
        val format = SimpleDateFormat("EEEE, MMMM d, yyyy", Locale.getDefault())
        return format.format(Date())
    }
    
    /**
     * Generate a fallback response for unrecognized queries
     */
    private fun generateFallbackResponse(message: String): String {
        // Try to extract key words for a more intelligent response
        val isQuestion = message.contains("?") || 
                        message.startsWith("what") || 
                        message.startsWith("where") || 
                        message.startsWith("when") || 
                        message.startsWith("why") || 
                        message.startsWith("how") ||
                        message.startsWith("who") ||
                        message.startsWith("can") ||
                        message.startsWith("will") ||
                        message.startsWith("would")
        
        return if (isQuestion) {
            listOf(
                "I'm running in offline mode right now, so my knowledge is limited. For that question, I'd need to connect to my server for a better answer.",
                "That's an interesting question! Unfortunately, I need a server connection to give you a detailed answer. In offline mode, I can only help with basic tasks.",
                "I'd love to help with that, but I need access to my full capabilities on the server. Right now I'm in offline mode with limited knowledge."
            ).random()
        } else {
            listOf(
                "I hear you! In offline mode, my responses are pretty simple. For more detailed conversations, I'll need a connection to my server.",
                "Thanks for sharing that! I'm currently in offline mode, so I can't provide the same depth of conversation as when connected to my server.",
                "I understand. I'm operating in offline mode right now, which limits my conversational abilities. But I'm still here for basic tasks!"
            ).random()
        }
    }
    
    /**
     * Cleanup resources
     */
    fun shutdown() {
        localEdgeAgent.shutdown()
    }
}
