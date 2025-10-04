# Adaptive Scene Generation - Manual Validation Checklist

This document provides manual testing steps to validate the adaptive scene generation milestone for issue #107.

## Test Environment Setup
1. Build the project: `npm run build`
2. Start the development server: `npm run dev`
3. Open the application in a browser

## Acceptance Criteria Validation

### ✅ 1. Adaptive Scene Visible by Default

**Steps:**
1. Open the application in a fresh browser (clear localStorage)
2. Observe the background on the left 2/3 of the screen

**Expected Result:**
- A dynamic, animated gradient background should be visible
- The background should NOT be a static image
- The gradient should have subtle animations
- Particles (stars/sparkles) should be visible floating across the background

**Validation:**
- [ ] Dynamic gradient background is visible
- [ ] No static `milla_new.jpg` image is visible
- [ ] Background covers left 2/3 of viewport
- [ ] Background is enabled by default (check Scene Settings)

---

### ✅ 2. Time-of-Day Transitions

**Steps:**
1. Open browser DevTools Console
2. Check current time of day in the diagnostic overlay (bottom-left corner, hover to see details)
3. Or enable Dev Debug mode in Scene Settings to see full debug overlay

**Expected Result:**
- Scene should show appropriate colors for current time:
  - **Dawn (5am-8am):** Soft pinks, oranges, yellows
  - **Day (8am-5pm):** Blues, light blues, sky colors
  - **Dusk (5pm-8pm):** Warm oranges, purples, reds
  - **Night (8pm-5am):** Dark blues, purples, blacks

**Validation:**
- [ ] Scene colors match current time of day
- [ ] Time period is correctly identified (check diagnostic overlay)
- [ ] Colors transition smoothly between states

---

### ✅ 3. Mood Overlays

**Steps:**
1. Open Scene Settings (Scene button in top-right controls)
2. Change the Mood dropdown through all 5 options:
   - Calm
   - Energetic
   - Romantic
   - Mysterious
   - Playful
3. Observe background color changes for each mood

**Expected Result:**
- Each mood should produce distinct color palettes:
  - **Calm:** Cool blues, purples, serene tones
  - **Energetic:** Bright pinks, oranges, vibrant colors
  - **Romantic:** Warm pinks, reds, soft gradients
  - **Mysterious:** Dark grays, deep purples, muted tones
  - **Playful:** Bright multi-colors, vibrant gradients

**Validation:**
- [ ] All 5 moods are available in dropdown
- [ ] Each mood produces visually distinct background
- [ ] Mood changes apply immediately
- [ ] Current mood is shown in diagnostic overlay

---

### ✅ 4. Parallax Effects

**Steps:**
1. Ensure Parallax Intensity is > 0 in Scene Settings (default: 50)
2. Move mouse cursor slowly across the left 2/3 of the screen
3. Observe background layers shifting

**Expected Result:**
- Background layers should subtly move in response to mouse movement
- Movement should feel smooth and natural (not jarring)
- Different layers should move at different speeds (depth effect)

**Validation:**
- [ ] Mouse movement creates parallax effect
- [ ] Parallax is smooth and responsive
- [ ] Can adjust intensity with slider (0-75)
- [ ] Setting intensity to 0 disables parallax
- [ ] Parallax toggle works in Scene Settings

**Low-End Device Test:**
- [ ] On low GPU tier devices, parallax is automatically disabled
- [ ] Check diagnostic overlay shows "Parallax: OFF" on low-tier

---

### ✅ 5. Particle Effects (Stars/Sparkles)

**Steps:**
1. Ensure Particle Density is not "off" in Scene Settings (default: medium)
2. Observe animated particles floating across the background
3. Adjust particle density slider through all levels:
   - Off
   - Low (20 particles)
   - Medium (40 particles)
   - High (60 particles)

**Expected Result:**
- Particles should be visible as small, glowing dots
- Particles should float upward with slight horizontal drift
- Particles should twinkle/pulse gently
- More particles appear at higher density settings

**Validation:**
- [ ] Particles are visible on the background
- [ ] Particle density changes affect particle count
- [ ] Different moods use appropriate particle types:
  - [ ] Romantic: Hearts
  - [ ] Night time: Stars
  - [ ] Others: Sparkles or appropriate types
- [ ] Particles animate smoothly
- [ ] Setting density to "off" removes all particles

**Low-End Device Test:**
- [ ] On low GPU tier devices, particles are automatically disabled
- [ ] Check diagnostic overlay shows "Particles: OFF" on low-tier

---

### ✅ 6. Graceful Degradation (Reduced Motion / Low-End Devices)

**Steps for Reduced Motion:**
1. Enable "Reduce Motion" in OS accessibility settings
2. Reload the application
3. Observe the background

**Expected Result (Reduced Motion):**
- Background should show as a static gradient (no animations)
- No parallax effects should occur
- No particle animations should occur
- Gradient colors should still reflect time/mood

**Validation:**
- [ ] Static gradient is shown with reduced motion enabled
- [ ] No animations occur with reduced motion
- [ ] Scene Settings shows "Reduced Motion: ON"
- [ ] Colors still match time of day and mood

**Steps for Low GPU Tier:**
1. Test on a low-end device or simulate by checking diagnostic overlay
2. Observe automatic fallback behavior

**Expected Result (Low GPU):**
- [ ] Parallax automatically disabled
- [ ] Particles automatically disabled
- [ ] Static or minimal animations shown
- [ ] Diagnostic shows "GPU Tier: low"

---

### ✅ 7. Scene Settings Panel - All Controls Present

**Steps:**
1. Open Scene Settings dialog
2. Verify all controls are present and functional

**Required Controls Checklist:**
- [ ] **Adaptive Background** toggle (Enabled/Disabled button)
- [ ] **Mood** dropdown with 5 options (calm, energetic, romantic, mysterious, playful)
- [ ] **Parallax Intensity** slider (0-75)
- [ ] **Particle Density** slider (off, low, medium, high)
- [ ] **Animation Speed** slider (50%-150%)
- [ ] **Background mirrors RP scene** toggle
- [ ] **Room overlays** toggle
- [ ] **Reduced Motion** indicator (read-only)
- [ ] **Dev Debug Overlay** toggle

**Functional Validation:**
- [ ] All toggles respond to clicks
- [ ] All sliders update values in real-time
- [ ] Settings persist after page reload (localStorage)
- [ ] Mood dropdown works when "Background mirrors RP scene" is OFF
- [ ] Mood is disabled (grayed out) when "Background mirrors RP scene" is ON

---

### ✅ 8. Fallback/Diagnostic Overlay

**Steps:**
1. Hover over the bottom-left corner of the screen (left 2/3 area)
2. A small "Adaptive Scene" indicator should appear
3. Hover over it to see expanded details
4. Enable "Dev Debug Overlay" in Scene Settings for full diagnostic view

**Expected Result - Normal Indicator:**
- Small badge in bottom-left showing "Adaptive Scene" with green dot
- On hover, expands to show:
  - Current time of day
  - Current mood
  - Current location (if applicable)

**Expected Result - Dev Debug Mode:**
- Full diagnostic overlay in top-left showing:
  - GPU tier
  - WebGL support
  - Reduced motion status
  - Time of day
  - Mood
  - Particles on/off
  - Parallax on/off
  - Animation speed
  - FPS counter (toggle available)

**Expected Result - Scene Disabled:**
- If scene is disabled in settings and Dev Debug is ON:
  - Shows diagnostic message "Scene Context: Disabled"
  - Explains how to enable it

**Validation:**
- [ ] Normal indicator appears in bottom-left
- [ ] Indicator shows scene context on hover
- [ ] Dev debug overlay shows all diagnostic info
- [ ] Disabled scene shows diagnostic when debug is on
- [ ] FPS counter can be toggled in debug mode

---

### ✅ 9. Desktop Browser Testing

**Test on multiple browsers:**
- [ ] **Chrome/Edge:** Full features work (WebGL, animations, particles)
- [ ] **Firefox:** Full features work (WebGL, animations, particles)
- [ ] **Safari:** Full features work (WebGL, animations, particles)

**Validation per browser:**
- [ ] Background is visible
- [ ] Animations are smooth (no stuttering)
- [ ] Parallax responds to mouse movement
- [ ] Particles are visible and animating
- [ ] Settings panel is accessible and functional

---

### ✅ 10. Mobile/Android Testing

**Test on Android device or mobile emulation:**
1. Open application on Android device
2. Observe background rendering

**Expected Result:**
- Background should render (may automatically downgrade to lower quality)
- Touch events should not interfere with chat interface
- No performance issues or lag

**Validation:**
- [ ] Background renders on Android WebView
- [ ] No performance issues
- [ ] Touch interactions work normally
- [ ] Scene Settings are accessible on mobile

---

### ✅ 11. Accessibility Testing

**Keyboard Navigation:**
- [ ] Scene Settings dialog can be opened with keyboard
- [ ] All controls in Scene Settings are keyboard-accessible
- [ ] Tab order is logical

**Screen Reader:**
- [ ] Scene background is marked with `aria-hidden="true"`
- [ ] Scene background has `role="presentation"`
- [ ] Scene does not interfere with screen reader navigation

**Reduced Motion:**
- [ ] System reduced motion preference is detected
- [ ] Animations are disabled when reduced motion is active
- [ ] Scene Settings shows "Reduced Motion: ON" status

---

## Performance Validation

### Frame Rate
- [ ] Scene maintains 30+ FPS on medium-tier devices
- [ ] Scene maintains 60 FPS on high-tier devices
- [ ] No significant frame drops during animations

### Memory Usage
- [ ] No memory leaks after extended use (check DevTools Memory profiler)
- [ ] Memory usage stays stable over time

### CPU/GPU Usage
- [ ] Reasonable CPU usage (< 10% on idle with scene running)
- [ ] GPU acceleration is utilized when available

---

## Cross-Tab/Window Testing

**Steps:**
1. Open application in two browser tabs
2. Change settings in one tab
3. Observe the other tab

**Expected Result:**
- [ ] Settings changes sync across tabs (via localStorage events)
- [ ] Both tabs show same scene configuration

---

## Regression Testing

**Verify existing features still work:**
- [ ] Voice controls work normally
- [ ] Chat interface functions correctly
- [ ] Messages send and receive properly
- [ ] Voice picker dialog works
- [ ] Other dialogs/modals are not affected
- [ ] RP scene features work (Milla silhouette, room overlays)

---

## Summary Checklist

**All Acceptance Criteria:**
- [ ] Users see dynamic, animated background on all supported browsers
- [ ] Scene changes for different times of day (dawn, day, dusk, night)
- [ ] Scene changes for different moods (calm, energetic, romantic, mysterious, playful)
- [ ] Scene Settings panel allows real-time mood adjustment
- [ ] Scene Settings panel allows parallax toggle/adjustment
- [ ] Scene Settings panel allows particle toggle/adjustment
- [ ] Scene Settings panel allows animation speed adjustment
- [ ] Overlay respects device capability detection
- [ ] Overlay respects reduced motion preference
- [ ] No static image backgrounds visible (unless scene is disabled)
- [ ] Diagnostic overlay shows scene context
- [ ] Desktop browsers fully supported
- [ ] Mobile/Android supported
- [ ] Accessibility requirements met

---

## Known Issues / Notes

- Test infrastructure (Jest) not yet configured - automated tests are stubs
- Manual testing required for visual validation
- Performance may vary based on device capabilities (by design)

---

## Sign-Off

**Tester:** ___________________  
**Date:** ___________________  
**Status:** [ ] PASS [ ] FAIL [ ] NEEDS REVIEW  
**Notes:**
