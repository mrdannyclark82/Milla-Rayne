import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { SceneConfig, ParticleConfig } from '@/types/scene';

interface CSSSceneRendererProps {
  config: SceneConfig;
  interactive?: boolean;
  parallaxIntensity?: number;
  enableParticles?: boolean;
  particleDensity?: 'low' | 'medium' | 'high';
  animationSpeed?: number;
  region?: 'full' | 'left-2-3'; // Region to render (full viewport or left 2/3)
}

export const CSSSceneRenderer: React.FC<CSSSceneRendererProps> = ({
  config,
  interactive = true,
  parallaxIntensity = 50,
  enableParticles = true,
  particleDensity = 'medium',
  animationSpeed = 1.0,
  region = 'full',
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
    background: `conic-gradient(from 180deg at 50% 50%, ${config.colors[0]}, ${config.colors[1]}, ${config.colors[2]}, ${config.colors[0]})`,
    backgroundSize: '400% 400%',
    animation: `gradient-rotate ${30 / animationSpeed}s linear infinite`,
    transition: 'all 1s ease-in-out',
    // CSS variable for animation speed multiplier
    ['--scene-anim-speed' as string]: animationSpeed.toString(),
  };

  const parallaxTransform = interactive
    ? `translate(${mousePos.x * parallaxIntensity}px, ${mousePos.y * parallaxIntensity}px)`
    : 'none';

  // Determine positioning based on region
  const regionStyle =
    region === 'left-2-3'
      ? {
          position: 'fixed' as const,
          top: 0,
          left: 0,
          width: '66.6667vw', // Left 2/3
          height: '100vh',
          zIndex: -10,
          overflow: 'hidden',
          pointerEvents: 'none' as const,
        }
      : {};

  return (
    <div
      ref={sceneRef}
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ ...gradientStyle, ...regionStyle, pointerEvents: 'none' }}
      aria-hidden="true"
      role="presentation"
    >
      {/* Enhanced Parallax layer 1 (background with noise simulation) */}
      <motion.div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          transform: `${parallaxTransform} scale(1.1)`,
          background: `radial-gradient(circle at 50% 50%, ${config.colors[0]} 0%, transparent 50%), 
                       radial-gradient(circle at 20% 80%, ${config.colors[1]} 0%, transparent 50%)`,
          filter: 'contrast(1.2) brightness(1.1)',
        }}
        animate={{ opacity: [0.3, 0.4, 0.3] }}
        transition={{ duration: 5 / animationSpeed, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />

      {/* Enhanced Parallax layer 2 (middle with procedural pattern) */}
      <motion.div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          transform: `translate(${mousePos.x * parallaxIntensity * 1.5}px, ${mousePos.y * parallaxIntensity * 1.5}px) scale(1.2)`,
          background: `repeating-radial-gradient(circle at center, transparent 0%, ${config.colors[2]} 10%, transparent 20%)`,
          backgroundSize: '50px 50px',
          animation: `pattern-shift ${20 / animationSpeed}s linear infinite`,
        }}
        animate={{ scale: [1.2, 1.25, 1.2] }}
        transition={{ duration: 8 / animationSpeed, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />

      {/* Particle layer */}
      {enableParticles && config.particles && (
        <ParticleLayer
          config={{ ...config.particles, density: particleDensity }}
          animationSpeed={animationSpeed}
        />
      )}

      {/* Ambient glow overlay with subtle pulse */}
      <motion.div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${config.colors[config.colors.length - 1]}, transparent)`,
          filter: 'blur(20px)',
        }}
        animate={{ opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 4 / animationSpeed, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
    </div>
  );
};

// Particle layer component with enhanced variety
const ParticleLayer: React.FC<{
  config: ParticleConfig;
  animationSpeed: number;
}> = ({ config, animationSpeed = 1.0 }) => {
  const particleCount =
    config.density === 'low' ? 30 : config.density === 'medium' ? 60 : 90;
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 8 + Math.random() * 24,
    size: 0.5 + Math.random() * 1.5,
    opacity: 0.4 + Math.random() * 0.4,
  }));

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            filter: config.type === "snowflakes" ? "blur(0.5px)" : "blur(1px)",
          }}
          animate={{
            y: [0, 100, 0],
            x: [0, Math.sin(p.delay) * 50, 0],
            opacity: [p.opacity, p.opacity * 0.5, p.opacity],
          }}
          transition={{
            duration: p.duration / animationSpeed,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};
