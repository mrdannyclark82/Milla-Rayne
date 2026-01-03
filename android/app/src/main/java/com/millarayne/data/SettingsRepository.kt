package com.millarayne.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

/**
 * User preferences and settings
 */
class SettingsRepository(private val context: Context) {
    
    companion object {
        private val SERVER_URL_KEY = stringPreferencesKey("server_url")
        private val OFFLINE_MODE_ENABLED_KEY = booleanPreferencesKey("offline_mode_enabled")
        private val AUTO_FALLBACK_KEY = booleanPreferencesKey("auto_fallback")
        
        // Default values
        const val DEFAULT_SERVER_URL = "http://192.168.1.66:5000/"
        const val DEFAULT_OFFLINE_MODE_ENABLED = false
        const val DEFAULT_AUTO_FALLBACK = true
    }
    
    /**
     * Get server URL
     */
    val serverUrl: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[SERVER_URL_KEY] ?: DEFAULT_SERVER_URL
    }
    
    /**
     * Get offline mode enabled state
     */
    val offlineModeEnabled: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[OFFLINE_MODE_ENABLED_KEY] ?: DEFAULT_OFFLINE_MODE_ENABLED
    }
    
    /**
     * Get auto fallback setting
     */
    val autoFallback: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[AUTO_FALLBACK_KEY] ?: DEFAULT_AUTO_FALLBACK
    }
    
    /**
     * Update server URL
     */
    suspend fun setServerUrl(url: String) {
        context.dataStore.edit { preferences ->
            preferences[SERVER_URL_KEY] = url
        }
    }
    
    /**
     * Enable/disable offline mode
     */
    suspend fun setOfflineModeEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[OFFLINE_MODE_ENABLED_KEY] = enabled
        }
    }
    
    /**
     * Enable/disable auto fallback to offline mode
     */
    suspend fun setAutoFallback(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[AUTO_FALLBACK_KEY] = enabled
        }
    }
}
