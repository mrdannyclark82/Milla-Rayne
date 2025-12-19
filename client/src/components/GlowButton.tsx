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
      'inline-flex items-center justify-center font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tactile backdrop-blur-xl';

    // Glassmorphism + Neumorphic hybrid styles
    const variantStyles = {
      pink: cn(
        'bg-gradient-to-br from-cyber-pink/60 via-cyber-pink/50 to-cyber-pink/40',
        'border border-cyber-pink/40',
        'text-white',
        'hover:from-cyber-pink/80 hover:via-cyber-pink/70 hover:to-cyber-pink/60',
        'hover:border-cyber-pink/60',
        'focus-visible:ring-cyber-pink',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]',
        glow && 'shadow-[0_0_20px_rgba(255,0,170,0.4),0_0_40px_rgba(255,0,170,0.2),inset_0_1px_0_0_rgba(255,255,255,0.2)]',
        glow && 'hover:shadow-[0_0_30px_rgba(255,0,170,0.6),0_0_60px_rgba(255,0,170,0.3),inset_0_1px_0_0_rgba(255,255,255,0.3)]'
      ),
      blue: cn(
        'bg-gradient-to-br from-neon-blue/60 via-neon-blue/50 to-neon-blue/40',
        'border border-neon-blue/40',
        'text-white',
        'hover:from-neon-blue/80 hover:via-neon-blue/70 hover:to-neon-blue/60',
        'hover:border-neon-blue/60',
        'focus-visible:ring-neon-blue',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]',
        glow && 'shadow-[0_0_20px_rgba(0,242,255,0.4),0_0_40px_rgba(0,242,255,0.2),inset_0_1px_0_0_rgba(255,255,255,0.2)]',
        glow && 'hover:shadow-[0_0_30px_rgba(0,242,255,0.6),0_0_60px_rgba(0,242,255,0.3),inset_0_1px_0_0_rgba(255,255,255,0.3)]'
      ),
      purple: cn(
        'bg-gradient-to-br from-cyber-purple/60 via-cyber-purple/50 to-cyber-purple/40',
        'border border-cyber-purple/40',
        'text-white',
        'hover:from-cyber-purple/80 hover:via-cyber-purple/70 hover:to-cyber-purple/60',
        'hover:border-cyber-purple/60',
        'focus-visible:ring-cyber-purple',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]',
        glow && 'shadow-[0_0_20px_rgba(124,58,237,0.4),0_0_40px_rgba(124,58,237,0.2),inset_0_1px_0_0_rgba(255,255,255,0.2)]',
        glow && 'hover:shadow-[0_0_30px_rgba(124,58,237,0.6),0_0_60px_rgba(124,58,237,0.3),inset_0_1px_0_0_rgba(255,255,255,0.3)]'
      ),
      default: cn(
        'bg-nebula-indigo/60 backdrop-blur-xl',
        'border border-slate-600/40',
        'text-white',
        'hover:bg-nebula-indigo/80',
        'hover:border-slate-500/60',
        'focus-visible:ring-slate-500',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]'
      ),
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm rounded-xl',
      md: 'px-6 py-3 text-base rounded-2xl',
      lg: 'px-8 py-4 text-lg rounded-2xl',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          'hover:-translate-y-1 hover:scale-105 active:translate-y-0 active:scale-100',
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
