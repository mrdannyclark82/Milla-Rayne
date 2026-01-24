# December 8-17 Empire Updates - Integration Guide

This document explains how to integrate the new features added in the December 8-17 updates.

## New Components

### 1. MediaPipe Gemma Wrapper (`android/gemma-wrapper-mp.ts`)

A future-ready wrapper for MediaPipe's Gemma integration. Currently uses a mock implementation until the official MediaPipe LLM package is released.

**Usage:**
```typescript
import { gemmaMP } from './android/gemma-wrapper-mp';

// Initialize the model
await gemmaMP.setup('gemma-2b');

// Generate a response
const response = await gemmaMP.generate('Hello, how are you?', 512);
console.log(response);
```

### 2. Gemini 3 Reasoner (`server/dispatcher/gemini3-reason.ts`)

Edge reasoning fallback using Google's Gemini API. Currently uses Gemini 1.5 Flash as a stepping stone to Gemini 3.

**Usage:**
```typescript
import { gemini3R } from './server/dispatcher/gemini3-reason';

// Make sure GEMINI_API_KEY is set in your .env file
const response = await gemini3R.reason('What is the meaning of life?');
console.log(response);
```

### 3. Fallback Dispatcher (`server/dispatcher/fallback-dispatcher.ts`)

Multi-LLM fallback chain that tries local models first, then falls back to cloud services.

**Usage:**
```typescript
import { dispatchQuery } from './server/dispatcher/fallback-dispatcher';

// Use default provider (gemma-local)
const response1 = await dispatchQuery('Tell me a joke');

// Specify a provider
const response2 = await dispatchQuery('Tell me a joke', 'gemini3');
console.log(response2);
```

### 4. Low Power Privacy Component (`client/src/components/privacy/LowPowerPrivacy.tsx`)

A React component that displays the current privacy/power mode to users.

**Usage:**
```tsx
import LowPowerPrivacy from './client/src/components/privacy/LowPowerPrivacy';

function MyApp() {
  const [mode, setMode] = useState<'offline' | 'hybrid' | 'cloud'>('hybrid');
  
  return (
    <div>
      <LowPowerPrivacy mode={mode} />
      {/* Your other components */}
    </div>
  );
}
```

## Environment Variables

Make sure to add the following to your `.env` file:

```bash
# For Gemini 3 Reasoner fallback
GEMINI_API_KEY=your_gemini_api_key_here

# For local model support (optional)
ENABLE_LOCAL_MODEL=true
PREFER_LOCAL_MODEL=true
LOCAL_MODEL_PATH=locallm/gemma.tflite
```

## Integration Steps

1. **Import and use the dispatcher in your agent initialization:**
   ```typescript
   import { dispatchQuery } from './server/dispatcher/fallback-dispatcher';
   
   const response = await dispatchQuery(userInput);
   ```

2. **Add the LowPowerPrivacy component to your UI where mode toggles:**
   ```tsx
   <LowPowerPrivacy mode={currentMode} />
   ```

3. **Set up environment variables:**
   - Add `GEMINI_API_KEY` to your `.env` file for fallback support

4. **Test offline functionality:**
   ```bash
   # For Android
   yarn android
   # Then toggle airplane mode to test offline capabilities
   ```

## Architecture

The fallback system works as follows:

1. First tries local Gemma model (via MediaPipe or Ollama)
2. If local fails, falls back to Gemini 3 (currently Gemini 1.5 Flash)
3. If all fail, throws an error

This ensures maximum privacy and performance while maintaining reliability.

## Future Enhancements

- Replace mock MediaPipe implementation with official package when released
- Upgrade Gemini 1.5 Flash to Gemini 3 when available
- Add more LLM providers to the fallback chain
- Implement request caching for improved performance
- Add telemetry to track which provider is being used
