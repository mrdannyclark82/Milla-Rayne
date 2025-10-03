/**
 * SceneManager - Main adaptive scene orchestrator
 * Manages scene layers and applies theming based on context
 */

import React, { useMemo } from 'react';
import { useSceneContext } from '@/contexts/SceneContext';
import { generateSceneTheme } from '@/lib/scene/sceneUtils';
import { AmbientGradientLayer } from './AmbientGradientLayer';
import { ParallaxLayer } from './ParallaxLayer';

interface SceneManagerProps {
  className?: string;
}

export function SceneManager({ className = '' }: SceneManagerProps) {
  const context = useSceneContext();

  // Generate theme from context
  const theme = useMemo(
    () => generateSceneTheme(
      context.timeOfDay,
      context.appState,
      context.reducedMotion,
      context.performanceMode
    ),
    [context.timeOfDay, context.appState, context.reducedMotion, context.performanceMode]
  );

  // Reduce animation when page is backgrounded
  const effectiveAnimationSpeed = context.isBackgrounded ? 0 : theme.animationSpeed;
  const effectiveParallaxIntensity = context.isBackgrounded ? 0 : theme.parallaxIntensity;

  return (
    <div
      className={`scene-manager ${className}`}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: -10
      }}
      aria-hidden="true"
      role="presentation"
    >
      {/* Base gradient layer */}
      <AmbientGradientLayer
        theme={{
          ...theme,
          animationSpeed: effectiveAnimationSpeed
        }}
      />

      {/* Parallax depth layer */}
      <ParallaxLayer
        intensity={effectiveParallaxIntensity}
        color={theme.palette.accent}
      />
    </div>
  );
}
