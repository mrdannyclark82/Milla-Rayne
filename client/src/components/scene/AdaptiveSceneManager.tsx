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
  timeOfDay?: TimeOfDay; // Phase 3: Optional time override from RP scene
  region?: 'full' | 'left-2-3'; // Visual V1: Region to render
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
  location, // Phase 3: RP scene location
  timeOfDay: propTimeOfDay, // Phase 3: Optional time override
  region = 'full' // Visual V1: Default to full viewport
}) => {
  const [capabilities, setCapabilities] = useState(() => detectDeviceCapabilities());
  const [autoTimeOfDay, setAutoTimeOfDay] = useState(getCurrentTimeOfDay());
  const [settings, setSettings] = useState<SceneSettings>(() => 
    propSettings || loadSceneSettings()
  );

  // Use prop timeOfDay if provided, otherwise use auto-detected
  const timeOfDay = propTimeOfDay || autoTimeOfDay;

  // Live listener for reduced-motion changes (DevTools emulation support)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setCapabilities(prev => ({
        ...prev,
        prefersReducedMotion: e.matches
      }));
    };

    // Initial check
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Update time of day every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoTimeOfDay(getCurrentTimeOfDay());
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
    
    // Determine positioning based on region
    const regionStyle = region === 'left-2-3' 
      ? { 
          position: 'fixed' as const,
          top: 0,
          left: 0,
          width: '66.6667vw',
          height: '100vh',
          zIndex: -10,
          pointerEvents: 'none' as const
        }
      : {};
    
    return (
      <>
        <div
          className="fixed inset-0 -z-10"
          style={{
            background: `linear-gradient(135deg, ${simpleScene.colors.join(', ')})`,
            ...regionStyle,
            pointerEvents: 'none'
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
        region={region}
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
