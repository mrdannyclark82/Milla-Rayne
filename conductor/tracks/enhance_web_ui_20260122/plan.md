# Implementation Plan - Enhance Web UI and Core Multimodal Integration

## Phase 1: AI Model Orchestration Refactoring
- [x] Task: Analyze current AI dispatch logic b062cb1
    - [ ] Review `server/` AI service handlers to understand current prioritization.
    - [ ] Create a test case (or mock) that verifies the current order of execution.
- [x] Task: Enforce Model Priority (OpenAI -> Anthropic -> xAI -> Mistral -> OpenRouter) 6da57ff
    - [ ] Write backend tests to assert the correct fallback chain.
    - [ ] Refactor the centralized AI service (likely in `server/routes.ts` or a dedicated service file) to strictly follow the `.env` priority.
    - [ ] Ensure all API keys are correctly loaded and checked before attempting a call.
- [x] Task: Conductor - User Manual Verification 'AI Model Orchestration Refactoring' (Protocol in workflow.md) de900b4

## Phase 2: Web UI Modernization (Futuristic Minimalist)
- [x] Task: Setup Design Tokens & Global Styles c2bc076
    - [ ] Update `tailwind.config.ts` (or `.js`) to include the custom neon colors (Cyan, Purple).
    - [ ] Create global CSS utility classes for "glassmorphism" if not already present (using `backdrop-filter`, `bg-opacity`, etc.).
- [x] Task: Refactor Main Layout Components 88615f6
    - [ ] Update `DashboardLayout.tsx` to apply the dark theme and background integration.
    - [ ] Update `DashboardSidebar.tsx` to use glassmorphism styles.
- [x] Task: Refactor Interactive Panels f86c9fd
    - [ ] Update `CommandBar.tsx` for the floating, high-tech look.
    - [ ] Update `ModelSelector.tsx` to match the new aesthetic.
    - [ ] Update `VideoAnalysisPanel.tsx` and other overlays.
- [x] Task: Verify 3D Scene Integration 69300d3
    - [ ] Ensure the new UI styles do not negatively impact the rendering or interactivity of the Three.js scene (`components/scene/...`).
- [x] Task: Conductor - User Manual Verification 'Web UI Modernization' (Protocol in workflow.md) 8fcdd77

## Phase 3: Final Integration & Polish
- [x] Task: End-to-End Testing 18edfcf
    - [ ] Perform a full user session: Login -> Select Model -> Chat -> Visualize Response.
    - [ ] Verify that the UI remains responsive and the correct AI model is being used.
- [x] Task: Documentation Update d6ec05f
    - [ ] Update `README.md` or `docs/` with any new UI configuration options or architectural changes.
- [x] Task: Conductor - User Manual Verification 'Final Integration & Polish' (Protocol in workflow.md) 471d6ca
