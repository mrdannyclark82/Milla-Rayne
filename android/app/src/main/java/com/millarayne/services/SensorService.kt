package com.millarayne.services

import android.Manifest
import android.app.Service
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.ActivityCompat
import com.google.gson.Gson
import com.millarayne.data.LocationData
import com.millarayne.data.MotionState
import com.millarayne.data.NetworkType
import com.millarayne.data.SensorData
import kotlinx.coroutines.*
import okhttp3.*
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Background service for capturing and streaming sensor data to the server
 * 
 * This service collects ambient context information from device sensors
 * and streams it to the server via WebSocket for real-time processing.
 * 
 * Features:
 * - Accelerometer-based motion detection
 * - Ambient light sensing
 * - Battery status monitoring
 * - Location tracking (when permitted)
 * - Bluetooth device detection
 * - Network status monitoring
 */
class SensorService : Service(), SensorEventListener {
    
    companion object {
        private const val TAG = "SensorService"
        private const val UPDATE_INTERVAL_MS = 5000L // 5 seconds
        private const val LOCATION_UPDATE_INTERVAL_MS = 30000L // 30 seconds
        private const val MIN_LOCATION_DISTANCE_M = 50f // 50 meters
    }
    
    private val binder = LocalBinder()
    private lateinit var sensorManager: SensorManager
    private lateinit var locationManager: LocationManager
    private lateinit var connectivityManager: ConnectivityManager
    private lateinit var bluetoothAdapter: BluetoothAdapter
    
    private var lightSensor: Sensor? = null
    private var accelerometer: Sensor? = null
    
    private var currentLightLevel = 0f
    private var currentMotionState = MotionState.UNKNOWN
    private var currentLocation: Location? = null
    
    private val isRunning = AtomicBoolean(false)
    private var webSocket: WebSocket? = null
    private val gson = Gson()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    private var userId: String = "default-user"
    private var serverUrl: String = "ws://localhost:3000/ws/sensor"
    
    inner class LocalBinder : Binder() {
        fun getService(): SensorService = this@SensorService
    }
    
    override fun onBind(intent: Intent?): IBinder {
        return binder
    }
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "SensorService created")
        
        // Initialize system services
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        
        val bluetoothManager = getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        bluetoothAdapter = bluetoothManager.adapter
        
        // Get sensors
        lightSensor = sensorManager.getDefaultSensor(Sensor.TYPE_LIGHT)
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        
        // Register battery receiver
        registerReceiver(batteryReceiver, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "SensorService started")
        
        // Extract configuration from intent
        intent?.let {
            userId = it.getStringExtra("userId") ?: userId
            serverUrl = it.getStringExtra("serverUrl") ?: serverUrl
        }
        
        startSensorCapture()
        
        return START_STICKY
    }
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "SensorService destroyed")
        
        stopSensorCapture()
        unregisterReceiver(batteryReceiver)
        scope.cancel()
    }
    
    /**
     * Start capturing sensor data and streaming to server
     */
    fun startSensorCapture() {
        if (isRunning.get()) {
            Log.w(TAG, "Sensor capture already running")
            return
        }
        
        Log.i(TAG, "Starting sensor capture")
        isRunning.set(true)
        
        // Register sensor listeners
        lightSensor?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL)
        }
        
        accelerometer?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL)
        }
        
        // Start location updates if permitted
        if (checkLocationPermission()) {
            try {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    LOCATION_UPDATE_INTERVAL_MS,
                    MIN_LOCATION_DISTANCE_M,
                    locationListener
                )
            } catch (e: SecurityException) {
                Log.e(TAG, "Location permission denied", e)
            }
        }
        
        // Connect WebSocket
        connectWebSocket()
        
        // Start periodic data streaming
        scope.launch {
            while (isRunning.get()) {
                streamSensorData()
                delay(UPDATE_INTERVAL_MS)
            }
        }
    }
    
    /**
     * Stop capturing sensor data
     */
    fun stopSensorCapture() {
        if (!isRunning.get()) {
            return
        }
        
        Log.i(TAG, "Stopping sensor capture")
        isRunning.set(false)
        
        // Unregister sensor listeners
        sensorManager.unregisterListener(this)
        
        // Stop location updates
        try {
            locationManager.removeUpdates(locationListener)
        } catch (e: SecurityException) {
            Log.e(TAG, "Error stopping location updates", e)
        }
        
        // Close WebSocket
        webSocket?.close(1000, "Service stopped")
        webSocket = null
    }
    
    /**
     * Connect to server WebSocket endpoint
     */
    private fun connectWebSocket() {
        val client = OkHttpClient.Builder()
            .retryOnConnectionFailure(true)
            .build()
        
        val request = Request.Builder()
            .url(serverUrl)
            .build()
        
        val listener = object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.i(TAG, "WebSocket connected")
            }
            
            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.d(TAG, "WebSocket message: $text")
            }
            
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket failure", t)
                
                // Attempt reconnection after delay
                scope.launch {
                    delay(5000)
                    if (isRunning.get()) {
                        connectWebSocket()
                    }
                }
            }
            
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.i(TAG, "WebSocket closed: $reason")
            }
        }
        
        webSocket = client.newWebSocket(request, listener)
    }
    
    /**
     * Collect and stream current sensor data
     */
    private fun streamSensorData() {
        val sensorData = SensorData(
            userId = userId,
            timestamp = System.currentTimeMillis(),
            userMotionState = currentMotionState,
            ambientLightLevel = currentLightLevel,
            nearbyBluetoothDevices = getNearbyBluetoothDevices(),
            batteryLevel = getBatteryLevel(),
            isCharging = isCharging(),
            location = currentLocation?.let {
                LocationData(
                    latitude = it.latitude,
                    longitude = it.longitude,
                    accuracy = it.accuracy
                )
            },
            networkType = getNetworkType()
        )
        
        // Send via WebSocket
        val json = gson.toJson(sensorData)
        webSocket?.send(json)
        
        Log.d(TAG, "Sensor data streamed: motion=${currentMotionState}, light=${currentLightLevel}")
    }
    
    // SensorEventListener implementation
    override fun onSensorChanged(event: SensorEvent?) {
        event?.let {
            when (it.sensor.type) {
                Sensor.TYPE_LIGHT -> {
                    currentLightLevel = it.values[0]
                }
                Sensor.TYPE_ACCELEROMETER -> {
                    // Simple motion detection based on acceleration magnitude
                    val x = it.values[0]
                    val y = it.values[1]
                    val z = it.values[2]
                    val magnitude = Math.sqrt((x * x + y * y + z * z).toDouble()).toFloat()
                    
                    currentMotionState = when {
                        magnitude < 1.0 -> MotionState.STATIONARY
                        magnitude < 5.0 -> MotionState.WALKING
                        magnitude < 10.0 -> MotionState.RUNNING
                        else -> MotionState.DRIVING
                    }
                }
            }
        }
    }
    
    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // Not needed for this implementation
    }
    
    // Location listener
    private val locationListener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
            currentLocation = location
            Log.d(TAG, "Location updated: ${location.latitude}, ${location.longitude}")
        }
        
        override fun onProviderEnabled(provider: String) {
            Log.d(TAG, "Location provider enabled: $provider")
        }
        
        override fun onProviderDisabled(provider: String) {
            Log.d(TAG, "Location provider disabled: $provider")
        }
    }
    
    // Battery receiver
    private val batteryReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            // Battery status is queried on-demand
        }
    }
    
    /**
     * Get nearby Bluetooth devices
     */
    private fun getNearbyBluetoothDevices(): List<String> {
        if (!checkBluetoothPermission()) {
            return emptyList()
        }
        
        return try {
            bluetoothAdapter.bondedDevices?.map { it.name ?: it.address } ?: emptyList()
        } catch (e: SecurityException) {
            Log.e(TAG, "Bluetooth permission denied", e)
            emptyList()
        }
    }
    
    /**
     * Get current battery level (0-1)
     */
    private fun getBatteryLevel(): Float {
        val batteryStatus = registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val level = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        
        return if (level >= 0 && scale > 0) {
            level.toFloat() / scale.toFloat()
        } else {
            0f
        }
    }
    
    /**
     * Check if device is charging
     */
    private fun isCharging(): Boolean {
        val batteryStatus = registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val status = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        
        return status == BatteryManager.BATTERY_STATUS_CHARGING ||
               status == BatteryManager.BATTERY_STATUS_FULL
    }
    
    /**
     * Get current network type
     */
    private fun getNetworkType(): NetworkType {
        val network = connectivityManager.activeNetwork ?: return NetworkType.NONE
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return NetworkType.NONE
        
        return when {
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> NetworkType.WIFI
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> NetworkType.CELLULAR
            else -> NetworkType.NONE
        }
    }
    
    /**
     * Check if location permission is granted
     */
    private fun checkLocationPermission(): Boolean {
        return ActivityCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    /**
     * Check if Bluetooth permission is granted
     */
    private fun checkBluetoothPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.BLUETOOTH_CONNECT
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }
    
    /**
     * Configure server URL and user ID
     */
    fun configure(userId: String, serverUrl: String) {
        this.userId = userId
        this.serverUrl = serverUrl
        
        // Reconnect with new configuration
        if (isRunning.get()) {
            webSocket?.close(1000, "Reconfiguring")
            connectWebSocket()
        }
    }
}
