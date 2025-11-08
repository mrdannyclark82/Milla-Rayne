# Agent To Do — Design & Implementation Plan

This file captures the concrete plan we discussed: convert the enhancement/task subsystem into a cooperative multi-agent system where Milla is the supervisor agent and domain-specific agents (YouTube, Email, Calendar, Git, Scene, Visual, etc.) perform tool-calls and implement tasks. It includes architecture, data shapes, safety/permissions, example tasks, and an incremental rollout checklist.

## Goals

- Make agents responsible for executing discrete tooling operations (YouTube lookup, send email, create calendar events, scaffold code, run tests).
- Keep Milla as the supervisor agent: she owns context, assigns tasks to domain agents, monitors progress, and composes final responses.
- Retain human-in-the-loop review for high-risk changes; enable fully automated small-scope scaffolding (opt-in).

## High-level Architecture

- Supervisor Agent: `MillaAgent`
  - Maintains conversation & global context (memory core).
  - Decides which sub-agent(s) to call and composes task instructions.
  - Aggregates results, performs ethical/privacy validation, and responds to user.

- Domain Agents (examples):
  - `YouTubeAgent` — search, analyze, fetch transcripts, enqueue playback instructions.
  - `EmailAgent` — draft/send emails, manage inbox metadata, attachments.
  - `CalendarAgent` — create/update events, suggest times, handle invites.
  - `GitAgent` — create branches, write scaffold files, run tests, open PRs.
  - `SceneAgent` / `VisualAgent` — handle scenery assets, upload images, create visual memory.
  - `TaskAgent` / `WorkerAgent` — execute long-running task steps (scaffolding, CI runs).

- Shared Infrastructure:
  - Task queue (Redis, in-memory or DB-backed queue) for reliable work dispatch and retries.
  - Agent registry & capability manifest (what each agent can do, required perms).
  - Secure credential vault (local `server/config` or Vaul/secret manager) with fine-grained permissions.
  - Audit log + provenance store (who/what changed what and when).

## Task message shape (JSON)

Example task object Milla sends to a domain agent:

```json
{
  "taskId": "task-169",
  "supervisor": "MillaAgent",
  "agent": "CalendarAgent",
  "action": "create_event",
  "payload": {
    "title": "Call with Alex",
    "start": "2025-12-02T15:00:00-06:00",
    "duration_minutes": 30,
    "attendees": ["alex@example.com"]
  },
  "metadata": { "safety_level": "low", "requireConfirmation": true }
}
```

Agents respond with a standard result envelope including success, logs, and optional artifacts (URLs, file refs, message IDs).

## Tool-calling responsibilities

- Domain agents own integration details and credentials. Examples:
  - `YouTubeAgent` uses `server/youtubeService.ts` to fetch video metadata and transcripts.
  - `EmailAgent` wraps SMTP or provider APIs (SendGrid, Gmail OAuth) and exposes `draft`, `send`, `schedule` actions.
  - `CalendarAgent` wraps Google Calendar / CalDAV for `create`, `update`, `suggest-times`.
  - `GitAgent` uses GitHub token to create branches, commit scaffold files, run CI checks, open PR draft.

Supervisor (Milla) never directly calls external tools — she delegates and supervises to preserve separation of concerns and to centralize privacy/ethics checks.

## Privacy, Safety & Approval Flow

- Each task carries a `safety_level` (low/medium/high). Examples:
  - Low: create a local scaffold file, add a comment. Can be auto-approved (configurable).
  - Medium: send an email on user's behalf — requires explicit user consent or one-time token.
  - High: push to a protected repo branch and merge — always require human approval.

- Milla validates task metadata and checks the `ETHICAL_FRAMEWORK` before assigning high-risk tasks.

## Persistence & Observability

- Tasks persisted in `memory/enhancement_tasks.json` (short-term) and a long-term audit log (append-only).
- Expose `/api/agent/tasks` endpoints to list, inspect, retry, and cancel tasks.

## Implementation Plan (incremental)

1. Add agent orchestration layer and registry
   - Create `server/agents/registry.ts` with capability manifests and a simple dispatcher.
   - Implement a basic TaskQueue (in-memory) and worker runner `server/agents/worker.ts`.

2. Implement Domain Agents (phase 1)
   - `YouTubeAgent` (wrap existing `server/youtubeService.ts`).
   - `CalendarAgent` and `EmailAgent` skeletons (use existing OAuth hooks if present).
   - Each agent implements `handleTask(task)` and returns standardized result.

3. Implement `MillaAgent` supervisor
   - Uses `createTask` API to enqueue tasks, applies persona-driven validations (via `openaiService.createSystemPrompt`), and monitors progress.

4. Add safety gate + approval UI
   - New fields: `requireUserApproval`, `approvalToken`, `auditTrail`.

5. Wire GitAgent scaffolding (safe mode)
   - Implement `scaffold` action to write files into `scaffold/` folder or branch and create a draft PR.

6. Tests & rollout
   - Unit tests for agents, integration tests for task flows, e2e tests for a simple scenario (create calendar event and send email confirmation).

## Example flows

- Compose a YouTube analysis:
  1. MillaAgent recognizes `analyze this video` → creates Task for YouTubeAgent (action: `analyze_video`).

 2. YouTubeAgent downloads transcript, stores artifacts, returns summary.
 3. MillaAgent reads summary, updates memory, responds to user.

- Automated scaffold PR (safe default)
  1. User requests "Add voice chat scaffold".

 2. MillaAgent creates a `scaffold` task for GitAgent.
 3. GitAgent writes placeholder files under `scaffold/voice-chat/<task-id>/`, runs `npm run check` inside a sandbox, creates draft PR (no auto-merge).
 4. MillaAgent notifies user with PR link and suggested next steps.

## End-to-end checklist (developer)

- [ ] Add `server/agents/registry.ts` and `server/agents/worker.ts`.
- [ ] Implement `YouTubeAgent`, `EmailAgent`, `CalendarAgent` wrappers.
- [ ] Implement `MillaAgent` supervisor APIs and CLI hooks.
- [ ] Add `memory/agent_tasks.json` persistence and audit logs.
- [ ] Add approval UI route and endpoints `/api/agent/tasks`.
- [ ] Add tests for each agent and the supervisor flow.

## Next steps for me

If you want, I can implement the first pieces: `agents/registry.ts`, `agents/worker.ts`, and `YouTubeAgent` (wrap existing youtubeService) and add `/api/agent/tasks` endpoints. Tell me to proceed and I'll implement and run the minimal integration tests.

---
Generated: a recommended plan to convert enhancement tasks into a coordinated agent system with Milla as supervisor and domain-specific agents for tool-calls. This keeps privacy, observability, and human approval central while enabling safe automation.
