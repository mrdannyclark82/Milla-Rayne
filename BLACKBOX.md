# Milla-Rayne Project Overview

## Project Overview
Milla-Rayne is a context-aware AI assistant platform designed as a devoted digital companion. It integrates multiple AI models (e.g., Gemini, Mistral, OpenAI, xAI Grok, Anthropic) for poly-model synthesis, offering real-time multimodal interactions including voice, visual recognition, and adaptive scenes. The architecture is hybrid, decentralized, and edge-ready, with features like enhanced memory (SQLite-based with optional AES-256-GCM encryption), repository analysis, predictive updates, proactive self-improvement, and various specialized agents (coding, image generation, enhancement search, calendar, tasks, email, YouTube).

The platform supports web (React frontend), mobile (Android app), CLI, and browser extension interfaces. Key capabilities include dynamic 3D scenes with Three.js, voice interaction via ElevenLabs and other providers, YouTube integration with active listening, sandbox for code execution, creative studio, shared notepad, and Fara task automation.

### Main Technologies
- **Frontend**: React (v19) with Vite for building, Tailwind CSS (v4) for styling, Radix UI for components, Three.js for 3D scenes, Framer Motion for animations, React Query for data fetching.
- **Backend**: Node.js with Express.js (v5), TypeScript, Drizzle ORM (supports PostgreSQL and SQLite).
- **Database**: SQLite for memory with optional AES-256-GCM encryption; PostgreSQL configurable via Drizzle.
- **AI Integrations**: OpenAI (v6), Anthropic, Mistral, Google Generative AI, Hugging Face, xAI Grok via SDKs; supports poly-model dispatching.
- **Voice & Audio**: ElevenLabs for TTS, Web Speech API for STT, TensorFlow.js for visual recognition (COCO-SSD model).
- **Other**: Docker for containerization, Vitest for testing, ESLint and Prettier for linting/formatting, Node-Cron for scheduling, WebSockets for real-time (sensor data, etc.), YouTube Transcript and ytdl-core for video handling.
- **Additional Components**: Android app (Material Design 3), CLI interface (tsx), browser extension, agents for autonomous tasks.

### Architecture
- **Client** (`client/`): React-based adaptive frontend with dynamic scenes (SceneProvider, SceneManager), voice controls (VoiceService), chat interface, YouTube player with active listening, sandbox, creative studio, shared notepad, and UI overlays (XAI transparency, dynamic features).
- **Server** (`server/`): Express backend handling API routes, AI dispatching, memory management (MemoryCore), self-evolution, proactive services (mood background, user tasks, enhancement tasks, daily suggestions, AI updates, user analytics, sandbox environment, feature discovery, token incentives, proactive repository manager, automated PRs, user surveys, performance profiling), agent controller with registered agents.
- **Shared** (`shared/`): Utilities, types, and schema (e.g., scene types, UI commands).
- **Memory** (`memory/`): Encrypted SQLite database for session tracking, usage analytics, and persistent storage.
- **Android** (`android/`): Native app for edge processing, sensor data via WebSockets.
- **CLI** (`cli/`): Terminal-based chat interface.
- **Browser Extension** (`browser_extension/`): Likely for web integrations.
- The system initializes services like mood background, user tasks, self-evolution, and agents at startup. Uses path aliases (@/* for client/src, @shared/* for shared).

## Building and Running
- **Prerequisites**: Node.js LTS (18+), Android Studio for mobile. Copy `.env.example` to `.env` and add API keys (e.g., for AI providers like OPENAI_API_KEY, ANTHROPIC_API_KEY, MEMORY_KEY for encryption).
- **Install Dependencies**: `npm install` (runs postinstall to rebuild better-sqlite3).
- **Development Server**: `npm run dev` (starts Node.js server with tsx on port 5000; Vite dev server for client on 5173). Open http://localhost:5000.
- **Full Development**: `npm run dev:full` (same as dev).
- **CLI**: `npm run cli` (after starting server).
- **Android**: Open `android/` in Android Studio, configure server URL (e.g., http://10.0.2.2:5000 for emulator), run on device/emulator.
- **Build**: `npm run build` (Vite for client + esbuild for server; outputs to build/ and dist/).
- **Production Start**: `npm run start` (runs built server on PORT env var, default 5000).
- **Docker**: `docker-compose up` (uses docker-compose.yml and Dockerfile) or pull from `ghcr.io/mrdannyclark82/milla-rayne:latest`.
- **Database**: `npm run db:push` (Drizzle migrations for PostgreSQL); `npm run migrate:memory` for SQLite migration; `npm run migrate:encrypt` for encryption setup.

## Development Conventions
- **Code Style**: TypeScript with strict typing (avoid `any` where possible; tsconfig.json enforces strict mode). Keep functions small and focused. Use path aliases (@/*, @shared/*). Follow Conventional Commits for messages (e.g., `feat: add new agent`, `fix: resolve CORS issue`).
- **Linting and Formatting**: Run `npm run lint` (ESLint with React/TypeScript plugins; config in eslint.config.js, lenient on some rules) and `npm run format` (Prettier; config in prettier.config.cjs) before committing/pushing.
- **Testing**: `npm test` (Vitest; config in vitest.config.server.ts); `npm run test:watch` for watching; `npm run test:coverage` for coverage; `npm run test:ui` for UI mode. Include tests in PRs where feasible (tests in __tests__ or alongside components).
- **Type Checking**: `npm run check` (tsc; noEmit true in tsconfig.json).
- **Documentation**: `npm run docs:generate` (Typedoc; config in typedoc.json); `npm run docs:watch` for live updates. Update README.md and docs/ as needed.
- **Security**: Use `.env` for secrets (gitignore'd; never commit). Enable memory encryption with MEMORY_KEY. Strict CORS (trusted origins only), rate limiting (100 req/15min), tracing (X-Trace-Id). Report vulnerabilities via SECURITY.md or email.
- **Contributions**: Fork repo, create feature branch (e.g., feat/new-feature), add tests/docs, submit PR with description. Follow Contributor Covenant in CODE_OF_CONDUCT.md.
- **Best Practices**: Handle errors gracefully (try-catch in async ops), implement rate limiting, use tracing for requests, ensure CORS only for trusted origins (localhost:5000, 5173). For AI integrations, use secure dispatch with fallbacks. Mobile sensor data via WebSockets. Avoid global mutations; use React hooks/context for state.

This BLACKBOX.md serves as instructional context for future interactions with the Milla-Rayne project.