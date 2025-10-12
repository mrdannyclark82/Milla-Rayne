import React, { useState, useEffect } from 'react';
import { detectDeviceCapabilities } from '@/utils/capabilityDetector';
import {
  getSceneForContext,
  getCurrentTimeOfDay,
  getLocationMood,
} from '@/utils/scenePresets';
import { CSSSceneRenderer } from './CSSSceneRenderer';
import { RealisticSceneBackground } from './RealisticSceneBackground';
import { SceneDebugOverlay } from './SceneDebugOverlay';
import {
  SceneSettings,
  AvatarState,
  SceneMood,
  TimeOfDay,
  SceneLocation,
} from '@/types/scene';
import {
  loadSceneSettings,
  onSettingsChange as subscribeToSettingsChange,
} from '@/utils/sceneSettingsStore';

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
  region = 'full', // Visual V1: Default to full viewport
}) => {
  const [capabilities, setCapabilities] = useState(() =>
    detectDeviceCapabilities()
  );
  const [autoTimeOfDay, setAutoTimeOfDay] = useState(getCurrentTimeOfDay());
  const [settings, setSettings] = useState<SceneSettings>(
    () => propSettings || loadSceneSettings()
  );

  // User-friendly info overlay (non-intrusive, bottom-left corner)
  const [showInfo, setShowInfo] = useState(false);

  // Use prop timeOfDay if provided, otherwise use auto-detected
  const timeOfDay = propTimeOfDay || autoTimeOfDay;

  // Live listener for reduced-motion changes (DevTools emulation support)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setCapabilities((prev) => ({
        ...prev,
        prefersReducedMotion: e.matches,
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
  // Show diagnostic overlay if explicitly requested via devDebug
  if (!settings.enabled) {
    if (settings.devDebug) {
      return (
        <div className="fixed inset-0 -z-10 bg-gray-900 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 bg-black/80 border border-yellow-500/50 rounded-lg max-w-md">
            <p className="text-yellow-400 text-sm font-mono">
              Scene Context: Disabled
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Adaptive background is turned off in settings.
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Enable it in Scene Settings to see dynamic backgrounds.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  // Respect reduced motion preference - always show static gradient
  if (capabilities.prefersReducedMotion || !enableAnimations) {
    const simpleScene = getSceneForContext(timeOfDay, activeMood);

    // Determine positioning based on region
    const regionStyle =
      region === 'left-2-3'
        ? {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            width: '66.6667vw',
            height: '100vh',
            zIndex: -10,
            pointerEvents: 'none' as const,
          }
        : {};

    return (
      <>
        <div
          className="fixed inset-0 -z-10"
          style={{
            background: `linear-gradient(135deg, ${simpleScene.colors.join(', ')})`,
            ...regionStyle,
            pointerEvents: 'none',
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

  // Determine which background renderer to use based on settings
  const backgroundMode = settings.backgroundMode || 'auto';
  const useStaticImage =
    backgroundMode === 'static-image' ||
    (backgroundMode === 'auto' && location && location !== 'unknown');

  // If static image mode is requested, try to use it with CSS fallback
  if (useStaticImage && location) {
    return (
      <>
        <RealisticSceneBackground
          location={location}
          timeOfDay={timeOfDay}
          region={region}
        />

        {/* Scene info indicator (optional, shows on hover) */}
        {!settings.devDebug && (
          <div
            className="fixed bottom-4 left-4 z-0 pointer-events-auto"
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
          >
            <div
              className={`transition-all duration-300 ${showInfo ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
            >
              <div className="bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg p-2 text-xs text-white font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>Static Background</span>
                </div>
                {showInfo && (
                  <div className="mt-2 pt-2 border-t border-white/20 space-y-1 text-[10px]">
                    <div>
                      <span className="text-gray-400">Time:</span>{' '}
                      <span className="text-yellow-300">{timeOfDay}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Mood:</span>{' '}
                      <span className="text-purple-300">{activeMood}</span>
                    </div>
                    {location && location !== 'unknown' && (
                      <div>
                        <span className="text-gray-400">Location:</span>{' '}
                        <span className="text-blue-300">{location}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Developer debug overlay */}
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

  // Use CSS animated scene renderer (default)

  const sceneConfig = getSceneForContext(timeOfDay, activeMood);

  // Determine effective parallax intensity
  let parallaxIntensity = settings.enableParallax
    ? settings.parallaxIntensity
    : 0;

  // Disable parallax on low-tier devices
  if (capabilities.gpuTier === 'low') {
    parallaxIntensity = 0;
  }

  // Determine if particles should be shown
  const showParticles =
    settings.enableParticles &&
    settings.particleDensity !== 'off' &&
    capabilities.gpuTier !== 'low';

  return (
    <>
      <CSSSceneRenderer
        config={sceneConfig}
        interactive={capabilities.gpuTier !== 'low'}
        parallaxIntensity={parallaxIntensity}
        enableParticles={showParticles}
        particleDensity={
          settings.particleDensity === 'off' ? 'low' : settings.particleDensity
        }
        animationSpeed={settings.animationSpeed}
        region={region}
      />

      {/* Scene info indicator (optional, shows on hover) */}
      {!settings.devDebug && (
        <div
          className="fixed bottom-4 left-4 z-0 pointer-events-auto"
          onMouseEnter={() => setShowInfo(true)}
          onMouseLeave={() => setShowInfo(false)}
        >
          <div
            className={`transition-all duration-300 ${showInfo ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
          >
            <div className="bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg p-2 text-xs text-white font-mono">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Adaptive Scene</span>
              </div>
              {showInfo && (
                <div className="mt-2 pt-2 border-t border-white/20 space-y-1 text-[10px]">
                  <div>
                    <span className="text-gray-400">Time:</span>{' '}
                    <span className="text-yellow-300">{timeOfDay}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Mood:</span>{' '}
                    <span className="text-purple-300">{activeMood}</span>
                  </div>
                  {location && location !== 'unknown' && (
                    <div>
                      <span className="text-gray-400">Location:</span>{' '}
                      <span className="text-blue-300">{location}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Developer debug overlay */}
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
