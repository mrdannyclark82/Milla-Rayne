/**
 * Scene configuration and theming utilities
 * Provides asset-free, procedural scene generation based on context
 */

import type {
  TimeOfDay,
  AppState,
  SceneTheme,
  ScenePalette,
} from '@shared/sceneTypes';

/**
 * Get time of day bucket based on current hour
 */
export function getCurrentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

/**
 * Get color palette for a given time of day
 */
export function getPaletteForTimeOfDay(timeOfDay: TimeOfDay): ScenePalette {
  const palettes: Record<TimeOfDay, ScenePalette> = {
    dawn: {
      primary: '#ff9a8b',
      secondary: '#ffc3a0',
      accent: '#ffafbd',
      background: '#1a1a2e',
    },
    day: {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      background: '#0f0f1e',
    },
    dusk: {
      primary: '#fa709a',
      secondary: '#fee140',
      accent: '#ff8c00',
      background: '#1e1e2e',
    },
    night: {
      primary: '#4c669f',
      secondary: '#3b5998',
      accent: '#192f6a',
      background: '#0a0a15',
    },
  };

  return palettes[timeOfDay];
}

/**
 * Get accent color modifier for app state
 */
export function getAccentForAppState(appState: AppState): string {
  const accents: Record<AppState, string> = {
    idle: '#667eea',
    listening: '#10b981', // Green for listening
    thinking: '#f59e0b', // Amber for thinking
    speaking: '#3b82f6', // Blue for speaking
  };

  return accents[appState];
}

/**
 * Generate complete scene theme from context
 */
export function generateSceneTheme(
  timeOfDay: TimeOfDay,
  appState: AppState,
  reducedMotion: boolean,
  performanceMode: 'high-quality' | 'balanced' | 'performance'
): SceneTheme {
  const palette = getPaletteForTimeOfDay(timeOfDay);

  // Override accent based on app state
  palette.accent = getAccentForAppState(appState);

  // Animation speed based on reduced motion and performance mode
  let animationSpeed = 1;
  if (reducedMotion) {
    animationSpeed = 0;
  } else if (performanceMode === 'performance') {
    animationSpeed = 0.5;
  } else if (performanceMode === 'high-quality') {
    animationSpeed = 1;
  } else {
    animationSpeed = 0.75; // balanced
  }

  // Parallax intensity based on performance mode
  let parallaxIntensity = 0;
  if (!reducedMotion) {
    if (performanceMode === 'high-quality') {
      parallaxIntensity = 1;
    } else if (performanceMode === 'balanced') {
      parallaxIntensity = 0.5;
    }
    // performance mode has 0 parallax
  }

  return {
    palette,
    gradientAngle: 135, // Fixed diagonal gradient
    animationSpeed,
    parallaxIntensity,
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Check if page is backgrounded (for throttling animations)
 */
export function isPageBackgrounded(): boolean {
  if (typeof document === 'undefined') return false;
  return document.hidden;
}
