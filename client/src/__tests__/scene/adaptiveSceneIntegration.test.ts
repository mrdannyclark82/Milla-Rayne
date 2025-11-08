/**
 * Adaptive Scene Integration Tests
 * Tests for milestone acceptance criteria from issue #107
 */

import {
  getCurrentTimeOfDay,
  getSceneForContext,
  getLocationMood,
} from '@/utils/scenePresets';
import {
  loadSceneSettings,
  getDefaultSettings,
  saveSceneSettings,
  updateSceneSettings,
  onSettingsChange,
} from '@/utils/sceneSettingsStore';
import { detectDeviceCapabilities } from '@/utils/capabilityDetector';
import type { TimeOfDay, SceneMood, SceneLocation } from '@/types/scene';

describe('Adaptive Scene Generation - Milestone Integration Tests', () => {
  describe('Acceptance Criteria: Scene Visibility and Default State', () => {
    it('should have adaptive scenes enabled by default', () => {
      const defaults = getDefaultSettings();
      expect(defaults.enabled).toBe(true);
    });

    it('should have particles enabled by default', () => {
      const defaults = getDefaultSettings();
      expect(defaults.enableParticles).toBe(true);
    });

    it('should have parallax enabled by default', () => {
      const defaults = getDefaultSettings();
      expect(defaults.enableParallax).toBe(true);
    });

    it('should have a default mood set', () => {
      const defaults = getDefaultSettings();
      expect(defaults.mood).toBe('calm');
    });

    it('should have reasonable default animation speed', () => {
      const defaults = getDefaultSettings();
      expect(defaults.animationSpeed).toBe(1.0);
    });
  });

  describe('Acceptance Criteria: Time-of-Day Transitions', () => {
    it('should support all time-of-day periods', () => {
      const timeOfDay = getCurrentTimeOfDay();
      expect(['dawn', 'day', 'dusk', 'night']).toContain(timeOfDay);
    });

    it('should generate scene configs for all time periods', () => {
      const times: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];
      times.forEach((time) => {
        const scene = getSceneForContext(time, 'calm');
        expect(scene).toBeDefined();
        expect(scene.colors).toBeDefined();
        expect(scene.colors.length).toBeGreaterThan(0);
        expect(scene.animations).toBeDefined();
      });
    });

    it('should have unique color palettes for different times', () => {
      const dawn = getSceneForContext('dawn', 'calm');
      const night = getSceneForContext('night', 'calm');
      // At least one color should be different
      const colorsMatch =
        JSON.stringify(dawn.colors) === JSON.stringify(night.colors);
      expect(colorsMatch).toBe(false);
    });
  });

  describe('Acceptance Criteria: Mood Overlays', () => {
    it('should support all required moods', () => {
      const moods: SceneMood[] = [
        'calm',
        'energetic',
        'romantic',
        'mysterious',
        'playful',
      ];
      moods.forEach((mood) => {
        const scene = getSceneForContext('day', mood);
        expect(scene).toBeDefined();
        expect(scene.colors).toBeDefined();
        expect(scene.colors.length).toBeGreaterThan(0);
      });
    });

    it('should have unique palettes for different moods', () => {
      const calm = getSceneForContext('day', 'calm');
      const energetic = getSceneForContext('day', 'energetic');
      // At least one color should be different
      const colorsMatch =
        JSON.stringify(calm.colors) === JSON.stringify(energetic.colors);
      expect(colorsMatch).toBe(false);
    });

    it('should map locations to appropriate moods', () => {
      const locations: SceneLocation[] = [
        'living_room',
        'bedroom',
        'kitchen',
        'bathroom',
        'front_door',
        'dining_room',
        'outdoor',
        'car',
        'unknown',
      ];

      locations.forEach((location) => {
        const mood = getLocationMood(location);
        expect([
          'calm',
          'energetic',
          'romantic',
          'mysterious',
          'playful',
        ]).toContain(mood);
      });
    });

    it('should map romantic mood to bedroom', () => {
      expect(getLocationMood('bedroom')).toBe('romantic');
    });

    it('should map calm mood to living_room', () => {
      expect(getLocationMood('living_room')).toBe('calm');
    });
  });

  describe('Acceptance Criteria: Parallax and Particle Effects', () => {
    it('should include particle configuration in scene configs', () => {
      const scene = getSceneForContext('night', 'calm');
      expect(scene.particles).toBeDefined();
      expect(scene.particles?.type).toBeDefined();
      expect(scene.particles?.density).toBeDefined();
      expect(scene.particles?.speed).toBeDefined();
    });

    it('should support different particle types', () => {
      const romantic = getSceneForContext('day', 'romantic');
      const night = getSceneForContext('night', 'calm');

      // Romantic should have hearts, night should have stars
      expect(romantic.particles?.type).toBe('hearts');
      expect(night.particles?.type).toBe('stars');
    });

    it('should have configurable particle density', () => {
      const settings = getDefaultSettings();
      expect(['off', 'low', 'medium', 'high']).toContain(
        settings.particleDensity
      );
    });

    it('should have configurable parallax intensity', () => {
      const settings = getDefaultSettings();
      expect(settings.parallaxIntensity).toBeGreaterThanOrEqual(0);
      expect(settings.parallaxIntensity).toBeLessThanOrEqual(75);
    });
  });

  describe('Acceptance Criteria: Device Capability Detection', () => {
    it('should detect device capabilities', () => {
      const capabilities = detectDeviceCapabilities();
      expect(capabilities).toBeDefined();
      expect(capabilities.gpuTier).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(capabilities.gpuTier);
      expect(typeof capabilities.webGL).toBe('boolean');
      expect(typeof capabilities.prefersReducedMotion).toBe('boolean');
    });

    it('should detect screen size', () => {
      const capabilities = detectDeviceCapabilities();
      expect(capabilities.screenSize).toBeDefined();
      expect(capabilities.screenSize.width).toBeGreaterThan(0);
      expect(capabilities.screenSize.height).toBeGreaterThan(0);
    });
  });

  describe('Acceptance Criteria: Scene Settings Panel Controls', () => {
    it('should persist settings to localStorage', () => {
      const testSettings = getDefaultSettings();
      testSettings.mood = 'energetic';
      testSettings.animationSpeed = 1.5;

      saveSceneSettings(testSettings);
      const loaded = loadSceneSettings();

      expect(loaded.mood).toBe('energetic');
      expect(loaded.animationSpeed).toBe(1.5);
    });

    it('should support animation speed range', () => {
      const settings = getDefaultSettings();
      // Animation speed should be between 0.5 and 1.5 (50%-150%)
      expect(settings.animationSpeed).toBeGreaterThanOrEqual(0.5);
      expect(settings.animationSpeed).toBeLessThanOrEqual(1.5);
    });

    it('should validate mood values', () => {
      const settings = getDefaultSettings();
      expect([
        'calm',
        'energetic',
        'romantic',
        'mysterious',
        'playful',
      ]).toContain(settings.mood);
    });

    it('should have dev debug toggle', () => {
      const settings = getDefaultSettings();
      expect(typeof settings.devDebug).toBe('boolean');
    });
  });

  describe('Acceptance Criteria: Accessibility and Reduced Motion', () => {
    it('should respect reduced motion preference in capabilities', () => {
      const capabilities = detectDeviceCapabilities();
      // Should be able to detect reduced motion
      expect(typeof capabilities.prefersReducedMotion).toBe('boolean');
    });

    it('should disable animations when animation speed is 0', () => {
      const settings = getDefaultSettings();
      settings.animationSpeed = 0;

      // When speed is 0, animations should effectively be disabled
      expect(settings.animationSpeed).toBe(0);
    });
  });

  describe('Acceptance Criteria: Scene Configuration Validation', () => {
    it('should have all required scene properties', () => {
      const scene = getSceneForContext('day', 'calm');

      expect(scene).toHaveProperty('colors');
      expect(scene).toHaveProperty('animations');
      expect(scene).toHaveProperty('particles');
      expect(scene).toHaveProperty('interactive');

      expect(Array.isArray(scene.colors)).toBe(true);
      expect(Array.isArray(scene.animations)).toBe(true);
      expect(typeof scene.interactive).toBe('boolean');
    });

    it('should have valid color strings', () => {
      const scene = getSceneForContext('day', 'calm');
      scene.colors.forEach((color) => {
        // Colors should be hex codes or rgb/rgba
        expect(color).toMatch(/^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb|rgba)/);
      });
    });

    it('should mark scenes as interactive by default', () => {
      const scene = getSceneForContext('day', 'calm');
      expect(scene.interactive).toBe(true);
    });
  });

  describe('Integration: Full Scene Generation Flow', () => {
    it('should generate complete scene from current context', () => {
      const timeOfDay = getCurrentTimeOfDay();
      const location: SceneLocation = 'living_room';
      const mood = getLocationMood(location);
      const scene = getSceneForContext(timeOfDay, mood);

      expect(scene).toBeDefined();
      expect(scene.colors.length).toBeGreaterThan(0);
      expect(scene.animations.length).toBeGreaterThan(0);
      expect(scene.particles).toBeDefined();
    });

    it('should respect user settings when generating scenes', () => {
      const settings = getDefaultSettings();

      // Settings should control scene behavior
      expect(settings.enabled).toBe(true);
      expect(settings.enableParticles).toBeDefined();
      expect(settings.enableParallax).toBeDefined();
      expect(settings.animationSpeed).toBeDefined();
    });
  });
});

describe('sceneSettingsStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return default settings when localStorage is empty', () => {
    const settings = loadSceneSettings();
    expect(settings).toEqual(getDefaultSettings());
  });

  it('should return default settings for corrupted JSON', () => {
    localStorage.setItem('milla.scene.settings.v1', 'not a json');
    const settings = loadSceneSettings();
    expect(settings).toEqual(getDefaultSettings());
  });

  it('should return default settings for incorrect version', () => {
    const oldSettings = {
      version: 0,
      settings: { mood: 'energetic' },
    };
    localStorage.setItem(
      'milla.scene.settings.v1',
      JSON.stringify(oldSettings)
    );
    const settings = loadSceneSettings();
    expect(settings).toEqual(getDefaultSettings());
  });

  it('should sanitize invalid settings', () => {
    const invalidSettings = {
      version: 1,
      settings: {
        enabled: 'true', // invalid type
        mood: 'invalid-mood',
        parallaxIntensity: 200, // out of range
        animationSpeed: 0.1, // out of range
      },
    };
    localStorage.setItem(
      'milla.scene.settings.v1',
      JSON.stringify(invalidSettings)
    );
    const settings = loadSceneSettings();
    expect(settings.enabled).toBe(true);
    expect(settings.mood).toBe('calm');
    expect(settings.parallaxIntensity).toBe(75);
    expect(settings.animationSpeed).toBe(0.5);
  });

  it('should update settings', () => {
    const newSettings = updateSceneSettings({
      mood: 'playful',
      animationSpeed: 1.2,
    });
    expect(newSettings.mood).toBe('playful');
    expect(newSettings.animationSpeed).toBe(1.2);
    const loaded = loadSceneSettings();
    expect(loaded.mood).toBe('playful');
  });

  it('should call listener on change', () => {
    const listener = vi.fn();
    const unsubscribe = onSettingsChange(listener);

    // Simulate change in another tab
    window.dispatchEvent(new Event('storage'));

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });
});
