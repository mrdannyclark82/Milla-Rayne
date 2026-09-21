package com.millarayne.cyber.ai

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import java.util.concurrent.TimeUnit

internal object Http {
    val client: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            })
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(5, TimeUnit.MINUTES)   // long read for streaming
            .writeTimeout(60, TimeUnit.SECONDS)
            .callTimeout(6, TimeUnit.MINUTES)
            .build()
    }
}
