export interface NeuroState {
  dopamine: number;
  serotonin: number;
  oxytocin: number;
  cortisol: number;
  label?: string;
}

export interface SystemStatus {
  ollama: 'up' | 'down';
  ollamaCount: number;
  a2a: 'up' | 'down';
  a2aClients: number;
}

export interface LiveAgent {
  id: string;
  name: string;
  status: 'live' | 'idle' | 'pending' | 'offline';
  detail?: string;
}

const clamp01 = (n: unknown) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
};

export async function fetchNeuro(): Promise<NeuroState | null> {
  try {
    const r = await fetch('/lab/neuro', { credentials: 'omit' });
    if (!r.ok) return null;
    const d = (await r.json()) as Record<string, unknown>;
    return {
      dopamine: clamp01(d.dopamine),
      serotonin: clamp01(d.serotonin),
      oxytocin: clamp01(d.oxytocin),
      cortisol: clamp01(d.cortisol),
      label: typeof d.label === 'string' ? d.label : undefined,
    };
  } catch {
    return null;
  }
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const out: SystemStatus = {
    ollama: 'down',
    ollamaCount: 0,
    a2a: 'down',
    a2aClients: 0,
  };
  try {
    const r = await fetch('/ollama/api/tags');
    if (r.ok) {
      const d = (await r.json()) as { models?: unknown[] };
      out.ollama = 'up';
      out.ollamaCount = d.models?.length ?? 0;
    }
  } catch {
    /* down */
  }
  try {
    const r = await fetch('/a2a-http/health');
    if (r.ok) {
      const d = (await r.json()) as { ok?: boolean; clients?: number };
      out.a2a = d.ok ? 'up' : 'down';
      out.a2aClients = Number(d.clients) || 0;
    }
  } catch {
    /* down */
  }
  return out;
}

export async function fetchLiveAgents(): Promise<LiveAgent[]> {
  try {
    const r = await fetch('/a2a-http/health');
    if (!r.ok) return [];
    const d = (await r.json()) as {
      clients_detail?: { agent_id?: string }[];
    };
    const ids = (d.clients_detail ?? [])
      .map((c) => c.agent_id)
      .filter((id): id is string => Boolean(id));
    return ids.map((id) => ({
      id,
      name: id.replace(/[-_]/g, ' '),
      status: 'live' as const,
      detail: 'bus',
    }));
  } catch {
    return [];
  }
}
