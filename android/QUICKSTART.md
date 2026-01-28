# Milla Rayne Android App - Quick Start Guide

## Getting Started in 5 Minutes

### Option 1: Offline Mode (No Server Required)

The easiest way to start using Milla Rayne on Android!

1. **Build the APK:**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

2. **Install on your device:**
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Launch and chat!**
   - Open the Milla app
   - Start chatting immediately
   - The app works 100% offline with no server needed

**What you can do offline:**
- ✅ Have basic conversations
- ✅ Get time and date
- ✅ Control device volume
- ✅ Solve simple math
- ✅ Get jokes and motivation

### Option 2: Full Online Mode (With Server)

For advanced AI capabilities:

1. **Start the server on your computer:**
   ```bash
   cd /path/to/Milla-Rayne
   npm run dev
   ```

2. **Find your computer's IP address:**
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig` or `ip addr`
   - Look for something like `192.168.1.100`

3. **Update the app's server URL:**
   Edit `android/app/src/main/java/com/millarayne/api/MillaApiClient.kt`:
   ```kotlin
   private const val BASE_URL = "http://YOUR_IP_HERE:5000/"
   ```

4. **Build and install:**
   ```bash
   ./gradlew assembleDebug
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

5. **Enjoy full AI features!**

## Quick Commands to Try

### Offline Mode
- "Hello!" - Get a friendly greeting
- "What time is it?" - Current time
- "Tell me a joke" - Random joke
- "What is 25 + 17?" - Basic math
- "Volume up" - Increase volume
- "Help" - See what I can do

### Online Mode
Everything above, plus:
- Complex questions and conversations
- Weather information
- Web searches
- Tutorial requests
- Context-aware responses

## Troubleshooting

**App won't connect to server?**
- Don't worry! The app automatically switches to offline mode
- You can still use all offline features

**Want to force offline mode?**
- Just use the app without starting the server
- Or disconnect from WiFi/mobile data

**App crashes?**
- Check logs: `adb logcat -s MillaApp`
- Report issues on GitHub

## Next Steps

- Explore the [Full README](APP_README.md) for detailed documentation
- Check the [Architecture](APP_README.md#architecture) section
- Learn about [Performance Optimizations](APP_README.md#performance-optimizations)

---

**Pro Tip:** The app saves all conversations locally, so you can review your chat history anytime, even in offline mode!
