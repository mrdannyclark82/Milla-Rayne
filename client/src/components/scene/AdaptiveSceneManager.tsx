import React, { useState, useEffect, Suspense, lazy } from 'react';
import { detectDeviceCapabilities } from '@/utils/capabilityDetector';
import {
  getSceneForContext,
  getCurrentTimeOfDay,
  getLocationMood,
  SEASONAL_SCENES,
  getSeasonalScene,
  getCurrentSeason,
} from '@/utils/scenePresets';
import { CSSSceneRenderer } from './CSSSceneRenderer';
import { RealisticSceneBackground } from './RealisticSceneBackground';
import { SceneDebugOverlay } from './SceneDebugOverlay';

// Lazy-loaded so the ~150KB Three.js/WebGL bundle is only fetched when a
// user actually opts into the immersive 3D background (Option 2 renderer).
const WebGLSceneRenderer = lazy(() =>
  import('./WebGLSceneRenderer').then((mod) => ({
    default: mod.WebGLSceneRenderer,
  }))
);
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

  // If the WebGL 3D renderer fails at runtime (e.g. lost context on an
  // unsupported device), fall back to the CSS renderer for the rest of
  // the session instead of retrying and risking a crash loop.
  const [webglFailed, setWebglFailed] = useState(false);

  // Mood-generated / static mood wallpaper (from SceneSettingsPanel events
  // or /api/scene/mood-background/:mood). Chat mounts this manager, not
  // BackgroundLayer — so we listen here or the image never paints.
  const [moodImageUrl, setMoodImageUrl] = useState<string | null>(null);
  const [moodImageLoaded, setMoodImageLoaded] = useState(false);

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

  // Listen for mood wallpaper updates fired by SceneSettingsPanel
  useEffect(() => {
    const handleMoodBackgroundUpdate = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { mood?: string; imageUrl?: string }
        | undefined;
      if (detail?.imageUrl) {
        setMoodImageLoaded(false);
        setMoodImageUrl(detail.imageUrl);
      }
    };

    window.addEventListener(
      'moodBackgroundUpdated',
      handleMoodBackgroundUpdate as EventListener
    );
    return () => {
      window.removeEventListener(
        'moodBackgroundUpdated',
        handleMoodBackgroundUpdate as EventListener
      );
    };
  }, []);

  // Determine active mood from settings, location, or prop
  // Priority: propMood > location-based mood > settings mood
  let activeMood = settings.mood;
  if (location && location !== 'unknown') {
    activeMood = getLocationMood(location);
  }
  if (propMood) {
    activeMood = propMood;
  }

  // Fetch mood wallpaper when mood changes (covers first load + selector)
  useEffect(() => {
    if (!settings.enabled || !activeMood) return;
    // RP-driven backgrounds own the image path
    if (settings.sceneBackgroundFromRP) return;

    let cancelled = false;
    const fetchMood = async () => {
      try {
        const response = await fetch(
          `/api/scene/mood-background/${activeMood}`
        );
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && data.success && data.imageUrl) {
          setMoodImageLoaded(false);
          setMoodImageUrl(data.imageUrl);
        }
      } catch {
        // Keep CSS/WebGL fallback if mood images are unavailable
      }
    };
    void fetchMood();
    return () => {
      cancelled = true;
    };
  }, [activeMood, settings.enabled, settings.sceneBackgroundFromRP]);

  // Notify parent of scene changes
  useEffect(() => {
    if (onSceneChange) {
      onSceneChange(timeOfDay, activeMood);
    }
  }, [timeOfDay, activeMood, onSceneChange]);

  // Shared mood wallpaper layer — sits behind CSS/WebGL when we have a URL
  const moodWallpaper =
    moodImageUrl && settings.enabled ? (
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={
          region === 'left-2-3'
            ? {
                width: '66.6667vw',
                height: '100vh',
                left: 0,
                top: 0,
                position: 'fixed',
              }
            : undefined
        }
        aria-hidden="true"
      >
        <img
          src={moodImageUrl}
          alt=""
          onLoad={() => setMoodImageLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            opacity: moodImageLoaded ? 1 : 0,
            transition: 'opacity 0.6s ease-in-out',
          }}
        />
      </div>
    ) : null;

  // When a mood wallpaper is active, prefer it over pure CSS/WebGL so the
  // generated (or cached) scene actually paints on Chat.
  const preferMoodWallpaper =
    !!moodImageUrl &&
    settings.enabled &&
    !settings.sceneBackgroundFromRP &&
    (settings.backgroundMode === 'static-image' ||
      settings.backgroundMode === 'auto' ||
      !settings.backgroundMode);

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

  if (preferMoodWallpaper) {
    return (
      <>
        {moodWallpaper}
        {/* Soft CSS wash underneath while image loads */}
        {!moodImageLoaded && (
          <div
            className="fixed inset-0 -z-20 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${getSceneForContext(timeOfDay, activeMood).colors.join(', ')})`,
            }}
            aria-hidden="true"
          />
        )}
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

  // Option 2: Immersive WebGL 3D scene (Three.js/@react-three/fiber).
  // Only offered when the device actually supports WebGL at a decent GPU
  // tier and hasn't already failed at runtime this session; otherwise we
  // silently fall through to the CSS renderer below.
  const useWebGL3D =
    backgroundMode === 'webgl-3d' &&
    capabilities.webGL &&
    capabilities.gpuTier !== 'low' &&
    !webglFailed;

  if (useWebGL3D) {
    // Honor seasonal/winter-theme overrides the same way the CSS renderer
    // does, so switching background modes doesn't change scene selection.
    const currentSeason = getCurrentSeason();
    const seasonalScene = settings.winterTheme
      ? SEASONAL_SCENES.snowy_night
      : getSeasonalScene(currentSeason, timeOfDay);
    const webglSceneConfig =
      seasonalScene || getSceneForContext(timeOfDay, activeMood);
    const showParticles =
      settings.enableParticles && settings.particleDensity !== 'off';

    return (
      <>
        <Suspense fallback={<CSSSceneRenderer config={webglSceneConfig} />}>
          <WebGLSceneRenderer
            config={webglSceneConfig}
            timeOfDay={timeOfDay}
            mood={activeMood}
            particleDensity={showParticles ? settings.particleDensity : 'off'}
            animationSpeed={settings.animationSpeed}
            interactive={capabilities.gpuTier !== 'low'}
            region={region}
            onError={() => setWebglFailed(true)}
          />
        </Suspense>

        {settings.devDebug && (
          <SceneDebugOverlay
            capabilities={capabilities}
            timeOfDay={timeOfDay}
            mood={activeMood}
            particlesEnabled={showParticles}
            parallaxEnabled={true}
            animationSpeed={settings.animationSpeed}
          />
        )}
      </>
    );
  }

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

  // Check for seasonal scenes (e.g., snowy night in winter)
  const currentSeason = getCurrentSeason();
  const seasonalScene = settings.winterTheme
    ? SEASONAL_SCENES.snowy_night
    : getSeasonalScene(currentSeason, timeOfDay);
  const finalSceneConfig =
    seasonalScene || getSceneForContext(timeOfDay, activeMood);
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
        config={finalSceneConfig}
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
