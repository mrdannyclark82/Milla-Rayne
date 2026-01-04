import React from 'react';
import { cn } from '@/lib/utils';
import GlowButton from './GlowButton';

export interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full backdrop-blur-xl',
        'bg-nebula-indigo/60 border-b border-cyber-pink/20',
        'shadow-[0_4px_20px_rgba(0,0,0,0.4)]',
        className
      )}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-pink/40 to-neon-blue/40 backdrop-blur-xl border border-cyber-pink/30 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,170,0.3)]">
              <span className="text-xl font-bold text-white">M</span>
            </div>
            <h1 className="text-2xl font-bold text-white glow-text-sm">
              Milla-Rayne
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-slate-300 hover:text-cyber-pink transition-all duration-300 font-medium tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-pink focus-visible:rounded-lg px-3 py-2"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-slate-300 hover:text-cyber-pink transition-all duration-300 font-medium tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-pink focus-visible:rounded-lg px-3 py-2"
            >
              About
            </a>
            <a
              href="#contact"
              className="text-slate-300 hover:text-cyber-pink transition-all duration-300 font-medium tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-pink focus-visible:rounded-lg px-3 py-2"
            >
              Contact
            </a>
          </nav>

          {/* CTA Button */}
          <div className="flex items-center space-x-4">
            <GlowButton variant="pink" size="sm">
              Get Started
            </GlowButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-300 hover:text-cyber-pink transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-pink focus-visible:rounded-lg tactile backdrop-blur-xl bg-nebula-indigo/40 rounded-xl border border-cyber-pink/20"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

Header.displayName = 'Header';

export default Header;
