import React, { useMemo } from 'react';
import { millaAppearance, timeOfDayTints } from '@/config/millaAppearance';
import { TimeOfDay } from '@/types/scene';

export type VisualState = 'idle' | 'listening' | 'speaking';
export type FramingMode = 'full' | 'torso';

interface MillaSilhouetteProps {
  state?: VisualState;
  timeOfDay?: TimeOfDay;
  framing?: FramingMode;
  reducedMotion?: boolean;
  className?: string;
}

/**
 * MillaSilhouette - Lightweight placeholder visual of Milla
 * 
 * Renders an SVG silhouette with:
 * - Green eyes (configurable from millaAppearance)
 * - State-based animations (idle/listening/speaking)
 * - Time-of-day tints
 * - Support for full body or torso framing
 * - Reduced-motion compliance
 */
export const MillaSilhouette: React.FC<MillaSilhouetteProps> = ({
  state = 'idle',
  timeOfDay = 'day',
  framing = 'full',
  reducedMotion = false,
  className = ''
}) => {
  // Get time-of-day tint
  const tint = timeOfDayTints[timeOfDay];
  
  // State-based animations (disabled if reducedMotion)
  const getStateStyles = useMemo(() => {
    if (reducedMotion) {
      // Use only opacity/brightness changes for reduced motion
      switch (state) {
        case 'listening':
          return { filter: 'brightness(1.1)' };
        case 'speaking':
          return { filter: 'brightness(1.15)' };
        default:
          return {};
      }
    }
    
    // Full animations
    switch (state) {
      case 'listening':
        return {
          animation: 'listening-pulse 2s ease-in-out infinite',
          filter: 'brightness(1.1)'
        };
      case 'speaking':
        return {
          animation: 'speaking-pulse 1s ease-in-out infinite',
          filter: 'brightness(1.15)'
        };
      default:
        return {
          animation: 'idle-breathe 4s ease-in-out infinite'
        };
    }
  }, [state, reducedMotion]);

  // Eye glow based on state
  const getEyeGlow = useMemo(() => {
    if (state === 'listening') return '0 0 12px ' + millaAppearance.eyes.highlight;
    if (state === 'speaking') return '0 0 16px ' + millaAppearance.eyes.highlight;
    return '0 0 6px ' + millaAppearance.eyes.highlight;
  }, [state]);

  // Adjust viewBox based on framing
  const viewBox = framing === 'full' ? '0 0 200 400' : '0 0 200 250';
  const torsoOffset = framing === 'torso' ? 0 : 150;

  return (
    <div 
      className={`milla-silhouette ${className}`}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: framing === 'full' ? 'flex-end' : 'center',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}
    >
      <svg
        viewBox={viewBox}
        style={{
          width: framing === 'full' ? '60%' : '50%',
          height: framing === 'full' ? '90%' : '70%',
          maxWidth: '500px',
          maxHeight: framing === 'full' ? '800px' : '500px',
          ...getStateStyles
        }}
        aria-hidden="true"
      >
        {/* Time-of-day tint overlay */}
        <defs>
          <filter id="tint-overlay">
            <feFlood floodColor={tint} result="tint" />
            <feComposite in="tint" in2="SourceGraphic" operator="atop" />
          </filter>
          <filter id="eye-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Body silhouette */}
        <g filter="url(#tint-overlay)">
          {/* Head */}
          <ellipse cx="100" cy="60" rx="35" ry="40" fill={millaAppearance.skin.base} />
          
          {/* Hair - curly volume */}
          <ellipse cx="100" cy="45" rx="42" ry="35" fill={millaAppearance.hair.color} />
          <circle cx="75" cy="50" r="18" fill={millaAppearance.hair.color} opacity="0.8" />
          <circle cx="125" cy="50" r="18" fill={millaAppearance.hair.color} opacity="0.8" />
          <ellipse cx="100" cy="35" rx="38" ry="25" fill={millaAppearance.hair.highlight} opacity="0.3" />
          
          {/* Neck */}
          <rect x="90" y="95" width="20" height="15" fill={millaAppearance.skin.base} rx="3" />
          
          {/* Torso - cozy knit top */}
          <ellipse cx="100" cy="140" rx="45" ry="35" fill={millaAppearance.wardrobe.primary} />
          <rect x="55" y="120" width="90" height="60" fill={millaAppearance.wardrobe.primary} rx="8" />
          
          {/* Collar/neckline detail */}
          <path d="M 85 110 Q 100 115, 115 110" stroke={millaAppearance.wardrobe.secondary} strokeWidth="2" fill="none" />
          
          {/* Arms */}
          <ellipse cx="50" cy="145" rx="12" ry="45" fill={millaAppearance.wardrobe.secondary} />
          <ellipse cx="150" cy="145" rx="12" ry="45" fill={millaAppearance.wardrobe.secondary} />
          
          {/* Full body elements (only if framing is 'full') */}
          {framing === 'full' && (
            <>
              {/* Waist/hips */}
              <ellipse cx="100" cy="210" rx="42" ry="30" fill={millaAppearance.wardrobe.secondary} />
              <rect x="58" y="190" width="84" height="50" fill={millaAppearance.wardrobe.secondary} rx="6" />
              
              {/* Legs */}
              <rect x="70" y="230" width="25" height="140" fill="#4a5568" rx="4" />
              <rect x="105" y="230" width="25" height="140" fill="#4a5568" rx="4" />
              
              {/* Feet */}
              <ellipse cx="82" cy="375" rx="18" ry="10" fill="#2d3748" />
              <ellipse cx="117" cy="375" rx="18" ry="10" fill="#2d3748" />
            </>
          )}
        </g>

        {/* Eyes - always on top, with glow */}
        <g filter="url(#eye-glow)">
          <ellipse 
            cx="85" 
            cy="65" 
            rx="6" 
            ry="8" 
            fill={millaAppearance.eyes.color}
            style={{ filter: `drop-shadow(${getEyeGlow})` }}
          />
          <ellipse 
            cx="115" 
            cy="65" 
            rx="6" 
            ry="8" 
            fill={millaAppearance.eyes.color}
            style={{ filter: `drop-shadow(${getEyeGlow})` }}
          />
          {/* Eye highlights */}
          <circle cx="87" cy="63" r="2" fill="white" opacity="0.8" />
          <circle cx="117" cy="63" r="2" fill="white" opacity="0.8" />
        </g>

        {/* Light freckles */}
        <circle cx="90" cy="72" r="1" fill={millaAppearance.skin.freckles} opacity="0.4" />
        <circle cx="94" cy="75" r="1" fill={millaAppearance.skin.freckles} opacity="0.4" />
        <circle cx="106" cy="75" r="1" fill={millaAppearance.skin.freckles} opacity="0.4" />
        <circle cx="110" cy="72" r="1" fill={millaAppearance.skin.freckles} opacity="0.4" />
      </svg>

      <style>{`
        @keyframes idle-breathe {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.01); }
        }
        
        @keyframes listening-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.03); opacity: 0.95; }
        }
        
        @keyframes speaking-pulse {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.02); }
          75% { transform: scale(1.01); }
        }
      `}</style>
    </div>
  );
};
