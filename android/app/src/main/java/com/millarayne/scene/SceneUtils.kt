/**
 * Scene utilities for Android
 * Provides scene generation and system detection
 */

package com.millarayne.scene

import android.content.Context
import android.content.res.Configuration
import android.os.PowerManager
import android.provider.Settings
import androidx.compose.ui.graphics.Color
import java.util.Calendar

/**
 * Get current time of day bucket
 */
fun getCurrentTimeOfDay(): TimeOfDay {
    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    
    return when {
        hour in 5..7 -> TimeOfDay.DAWN
        hour in 8..16 -> TimeOfDay.DAY
        hour in 17..19 -> TimeOfDay.DUSK
        else -> TimeOfDay.NIGHT
    }
}

/**
 * Get color palette for time of day
 */
fun getPaletteForTimeOfDay(timeOfDay: TimeOfDay): ScenePalette {
    return when (timeOfDay) {
        TimeOfDay.DAWN -> ScenePalette(
            primary = 0xFFff9a8b,
            secondary = 0xFFffc3a0,
            accent = 0xFFffafbd,
            background = 0xFF1a1a2e
        )
        TimeOfDay.DAY -> ScenePalette(
            primary = 0xFF667eea,
            secondary = 0xFF764ba2,
            accent = 0xFFf093fb,
            background = 0xFF0f0f1e
        )
        TimeOfDay.DUSK -> ScenePalette(
            primary = 0xFFfa709a,
            secondary = 0xFFfee140,
            accent = 0xFFff8c00,
            background = 0xFF1e1e2e
        )
        TimeOfDay.NIGHT -> ScenePalette(
            primary = 0xFF4c669f,
            secondary = 0xFF3b5998,
            accent = 0xFF192f6a,
            background = 0xFF0a0a15
        )
    }
}

/**
 * Get accent color for app state
 */
fun getAccentForAppState(appState: AppState): Long {
    return when (appState) {
        AppState.IDLE -> 0xFF667eea
        AppState.LISTENING -> 0xFF10b981 // Green
        AppState.THINKING -> 0xFFf59e0b  // Amber
        AppState.SPEAKING -> 0xFF3b82f6  // Blue
    }
}

/**
 * Check if reduced motion is preferred
 * Checks both system animator duration scale and accessibility settings
 */
fun prefersReducedMotion(context: Context): Boolean {
    try {
        // Check animator duration scale (0 = animations disabled)
        val animatorScale = Settings.Global.getFloat(
            context.contentResolver,
            Settings.Global.ANIMATOR_DURATION_SCALE,
            1.0f
        )
        
        if (animatorScale == 0f) return true
        
        // Could also check transition animation scale
        val transitionScale = Settings.Global.getFloat(
            context.contentResolver,
            Settings.Global.TRANSITION_ANIMATION_SCALE,
            1.0f
        )
        
        return transitionScale == 0f
    } catch (e: Exception) {
        return false // Default to animations enabled if we can't check
    }
}

/**
 * Check if device is in power saver mode
 */
fun isInPowerSaverMode(context: Context): Boolean {
    return try {
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        powerManager.isPowerSaveMode
    } catch (e: Exception) {
        false
    }
}

/**
 * Generate complete scene theme from context
 */
fun generateSceneTheme(
    timeOfDay: TimeOfDay,
    appState: AppState,
    reducedMotion: Boolean,
    performanceMode: PerformanceMode
): SceneTheme {
    val palette = getPaletteForTimeOfDay(timeOfDay).copy(
        accent = getAccentForAppState(appState)
    )
    
    // Animation speed based on reduced motion and performance mode
    val animationSpeed = when {
        reducedMotion -> 0f
        performanceMode == PerformanceMode.PERFORMANCE -> 0.5f
        performanceMode == PerformanceMode.HIGH_QUALITY -> 1f
        else -> 0.75f // BALANCED
    }
    
    // Parallax intensity based on performance mode
    val parallaxIntensity = when {
        reducedMotion -> 0f
        performanceMode == PerformanceMode.HIGH_QUALITY -> 1f
        performanceMode == PerformanceMode.BALANCED -> 0.5f
        else -> 0f // PERFORMANCE
    }
    
    return SceneTheme(
        palette = palette,
        gradientAngle = 135f,
        animationSpeed = animationSpeed,
        parallaxIntensity = parallaxIntensity
    )
}
