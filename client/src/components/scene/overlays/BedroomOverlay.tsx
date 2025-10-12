/**
 * BedroomOverlay - Headboard/bed with nightstand lamp halo
 */

import React from 'react';
import { TimeOfDay } from '@/types/scene';

interface BedroomOverlayProps {
  timeOfDay: TimeOfDay;
  reducedMotion: boolean;
}

export const BedroomOverlay: React.FC<BedroomOverlayProps> = ({
  timeOfDay,
  reducedMotion,
}) => {
  const opacity =
    timeOfDay === 'night' ? 0.15 : timeOfDay === 'dusk' ? 0.2 : 0.25;
  const lampIntensity =
    timeOfDay === 'night' || timeOfDay === 'dusk' ? 0.5 : 0.2;

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
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      {/* Bed */}
      <g opacity="0.6">
        {/* Headboard */}
        <rect
          x="150"
          y="300"
          width="350"
          height="120"
          rx="8"
          fill="currentColor"
          className="text-white/45"
        />
        {/* Mattress */}
        <rect
          x="150"
          y="420"
          width="350"
          height="100"
          rx="5"
          fill="currentColor"
          className="text-white/40"
        />
        {/* Pillow outlines */}
        <ellipse
          cx="250"
          cy="400"
          rx="60"
          ry="25"
          fill="currentColor"
          className="text-white/30"
        />
        <ellipse
          cx="400"
          cy="400"
          rx="60"
          ry="25"
          fill="currentColor"
          className="text-white/30"
        />
      </g>

      {/* Nightstand */}
      <g opacity="0.5">
        <rect
          x="520"
          y="420"
          width="80"
          height="120"
          rx="4"
          fill="currentColor"
          className="text-white/35"
        />
        {/* Drawer */}
        <rect
          x="530"
          y="450"
          width="60"
          height="30"
          rx="2"
          fill="currentColor"
          className="text-white/25"
        />
      </g>

      {/* Nightstand lamp glow */}
      {lampIntensity > 0.15 && (
        <ellipse
          cx="560"
          cy="380"
          rx="80"
          ry="50"
          fill="url(#lampGlow)"
          opacity={lampIntensity}
        />
      )}

      <defs>
        <radialGradient id="lampGlow">
          <stop offset="0%" stopColor="#ffe4b5" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffe4b5" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};
