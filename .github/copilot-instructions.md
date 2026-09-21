# Milla-Rayne Copilot Instructions

## Commands

Use the repository root. Node 20 is used by the pull-request workflow; the
monorepo workflow uses pnpm 9 with Node 22.

```bash
npm ci
npm run dev             # Main Express API plus Vite middleware on :5000
npm run dev:all         # Main server (:5000) and proactive server (:5001)
npm run build           # Build the Vite client and both server entry points
npm run check           # TypeScript type check
npm run lint            # ESLint for .ts and .tsx files
npm test                # Server Vitest suite
npm run test:coverage   # Server suite with 80% coverage thresholds
```

Run one server test file with:

```bash
npm test -- server/routes/chat.routes.test.ts
```

Or run one test by name:

```bash
npm test -- server/routes/chat.routes.test.ts -t "should return 400 for empty message"
```

`vitest.config.server.ts` includes only `server/**/*.test.ts` and
`server/__tests__/**/*.test.ts`. Use `pnpm install --frozen-lockfile` when
matching the `CI - Empire Checks` workflow.

For the native Android project:

```bash
cd android
./gradlew assembleDebug
./gradlew test
./gradlew connectedAndroidTest
```

## MCP

`.mcp.json` configures the workspace Playwright MCP server through
`@playwright/mcp`. Copilot-compatible editors discover this file; trust the
server before starting it because it can control a local browser.

## Architecture

- The root Vite config serves `client/`; `client/src/main.tsx` renders the
  React application, and `App.tsx` routes `/dashboard` to the dashboard with
  the chat UI as the fallback. Use `@/` for `client/src`, `@shared/` for
  shared code, and `@assets/` for `attached_assets`.
- `server/index.ts` is the main application composition root. It configures
  security/middleware, initializes memory, agent, scheduler, and feature
  services, registers API routes, then attaches Vite in development or static
  assets in production. Keep API routes registered before Vite/static
  fallbacks.
- API domains live in `server/routes/*.routes.ts`. Each exports a
  `register*Routes(app)` function, usually mounts an Express `Router` under
  `/api`, and is registered from `server/routes/index.ts`. Add new route
  modules there so they are available to the main app.
- Proactive endpoints are registered both on the main app and, when
  `npm run dev:proactive` runs, on the optional `server/proactiveServer.ts`
  process at :5001. Client proactive requests go through
  `client/src/lib/proactiveApi.ts`; `VITE_PROACTIVE_BASE_URL` switches them
  from same-origin to that separate process.
- `shared/schema.ts` is the PostgreSQL Drizzle schema plus Zod insert schemas
  and cross-layer types. Runtime storage is `server/storage.ts`, which uses
  `SqliteStorage` at `memory/milla.db`; its initialization contains the
  SQLite tables and compatibility migrations. Persistence changes must keep
  the shared schema/types and SQLite storage implementation aligned.

## Repository Conventions

- Keep provider credentials, encryption settings, and feature switches in
  `.env`; start from `.env.example` and never commit a populated `.env`.
  Feature behavior is deliberately controlled by the `ENABLE_*` flags.
- Client API helpers have different URL contracts: `apiRequest()` in
  `client/src/lib/queryClient.ts` prepends `/api`, while direct `fetch` calls
  use full `/api/...` paths. Do not pass an already prefixed path to
  `apiRequest`.
- Route tests construct a minimal Express app, add `express.json()` and
  `cookieParser()` when needed, register the specific route module, and use
  Supertest. Mock service boundaries with Vitest rather than initializing the
  full application, which starts many feature services.
- Server startup is guarded by `NODE_ENV !== 'test'`; import `initApp` or
  route registrars in tests instead of launching the listener.
- Formatting is Prettier with single quotes, semicolons, trailing commas, a
  two-space indent, and an 80-character print width. TypeScript is strict;
  root type checking excludes test files.
- Use Conventional Commit prefixes: `feat:`, `fix:`, `docs:`, `chore:`,
  `refactor:`, `test:`, and `perf:`.

## CLI and Android

- `npm run cli` runs `cli/milla-cli.ts` against the API server. Start
  `npm run dev` first; set `API_URL` in the root `.env` to target another
  server.
- `android/` is the primary Kotlin/Jetpack Compose app. Its settings
  repository defaults the emulator backend to `http://10.0.2.2:5000/`; use a
  LAN-reachable host for a physical device.
- `android-app/` is a separate CYBER Android Studio project with its own
  Compose UI and fallback provider chain. Treat it as independent from
  `android/`; build it in Android Studio or generate its wrapper first as its
  README describes.
- Android scene code in `android/` is a Compose integration module with
  feature flags stored in `SharedPreferences`; the default remains disabled.

## Containers and Deployment

- The Dockerfile builds the Vite client and both Node server bundles, then
  runs `dist/index.js` as a non-root user on port 5000. The proactive server
  is not started by the image command.
- `docker compose up --build` starts only that main-server container. Supply
  production API keys and feature flags through the Compose service
  environment; the checked-in `.env.example` is a template, not runtime
  configuration.
- `.github/workflows/deploy.yml` builds staging and production artifacts on
  Node 20, but its deployment and smoke-test commands are placeholders. Do
  not treat a successful workflow run as an external deployment until a
  target-specific deploy command is configured.
