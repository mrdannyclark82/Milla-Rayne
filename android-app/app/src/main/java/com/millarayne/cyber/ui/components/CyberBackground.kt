package com.millarayne.cyber.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.millarayne.cyber.ui.theme.LocalCyberTokens

/**
 * Animated cyberpunk grid background: dark gradient + scrolling neon grid +
 * subtle scanline pulse. Pure Compose Canvas, no images.
 */
@Composable
fun CyberGridBackground(modifier: Modifier = Modifier) {
    val t = LocalCyberTokens.current
    val transition = rememberInfiniteTransition(label = "grid")
    val scroll by transition.animateFloat(
        initialValue = 0f,
        targetValue = 60f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 6000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "scroll"
    )
    val pulse by transition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.85f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        t.bg,
                        t.bg.copy(alpha = 0.92f),
                        Color(0xFF0A0420)
                    )
                )
            )
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height
            val cell = 56f

            // Horizon vanishing point
            val horizon = h * 0.55f

            // Vertical "lanes" radiating from horizon
            val laneColor = t.neonPrimary.copy(alpha = 0.18f * pulse)
            val center = w / 2f
            for (i in -10..10) {
                val xTop = center + i * 18f
                val xBottom = center + i * (w / 14f)
                drawLine(
                    color = laneColor,
                    start = Offset(xTop, horizon),
                    end = Offset(xBottom, h),
                    strokeWidth = 1.2f
                )
            }

            // Horizontal grid receding (cyan, brightness fades upward)
            var y = h
            var step = cell
            while (y > horizon) {
                val depth = ((h - y) / (h - horizon)).coerceIn(0f, 1f)
                val alpha = (1f - depth) * 0.32f * pulse
                drawLine(
                    color = t.neonPrimary.copy(alpha = alpha),
                    start = Offset(0f, y - (scroll % step)),
                    end = Offset(w, y - (scroll % step)),
                    strokeWidth = 1f
                )
                y -= step
                step *= 0.92f
            }

            // Top half: subtle starfield-ish dots in magenta
            val dotColor = t.neonSecondary.copy(alpha = 0.35f)
            val rng = java.util.Random(42L)
            for (i in 0 until 40) {
                val x = rng.nextFloat() * w
                val yy = rng.nextFloat() * horizon
                drawCircle(
                    color = dotColor.copy(alpha = dotColor.alpha * (0.4f + 0.6f * rng.nextFloat())),
                    radius = 1.2f,
                    center = Offset(x, yy)
                )
            }
        }
    }
}
