# Room Overlays V1 - Implementation Summary

## Overview
Room Overlays V1 adds location-specific visual silhouettes to the left 2/3 of the viewport, providing environmental context for RP scenes. Each location has a unique SVG-based overlay with ambient lighting effects that respond to time of day.

## Files Added

### Core Components
- **`client/src/components/scene/RoomOverlay.tsx`**: Main orchestrator component that selects the appropriate overlay based on location
- **`client/src/components/scene/overlays/`**: Directory containing individual overlay components:
  - `LivingRoomOverlay.tsx` - Couch silhouette with fireplace glow
  - `KitchenOverlay.tsx` - Counter/shelf shapes with task light
  - `DiningOverlay.tsx` - Table with pendant light glow
  - `BedroomOverlay.tsx` - Bed/headboard with nightstand lamp
  - `WorkspaceOverlay.tsx` - Desk with monitor glow
  - `BathroomOverlay.tsx` - Vanity with mirror shine
  - `GuestRoomOverlay.tsx` - Simplified bed variant
  - `OutdoorsOverlay.tsx` - Treeline/porch with stars at night

## Files Modified

### Settings & State
- **`client/src/types/scene.ts`**: Added `sceneRoomOverlaysEnabled` to `SceneSettings` interface
- **`client/src/utils/sceneSettingsStore.ts`**: Added default value (true) for room overlays setting
- **`client/src/components/scene/SceneSettingsPanel.tsx`**: Added toggle for "Room overlays (location silhouettes)"

### Context & Integration
- **`client/src/components/scene/RPSceneBackgroundBridge.tsx`**: 
  - Added `RPSceneContext` with `createContext`
  - Exported `useRPSceneContext()` hook
  - Wrapped children in context provider while maintaining backward compatibility
- **`client/src/App.tsx`**: Mounted `RoomOverlay` component between background and stage

## Technical Details

### Layering (Z-Index)
```
Chat/Controls:        z-0 and above
Milla Stage:          z-5 (RPStageAnchor)
Room Overlays:        z-7 (new - between background and stage)
Adaptive Background:  z-10 (left 2/3 region)
```

### Location Mapping
The `normalizeLocation()` function maps various location strings to standard `SceneLocation` types:
- `living_room`, `lounge` → LivingRoomOverlay
- `kitchen` → KitchenOverlay
- `dining_room`, `dining` → DiningOverlay
- `bedroom` → BedroomOverlay (or GuestRoomOverlay if "guest" in name)
- `office`, `workspace`, `study` → WorkspaceOverlay
- `bathroom`, `bath` → BathroomOverlay
- `outdoor`, `outside`, `porch`, `garden` → OutdoorsOverlay

### Time-of-Day Effects
Each overlay adjusts:
- **Opacity**: Lower at night (0.15), higher during day (0.25-0.3)
- **Glow intensity**: Lamps/lights brighter at night/dusk
- **Special effects**: Stars visible only at night/dusk for outdoor scenes

### Reduced Motion Support
- When `reducedMotion` prop is true, all pulse/animation classes are disabled
- Only static silhouettes are shown
- Respects `prefers-reduced-motion: reduce` media query

### Performance
- SVG-based (lightweight, scalable)
- CSS transforms and opacity only (GPU-accelerated)
- `pointer-events: none` - no interaction blocking
- `aria-hidden="true"` - no screen reader interference

## Usage

### User Settings
Users can toggle room overlays via Scene Settings Dialog:
1. Click Settings icon in UI
2. Navigate to "Scene Settings"
3. Toggle "Room overlays (location silhouettes)" ON/OFF

### Programmatic Access
```typescript
import { useRPSceneContext } from '@/components/scene/RPSceneBackgroundBridge';

function MyComponent() {
  const { location, timeOfDay, mood } = useRPSceneContext();
  // Access current RP scene state
}
```

## Testing
- ✅ Build succeeds with TypeScript checks
- ✅ All overlays render at correct z-index
- ✅ Settings toggle persists to localStorage
- ✅ Reduced motion respected
- ✅ Backward compatible with existing RP scene bridge API

## Future Enhancements
- Additional locations (garage, hallway, balcony)
- More detailed silhouettes with multiple variants per location
- Seasonal overlays (e.g., outdoor scene with snow in winter)
- Interactive elements (subtle parallax on hover if not reduced motion)
