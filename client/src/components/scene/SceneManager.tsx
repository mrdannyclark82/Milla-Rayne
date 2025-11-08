/**
 * SceneManager - Main adaptive scene orchestrator
 * Manages scene layers and applies theming based on context
 */

import React from 'react';
import { BackgroundLayer } from './BackgroundLayer';
import { AmbientGradientLayer } from './AmbientGradientLayer';
import { ParallaxLayer } from './ParallaxLayer';
import { WeatherLayer } from './WeatherLayer';
import { useSceneContext } from '@/contexts/SceneContext';

interface SceneManagerProps {
  className?: string;
}

export function SceneManager({ className = '' }: SceneManagerProps) {
  const { theme } = useSceneContext();

  return (
    <div
      className={`scene-manager ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '66.6667vw',
        height: '100vh',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1,
      }}
      aria-hidden="true"
      role="presentation"
    >
      {/* Background image layer */}
      <BackgroundLayer />
      <AmbientGradientLayer theme={theme} />
      <ParallaxLayer intensity={0} />
      <WeatherLayer />
    </div>
  );
}
