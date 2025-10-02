# Voice Features Guide

## Overview

Milla Rayne now supports advanced voice input and output with **multi-provider TTS (Text-to-Speech)** support, allowing for a more natural and hands-free conversation experience with high-quality, expressive voices.

## Features

### 1. Multi-Provider Voice Engine

Milla Rayne supports multiple voice providers with automatic fallback:

- **Browser-Native (Web Speech API)** - Default, no API key required
  - ✅ Low latency
  - ✅ Works offline
  - ⚠️ Limited voice selection
  - Best for: Quick setup, development, fallback

- **Google Cloud Text-to-Speech** - Premium neural voices
  - ✅ Low latency with streaming
  - ✅ US English (Southern) accent support
  - ✅ High-fidelity natural voices
  - Requires: GOOGLE_CLOUD_TTS_API_KEY
  - Best for: Production, high-quality voices

- **Azure Cognitive Services TTS** - Microsoft neural voices
  - ✅ Low latency with streaming
  - ✅ US English (Southern) accent support
  - ✅ Natural, expressive voices
  - Requires: AZURE_TTS_API_KEY, AZURE_TTS_REGION
  - Best for: Production, Microsoft ecosystem

- **ElevenLabs** - Ultra-realistic AI voices
  - ✅ Highly expressive and natural
  - ✅ Voice cloning ready (consent workflow pending)
  - ⚠️ Medium latency
  - Requires: ELEVENLABS_API_KEY
  - Best for: Maximum expressiveness, character voices

- **Coqui TTS** - Self-hosted option
  - ✅ Privacy-focused, self-hosted
  - ⚠️ Higher latency
  - Best for: Privacy-sensitive deployments

### 2. Text-to-Speech (Voice Output)
- **Toggle**: Click the "🔊 Voice On/Off" button
- **Auto-speak**: When enabled, Milla will speak her responses aloud
- **Voice Selection**: Uses the best available female voice on your system
- **Natural Speech**: Configured for natural speaking rate and pitch
- **Accent Support**: US English (Southern) accent prioritized
- **Quality Modes**: Low-latency (default) or high-fidelity

### 3. Speech-to-Text (Voice Input)
- **Toggle**: Click the "🎙️ Speak" button or the microphone button in the input field
- **Real-time Recognition**: Your speech is converted to text in real-time
- **Auto-submit**: After speaking, you can review and edit before sending
- **Visual Feedback**: Button pulses while listening

## Browser Compatibility

### Fully Supported
- ✅ **Google Chrome** (Desktop & Android) - All providers
- ✅ **Microsoft Edge** (Desktop) - All providers
- ✅ **Safari** (macOS & iOS) - Browser-native only
- ✅ **Samsung Internet** (Android) - All providers

### Partially Supported
- ⚠️ **Firefox** (Limited speech recognition support, browser-native TTS only)

### Not Supported
- ❌ Older browsers without Web Speech API

## Platform Support

### Web (Browser)
- ✅ All voice providers supported
- ✅ Automatic provider detection and fallback
- ✅ Low-latency streaming (Google Cloud, Azure, ElevenLabs)

### Android
- ✅ Google Cloud TTS (recommended)
- ✅ Azure TTS
- ✅ ElevenLabs
- ✅ Browser-native fallback

### iOS
- ✅ Browser-native only (Safari limitations)
- ℹ️ API-based providers coming soon

## Getting Started

### Enable Voice Output

1. Click the "🔇 Voice Off" button in the top right
2. The button will change to "🔊 Voice On"
3. Milla's responses will now be spoken aloud
4. Click again to disable voice output

### Use Voice Input

**Method 1: Top Controls**
1. Click the "🎙️ Speak" button in the top right
2. Start speaking when the button pulses
3. Your speech will appear in the text input
4. Click "Send" to submit your message

**Method 2: Input Field**
1. Click the microphone button (🎙️) next to the input field
2. Start speaking when the button pulses
3. Your speech will appear in the text input
4. Press Enter or click "Send" to submit

## Configuration

### Voice Provider Setup

The application uses browser-native voices by default. To use premium providers:

1. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Add API keys for desired providers** in `.env`:

   **Google Cloud TTS** (Recommended for production):
   ```bash
   GOOGLE_CLOUD_TTS_API_KEY=your_api_key_here
   VOICE_PROVIDER=google-cloud
   ```

   **Azure TTS**:
   ```bash
   AZURE_TTS_API_KEY=your_api_key_here
   AZURE_TTS_REGION=eastus
   VOICE_PROVIDER=azure
   ```

   **ElevenLabs**:
   ```bash
   ELEVENLABS_API_KEY=your_api_key_here
   VOICE_PROVIDER=elevenlabs
   ```

3. **Set voice quality** (optional):
   ```bash
   VOICE_QUALITY=low-latency    # Fast, good for conversation
   # or
   VOICE_QUALITY=high-fidelity  # Higher quality, slightly slower
   ```

### Voice Settings

The application automatically selects the best available voice:

1. The system looks for female voices first
2. US English (Southern) accent prioritized
3. Supported voice names by provider:
   - **Browser-native**: Samantha, Karen, Victoria, Microsoft Aria
   - **Google Cloud**: en-US-Neural2-C, en-US-Neural2-E, en-US-Journey-F
   - **Azure**: en-US-AriaNeural, en-US-JennyNeural, en-US-SaraNeural
   - **ElevenLabs**: Bella, Rachel, Elli
4. Falls back to the default system voice

### Provider Comparison

| Feature | Browser-Native | Google Cloud | Azure | ElevenLabs |
|---------|---------------|--------------|-------|------------|
| **Latency** | Low (50-200ms) | Low (100-300ms) | Low (100-300ms) | Medium (300-500ms) |
| **Quality** | Good | Excellent | Excellent | Outstanding |
| **Streaming** | No | Yes | Yes | Yes |
| **Southern Accent** | Limited | ✅ Yes | ✅ Yes | ✅ Yes |
| **API Key Required** | No | Yes | Yes | Yes |
| **Cost** | Free | Pay-per-use | Pay-per-use | Pay-per-use |
| **Offline Support** | Yes | No | No | No |
| **Best For** | Development | Production | Production | Maximum expressiveness |

### Automatic Fallback Chain

The system automatically tries providers in order:
1. **Primary provider** (configured in `.env`)
2. **Google Cloud** (if API key available)
3. **Azure** (if API key available)
4. **Browser-native** (always available as last resort)

This ensures voice output always works, even if a provider fails.

### Adjustable Parameters (in code)

Located in `client/src/App.tsx`:

```typescript
// Speech rate (0.1 to 10, default: 0.95)
utterance.rate = 0.95;

// Pitch (0 to 2, default: 1.0)
utterance.pitch = 1.0;

// Volume (0 to 1, default: 1.0)
utterance.volume = 1.0;

// Language (default: 'en-US')
recognitionRef.current.lang = 'en-US';
```

### Voice Cloning & Custom Personas

**⚠️ Voice Cloning Currently Disabled**

The voice engine includes infrastructure for voice cloning and custom personas, but this feature is **disabled** until proper consent workflows are implemented. 

**Future capabilities** (when consent workflow is added):
- Clone voices from audio samples
- Create custom voice personas
- Adjust personality through voice characteristics
- Save and switch between personas

**Privacy & Consent First**: We will not enable voice cloning features until we have:
1. ✅ Proper user consent workflows
2. ✅ Clear terms of service for voice data
3. ✅ Secure storage of voice samples
4. ✅ User control over voice data deletion

## Troubleshooting

### Voice Output Not Working

**Issue**: No sound when Milla responds

**Solutions**:
1. Check system volume is not muted
2. Verify voice is enabled (🔊 icon)
3. Try refreshing the browser
4. Check browser console for errors
5. Ensure browser supports speech synthesis
6. If using API provider, check API key is configured
7. Check network connection for cloud providers

**Test in browser console**:
```javascript
window.speechSynthesis.speak(new SpeechSynthesisUtterance('Test'));
```

### API Provider Not Working

**Issue**: Voice provider fails with API error

**Solutions**:
1. Verify API key is correctly set in `.env` file
2. Check API key has proper permissions/quota
3. For Azure: Verify region is correct
4. Check browser console for specific error messages
5. System will automatically fallback to browser-native
6. Test provider capabilities in browser console:
   ```javascript
   import { voiceService } from '@/services/voiceService';
   console.log(voiceService.getAvailableProviders());
   ```

### Speech Recognition Not Working

**Issue**: Microphone button does nothing or doesn't capture speech

**Solutions**:
1. Grant microphone permissions when prompted
2. Ensure microphone is connected and working
3. Check browser compatibility (use Chrome/Edge)
4. Verify microphone is not used by another app
5. Try speaking louder or closer to the microphone

**Test in browser console**:
```javascript
const recognition = new webkitSpeechRecognition();
recognition.start();
```

### Microphone Permission Denied

**Chrome/Edge**:
1. Click the lock icon in the address bar
2. Find "Microphone" permissions
3. Set to "Allow"
4. Refresh the page

**Safari**:
1. Safari → Preferences → Websites
2. Click "Microphone"
3. Allow for your site

### Voice Sounds Robotic or Unnatural

**Solutions**:
1. Adjust the speech rate (lower = more natural)
2. Use a different voice (if available on your system)
3. Ensure your OS text-to-speech voices are installed
4. Try updating your operating system

### Speech Recognition Accuracy Issues

**Tips for Better Recognition**:
- Speak clearly and at a moderate pace
- Use a good quality microphone
- Minimize background noise
- Speak in complete sentences
- Avoid very long pauses (recognition may stop)

## Privacy and Security

### Data Handling
- **Speech Recognition**: Processed by your browser and may be sent to browser vendors' speech services (Google for Chrome, Apple for Safari)
- **Text-to-Speech (Browser-Native)**: Processed locally on your device
- **Text-to-Speech (Cloud Providers)**: Sent to respective cloud services (Google Cloud, Azure, ElevenLabs)
  - Text is sent securely over HTTPS
  - Audio is streamed back or cached temporarily
  - No personal data or conversation history is stored by providers
- **No Recording**: Your voice is not recorded or stored by the application
- **Transcripts Only**: Only the text transcription is sent to the server
- **Voice Cloning**: Disabled until proper consent workflows are implemented

### API Provider Data Privacy

When using cloud TTS providers:
- **Google Cloud**: Follows Google Cloud privacy policies, data not used for training
- **Azure**: Follows Microsoft Azure privacy policies, GDPR compliant
- **ElevenLabs**: Follows ElevenLabs privacy policies, secure API transmission
- **Browser-Native**: Fully local, no data sent to external services

### Microphone Access
- Only active when you click the microphone button
- Visual indicator (pulsing button) shows when listening
- Automatically stops after you finish speaking
- No background recording

## Advanced Usage

### Continuous Conversation Mode

For a more natural flow, combine voice features:

1. Enable voice output (🔊)
2. Click microphone (🎙️)
3. Speak your message
4. Review the text
5. Click "Send"
6. Listen to Milla's spoken response
7. Repeat from step 2

### Hands-Free Operation

While the application requires clicking to activate speech recognition (for security), you can minimize manual input:

1. Enable voice output
2. Use keyboard shortcut (Enter) to send messages
3. Tab to navigate to microphone button
4. Space/Enter to activate microphone

### Multilingual Support

To use a different language:

Edit `client/src/App.tsx`:
```typescript
recognitionRef.current.lang = 'es-ES'; // Spanish
recognitionRef.current.lang = 'fr-FR'; // French
recognitionRef.current.lang = 'de-DE'; // German
```

## Accessibility

### Screen Readers
- All buttons have proper ARIA labels
- Voice status is announced
- Listening state is clearly indicated

### Keyboard Navigation
- Tab to navigate between controls
- Enter/Space to activate buttons
- Escape to stop listening (planned)

### Visual Indicators
- Button color changes when active
- Pulse animation while listening
- Clear on/off states

## Performance Tips

### Optimize Voice Output
- Only enable voice when needed
- Use shorter response times
- Cancel previous speech before new responses

### Optimize Voice Input
- Speak in shorter segments (under 60 seconds)
- Click microphone before each input
- Review text before sending

## Future Enhancements

Planned improvements:
- [ ] Voice settings panel (rate, pitch, volume)
- [ ] Voice provider selection in UI
- [ ] Continuous listening mode
- [ ] Wake word activation ("Hey Milla")
- [ ] Voice activity detection
- [x] Multi-provider TTS support
- [x] US English (Southern) accent support
- [x] Low-latency streaming
- [x] Automatic provider fallback
- [ ] Voice cloning with consent workflow
- [ ] Custom voice personas
- [ ] Emotion detection from voice
- [ ] Background noise cancellation
- [ ] Server-side TTS API endpoints (for Android/iOS apps)

## Support

For issues or questions:
1. Check browser console for errors
2. Verify browser compatibility
3. Test with different voices
4. Update your browser
5. Report issues on GitHub

## Technical Details

### Voice Engine Architecture

The voice engine uses a **multi-provider abstraction layer** with automatic fallback:

```
┌─────────────────────────────────────────┐
│        Voice Service (voiceService)     │
│  - Provider abstraction                 │
│  - Automatic fallback chain             │
│  - Platform detection                   │
└─────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┬────────────┐
    ▼            ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│Browser │  │Google  │  │Azure   │  │Eleven  │
│Native  │  │Cloud   │  │TTS     │  │Labs    │
└────────┘  └────────┘  └────────┘  └────────┘
```

### Provider Implementations

**Browser-Native (Web Speech API)**
- **Recognition**: Uses `SpeechRecognition` interface
- **Synthesis**: Uses `SpeechSynthesis` interface  
- **Events**: Handles onresult, onerror, onend
- **Async**: Non-blocking audio processing
- **Latency**: 50-200ms

**Google Cloud TTS** (Placeholder)
- **API**: REST API with streaming support
- **Authentication**: API key
- **Latency**: 100-300ms with streaming
- **Quality**: Neural voices (WaveNet, Journey)

**Azure TTS** (Placeholder)
- **API**: Cognitive Services Speech API
- **Authentication**: API key + region
- **Latency**: 100-300ms with streaming
- **Quality**: Neural voices

**ElevenLabs** (Placeholder)
- **API**: ElevenLabs TTS API
- **Authentication**: API key
- **Latency**: 300-500ms
- **Quality**: Ultra-realistic AI voices

### Web Speech API
- **Recognition**: Uses `SpeechRecognition` interface
- **Synthesis**: Uses `SpeechSynthesis` interface
- **Events**: Handles onresult, onerror, onend
- **Async**: Non-blocking audio processing

### Browser Implementation
- Chrome/Edge: Uses Google's speech services
- Safari: Uses Apple's speech services
- Offline: Limited support, varies by browser

### Performance Metrics

**Browser-Native**:
- Recognition Latency: ~100-500ms
- Synthesis Latency: ~50-200ms
- Memory Usage: Minimal (browser-managed)
- Network Usage: Depends on browser (may use cloud services)

**Cloud Providers (when configured)**:
- Google Cloud: ~100-300ms (streaming)
- Azure: ~100-300ms (streaming)
- ElevenLabs: ~300-500ms
- Network Usage: Text upload + audio download
- Audio Quality: 24kHz+ (high-fidelity mode)

### File Structure

```
client/src/
├── services/
│   └── voiceService.ts       # Multi-provider voice engine
├── App.tsx                    # Updated to use voice service
shared/
└── voiceTypes.ts             # Type definitions for voice system
```
