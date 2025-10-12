/**
 * Adaptive Scene System - Shared Type Definitions
 * Asset-free, minimal scene system for Web and Android
 */

// Valid scene location keys
export type SceneLocationKey =
  | 'living_room'
  | 'kitchen'
  | 'dining_room'
  | 'bedroom'
  | 'bathroom'
  | 'workspace'
  | 'guest_room'
  | 'outdoor';

// Time of day bucket for scene theming
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

// Application state for adaptive visuals
export type AppState = 'idle' | 'listening' | 'thinking' | 'speaking';

// Performance mode for scene rendering
export type PerformanceMode = 'high-quality' | 'balanced' | 'performance';

// Weather effects for dynamic environments
export type WeatherEffect = 'none' | 'rain' | 'snow' | 'fog';

// Modern image formats
export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif';

/**
 * Scene context that drives visual adaptation
 */
export interface SceneContext {
  timeOfDay: TimeOfDay;
  appState: AppState;
  reducedMotion: boolean;
  performanceMode: PerformanceMode;
  isBackgrounded?: boolean; // Tab/app in background
  weatherEffect: WeatherEffect; // New weather effect
  location: SceneLocationKey; // Current scene location
}

/**
 * Feature flags for adaptive scenes
 */
export interface AdaptiveSceneConfig {
  enabled: boolean;
  performanceMode: PerformanceMode;
}

/**
 * Represents a single background image with format options
 */
export interface SceneBackground {
  src: string;
  format: ImageFormat;
  alt: string;
}

/**
 * Defines a location with multiple backgrounds and properties
 */
export interface SceneLocation {
  name: string;
  description: string;
  backgrounds: SceneBackground[];
  // Future properties like parallax settings, etc.
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
