# Adding Multiple Images Per Scene - Implementation Guide

## Overview
This guide explains how to add multiple static images for different situations within the same scene location. Currently, the system supports time-of-day variants. This document shows how to extend it for action-based images in the future.

## Current Implementation (Time-Based Images)

### How It Works Now
The system automatically selects images based on:
1. **Location** (e.g., living_room, kitchen, bedroom)
2. **Time of Day** (morning, day, dusk, night)

### File Naming Convention
```
/client/public/assets/scenes/
├── {location}.jpg              # Default image (fallback)
├── {location}-{time}.jpg       # Time-specific variant
```

### Examples
```
/client/public/assets/scenes/
├── living_room.jpg              # Used during day if no time variant
├── living_room-morning.jpg      # 6am-10am
├── living_room-day.jpg          # 10am-5pm
├── living_room-dusk.jpg         # 5pm-8pm
├── living_room-night.jpg        # 8pm-6am
├── kitchen.jpg                  # Default kitchen
├── kitchen-morning.jpg          # Kitchen in morning light
└── bedroom-night.jpg            # Bedroom at night
```

### Time Periods
- **morning**: 6am - 10am
- **day**: 10am - 5pm
- **dusk**: 5pm - 8pm
- **night**: 8pm - 6am

## Future Enhancement: Action-Based Images

### Concept
Add images for specific activities or situations within a scene. For example:
- Multiple living room images: by fireplace, on couch, looking out window
- Multiple kitchen images: cooking, doing dishes, at counter

### Proposed File Naming Convention
```
{location}-{action}.jpg              # Action variant (no time)
{location}-{action}-{time}.jpg       # Action + time variant
```

### Example File Structure
```
/client/public/assets/scenes/

# Living Room Variations
├── living_room.jpg                  # Default
├── living_room-night.jpg            # Time variant
├── living_room-fireplace.jpg        # By fireplace (any time)
├── living_room-fireplace-night.jpg  # By fireplace at night
├── living_room-couch.jpg            # On couch
├── living_room-window.jpg           # Looking out window

# Kitchen Variations
├── kitchen.jpg                      # Default
├── kitchen-morning.jpg              # Morning light
├── kitchen-cooking.jpg              # Cooking action
├── kitchen-cooking-morning.jpg      # Cooking in morning
├── kitchen-dishes.jpg               # Doing dishes
├── kitchen-counter.jpg              # At counter

# Bedroom Variations
├── bedroom.jpg                      # Default
├── bedroom-night.jpg                # Night time
├── bedroom-reading.jpg              # Reading in bed
├── bedroom-window.jpg               # Looking out window
```

### Implementation Steps (For Future Development)

#### 1. Update Type Definitions
Add action types to `/client/src/types/scene.ts`:

```typescript
// Add to existing types
export type SceneAction = 
  | 'fireplace' 
  | 'couch' 
  | 'window' 
  | 'cooking' 
  | 'dishes' 
  | 'counter'
  | 'reading'
  | 'default';
```

#### 2. Modify RealisticSceneBackground Component
Update `/client/src/components/scene/RealisticSceneBackground.tsx`:

```typescript
interface RealisticSceneBackgroundProps {
  location: SceneLocation;
  timeOfDay: TimeOfDay;
  action?: SceneAction;  // Add this prop
  region?: 'full' | 'left-2-3';
  onImageLoadError?: () => void;
  onImageLoadSuccess?: () => void;
}

// Update the getImageUrls function
function getImageUrls(
  location: SceneLocation, 
  timeOfDay: TimeOfDay,
  action?: SceneAction
): string[] {
  if (location === 'unknown') {
    return [];
  }

  const urls: string[] = [];
  
  // Try action + time variant first: living_room-fireplace-night.jpg
  if (action && action !== 'default') {
    urls.push(`/assets/scenes/${location}-${action}-${timeOfDay}.jpg`);
    urls.push(`/assets/scenes/${location}-${action}-${timeOfDay}.png`);
    
    // Try action without time: living_room-fireplace.jpg
    urls.push(`/assets/scenes/${location}-${action}.jpg`);
    urls.push(`/assets/scenes/${location}-${action}.png`);
  }
  
  // Try time-specific variant: living_room-night.jpg
  urls.push(`/assets/scenes/${location}-${timeOfDay}.jpg`);
  urls.push(`/assets/scenes/${location}-${timeOfDay}.png`);
  
  // Try base location image: living_room.jpg
  urls.push(`/assets/scenes/${location}.jpg`);
  urls.push(`/assets/scenes/${location}.png`);
  
  return urls;
}
```

#### 3. Add Action Detection to AI Response
Update `/server/sceneDetectionService.ts` to detect actions from conversation:

```typescript
// Add action detection patterns
const actionPatterns = {
  fireplace: /fireplace|fire|warm.*fire/i,
  couch: /couch|sofa|sit.*couch/i,
  window: /window|looking out|gaze.*window/i,
  cooking: /cook|preparing|making.*food/i,
  dishes: /dish|wash|cleaning.*dish/i,
  counter: /counter|kitchen.*counter/i,
  reading: /read|book/i
};

// Detect action from message
function detectAction(message: string): SceneAction {
  for (const [action, pattern] of Object.entries(actionPatterns)) {
    if (pattern.test(message)) {
      return action as SceneAction;
    }
  }
  return 'default';
}
```

#### 4. Pass Action Through Scene Context
Update scene context to include action:

```typescript
// In chat API response
{
  response: "...",
  sceneContext: {
    location: "living_room",
    mood: "calm",
    action: "fireplace"  // Add this
  }
}
```

#### 5. Update App.tsx
Add state for current action:

```typescript
const [currentAction, setCurrentAction] = useState<SceneAction>('default');

// In handleSendMessage
if (data.sceneContext) {
  if (data.sceneContext.location) {
    setCurrentLocation(data.sceneContext.location);
  }
  if (data.sceneContext.action) {
    setCurrentAction(data.sceneContext.action);
  }
}

// Pass to AdaptiveSceneManager
<AdaptiveSceneManager 
  location={currentLocation}
  timeOfDay={currentTimeOfDay}
  action={currentAction}  // Add this
  // ... other props
/>
```

## Image Requirements

### Specifications
- **Format**: JPG (preferred) or PNG
- **Resolution**: 1920x1080 (16:9 aspect ratio)
- **File Size**: Under 500KB per image (optimized for web)
- **Quality**: 80-85% JPEG quality is usually sufficient

### Optimization Tools
**Command Line (ImageMagick):**
```bash
convert input.jpg -quality 85 -resize 1920x1080 output.jpg
```

**Online Tools:**
- [TinyPNG](https://tinypng.com/) - PNG/JPG compression
- [Squoosh](https://squoosh.app/) - Google's image optimizer

### Image Tips
1. **Lighting**: Match the time of day (bright for day, warm for night)
2. **Composition**: Leave space for Milla silhouette (center-left area)
3. **Depth**: Images with depth/perspective work better than flat walls
4. **Consistency**: Keep similar visual style across all scenes
5. **Testing**: Test images at different screen sizes

## Example Workflow

### Adding a New Scene with Multiple Images

1. **Choose your location**: e.g., "garden"

2. **Create base image**:
   ```
   garden.jpg  (default daytime garden)
   ```

3. **Add time variants** (optional):
   ```
   garden-morning.jpg  (morning dew, soft light)
   garden-night.jpg    (moonlit garden)
   ```

4. **Add action variants** (future):
   ```
   garden-flowers.jpg     (tending flowers)
   garden-bench.jpg       (sitting on bench)
   garden-fountain.jpg    (by the fountain)
   ```

5. **Test in browser**:
   - Type: "*walks into the garden*"
   - Verify correct image loads
   - Check different times of day

## Debugging

### Images Not Loading?

1. **Check file path**: Must be in `/client/public/assets/scenes/`
2. **Check filename**: Must match exactly (case-sensitive)
3. **Check console**: Look for 404 errors
4. **Check format**: Only .jpg, .jpeg, .png supported
5. **Check background mode**: Must be set to "Auto" or "Static Image"

### Testing Checklist

- [ ] Image file is in correct directory
- [ ] Filename follows naming convention
- [ ] File size is under 500KB
- [ ] Image resolution is appropriate (1920x1080)
- [ ] Background mode is set correctly in settings
- [ ] Browser console shows no errors
- [ ] Image loads at different times of day
- [ ] Fallback works if specific image missing

## Best Practices

1. **Start Simple**: Begin with base images, add variants later
2. **Test Frequently**: Check each image as you add it
3. **Optimize First**: Don't upload huge files, optimize before adding
4. **Document Sources**: Keep track of where images came from
5. **Consistent Style**: Use similar visual style across all images
6. **Plan Ahead**: Think about what situations make sense for each location

## Example: Complete Living Room Setup

```
/client/public/assets/scenes/

# Base and time variants (CURRENT - works now)
living_room.jpg                      # Default, 1920x1080, 450KB
living_room-morning.jpg              # Soft morning light, 420KB
living_room-night.jpg                # Warm lamp lighting, 380KB

# Action variants (FUTURE - requires code changes)
living_room-fireplace.jpg            # Milla by fireplace
living_room-fireplace-night.jpg      # Cozy fire at night
living_room-couch.jpg                # Relaxing on couch
living_room-window.jpg               # Looking out window
living_room-window-morning.jpg       # Morning view from window
```

## Resources

- **Full Documentation**: See `STATIC_BACKGROUNDS_QUICKSTART.md`
- **Code Reference**: See `RealisticSceneBackground.tsx`
- **Type Definitions**: See `/client/src/types/scene.ts`
- **Scene Detection**: See `/server/sceneDetectionService.ts`

## Future Enhancements

Possible future features:
1. **Random Selection**: Multiple images per situation, randomly chosen
2. **Smooth Transitions**: Crossfade between images
3. **Parallax Layers**: Multi-layer images for depth
4. **Weather Effects**: Rain, snow overlays
5. **Seasonal Variants**: Spring, summer, fall, winter versions
6. **Interactive Elements**: Clickable areas in images
7. **WebP Support**: Modern format with better compression

---

**Note**: The action-based system is currently commented out and requires implementation. The time-based system works out of the box. Simply add appropriately named images to `/client/public/assets/scenes/` and they will be automatically detected and used.
