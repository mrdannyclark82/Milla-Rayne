package com.millarayne.api

import com.millarayne.data.ChatRequest
import com.millarayne.data.ChatResponse
import com.millarayne.data.Message
import com.millarayne.data.SensorData
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

/**
 * Retrofit service interface for Milla API
 */
interface MillaApiService {
    
    @POST("/api/chat")
    suspend fun sendMessage(@Body request: ChatRequest): Response<ChatResponse>

    @GET("/api/messages")
    suspend fun getMessages(@Query("limit") limit: Int = 50): Response<List<Message>>
    
    /**
     * Send real-time sensor data for context-aware processing
     */
    @POST("/api/sensor-data")
    suspend fun sendRealtimeSensorData(@Body data: SensorData): Response<Unit>
}
