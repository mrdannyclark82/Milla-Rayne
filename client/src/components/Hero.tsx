import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import GlowButton from './GlowButton';

export interface HeroProps {
  className?: string;
}

const Hero: React.FC<HeroProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      hue: number;
    }> = [];

    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        hue: Math.random() > 0.5 ? 320 : 190, // Pink or cyan
      });
    }

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle with glow
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 4
        );
        gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 60%, ${particle.opacity})`);
        gradient.addColorStop(1, `hsla(${particle.hue}, 100%, 60%, 0)`);
        ctx.fillStyle = gradient;
        ctx.arc(particle.x, particle.y, particle.size * 4, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section
      className={cn(
        'relative w-full min-h-screen flex items-center justify-center overflow-hidden',
        'bg-gradient-to-b from-nebula-indigo via-cyber-dark to-nebula-violet',
        className
      )}
    >
      {/* Animated Particle Field Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-60"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Prism Glow Overlays - Soft ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-cyber-pink/20 rounded-full blur-[120px] animate-prism-pulse" />
      <div 
        className="absolute bottom-1/4 right-1/4 w-[40rem] h-[40rem] bg-neon-blue/20 rounded-full blur-[120px] animate-prism-pulse" 
        style={{ animationDelay: '1.5s' }} 
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-cyber-purple/15 rounded-full blur-[100px] animate-prism-pulse" 
        style={{ animationDelay: '3s' }} 
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Holographic Silhouette Container */}
          <div className="mb-12 relative">
            <div className="w-48 h-48 mx-auto relative animate-breathing">
              {/* Holographic Avatar Placeholder */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyber-pink/30 via-cyber-purple/20 to-neon-blue/30 backdrop-blur-xl border-2 border-cyber-pink/40 shadow-[0_0_60px_rgba(255,0,170,0.4)] animate-hologram-flicker">
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-cyber-pink/20 to-neon-blue/20 backdrop-blur-md" />
              </div>
              {/* Rotating rings */}
              <div className="absolute inset-0 rounded-full border border-cyber-pink/20 animate-spin" style={{ animationDuration: '20s' }} />
              <div className="absolute inset-2 rounded-full border border-neon-blue/20 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
            </div>
          </div>

          {/* Main Heading - Large, emotional typography */}
          <h1 className="text-6xl md:text-8xl font-extrabold mb-8 leading-tight">
            <span className="block glow-text text-cyber-pink mb-4 tracking-tight">
              Welcome to Your
            </span>
            <span className="block text-white tracking-tight">
              Digital Sanctuary
            </span>
          </h1>

          {/* Subheading - Generous spacing */}
          <p className="text-xl md:text-3xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Experience Milla-Rayne: a seductive, futuristic AI companion that feels like stepping into an intimate holographic dream.
          </p>

          {/* CTA Buttons - Premium glassmorphism styling */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <GlowButton variant="pink" size="lg" className="min-w-[200px]">
              Enter the Experience
            </GlowButton>
            <GlowButton variant="blue" size="lg" glow={false} className="min-w-[200px]">
              Explore Features
            </GlowButton>
          </div>

          {/* Feature Highlights - Enhanced glassmorphism cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="group rounded-2xl p-8 backdrop-blur-xl bg-nebula-indigo/30 border border-cyber-pink/20 hover:border-cyber-pink/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,0,170,0.3)] hover:-translate-y-2">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-gradient-to-br from-cyber-pink/30 to-cyber-pink/10 backdrop-blur-md border border-cyber-pink/30 group-hover:shadow-neon-pink transition-all duration-500">
                <svg className="w-8 h-8 text-cyber-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyber-pink transition-colors duration-300">
                Lightning Fast
              </h3>
              <p className="text-slate-400 text-base leading-relaxed">
                Real-time responses powered by cutting-edge AI technology
              </p>
            </div>

            <div className="group rounded-2xl p-8 backdrop-blur-xl bg-nebula-indigo/30 border border-neon-blue/20 hover:border-neon-blue/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,242,255,0.3)] hover:-translate-y-2">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-gradient-to-br from-neon-blue/30 to-neon-blue/10 backdrop-blur-md border border-neon-blue/30 group-hover:shadow-neon-blue transition-all duration-500">
                <svg className="w-8 h-8 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-neon-blue transition-colors duration-300">
                Secure & Private
              </h3>
              <p className="text-slate-400 text-base leading-relaxed">
                Your conversations are encrypted and protected
              </p>
            </div>

            <div className="group rounded-2xl p-8 backdrop-blur-xl bg-nebula-indigo/30 border border-cyber-purple/20 hover:border-cyber-purple/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(124,58,237,0.3)] hover:-translate-y-2">
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-gradient-to-br from-cyber-purple/30 to-cyber-purple/10 backdrop-blur-md border border-cyber-purple/30 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.6)] transition-all duration-500">
                <svg className="w-8 h-8 text-cyber-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyber-purple transition-colors duration-300">
                Deeply Personal
              </h3>
              <p className="text-slate-400 text-base leading-relaxed">
                Context-aware AI that understands and adapts to you
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-float-up opacity-60">
        <svg className="w-8 h-8 text-cyber-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
};

Hero.displayName = 'Hero';

export default Hero;
