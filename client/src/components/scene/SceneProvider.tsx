import React from 'react';
import { SceneContextProvider } from '@/contexts/SceneContext';
import { SceneManager } from '@/components/scene/SceneManager';
import type {
  AppState,
  PerformanceMode,
  WeatherEffect,
  SceneLocationKey,
} from '@shared/sceneTypes';

interface SceneProviderProps {
  children: React.ReactNode;
  appState?: AppState;
  performanceMode?: PerformanceMode;
  weatherEffect?: WeatherEffect;
  location?: SceneLocationKey;
}

export function SceneProvider({
  children,
  appState,
  performanceMode,
  weatherEffect,
  location,
}: SceneProviderProps) {
  return (
    <SceneContextProvider
      appState={appState}
      performanceMode={performanceMode}
      weatherEffect={weatherEffect}
      location={location}
    >
      <SceneManager />
      {children}
    </SceneContextProvider>
  );
}
