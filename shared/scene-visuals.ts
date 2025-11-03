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
    src: '/assets/scenes/living_room.jpg',
    format: 'jpeg',
    alt: 'A cozy living room',
  },
  {
    src: '/assets/scenes/living_room-fireplace.jpg',
    format: 'jpeg',
    alt: 'A cozy living room with a fireplace',
  },
  {
    src: '/assets/scenes/living_room-night.jpg',
    format: 'jpeg',
    alt: 'A cozy living room at night',
  },
];

const KITCHEN_BACKGROUNDS: SceneBackground[] = [
  {
    src: '/assets/scenes/kitchen-day.jpg',
    format: 'jpeg',
    alt: 'A bright and modern kitchen',
  },
  {
    src: '/assets/scenes/kitchen-night.jpg',
    format: 'jpeg',
    alt: 'A modern kitchen at night',
  },
];

const BEDROOM_BACKGROUNDS: SceneBackground[] = [
  {
    src: '/assets/scenes/bedroom.jpg',
    format: 'jpeg',
    alt: 'A cozy bedroom',
  },
  {
    src: '/assets/scenes/bedroom-night.jpg',
    format: 'jpeg',
    alt: 'A cozy bedroom at night',
  },
];

const BATHROOM_BACKGROUNDS: SceneBackground[] = [
  {
    src: '/assets/scenes/bath_room.jpg',
    format: 'jpeg',
    alt: 'A modern bathroom',
  },
];

const OUTDOOR_BACKGROUNDS: SceneBackground[] = [
  {
    src: '/assets/scenes/outdoor-night.jpg',
    format: 'jpeg',
    alt: 'A beautiful outdoor scene at night',
  },
];

const FRONT_DOOR_BACKGROUNDS: SceneBackground[] = [
  {
    src: '/assets/scenes/front_door.jpg',
    format: 'jpeg',
    alt: 'Front door entrance',
  },
];

export const SCENE_VISUALS: Record<string, Partial<SceneLocation>> = {
  living_room: {
    backgrounds: LIVING_ROOM_BACKGROUNDS,
  },
  kitchen: {
    backgrounds: KITCHEN_BACKGROUNDS,
  },
  bedroom: {
    backgrounds: BEDROOM_BACKGROUNDS,
  },
  bathroom: {
    backgrounds: BATHROOM_BACKGROUNDS,
  },
  outdoor: {
    backgrounds: OUTDOOR_BACKGROUNDS,
  },
  front_door: {
    backgrounds: FRONT_DOOR_BACKGROUNDS,
  },
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
