/**
 * Feature flag configuration for adaptive scenes
 * Reads from environment variables (server-side) or runtime config
 */

import type { AdaptiveSceneConfig, PerformanceMode } from '@shared/sceneTypes';

/**
 * Get adaptive scene configuration from environment/settings
 */
export function getAdaptiveSceneConfig(): AdaptiveSceneConfig {
  // In production, this would read from a config API or environment
  // For demo purposes, we check localStorage and fall back to disabled

  let enabled = false;
  let performanceMode: PerformanceMode = 'balanced';

  if (typeof window !== 'undefined') {
    try {
      // Check localStorage for demo toggle
      const storedEnabled = localStorage.getItem('adaptiveScenes.enabled');
      if (storedEnabled !== null) {
        enabled = storedEnabled === 'true';
      }

      const storedPerformanceMode = localStorage.getItem(
        'adaptiveScenes.performanceMode'
      );
      if (
        storedPerformanceMode &&
        ['high-quality', 'balanced', 'performance'].includes(
          storedPerformanceMode
        )
      ) {
        performanceMode = storedPerformanceMode as PerformanceMode;
      }
    } catch (error) {
      console.warn(
        'Error reading adaptive scene config from localStorage:',
        error
      );
    }
  }

  return {
    enabled,
    performanceMode,
  };
}

/**
 * Set adaptive scene enabled state (demo/development only)
 */
export function setAdaptiveScenesEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('adaptiveScenes.enabled', String(enabled));
      // Trigger storage event for other tabs/components
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.warn(
        'Error saving adaptive scene config to localStorage:',
        error
      );
    }
  }
}

/**
 * Set adaptive scene performance mode (demo/development only)
 */
export function setAdaptiveScenesPerformanceMode(mode: PerformanceMode): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('adaptiveScenes.performanceMode', mode);
      // Trigger storage event for other tabs/components
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.warn(
        'Error saving adaptive scene config to localStorage:',
        error
      );
    }
  }
}
