# Quick Testing Guide - Adaptive Scene Generation

## 🚀 Quick Start (5 minutes)

### Option 1: Test the Interactive Demo
1. Open `SCENE_DEMO.html` in any web browser
2. Use the controls on the right to test features:
   - Change **Time of Day** (dawn/day/dusk/night)
   - Change **Mood** (calm/energetic/romantic/mysterious/playful)
   - Adjust **Parallax Intensity** slider
   - Adjust **Particle Density** slider
   - Adjust **Animation Speed** slider
3. Move your mouse across the left side to see parallax effect
4. Hover over "Adaptive Scene" badge in bottom-left to see scene info

### Option 2: Test the Full Application
1. Build and run the application:
   ```bash
   npm install
   npm run build
   npm run dev
   ```

2. Open http://localhost:5000 in your browser

3. **Verify Scene is Active:**
   - Look at the left 2/3 of the screen - you should see an animated gradient background
   - Hover over the "Adaptive Scene" badge in the bottom-left corner
   - The badge should show current time of day and mood

4. **Test Scene Settings:**
   - Click the "Scene" button in the top-right controls
   - Try changing each setting and observe the background:
     - Toggle "Adaptive Background" on/off
     - Change "Mood" dropdown (5 options)
     - Adjust "Parallax Intensity" slider
     - Adjust "Particle Density" slider
     - Adjust "Animation Speed" slider

5. **Test Parallax:**
   - Move your mouse slowly across the left side of the screen
   - Background layers should subtly shift in response
   - Set parallax intensity to 0 to disable

6. **Test Particles:**
   - Look for small glowing dots floating upward
   - Adjust particle density to see more/fewer particles
   - Set to "off" to disable

7. **Test Reduced Motion:**
   - Enable "Reduce Motion" in your OS accessibility settings
   - Reload the page
   - Scene should show as a static gradient (no animations)

## 📋 What to Look For

### ✅ Expected Behavior (Scene Working Correctly)
- [ ] Left 2/3 of screen has an animated gradient background
- [ ] Background colors change based on current time of day
- [ ] Background colors change when mood is adjusted
- [ ] Small particles (dots) float upward across the background
- [ ] Background layers shift when moving the mouse (parallax)
- [ ] "Adaptive Scene" badge visible in bottom-left corner
- [ ] Scene Settings dialog has all controls
- [ ] All settings update the scene in real-time

### ❌ Issues to Report (Scene Not Working)
- [ ] Left 2/3 shows a static image (milla_new.jpg)
- [ ] No gradient or animated background visible
- [ ] Scene Settings dialog is missing controls
- [ ] Changes to settings don't affect the background
- [ ] Console shows errors related to scene components

## 🎨 Visual Expectations

### Time of Day Colors
- **Dawn (5am-8am):** Soft pinks, oranges, yellows (sunrise colors)
- **Day (8am-5pm):** Light blues, sky blues, bright colors
- **Dusk (5pm-8pm):** Warm oranges, purples, reds (sunset colors)
- **Night (8pm-5am):** Dark blues, purples, blacks (night sky)

### Mood Colors
- **Calm:** Cool blues, purples, serene tones
- **Energetic:** Bright pinks, oranges, vibrant colors
- **Romantic:** Warm pinks, reds, soft romantic colors
- **Mysterious:** Dark grays, deep purples, muted mysterious tones
- **Playful:** Bright multi-colors, fun vibrant gradients

## 🐛 Common Issues & Solutions

### "I don't see any background animation"
**Check:**
1. Is "Adaptive Background" enabled in Scene Settings?
2. Is "Reduced Motion" disabled in your OS settings?
3. Check browser console for errors
4. Try refreshing the page

### "The background is a static image"
**Fix:**
1. Open Scene Settings
2. Ensure "Adaptive Background" is set to "Enabled"
3. Clear browser cache and reload

### "Parallax doesn't work"
**Check:**
1. Is Parallax Intensity > 0 in Scene Settings?
2. Are you moving mouse over the LEFT 2/3 of screen?
3. Is your GPU tier low? (Parallax auto-disables on low GPU)

### "I don't see any particles"
**Check:**
1. Is Particle Density set to something other than "off"?
2. Is your GPU tier low? (Particles auto-disable on low GPU)
3. Try increasing particle density to "high"

## 📱 Testing on Different Devices

### Desktop (Chrome/Firefox/Safari)
- Full features should work
- Parallax, particles, animations all active
- Scene Settings fully functional

### Mobile/Tablet
- Background should render (may auto-downgrade quality)
- Touch events should work normally
- Settings should be accessible

### Low-End Devices
- Scene should auto-detect low GPU tier
- Parallax and particles auto-disabled
- Static or minimal animations shown

## 🔍 Debug Mode

### Enable Dev Debug Overlay
1. Open Scene Settings
2. Scroll to bottom
3. Toggle "Dev Debug Overlay" to ON
4. A diagnostic panel appears in top-left showing:
   - GPU Tier
   - WebGL support
   - Reduced Motion status
   - Current time of day
   - Current mood
   - Particles on/off
   - Parallax on/off
   - Animation speed
   - FPS counter (toggle available)

### Scene Info Indicator (Always Available)
- Hover over the "Adaptive Scene" badge in bottom-left
- Shows current scene context without opening settings
- Non-intrusive way to verify scene is active

## 📊 Performance Check

Open browser DevTools (F12) and check:
- **Performance tab:** FPS should be 30-60
- **Memory tab:** No significant leaks over time
- **Console tab:** No error messages

## ✅ Quick Validation Checklist

- [ ] Background is animated (not static image)
- [ ] Scene changes between dawn/day/dusk/night
- [ ] Scene changes between 5 moods
- [ ] Parallax works when moving mouse
- [ ] Particles are visible and animating
- [ ] Scene Settings has all required controls
- [ ] Settings update scene in real-time
- [ ] Scene is enabled by default
- [ ] Reduced motion disables animations
- [ ] Scene info indicator is visible
- [ ] No console errors

## 📚 Additional Resources

- **Full Test Cases:** See `client/src/__tests__/scene/adaptiveSceneIntegration.test.ts`
- **Manual Testing:** See `SCENE_VALIDATION_CHECKLIST.md`
- **Implementation Details:** See `SCENE_IMPLEMENTATION_SUMMARY.md`
- **Interactive Demo:** Open `SCENE_DEMO.html`

## 🎯 Summary

The adaptive scene system should:
1. Be visible by default (no configuration needed)
2. Respond to time of day automatically
3. Allow mood customization via settings
4. Show parallax effects on mouse movement
5. Display floating particles
6. Degrade gracefully on low-end devices
7. Respect reduced motion preferences

**If you see all of the above, the implementation is working correctly! ✅**
