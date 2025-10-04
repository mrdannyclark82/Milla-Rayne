/**
 * LivingRoomOverlay - Couch silhouette with optional fireplace glow
 */

import React from 'react';
import { TimeOfDay } from '@/types/scene';

interface LivingRoomOverlayProps {
  timeOfDay: TimeOfDay;
  reducedMotion: boolean;
}

export const LivingRoomOverlay: React.FC<LivingRoomOverlayProps> = ({ timeOfDay, reducedMotion }) => {
  // Adjust opacity based on time of day
  const opacity = timeOfDay === 'night' ? 0.15 : timeOfDay === 'dusk' ? 0.2 : 0.25;
  
  // Fireplace glow intensity (warmer at dusk/night)
  const glowIntensity = (timeOfDay === 'night' || timeOfDay === 'dusk') ? 0.4 : 0.2;
  
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
      {/* Couch silhouette */}
      <g opacity="0.6">
        {/* Couch base */}
        <rect x="150" y="400" width="300" height="100" rx="10" fill="currentColor" className="text-white/40" />
        {/* Left armrest */}
        <rect x="130" y="370" width="40" height="130" rx="8" fill="currentColor" className="text-white/50" />
        {/* Right armrest */}
        <rect x="430" y="370" width="40" height="130" rx="8" fill="currentColor" className="text-white/50" />
        {/* Backrest */}
        <rect x="150" y="320" width="300" height="80" rx="5" fill="currentColor" className="text-white/45" />
        {/* Cushions */}
        <rect x="180" y="380" width="80" height="30" rx="3" fill="currentColor" className="text-white/30" />
        <rect x="280" y="380" width="80" height="30" rx="3" fill="currentColor" className="text-white/30" />
        <rect x="380" y="380" width="60" height="30" rx="3" fill="currentColor" className="text-white/30" />
      </g>
      
      {/* Fireplace glow (optional, more visible at night) */}
      {glowIntensity > 0.15 && (
        <g opacity={glowIntensity}>
          {/* Fireplace base */}
          <rect x="500" y="380" width="120" height="150" fill="currentColor" className="text-white/20" />
          {/* Warm glow */}
          <ellipse
            cx="560"
            cy="450"
            rx="60"
            ry="40"
            fill="url(#fireGlow)"
            className={reducedMotion ? '' : 'animate-pulse'}
            style={reducedMotion ? {} : { animationDuration: '3s' }}
          />
        </g>
      )}
      
      {/* Gradient definitions */}
      <defs>
        <radialGradient id="fireGlow">
          <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#ff8c42" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ffa500" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};
