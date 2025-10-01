# Voice Features Guide

## Overview

Milla Rayne now supports voice input and output, allowing for a more natural and hands-free conversation experience.

## Features

### 1. Text-to-Speech (Voice Output)
- **Toggle**: Click the "🔊 Voice On/Off" button
- **Auto-speak**: When enabled, Milla will speak her responses aloud
- **Voice Selection**: Uses the best available female voice on your system
- **Natural Speech**: Configured for natural speaking rate and pitch

### 2. Speech-to-Text (Voice Input)
- **Toggle**: Click the "🎙️ Speak" button or the microphone button in the input field
- **Real-time Recognition**: Your speech is converted to text in real-time
- **Auto-submit**: After speaking, you can review and edit before sending
- **Visual Feedback**: Button pulses while listening

## Browser Compatibility

### Fully Supported
- ✅ **Google Chrome** (Desktop & Android)
- ✅ **Microsoft Edge** (Desktop)
- ✅ **Safari** (macOS & iOS)
- ✅ **Samsung Internet** (Android)

### Partially Supported
- ⚠️ **Firefox** (Limited speech recognition support)

### Not Supported
- ❌ Older browsers without Web Speech API

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

### Voice Settings

The application automatically selects the best available voice. To customize:

1. The system looks for female voices first
2. Common voice names: Samantha, Karen, Victoria
3. Falls back to the default system voice

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

## Troubleshooting

### Voice Output Not Working

**Issue**: No sound when Milla responds

**Solutions**:
1. Check system volume is not muted
2. Verify voice is enabled (🔊 icon)
3. Try refreshing the browser
4. Check browser console for errors
5. Ensure browser supports speech synthesis

**Test in browser console**:
```javascript
window.speechSynthesis.speak(new SpeechSynthesisUtterance('Test'));
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
- **Text-to-Speech**: Processed locally on your device
- **No Recording**: Your voice is not recorded or stored by the application
- **Transcripts Only**: Only the text transcription is sent to the server

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
- [ ] Voice selection dropdown
- [ ] Continuous listening mode
- [ ] Wake word activation ("Hey Milla")
- [ ] Voice activity detection
- [ ] Custom voice training
- [ ] Emotion detection from voice
- [ ] Background noise cancellation

## Support

For issues or questions:
1. Check browser console for errors
2. Verify browser compatibility
3. Test with different voices
4. Update your browser
5. Report issues on GitHub

## Technical Details

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
- Recognition Latency: ~100-500ms
- Synthesis Latency: ~50-200ms
- Memory Usage: Minimal (browser-managed)
- Network Usage: Depends on browser (may use cloud services)
