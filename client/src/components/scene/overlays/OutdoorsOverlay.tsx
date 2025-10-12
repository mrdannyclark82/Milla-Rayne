/**
 * OutdoorsOverlay - Treeline/porch rail with stars at night
 */

import React from 'react';
import { TimeOfDay } from '@/types/scene';

interface OutdoorsOverlayProps {
  timeOfDay: TimeOfDay;
  reducedMotion: boolean;
}

export const OutdoorsOverlay: React.FC<OutdoorsOverlayProps> = ({
  timeOfDay,
  reducedMotion,
}) => {
  const opacity =
    timeOfDay === 'night' ? 0.2 : timeOfDay === 'dusk' ? 0.25 : 0.3;
  const showStars = timeOfDay === 'night' || timeOfDay === 'dusk';

  // Star positions (fixed, but could twinkle if not reduced motion)
  const stars = [
    { x: 100, y: 80, size: 2 },
    { x: 200, y: 120, size: 1.5 },
    { x: 350, y: 60, size: 2.5 },
    { x: 450, y: 100, size: 1.8 },
    { x: 550, y: 70, size: 2 },
    { x: 150, y: 140, size: 1.5 },
    { x: 300, y: 110, size: 2.2 },
    { x: 500, y: 130, size: 1.6 },
  ];

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
      {/* Stars (only at night/dusk) */}
      {showStars && (
        <g opacity="0.7">
          {stars.map((star, i) => (
            <circle
              key={i}
              cx={star.x}
              cy={star.y}
              r={star.size}
              fill="currentColor"
              className={
                reducedMotion ? 'text-white/60' : 'text-white/60 animate-pulse'
              }
              style={
                reducedMotion
                  ? {}
                  : {
                      animationDuration: `${2 + i * 0.3}s`,
                      animationDelay: `${i * 0.2}s`,
                    }
              }
            />
          ))}
        </g>
      )}

      {/* Treeline silhouette */}
      <g opacity="0.5">
        {/* Tree shapes */}
        <path
          d="M 50 450 L 100 350 L 80 350 L 120 280 L 100 280 L 140 220 L 100 220 L 70 320 L 50 320 Z"
          fill="currentColor"
          className="text-white/40"
        />
        <path
          d="M 180 470 L 220 380 L 200 380 L 240 310 L 220 310 L 260 250 L 220 250 L 200 360 L 180 360 Z"
          fill="currentColor"
          className="text-white/35"
        />
        <path
          d="M 320 460 L 360 370 L 340 370 L 380 300 L 360 300 L 400 240 L 360 240 L 340 350 L 320 350 Z"
          fill="currentColor"
          className="text-white/38"
        />
      </g>

      {/* Porch railing (optional) */}
      <g opacity="0.6">
        <rect
          x="0"
          y="520"
          width="600"
          height="8"
          fill="currentColor"
          className="text-white/40"
        />
        {/* Vertical posts */}
        <rect
          x="50"
          y="480"
          width="6"
          height="48"
          fill="currentColor"
          className="text-white/35"
        />
        <rect
          x="150"
          y="480"
          width="6"
          height="48"
          fill="currentColor"
          className="text-white/35"
        />
        <rect
          x="250"
          y="480"
          width="6"
          height="48"
          fill="currentColor"
          className="text-white/35"
        />
        <rect
          x="350"
          y="480"
          width="6"
          height="48"
          fill="currentColor"
          className="text-white/35"
        />
        <rect
          x="450"
          y="480"
          width="6"
          height="48"
          fill="currentColor"
          className="text-white/35"
        />
        <rect
          x="550"
          y="480"
          width="6"
          height="48"
          fill="currentColor"
          className="text-white/35"
        />
      </g>
    </svg>
  );
};
