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
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
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
        // Cyber-romantic theme colors - Enhanced palette
        cyber: {
          pink: '#ff00aa', // Hot magenta
          purple: '#7c3aed',
          blue: '#00f2ff', // Electric sapphire blue
          dark: '#1a0033', // Deep indigo
          darker: '#0d001a', // Violet-black
          'dark-alt': '#0f0f1a', // Alternative dark
        },
        neon: {
          pink: '#ff00aa', // Hot magenta for neon effects
          magenta: '#ff0080', // Vibrant magenta
          blue: '#00f2ff', // Electric sapphire for neon effects
          cyan: '#00ffff', // Pure cyan for neon effects
          purple: '#bf40ff', // Vibrant purple for neon effects
          green: '#01ff89',
        },
        nebula: {
          indigo: '#1a0033', // Deep nebula indigo
          violet: '#2d1b4e', // Deep violet
          purple: '#4a148c', // Rich purple
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
        'cyber-grid': 'linear-gradient(0deg, transparent 24%, rgba(255, 0, 170, .05) 25%, rgba(255, 0, 170, .05) 26%, transparent 27%, transparent 74%, rgba(255, 0, 170, .05) 75%, rgba(255, 0, 170, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 0, 170, .05) 25%, rgba(255, 0, 170, .05) 26%, transparent 27%, transparent 74%, rgba(255, 0, 170, .05) 75%, rgba(255, 0, 170, .05) 76%, transparent 77%, transparent)',
        'glow-gradient': 'radial-gradient(circle at center, rgba(255, 0, 170, 0.4) 0%, rgba(124, 58, 237, 0.2) 50%, transparent 100%)',
        'nebula-gradient': 'radial-gradient(ellipse at top, rgba(26, 0, 51, 1) 0%, rgba(13, 0, 26, 1) 100%)',
        'space-gradient': 'linear-gradient(180deg, #0d001a 0%, #1a0033 50%, #2d1b4e 100%)',
        'prism-glow': 'radial-gradient(circle at 30% 50%, rgba(255, 0, 170, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(0, 242, 255, 0.15) 0%, transparent 50%)',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(255, 0, 170, 0.5)',
        'glow-md': '0 0 20px rgba(255, 0, 170, 0.6), 0 0 40px rgba(124, 58, 237, 0.3)',
        'glow-lg': '0 0 30px rgba(255, 0, 170, 0.7), 0 0 60px rgba(124, 58, 237, 0.4), 0 0 90px rgba(0, 242, 255, 0.2)',
        'glow-xl': '0 0 40px rgba(255, 0, 170, 0.8), 0 0 80px rgba(124, 58, 237, 0.5), 0 0 120px rgba(0, 242, 255, 0.3)',
        'neon-pink': '0 0 5px #ff00aa, 0 0 10px #ff00aa, 0 0 20px #ff00aa, 0 0 30px #ff00aa',
        'neon-blue': '0 0 5px #00f2ff, 0 0 10px #00f2ff, 0 0 20px #00f2ff, 0 0 30px #00f2ff',
        'neon-magenta': '0 0 8px #ff00aa, 0 0 16px #ff00aa, 0 0 24px #ff00aa',
        'inner-glow': 'inset 0 0 20px rgba(255, 0, 170, 0.3)',
        'glassmorphism': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
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
            boxShadow: '0 0 20px rgba(255, 0, 170, 0.6), 0 0 40px rgba(124, 58, 237, 0.3)',
          },
          '50%': {
            opacity: '0.9',
            boxShadow: '0 0 30px rgba(255, 0, 170, 0.8), 0 0 60px rgba(124, 58, 237, 0.5)',
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
        'breathing': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '0.6',
          },
          '50%': {
            transform: 'scale(1.03)',
            opacity: '0.8',
          },
        },
        'particle-float': {
          '0%': {
            transform: 'translateY(100vh) translateX(0) scale(0)',
            opacity: '0',
          },
          '10%': {
            opacity: '0.6',
          },
          '90%': {
            opacity: '0.6',
          },
          '100%': {
            transform: 'translateY(-100px) translateX(50px) scale(1)',
            opacity: '0',
          },
        },
        'prism-pulse': {
          '0%, 100%': {
            opacity: '0.3',
            filter: 'blur(40px)',
          },
          '50%': {
            opacity: '0.5',
            filter: 'blur(60px)',
          },
        },
        'hologram-flicker': {
          '0%, 100%': {
            opacity: '0.95',
          },
          '50%': {
            opacity: '1',
          },
          '75%': {
            opacity: '0.92',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float-up': 'float-up 3s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'breathing': 'breathing 4s ease-in-out infinite',
        'particle-float': 'particle-float 15s ease-in-out infinite',
        'prism-pulse': 'prism-pulse 3s ease-in-out infinite',
        'hologram-flicker': 'hologram-flicker 3s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
} satisfies Config;
