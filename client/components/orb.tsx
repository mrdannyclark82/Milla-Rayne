/**
 * Enhanced Orb Component
 * Advanced visualization with state-reactive animations
 * Integrates with FuturisticOrb for extended features
 */

import React, { useEffect, useRef, useState } from 'react';

interface OrbProps {
  isActive?: boolean;
  isSpeaking?: boolean;
  isListening?: boolean;
  intensity?: number;
  color?: string;
  size?: number;
}

const Orb: React.FC<OrbProps> = ({
  isActive = false,
  isSpeaking = false,
  isListening = false,
  intensity = 0.5,
  color = '#00ff00',
  size = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size / 4;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background glow
      const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 2);
      glow.addColorStop(0, `${color}22`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dynamic radius based on state
      let radius = baseRadius;
      if (isActive) radius += Math.sin(time * 2) * 15;
      if (isSpeaking) radius += Math.sin(time * 5) * 10;
      if (isListening) radius += Math.sin(time * 3) * 8;

      // Main orb
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.7, `${color}99`);
      gradient.addColorStop(1, `${color}00`);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Outer ring for speaking
      if (isSpeaking) {
        const ringRadius = baseRadius + 20 + Math.sin(time * 4) * 5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = `${color}88`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Pulse effect for listening
      if (isListening) {
        const pulseRadius = baseRadius + ((time * 30) % 50);
        const pulseAlpha = 1 - ((time * 30) % 50) / 50;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(255, 0, 255, ${pulseAlpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Core dot
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      time += 0.02;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, isSpeaking, isListening, intensity, color, size]);

  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size}
      style={{
        filter: isActive ? 'brightness(1.2)' : 'brightness(0.8)',
        transition: 'filter 0.3s ease',
      }}
    />
  );
};

export default Orb;
