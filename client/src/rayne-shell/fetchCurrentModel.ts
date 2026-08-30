import type { ModelChoice } from './types';

/** Canonical ids from Milla-Rayne aiModelPreferences — keep in sync with server. */
export const CANONICAL_MODELS: ModelChoice[] = [
  { id: 'xai', label: 'cloud · xai / grok', tier: 'cloud' },
  { id: 'gemini', label: 'cloud · gemini', tier: 'cloud' },
  { id: 'minimax', label: 'cloud · minimax', tier: 'cloud' },
  { id: 'venice', label: 'cloud · venice', tier: 'cloud' },
  { id: 'deepseek', label: 'cloud · deepseek', tier: 'cloud' },
  { id: 'ollama-gemma', label: 'local · ollama-gemma', tier: 'local' },
  { id: 'local-gemma', label: 'local · local-gemma', tier: 'local' },
];

/**
 * GET /api/ai-model/current — works without auth (returns server default).
 * No POST: set without session is a no-op persist; write path is later.
 */
export async function fetchCurrentModel(
  models: ModelChoice[] = CANONICAL_MODELS,
  fallback: ModelChoice = models[0]
): Promise<ModelChoice> {
  try {
    const r = await fetch('/api/ai-model/current', { credentials: 'include' });
    const d = (await r.json()) as { success?: boolean; model?: string };
    const id = d?.model;
    if (!id) return fallback;
    const hit = models.find((m) => m.id === id);
    if (hit) return hit;
    const local = /ollama|local|gemma/i.test(id);
    return {
      id,
      label: `${local ? 'local' : 'cloud'} · ${id}`,
      tier: local ? 'local' : 'cloud',
    };
  } catch {
    return fallback;
  }
}
