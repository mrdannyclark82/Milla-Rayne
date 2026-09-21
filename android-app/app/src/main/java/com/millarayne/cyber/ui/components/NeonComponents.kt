package com.millarayne.cyber.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.GenericShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import com.millarayne.cyber.ui.theme.CyberType
import com.millarayne.cyber.ui.theme.LocalCyberTokens

/** Angled cyberpunk pill — clipped corners, neon outline. */
val CyberCutShape = GenericShape { size, _ ->
    val c = 14f
    moveTo(c, 0f)
    lineTo(size.width - c, 0f)
    lineTo(size.width, c)
    lineTo(size.width, size.height - c)
    lineTo(size.width - c, size.height)
    lineTo(c, size.height)
    lineTo(0f, size.height - c)
    lineTo(0f, c)
    close()
}

@Composable
fun NeonButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    accent: Color? = null,
    enabled: Boolean = true,
) {
    val t = LocalCyberTokens.current
    val color = accent ?: t.neonPrimary
    val a = if (enabled) 1f else 0.4f
    Box(
        modifier = modifier
            .clip(CyberCutShape)
            .background(Brush.horizontalGradient(listOf(t.surface, t.surfaceElevated)))
            .border(BorderStroke(1.5.dp, SolidColor(color.copy(alpha = a))), CyberCutShape)
            .clickable(enabled = enabled) { onClick() }
            .padding(horizontal = 18.dp, vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = color.copy(alpha = a),
            style = CyberType.label
        )
    }
}

@Composable
fun NeonCard(
    modifier: Modifier = Modifier,
    accent: Color? = null,
    content: @Composable () -> Unit
) {
    val t = LocalCyberTokens.current
    val border = accent ?: t.strokeNeon
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(2.dp))
            .background(t.surface)
            .border(BorderStroke(1.dp, border), RoundedCornerShape(2.dp))
            .drawBehind {
                // Top-left and bottom-right neon ticks
                val s = 10f
                val acc = accent ?: t.neonPrimary
                drawLine(acc, Offset(0f, 0f), Offset(s, 0f), strokeWidth = 2f)
                drawLine(acc, Offset(0f, 0f), Offset(0f, s), strokeWidth = 2f)
                drawLine(
                    acc,
                    Offset(size.width, size.height),
                    Offset(size.width - s, size.height),
                    strokeWidth = 2f
                )
                drawLine(
                    acc,
                    Offset(size.width, size.height),
                    Offset(size.width, size.height - s),
                    strokeWidth = 2f
                )
            }
            .padding(12.dp)
    ) { content() }
}

@Composable
fun SectionLabel(text: String, accent: Color? = null) {
    val t = LocalCyberTokens.current
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            Modifier
                .size(8.dp)
                .background(accent ?: t.neonPrimary)
        )
        Spacer(Modifier.width(8.dp))
        Text(text.uppercase(), style = CyberType.label, color = accent ?: t.neonPrimary)
    }
}
