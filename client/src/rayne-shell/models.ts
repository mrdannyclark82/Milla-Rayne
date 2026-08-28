import type { ModelChoice } from './types';

export const CLOUD_MODELS: ModelChoice[] = [
  { id: 'xai', label: 'cloud · xai / grok', tier: 'cloud' },
  { id: 'gemini', label: 'cloud · gemini', tier: 'cloud' },
  { id: 'minimax', label: 'cloud · minimax', tier: 'cloud' },
  { id: 'venice', label: 'cloud · venice', tier: 'cloud' },
  { id: 'deepseek', label: 'cloud · deepseek', tier: 'cloud' },
];

const PREFERRED_LOCAL = [
  'milla-rayne:latest',
  'mrdannyclark82/milla-rayne:latest',
  'devmilla:latest',
];

export function shortOllamaLabel(name: string): string {
  const n = name.replace(/^hf\.co\//, '');
  if (n.length <= 42) return n;
  return `${n.slice(0, 20)}…${n.slice(-18)}`;
}

export function mergeModelLists(
  ollamaNames: string[],
  cloud: ModelChoice[] = CLOUD_MODELS
): ModelChoice[] {
  const seen = new Set<string>();
  const local: ModelChoice[] = [];
  for (const name of ollamaNames) {
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const embed = /embed/i.test(name);
    local.push({
      id: name,
      label: `${embed ? 'embed' : 'local'} · ${shortOllamaLabel(name)}`,
      tier: 'local',
    });
  }
  local.sort((a, b) => {
    const pa = PREFERRED_LOCAL.indexOf(a.id);
    const pb = PREFERRED_LOCAL.indexOf(b.id);
    if (pa !== -1 || pb !== -1) {
      return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
    }
    if (a.tier !== b.tier) return a.tier === 'local' ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
  return [...local, ...cloud];
}

export function pickDefaultModel(models: ModelChoice[]): ModelChoice {
  for (const id of PREFERRED_LOCAL) {
    const hit = models.find((m) => m.id === id);
    if (hit) return hit;
  }
  const local = models.find((m) => m.tier === 'local' && !/embed/i.test(m.id));
  return local || models[0];
}

export async function fetchOllamaNames(): Promise<string[]> {
  try {
    const r = await fetch('/ollama/api/tags', { credentials: 'omit' });
    if (!r.ok) return [];
    const d = (await r.json()) as { models?: { name?: string }[] };
    return (d.models ?? [])
      .map((m) => m.name)
      .filter((n): n is string => Boolean(n));
  } catch {
    return [];
  }
}

export async function persistModel(id: string): Promise<void> {
  try {
    await fetch('/api/ai-model/set', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: id }),
    });
  } catch {
    /* local-only picker still works */
  }
}
