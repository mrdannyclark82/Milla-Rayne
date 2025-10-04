/**
 * DiningOverlay - Table with pendant light glow
 */

import React from 'react';
import { TimeOfDay } from '@/types/scene';

interface DiningOverlayProps {
  timeOfDay: TimeOfDay;
  reducedMotion: boolean;
}

export const DiningOverlay: React.FC<DiningOverlayProps> = ({ timeOfDay, reducedMotion }) => {
  const opacity = timeOfDay === 'night' ? 0.15 : timeOfDay === 'dusk' ? 0.2 : 0.25;
  const pendantIntensity = (timeOfDay === 'night' || timeOfDay === 'dusk') ? 0.5 : 0.3;
  
  return (
    <svg
      viewBox="0 0 800 600"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity,
        pointerEvents: 'none'
      }}
      aria-hidden="true"
    >
      {/* Dining table */}
      <g opacity="0.6">
        {/* Table legs */}
        <rect x="200" y="450" width="15" height="100" fill="currentColor" className="text-white/45" />
        <rect x="385" y="450" width="15" height="100" fill="currentColor" className="text-white/45" />
        {/* Table top (perspective view) */}
        <path
          d="M 180 450 L 420 450 L 400 380 L 200 380 Z"
          fill="currentColor"
          className="text-white/40"
        />
      </g>
      
      {/* Pendant light fixture */}
      <g opacity="0.5">
        {/* Wire */}
        <line x1="300" y1="100" x2="300" y2="200" stroke="currentColor" strokeWidth="1" className="text-white/30" />
        {/* Shade */}
        <path
          d="M 260 200 L 340 200 L 320 240 L 280 240 Z"
          fill="currentColor"
          className="text-white/35"
        />
      </g>
      
      {/* Pendant light glow */}
      <ellipse
        cx="300"
        cy="300"
        rx="120"
        ry="60"
        fill="url(#pendantGlow)"
        opacity={pendantIntensity}
      />
      
      <defs>
        <radialGradient id="pendantGlow">
          <stop offset="0%" stopColor="#fff8dc" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fff8dc" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};
