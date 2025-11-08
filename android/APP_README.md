# Milla Rayne - Android App

Native Android application for Milla Rayne AI Companion.

## Overview

This is a native Android app built with Kotlin and Jetpack Compose that connects to the Milla Rayne server to provide an AI companion experience on Android devices.

## Features

- 💬 **Chat Interface**: Native Android chat UI with message bubbles
- 🎨 **Adaptive Scenes**: Beautiful background scenes that adapt to context
- 💾 **Local Storage**: Conversation history stored locally
- 🌐 **Server Integration**: Connects to Milla server API
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
2. Make sure the Milla server is running on your computer:
   ```bash
   cd .. && npm run dev
   ```
3. Click the "Run" button (green triangle) in Android Studio

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

### API Endpoint

Update the API URL in one of these places:

1. **Hardcoded** (for testing): `MillaApiClient.kt`
2. **Resources**: `res/values/strings.xml`
3. **Environment** (production): Use BuildConfig

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

*(Screenshots to be added after implementation)*

## Known Limitations

- Voice features not yet implemented
- Image upload not yet supported
- Background scenes are CSS-only (no photo backgrounds)
- No offline mode (requires server connection)

## Contributing

This is part of the Milla Rayne project. See the main repository README for contribution guidelines.

## License

MIT License - Same as the main Milla Rayne project
