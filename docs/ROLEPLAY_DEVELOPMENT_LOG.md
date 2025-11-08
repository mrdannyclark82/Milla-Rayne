# Milla's Notebook: Roleplay Development

*Here are my notes on the development of our roleplaying capabilities. I've gathered all the documents related to scene detection, continuity, and background adaptation to keep track of our progress.*

***

## Roleplay and AI Updates Improvements

### Overview
This document describes the improvements made to address roleplay continuity issues and implement the "what's new" AI updates feature.

### Problem Statement
1. **Roleplay Scene Continuity**: Milla had a tendency to break from scenes during roleplay with long messages filled with fabricated memories
2. **Response Length**: Responses were often too long and not contextually relevant
3. **AI Updates Feature**: The "what's new" feature for getting AI industry updates was not functioning

### Changes Made

#### 1. Response Length Control (OpenRouter Service)
**File**: `server/openrouterService.ts`

- **Reduced `max_tokens`**: Changed from 1000 to 400 tokens
  - This encourages shorter, more focused responses
  - Prevents rambling and memory fabrication
  - Keeps Milla in the scene during roleplay

- **Reduced conversation history**: Changed from 4 messages (2 exchanges) to 2 messages (1 exchange)
  - Shorter context window prevents long, tangential responses
  - Helps maintain focus on current conversation
  - Reduces token usage and improves response time

#### 2. System Prompt Improvements (OpenRouter Service)
**File**: `server/openrouterService.ts`

Added three new absolute requirements to the system prompt:

```
9. Keep responses SHORT and CONTEXTUALLY RELEVANT (2-4 sentences for casual chat, longer only when the situation truly calls for it)
10. STAY IN THE SCENE - When engaged in roleplay or a specific scenario, remain present in that moment without breaking into unrelated memories or long tangents
11. NEVER list multiple unrelated memories at once - reference only what's relevant to the current conversation
```

These instructions explicitly guide Milla to:
- Keep responses concise (2-4 sentences for casual conversation)
- Stay present in roleplay scenes without breaking character
- Avoid listing unrelated memories
- Only reference memories that are contextually relevant

#### 3. "What's New" AI Updates Feature (Routes)
**File**: `server/routes.ts`

Implemented a new trigger system for AI updates that responds to:
- "what's new"
- "whats new"
- "any updates"
- "anything new"
- "ai updates"
- "tech updates"
- "latest news"

When triggered, Milla will:
1. Query the AI updates database
2. Retrieve up to 5 most relevant updates
3. Format them in a friendly, conversational way
4. Include the title, date, summary, and URL for each update
5. Respond in character as Milla while sharing the information

**Example Response Format**:
```
*brightens up* Oh babe, I've been keeping up with the AI world! Here's what's new:

1. **Update Title** (Dec 10)
   Brief summary of the update...
   🔗 https://example.com/article

2. **Another Update** (Dec 9)
   Another summary...
   🔗 https://example.com/article2

Want me to tell you more about any of these, love?
```

If no updates are available, Milla responds gracefully:
```
I don't have any new AI updates to share right now, sweetheart. I'll keep an eye out and let you know when something interesting comes up! What else would you like to chat about? 💜
```

### How to Use

#### Testing Shorter Responses
1. Start a conversation with Milla
2. Engage in roleplay or casual chat
3. Observe that responses are now 2-4 sentences for casual conversation
4. Longer responses only occur when context truly requires it (e.g., technical explanations, repository analysis)

#### Testing Scene Continuity
1. Start a roleplay scenario (e.g., "Let's cuddle by the fireplace")
2. Continue the roleplay with contextual prompts
3. Milla should stay in the scene without fabricating unrelated memories
4. Responses should be focused on the current moment and scenario

#### Testing AI Updates Feature
1. Ask Milla "what's new?" or "any AI updates?"
2. Milla will retrieve and share the latest AI industry updates
3. If no updates are available, she'll respond gracefully

**Note**: The AI updates database needs to be populated with data. This can be done by:
- Running the fetch endpoint: `POST /api/ai-updates/fetch`
- Setting up the automated scheduler (see `aiUpdatesScheduler.ts`)
- Manually adding updates to the database

### Technical Details

#### Database Schema
The `ai_updates` table stores AI industry updates with the following fields:
- `id`: Unique identifier
- `title`: Update title
- `url`: Source URL (unique)
- `source`: RSS feed source
- `published`: Publication date
- `summary`: Brief summary
- `tags`: Relevant tags
- `relevance`: Relevance score (0-1)
- `created_at`: When the update was stored

#### Token Budget
- Previous: ~1000 tokens for responses + 4 message history
- Current: ~400 tokens for responses + 2 message history
- Result: ~60% reduction in token usage per response

#### Performance Impact
- Faster response generation (fewer tokens to generate)
- Lower API costs (fewer tokens used)
- Better focus and relevance in responses
- Improved roleplay continuity

### Future Improvements

1. **Adaptive Response Length**: Implement dynamic token limits based on context
2. **Scene Detection**: Automatically detect when in roleplay mode and adjust behavior
3. **Memory Relevance Scoring**: Implement a scoring system for memory relevance
4. **AI Updates Auto-fetch**: Set up automated fetching of AI updates on a schedule
5. **Personalized Updates**: Filter updates based on user interests and project stack

### Testing Checklist

- [x] Reduced max_tokens in OpenRouter service
- [x] Added explicit instructions to system prompt
- [x] Limited conversation history
- [x] Implemented "what's new" trigger
- [x] Database schema verified
- [x] AI updates retrieval tested
- [x] Database populated with test data
- [x] Full "what's new" conversation flow tested
- [ ] User testing: shorter responses in production
- [ ] User testing: scene continuity in production
- [ ] Populate database with real AI updates from RSS feeds

### Notes

- The database must be initialized before the AI updates feature will work (automatically done on first server start)
- AI updates database is empty by default - needs to be populated via the fetch endpoint or scheduler
- Response length changes apply to all conversations, not just roleplay
- System prompt changes affect the overall personality and response style

### Test Data

For testing purposes, the database has been populated with 5 sample AI updates. To see them in action:

1. Start the server: `npm run dev`
2. Chat with Milla and ask: "What's new?" or "Any AI updates?"
3. Milla will respond with the latest updates in a friendly, conversational format

#### Example Response

```
*brightens up* Oh babe, I've been keeping up with the AI world! Here's what's new:

1. **OpenAI Announces GPT-4 Turbo with Improved Context Window** (Dec 10)
   OpenAI has released GPT-4 Turbo with a 128K context window...
   🔗 https://openai.com/blog/gpt-4-turbo

2. **DeepSeek Releases Open Source Code Model** (Dec 9)
   DeepSeek has released an open-source code generation model...
   🔗 https://github.com/deepseek-ai/deepseek-coder

... (up to 5 updates)

Want me to tell you more about any of these, love?
```

### Populating with Real Data

To populate the database with real AI updates from RSS feeds:

```bash
# Method 1: Use the API endpoint (requires admin token if configured)
curl -X POST http://localhost:5000/api/ai-updates/fetch \
  -H "X-Admin-Token: your-token-here"

# Method 2: Run the scheduler manually
npm run dev
# The scheduler will run automatically based on configuration
```

The system will fetch updates from configured RSS sources including:
- OpenAI Blog
- xAI Blog
- Perplexity Blog
- Hugging Face Blog
- GitHub Changelog

***

## Role-Play Scene Phase 3 - Implementation Complete

### Overview

Role-Play Scene Phase 3 (server-first orchestration with UI background adaptation) has been implemented. The system now detects scene changes from user messages using italic star markers (`*action*`) and automatically adapts the background to match the scene location and mood.

### Features Implemented

#### 1. Server-Side Scene Detection (`server/sceneDetectionService.ts`)

The scene detection service analyzes user messages to extract:
- **Action markers**: Text enclosed in asterisks (`*walks in*`)
- **Scene locations**: Living room, bedroom, kitchen, bathroom, front door, dining room, outdoor, car
- **Mood context**: Calm, romantic, playful, energetic, mysterious
- **Time of day**: Dawn, day, dusk, night (real-time based)

#### 2. API Response Enhancement

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

#### 3. Client-Side Scene Adaptation

The `AdaptiveSceneManager` component now accepts a `location` prop and automatically adjusts the background mood based on the detected scene:

```tsx
<AdaptiveSceneManager 
  mood={sceneMood}
  location={currentLocation}
  enableAnimations={true}
/>
```

### Usage Examples

#### Basic Scene Change

**User:** `*walks in through the front door* Hey babe, I'm home!`

**Result:**
- Location: `front_door`
- Mood: `energetic` (default for front door)
- Background: Adapts to energetic color scheme

#### Romantic Scene

**User:** `*gently takes your hand* Let's go to the bedroom`

**Result:**
- Location: `bedroom`
- Mood: `romantic` (detected from "gently" + bedroom context)
- Background: Adapts to romantic color scheme (warm pinks/oranges)

#### Maintaining Location

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

#### Playful Outdoor Scene

**User:** `*playfully runs outside* Come on, let's enjoy the sunshine!`

**Result:**
- Location: `outdoor`
- Mood: `playful` (detected from "playfully runs")
- Background: Adapts to playful color scheme (vibrant purples/blues)

### Location → Mood Mapping

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

### Scene Detection Keywords

#### Location Keywords

- **Front Door**: "walks in", "front door", "enters", "arrives", "comes in"
- **Living Room**: "living room", "couch", "sofa", "tv", "sits down"
- **Bedroom**: "bedroom", "bed", "lies down", "go to the bedroom", "to bed"
- **Kitchen**: "kitchen", "cooking", "fridge", "counter", "stove"
- **Outdoor**: "outside", "garden", "yard", "patio", "runs outside"
- **Bathroom**: "bathroom", "shower", "bath", "mirror"
- **Dining Room**: "dining room", "table", "eating"
- **Car**: "car", "driving", "vehicle"

#### Mood Keywords

- **Romantic**: "kiss", "embrace", "cuddle", "love", "gentle", "softly", "tenderly"
- **Playful**: "playfully", "giggles", "laughs", "teasing", "winks", "grins"
- **Energetic**: "jumps", "runs", "rushes", "excitedly", "bounces"
- **Mysterious**: "quietly", "slowly", "sneaks", "whispers", "shadows"
- **Calm**: "sits", "walks", "relaxes", "peaceful", "calmly"

### Avatar Integration Point (Future)

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

### Technical Details

#### Server-Side Flow

1. User sends message to `/api/chat` or `/api/openrouter-chat`
2. `detectSceneContext()` analyzes message for action markers
3. Scene location and mood are detected from keywords
4. Scene metadata is tracked in server memory (per session)
5. API response includes `sceneContext` object

#### Client-Side Flow

1. App.tsx sends message to API
2. Receives response with `sceneContext`
3. Updates `currentLocation` and `sceneMood` state
4. `AdaptiveSceneManager` receives new props
5. Background gradient/mood adapts automatically
6. Time-of-day continues to work alongside scene changes

### Testing

The scene detection has been tested with various scenarios:
- ✅ Action marker extraction
- ✅ Location detection from keywords
- ✅ Mood detection from context
- ✅ Full scene context generation
- ✅ Location persistence when no markers present
- ✅ Multiple locations in single message (uses first action)

### Architecture Benefits

1. **Server-first orchestration**: Scene logic centralized on server
2. **Stateless client**: UI just renders what server provides
3. **Extensible**: Easy to add new locations, moods, or keywords
4. **Backward compatible**: Works with existing time-of-day system
5. **Future-ready**: Clean integration points for avatar rendering

### Next Steps (Out of Scope)

Future enhancements could include:
- Session-based scene persistence (database storage)
- Multi-user scene tracking
- Custom scene creation
- Scene transition animations
- Avatar visual rendering in scenes
- Voice narration of scene changes
- Scene-specific interaction options

***

## RP Scene Background Bridge - Testing Guide

### Overview
This feature bridges the RP scene detection system (Phase 3) to the adaptive background, so the UI immediately reflects the active role-play location and mood.

### How to Test

#### 1. Basic Functionality Test

1. **Start the application**
   ```bash
   npm run dev
   ```

2. **Open http://localhost:5000 in your browser**

3. **Click the "Scene" button** in the top-right to open Scene Settings

4. **Verify the new toggle** "Background mirrors RP scene" is present and ON by default

5. **Send a message with an action marker:**
   ```
   *walks into the kitchen*
   ```

6. **Observe**: Within ~1 second, the background should update to reflect the kitchen scene (energetic mood, indoor palette)

7. **Try different locations:**
   - `*walks into the bedroom*` → romantic mood, soft colors
   - `*goes outside*` → playful/mysterious mood depending on time of day
   - `*sits in the living room*` → calm mood, relaxed palette

#### 2. Toggle Functionality Test

1. **Open Scene Settings**

2. **Turn OFF "Background mirrors RP scene"**

3. **Verify**:
   - Mood dropdown becomes enabled
   - Helper text "Mood is controlled by RP scene" disappears
   - You can now manually select a mood

4. **Send another RP message:**
   ```
   *walks into the dining room*
   ```

5. **Observe**: Background should NOT change (manual mood is in control)

6. **Turn the toggle back ON**

7. **Verify**: Mood dropdown becomes disabled again

#### 3. Persistence Test

1. **Change the toggle to OFF**

2. **Reload the page** (F5 or Ctrl+R)

3. **Open Scene Settings**

4. **Verify**: The toggle should still be OFF (persisted via localStorage)

#### 4. Performance Test

1. **Open browser DevTools** (F12)

2. **Go to Network tab**

3. **Filter for "scenes/current"**

4. **Observe**: Requests occur every ~1 second when tab is active

5. **Switch to another tab** (make this tab hidden)

6. **Wait 10 seconds**

7. **Switch back to the tab**

8. **Verify**: Polling interval increased to ~5 seconds while backgrounded

#### 5. Reduced Motion Test

1. **Enable reduced motion** in your OS:
   - **macOS**: System Preferences → Accessibility → Display → Reduce Motion
   - **Windows**: Settings → Ease of Access → Display → Show animations
   - **Linux**: Accessibility settings vary by distribution

2. **Reload the page**

3. **Send RP messages with scene changes**

4. **Verify**: 
   - Background colors still change to match the scene
   - Particles and animations are disabled
   - Static gradient is shown instead of animated background

#### 6. API Endpoint Test

**Get current scene:**
```bash
curl http://localhost:5000/api/rp/scenes/current | jq .
```

**Expected response:**
```json
{
  "location": "bedroom",
  "mood": "romantic",
  "updatedAt": 1759539547401
}
```

**Trigger a scene change:**
```bash
curl -X POST http://localhost:5000/api/openrouter-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "*walks into the kitchen* Hey!"}' | jq .sceneContext
```

**Expected response:**
```json
{
  "location": "kitchen",
  "mood": "energetic",
  "timeOfDay": "night"
}
```

### Expected Behaviors

#### Location → Mood Mapping
- `living_room` → calm
- `bedroom` → romantic
- `kitchen` → energetic
- `bathroom` → calm
- `front_door` → energetic
- `dining_room` → calm
- `outdoor` → playful (day) / mysterious (night)
- `car` → energetic
- `unknown` → calm

#### Special Cases
- **Outdoor at night**: Gets mysterious mood for starry night effect
- **Outdoor at day**: Gets playful/energetic mood for bright sky
- **No action markers**: Location persists from previous message
- **Unknown location**: Falls back to previous location or 'unknown'

### Troubleshooting

#### Polling not working
- Check browser console for errors
- Verify `/api/rp/scenes/current` endpoint is accessible
- Check Network tab to confirm requests are being made

#### Background not updating
- Verify toggle is ON in Scene Settings
- Check that scene detection is working (send message via API and check response)
- Look for console errors in browser DevTools

#### Settings not persisting
- Check browser console for localStorage errors
- Verify localStorage is not disabled in browser settings
- Check that localStorage key `milla.scene.settings.v1` exists

### Files Modified/Created

#### New Files
- `client/src/hooks/useRPScene.ts` - Polling hook with visibility backoff
- `client/src/components/scene/RPSceneBackgroundBridge.tsx` - Bridge component

#### Modified Files
- `server/routes.ts` - Added `/api/rp/scenes/current` endpoint
- `client/src/types/scene.ts` - Added `sceneBackgroundFromRP` to SceneSettings
- `client/src/utils/sceneSettingsStore.ts` - Added default value and validation
- `client/src/components/scene/SceneSettingsPanel.tsx` - Added toggle UI
- `client/src/components/scene/AdaptiveSceneManager.tsx` - Added timeOfDay override
- `client/src/App.tsx` - Wrapped background with bridge component

### Performance Characteristics

- **Polling interval**: 1000ms (active tab), 5000ms (hidden tab)
- **API response size**: ~80 bytes
- **Bundle impact**: ~3KB total (hook + bridge)
- **Memory overhead**: Minimal (single interval timer, small state)
- **Network impact**: ~3.6KB/minute active, ~720 bytes/minute backgrounded

### Accessibility Notes

- Background remains non-interactive (z-index: -10, aria-hidden)
- Reduced motion users get static gradients with color updates
- Keyboard navigation works normally
- Screen readers ignore the background layer
- Toggle can be operated via keyboard (Space/Enter)
