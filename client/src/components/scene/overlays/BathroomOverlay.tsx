/**
 * BathroomOverlay - Vanity with mirror shine
 */

import React from 'react';
import { TimeOfDay } from '@/types/scene';

interface BathroomOverlayProps {
  timeOfDay: TimeOfDay;
  reducedMotion: boolean;
}

export const BathroomOverlay: React.FC<BathroomOverlayProps> = ({
  timeOfDay,
  reducedMotion,
}) => {
  const opacity =
    timeOfDay === 'night' ? 0.15 : timeOfDay === 'dusk' ? 0.2 : 0.25;
  const mirrorShine = timeOfDay === 'day' ? 0.4 : 0.3;

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
      {/* Vanity */}
      <g opacity="0.6">
        {/* Vanity cabinet */}
        <rect
          x="200"
          y="400"
          width="300"
          height="200"
          fill="currentColor"
          className="text-white/40"
        />
        {/* Counter top */}
        <rect
          x="190"
          y="395"
          width="320"
          height="10"
          rx="2"
          fill="currentColor"
          className="text-white/45"
        />
        {/* Sink outline */}
        <ellipse
          cx="350"
          cy="420"
          rx="50"
          ry="30"
          fill="currentColor"
          className="text-white/30"
        />
      </g>

      {/* Mirror */}
      <g opacity="0.7">
        <rect
          x="220"
          y="180"
          width="260"
          height="200"
          rx="8"
          fill="currentColor"
          className="text-white/35"
        />
        {/* Mirror shine effect */}
        <rect
          x="240"
          y="200"
          width="80"
          height="160"
          rx="4"
          fill="url(#mirrorShine)"
          opacity={mirrorShine}
        />
      </g>

      {/* Vanity light glow */}
      <ellipse
        cx="350"
        cy="160"
        rx="150"
        ry="30"
        fill="url(#vanityLight)"
        opacity="0.3"
      />

      <defs>
        <linearGradient id="mirrorShine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="vanityLight">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};
