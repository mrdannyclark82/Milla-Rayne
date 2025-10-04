/**
 * Example Android Integration with Adaptive Scene System
 * This is a demo showing how to integrate the scene system into your Compose app
 * 
 * DO NOT USE THIS FILE DIRECTLY - it's a reference/example only
 */

package com.millarayne.scene.example

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.millarayne.scene.*

/**
 * Example main screen with adaptive scenes
 */
@Composable
fun MainScreenWithScenes() {
    val context = LocalContext.current
    
    // Get feature flags
    val featureFlags = remember { AdaptiveSceneFeatureFlags(context) }
    val scenesEnabled = featureFlags.isEnabled()
    
    // Track app state
    var appState by remember { mutableStateOf(AppState.IDLE) }
    var isListening by remember { mutableStateOf(false) }
    var isThinking by remember { mutableStateOf(false) }
    var isSpeaking by remember { mutableStateOf(false) }
    
    // Update app state based on current activity
    LaunchedEffect(isListening, isThinking, isSpeaking) {
        appState = when {
            isListening -> AppState.LISTENING
            isThinking -> AppState.THINKING
            isSpeaking -> AppState.SPEAKING
            else -> AppState.IDLE
        }
    }
    
    // Create scene context
    val sceneContext = remember(appState) {
        SceneContext(
            timeOfDay = getCurrentTimeOfDay(),
            appState = appState,
            reducedMotion = prefersReducedMotion(context),
            performanceMode = featureFlags.getPerformanceMode(),
            isBackgrounded = false // Would be managed by lifecycle
        )
    }
    
    // Wrap content with adaptive scene demo
    AdaptiveSceneDemo(
        enabled = scenesEnabled,
        context = sceneContext
    ) {
        // Your existing app content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Adaptive Scene System Demo")
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Example controls to change app state
            Button(onClick = { isListening = !isListening }) {
                Text(if (isListening) "Stop Listening" else "Start Listening")
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Button(onClick = { isThinking = !isThinking }) {
                Text(if (isThinking) "Stop Thinking" else "Start Thinking")
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Button(onClick = { isSpeaking = !isSpeaking }) {
                Text(if (isSpeaking) "Stop Speaking" else "Start Speaking")
            }
        }
    }
}

/**
 * INTEGRATION NOTES:
 * 
 * 1. Wrap your main screen content with AdaptiveSceneDemo
 * 2. Pass enabled parameter from feature flags
 * 3. Update appState based on your app's current state:
 *    - AppState.IDLE: Default state
 *    - AppState.LISTENING: When user is speaking/recording
 *    - AppState.THINKING: When AI is processing
 *    - AppState.SPEAKING: When AI is responding with voice
 * 
 * 4. When enabled=false, AdaptiveSceneDemo renders content only (zero overhead)
 * 
 * 5. To enable in development:
 *    val featureFlags = AdaptiveSceneFeatureFlags(context)
 *    featureFlags.setEnabled(true)
 * 
 * 6. The scene system will automatically:
 *    - Adapt to time of day
 *    - Respect reduced motion preferences (system animator scale)
 *    - Respect power saver mode
 *    - Adjust based on performance mode
 * 
 * 7. Monitor app lifecycle to update isBackgrounded:
 *    - Use onPause/onResume to set context.isBackgrounded
 *    - This pauses animations when app is in background
 */
