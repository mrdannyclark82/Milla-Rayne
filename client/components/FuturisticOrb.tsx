/**
 * Futuristic Orb Component
 * Advanced 3D orb visualization with particle effects and animations
 * Responds to AI state, voice input, and user interactions
 */

import React, { useEffect, useRef, useState } from 'react';

interface FuturisticOrbProps {
  isActive?: boolean;
  isSpeaking?: boolean;
  isListening?: boolean;
  intensity?: number; // 0-1
  color?: string;
  size?: number;
}

export const FuturisticOrb: React.FC<FuturisticOrbProps> = ({
  isActive = false,
  isSpeaking = false,
  isListening = false,
  intensity = 0.5,
  color = '#00ffff',
  size = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const [particles, setParticles] = useState<Particle[]>([]);

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize particles
    const particleCount = Math.floor(intensity * 50);
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push(createParticle(size / 2, size / 2));
    }
    setParticles(newParticles);

    // Animation loop
    let time = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw glow effect
      drawGlow(ctx, size / 2, size / 2, size / 2, color, intensity);

      // Draw main orb
      drawOrb(ctx, size / 2, size / 2, size / 2, time, color, isActive, isSpeaking, isListening);

      // Update and draw particles
      updateParticles(ctx, newParticles, size / 2, size / 2, isActive);

      // Draw energy rings if speaking
      if (isSpeaking) {
        drawEnergyRings(ctx, size / 2, size / 2, size / 2, time);
      }

      // Draw pulse effect if listening
      if (isListening) {
        drawListeningPulse(ctx, size / 2, size / 2, size / 2, time);
      }

      time += 0.02;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, isSpeaking, isListening, intensity, color, size]);

  const createParticle = (centerX: number, centerY: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    return {
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 3 + 1,
      alpha: Math.random() * 0.5 + 0.5,
    };
  };

  const drawGlow = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    intensity: number
  ) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5);
    gradient.addColorStop(0, `${color}33`);
    gradient.addColorStop(0.5, `${color}11`);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  const drawOrb = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    time: number,
    color: string,
    isActive: boolean,
    isSpeaking: boolean,
    isListening: boolean
  ) => {
    // Pulsing effect
    const pulseRadius = radius + Math.sin(time * 2) * (isActive ? 10 : 5);

    // Gradient
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, pulseRadius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.7, `${color}99`);
    gradient.addColorStop(1, `${color}00`);

    ctx.beginPath();
    ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Inner core
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  };

  const updateParticles = (
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    centerX: number,
    centerY: number,
    isActive: boolean
  ) => {
    particles.forEach((particle) => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Fade out as particles move away
      const dx = particle.x - centerX;
      const dy = particle.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > size / 2 || particle.alpha <= 0) {
        // Reset particle
        Object.assign(particle, createParticle(centerX, centerY));
      } else {
        particle.alpha -= 0.01;
      }

      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 255, ${particle.alpha})`;
      ctx.fill();
    });
  };

  const drawEnergyRings = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    time: number
  ) => {
    for (let i = 0; i < 3; i++) {
      const ringRadius = radius + (time * 30 + i * 20) % 100;
      const alpha = 1 - ((time * 30 + i * 20) % 100) / 100;

      ctx.beginPath();
      ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const drawListeningPulse = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    time: number
  ) => {
    const pulseSize = Math.sin(time * 5) * 20 + radius;
    ctx.beginPath();
    ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 0, 255, ${0.5 + Math.sin(time * 5) * 0.3})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  return (
    <div className="futuristic-orb flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="orb-canvas"
        style={{
          filter: isActive ? 'brightness(1.2)' : 'brightness(0.8)',
          transition: 'filter 0.3s ease',
        }}
      />
    </div>
  );
};

export default FuturisticOrb;
