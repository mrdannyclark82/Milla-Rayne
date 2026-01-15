# Milla Rayne AI Companion

## Overview
A full-stack AI companion application with an Express REST API backend and React frontend. Features a premium futuristic UI with glassmorphism effects and neon accents.

## Recent Changes (January 2026)
- **UI Redesign**: Complete premium futuristic theme implementation
- **Color Palette**: Deep indigo-violet-black gradients, electric sapphire blue (#00f2ff), hot magenta (#ff00aa)
- **Effects**: Glassmorphism, backdrop blur, neon glows, ambient animations
- **Components Updated**: Sidebar, FloatingInput (CommandBar), App layout, chat bubbles

## Project Architecture

### Frontend (`client/`)
- **Framework**: React with Vite
- **Styling**: Tailwind CSS with custom theme
- **UI Components**: Radix UI primitives, shadcn/ui
- **State**: React Query for data fetching
- **Routing**: wouter

### Backend (`server/`)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **API**: RESTful endpoints

### Key Directories
- `client/src/components/` - React components
- `client/src/components/dashboard/` - Premium dashboard components
- `client/src/pages/` - Page components
- `server/` - Express server code
- `shared/` - Shared types and schemas

## Design Theme
- **Background**: `#0c021a` → `#120428` → `#1a0033` (gradient)
- **Primary Accent**: Electric Sapphire Blue `#00f2ff`
- **Secondary Accent**: Hot Magenta `#ff00aa`
- **Tertiary**: Violet `#7c3aed`
- **Effects**: Glassmorphism with `backdrop-blur-xl`, neon `box-shadow` glows

## Running the Project
The application runs on port 5000 with the command:
```
NODE_ENV=development ./node_modules/.bin/tsx server/index.ts
```

## User Preferences
- Premium futuristic aesthetic with Nintendo-style influence
- Glassmorphism and neon glow effects
- Clean, minimal interface with functional depth
