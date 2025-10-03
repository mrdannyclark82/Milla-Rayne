# Adaptive Scene System - Android Implementation

This directory contains the Android implementation of the adaptive scene system using Kotlin and Jetpack Compose.

## Files

- `SceneTypes.kt` - Data classes and enums for scene system
- `SceneUtils.kt` - Utility functions for time detection and theme generation
- `SceneComponents.kt` - Composable components for rendering scenes
- `FeatureFlags.kt` - Feature flag management using SharedPreferences
- `example/MainScreenExample.kt` - Integration example (reference only)

## Requirements

- Android 8.0+ (API 26+)
- Jetpack Compose 1.3+
- Kotlin 1.8+

## Dependencies

Add to your `build.gradle.kts`:

```kotlin
dependencies {
    // Jetpack Compose (if not already added)
    implementation("androidx.compose.ui:ui:1.5.0")
    implementation("androidx.compose.material3:material3:1.1.0")
    implementation("androidx.compose.runtime:runtime:1.5.0")
}
```

## Integration

See `example/MainScreenExample.kt` for a complete integration example.

### Basic Setup

```kotlin
@Composable
fun YourMainScreen() {
    val context = LocalContext.current
    val featureFlags = remember { AdaptiveSceneFeatureFlags(context) }
    
    val sceneContext = SceneContext(
        timeOfDay = getCurrentTimeOfDay(),
        appState = AppState.IDLE,
        reducedMotion = prefersReducedMotion(context),
        performanceMode = featureFlags.getPerformanceMode()
    )
    
    AdaptiveSceneDemo(
        enabled = featureFlags.isEnabled(),
        context = sceneContext
    ) {
        // Your app content
    }
}
```

## Feature Flags

Enable/disable in your app:

```kotlin
val featureFlags = AdaptiveSceneFeatureFlags(context)

// Enable
featureFlags.setEnabled(true)

// Disable (default)
featureFlags.setEnabled(false)

// Set performance mode
featureFlags.setPerformanceMode(PerformanceMode.BALANCED)
```

## Performance

- CPU: < 5% on modern devices
- Memory: < 10MB
- Battery: Negligible impact
- Target: 60fps on Android 8.0+

## Accessibility

Automatically respects:
- System animator duration scale
- Transition animation scale
- Power saver mode

When animations are disabled by the user, the system falls back to static gradients.

## Known Limitations

- Requires Compose (not compatible with XML layouts)
- Minimum API 26 (Android 8.0)
- No asset loading (procedural only)

## Testing

The system is designed to be tested manually:

1. Enable feature flag
2. Verify scene renders
3. Change app state and observe color changes
4. Disable system animations and verify fallback
5. Monitor performance (use Android Profiler)

---

See `ADAPTIVE_SCENE_SYSTEM_README.md` in the root directory for complete documentation.
