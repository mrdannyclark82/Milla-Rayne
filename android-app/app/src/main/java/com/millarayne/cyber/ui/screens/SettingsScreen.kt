package com.millarayne.cyber.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.millarayne.cyber.MillaApp
import com.millarayne.cyber.ui.components.CyberCutShape
import com.millarayne.cyber.ui.components.CyberGridBackground
import com.millarayne.cyber.ui.components.NeonButton
import com.millarayne.cyber.ui.components.NeonCard
import com.millarayne.cyber.ui.components.SectionLabel
import com.millarayne.cyber.ui.theme.CyberType
import com.millarayne.cyber.ui.theme.LocalCyberTokens

@Composable
fun SettingsScreen(nav: NavController) {
    val t = LocalCyberTokens.current
    val ctx = LocalContext.current
    val app = ctx.applicationContext as MillaApp
    val s by app.settings.state.collectAsState()

    Box(Modifier.fillMaxSize()) {
        CyberGridBackground()
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { nav.popBackStack() }) {
                    Icon(Icons.Filled.ArrowBack, "back", tint = t.neonPrimary)
                }
                Text("SYSTEM // CONFIG", style = CyberType.title, color = t.neonPrimary)
            }
            Spacer(Modifier.height(8.dp))
            Text(
                "Keys are stored encrypted with the AndroidKeyStore (AES-256-GCM). Order is best-effort fallback chain.",
                style = CyberType.body, color = t.onBgMuted
            )
            Spacer(Modifier.height(20.dp))

            // ── Backend ─────────────────────────────────────────────────────
            SectionLabel("Milla-Rayne backend (optional)")
            Spacer(Modifier.height(6.dp))
            NeonCard {
                Column {
                    LabeledField("Server URL (e.g. http://10.0.2.2:5000)", s.backendUrl) { v ->
                        app.settings.update { it.copy(backendUrl = v.trim()) }
                    }
                }
            }

            Spacer(Modifier.height(18.dp))
            SectionLabel("Gemini (Google)", accent = t.neonSecondary)
            Spacer(Modifier.height(6.dp))
            NeonCard(accent = t.neonSecondary) {
                Column {
                    LabeledField("API key (x-goog-api-key)", s.geminiKey, password = true) { v ->
                        app.settings.update { it.copy(geminiKey = v.trim()) }
                    }
                    Spacer(Modifier.height(8.dp))
                    LabeledField("Primary model", s.geminiModel) { v ->
                        app.settings.update { it.copy(geminiModel = v.trim()) }
                    }
                    Spacer(Modifier.height(6.dp))
                    Text("Tip: gemini-3-pro · gemini-3-flash · gemini-2.5-pro · gemini-2.5-flash",
                         style = CyberType.small, color = t.onBgMuted)
                }
            }

            Spacer(Modifier.height(18.dp))
            SectionLabel("OpenAI", accent = t.neonTertiary)
            Spacer(Modifier.height(6.dp))
            NeonCard(accent = t.neonTertiary) {
                Column {
                    LabeledField("API key (Bearer)", s.openAiKey, password = true) { v ->
                        app.settings.update { it.copy(openAiKey = v.trim()) }
                    }
                    Spacer(Modifier.height(8.dp))
                    LabeledField("Model", s.openAiModel) { v ->
                        app.settings.update { it.copy(openAiModel = v.trim()) }
                    }
                    Spacer(Modifier.height(6.dp))
                    Text("Tip: gpt-5.2 · gpt-4o · gpt-4o-mini",
                         style = CyberType.small, color = t.onBgMuted)
                }
            }

            Spacer(Modifier.height(18.dp))
            SectionLabel("Claude (Anthropic)", accent = t.neonPrimary)
            Spacer(Modifier.height(6.dp))
            NeonCard {
                Column {
                    LabeledField("API key (x-api-key)", s.anthropicKey, password = true) { v ->
                        app.settings.update { it.copy(anthropicKey = v.trim()) }
                    }
                    Spacer(Modifier.height(8.dp))
                    LabeledField("Model", s.anthropicModel) { v ->
                        app.settings.update { it.copy(anthropicModel = v.trim()) }
                    }
                    Spacer(Modifier.height(6.dp))
                    Text("Tip: claude-sonnet-4.5 · claude-opus-4.5 · claude-haiku-4.5",
                         style = CyberType.small, color = t.onBgMuted)
                }
            }

            Spacer(Modifier.height(18.dp))
            SectionLabel("Fallback chain")
            Spacer(Modifier.height(6.dp))
            NeonCard {
                Column {
                    LabeledField(
                        "Order (comma-sep: backend,gemini,openai,claude)",
                        s.fallbackOrderCsv
                    ) { v ->
                        app.settings.update { it.copy(fallbackOrderCsv = v.trim()) }
                    }
                    Spacer(Modifier.height(10.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Switch(
                            checked = s.useStreaming,
                            onCheckedChange = { v ->
                                app.settings.update { it.copy(useStreaming = v) }
                            },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = t.neonPrimary,
                                checkedTrackColor = t.neonPrimary.copy(alpha = 0.4f)
                            )
                        )
                        Spacer(Modifier.width(8.dp))
                        Text("Stream Gemini responses (SSE)", style = CyberType.body, color = t.onBg)
                    }
                }
            }

            Spacer(Modifier.height(20.dp))
            Row {
                NeonButton("BACK TO CHANNEL", onClick = { nav.popBackStack() })
            }
            Spacer(Modifier.height(40.dp))
        }
    }
}

@Composable
private fun LabeledField(
    label: String,
    initial: String,
    password: Boolean = false,
    onChange: (String) -> Unit
) {
    val t = LocalCyberTokens.current
    var value by androidx.compose.runtime.remember(initial) { androidx.compose.runtime.mutableStateOf(initial) }
    Text(label, style = CyberType.label, color = t.onBgMuted)
    Spacer(Modifier.height(4.dp))
    Box(
        Modifier
            .fillMaxWidth()
            .border(1.dp, t.strokeNeon, CyberCutShape)
            .background(t.surfaceElevated, CyberCutShape)
            .padding(horizontal = 12.dp, vertical = 10.dp)
    ) {
        BasicTextField(
            value = value,
            onValueChange = { v -> value = v; onChange(v) },
            textStyle = CyberType.body.copy(color = t.onBg),
            cursorBrush = Brush.horizontalGradient(listOf(t.neonPrimary, t.neonSecondary)),
            singleLine = true,
            visualTransformation = if (password && value.isNotEmpty())
                androidx.compose.ui.text.input.PasswordVisualTransformation()
            else androidx.compose.ui.text.input.VisualTransformation.None,
            modifier = Modifier.fillMaxWidth()
        )
    }
}
