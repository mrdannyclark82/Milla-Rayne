/**
 * SceneContainer - Demo container for adaptive scene system
 * Wraps content with scene system when feature flag is enabled
 */

import React, { ReactNode } from 'react';
import { SceneContextProvider } from '@/contexts/SceneContext';
import { SceneManager } from './SceneManager';
import type { AppState, PerformanceMode } from '@shared/sceneTypes';

interface SceneContainerProps {
  children: ReactNode;
  enabled?: boolean;
  appState?: AppState;
  performanceMode?: PerformanceMode;
}

/**
 * Container component that conditionally enables adaptive scenes
 * When enabled=false, renders children without any scene system (zero impact)
 */
export function SceneContainer({
  children,
  enabled = false,
  appState = 'idle',
  performanceMode = 'balanced'
}: SceneContainerProps) {
  // Feature flag gate: if not enabled, render children only
  if (!enabled) {
    return <>{children}</>;
  }

  // When enabled, wrap with scene system
  return (
    <SceneContextProvider appState={appState} performanceMode={performanceMode}>
      <SceneManager />
      {children}
    </SceneContextProvider>
  );
}
