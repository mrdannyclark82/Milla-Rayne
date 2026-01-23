# Implementation Plan - Enhance Web UI and Core Multimodal Integration

## Phase 1: AI Model Orchestration Refactoring
- [x] Task: Analyze current AI dispatch logic b062cb1
    - [ ] Review `server/` AI service handlers to understand current prioritization.
    - [ ] Create a test case (or mock) that verifies the current order of execution.
- [ ] Task: Enforce Model Priority (OpenAI -> Anthropic -> xAI -> Mistral -> OpenRouter)
    - [ ] Write backend tests to assert the correct fallback chain.
    - [ ] Refactor the centralized AI service (likely in `server/routes.ts` or a dedicated service file) to strictly follow the `.env` priority.
    - [ ] Ensure all API keys are correctly loaded and checked before attempting a call.
- [ ] Task: Conductor - User Manual Verification 'AI Model Orchestration Refactoring' (Protocol in workflow.md)

## Phase 2: Web UI Modernization (Futuristic Minimalist)
- [ ] Task: Setup Design Tokens & Global Styles
    - [ ] Update `tailwind.config.ts` (or `.js`) to include the custom neon colors (Cyan, Purple).
    - [ ] Create global CSS utility classes for "glassmorphism" if not already present (using `backdrop-filter`, `bg-opacity`, etc.).
- [ ] Task: Refactor Main Layout Components
    - [ ] Update `DashboardLayout.tsx` to apply the dark theme and background integration.
    - [ ] Update `DashboardSidebar.tsx` to use glassmorphism styles.
- [ ] Task: Refactor Interactive Panels
    - [ ] Update `CommandBar.tsx` for the floating, high-tech look.
    - [ ] Update `ModelSelector.tsx` to match the new aesthetic.
    - [ ] Update `VideoAnalysisPanel.tsx` and other overlays.
- [ ] Task: Verify 3D Scene Integration
    - [ ] Ensure the new UI styles do not negatively impact the rendering or interactivity of the Three.js scene (`components/scene/...`).
- [ ] Task: Conductor - User Manual Verification 'Web UI Modernization' (Protocol in workflow.md)

## Phase 3: Final Integration & Polish
- [ ] Task: End-to-End Testing
    - [ ] Perform a full user session: Login -> Select Model -> Chat -> Visualize Response.
    - [ ] Verify that the UI remains responsive and the correct AI model is being used.
- [ ] Task: Documentation Update
    - [ ] Update `README.md` or `docs/` with any new UI configuration options or architectural changes.
- [ ] Task: Conductor - User Manual Verification 'Final Integration & Polish' (Protocol in workflow.md)
