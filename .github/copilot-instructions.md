# Project: Virtual AI Assistant

## High-Level Project Overview
This project is a virtual AI assistant designed to have an adaptive personality. The assistant's persona, responses, and behavior change over time based on user interactions.

## Technical Stack
- **Server-Side**: The backend is written entirely in **TypeScript (.ts)**.
- **Client-Side**: The frontend is built using **React with TypeScript (.tsx)**.
- **Data Storage**: Conversations and memory are stored in a **`memories.json`** file. This is a temporary solution for local development. We plan to migrate to a more robust database solution as the project grows.

## File and Folder Structure
- `/src/server/`: Contains all server-side logic and API endpoints.
- `/src/client/`: Contains all client-side React components and styles.
- `/src/data/`: This is where the `memories.json` file is located.
- `/src/types/`: All custom TypeScript type definitions and interfaces are stored here to keep the code clean.

## Coding Style and Conventions
- **Naming**:
    - **Files**: Use `kebab-case` (e.g., `chat-window.tsx`).
    - **React Components**: Use `PascalCase` (e.g., `ChatWindow`).
    - **Variables & Functions**: Use `camelCase` (e.g., `handleUserMessage`).
    - **CSS Classes**: If we add styling, use `kebab-case`.
- **Formatting**:
    - Use `2 spaces` for indentation.
    - Add a semicolon at the end of each line (`;`).
- **Best Practices**:
    - **TypeScript**: Always use explicit type annotations for variables, function arguments, and return values. For example, prefer `function greet(name: string): string` over `function greet(name)`.
    - **Comments**: Add inline comments for complex or non-obvious logic.
    - **Documentation**: Write JSDoc comments for all major functions, interfaces, and React components. Explain what they do, their parameters, and what they return. This is especially helpful for a new developer to understand the codebase.
    - **Modularity**: Break down large components or functions into smaller, single-purpose pieces.

## Future Development & Architectural Decisions
- **Database Migration**: We need to move from `memories.json` to a proper database. The ideal solution will be able to handle structured conversation data and scale with many users. Copilot should be ready to help with this transition by suggesting code for database setup and queries.
- **Scalability**: All code should be written with future scalability in mind. Consider how the code would work with thousands of users.
- **Error Handling**: Include basic `try/catch` blocks and clear error messages in all server-side API endpoints.
