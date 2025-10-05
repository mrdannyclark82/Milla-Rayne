# Static Scene Backgrounds

This directory contains static image backgrounds for different room/scene contexts in the adaptive scene system.

## Directory Structure

```
/client/public/assets/scenes/
├── README.md                    # This file
├── living_room.jpg              # Default living room background
├── living_room-morning.jpg      # Morning variant
├── living_room-day.jpg          # Day variant
├── living_room-dusk.jpg         # Dusk variant
├── living_room-night.jpg        # Night variant
├── kitchen.jpg                  # Default kitchen background
├── kitchen-morning.jpg          # Kitchen morning variant
├── bedroom.jpg                  # Default bedroom background
├── bedroom-night.jpg            # Bedroom night variant
└── ... (more rooms and variants)
```

## Naming Convention

### Basic Format
`{location}.jpg` or `{location}.png`

Examples:
- `living_room.jpg`
- `kitchen.jpg`
- `bedroom.jpg`
- `bathroom.jpg`
- `dining_room.jpg`
- `outdoor.jpg`

### Time-of-Day Variants
`{location}-{time}.jpg` or `{location}-{time}.png`

Time values:
- `morning` - Early morning (6am-10am)
- `day` - Daytime (10am-5pm)
- `dusk` - Evening/dusk (5pm-8pm)
- `night` - Nighttime (8pm-6am)

Examples:
- `living_room-morning.jpg`
- `living_room-day.jpg`
- `living_room-dusk.jpg`
- `living_room-night.jpg`
- `bedroom-night.jpg`
- `kitchen-morning.jpg`

### Mood Variants (Future Enhancement)
`{location}-{mood}.jpg` or `{location}-{time}-{mood}.jpg`

Mood values:
- `calm`
- `energetic`
- `romantic`
- `mysterious`
- `playful`

Examples:
- `living_room-romantic.jpg`
- `bedroom-night-romantic.jpg`

## Supported Locations

Based on `SceneLocation` type in `/client/src/types/scene.ts`:

- `living_room` - Living room, lounge
- `bedroom` - Bedroom, personal space
- `kitchen` - Kitchen, cooking area
- `bathroom` - Bathroom
- `dining_room` - Dining room, dining area
- `front_door` - Entrance, doorway
- `outdoor` - Outside, porch, garden
- `car` - Vehicle interior
- `unknown` - Fallback (uses CSS animated background)

## How to Add a New Room Background

1. **Prepare your image:**
   - Recommended resolution: 1920x1080 or higher
   - Format: JPG (for photos) or PNG (for graphics)
   - Optimize file size (aim for under 500KB)

2. **Name your file:**
   - Use lowercase with underscores: `{location}.jpg`
   - Optional time variant: `{location}-{time}.jpg`

3. **Place in this directory:**
   ```bash
   cp my-living-room-photo.jpg /client/public/assets/scenes/living_room.jpg
   ```

4. **The image mapping is automatic:**
   - The `RealisticSceneBackground` component will automatically detect and use images based on:
     - Current location (e.g., 'living_room')
     - Current time of day (e.g., 'night')
     - Fallback to base image if time variant doesn't exist
     - Fallback to CSS animated scene if no image exists

5. **Test your image:**
   - Enable "Static Image" background mode in Scene Settings
   - Navigate to the room in a roleplay action (e.g., `*walks into the living room*`)
   - The background should update to show your image

## Image Selection Logic

The system follows this priority order:

1. **Time-specific variant:** `{location}-{time}.jpg` (e.g., `living_room-night.jpg`)
2. **Base location image:** `{location}.jpg` (e.g., `living_room.jpg`)
3. **Fallback to CSS:** If no image exists, use CSS animated gradient background

## Performance Considerations

- Images are lazy-loaded only when needed
- Failed image loads automatically fallback to CSS backgrounds
- Consider using responsive images for mobile devices (future enhancement)
- Optimize images before adding them:
  ```bash
  # Example using ImageMagick
  convert input.jpg -quality 85 -resize 1920x1080 output.jpg
  ```

## Future Enhancements

- [ ] Mood-based image variants
- [ ] Multiple random images per location
- [ ] Parallax-ready multi-layer images
- [ ] Responsive image sets (different sizes for mobile/desktop)
- [ ] WebP format support with fallbacks
- [ ] Dynamic blur/filter effects based on context

## Placeholder Images

Currently, no images are included in this directory. The system will fall back to CSS animated backgrounds until images are added. To add placeholder images, you can:

1. Use royalty-free stock photos from sites like Unsplash or Pexels
2. Create simple gradient or solid color images as placeholders
3. Commission custom artwork matching your vision

## Example Usage in Code

The `RealisticSceneBackground` component automatically handles image loading:

```tsx
<RealisticSceneBackground 
  location="living_room"
  timeOfDay="night"
/>
```

This will attempt to load in order:
1. `/assets/scenes/living_room-night.jpg`
2. `/assets/scenes/living_room.jpg`
3. Falls back to CSS animated gradient if neither exists
