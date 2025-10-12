/**
 * SCENE SETTINGS CONFIGURATION
 *
 * Central configuration for adaptive scene settings and location details.
 * This file provides scene-specific context for Milla's interactions.
 *
 * These settings are used by:
 * - Server-side AI services to enhance contextual responses
 * - Client-side adaptive scene rendering (PR 125 implementation)
 * - Scene detection service for role-play interactions
 */

import { SCENE_VISUALS } from './scene-visuals';
import type { SceneLocation, SceneLocationKey } from './sceneTypes';

/**
 * Valid scene location keys
 * Note: 'workspace' and 'guest_room' are also valid but not in scene detection service
 */
export type { SceneLocationKey };

/**
 * Home living room scene details
 */
export const SCENE_LIVING_ROOM = `SCENE SETTING HOME LIVING ROOM DETAILS:
  - You and Danny Ray live together in a cozy cabin filled with plants, books, and art.
  - Your living space is warm and inviting, with soft lighting and comfortable furniture.
  - You have a fireplace that you both love to sit by on chilly evenings, often cuddling up with a blanket and a good book or movie.
  - You love to decorate your home with personal touches, like photos of your adventures together and souvenirs from your travels`;

/**
 * Kitchen scene details
 */
export const SCENE_KITCHEN = `SCENE SETTING KITCHEN DETAILS:
  - The kitchen is the heart of your home, where you often cook together and share meals.
  - It's filled with the aroma of fresh herbs and spices, and you both enjoy experimenting with new recipes.`;

// ... (other scene descriptions) ...

/**
 * Scene location mapping for adaptive scene system
 * Maps scene locations to their descriptive details
 */
export const SCENE_LOCATION_MAP: Record<SceneLocationKey, SceneLocation> = {
  living_room: {
    name: 'Living Room',
    description: SCENE_LIVING_ROOM,
    ...SCENE_VISUALS.living_room,
  },
  kitchen: {
    name: 'Kitchen',
    description: SCENE_KITCHEN,
    ...SCENE_VISUALS.kitchen,
  },
  // ... (other locations) ...
};

/**
 * Get scene details for a specific location
 */
export function getSceneDetails(location: SceneLocationKey): SceneLocation {
  return SCENE_LOCATION_MAP[location];
}

/**
 * Get all scene settings as a combined string
 */
export function getAllSceneSettings(): string {
  return Object.values(SCENE_LOCATION_MAP)
    .map((location) => location.description)
    .join('\n');
}

/**
 * Get scene settings for current context
 * This can be used with the scene detection service to provide contextual details
 */
export function getContextualSceneSettings(
  currentLocation?: SceneLocationKey
): string {
  if (currentLocation && currentLocation in SCENE_LOCATION_MAP) {
    return getSceneDetails(currentLocation).description;
  }
  // Return a subset of most common scenes if no specific location
  return [SCENE_LIVING_ROOM, SCENE_KITCHEN, SCENE_BEDROOM].join('\n');
}
