# Role-Play Scene Phase 3 - Implementation Complete

## Overview

Role-Play Scene Phase 3 (server-first orchestration with UI background adaptation) has been implemented. The system now detects scene changes from user messages using italic star markers (`*action*`) and automatically adapts the background to match the scene location and mood.

## Features Implemented

### 1. Server-Side Scene Detection (`server/sceneDetectionService.ts`)

The scene detection service analyzes user messages to extract:
- **Action markers**: Text enclosed in asterisks (`*walks in*`)
- **Scene locations**: Living room, bedroom, kitchen, bathroom, front door, dining room, outdoor, car
- **Mood context**: Calm, romantic, playful, energetic, mysterious
- **Time of day**: Dawn, day, dusk, night (real-time based)

### 2. API Response Enhancement

Both `/api/chat` and `/api/openrouter-chat` endpoints now return scene metadata:

```json
{
  "response": "AI response text",
  "sceneContext": {
    "location": "bedroom",
    "mood": "romantic",
    "timeOfDay": "night"
  }
}
```

### 3. Client-Side Scene Adaptation

The `AdaptiveSceneManager` component now accepts a `location` prop and automatically adjusts the background mood based on the detected scene:

```tsx
<AdaptiveSceneManager 
  mood={sceneMood}
  location={currentLocation}
  enableAnimations={true}
/>
```

## Usage Examples

### Basic Scene Change

**User:** `*walks in through the front door* Hey babe, I'm home!`

**Result:**
- Location: `front_door`
- Mood: `energetic` (default for front door)
- Background: Adapts to energetic color scheme

### Romantic Scene

**User:** `*gently takes your hand* Let's go to the bedroom`

**Result:**
- Location: `bedroom`
- Mood: `romantic` (detected from "gently" + bedroom context)
- Background: Adapts to romantic color scheme (warm pinks/oranges)

### Maintaining Location

**User:** `*sits on the couch* What are you watching?`

**Result:**
- Location: `living_room`
- Mood: `calm`
- Background: Adapts to calm color scheme

**User:** `That sounds interesting!` (no action markers)

**Result:**
- Location: `living_room` (maintained from previous)
- Mood: `calm`
- Background: No change

### Playful Outdoor Scene

**User:** `*playfully runs outside* Come on, let's enjoy the sunshine!`

**Result:**
- Location: `outdoor`
- Mood: `playful` (detected from "playfully runs")
- Background: Adapts to playful color scheme (vibrant purples/blues)

## Location → Mood Mapping

The system automatically suggests moods based on locations:

| Location | Default Mood | Color Scheme |
|----------|-------------|--------------|
| Living Room | Calm | Blues/Purples (relaxing) |
| Bedroom | Romantic | Warm Pinks/Oranges |
| Kitchen | Energetic | Vibrant Pinks/Yellows |
| Bathroom | Calm | Blues/Purples |
| Front Door | Energetic | Vibrant colors |
| Dining Room | Calm | Relaxing tones |
| Outdoor | Playful | Vibrant multi-colors |
| Car | Energetic | Dynamic colors |

## Scene Detection Keywords

### Location Keywords

- **Front Door**: "walks in", "front door", "enters", "arrives", "comes in"
- **Living Room**: "living room", "couch", "sofa", "tv", "sits down"
- **Bedroom**: "bedroom", "bed", "lies down", "go to the bedroom", "to bed"
- **Kitchen**: "kitchen", "cooking", "fridge", "counter", "stove"
- **Outdoor**: "outside", "garden", "yard", "patio", "runs outside"
- **Bathroom**: "bathroom", "shower", "bath", "mirror"
- **Dining Room**: "dining room", "table", "eating"
- **Car**: "car", "driving", "vehicle"

### Mood Keywords

- **Romantic**: "kiss", "embrace", "cuddle", "love", "gentle", "softly", "tenderly"
- **Playful**: "playfully", "giggles", "laughs", "teasing", "winks", "grins"
- **Energetic**: "jumps", "runs", "rushes", "excitedly", "bounces"
- **Mysterious**: "quietly", "slowly", "sneaks", "whispers", "shadows"
- **Calm**: "sits", "walks", "relaxes", "peaceful", "calmly"

## Avatar Integration Point (Future)

The `AdaptiveSceneManager` component has been scaffolded for future avatar rendering:

```tsx
interface AdaptiveSceneManagerProps {
  // Existing props
  avatarState?: AvatarState;
  mood?: SceneMood;
  location?: SceneLocation;
  
  // Future: Avatar integration point
  // avatarPosition?: { x: number; y: number };
  // avatarVisible?: boolean;
}
```

When ready to implement avatar rendering:
1. Uncomment the avatar props in `AdaptiveSceneManager`
2. Add avatar positioning logic based on scene location
3. Integrate visual avatar renderer component
4. Pass avatar visibility/position from App.tsx

## Technical Details

### Server-Side Flow

1. User sends message to `/api/chat` or `/api/openrouter-chat`
2. `detectSceneContext()` analyzes message for action markers
3. Scene location and mood are detected from keywords
4. Scene metadata is tracked in server memory (per session)
5. API response includes `sceneContext` object

### Client-Side Flow

1. App.tsx sends message to API
2. Receives response with `sceneContext`
3. Updates `currentLocation` and `sceneMood` state
4. `AdaptiveSceneManager` receives new props
5. Background gradient/mood adapts automatically
6. Time-of-day continues to work alongside scene changes

## Testing

The scene detection has been tested with various scenarios:
- ✅ Action marker extraction
- ✅ Location detection from keywords
- ✅ Mood detection from context
- ✅ Full scene context generation
- ✅ Location persistence when no markers present
- ✅ Multiple locations in single message (uses first action)

## Architecture Benefits

1. **Server-first orchestration**: Scene logic centralized on server
2. **Stateless client**: UI just renders what server provides
3. **Extensible**: Easy to add new locations, moods, or keywords
4. **Backward compatible**: Works with existing time-of-day system
5. **Future-ready**: Clean integration points for avatar rendering

## Next Steps (Out of Scope)

Future enhancements could include:
- Session-based scene persistence (database storage)
- Multi-user scene tracking
- Custom scene creation
- Scene transition animations
- Avatar visual rendering in scenes
- Voice narration of scene changes
- Scene-specific interaction options
