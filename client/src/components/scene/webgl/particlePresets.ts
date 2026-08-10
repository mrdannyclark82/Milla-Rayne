/**
 * Presets mapping scene domain types (ParticleType, TimeOfDay, SceneMood)
 * to the numeric/color parameters used by the WebGL particle & lighting
 * shaders. Keeping these tables separate from the renderer keeps the
 * renderer itself focused on orchestration.
 */

import { ParticleType, SceneMood, TimeOfDay } from '@/types/scene';

export interface ParticlePhysicsPreset {
  /** Base RGB color (0-1 range) for the particle. */
  color: [number, number, number];
  /** Secondary RGB color particles are blended toward for variety. */
  color2: [number, number, number];
  /** Point size in pixels before pixel-ratio/perspective scaling. */
  size: number;
  /** Vertical drift speed. Positive = falls, negative = rises. */
  gravity: number;
  /** Horizontal turbulence amplitude (world units). */
  turbulence: number;
  /** Overall time-scale multiplier for this particle type's motion. */
  speedMultiplier: number;
  /** Base render opacity (0-1). */
  opacity: number;
}

export const PARTICLE_PHYSICS_PRESETS: Record<
  ParticleType,
  ParticlePhysicsPreset
> = {
  stars: {
    color: [1, 1, 1],
    color2: [0.75, 0.85, 1],
    size: 10,
    gravity: 0.02,
    turbulence: 0.3,
    speedMultiplier: 0.4,
    opacity: 0.95,
  },
  sparkles: {
    color: [1, 0.92, 0.55],
    color2: [1, 1, 1],
    size: 8,
    gravity: -0.08,
    turbulence: 0.6,
    speedMultiplier: 0.8,
    opacity: 0.9,
  },
  hearts: {
    color: [1, 0.42, 0.62],
    color2: [1, 0.68, 0.75],
    size: 14,
    gravity: -0.05,
    turbulence: 0.9,
    speedMultiplier: 0.6,
    opacity: 0.85,
  },
  petals: {
    color: [1, 0.71, 0.76],
    color2: [1, 0.55, 0.35],
    size: 12,
    gravity: 0.1,
    turbulence: 1.3,
    speedMultiplier: 0.7,
    opacity: 0.85,
  },
  mist: {
    color: [0.75, 0.78, 0.82],
    color2: [0.9, 0.9, 0.95],
    size: 34,
    gravity: 0.01,
    turbulence: 1.6,
    speedMultiplier: 0.25,
    opacity: 0.35,
  },
  snowflakes: {
    color: [1, 1, 1],
    color2: [0.85, 0.9, 1],
    size: 9,
    gravity: 0.16,
    turbulence: 0.5,
    speedMultiplier: 0.5,
    opacity: 0.9,
  },
};

export interface LightingPreset {
  /** Hex color for the ambient light. */
  ambientColor: string;
  /** Ambient light intensity. */
  ambientIntensity: number;
  /** Hex color for the key directional/point light. */
  keyColor: string;
  /** Key light intensity. */
  keyIntensity: number;
  /** Fog/atmosphere near-far range multiplier (smaller = denser fog). */
  fogDensity: number;
}

const TIME_LIGHTING: Record<TimeOfDay, LightingPreset> = {
  dawn: {
    ambientColor: '#ffd9b3',
    ambientIntensity: 0.55,
    keyColor: '#ffb37a',
    keyIntensity: 1.1,
    fogDensity: 0.9,
  },
  day: {
    ambientColor: '#e8f6ff',
    ambientIntensity: 0.75,
    keyColor: '#ffffff',
    keyIntensity: 1.3,
    fogDensity: 1.2,
  },
  dusk: {
    ambientColor: '#ff9d7a',
    ambientIntensity: 0.5,
    keyColor: '#ff6b6b',
    keyIntensity: 1.0,
    fogDensity: 0.85,
  },
  night: {
    ambientColor: '#1a2a4a',
    ambientIntensity: 0.35,
    keyColor: '#6f8fff',
    keyIntensity: 0.6,
    fogDensity: 0.6,
  },
};

// Subtle mood-driven tint applied on top of the time-of-day lighting to
// keep the two systems independent while still letting mood influence tone.
const MOOD_TINT: Record<SceneMood, { keyColor: string; intensityScale: number }> = {
  calm: { keyColor: '#89cff0', intensityScale: 1.0 },
  energetic: { keyColor: '#ff6b9d', intensityScale: 1.15 },
  romantic: { keyColor: '#ff8e9e', intensityScale: 0.95 },
  mysterious: { keyColor: '#7b6ad0', intensityScale: 0.8 },
  playful: { keyColor: '#ffd166', intensityScale: 1.1 },
};

export function getLightingPreset(
  timeOfDay: TimeOfDay,
  mood: SceneMood
): LightingPreset & { moodKeyColor: string } {
  const base = TIME_LIGHTING[timeOfDay];
  const tint = MOOD_TINT[mood];
  return {
    ...base,
    keyIntensity: base.keyIntensity * tint.intensityScale,
    moodKeyColor: tint.keyColor,
  };
}

export function particleCountForDensity(
  density: 'off' | 'low' | 'medium' | 'high'
): number {
  switch (density) {
    case 'off':
      return 0;
    case 'low':
      return 900;
    case 'medium':
      return 2200;
    case 'high':
      return 4200;
    default:
      return 2200;
  }
}
