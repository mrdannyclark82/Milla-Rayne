# Milla Rayne - AI Companion Development Guide

This document provides a comprehensive overview of the Milla Rayne project, its architecture, and development practices to guide future interactions and development.

## Project Overview

Milla Rayne is a virtual AI companion with an adaptive personality. It features a modern user interface, a persistent memory system, and voice interaction capabilities. The project is built as a full-stack TypeScript application with a client-server architecture.

### Key Technologies

*   **Backend:** Node.js, Express.js, TypeScript
*   **Frontend:** React, Vite, Tailwind CSS
*   **Database:** SQLite, managed with Drizzle ORM
*   **AI/ML:** Integrations with multiple AI services including OpenRouter (DeepSeek, Qwen, Gemini), xAI, and OpenAI. It also uses TensorFlow.js for client-side visual recognition.
*   **Testing:** Vitest for unit and integration tests.
*   **Linting & Formatting:** ESLint and Prettier.

### Core Features

*   **AI Companion:** A personality-driven AI assistant for conversation.
*   **Persistent Memory:** Uses an SQLite database to remember past conversations and user details, with support for AES-256-GCM encryption.
*   **Voice Interaction:** Supports Text-to-Speech (TTS) and Speech-to-Text (STT) using various providers.
*   **Adaptive Scenes:** Dynamically changes UI backgrounds based on conversational context.
*   **Repository Analysis:** Can analyze GitHub repositories to provide improvement suggestions and even create Pull Requests.
*   **Predictive Updates:** Monitors AI news and suggests relevant feature updates for the project itself.
*   **Self-Evolution:** Contains services for self-improvement and task management.

## Building and Running

The project uses `npm` for package management and running scripts.

### Initial Setup

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Create the environment configuration file by copying the example:
    ```bash
    cp .env.example .env
    ```
3.  Fill in the `.env` file with the necessary API keys for AI services, database encryption, and GitHub. The application has fallback mechanisms if keys are not provided.
4.  If you have existing data in `memory/memories.txt`, migrate it to the SQLite database:
    ```bash
    npm run migrate:memory
    ```

### Development

To run the application in development mode with hot-reloading:

```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

### Production

To build and run the application in production mode:

1.  Build the client and server:
    ```bash
    npm run build
    ```
2.  Start the production server:
    ```bash
    npm run start
    ```

### Testing and Code Quality

*   **Run tests:**
    ```bash
    npm test
    ```
*   **Lint files:**
    ```bash
    npm run lint
    ```
*   **Format files:**
    ```bash
    npm run format
    ```

### Database

The project uses Drizzle ORM for database management.

*   To apply schema changes to the database:
    ```bash
    npm run db:push
    ```

## Development Conventions

### Code Style

Code style is enforced by ESLint and Prettier. Please run `npm run format` and `npm run lint` before committing changes.

### File Structure

*   `server/`: Contains all backend source code.
    *   `server/index.ts`: The main entry point for the server.
    *   `server/routes.ts`: Defines the API routes.
    *   `server/*Service.ts`: Core logic for different features (e.g., `memoryService.ts`, `voiceService.ts`).
*   `client/`: Contains all frontend source code (React + Vite).
    *   `client/src/main.tsx`: The main entry point for the React application.
*   `shared/`: Contains code and types shared between the client and server.
*   `memory/`: Contains the SQLite database (`milla.db`) and other memory-related files.
*   `docs/`: Contains detailed documentation and specifications for various features.
*   `.env`: Environment variables for configuration (API keys, feature flags). This file is ignored by git.

### API

The backend exposes a RESTful API under the `/api/` path. The routes are defined in `server/routes.ts`. The server is responsible for handling all AI service calls, database interactions, and business logic.
