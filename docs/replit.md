# Overview

This is a full-stack web application for "Milla," an advanced AI assistant with adaptive personality modes. The application is built using React/TypeScript for the frontend and Express.js for the backend, featuring a chat interface where users can interact with the AI assistant. Milla can dynamically adjust her communication style across four personality modes: Coach, Empathetic Listener, Strategic Advisor, and Creative Partner.

The application follows a monorepo structure with shared schemas and type definitions, implements a modern UI using shadcn/ui components, and includes a comprehensive design system with dark theme support.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Framework**: shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Design Pattern**: Component-based architecture with reusable UI components

The frontend implements a chat interface with a sidebar displaying Milla's personality system status. The architecture emphasizes type safety with TypeScript and maintains consistent styling through a centralized design system.

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful API endpoints under `/api` prefix
- **Data Storage**: In-memory storage implementation with interface abstraction
- **Development**: Hot-reload development server with Vite integration
- **Build Process**: ESBuild for production bundling

The backend uses a storage interface pattern (`IStorage`) allowing for easy switching between storage implementations. Currently implements `MemStorage` for development with the structure to support database integration.

## Core AI System
- **Personality Matrix**: Adaptive personality system with four distinct modes
- **Context Switching**: Dynamic personality mode switching based on conversation context
- **Response Generation**: Placeholder AI response generation with personality-aware responses
- **Ethical Framework**: Built-in ethical guidelines and system boundaries

The AI system is designed with a modular personality matrix allowing for different communication styles and approaches based on user needs.

## Database Schema Design
- **Users Table**: User authentication and profile management
- **Messages Table**: Chat history with role-based message types and personality mode tracking
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **Schema Validation**: Zod schemas for runtime type validation

The database design supports user sessions, message history, and personality mode tracking for conversation continuity.

## Development Environment
- **Hot Reload**: Vite development server with Express integration
- **Type Safety**: Shared TypeScript definitions across frontend and backend
- **Path Aliases**: Centralized import paths for better code organization
- **Development Tools**: Runtime error overlay and development banner integration

# External Dependencies

## Database & ORM
- **Neon Database**: Serverless PostgreSQL database (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe SQL toolkit with PostgreSQL support
- **Session Storage**: PostgreSQL session store (connect-pg-simple)

## UI & Styling
- **Radix UI**: Comprehensive component primitives for accessible UI
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library
- **Font Awesome**: Additional icon support

## State Management & HTTP
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation library

## Build Tools & Development
- **Vite**: Frontend build tool and development server
- **ESBuild**: JavaScript bundler for production
- **TypeScript**: Static type checking
- **PostCSS**: CSS processing with Tailwind

## Utilities & Enhancement
- **date-fns**: Date manipulation library
- **clsx & class-variance-authority**: Conditional className utilities
- **Embla Carousel**: Carousel component library
- **nanoid**: Unique ID generation