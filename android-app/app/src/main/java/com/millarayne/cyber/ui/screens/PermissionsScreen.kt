package com.millarayne.cyber.ui.screens

import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.navigation.NavController
import com.millarayne.cyber.permissions.PermissionGroups
import com.millarayne.cyber.ui.components.CyberGridBackground
import com.millarayne.cyber.ui.components.NeonButton
import com.millarayne.cyber.ui.components.NeonCard
import com.millarayne.cyber.ui.theme.CyberType
import com.millarayne.cyber.ui.theme.LocalCyberTokens

@Composable
fun PermissionsScreen(nav: NavController) {
    val t = LocalCyberTokens.current
    val ctx = LocalContext.current

    var refresh by remember { mutableStateOf(0) }
    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { _ -> refresh++ }
    val launcherAll = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { _ -> refresh++ }

    fun granted(p: String): Boolean =
        ContextCompat.checkSelfPermission(ctx, p) == PackageManager.PERMISSION_GRANTED

    Box(Modifier.fillMaxSize()) {
        CyberGridBackground()
        Column(Modifier.fillMaxSize().padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { nav.popBackStack() }) {
                    Icon(Icons.Filled.ArrowBack, "back", tint = t.neonPrimary)
                }
                Text("RUNTIME // PERMS", style = CyberType.title, color = t.neonPrimary)
            }
            Spacer(Modifier.height(8.dp))
            Text(
                "Grant or revoke runtime permission groups. The app degrades gracefully — only request what you need.",
                style = CyberType.body, color = t.onBgMuted
            )
            Spacer(Modifier.height(12.dp))

            // Master action
            Row {
                NeonButton(
                    "REQUEST ALL",
                    onClick = {
                        val toAsk = PermissionGroups.ALL_RUNTIME.filterNot { granted(it) }
                        if (toAsk.isNotEmpty()) launcherAll.launch(toAsk.toTypedArray())
                    },
                    accent = t.neonSecondary
                )
            }
            Spacer(Modifier.height(12.dp))

            // GROUPS
            key(refresh) {
                LazyColumn(modifier = Modifier.fillMaxSize()) {
                    items(PermissionGroups.ALL_GROUPS) { g ->
                        val allOk = g.perms.all { granted(it) }
                        NeonCard(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp),
                            accent = if (allOk) t.neonPrimary else t.neonSecondary
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    if (allOk) Icons.Filled.CheckCircle else Icons.Filled.RadioButtonUnchecked,
                                    contentDescription = null,
                                    tint = if (allOk) t.neonPrimary else t.neonSecondary
                                )
                                Spacer(Modifier.width(8.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(g.title.uppercase(), style = CyberType.title, color = t.onBg)
                                    Text(
                                        g.perms.joinToString { it.substringAfterLast('.') },
                                        style = CyberType.small, color = t.onBgMuted
                                    )
                                }
                                NeonButton(
                                    label = if (allOk) "OK" else "GRANT",
                                    onClick = {
                                        val miss = g.perms.filterNot { granted(it) }
                                        if (miss.isNotEmpty()) launcher.launch(miss.toTypedArray())
                                    },
                                    accent = if (allOk) t.neonPrimary else t.neonSecondary,
                                    enabled = !allOk
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
