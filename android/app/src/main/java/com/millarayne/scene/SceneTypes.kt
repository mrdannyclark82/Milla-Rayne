/**
 * Adaptive Scene System - Android Kotlin Implementation
 * Minimal scaffold for Jetpack Compose scene rendering
 */

package com.millarayne.scene

/**
 * Time of day bucket for scene theming
 */
enum class TimeOfDay {
    DAWN, DAY, DUSK, NIGHT
}

/**
 * Application state for adaptive visuals
 */
enum class AppState {
    IDLE, LISTENING, THINKING, SPEAKING
}

/**
 * Performance mode for scene rendering
 */
enum class PerformanceMode {
    HIGH_QUALITY, BALANCED, PERFORMANCE
}

/**
 * Scene context that drives visual adaptation
 */
data class SceneContext(
    val timeOfDay: TimeOfDay = TimeOfDay.DAY,
    val appState: AppState = AppState.IDLE,
    val reducedMotion: Boolean = false,
    val performanceMode: PerformanceMode = PerformanceMode.BALANCED,
    val isBackgrounded: Boolean = false
)

/**
 * Color palette for a scene
 */
data class ScenePalette(
    val primary: Long,
    val secondary: Long,
    val accent: Long,
    val background: Long
)

/**
 * Scene theme derived from context
 */
data class SceneTheme(
    val palette: ScenePalette,
    val gradientAngle: Float = 135f,
    val animationSpeed: Float = 1f, // 0-1, 0 = no animation
    val parallaxIntensity: Float = 0f // 0-1
)
