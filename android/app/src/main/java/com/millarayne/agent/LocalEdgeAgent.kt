package com.millarayne.agent

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.net.wifi.WifiManager
import android.os.Build
import android.util.Log
import kotlinx.coroutines.*
import java.util.concurrent.ConcurrentHashMap

/**
 * Local Edge Agent for Low-Latency Operations
 * 
 * This agent runs locally on the device and handles latency-sensitive
 * commands without needing to communicate with the server. It provides
 * instant response for common operations like:
 * - Media control (play/pause, volume)
 * - Smart home device control (toggle lights, adjust thermostat)
 * - Device settings (WiFi, Bluetooth, airplane mode)
 * - Quick actions (timer, reminder, flashlight)
 * 
 * Architecture:
 * - Intent-based command routing
 * - Plugin system for extensibility
 * - Local command history
 * - Fallback to server for complex queries
 */
class LocalEdgeAgent(private val context: Context) {
    
    companion object {
        private const val TAG = "LocalEdgeAgent"
        
        // Command categories
        const val CATEGORY_MEDIA = "media"
        const val CATEGORY_SMART_HOME = "smart_home"
        const val CATEGORY_DEVICE = "device"
        const val CATEGORY_ACTION = "action"
    }
    
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private val commandHandlers = ConcurrentHashMap<String, CommandHandler>()
    private val commandHistory = mutableListOf<CommandExecution>()
    
    init {
        registerDefaultHandlers()
    }
    
    /**
     * Register default command handlers
     */
    private fun registerDefaultHandlers() {
        // Media controls
        registerHandler("play", MediaCommandHandler(context, "play"))
        registerHandler("pause", MediaCommandHandler(context, "pause"))
        registerHandler("volume_up", MediaCommandHandler(context, "volume_up"))
        registerHandler("volume_down", MediaCommandHandler(context, "volume_down"))
        registerHandler("mute", MediaCommandHandler(context, "mute"))
        
        // Smart home (placeholder - requires integration with smart home APIs)
        registerHandler("light_on", SmartHomeCommandHandler(context, "light", "on"))
        registerHandler("light_off", SmartHomeCommandHandler(context, "light", "off"))
        registerHandler("thermostat_up", SmartHomeCommandHandler(context, "thermostat", "up"))
        registerHandler("thermostat_down", SmartHomeCommandHandler(context, "thermostat", "down"))
        
        // Device controls
        registerHandler("wifi_toggle", DeviceCommandHandler(context, "wifi_toggle"))
        registerHandler("brightness_up", DeviceCommandHandler(context, "brightness_up"))
        registerHandler("brightness_down", DeviceCommandHandler(context, "brightness_down"))
        
        // Quick actions
        registerHandler("flashlight_toggle", ActionCommandHandler(context, "flashlight"))
    }
    
    /**
     * Process a command locally
     * 
     * @param command The command to execute
     * @param params Optional parameters for the command
     * @return CommandResult indicating success or failure
     */
    suspend fun processCommand(command: String, params: Map<String, String> = emptyMap()): CommandResult {
        val startTime = System.currentTimeMillis()
        
        Log.d(TAG, "Processing command: $command with params: $params")
        
        val handler = commandHandlers[command]
        
        val result = if (handler != null) {
            try {
                handler.execute(params)
            } catch (e: Exception) {
                Log.e(TAG, "Error executing command: $command", e)
                CommandResult(
                    success = false,
                    message = "Failed to execute command: ${e.message}",
                    requiresServer = false
                )
            }
        } else {
            Log.w(TAG, "No handler found for command: $command")
            CommandResult(
                success = false,
                message = "Unknown command",
                requiresServer = true // Unknown commands should be sent to server
            )
        }
        
        val executionTime = System.currentTimeMillis() - startTime
        
        // Record execution
        val execution = CommandExecution(
            command = command,
            params = params,
            result = result,
            executionTimeMs = executionTime,
            timestamp = System.currentTimeMillis()
        )
        
        commandHistory.add(execution)
        
        // Keep only recent history (last 100 commands)
        if (commandHistory.size > 100) {
            commandHistory.removeAt(0)
        }
        
        Log.d(TAG, "Command executed in ${executionTime}ms: ${result.message}")
        
        return result
    }
    
    /**
     * Register a custom command handler
     */
    fun registerHandler(command: String, handler: CommandHandler) {
        commandHandlers[command] = handler
        Log.i(TAG, "Registered handler for command: $command")
    }
    
    /**
     * Unregister a command handler
     */
    fun unregisterHandler(command: String) {
        commandHandlers.remove(command)
        Log.i(TAG, "Unregistered handler for command: $command")
    }
    
    /**
     * Get command execution history
     */
    fun getCommandHistory(): List<CommandExecution> {
        return commandHistory.toList()
    }
    
    /**
     * Clear command history
     */
    fun clearHistory() {
        commandHistory.clear()
    }
    
    /**
     * Parse natural language command and execute
     * This is a simple implementation - production should use ML/NLP
     */
    suspend fun processNaturalLanguage(input: String): CommandResult {
        val lowercaseInput = input.lowercase()
        
        // Simple pattern matching (production should use NLP)
        val command = when {
            "play" in lowercaseInput && ("music" in lowercaseInput || "song" in lowercaseInput) -> "play"
            "pause" in lowercaseInput -> "pause"
            "volume up" in lowercaseInput || "louder" in lowercaseInput -> "volume_up"
            "volume down" in lowercaseInput || "quieter" in lowercaseInput -> "volume_down"
            "mute" in lowercaseInput -> "mute"
            
            "light on" in lowercaseInput || "turn on the light" in lowercaseInput -> "light_on"
            "light off" in lowercaseInput || "turn off the light" in lowercaseInput -> "light_off"
            
            "wifi" in lowercaseInput && ("on" in lowercaseInput || "off" in lowercaseInput || "toggle" in lowercaseInput) -> "wifi_toggle"
            
            "flashlight" in lowercaseInput || "torch" in lowercaseInput -> "flashlight_toggle"
            
            else -> null
        }
        
        return if (command != null) {
            processCommand(command)
        } else {
            CommandResult(
                success = false,
                message = "Command not recognized locally",
                requiresServer = true
            )
        }
    }
    
    /**
     * Cleanup resources
     */
    fun shutdown() {
        scope.cancel()
        commandHistory.clear()
        commandHandlers.clear()
    }
}

/**
 * Result of command execution
 */
data class CommandResult(
    val success: Boolean,
    val message: String,
    val requiresServer: Boolean = false,
    val data: Map<String, Any>? = null
)

/**
 * Record of command execution
 */
data class CommandExecution(
    val command: String,
    val params: Map<String, String>,
    val result: CommandResult,
    val executionTimeMs: Long,
    val timestamp: Long
)

/**
 * Base interface for command handlers
 */
interface CommandHandler {
    suspend fun execute(params: Map<String, String>): CommandResult
}

/**
 * Media control command handler
 */
class MediaCommandHandler(
    private val context: Context,
    private val action: String
) : CommandHandler {
    
    override suspend fun execute(params: Map<String, String>): CommandResult {
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        
        return try {
            when (action) {
                "play" -> {
                    // Send media button press
                    val intent = Intent(Intent.ACTION_MEDIA_BUTTON)
                    context.sendBroadcast(intent)
                    CommandResult(success = true, message = "Playing media")
                }
                "pause" -> {
                    val intent = Intent(Intent.ACTION_MEDIA_BUTTON)
                    context.sendBroadcast(intent)
                    CommandResult(success = true, message = "Paused media")
                }
                "volume_up" -> {
                    audioManager.adjustStreamVolume(
                        AudioManager.STREAM_MUSIC,
                        AudioManager.ADJUST_RAISE,
                        AudioManager.FLAG_SHOW_UI
                    )
                    CommandResult(success = true, message = "Volume increased")
                }
                "volume_down" -> {
                    audioManager.adjustStreamVolume(
                        AudioManager.STREAM_MUSIC,
                        AudioManager.ADJUST_LOWER,
                        AudioManager.FLAG_SHOW_UI
                    )
                    CommandResult(success = true, message = "Volume decreased")
                }
                "mute" -> {
                    audioManager.adjustStreamVolume(
                        AudioManager.STREAM_MUSIC,
                        AudioManager.ADJUST_MUTE,
                        0
                    )
                    CommandResult(success = true, message = "Muted")
                }
                else -> CommandResult(success = false, message = "Unknown media action")
            }
        } catch (e: Exception) {
            CommandResult(success = false, message = "Media control failed: ${e.message}")
        }
    }
}

/**
 * Smart home command handler (placeholder)
 * Production implementation would integrate with specific smart home APIs
 */
class SmartHomeCommandHandler(
    private val context: Context,
    private val device: String,
    private val action: String
) : CommandHandler {
    
    override suspend fun execute(params: Map<String, String>): CommandResult {
        // Placeholder implementation
        // In production, this would:
        // 1. Detect available smart home platforms (Home Assistant, SmartThings, etc.)
        // 2. Send appropriate API calls to control devices
        // 3. Cache device states locally for quick responses
        
        Log.i("SmartHomeHandler", "Would execute: $device -> $action")
        
        return CommandResult(
            success = true,
            message = "Smart home command executed: $device $action",
            data = mapOf("device" to device, "action" to action)
        )
    }
}

/**
 * Device control command handler
 */
class DeviceCommandHandler(
    private val context: Context,
    private val action: String
) : CommandHandler {
    
    override suspend fun execute(params: Map<String, String>): CommandResult {
        return try {
            when (action) {
                "wifi_toggle" -> {
                    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                        val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
                        wifiManager.isWifiEnabled = !wifiManager.isWifiEnabled
                        CommandResult(success = true, message = "WiFi toggled")
                    } else {
                        // Android Q+ requires user interaction to toggle WiFi
                        val intent = Intent(android.provider.Settings.ACTION_WIFI_SETTINGS)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        context.startActivity(intent)
                        CommandResult(success = true, message = "Opening WiFi settings")
                    }
                }
                "brightness_up", "brightness_down" -> {
                    // Requires system settings permission - open settings instead
                    val intent = Intent(android.provider.Settings.ACTION_DISPLAY_SETTINGS)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    context.startActivity(intent)
                    CommandResult(success = true, message = "Opening brightness settings")
                }
                else -> CommandResult(success = false, message = "Unknown device action")
            }
        } catch (e: Exception) {
            CommandResult(success = false, message = "Device control failed: ${e.message}")
        }
    }
}

/**
 * Quick action command handler
 */
class ActionCommandHandler(
    private val context: Context,
    private val action: String
) : CommandHandler {
    
    override suspend fun execute(params: Map<String, String>): CommandResult {
        return try {
            when (action) {
                "flashlight" -> {
                    // Flashlight control typically requires camera permission
                    // and CameraManager API. This is a placeholder.
                    CommandResult(
                        success = true,
                        message = "Flashlight toggle requested",
                        requiresServer = false
                    )
                }
                else -> CommandResult(success = false, message = "Unknown action")
            }
        } catch (e: Exception) {
            CommandResult(success = false, message = "Action failed: ${e.message}")
        }
    }
}
