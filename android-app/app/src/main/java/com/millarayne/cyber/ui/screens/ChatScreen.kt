package com.millarayne.cyber.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.millarayne.cyber.data.model.Attachment
import com.millarayne.cyber.ui.chat.ChatViewModel
import com.millarayne.cyber.ui.components.CyberCutShape
import com.millarayne.cyber.ui.components.CyberGridBackground
import com.millarayne.cyber.ui.components.NeonButton
import com.millarayne.cyber.ui.components.NeonCard
import com.millarayne.cyber.ui.theme.CyberType
import com.millarayne.cyber.ui.theme.LocalCyberTokens
import com.millarayne.cyber.voice.SpeechRecognizerHelper
import com.millarayne.cyber.voice.TtsHelper
import java.io.ByteArrayOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun ChatScreen(nav: NavController, vm: ChatViewModel = viewModel()) {
    val t = LocalCyberTokens.current
    val ctx = LocalContext.current

    val messages by vm.messages.collectAsState()
    val streaming by vm.streamingBuffer.collectAsState()
    val isSending by vm.isSending.collectAsState()
    val error by vm.error.collectAsState()
    val pending by vm.pending.collectAsState()
    val activeProvider by vm.activeProvider.collectAsState()

    var draft by rememberSaveable { mutableStateOf("") }
    val listState = rememberLazyListState()
    val tts = remember { TtsHelper(ctx) }
    val stt = remember { SpeechRecognizerHelper(ctx) }

    // Auto-scroll to latest
    LaunchedEffect(messages.size, streaming) {
        val total = messages.size + (if (streaming != null) 1 else 0)
        if (total > 0) listState.animateScrollToItem(total - 1)
    }

    // ── attachment pickers ────────────────────────────────────────────────────
    val pickImage = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) ctx.contentResolver.openInputStream(uri)?.use { input ->
            val bytes = input.readBytes()
            val mime = ctx.contentResolver.getType(uri) ?: "image/jpeg"
            vm.stageAttachment(Attachment(bytes, mime, "image"))
        }
    }
    val takePhoto = rememberLauncherForActivityResult(ActivityResultContracts.TakePicturePreview()) { bmp ->
        if (bmp != null) {
            val out = ByteArrayOutputStream()
            bmp.compress(android.graphics.Bitmap.CompressFormat.JPEG, 88, out)
            vm.stageAttachment(Attachment(out.toByteArray(), "image/jpeg", "camera.jpg"))
        }
    }
    val cameraPerm = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) takePhoto.launch(null)
    }
    val micPerm = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) stt.startListening(
            onPartial = { /* could update draft live */ },
            onResult = { txt -> draft = (draft + " " + txt).trim() },
            onError = { /* swallow for brevity */ }
        )
    }

    Box(Modifier.fillMaxSize()) {
        CyberGridBackground()

        Column(Modifier.fillMaxSize()) {
            // ── top bar ──────────────────────────────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(Modifier.weight(1f)) {
                    Text("MILLA // RAYNE", style = CyberType.title, color = t.neonPrimary)
                    Text(
                        activeProvider ?: (if (isSending) "STREAM ACTIVE" else "STANDBY"),
                        style = CyberType.label,
                        color = t.onBgMuted
                    )
                }
                IconButton(onClick = { nav.navigate("permissions") }) {
                    Icon(Icons.Filled.Shield, contentDescription = "Permissions", tint = t.neonSecondary)
                }
                IconButton(onClick = { nav.navigate("settings") }) {
                    Icon(Icons.Filled.Settings, contentDescription = "Settings", tint = t.neonPrimary)
                }
            }

            // ── messages ─────────────────────────────────────────────────────
            Box(Modifier.weight(1f).fillMaxWidth()) {
                if (messages.isEmpty() && streaming == null) {
                    Column(
                        Modifier.fillMaxSize().padding(40.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("// AWAITING SIGNAL", style = CyberType.display, color = t.neonPrimary, textAlign = TextAlign.Center)
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "Configure a provider in SYSTEM // CONFIG, then send your first transmission.",
                            style = CyberType.body,
                            color = t.onBgMuted,
                            textAlign = TextAlign.Center
                        )
                    }
                } else {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        items(messages, key = { it.id }) { msg ->
                            MessageBubble(
                                role = msg.role,
                                content = msg.content,
                                provider = msg.provider,
                                ts = msg.timestamp,
                                onSpeak = { tts.speak(msg.content) }
                            )
                            Spacer(Modifier.height(8.dp))
                        }
                        if (streaming != null) {
                            item {
                                MessageBubble(
                                    role = "assistant",
                                    content = streaming.orEmpty(),
                                    provider = activeProvider,
                                    ts = System.currentTimeMillis(),
                                    onSpeak = null,
                                    streaming = true
                                )
                                Spacer(Modifier.height(8.dp))
                            }
                        }
                    }
                }

                error?.let { e ->
                    NeonCard(
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .padding(8.dp),
                        accent = t.neonSecondary
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(e, color = t.neonSecondary, style = CyberType.body, modifier = Modifier.weight(1f))
                            Spacer(Modifier.width(8.dp))
                            NeonButton("DISMISS", { vm.clearError() }, accent = t.neonSecondary)
                        }
                    }
                }
            }

            // ── pending attachments strip ────────────────────────────────────
            if (pending.isNotEmpty()) {
                Row(
                    Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    pending.forEach { att ->
                        Box(
                            Modifier
                                .padding(end = 6.dp)
                                .clip(RoundedCornerShape(2.dp))
                                .background(t.surfaceElevated)
                                .border(1.dp, t.strokeNeon, RoundedCornerShape(2.dp))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                "${att.mime} · ${att.sizeKb}kb  ✕",
                                style = CyberType.small,
                                color = t.neonPrimary,
                                modifier = Modifier.clip(RoundedCornerShape(2.dp))
                            )
                        }
                    }
                }
            }

            // ── composer ─────────────────────────────────────────────────────
            Surface(
                color = t.surface,
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, t.strokeNeon)
            ) {
                Row(
                    modifier = Modifier.padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { pickImage.launch("image/*") }) {
                        Icon(Icons.Filled.Image, contentDescription = "Pick image", tint = t.neonPrimary)
                    }
                    IconButton(onClick = {
                        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED)
                            takePhoto.launch(null)
                        else cameraPerm.launch(Manifest.permission.CAMERA)
                    }) {
                        Icon(Icons.Filled.PhotoCamera, contentDescription = "Camera", tint = t.neonPrimary)
                    }
                    IconButton(onClick = {
                        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED)
                            stt.startListening(
                                onPartial = {},
                                onResult = { txt -> draft = (draft + " " + txt).trim() },
                                onError = {}
                            )
                        else micPerm.launch(Manifest.permission.RECORD_AUDIO)
                    }) {
                        Icon(Icons.Filled.Mic, contentDescription = "Voice", tint = t.neonSecondary)
                    }
                    Box(
                        Modifier
                            .weight(1f)
                            .clip(CyberCutShape)
                            .background(t.surfaceElevated)
                            .border(1.dp, t.strokeNeon, CyberCutShape)
                            .padding(horizontal = 14.dp, vertical = 12.dp)
                    ) {
                        if (draft.isEmpty()) {
                            Text("> speak to the grid…", color = t.onBgMuted, style = CyberType.body)
                        }
                        BasicTextField(
                            value = draft,
                            onValueChange = { draft = it },
                            textStyle = CyberType.body.copy(color = t.onBg),
                            cursorBrush = Brush.verticalGradient(listOf(t.neonPrimary, t.neonSecondary)),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    Spacer(Modifier.width(6.dp))
                    val canSend = !isSending && (draft.isNotBlank() || pending.isNotEmpty())
                    IconButton(
                        onClick = {
                            vm.sendUserMessage(draft.trim())
                            draft = ""
                        },
                        enabled = canSend
                    ) {
                        if (isSending) CircularProgressIndicator(strokeWidth = 2.dp, color = t.neonPrimary, modifier = Modifier.size(22.dp))
                        else Icon(Icons.Filled.Send, contentDescription = "Send",
                            tint = if (canSend) t.neonPrimary else t.onBgMuted)
                    }
                }
            }
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            tts.shutdown()
            stt.stopListening()
        }
    }
}

@Composable
private fun MessageBubble(
    role: String,
    content: String,
    provider: String?,
    ts: Long,
    onSpeak: (() -> Unit)?,
    streaming: Boolean = false
) {
    val t = LocalCyberTokens.current
    val isUser = role == "user"
    val accent = if (isUser) t.neonPrimary else t.neonSecondary
    val bubble = if (isUser) t.userBubble else t.assistantBubble
    val df = remember { SimpleDateFormat("HH:mm:ss", Locale.getDefault()) }

    Row(
        Modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
    ) {
        Column(modifier = Modifier.widthIn(max = 320.dp)) {
            // Header strip
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier
                        .size(8.dp)
                        .background(accent)
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    text = if (isUser) "USER //" else "MILLA // ${(provider ?: "remote").uppercase()}",
                    style = CyberType.label,
                    color = accent
                )
                Spacer(Modifier.width(6.dp))
                Text(df.format(Date(ts)), style = CyberType.small, color = t.onBgMuted)
                if (streaming) {
                    Spacer(Modifier.width(6.dp))
                    Text("◉ STREAM", style = CyberType.small, color = t.neonPrimary)
                }
            }
            Spacer(Modifier.height(4.dp))
            Surface(
                color = bubble,
                modifier = Modifier.border(1.dp, accent.copy(alpha = 0.6f), CyberCutShape).clip(CyberCutShape)
            ) {
                Column(Modifier.padding(12.dp)) {
                    val styled = buildAnnotatedString {
                        withStyle(SpanStyle(color = t.onBg, fontWeight = FontWeight.Normal)) { append(content) }
                    }
                    Text(styled, style = CyberType.body, color = t.onBg)
                    if (onSpeak != null && !isUser) {
                        Spacer(Modifier.height(6.dp))
                        NeonButton(label = "▶ TTS", onClick = onSpeak, accent = t.neonPrimary)
                    }
                }
            }
        }
    }
}
