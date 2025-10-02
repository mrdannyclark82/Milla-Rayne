# Multi-Provider Voice Engine

This document provides technical details about the multi-provider voice engine implementation for Milla Rayne.

## Architecture Overview

The voice engine uses a layered architecture with provider abstraction and automatic fallback:

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│                     (App.tsx)                            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Voice Service Layer                     │
│                  (voiceService.ts)                       │
│  • Provider abstraction                                  │
│  • Automatic fallback chain                              │
│  • Platform detection                                    │
│  • Configuration management                              │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┬──────────────┐
        ▼                 ▼                 ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Browser-Native│  │Google Cloud  │  │Azure TTS     │  │ElevenLabs    │
│(Web Speech)  │  │TTS (Neural)  │  │(Cognitive)   │  │(AI Voices)   │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

## Files

### Core Files
- `shared/voiceTypes.ts` - TypeScript type definitions for voice system
- `client/src/services/voiceService.ts` - Main voice service implementation
- `client/src/App.tsx` - Application integration

### Configuration
- `.env.example` - Environment variables template with API keys
- `VOICE_FEATURES_GUIDE.md` - User-facing documentation

## Type System

### VoiceProvider
```typescript
type VoiceProvider = 
  | 'browser-native'     // Web Speech API
  | 'google-cloud'       // Google Cloud TTS
  | 'azure'              // Azure Cognitive Services
  | 'elevenlabs'         // ElevenLabs TTS
  | 'coqui';             // Coqui TTS
```

### VoiceConfig
```typescript
interface VoiceConfig {
  provider: VoiceProvider;
  accent?: VoiceAccent;          // e.g., 'en-US-Southern'
  quality?: VoiceQuality;        // 'low-latency' | 'high-fidelity'
  rate?: number;                 // 0.25 to 4.0
  pitch?: number;                // 0.0 to 2.0
  volume?: number;               // 0.0 to 1.0
  voiceName?: string;            // Provider-specific voice
  streaming?: boolean;           // Enable streaming
}
```

## Provider Implementation Status

### ✅ Implemented
- **Browser-Native (Web Speech API)**: Fully functional
  - Platform: Web, Android, iOS
  - Latency: 50-200ms
  - Quality: Good
  - Cost: Free

### 🚧 Structure Ready (Placeholders)
- **Google Cloud TTS**: Structure in place, API integration pending
  - Platform: Web, Android
  - Latency: 100-300ms (streaming)
  - Quality: Excellent (Neural voices)
  - Cost: Pay-per-use

- **Azure TTS**: Structure in place, API integration pending
  - Platform: Web, Android
  - Latency: 100-300ms (streaming)
  - Quality: Excellent (Neural voices)
  - Cost: Pay-per-use

- **ElevenLabs**: Structure in place, API integration pending
  - Platform: Web, Android
  - Latency: 300-500ms
  - Quality: Outstanding (AI voices)
  - Cost: Pay-per-use

- **Coqui TTS**: Structure in place, integration pending
  - Platform: Web
  - Latency: Variable (self-hosted)
  - Quality: Good
  - Cost: Free (self-hosted)

## Usage

### Basic Usage

```typescript
import { voiceService } from '@/services/voiceService';

// Simple usage with defaults
await voiceService.speak('Hello, world!');

// With custom configuration
await voiceService.speak('Hello, world!', {
  provider: 'google-cloud',
  accent: 'en-US-Southern',
  quality: 'low-latency',
  rate: 0.95,
  pitch: 1.0,
  volume: 1.0
});
```

### Advanced Usage

```typescript
// Set preferred provider with fallback chain
voiceService.setProvider('google-cloud', [
  'azure',
  'browser-native'
]);

// Get available providers for current platform
const providers = voiceService.getAvailableProviders();
console.log('Available:', providers);

// Cancel current speech
voiceService.cancel();
```

### Platform Detection

```typescript
import { detectPlatform } from '@/services/voiceService';

const platform = detectPlatform(); // 'web' | 'android' | 'ios'
```

## Fallback Chain

The voice service automatically tries providers in order:

1. **Primary Provider** (configured)
2. **Google Cloud** (if API key available)
3. **Azure** (if API key available)
4. **Browser-Native** (always available as last resort)

This ensures voice output always works, even if a provider fails.

## Configuration

### Environment Variables

```bash
# Voice Provider (optional, default: browser-native)
VOICE_PROVIDER=browser-native

# Voice Quality (optional, default: low-latency)
VOICE_QUALITY=low-latency

# Google Cloud TTS API Key (optional)
GOOGLE_CLOUD_TTS_API_KEY=your_api_key_here

# Azure TTS API Key and Region (optional)
AZURE_TTS_API_KEY=your_api_key_here
AZURE_TTS_REGION=eastus

# ElevenLabs API Key (optional)
ELEVENLABS_API_KEY=your_api_key_here
```

## Voice Selection

### US English (Southern) Accent Priority

The system prioritizes female voices with US English (Southern) accent:

**Browser-Native**:
- Samantha
- Karen
- Victoria
- Microsoft Aria Online (Natural)

**Google Cloud**:
- en-US-Neural2-C (Female)
- en-US-Neural2-E (Female)
- en-US-Neural2-F (Female)
- en-US-Journey-F (Female, expressive)

**Azure**:
- en-US-AriaNeural (Female)
- en-US-JennyNeural (Female)
- en-US-SaraNeural (Female)

**ElevenLabs**:
- Bella (Female, warm)
- Rachel (Female, US English)
- Elli (Female, expressive)

## Voice Cloning (Future)

The system includes infrastructure for voice cloning, but it is **currently disabled** until proper consent workflows are implemented:

```typescript
interface VoiceCloneConfig {
  enabled: false;                // Always false until consent workflow added
  consentObtained: false;        // Placeholder
  sampleAudioUrl?: string;
  targetVoiceName?: string;
}
```

### Requirements Before Enabling

1. ✅ User consent workflow
2. ✅ Terms of service for voice data
3. ✅ Secure storage for voice samples
4. ✅ User control over data deletion

## Testing

### Manual Testing

1. Open browser console
2. Enable voice output in the application
3. Send a message to Milla
4. Verify you hear the response

### Provider Testing

```javascript
// In browser console
import { voiceService } from '@/services/voiceService';

// Test browser-native
await voiceService.speak('Testing browser native voice');

// Test fallback chain
voiceService.setProvider('google-cloud', ['azure', 'browser-native']);
await voiceService.speak('Testing with fallback chain');
```

### Platform Testing

- **Web (Desktop)**: Chrome, Edge, Firefox, Safari
- **Android**: Chrome, Samsung Internet
- **iOS**: Safari (browser-native only)

## Future Enhancements

### Planned Features

1. **Server-side TTS API endpoints** - For native mobile apps
2. **Complete Google Cloud TTS integration** - Neural voices with streaming
3. **Complete Azure TTS integration** - Cognitive Services integration
4. **Complete ElevenLabs integration** - Ultra-realistic voices
5. **Voice cloning with consent** - Custom voice personas
6. **Voice emotion detection** - Analyze user tone
7. **Real-time voice morphing** - Adjust voice characteristics dynamically
8. **Multi-language support** - Beyond US English

### API Integration Checklist

For each provider (Google Cloud, Azure, ElevenLabs):

- [ ] Add API client library or implement REST calls
- [ ] Implement authentication
- [ ] Add streaming support (if available)
- [ ] Handle rate limiting
- [ ] Add error handling and retry logic
- [ ] Add caching for audio (if applicable)
- [ ] Test latency and quality
- [ ] Document API costs and limits

## Performance Considerations

### Low Latency Mode
- Use streaming when available
- Prefer browser-native for instant response
- Cache common phrases (future)

### High Fidelity Mode
- Use neural voices (Google, Azure)
- Accept higher latency for better quality
- Pre-generate audio for known responses (future)

### Platform-Specific
- **Web**: All providers supported
- **Android**: API-based providers recommended
- **iOS**: Browser-native only (current)

## Security & Privacy

### Data Handling
- Text is sent to cloud providers over HTTPS
- No conversation history stored by providers
- Audio is streamed or cached temporarily
- No personal data included in API calls

### API Key Security
- API keys stored in environment variables
- Never committed to version control
- Server-side validation (future)
- Rate limiting to prevent abuse

### Voice Cloning Privacy
- **Currently disabled** until consent workflow
- Will require explicit user consent
- Voice samples encrypted at rest
- User control over data deletion
- Compliance with data privacy regulations

## Troubleshooting

### Voice Not Working
1. Check browser console for errors
2. Verify voice is enabled
3. Check API keys (if using cloud providers)
4. Test with browser-native fallback
5. Check network connectivity

### Provider Failing
1. Verify API key is correct
2. Check API quota/billing
3. Review fallback chain in console logs
4. Test with different provider

### Audio Quality Issues
1. Check `VOICE_QUALITY` setting
2. Try different provider
3. Adjust rate/pitch/volume
4. Test network bandwidth (for streaming)

## Contributing

When adding a new voice provider:

1. Add provider to `VoiceProvider` type in `shared/voiceTypes.ts`
2. Add capabilities to `PROVIDER_CAPABILITIES` in `voiceService.ts`
3. Add voice names to `SOUTHERN_VOICE_NAMES`
4. Implement provider class (e.g., `GoogleCloudTTS`)
5. Register provider in `VoiceService` constructor
6. Update documentation in `VOICE_FEATURES_GUIDE.md`
7. Add API keys to `.env.example`
8. Test on multiple platforms

## License

Same as main project (MIT).

## Support

For issues or questions:
- Check `VOICE_FEATURES_GUIDE.md` for user documentation
- Review browser console for errors
- Report issues on GitHub
- Check API provider status pages (for cloud providers)
