/**
 * ParallaxLayer - Subtle parallax effect layer
 * Responds to mouse movement for depth (when enabled)
 */

import React, { useEffect, useRef, useState } from 'react';

interface ParallaxLayerProps {
  intensity: number; // 0-1, 0 = disabled
  className?: string;
  color?: string;
  opacity?: number;
}

export function ParallaxLayer({
  intensity,
  className = '',
  color = 'rgba(255, 255, 255, 0.05)',
  opacity = 0.5,
}: ParallaxLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (intensity === 0 || !layerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      // Calculate offset based on mouse position (-1 to 1 range)
      const x = (clientX / innerWidth - 0.5) * 2;
      const y = (clientY / innerHeight - 0.5) * 2;

      // Apply intensity multiplier
      setOffset({
        x: x * intensity * 20, // Max 20px movement
        y: y * intensity * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [intensity]);

  if (intensity === 0) return null;

  return (
    <div
      ref={layerRef}
      className={`parallax-layer ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: 'transform 0.1s ease-out',
        pointerEvents: 'none',
        zIndex: -9,
      }}
      aria-hidden="true"
    >
      {/* Procedural circles for depth effect */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '20%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          opacity,
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          opacity: opacity * 0.7,
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '200px',
          height: '200px',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          opacity: opacity * 0.5,
          filter: 'blur(30px)',
        }}
      />
    </div>
  );
}
