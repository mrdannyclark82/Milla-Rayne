/**
 * WorkspaceOverlay - Desk with monitor glow
 */

import React from 'react';
import { TimeOfDay } from '@/types/scene';

interface WorkspaceOverlayProps {
  timeOfDay: TimeOfDay;
  reducedMotion: boolean;
}

export const WorkspaceOverlay: React.FC<WorkspaceOverlayProps> = ({ timeOfDay, reducedMotion }) => {
  const opacity = timeOfDay === 'night' ? 0.15 : timeOfDay === 'dusk' ? 0.2 : 0.25;
  const monitorIntensity = (timeOfDay === 'night' || timeOfDay === 'dusk') ? 0.6 : 0.4;
  
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
      {/* Desk */}
      <g opacity="0.6">
        {/* Desk surface */}
        <rect x="100" y="400" width="500" height="200" fill="currentColor" className="text-white/40" />
        {/* Desk top edge */}
        <rect x="95" y="395" width="510" height="8" rx="2" fill="currentColor" className="text-white/45" />
      </g>
      
      {/* Monitor */}
      <g opacity="0.7">
        {/* Monitor stand */}
        <rect x="290" y="380" width="20" height="40" fill="currentColor" className="text-white/40" />
        {/* Monitor base */}
        <ellipse cx="300" cy="400" rx="40" ry="8" fill="currentColor" className="text-white/35" />
        {/* Monitor screen */}
        <rect x="220" y="260" width="160" height="120" rx="4" fill="currentColor" className="text-white/50" />
        {/* Screen bezel */}
        <rect x="225" y="265" width="150" height="110" rx="2" fill="currentColor" className="text-white/20" />
      </g>
      
      {/* Monitor glow */}
      <ellipse
        cx="300"
        cy="320"
        rx="120"
        ry="80"
        fill="url(#monitorGlow)"
        opacity={monitorIntensity}
      />
      
      <defs>
        <radialGradient id="monitorGlow">
          <stop offset="0%" stopColor="#87ceeb" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#87ceeb" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};
