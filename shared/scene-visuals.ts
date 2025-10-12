/**
 * Scene Visuals Configuration
 *
 * This file defines the visual assets for each scene, including backgrounds,
 * weather effects, and other visual elements.
 */

import type {
  SceneLocation,
  SceneBackground,
  WeatherEffect,
} from '@shared/sceneTypes';

const LIVING_ROOM_BACKGROUNDS: SceneBackground[] = [
  {
    src: 'attached_assets/Logcabin.mp4',
    format: 'jpeg',
    alt: 'A cozy living room with a fireplace',
  },
  {
    src: 'backgrounds/living-room-night.jpg',
    format: 'jpeg',
    alt: 'A cozy living room at night',
  },
];

const KITCHEN_BACKGROUNDS: SceneBackground[] = [
  {
    src: 'backgrounds/kitchen-day.jpg',
    format: 'jpeg',
    alt: 'A bright and modern kitchen',
  },
  {
    src: 'backgrounds/kitchen-night.jpg',
    format: 'jpeg',
    alt: 'A modern kitchen at night',
  },
];

// ... Add other location backgrounds ...

export const SCENE_VISUALS: Record<string, Partial<SceneLocation>> = {
  living_room: {
    backgrounds: LIVING_ROOM_BACKGROUNDS,
  },
  kitchen: {
    backgrounds: KITCHEN_BACKGROUNDS,
  },
  // ... Add other locations ...
};

export const WEATHER_EFFECTS: Record<WeatherEffect, any> = {
  none: null,
  rain: {
    particle: 'rain-drop',
    density: 'medium',
  },
  snow: {
    particle: 'snow-flake',
    density: 'light',
  },
  fog: {
    particle: 'fog-cloud',
    density: 'heavy',
  },
};
