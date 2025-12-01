# Milla-Rayne Gemini Context

This document provides a comprehensive overview of the Milla-Rayne project, its architecture, and development practices to guide future AI-driven development and analysis.

## Project Overview

Milla-Rayne is a sophisticated, context-aware AI assistant designed for rich, personal interaction. It is architected as a full-stack monorepo with a clear separation between the client, server, and shared components. The project is multi-platform, offering a web interface, a command-line interface (CLI), and a native Android application.

### Key Technologies

- **Backend:** Node.js, Express.js, TypeScript
- **Frontend:** React, Vite, Tailwind CSS, `three.js` for 3D scenes
- **Database:**
  - **Local Development:** SQLite (via `better-sqlite3`) for simplicity and ease of setup.
  - **Production:** PostgreSQL (configured via Drizzle ORM), indicating a robust, production-ready setup.
- **ORM:** Drizzle ORM, with the schema defined in the `shared/` directory.
- **AI Integrations:** The platform is designed to be model-agnostic, integrating with multiple providers like OpenRouter (which includes DeepSeek, Qwen, and Gemini), xAI, and OpenAI.
- **Deployment:** The application is containerized using Docker and is configured for deployment with `docker-compose`.
- **Testing:** Unit and integration tests are written with Vitest.
- **Code Quality:** Code style is maintained with ESLint and Prettier.

### Core Architecture

- **`server/`:** Contains the backend application logic, including API routes, AI service integrations, database management, and WebSocket connections.
- **`client/`:** A modern React application serving as the primary user interface. It is built with Vite and styled with Tailwind CSS.
- **`shared/`:** Holds code and type definitions (like the database schema) that are used by both the client and the server.
- **`android/`:** A native Android application providing a mobile experience.
- **`cli/`:** A TypeScript-based command-line interface for terminal-based interaction.
- **`docs/`:** Contains extensive project documentation, specifications, and guides.

## Building and Running

The project is managed as a monorepo with scripts defined in the root `package.json`.

### Initial Setup

1.  Install all dependencies from the root directory:
    ```bash
    npm install
    ```
2.  Create your local environment configuration by copying the example file:
    ```bash
    cp .env.example .env
    ```
3.  Populate the `.env` file with the necessary API keys for AI services and other configurations. The application has intelligent fallbacks if keys are not provided.

### Development

To run the web application (client and server) in development mode with hot-reloading:

```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

### Command-Line Interface (CLI)

To use the CLI, first start the development server, then run the CLI script in a separate terminal:

```bash
# Terminal 1: Start the server
npm run dev

# Terminal 2: Start the CLI
npm run cli
```

### Production

1.  **Build the application:**
    This command bundles the client and server for production.
    ```bash
    npm run build
    ```

2.  **Start the production server:**
    ```bash
    npm run start
    ```

### Docker

The project can be easily deployed using Docker.

1.  **Build and run with Docker Compose:**
    ```bash
    # Ensure your .env file is configured
    docker-compose up
    ```

2.  **Build and run manually:**
    ```bash
    docker build -t milla-rayne .
    docker run -p 5000:5000 --env-file .env milla-rayne
    ```

## Development Conventions

### Code Style

- **Linting:** ESLint is used to enforce code quality. Run the linter with:
  ```bash
  npm run lint
  ```
- **Formatting:** Prettier is used for automatic code formatting. To format the entire codebase, run:
  ```bash
  npm run format
  ```

### Testing

- The project uses Vitest for testing.
- **Run all tests:**
  ```bash
  npm test
  ```
- **Run tests with coverage:**
  ```bash
  npm run test:coverage
  ```

### Database

- **ORM:** Drizzle ORM is used to interact with the database.
- **Schema:** The single source of truth for the database schema is located at `shared/schema.ts`.
- **Local vs. Production:** The setup is hybrid. While the `drizzle.config.ts` is set for PostgreSQL (for production), the default development setup uses a simple SQLite database (`memory/milla.db`).
- **Schema Migrations:** To apply schema changes to the database (for PostgreSQL), use:
  ```bash
  npm run db:push
  ```

### Environment Configuration

- All sensitive information, such as API keys, database URLs, and feature flags, is managed through an `.env` file at the root of the project.
- **Security:** The `.env` file is explicitly ignored by Git to prevent secrets from being committed to version control.
