import React, { useState, useEffect } from 'react';
import { detectDeviceCapabilities } from '@/utils/capabilityDetector';
import { getSceneForContext, getCurrentTimeOfDay, getLocationMood } from '@/utils/scenePresets';
import { CSSSceneRenderer } from './CSSSceneRenderer';
import { SceneDebugOverlay } from './SceneDebugOverlay';
import { SceneSettings, AvatarState, SceneMood, TimeOfDay, SceneLocation } from '@/types/scene';
import { loadSceneSettings, onSettingsChange as subscribeToSettingsChange } from '@/utils/sceneSettingsStore';

interface AdaptiveSceneManagerProps {
  avatarState?: AvatarState;
  mood?: SceneMood;
  enableAnimations?: boolean;
  settings?: SceneSettings;
  onSceneChange?: (timeOfDay: TimeOfDay, mood: SceneMood) => void;
  location?: SceneLocation; // Phase 3: RP scene location
  // Future: Avatar integration point
  // avatarPosition?: { x: number; y: number };
  // avatarVisible?: boolean;
}

export const AdaptiveSceneManager: React.FC<AdaptiveSceneManagerProps> = ({
  avatarState = 'neutral',
  mood: propMood,
  enableAnimations = true,
  settings: propSettings,
  onSceneChange,
  location // Phase 3: RP scene location
}) => {
  const [capabilities] = useState(() => detectDeviceCapabilities());
  const [timeOfDay, setTimeOfDay] = useState(getCurrentTimeOfDay());
  const [settings, setSettings] = useState<SceneSettings>(() => 
    propSettings || loadSceneSettings()
  );

  // Update time of day every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getCurrentTimeOfDay());
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Load settings from prop or store, and listen for changes
  useEffect(() => {
    if (propSettings) {
      setSettings(propSettings);
      return;
    }

    // Subscribe to settings changes if not controlled by prop
    return subscribeToSettingsChange((newSettings: SceneSettings) => {
      setSettings(newSettings);
    });
  }, [propSettings]);

  // Determine active mood from settings, location, or prop
  // Priority: propMood > location-based mood > settings mood
  let activeMood = settings.mood;
  if (location && location !== 'unknown') {
    activeMood = getLocationMood(location);
  }
  if (propMood) {
    activeMood = propMood;
  }

  // Notify parent of scene changes
  useEffect(() => {
    if (onSceneChange) {
      onSceneChange(timeOfDay, activeMood);
    }
  }, [timeOfDay, activeMood, onSceneChange]);

  // Disable scene if not enabled in settings
  if (!settings.enabled) {
    return null;
  }

  // Respect reduced motion preference - always show static gradient
  if (capabilities.prefersReducedMotion || !enableAnimations) {
    const simpleScene = getSceneForContext(timeOfDay, activeMood);
    return (
      <>
        <div
          className="fixed inset-0 -z-10"
          style={{
            background: `linear-gradient(135deg, ${simpleScene.colors.join(', ')})`
          }}
          aria-hidden="true"
          role="presentation"
        />
        {settings.devDebug && (
          <SceneDebugOverlay
            capabilities={capabilities}
            timeOfDay={timeOfDay}
            mood={activeMood}
            particlesEnabled={false}
            parallaxEnabled={false}
            animationSpeed={0}
          />
        )}
      </>
    );
  }

  const sceneConfig = getSceneForContext(timeOfDay, activeMood);

  // Determine effective parallax intensity
  let parallaxIntensity = settings.enableParallax ? settings.parallaxIntensity : 0;
  
  // Disable parallax on low-tier devices
  if (capabilities.gpuTier === 'low') {
    parallaxIntensity = 0;
  }

  // Determine if particles should be shown
  const showParticles = settings.enableParticles && 
                        settings.particleDensity !== 'off' && 
                        capabilities.gpuTier !== 'low';

  return (
    <>
      <CSSSceneRenderer
        config={sceneConfig}
        interactive={capabilities.gpuTier !== 'low'}
        parallaxIntensity={parallaxIntensity}
        enableParticles={showParticles}
        particleDensity={settings.particleDensity === 'off' ? 'low' : settings.particleDensity}
        animationSpeed={settings.animationSpeed}
      />
      {settings.devDebug && (
        <SceneDebugOverlay
          capabilities={capabilities}
          timeOfDay={timeOfDay}
          mood={activeMood}
          particlesEnabled={showParticles}
          parallaxEnabled={parallaxIntensity > 0}
          animationSpeed={settings.animationSpeed}
        />
      )}
    </>
  );
};
