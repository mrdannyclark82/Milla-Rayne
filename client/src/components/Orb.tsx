// orb.tsx - Dynamic orb animation component
import React, { useEffect, useRef } from 'react';

interface OrbProps {
  size?: number;
  color?: string;
  speed?: number;
}

/**
 * Dynamic animated orb component for visual polish
 * Provides smooth rotation animation with customizable appearance
 */
const Orb: React.FC<OrbProps> = ({ size = 100, color = '#3b82f6', speed = 3000 }) => {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orbRef.current) return;

    const element = orbRef.current;
    let animationId: number;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const rotation = (elapsed / speed) * 360;

      if (element) {
        element.style.transform = `rotate(${rotation}deg)`;
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [speed]);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div
        ref={orbRef}
        className="rounded-full transition-transform"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: `radial-gradient(circle at 30% 30%, ${color}aa, ${color})`,
          boxShadow: `0 0 ${size / 2}px ${color}44`,
        }}
      />
    </div>
  );
};

export default Orb;
