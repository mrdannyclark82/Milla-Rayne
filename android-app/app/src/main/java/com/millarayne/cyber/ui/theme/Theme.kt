package com.millarayne.cyber.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.unit.sp

val LocalCyberTokens = staticCompositionLocalOf { ActiveTokens }

@Composable
fun MillaCyberTheme(
    @Suppress("UNUSED_PARAMETER") darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val t = ActiveTokens
    val scheme = darkColorScheme(
        primary = t.neonPrimary,
        onPrimary = t.onAccent,
        secondary = t.neonSecondary,
        onSecondary = t.onAccent,
        tertiary = t.neonTertiary,
        background = t.bg,
        onBackground = t.onBg,
        surface = t.surface,
        onSurface = t.onBg,
        surfaceVariant = t.surfaceElevated,
        onSurfaceVariant = t.onBgMuted,
        outline = t.strokeMuted,
        outlineVariant = t.strokeNeon,
        error = t.neonSecondary,
        onError = t.onAccent
    )

    val typography = Typography(
        displayLarge = CyberType.display,
        titleLarge = CyberType.title,
        titleMedium = CyberType.title.copy(fontSize = 15.sp),
        labelLarge = CyberType.label,
        labelSmall = CyberType.small,
        bodyLarge = CyberType.body,
        bodyMedium = CyberType.body
    )

    CompositionLocalProvider(LocalCyberTokens provides t) {
        MaterialTheme(
            colorScheme = scheme,
            typography = typography,
            content = content
        )
    }
}
