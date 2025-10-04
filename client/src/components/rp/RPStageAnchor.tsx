import React from 'react';

interface RPStageAnchorProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * RPStageAnchor - Fixed stage layer for Milla's visual
 * 
 * Layout:
 * - Left 2/3 of viewport (66.6667vw)
 * - Full height
 * - Fixed positioning (not pushed by chat)
 * - Z-index: -5 (above background at -10, below chat at 0+)
 * - No pointer events
 * - Aria-hidden for accessibility
 */
export const RPStageAnchor: React.FC<RPStageAnchorProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div
      className={`rp-stage-anchor ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '66.6667vw', // Left 2/3
        height: '100vh',
        zIndex: -5, // Above background (-10), below chat (0+)
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
      aria-hidden="true"
      role="presentation"
    >
      {children}
    </div>
  );
};
