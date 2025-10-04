import { SceneConfig, SceneMood, TimeOfDay } from '@/types/scene';

export const TIME_BASED_SCENES: Record<TimeOfDay, SceneConfig> = {
  dawn: {
    colors: ['#FF6B9D', '#FFA07A', '#FFD700', '#87CEEB'],
    animations: ['gentle-wave', 'fade-in-out'],
    particles: { type: 'stars', density: 'low', speed: 0.5 },
    interactive: true
  },
  day: {
    colors: ['#87CEEB', '#B0E0E6', '#ADD8E6', '#E0F6FF'],
    animations: ['breathing', 'shimmer'],
    particles: { type: 'sparkles', density: 'medium', speed: 1.0 },
    interactive: true
  },
  dusk: {
    colors: ['#FF6B6B', '#FF8E53', '#FE6B8B', '#C471ED'],
    animations: ['slow-rotate', 'glow-pulse'],
    particles: { type: 'sparkles', density: 'high', speed: 0.8 },
    interactive: true
  },
  night: {
    colors: ['#0F2027', '#203A43', '#2C5364', '#1A1A2E'],
    animations: ['twinkle', 'drift'],
    particles: { type: 'stars', density: 'high', speed: 0.3 },
    interactive: true
  }
};

export const MOOD_BASED_SCENES: Record<SceneMood, Partial<SceneConfig>> = {
  calm: {
    colors: ['#667eea', '#764ba2', '#89CFF0', '#A8D8EA'],
    animations: ['gentle-wave', 'breathing'],
  },
  energetic: {
    colors: ['#f093fb', '#f5576c', '#FF6B9D', '#FEC163'],
    animations: ['pulse', 'bounce'],
  },
  romantic: {
    colors: ['#FE6B8B', '#FF8E53', '#FFAFBD', '#FFC3A0'],
    animations: ['breathing', 'glow-pulse'],
    particles: { type: 'hearts', density: 'low', speed: 0.6 }
  },
  mysterious: {
    colors: ['#2E3440', '#3B4252', '#434C5E', '#4C566A'],
    animations: ['mist', 'slow-rotate'],
    particles: { type: 'mist', density: 'medium', speed: 0.4 }
  },
  playful: {
    colors: ['#FF6B9D', '#C471ED', '#12c2e9', '#f64f59'],
    animations: ['bounce', 'wiggle'],
    particles: { type: 'sparkles', density: 'high', speed: 1.2 }
  }
};

export function getSceneForContext(
  timeOfDay: TimeOfDay,
  mood: SceneMood
): SceneConfig {
  const timeScene = TIME_BASED_SCENES[timeOfDay];
  const moodScene = MOOD_BASED_SCENES[mood];

  // Merge configurations, prioritizing mood-specific settings
  return {
    colors: moodScene.colors || timeScene.colors,
    animations: [...(timeScene.animations || []), ...(moodScene.animations || [])],
    particles: moodScene.particles || timeScene.particles,
    interactive: timeScene.interactive
  };
}

export function getCurrentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

/**
 * Map location to mood for scene adaptation (Phase 3 - RP scenes)
 * This provides mood suggestions based on scene location
 */
export function getLocationMood(location: string): SceneMood {
  const locationMoodMap: Record<string, SceneMood> = {
    living_room: 'calm',
    bedroom: 'romantic',
    kitchen: 'energetic',
    bathroom: 'calm',
    front_door: 'energetic',
    dining_room: 'calm',
    outdoor: 'playful',
    car: 'energetic',
    unknown: 'calm'
  };
  
  return locationMoodMap[location] || 'calm';
}
