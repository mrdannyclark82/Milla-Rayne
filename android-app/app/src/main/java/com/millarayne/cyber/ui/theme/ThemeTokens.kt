package com.millarayne.cyber.ui.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.TextStyle

/**
 * THEME TOKENS — Edit this file to retheme the entire app in seconds.
 *
 * Three presets are provided. To switch the active preset just change
 * [ActiveTokens] at the bottom of this file (or build a settings-driven
 * variant by reading from SettingsRepository.themeName and selecting here).
 */
data class CyberTokens(
    val name: String,
    // Surfaces
    val bg: Color,
    val surface: Color,
    val surfaceElevated: Color,
    // Accents
    val neonPrimary: Color,
    val neonSecondary: Color,
    val neonTertiary: Color,
    // Text
    val onBg: Color,
    val onBgMuted: Color,
    val onAccent: Color,
    // Bubbles
    val userBubble: Color,
    val assistantBubble: Color,
    // Strokes
    val strokeNeon: Color,
    val strokeMuted: Color,
    // Type
    val displayFamily: FontFamily,
    val bodyFamily: FontFamily,
    val monoFamily: FontFamily,
)

/** Default cyberpunk: deep void, hot cyan + magenta + violet. */
val NeonNight = CyberTokens(
    name = "Neon Night",
    bg              = Color(0xFF070710),
    surface         = Color(0xFF0D0D1A),
    surfaceElevated = Color(0xFF131326),
    neonPrimary     = Color(0xFF00F0FF),   // cyan
    neonSecondary   = Color(0xFFFF2BD6),   // magenta
    neonTertiary    = Color(0xFF8A2BE2),   // violet
    onBg            = Color(0xFFE6F1FF),
    onBgMuted       = Color(0xFF7A86A8),
    onAccent        = Color(0xFF050510),
    userBubble      = Color(0xFF13243B),
    assistantBubble = Color(0xFF1A0F2E),
    strokeNeon      = Color(0x6600F0FF),
    strokeMuted     = Color(0x33FFFFFF),
    displayFamily   = FontFamily.Monospace,
    bodyFamily      = FontFamily.SansSerif,
    monoFamily      = FontFamily.Monospace,
)

/** Acid lime / hot pink — louder. */
val AcidPunk = NeonNight.copy(
    name = "Acid Punk",
    neonPrimary   = Color(0xFFB6FF1A),
    neonSecondary = Color(0xFFFF4D8D),
    neonTertiary  = Color(0xFF00C2FF),
    userBubble    = Color(0xFF1F2A0F),
    assistantBubble = Color(0xFF2A0F1F),
)

/** Synthwave: sunset orange / hot pink / deep indigo. */
val Synthwave = NeonNight.copy(
    name = "Synthwave",
    bg = Color(0xFF0B0524),
    surface = Color(0xFF120A33),
    surfaceElevated = Color(0xFF1B1145),
    neonPrimary   = Color(0xFFFF7A2A),
    neonSecondary = Color(0xFFFF3FA4),
    neonTertiary  = Color(0xFF8C5BFF),
    userBubble    = Color(0xFF231548),
    assistantBubble = Color(0xFF2C0F3A),
)

/** ⬇️ Change this single line to switch the preset. */
val ActiveTokens: CyberTokens = NeonNight

object CyberType {
    val display = TextStyle(
        fontFamily = ActiveTokens.displayFamily,
        fontWeight = FontWeight.Black,
        fontSize = 26.sp,
        letterSpacing = 2.sp
    )
    val title = TextStyle(
        fontFamily = ActiveTokens.displayFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 18.sp,
        letterSpacing = 1.5.sp
    )
    val label = TextStyle(
        fontFamily = ActiveTokens.monoFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 11.sp,
        letterSpacing = 2.sp
    )
    val body = TextStyle(
        fontFamily = ActiveTokens.bodyFamily,
        fontSize = 15.sp,
        lineHeight = 22.sp
    )
    val small = TextStyle(
        fontFamily = ActiveTokens.monoFamily,
        fontSize = 10.sp,
        letterSpacing = 1.sp
    )
}
