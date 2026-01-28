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
        'sticky top-0 z-50 w-full backdrop-blur-md',
        'bg-cyber-dark/80 border-b border-cyber-pink/20',
        className
      )}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-high-contrast glow-text-sm text-cyber-pink">
              Milla-Rayne
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="#features"
              className="text-slate-300 hover:text-cyber-pink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-pink focus-visible:rounded"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-slate-300 hover:text-cyber-pink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-pink focus-visible:rounded"
            >
              About
            </a>
            <a
              href="#contact"
              className="text-slate-300 hover:text-cyber-pink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-pink focus-visible:rounded"
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
            className="md:hidden p-2 text-slate-300 hover:text-cyber-pink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-pink focus-visible:rounded tactile"
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
