import React from 'react';
import { cn } from '@/lib/utils';

export interface GlowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'pink' | 'blue' | 'purple' | 'default';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant = 'pink', size = 'md', glow = true, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tactile';

    const variantStyles = {
      pink: 'bg-gradient-to-br from-cyber-pink to-pink-600 text-white hover:from-cyber-pink hover:to-pink-700 focus-visible:ring-cyber-pink',
      blue: 'bg-gradient-to-br from-neon-blue to-cyan-600 text-white hover:from-neon-blue hover:to-cyan-700 focus-visible:ring-neon-blue',
      purple: 'bg-gradient-to-br from-cyber-purple to-purple-700 text-white hover:from-cyber-purple hover:to-purple-800 focus-visible:ring-cyber-purple',
      default: 'bg-slate-800 text-white hover:bg-slate-700 focus-visible:ring-slate-500',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-base rounded-lg',
      lg: 'px-6 py-3 text-lg rounded-xl',
    };

    const glowStyles = glow
      ? {
          pink: 'shadow-glow-sm hover:shadow-glow-md',
          blue: 'shadow-[0_0_10px_rgba(5,217,232,0.5)] hover:shadow-[0_0_20px_rgba(5,217,232,0.8)]',
          purple: 'shadow-[0_0_10px_rgba(124,58,237,0.5)] hover:shadow-[0_0_20px_rgba(124,58,237,0.8)]',
          default: '',
        }
      : { pink: '', blue: '', purple: '', default: '' };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          glowStyles[variant],
          'hover:-translate-y-0.5 active:translate-y-0',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GlowButton.displayName = 'GlowButton';

export default GlowButton;
