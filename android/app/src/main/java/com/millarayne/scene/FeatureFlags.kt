/**
 * Feature flag configuration for Android
 */

package com.millarayne.scene

import android.content.Context
import android.content.SharedPreferences

/**
 * Feature flag manager for adaptive scenes
 */
class AdaptiveSceneFeatureFlags(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(
        "adaptive_scene_flags",
        Context.MODE_PRIVATE
    )
    
    companion object {
        private const val KEY_ENABLED = "adaptive_scenes_enabled"
        private const val KEY_PERFORMANCE_MODE = "adaptive_scenes_performance_mode"
    }
    
    /**
     * Check if adaptive scenes are enabled
     * Default: false (disabled)
     */
    fun isEnabled(): Boolean {
        return prefs.getBoolean(KEY_ENABLED, false)
    }
    
    /**
     * Set adaptive scenes enabled state (demo/development only)
     */
    fun setEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_ENABLED, enabled).apply()
    }
    
    /**
     * Get performance mode
     * Default: BALANCED
     */
    fun getPerformanceMode(): PerformanceMode {
        val modeStr = prefs.getString(KEY_PERFORMANCE_MODE, "balanced")
        return when (modeStr) {
            "high-quality" -> PerformanceMode.HIGH_QUALITY
            "performance" -> PerformanceMode.PERFORMANCE
            else -> PerformanceMode.BALANCED
        }
    }
    
    /**
     * Set performance mode (demo/development only)
     */
    fun setPerformanceMode(mode: PerformanceMode) {
        val modeStr = when (mode) {
            PerformanceMode.HIGH_QUALITY -> "high-quality"
            PerformanceMode.PERFORMANCE -> "performance"
            else -> "balanced"
        }
        prefs.edit().putString(KEY_PERFORMANCE_MODE, modeStr).apply()
    }
}
