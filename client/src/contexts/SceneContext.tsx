/**
 * SceneContext - React Context for Adaptive Scene System
 * Provides scene state and configuration to all scene components
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from 'react';
import type {
  SceneContext as SceneContextType,
  AppState,
  PerformanceMode,
  WeatherEffect,
  SceneLocationKey,
  SceneTheme,
  ScenePalette,
} from '@shared/sceneTypes';
import {
  getCurrentTimeOfDay,
  prefersReducedMotion,
  isPageBackgrounded,
} from '@/lib/scene/sceneUtils';

// Helper function to derive SceneTheme based on context
function getSceneTheme(
  timeOfDay: SceneContextType['timeOfDay'],
  location: SceneContextType['location'],
  weatherEffect: SceneContextType['weatherEffect'],
  performanceMode: SceneContextType['performanceMode']
): SceneTheme {
  let palette: ScenePalette = {
    primary: '#667eea',
    secondary: '#764ba2',
    accent: '#f093fb',
    background: '#1a202c',
  };
  let gradientAngle = 135;
  let animationSpeed = 1; // Default to animated
  let parallaxIntensity = 0.5;

  // Adjust based on time of day
  switch (timeOfDay) {
    case 'dawn':
      palette = {
        primary: '#fbc7d4',
        secondary: '#9796f0',
        accent: '#f093fb',
        background: '#fce043',
      };
      gradientAngle = 45;
      break;
    case 'day':
      palette = {
        primary: '#4facfe',
        secondary: '#00f2fe',
        accent: '#43e97b',
        background: '#ffffff',
      };
      gradientAngle = 90;
      break;
    case 'dusk':
      palette = {
        primary: '#ffecd2',
        secondary: '#fcb69f',
        accent: '#ff8a00',
        background: '#2c3e50',
      };
      gradientAngle = 180;
      break;
    case 'night':
      palette = {
        primary: '#2c3e50',
        secondary: '#34495e',
        accent: '#2980b9',
        background: '#000000',
      };
      gradientAngle = 225;
      break;
  }

  // Adjust based on location (example, can be more complex)
  switch (location) {
    case 'outdoor':
      parallaxIntensity = 0.8;
      break;
    case 'workspace':
      palette.primary = '#3a7bd5';
      palette.secondary = '#00d2ff';
      break;
  }

  // Adjust based on weather effect
  switch (weatherEffect) {
    case 'rain':
      palette.primary = '#4b6cb7';
      palette.secondary = '#182848';
      animationSpeed = 0.5; // Slower animation for rain
      break;
    case 'snow':
      palette.primary = '#e0e0e0';
      palette.secondary = '#c0c0c0';
      animationSpeed = 0.3; // Very slow animation for snow
      break;
  }

  // Adjust based on performance mode
  if (performanceMode === 'performance') {
    animationSpeed = 0;
    parallaxIntensity = 0;
  }

  return {
    palette,
    gradientAngle,
    animationSpeed,
    parallaxIntensity,
  };
}

interface SceneContextProviderProps {
  children: ReactNode;
  appState?: AppState;
  performanceMode?: PerformanceMode;
  weatherEffect?: WeatherEffect;
  location?: SceneLocationKey;
}

const SceneContext = createContext<SceneContextType | null>(null);

/**
 * Provider component for scene context
 */
export function SceneContextProvider({
  children,
  appState = 'idle',
  performanceMode = 'balanced',
  weatherEffect = 'none',
  location = 'front_door',
}: SceneContextProviderProps) {
  const [internalTimeOfDay, setInternalTimeOfDay] = useState(getCurrentTimeOfDay());

  const derivedTheme = useMemo(() => {
    return getSceneTheme(internalTimeOfDay, location, weatherEffect, performanceMode);
  }, [internalTimeOfDay, location, weatherEffect, performanceMode]);

  const [context, setContext] = useState<SceneContextType>(() => ({
    timeOfDay: internalTimeOfDay,
    appState,
    reducedMotion: prefersReducedMotion(),
    performanceMode,
    isBackgrounded: isPageBackgrounded(),
    weatherEffect,
    location,
    theme: derivedTheme,
  }));

  // Update context when derivedTheme changes
  useEffect(() => {
    setContext((prev) => ({
      ...prev,
      theme: derivedTheme,
    }));
  }, [derivedTheme]);

  // Update time of day every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setInternalTimeOfDay(getCurrentTimeOfDay());
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Listen for reduced motion preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (e: MediaQueryListEvent) => {
      setContext((prev) => ({
        ...prev,
        reducedMotion: e.matches,
      }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Listen for page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      setContext((prev) => ({
        ...prev,
        isBackgrounded: document.hidden,
      }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Update app state when prop changes
  useEffect(() => {
    setContext((prev) => ({
      ...prev,
      appState,
    }));
  }, [appState]);

  // Update performance mode when prop changes
  useEffect(() => {
    setContext((prev) => ({
      ...prev,
      performanceMode,
    }));
  }, [performanceMode]);

  // Update weather effect when prop changes
  useEffect(() => {
    setContext((prev) => ({
      ...prev,
      weatherEffect,
    }));
  }, [weatherEffect]);

  // Update location when prop changes
  useEffect(() => {
    setContext((prev) => ({
      ...prev,
      location,
    }));
  }, [location]);

  return (
    <SceneContext.Provider value={context}>{children}</SceneContext.Provider>
  );
}

/**
 * Hook to access scene context
 */
export function useSceneContext(): SceneContextType {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useSceneContext must be used within SceneContextProvider');
  }
  return context;
}
