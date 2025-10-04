# RP Scene Background Bridge - Testing Guide

## Overview
This feature bridges the RP scene detection system (Phase 3) to the adaptive background, so the UI immediately reflects the active role-play location and mood.

## How to Test

### 1. Basic Functionality Test

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

### 2. Toggle Functionality Test

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

### 3. Persistence Test

1. **Change the toggle to OFF**

2. **Reload the page** (F5 or Ctrl+R)

3. **Open Scene Settings**

4. **Verify**: The toggle should still be OFF (persisted via localStorage)

### 4. Performance Test

1. **Open browser DevTools** (F12)

2. **Go to Network tab**

3. **Filter for "scenes/current"**

4. **Observe**: Requests occur every ~1 second when tab is active

5. **Switch to another tab** (make this tab hidden)

6. **Wait 10 seconds**

7. **Switch back to the tab**

8. **Verify**: Polling interval increased to ~5 seconds while backgrounded

### 5. Reduced Motion Test

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

### 6. API Endpoint Test

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

## Expected Behaviors

### Location → Mood Mapping
- `living_room` → calm
- `bedroom` → romantic
- `kitchen` → energetic
- `bathroom` → calm
- `front_door` → energetic
- `dining_room` → calm
- `outdoor` → playful (day) / mysterious (night)
- `car` → energetic
- `unknown` → calm

### Special Cases
- **Outdoor at night**: Gets mysterious mood for starry night effect
- **Outdoor at day**: Gets playful/energetic mood for bright sky
- **No action markers**: Location persists from previous message
- **Unknown location**: Falls back to previous location or 'unknown'

## Troubleshooting

### Polling not working
- Check browser console for errors
- Verify `/api/rp/scenes/current` endpoint is accessible
- Check Network tab to confirm requests are being made

### Background not updating
- Verify toggle is ON in Scene Settings
- Check that scene detection is working (send message via API and check response)
- Look for console errors in browser DevTools

### Settings not persisting
- Check browser console for localStorage errors
- Verify localStorage is not disabled in browser settings
- Check that localStorage key `milla.scene.settings.v1` exists

## Files Modified/Created

### New Files
- `client/src/hooks/useRPScene.ts` - Polling hook with visibility backoff
- `client/src/components/scene/RPSceneBackgroundBridge.tsx` - Bridge component

### Modified Files
- `server/routes.ts` - Added `/api/rp/scenes/current` endpoint
- `client/src/types/scene.ts` - Added `sceneBackgroundFromRP` to SceneSettings
- `client/src/utils/sceneSettingsStore.ts` - Added default value and validation
- `client/src/components/scene/SceneSettingsPanel.tsx` - Added toggle UI
- `client/src/components/scene/AdaptiveSceneManager.tsx` - Added timeOfDay override
- `client/src/App.tsx` - Wrapped background with bridge component

## Performance Characteristics

- **Polling interval**: 1000ms (active tab), 5000ms (hidden tab)
- **API response size**: ~80 bytes
- **Bundle impact**: ~3KB total (hook + bridge)
- **Memory overhead**: Minimal (single interval timer, small state)
- **Network impact**: ~3.6KB/minute active, ~720 bytes/minute backgrounded

## Accessibility Notes

- Background remains non-interactive (z-index: -10, aria-hidden)
- Reduced motion users get static gradients with color updates
- Keyboard navigation works normally
- Screen readers ignore the background layer
- Toggle can be operated via keyboard (Space/Enter)
