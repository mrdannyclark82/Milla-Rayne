import React from 'react';
import { cn } from '@/lib/utils';
import GlowButton from './GlowButton';

export interface HeroProps {
  className?: string;
}

const Hero: React.FC<HeroProps> = ({ className }) => {
  return (
    <section
      className={cn(
        'relative w-full min-h-screen flex items-center justify-center overflow-hidden',
        'bg-cyber-darker',
        className
      )}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-cyber-grid opacity-20" />
      <div className="absolute inset-0 bg-glow-animated opacity-30" />

      {/* Gradient Overlays */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyber-pink/20 rounded-full blur-3xl animate-glow-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyber-purple/20 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-high-contrast">
            <span className="block glow-text text-cyber-pink mb-2">
              Welcome to the Future
            </span>
            <span className="block text-white">
              of AI Companionship
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Experience a deeply personal, context-aware AI assistant designed for rich, meaningful interaction.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <GlowButton variant="pink" size="lg">
              Start Your Journey
            </GlowButton>
            <GlowButton variant="blue" size="lg" glow={false}>
              Learn More
            </GlowButton>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="card-glow rounded-lg p-6 backdrop-blur-md bg-cyber-dark/60">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-cyber-pink/20">
                <svg className="w-6 h-6 text-cyber-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-high-contrast mb-2">
                Lightning Fast
              </h3>
              <p className="text-slate-400 text-sm">
                Real-time responses powered by cutting-edge AI technology
              </p>
            </div>

            <div className="card-glow rounded-lg p-6 backdrop-blur-md bg-cyber-dark/60">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-neon-blue/20">
                <svg className="w-6 h-6 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-high-contrast mb-2">
                Secure & Private
              </h3>
              <p className="text-slate-400 text-sm">
                Your conversations are encrypted and protected
              </p>
            </div>

            <div className="card-glow rounded-lg p-6 backdrop-blur-md bg-cyber-dark/60">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-cyber-purple/20">
                <svg className="w-6 h-6 text-cyber-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-high-contrast mb-2">
                Deeply Personal
              </h3>
              <p className="text-slate-400 text-sm">
                Context-aware AI that understands and adapts to you
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-float-up">
        <svg className="w-6 h-6 text-cyber-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
};

Hero.displayName = 'Hero';

export default Hero;
