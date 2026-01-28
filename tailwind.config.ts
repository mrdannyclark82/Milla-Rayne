import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./client/index.html', './client/src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        // Cyber-romantic theme colors
        cyber: {
          pink: '#ff2a6d',
          purple: '#7c3aed',
          blue: '#05d9e8',
          dark: '#0f0f1a',
          darker: '#05070d',
        },
        neon: {
          pink: '#ff0080',
          blue: '#00ffff',
          purple: '#bf40ff',
          green: '#01ff89',
        },
        // Milla premium palette
        milla: {
          void: '#0c021a',
          abyss: '#120428',
          deep: '#1a0033',
          sapphire: '#00f2ff',
          magenta: '#ff00aa',
          violet: '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cyber-grid': 'linear-gradient(0deg, transparent 24%, rgba(255, 42, 109, .05) 25%, rgba(255, 42, 109, .05) 26%, transparent 27%, transparent 74%, rgba(255, 42, 109, .05) 75%, rgba(255, 42, 109, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 42, 109, .05) 25%, rgba(255, 42, 109, .05) 26%, transparent 27%, transparent 74%, rgba(255, 42, 109, .05) 75%, rgba(255, 42, 109, .05) 76%, transparent 77%, transparent)',
        'glow-gradient': 'radial-gradient(circle at center, rgba(255, 42, 109, 0.4) 0%, rgba(124, 58, 237, 0.2) 50%, transparent 100%)',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(255, 42, 109, 0.5)',
        'glow-md': '0 0 20px rgba(255, 42, 109, 0.6), 0 0 40px rgba(124, 58, 237, 0.3)',
        'glow-lg': '0 0 30px rgba(255, 42, 109, 0.7), 0 0 60px rgba(124, 58, 237, 0.4), 0 0 90px rgba(5, 217, 232, 0.2)',
        'glow-xl': '0 0 40px rgba(255, 42, 109, 0.8), 0 0 80px rgba(124, 58, 237, 0.5), 0 0 120px rgba(5, 217, 232, 0.3)',
        'neon-pink': '0 0 5px #ff2a6d, 0 0 10px #ff2a6d, 0 0 20px #ff2a6d',
        'neon-blue': '0 0 5px #05d9e8, 0 0 10px #05d9e8, 0 0 20px #05d9e8',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'glow-pulse': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 20px rgba(255, 42, 109, 0.6), 0 0 40px rgba(124, 58, 237, 0.3)',
          },
          '50%': {
            opacity: '0.9',
            boxShadow: '0 0 30px rgba(255, 42, 109, 0.8), 0 0 60px rgba(124, 58, 237, 0.5)',
          },
        },
        'float-up': {
          '0%': {
            transform: 'translateY(0px)',
            opacity: '0',
          },
          '50%': {
            opacity: '1',
          },
          '100%': {
            transform: 'translateY(-20px)',
            opacity: '0',
          },
        },
        'shimmer': {
          '0%': {
            backgroundPosition: '-200% center',
          },
          '100%': {
            backgroundPosition: '200% center',
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        'spin': {
          from: {
            transform: 'rotate(0deg)',
          },
          to: {
            transform: 'rotate(360deg)',
          },
        },
        'scanlines': {
          '0%': {
            backgroundPosition: '0 0',
          },
          '100%': {
            backgroundPosition: '0 100%',
          },
        },
        'pulse': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.7',
            transform: 'scale(1.05)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float-up': 'float-up 3s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'float': 'float 4s ease-in-out infinite',
        'spin': 'spin 10s linear infinite',
        'scanlines': 'scanlines 8s linear infinite',
        'pulse': 'pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
} satisfies Config;
