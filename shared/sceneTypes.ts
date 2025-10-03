/**
 * Adaptive Scene System - Shared Type Definitions
 * Asset-free, minimal scene system for Web and Android
 */

// Time of day bucket for scene theming
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

// Application state for adaptive visuals
export type AppState = 'idle' | 'listening' | 'thinking' | 'speaking';

// Performance mode for scene rendering
export type PerformanceMode = 'high-quality' | 'balanced' | 'performance';

/**
 * Scene context that drives visual adaptation
 */
export interface SceneContext {
  timeOfDay: TimeOfDay;
  appState: AppState;
  reducedMotion: boolean;
  performanceMode: PerformanceMode;
  isBackgrounded?: boolean; // Tab/app in background
}

/**
 * Feature flags for adaptive scenes
 */
export interface AdaptiveSceneConfig {
  enabled: boolean;
  performanceMode: PerformanceMode;
}

/**
 * Color palette for a scene
 */
export interface ScenePalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

/**
 * Scene theme derived from context
 */
export interface SceneTheme {
  palette: ScenePalette;
  gradientAngle: number;
  animationSpeed: number; // 0-1, 0 = no animation
  parallaxIntensity: number; // 0-1
}
