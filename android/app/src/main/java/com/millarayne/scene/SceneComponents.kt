/**
 * Jetpack Compose Scene Components
 * Asset-free, procedural scene rendering
 */

package com.millarayne.scene

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay

/**
 * AmbientGradientLayer - Procedural gradient background
 */
@Composable
fun AmbientGradientLayer(
    theme: SceneTheme,
    modifier: Modifier = Modifier
) {
    val palette = theme.palette
    
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                brush = Brush.linearGradient(
                    colors = listOf(
                        Color(palette.primary),
                        Color(palette.secondary),
                        Color(palette.accent)
                    ),
                    start = Offset.Zero,
                    end = Offset.Infinite
                )
            )
    )
}

/**
 * ParallaxLayer - Subtle depth effect using graphicsLayer
 */
@Composable
fun ParallaxLayer(
    intensity: Float,
    color: Color = Color.White.copy(alpha = 0.05f),
    modifier: Modifier = Modifier
) {
    if (intensity == 0f) return
    
    var offsetX by remember { mutableStateOf(0f) }
    var offsetY by remember { mutableStateOf(0f) }
    
    Box(
        modifier = modifier
            .fillMaxSize()
            .graphicsLayer(
                translationX = offsetX * intensity * 20f,
                translationY = offsetY * intensity * 20f
            )
    ) {
        // Procedural circles for depth effect
        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height
            
            // Circle 1
            drawCircle(
                color = color,
                radius = 150.dp.toPx(),
                center = Offset(width * 0.2f, height * 0.1f),
                alpha = 0.5f
            )
            
            // Circle 2
            drawCircle(
                color = color,
                radius = 200.dp.toPx(),
                center = Offset(width * 0.85f, height * 0.8f),
                alpha = 0.35f
            )
            
            // Circle 3
            drawCircle(
                color = color,
                radius = 100.dp.toPx(),
                center = Offset(width * 0.5f, height * 0.5f),
                alpha = 0.25f
            )
        }
    }
}

/**
 * SceneManager - Main scene orchestrator composable
 */
@Composable
fun SceneManager(
    context: SceneContext,
    modifier: Modifier = Modifier
) {
    val theme = remember(context.timeOfDay, context.appState, context.reducedMotion, context.performanceMode) {
        generateSceneTheme(
            context.timeOfDay,
            context.appState,
            context.reducedMotion,
            context.performanceMode
        )
    }
    
    // Reduce effects when backgrounded
    val effectiveParallaxIntensity = if (context.isBackgrounded) 0f else theme.parallaxIntensity
    
    Box(
        modifier = modifier.fillMaxSize()
    ) {
        // Base gradient layer
        AmbientGradientLayer(theme = theme)
        
        // Parallax depth layer
        ParallaxLayer(
            intensity = effectiveParallaxIntensity,
            color = Color(theme.palette.accent).copy(alpha = 0.3f)
        )
    }
}

/**
 * Demo screen for adaptive scene system
 * Should be gated by feature flag in production
 */
@Composable
fun AdaptiveSceneDemo(
    enabled: Boolean = false,
    context: SceneContext = SceneContext(),
    content: @Composable () -> Unit
) {
    if (!enabled) {
        // Feature flag gate: render content only
        content()
        return
    }
    
    // When enabled, wrap with scene system
    Box(modifier = Modifier.fillMaxSize()) {
        SceneManager(context = context)
        content()
    }
}
