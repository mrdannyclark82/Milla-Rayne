# Milla Rayne AI Companion

## Overview
A full-stack AI companion application with an Express REST API backend and React frontend. Features a premium futuristic cyberpunk UI with glassmorphism effects and neon accents.

## Recent Changes (January 2026)
- **Complete UI Redesign**: Cyberpunk theme with narrow icon sidebar and responsive layout
- **Color Palette**: Pure black background, neon cyan (#22d3ee), violet (#8b5cf6), magenta accents
- **Responsive Design**: Desktop sidebar transforms to bottom navigation on mobile
- **YouTube PiP Player**: Cyberpunk-styled draggable video player with video selection
- **Google OAuth Integration**: Authentication flow for YouTube, Calendar, Gmail, Drive access
- **Proactive Features Panel**: Repository health, sandbox environments, enhancement tracking
- **PWA Support**: Manifest and mobile app capabilities for home screen installation
- **Functional Chat**: Real AI responses via /api/chat endpoint with message history and loading states
- **Sidebar Panels**: Memory, Knowledge, and Create panels fully functional
- **IDE Support**: Multi-language IDE with 20+ file type support and syntax highlighting
- **OpenAI Integration**: Replit AI Integrations installed for chat, audio, and image generation

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
