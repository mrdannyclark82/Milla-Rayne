import React, { useEffect, useState, useRef } from 'react';
import { SceneConfig, ParticleConfig } from '@/types/scene';

interface CSSSceneRendererProps {
  config: SceneConfig;
  interactive?: boolean;
  parallaxIntensity?: number;
}

export const CSSSceneRenderer: React.FC<CSSSceneRendererProps> = ({
  config,
  interactive = true,
  parallaxIntensity = 50
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  const gradientStyle = {
    background: `linear-gradient(135deg, ${config.colors.join(', ')})`,
    backgroundSize: '200% 200%',
    animation: `gradient-shift 15s ease infinite`,
    transition: 'all 1s ease-in-out'
  };

  const parallaxTransform = interactive
    ? `translate(${mousePos.x * parallaxIntensity}px, ${mousePos.y * parallaxIntensity}px)`
    : 'none';

  return (
    <div
      ref={sceneRef}
      className="fixed inset-0 -z-10 overflow-hidden"
      style={gradientStyle}
      aria-hidden="true"
      role="presentation"
    >
      {/* Parallax layer 1 (background) */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          transform: `${parallaxTransform} scale(1.1)`,
          transition: 'transform 0.3s ease-out',
          background: `radial-gradient(circle at 50% 50%, ${config.colors[0]}, transparent)`
        }}
        aria-hidden="true"
      />

      {/* Parallax layer 2 (middle) */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          transform: `translate(${mousePos.x * parallaxIntensity * 1.5}px, ${mousePos.y * parallaxIntensity * 1.5}px) scale(1.2)`,
          transition: 'transform 0.2s ease-out',
          background: `radial-gradient(circle at 30% 70%, ${config.colors[1]}, transparent)`
        }}
        aria-hidden="true"
      />

      {/* Particle layer */}
      {config.particles && <ParticleLayer config={config.particles} />}

      {/* Ambient glow overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${config.colors[config.colors.length - 1]}, transparent)`,
          animation: 'pulse 4s ease-in-out infinite'
        }}
        aria-hidden="true"
      />
    </div>
  );
};

// Particle layer component
const ParticleLayer: React.FC<{ config: ParticleConfig }> = ({ config }) => {
  const particleCount = config.density === 'low' ? 20 : config.density === 'medium' ? 40 : 60;
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 10 + Math.random() * 20
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute w-1 h-1 bg-white rounded-full opacity-60"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            animation: `float ${p.duration}s linear ${p.delay}s infinite, twinkle 3s ease-in-out infinite`,
            filter: 'blur(1px)'
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};
