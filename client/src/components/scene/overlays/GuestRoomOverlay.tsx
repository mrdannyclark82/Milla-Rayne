/**
 * GuestRoomOverlay - Simplified bed silhouette variant
 */

import React from 'react';
import { TimeOfDay } from '@/types/scene';

interface GuestRoomOverlayProps {
  timeOfDay: TimeOfDay;
  reducedMotion: boolean;
}

export const GuestRoomOverlay: React.FC<GuestRoomOverlayProps> = ({
  timeOfDay,
  reducedMotion,
}) => {
  const opacity =
    timeOfDay === 'night' ? 0.15 : timeOfDay === 'dusk' ? 0.2 : 0.25;

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
      {/* Simplified bed */}
      <g opacity="0.6">
        {/* Simple headboard */}
        <rect
          x="180"
          y="330"
          width="300"
          height="80"
          rx="6"
          fill="currentColor"
          className="text-white/40"
        />
        {/* Mattress */}
        <rect
          x="180"
          y="410"
          width="300"
          height="90"
          rx="4"
          fill="currentColor"
          className="text-white/35"
        />
        {/* Bedding fold */}
        <rect
          x="180"
          y="470"
          width="300"
          height="30"
          rx="2"
          fill="currentColor"
          className="text-white/30"
        />
        {/* Pillow */}
        <ellipse
          cx="330"
          cy="390"
          rx="80"
          ry="30"
          fill="currentColor"
          className="text-white/25"
        />
      </g>

      {/* Small side table */}
      <g opacity="0.5">
        <rect
          x="500"
          y="440"
          width="60"
          height="90"
          rx="3"
          fill="currentColor"
          className="text-white/30"
        />
      </g>
    </svg>
  );
};
