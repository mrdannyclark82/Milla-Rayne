# Centralized Configuration Guide

## Overview

This guide explains the centralized configuration system for Milla's persona and scene settings, implemented to address the issue of scattered configuration across multiple files.

## Files Created

### 1. `shared/millaPersona.ts`

**Purpose**: Central repository for all Milla Rayne personality configuration and behavioral patterns.

**Key Exports**:

- `MILLA_CORE_IDENTITY` - Core identity and primary function
- `MILLA_ADAPTIVE_PERSONALITY` - Adaptive personality traits
- `MILLA_MEMORY_CONTINUITY` - Memory and relationship continuity
- `MILLA_PERSONALITY_MATRIX` - How Milla expresses herself
- `MILLA_CONTEXTUAL_AWARENESS` - Contextual awareness guidelines
- `MILLA_SCENE_PROGRESSION` - Scene setting and progression
- `MILLA_INTIMACY_ESCALATION` - Intimacy and escalation guidelines
- `MILLA_TECHNICAL_CAPABILITIES` - Technical capabilities
- `MILLA_RELATIONSHIP_DYNAMICS` - Relationship dynamics
- `MILLA_ABSOLUTE_REQUIREMENTS` - Absolute requirements
- `MILLA_CORE_BEING` - Core personality matrix
- `MILLA_COMMUNICATION_PATTERNS` - Communication patterns
- `MILLA_SPECIAL_CAPABILITIES` - Special capabilities
- `getMillaPersona()` - Returns complete persona configuration
- `getMillaPersonaCondensed()` - Returns condensed persona for token-limited services

**Usage**:

```typescript
import {
  getMillaPersona,
  getMillaPersonaCondensed,
} from '../shared/millaPersona';

// For services with generous token limits
const fullPersona = getMillaPersona();

// For services with strict token limits
const condensedPersona = getMillaPersonaCondensed();
```

### 2. `shared/sceneSettings.ts`

**Purpose**: Central repository for adaptive scene settings and location details.

**Key Exports**:

- `SCENE_LIVING_ROOM` - Living room scene details
- `SCENE_KITCHEN` - Kitchen scene details
- `SCENE_DINING_AREA` - Dining area scene details
- `SCENE_BEDROOM` - Bedroom scene details
- `SCENE_BATHROOM` - Bathroom scene details
- `SCENE_WORKSPACE` - Workspace scene details
- `SCENE_GUEST_ROOM` - Guest room scene details
- `SCENE_OUTDOORS` - Outdoor scene details
- `SCENE_LOCATION_MAP` - Map of all scene locations
- `getSceneDetails(location)` - Get details for a specific location
- `getAllSceneSettings()` - Get all scene settings combined
- `getContextualSceneSettings(currentLocation?)` - Get contextual scene settings

**Usage**:

```typescript
import {
  getAllSceneSettings,
  getSceneDetails,
  getContextualSceneSettings,
} from '../shared/sceneSettings';

// Get all scene settings
const allScenes = getAllSceneSettings();

// Get specific scene details
const bedroomDetails = getSceneDetails('bedroom');

// Get contextual scene settings (with optional current location)
const contextualSettings = getContextualSceneSettings('living_room');
```

## Integration Points

### Server-Side AI Services

#### `server/openrouterService.ts`

- Uses `getMillaPersona()` for complete personality configuration
- Uses `getAllSceneSettings()` for scene context
- Reduced from ~400 lines to ~210 lines of code

#### `server/xaiService.ts`

- Uses `getMillaPersonaCondensed()` for token-efficient personality configuration
- Uses `getAllSceneSettings()` for scene context
- Reduced code duplication

#### `server/sceneDetectionService.ts`

- Integrates with centralized scene settings
- New functions added:
  - `getSceneDescription(location)` - Maps scene detection locations to centralized settings
  - `getSceneContextSettings(sceneContext)` - Gets contextual settings for detected scene

### Client-Side Integration (Future)

The centralized configuration is ready for use in the client-side adaptive scene system (PR 125). Client components can import and use:

```typescript
import { getSceneDetails } from '@shared/sceneSettings';
import type { SceneLocationKey } from '@shared/sceneSettings';

// Use in adaptive scene rendering
const sceneDetails = getSceneDetails('bedroom');
```

## Benefits

1. **Single Source of Truth**: All persona and scene configuration in one place
2. **Consistency**: All AI services use the same configuration
3. **Maintainability**: Changes need to be made in only one location
4. **Reduced Code**: Eliminated ~200 lines of duplicated configuration
5. **Type Safety**: Proper TypeScript types for all configurations
6. **Flexibility**: Different functions for different use cases (full vs. condensed)
7. **Integration Ready**: Prepared for PR 125 adaptive scene implementation

## Security Note

These configuration files contain personality and scene descriptions, not secrets or sensitive data. They are safe to commit to version control. API keys and other secrets should continue to be stored in environment variables.

## Future Enhancements

1. **Dynamic Scene Loading**: Scene settings could be loaded from a database or API
2. **User Customization**: Allow users to customize scene settings
3. **A/B Testing**: Different persona variations for testing
4. **Localization**: Support for multiple languages
5. **Conditional Logic**: Scene settings that adapt based on time, weather, etc.

## Maintenance

To update Milla's personality or scene settings:

1. Edit the relevant constants in `shared/millaPersona.ts` or `shared/sceneSettings.ts`
2. Run `npm run check` to verify TypeScript compilation
3. Run `npm run build` to ensure the build succeeds
4. Test the changes with the AI services

No changes needed in individual service files unless adding new functionality.
