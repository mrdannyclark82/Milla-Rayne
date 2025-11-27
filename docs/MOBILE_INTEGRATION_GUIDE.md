# Mobile App Integration Guide (Android)

## Overview

This guide documents the integration approach for using Milla Rayne in an Android mobile application.

## Current Web Implementation

The current web application provides:

- Real-time chat interface with Milla
- Voice input/output capabilities
- Adaptive scene rendering based on location (living_room, kitchen, bedroom, etc.)
- Browser integration tools for external services

## Android Integration Approach

### 1. WebView Integration (Recommended for MVP)

The simplest approach is to embed the web application in a WebView:

```kotlin
// MainActivity.kt
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MillaRayneTheme {
                WebViewScreen(url = "https://your-milla-deployment.com")
            }
        }
    }
}

@Composable
fun WebViewScreen(url: String) {
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.mediaPlaybackRequiresUserGesture = false

                webViewClient = WebViewClient()
                webChromeClient = WebChromeClient()

                loadUrl(url)
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}
```

### 2. Native Android App (Full Rewrite)

For a fully native experience, you would need to:

1. **Implement Chat UI in Jetpack Compose**
   - Use the adaptive scene system from `/android/` directory
   - Build chat interface with Material3 components

2. **Connect to Backend API**
   - Use Retrofit or Ktor for HTTP requests
   - Connect to `/api/chat` endpoint
   - Handle scene context updates

3. **Voice Integration**
   - Use Android SpeechRecognizer for voice input
   - Use TextToSpeech for voice output

### 3. React Native (Hybrid Approach)

Reuse the existing React components with React Native:

```bash
# Initialize React Native project
npx react-native init MillaRayneApp

# Install dependencies
npm install react-native-webview
npm install @react-native-voice/voice
npm install react-native-tts
```

## Browser Integration for Google Services

The application now includes browser integration capabilities for:

- **Google Keep**: Add notes programmatically
- **Google Calendar**: Create calendar events
- **Web Browser**: Navigate to websites
- **Web Search**: Perform searches

### Implementation Status

- ✅ Browser integration service created (`server/browserIntegrationService.ts`)
- ✅ Tool detection added to chat flow
- ✅ Context injected into AI responses
- ⚠️ Actual browser automation requires additional setup

### Full Browser Automation Setup (Optional)

To enable actual browser automation with Google services:

1. **Install Python dependencies**:

   ```bash
   pip install playwright
   playwright install chromium
   ```

2. **Set up Google OAuth** (for Keep and Calendar access):
   - Create a Google Cloud Project
   - Enable Keep API and Calendar API
   - Set up OAuth 2.0 credentials
   - Store credentials securely in environment variables

3. **Update browserIntegrationService.ts** to call Python script:

   ```typescript
   import { spawn } from 'child_process';

   export async function executeAuthenticatedBrowserAction(
     action: string,
     params: any
   ): Promise<BrowserToolResult> {
     return new Promise((resolve, reject) => {
       const pythonProcess = spawn('python', [
         'browser.py',
         action,
         JSON.stringify(params),
       ]);

       // Handle response...
     });
   }
   ```

## Scene Focus Configuration

### Default Scene Location

The default scene has been set to `'living_room'` instead of `'unknown'`:

- **Client**: `client/src/App.tsx` - Line 41
- **Server**: `server/routes.ts` - Line 30

This ensures Milla always starts conversations in the living room scene, providing better context and immersion.

### Scene Stay-In Reminder

The persona configuration already includes strong scene focus instructions:

- Located in `shared/millaPersona.ts`
- Part of `MILLA_ABSOLUTE_REQUIREMENTS_COMPREHENSIVE`
- Rule #10: "STAY IN THE SCENE - When engaged in roleplay or a specific scenario, remain present in that moment without breaking into unrelated memories or long tangents"

## Mobile-Specific Considerations

### Voice Input/Output

- Enable microphone permissions in Android manifest
- Request permissions at runtime
- Handle voice interruption gracefully

### Offline Support

- Implement local caching for recent conversations
- Store scene state locally
- Provide offline fallback responses

### Performance

- Optimize image loading for mobile networks
- Implement lazy loading for scene backgrounds
- Reduce API call frequency when possible

### Battery Optimization

- Pause animations when app is in background
- Reduce polling frequency
- Implement efficient WebSocket connections for real-time updates

## Testing Checklist

- [ ] WebView loads application correctly
- [ ] Voice input works on mobile device
- [ ] Voice output plays without issues
- [ ] Scene backgrounds load properly
- [ ] Chat interface is responsive on different screen sizes
- [ ] Browser integration tools are acknowledged in responses
- [ ] Default scene is 'living_room' on startup
- [ ] Permissions are requested appropriately

## Security Considerations

1. **Google Account Integration**
   - Use OAuth 2.0 for authentication
   - Never store passwords in plain text
   - Use secure credential storage (Android Keystore)
   - Implement token refresh logic

2. **API Keys**
   - Store API keys in environment variables
   - Never commit API keys to version control
   - Use Android's BuildConfig for API key management

3. **Data Privacy**
   - Encrypt conversation history on device
   - Implement secure data transmission (HTTPS)
   - Follow GDPR guidelines for data storage

## Next Steps

1. **Choose Integration Approach**: WebView (quick) vs Native (best UX) vs React Native (balanced)
2. **Set up Google Cloud Project**: Enable APIs and create OAuth credentials
3. **Implement Browser Automation**: Connect browserIntegrationService to actual browser control
4. **Test on Android Devices**: Various screen sizes and Android versions
5. **Optimize Performance**: Profile and optimize for mobile constraints
6. **Deploy Backend**: Ensure server is accessible from mobile app

## Resources

- [Android WebView Documentation](https://developer.android.com/reference/android/webkit/WebView)
- [Jetpack Compose](https://developer.android.com/jetpack/compose)
- [React Native](https://reactnative.dev/)
- [Google Calendar API](https://developers.google.com/calendar)
- [Google Keep API](https://developers.google.com/keep)
- [Playwright Browser Automation](https://playwright.dev/)
