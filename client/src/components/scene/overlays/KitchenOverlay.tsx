/**
 * KitchenOverlay - Counter/shelf shapes with task light highlight
 */

import React from 'react';
import { TimeOfDay } from '@/types/scene';

interface KitchenOverlayProps {
  timeOfDay: TimeOfDay;
  reducedMotion: boolean;
}

export const KitchenOverlay: React.FC<KitchenOverlayProps> = ({ timeOfDay, reducedMotion }) => {
  const opacity = timeOfDay === 'night' ? 0.15 : timeOfDay === 'dusk' ? 0.2 : 0.25;
  const taskLightIntensity = timeOfDay === 'day' ? 0.3 : 0.5;
  
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
      {/* Counter */}
      <g opacity="0.6">
        <rect x="100" y="420" width="500" height="180" fill="currentColor" className="text-white/40" />
        {/* Counter top edge */}
        <rect x="90" y="415" width="520" height="10" rx="2" fill="currentColor" className="text-white/50" />
      </g>
      
      {/* Upper cabinets/shelves */}
      <g opacity="0.5">
        <rect x="120" y="200" width="140" height="80" rx="4" fill="currentColor" className="text-white/35" />
        <rect x="280" y="200" width="140" height="80" rx="4" fill="currentColor" className="text-white/35" />
        <rect x="440" y="200" width="140" height="80" rx="4" fill="currentColor" className="text-white/35" />
      </g>
      
      {/* Task light highlight under cabinets */}
      <ellipse
        cx="400"
        cy="290"
        rx="200"
        ry="20"
        fill="url(#taskLight)"
        opacity={taskLightIntensity}
      />
      
      <defs>
        <radialGradient id="taskLight">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};
