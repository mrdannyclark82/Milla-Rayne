# Implementation Plan - Modularize Routes Monolith

This plan follows a Test-Driven Development (TDD) approach to refactoring the `server/routes.ts` file into a modular structure.

## Phase 1: Shared Infrastructure Extraction [checkpoint: aa9f8ae]
- [x] Task: Extract Shared Middleware and State
- [x] Task: Conductor - User Manual Verification 'Shared Infrastructure Extraction' (Protocol in workflow.md)

## Phase 2: Modular Route Migration (TDD)
- [x] Task: Migrate Auth Routes [6766f24]
- [~] Task: Migrate Chat and AI Routes
    - [ ] Write integration tests for `/api/chat`, image generation, and weather endpoints.
    - [ ] Extract logic to `server/routes/chat.routes.ts`.
    - [ ] Verify tests pass.
- [ ] Task: Migrate Agent and Task Routes
    - [ ] Write integration tests for agent management and task storage endpoints.
    - [ ] Extract logic to `server/routes/agent.routes.ts`.
    - [ ] Verify tests pass.
- [ ] Task: Migrate Media and Analysis Routes (YouTube/Video)
    - [ ] Write integration tests for YouTube analysis and video insights endpoints.
    - [ ] Extract logic to `server/routes/media.routes.ts`.
    - [ ] Verify tests pass.
- [ ] Task: Migrate Monitoring and System Routes
    - [ ] Write integration tests for health, metrics, and evolution endpoints.
    - [ ] Extract logic to `server/routes/system.routes.ts`.
    - [ ] Verify tests pass.
- [ ] Task: Conductor - User Manual Verification 'Modular Route Migration' (Protocol in workflow.md)

## Phase 3: Centralization and Cleanup
- [ ] Task: Implement Router Index and Switchover
    - [ ] Create `server/routes/index.ts` to aggregate all new route modules.
    - [ ] Update `server/index.ts` to use the new modular router instead of `registerRoutes`.
    - [ ] Ensure all existing tests pass with the new routing structure.
- [ ] Task: Final Polish and Monolith Removal
    - [ ] Verify 100% endpoint coverage.
    - [ ] Remove the now-redundant `server/routes.ts` file.
    - [ ] Update project documentation to reflect the new architecture.
- [ ] Task: Conductor - User Manual Verification 'Centralization and Cleanup' (Protocol in workflow.md)
