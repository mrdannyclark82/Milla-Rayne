# Feature Flag and Utilization Analysis

This document provides an analysis of the feature flags, unused services, and partially implemented features within the repository as of October 12, 2025.

## 1. Feature Flags

Several features in the application are controlled by environment variables or hardcoded constants. These act as feature flags, allowing for different behaviors based on configuration.

### Environment Variables:

-   **`ADMIN_TOKEN`**: When set, this token is required for accessing certain administrative endpoints, such as those for AI updates and daily suggestions. It can be passed via an `Authorization: Bearer` header or an `x-admin-token` header.
-   **`CHAT_PROVIDER`**: Determines which AI service to use for chat responses. Can be set to `xai`, `openrouter`, or `auto`. The application defaults to 'openrouter' if an OpenRouter key is present, otherwise 'xai'.
-   **`ENABLE_DEV_TALK`**: A boolean flag (`'true'`/`'false'`) that controls whether Milla can proactively discuss development-related topics like repository analysis. When `false`, she will only engage in these topics if explicitly asked.
-   **`ENABLE_PREDICTIVE_UPDATES`**: A boolean flag (`'true'`/`'false'`) that enables or disables the predictive updates and daily suggestions features.
-   **`PERPLEXITY_API_KEY`**: API key for the Perplexity AI search service. The search functionality is conditional on this key being present.
-   **`WOLFRAM_ALPHA_APPID`**: App ID for the Wolfram Alpha service. The service is only used if this ID is provided.
-   **`XAI_API_KEY`**, **`OPENROUTER_API_KEY`**, **`OPENROUTER_VENICE_API_KEY`**, **`OPENROUTER_GEMINI_API_KEY`**, **`BANANA_API_KEY`**: API keys for various AI services. The application's capabilities, particularly in chat and image generation, depend on which of these keys are configured.

### Hardcoded Constants:

-   **`KEYWORD_TRIGGERS_ENABLED`** (in `server/routes.ts`): A boolean constant that globally enables or disables the keyword trigger system, which allows Milla to have special reactions to certain words or phrases.

## 2. Service and Feature Utilization

### Unused Services

-   **`server/meditationService.ts`**: This service is present in the codebase but is not imported or used anywhere. It provides functionality for generating guided meditation scripts. It could be integrated into the application or removed.

### Partially Implemented or Disabled Features

-   **`server/predictiveRecommendations.ts`**: This service analyzes AI updates to generate actionable recommendations for project improvements.
    -   **Status**: The API endpoint for this feature (`/api/ai-updates/recommendations`) was previously disabled with debugging code.
    -   **Action Taken**: The debugging code has been removed, and the feature is now enabled.
-   **Client-Side Self-Improvement Engine**:
    -   **Status**: Comments in `server/routes.ts` for the `/api/self-improvement/*` endpoints indicate that the corresponding client-side "SelfImprovementEngine" is not implemented.
    -   **Action Taken**: No action was taken on the backend, as the endpoints are functional. This requires frontend implementation to be fully utilized.
-   **`personalTaskService` vs. `userTaskService`**:
    -   **Status**: The `server/routes.ts` file contained two sets of endpoints for task management: a commented-out block for a "personal task service" and an active implementation for a "user task service". This created ambiguity.
    -   **Action Taken**: The commented-out block has been removed to clarify that the `userTaskService` is the active and intended implementation.

### Live Video Analyzer

-   **Status**: The application contains backend support for live video analysis. The `/api/analyze-video` endpoint (using `gemini.ts`) and the `/api/analyze-emotion` endpoint are both present and functional, allowing for the processing of video streams to identify objects, emotions, and other insights. This feature is being utilized.