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
            
            // Day of week
            "day" in lowercaseMessage && ("what" in lowercaseMessage || "today" in lowercaseMessage) -> 
                "Today is ${getCurrentDayOfWeek()}."
            
            // Identity questions
            "who are you" in lowercaseMessage || "what are you" in lowercaseMessage ->
                "I'm Milla Rayne, your AI companion. I'm currently running in offline mode, so I have limited capabilities, but I can still help with basic tasks!"
            
            "your name" in lowercaseMessage ->
                "My name is Milla Rayne. Nice to meet you!"
            
            "how are you" in lowercaseMessage || "how do you do" in lowercaseMessage ->
                listOf(
                    "I'm doing well, thanks for asking! Running smoothly in offline mode. How are you?",
                    "I'm great! Even in offline mode, I'm happy to chat with you. How can I help?",
                    "I'm functioning perfectly! Though I'd love to connect to my server for more capabilities. How are you doing?"
                ).random()
            
            // Help/capabilities
            "help" in lowercaseMessage || "can you do" in lowercaseMessage || "what can you" in lowercaseMessage ->
                """In offline mode, I can:
                    |• Answer basic questions
                    |• Help with device controls (volume, WiFi)
                    |• Provide the time and date
                    |• Have simple conversations
                    |• Control media playback
                    |
                    |For more advanced features, I'll need a connection to my server.""".trimMargin()
            
            // Device controls - Volume
            "volume" in lowercaseMessage && ("up" in lowercaseMessage || "increase" in lowercaseMessage || "raise" in lowercaseMessage) ->
                "I'll increase the volume for you. 🔊"
            
            "volume" in lowercaseMessage && ("down" in lowercaseMessage || "decrease" in lowercaseMessage || "lower" in lowercaseMessage) ->
                "I'll decrease the volume for you. 🔉"
            
            "mute" in lowercaseMessage || "silence" in lowercaseMessage ->
                "I'll mute the volume for you. 🔇"
            
            // Media controls
            "play" in lowercaseMessage && !("role" in lowercaseMessage) ->
                "Starting playback for you. ▶️"
            
            "pause" in lowercaseMessage || "stop" in lowercaseMessage ->
                "Pausing playback. ⏸️"
            
            // Jokes and fun
            "joke" in lowercaseMessage || "funny" in lowercaseMessage ->
                listOf(
                    "Why don't scientists trust atoms? Because they make up everything! 😄",
                    "Why did the smartphone go to therapy? It lost its contacts! 📱",
                    "What do you call a bear with no teeth? A gummy bear! 🐻",
                    "Why don't eggs tell jokes? They'd crack each other up! 🥚"
                ).random()
            
            // Math calculations (basic)
            containsMathOperation(lowercaseMessage) -> calculateMath(lowercaseMessage)
            
            // Motivational
            "motivate" in lowercaseMessage || "inspire" in lowercaseMessage || "motivation" in lowercaseMessage ->
                listOf(
                    "You're capable of amazing things! Keep pushing forward! 💪",
                    "Every small step counts. You're making progress! 🌟",
                    "Believe in yourself. You've got this! ✨",
                    "Your potential is limitless. Keep going! 🚀"
                ).random()
            
            // Goodbyes
            isGoodbye(lowercaseMessage) ->
                "Goodbye! It was nice chatting with you. Take care! 👋"
            
            // Thank you
            "thank" in lowercaseMessage ->
                listOf(
                    "You're welcome! Happy to help! 😊",
                    "My pleasure! Feel free to ask anything else! 💜",
                    "Anytime! I'm here for you! 🌟"
                ).random()
            
            // Weather (when offline)
            "weather" in lowercaseMessage ->
                "I can't check the weather in offline mode. When connected to my server, I can provide detailed weather information for you."
            
            // Complex queries
            "how to" in lowercaseMessage || "tutorial" in lowercaseMessage ->
                "I need a server connection to help with detailed tutorials or how-to guides. In offline mode, my knowledge is limited."
            
            // Questions about offline mode
            "offline" in lowercaseMessage || "server" in lowercaseMessage ->
                "I'm currently running in offline mode, which means I can only handle basic tasks locally on your device. For advanced AI features, I need to connect to my server."
            
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
     * Get current day of week
     */
    private fun getCurrentDayOfWeek(): String {
        val format = SimpleDateFormat("EEEE", Locale.getDefault())
        return format.format(Date())
    }
    
    /**
     * Check if message contains a math operation
     */
    private fun containsMathOperation(message: String): Boolean {
        val mathPatterns = listOf(
            Regex("""\d+\s*[\+\-\*\/]\s*\d+"""),
            Regex("""what is \d+"""),
            Regex("""calculate""")
        )
        return mathPatterns.any { it.containsMatchIn(message) }
    }
    
    /**
     * Calculate basic math operations
     */
    private fun calculateMath(message: String): String {
        return try {
            // Extract numbers and operator
            val mathRegex = Regex("""(\d+)\s*([\+\-\*\/])\s*(\d+)""")
            val match = mathRegex.find(message)
            
            if (match != null) {
                val num1 = match.groupValues[1].toDouble()
                val operator = match.groupValues[2]
                val num2 = match.groupValues[3].toDouble()
                
                val result = when (operator) {
                    "+" -> num1 + num2
                    "-" -> num1 - num2
                    "*" -> num1 * num2
                    "/" -> if (num2 != 0.0) num1 / num2 else return "I can't divide by zero! 😅"
                    else -> return "I couldn't understand that math operation."
                }
                
                // Format result - show decimal if not a whole number
                val formattedResult = if (result % 1.0 == 0.0) {
                    result.toInt().toString()
                } else {
                    String.format("%.2f", result)
                }
                
                "The answer is $formattedResult."
            } else {
                "I can do basic math like 5 + 3 or 10 * 2. Try asking me a simple calculation!"
            }
        } catch (e: Exception) {
            "I had trouble with that calculation. Try a simpler math problem like '5 + 3'."
        }
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
