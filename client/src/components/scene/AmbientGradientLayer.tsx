/**
 * AmbientGradientLayer - Procedural gradient background
 * Asset-free CSS gradient layer with smooth transitions
 */

import React, { useEffect, useRef } from 'react';
import type { SceneTheme } from '@shared/sceneTypes';

interface AmbientGradientLayerProps {
  theme: SceneTheme;
  className?: string;
}

export function AmbientGradientLayer({
  theme,
  className = '',
}: AmbientGradientLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!layerRef.current) return;

    const { palette, gradientAngle, animationSpeed } = theme;

    // Apply CSS custom properties for smooth transitions
    const style = layerRef.current.style;
    style.setProperty('--scene-primary', palette.primary);
    style.setProperty('--scene-secondary', palette.secondary);
    style.setProperty('--scene-accent', palette.accent);
    style.setProperty('--scene-background', palette.background);
    style.setProperty('--scene-angle', `${gradientAngle}deg`);
    style.setProperty(
      '--scene-animation-speed',
      animationSpeed > 0 ? '20s' : '0s'
    );
  }, [theme]);

  return (
    <div
      ref={layerRef}
      className={`ambient-gradient-layer ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(var(--scene-angle, 135deg), 
          var(--scene-primary, #667eea) 0%, 
          var(--scene-secondary, #764ba2) 50%, 
          var(--scene-accent, #f093fb) 100%)`,
        transition: 'background 2s ease-in-out',
        zIndex: -10,
      }}
      aria-hidden="true"
    />
  );
}
