/**
 * Scene Settings Store
 * Manages persistence and access to scene settings via localStorage
 */

import { SceneSettings } from '@/types/scene';

const STORAGE_KEY = 'milla.scene.settings.v1';
const SETTINGS_VERSION = 1;

interface StoredSettings {
  version: number;
  settings: SceneSettings;
}

/**
 * Default scene settings
 * - Enabled by default
 * - Auto-disable with reduced motion (handled at runtime)
 * - Conservative defaults for performance
 */
export function getDefaultSettings(): SceneSettings {
  return {
    enabled: true,
    mood: 'calm',
    enableParticles: true,
    enableParallax: true,
    parallaxIntensity: 50,
    particleDensity: 'medium',
    animationSpeed: 1.0,
    devDebug: false,
    sceneBackgroundFromRP: true // Phase 3: Enabled by default
  };
}

/**
 * Load scene settings from localStorage
 * Returns defaults if not found or invalid
 */
export function loadSceneSettings(): SceneSettings {
  if (typeof window === 'undefined') {
    return getDefaultSettings();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultSettings();
    }

    const parsed: StoredSettings = JSON.parse(stored);
    
    // Validate version for future migrations
    if (parsed.version !== SETTINGS_VERSION) {
      console.warn('Scene settings version mismatch, using defaults');
      return getDefaultSettings();
    }

    // Validate and sanitize settings
    const settings = parsed.settings;
    return {
      enabled: typeof settings.enabled === 'boolean' ? settings.enabled : true,
      mood: ['calm', 'energetic', 'romantic', 'mysterious', 'playful'].includes(settings.mood) 
        ? settings.mood 
        : 'calm',
      enableParticles: typeof settings.enableParticles === 'boolean' ? settings.enableParticles : true,
      enableParallax: typeof settings.enableParallax === 'boolean' ? settings.enableParallax : true,
      parallaxIntensity: clamp(settings.parallaxIntensity ?? 50, 0, 75),
      particleDensity: ['off', 'low', 'medium', 'high'].includes(settings.particleDensity) 
        ? settings.particleDensity 
        : 'medium',
      animationSpeed: clamp(settings.animationSpeed ?? 1.0, 0.5, 1.5),
      devDebug: typeof settings.devDebug === 'boolean' ? settings.devDebug : false,
      sceneBackgroundFromRP: typeof settings.sceneBackgroundFromRP === 'boolean' ? settings.sceneBackgroundFromRP : true
    };
  } catch (error) {
    console.error('Error loading scene settings:', error);
    return getDefaultSettings();
  }
}

/**
 * Save scene settings to localStorage
 */
export function saveSceneSettings(settings: SceneSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const stored: StoredSettings = {
      version: SETTINGS_VERSION,
      settings
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    
    // Trigger storage event for cross-tab sync
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Error saving scene settings:', error);
  }
}

/**
 * Update partial settings and persist
 */
export function updateSceneSettings(partial: Partial<SceneSettings>): SceneSettings {
  const current = loadSceneSettings();
  const updated = { ...current, ...partial };
  saveSceneSettings(updated);
  return updated;
}

/**
 * Listen for settings changes (cross-tab sync)
 */
export function onSettingsChange(callback: (settings: SceneSettings) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = () => {
    callback(loadSceneSettings());
  };

  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

/**
 * Clamp a number between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
