package com.millarayne.data

import com.google.gson.annotations.SerializedName

/**
 * Data class for real-time sensor data
 * Provides low-latency context information from device sensors
 */
data class SensorData(
    @SerializedName("userId")
    val userId: String,
    
    @SerializedName("timestamp")
    val timestamp: Long,
    
    @SerializedName("userMotionState")
    val userMotionState: MotionState,
    
    @SerializedName("ambientLightLevel")
    val ambientLightLevel: Float,
    
    @SerializedName("nearbyBluetoothDevices")
    val nearbyBluetoothDevices: List<String> = emptyList(),
    
    @SerializedName("batteryLevel")
    val batteryLevel: Float? = null,
    
    @SerializedName("isCharging")
    val isCharging: Boolean? = null,
    
    @SerializedName("location")
    val location: LocationData? = null,
    
    @SerializedName("networkType")
    val networkType: NetworkType? = null
)

/**
 * User motion state detected by accelerometer and activity recognition
 */
enum class MotionState {
    @SerializedName("stationary")
    STATIONARY,
    
    @SerializedName("walking")
    WALKING,
    
    @SerializedName("running")
    RUNNING,
    
    @SerializedName("driving")
    DRIVING,
    
    @SerializedName("unknown")
    UNKNOWN
}

/**
 * Location data (when available and permitted)
 */
data class LocationData(
    @SerializedName("latitude")
    val latitude: Double,
    
    @SerializedName("longitude")
    val longitude: Double,
    
    @SerializedName("accuracy")
    val accuracy: Float
)

/**
 * Network connectivity type
 */
enum class NetworkType {
    @SerializedName("wifi")
    WIFI,
    
    @SerializedName("cellular")
    CELLULAR,
    
    @SerializedName("none")
    NONE
}
