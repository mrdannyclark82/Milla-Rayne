/**
 * SceneContext - React Context for Adaptive Scene System
 * Provides scene state and configuration to all scene components
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { SceneContext as SceneContextType, AppState, PerformanceMode } from '@shared/sceneTypes';
import { getCurrentTimeOfDay, prefersReducedMotion, isPageBackgrounded } from '@/lib/scene/sceneUtils';

interface SceneContextProviderProps {
  children: ReactNode;
  appState?: AppState;
  performanceMode?: PerformanceMode;
}

const SceneContext = createContext<SceneContextType | null>(null);

/**
 * Provider component for scene context
 */
export function SceneContextProvider({
  children,
  appState = 'idle',
  performanceMode = 'balanced'
}: SceneContextProviderProps) {
  const [context, setContext] = useState<SceneContextType>(() => ({
    timeOfDay: getCurrentTimeOfDay(),
    appState,
    reducedMotion: prefersReducedMotion(),
    performanceMode,
    isBackgrounded: isPageBackgrounded()
  }));

  // Update time of day every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setContext(prev => ({
        ...prev,
        timeOfDay: getCurrentTimeOfDay()
      }));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Listen for reduced motion preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setContext(prev => ({
        ...prev,
        reducedMotion: e.matches
      }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Listen for page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      setContext(prev => ({
        ...prev,
        isBackgrounded: document.hidden
      }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Update app state when prop changes
  useEffect(() => {
    setContext(prev => ({
      ...prev,
      appState
    }));
  }, [appState]);

  // Update performance mode when prop changes
  useEffect(() => {
    setContext(prev => ({
      ...prev,
      performanceMode
    }));
  }, [performanceMode]);

  return (
    <SceneContext.Provider value={context}>
      {children}
    </SceneContext.Provider>
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
