# Static Image Backgrounds - Quick Start Guide

## Overview

The adaptive scene system now supports static image backgrounds for different rooms and locations. This allows you to use photo-realistic backgrounds instead of (or in addition to) CSS animated gradients.

## Quick Start

### 1. Add Your Images

Place image files in `/client/public/assets/scenes/` following this naming convention:

**Basic format:**

```
{location}.jpg
```

**With time-of-day variants:**

```
{location}-{time}.jpg
```

Where:

- `{location}` = living_room, bedroom, kitchen, bathroom, dining_room, outdoor, car, or front_door
- `{time}` = morning, day, dusk, or night

### 2. Examples

```
/client/public/assets/scenes/
├── living_room.jpg              # Base living room (used all day if no variants)
├── living_room-night.jpg        # Living room at night (8pm-6am)
├── bedroom.jpg                  # Base bedroom
├── bedroom-night.jpg            # Bedroom at night
├── kitchen-morning.jpg          # Kitchen in morning (6am-10am)
└── outdoor.jpg                  # Outdoor/garden
```

### 3. Enable Static Images

1. Click the **Scene** button in the top-right
2. Find **Background Mode** dropdown
3. Select one of:
   - **Auto (Smart)** - Uses images when available, CSS otherwise (recommended)
   - **Static Image** - Always tries to use images first
   - **CSS Animated** - Always uses CSS gradients (original behavior)

### 4. Test It

Send a roleplay message to change location:

```
*walks into the living room*
*goes to the kitchen*
*steps outside*
```

The background will automatically switch to the appropriate image (if available) or fall back to a CSS gradient.

## Image Selection Logic

The system tries images in this order:

1. **Time-specific variant**: `{location}-{current_time}.jpg`
   - Example: `living_room-night.jpg` when time is between 8pm-6am

2. **Base location image**: `{location}.jpg`
   - Example: `living_room.jpg` (used if no time variant exists)

3. **CSS gradient fallback**: Automatic if no images found
   - No broken images or errors
   - Seamless integration with existing scene system

## Image Requirements

### Recommended Specifications

- **Resolution**: 1920x1080 or higher (16:9 aspect ratio)
- **Format**: JPG (photos) or PNG (graphics with transparency)
- **File size**: Under 500KB per image (optimize for web)
- **Quality**: Balance between visual quality and load time

### Optimization Tips

Use ImageMagick to optimize:

```bash
convert input.jpg -quality 85 -resize 1920x1080 output.jpg
```

Or use online tools:

- [TinyPNG](https://tinypng.com/) - PNG/JPG compression
- [Squoosh](https://squoosh.app/) - Google's image optimizer

## Supported Locations

Based on the `SceneLocation` type:

| Location      | Description             | Example Message           |
| ------------- | ----------------------- | ------------------------- |
| `living_room` | Living room, lounge     | _sits in the living room_ |
| `bedroom`     | Bedroom, personal space | _goes to the bedroom_     |
| `kitchen`     | Kitchen, cooking area   | _walks into the kitchen_  |
| `bathroom`    | Bathroom                | _steps into the bathroom_ |
| `dining_room` | Dining room             | _enters the dining room_  |
| `outdoor`     | Outside, porch, garden  | _goes outside_            |
| `car`         | Vehicle interior        | _gets in the car_         |
| `front_door`  | Entrance, doorway       | _opens the front door_    |

## Time-of-Day Periods

| Time Period | Hours      | Example Filename      |
| ----------- | ---------- | --------------------- |
| `morning`   | 6am - 10am | `kitchen-morning.jpg` |
| `day`       | 10am - 5pm | `living_room-day.jpg` |
| `dusk`      | 5pm - 8pm  | `outdoor-dusk.jpg`    |
| `night`     | 8pm - 6am  | `bedroom-night.jpg`   |

## Finding Images

### Free Stock Photo Sources

- [Unsplash](https://unsplash.com/) - High-quality free photos
- [Pexels](https://pexels.com/) - Free stock photos and videos
- [Pixabay](https://pixabay.com/) - Free images and illustrations

### Search Tips

- Use specific terms: "modern living room interior", "cozy bedroom night", etc.
- Look for images with good depth and atmosphere
- Consider lighting that matches time of day
- Choose images that work well as backgrounds (not too busy)

## Troubleshooting

### Images Not Loading?

1. **Check file path**: Files must be in `/client/public/assets/scenes/`
2. **Check filename**: Must match location name exactly (e.g., `living_room.jpg` not `livingroom.jpg`)
3. **Check format**: Use `.jpg`, `.jpeg`, or `.png` extensions
4. **Check mode**: Background Mode must be set to "Auto" or "Static Image"
5. **Check browser console**: Look for 404 errors on image URLs

### Performance Issues?

1. **Optimize images**: Reduce file size without losing quality
2. **Use JPG**: Better compression for photos than PNG
3. **Resize images**: Don't use 4K images; 1920x1080 is sufficient
4. **Limit variants**: You don't need all 4 time variants for every room

### Fallback Behavior

If an image fails to load, the system automatically falls back to CSS gradients. This is by design - there are no error states or broken images. Users won't notice if an image is missing.

## Advanced Usage

### Future Enhancements (Planned)

The system is designed to support future features:

1. **Mood-based variants**: `bedroom-night-romantic.jpg`
2. **Multiple random images**: Rotate between several options
3. **Parallax layers**: Multi-layer images for depth
4. **Responsive images**: Different sizes for mobile/desktop
5. **WebP format**: Modern format with better compression

### Custom Implementations

Developers can extend `RealisticSceneBackground.tsx` to:

- Add custom image sources (CDN, API, etc.)
- Implement image transitions/effects
- Add image preloading for smoother switches
- Support additional file formats

## Best Practices

1. **Start simple**: Add base images first, then add time variants if needed
2. **Test on different devices**: Check load times and visual quality
3. **Keep it consistent**: Use similar styles/lighting across all rooms
4. **Document your choices**: Add notes about image sources and licenses
5. **Version control**: Use Git LFS for large image files if needed

## Complete Example

Here's a complete setup for a cozy home:

```
/client/public/assets/scenes/
├── README.md                     # Documentation (already exists)
├── .gitkeep                      # Git tracking (already exists)
├── living_room.jpg               # Warm, inviting living room
├── living_room-night.jpg         # Same room with lamps on, darker
├── bedroom.jpg                   # Comfortable bedroom, daylight
├── bedroom-night.jpg             # Bedroom with soft bedside lamp
├── kitchen.jpg                   # Clean, modern kitchen
├── kitchen-morning.jpg           # Kitchen with morning sunlight
├── dining_room.jpg               # Elegant dining area
├── bathroom.jpg                  # Clean, spa-like bathroom
└── outdoor.jpg                   # Garden or porch view
```

Total: 9 images, approximately 2-4 MB total if optimized properly.

## Getting Help

- **Full documentation**: See `/client/public/assets/scenes/README.md`
- **Code reference**: See `RealisticSceneBackground.tsx` component
- **Type definitions**: See `/client/src/types/scene.ts`

## License & Attribution

When using stock photos:

1. Check the license (most free stock photos are CC0 or similar)
2. Give attribution if required
3. Don't claim ownership of others' work
4. Consider keeping a `CREDITS.md` file listing image sources

Enjoy your personalized, immersive backgrounds! 🎨✨
