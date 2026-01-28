# Milla Rayne - Android App

Native Android application for Milla Rayne AI Companion.

## Overview

This is a native Android app built with Kotlin and Jetpack Compose that connects to the Milla Rayne server to provide an AI companion experience on Android devices.

## Features

- 💬 **Chat Interface**: Native Android chat UI with message bubbles
- 🎨 **Adaptive Scenes**: Beautiful background scenes that adapt to context
- 💾 **Local Storage**: Conversation history stored locally
- 🌐 **Server Integration**: Connects to Milla server API
- 🔌 **Offline Mode**: Works standalone without server connection
- 🤖 **Local AI Responses**: Pattern-based response generation for common queries
- ⚡ **Edge Agent**: Local command processing for device controls
- 📱 **Material Design**: Modern Material 3 design components

## Requirements

- Android Studio Hedgehog (2023.1.1) or newer
- Minimum SDK: API 26 (Android 8.0)
- Target SDK: API 34 (Android 14)
- Kotlin 1.9+
- Gradle 8.0+

## Project Structure

```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/millarayne/
│   │       │   ├── MainActivity.kt           # Main entry point
│   │       │   ├── MillaApplication.kt       # Application class
│   │       │   ├── api/
│   │       │   │   ├── MillaApiService.kt    # API interface
│   │       │   │   └── MillaApiClient.kt     # API client setup
│   │       │   ├── data/
│   │       │   │   ├── Message.kt            # Message data model
│   │       │   │   ├── MessageDao.kt         # Room database DAO
│   │       │   │   └── AppDatabase.kt        # Room database
│   │       │   ├── ui/
│   │       │   │   ├── ChatScreen.kt         # Main chat screen
│   │       │   │   ├── MessageBubble.kt      # Message bubble component
│   │       │   │   └── theme/                # App theme
│   │       │   └── scene/                    # Scene components
│   │       ├── AndroidManifest.xml
│   │       └── res/                          # Resources
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── build.gradle.kts
├── gradle.properties
├── settings.gradle.kts
└── README.md                                 # This file
```

## Setup Instructions

### 1. Prerequisites

Install [Android Studio](https://developer.android.com/studio) if you haven't already.

### 2. Open Project

1. Open Android Studio
2. Select "Open an existing project"
3. Navigate to the `android` directory
4. Click "OK"

### 3. Configure Server URL

Edit `app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">Milla</string>
    <string name="api_base_url">http://10.0.2.2:5000</string> <!-- For emulator -->
    <!-- For physical device, use your computer's IP:
    <string name="api_base_url">http://192.168.1.x:5000</string>
    -->
</resources>
```

**Note**:

- `10.0.2.2` is the special IP for the emulator to reach the host machine's localhost
- For physical devices, use your computer's actual IP address on the local network

### 4. Sync Gradle

Click "Sync Project with Gradle Files" or let Android Studio do it automatically.

### 5. Run the App

1. Connect an Android device or start an emulator
2. Click the "Run" button (green triangle) in Android Studio

**The app now works in two modes:**

- **Online Mode** (with server): Full AI capabilities when server is running
  ```bash
  cd .. && npm run dev
  ```
  
- **Offline Mode** (standalone): Works without server with limited features
  - Pattern-based responses for common queries
  - Local device controls (volume, WiFi, etc.)
  - Time and date queries
  - Basic conversation capabilities

## Building

### Debug Build

```bash
./gradlew assembleDebug
```

The APK will be in `app/build/outputs/apk/debug/`

### Release Build

```bash
./gradlew assembleRelease
```

The APK will be in `app/build/outputs/apk/release/`

**Note**: Release builds require signing configuration in `app/build.gradle.kts`

## Dependencies

Main dependencies used:

- **Jetpack Compose**: Modern UI toolkit
- **Material 3**: Material Design components
- **Retrofit**: HTTP client for API calls
- **Room**: Local database for messages
- **Kotlin Coroutines**: Async operations
- **Coil**: Image loading

See `app/build.gradle.kts` for complete dependency list.

## Configuration

### Offline vs Online Mode

The app automatically detects if the server is available:

- **Offline Mode**: When the server is unreachable, the app uses a local AI response generator
  - Handles basic queries and conversations
  - Provides device control commands
  - Shows "🔌 Offline Mode" indicator
  
- **Online Mode**: When connected to the server, full AI capabilities are available
  - Advanced AI responses
  - Full context awareness
  - Scene adaptation

You can use the app without ever connecting to a server! The offline mode provides a standalone AI companion experience.

### API Endpoint

Update the API URL in one of these places:

1. **Hardcoded** (for testing): `MillaApiClient.kt`
   - Default: `http://10.0.2.2:5000/` (Android emulator localhost)
   - For physical device: Use your computer's IP (e.g., `http://192.168.1.100:5000`)
2. **Resources**: `res/values/strings.xml`
3. **Environment** (production): Use BuildConfig

**Note:** The default server URL (`10.0.2.2:5000`) is for Android emulator to access the host machine's localhost. For physical devices, you need to change this to your computer's actual IP address on the local network.

### Database

The app uses Room for local storage. Database schema is defined in:

- `data/AppDatabase.kt`
- `data/MessageDao.kt`

To clear the database:

```bash
adb shell pm clear com.millarayne
```

## Permissions

The app requires:

- `INTERNET`: To connect to the Milla server

Declared in `AndroidManifest.xml`

## Troubleshooting

### Cannot Connect to Server

**Emulator**: Make sure you're using `http://10.0.2.2:5000` as the API URL

**Physical Device**:

1. Ensure your device and computer are on the same network
2. Use your computer's IP address (e.g., `http://192.168.1.100:5000`)
3. Make sure your firewall allows connections on port 5000

Find your IP:

- **macOS/Linux**: `ifconfig` or `ip addr`
- **Windows**: `ipconfig`

### Build Errors

1. Clean and rebuild:

   ```bash
   ./gradlew clean build
   ```

2. Invalidate caches in Android Studio:
   - File → Invalidate Caches / Restart

3. Update Gradle and dependencies:
   ```bash
   ./gradlew wrapper --gradle-version=8.4
   ```

### App Crashes

Check logcat in Android Studio for error details:

```bash
adb logcat -s MillaApp
```

## Development

### Code Style

The project follows [Kotlin coding conventions](https://kotlinlang.org/docs/coding-conventions.html).

Format code: **Ctrl+Alt+L** (Windows/Linux) or **Cmd+Option+L** (macOS)

### Testing

Run unit tests:

```bash
./gradlew test
```

Run instrumented tests:

```bash
./gradlew connectedAndroidTest
```

## Architecture

The app follows Clean Architecture principles:

- **UI Layer**: Composables in `ui/` package
- **Data Layer**: Room database and API in `data/` and `api/` packages
- **Domain Layer**: Business logic (to be expanded)

## Screenshots

_(Screenshots to be added after implementation)_

## Offline Mode Capabilities

The app's offline mode provides a robust standalone experience:

### ✅ What Works Offline

**Basic Conversation:**
- Greetings and farewells
- Simple questions and answers
- Thank you responses
- Identity questions ("Who are you?", "What's your name?")

**Utilities:**
- Current time and date
- Day of the week
- Basic math calculations (e.g., "what is 5 + 3?")
- Jokes and motivational quotes

**Device Control:**
- Volume up/down
- Mute/unmute
- Media playback control (play/pause)
- WiFi settings access
- Brightness controls

**Smart Home (placeholder):**
- Light on/off commands
- Thermostat controls
- Extensible plugin system

### ❌ What Requires Server

- Advanced AI conversations
- Web search and external data
- Weather information
- Detailed tutorials and how-to guides
- Context-aware scene adaptation
- Voice synthesis
- Image processing

### 🔧 How It Works

1. **Automatic Fallback**: The app first tries to connect to the server. If unavailable, it automatically switches to offline mode.

2. **Pattern Matching**: Uses intelligent pattern matching to recognize common queries and respond appropriately.

3. **Edge Processing**: Leverages the LocalEdgeAgent for instant device control without network latency.

4. **Local Storage**: All conversations are stored locally in Room database, available offline.

### 💡 Optimization Tips

To make the most of offline mode:

1. **Pre-download Capabilities**: Future versions could include downloadable AI models
2. **Cached Responses**: Frequently asked questions could be cached
3. **Local Knowledge Base**: Common information stored locally
4. **Offline Training**: Learn from user patterns to improve responses

## Performance Optimizations

The Android app is optimized for both online and offline operation:

### Build Optimizations

- **ProGuard/R8**: Enabled in release builds for code shrinking and obfuscation
- **Minification**: Reduces APK size by removing unused code
- **Native Libraries**: Compiled for multiple architectures (arm64-v8a, armeabi-v7a)

### Runtime Optimizations

- **Coroutines**: All network and database operations run on background threads
- **Room Database**: Efficient local storage with Flow-based reactive queries
- **Compose UI**: Modern declarative UI with built-in performance optimizations
- **Memory Management**: Proper lifecycle handling prevents memory leaks
- **Lazy Loading**: Messages loaded efficiently with LazyColumn

### Network Optimizations

- **Timeout Configuration**: 30-second timeouts prevent hanging
- **Connection Pooling**: OkHttp client reuses connections
- **Offline Fallback**: Instant switch to local processing when server unavailable
- **Response Caching**: Local database caches all messages

### Battery Optimizations

- **Foreground Only**: No background services consuming battery
- **Efficient Queries**: Database queries optimized with indexes
- **Minimal Wake Locks**: No unnecessary wake locks or alarms

## Known Limitations
- **Offline mode limitations:**
  - Pattern-based responses only (not true AI)
  - Limited knowledge base
  - Cannot access external services (weather, web search, etc.)
  - Basic command processing only

## Contributing

This is part of the Milla Rayne project. See the main repository README for contribution guidelines.

## License

MIT License - Same as the main Milla Rayne project
