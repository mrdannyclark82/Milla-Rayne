export type ChatApiResult =
  | { ok: true; text: string; raw?: unknown }
  | { ok: false; error: string };

/**
 * POST /api/chat — same contract as Chat.tsx / sandbox.
 * Proxied by Vite to milla-rayne (default 127.0.0.1:10733).
 */
export async function sendChatMessage(
  message: string,
  opts?: {
    userId?: string;
    signal?: AbortSignal;
    model?: string;
    imageData?: string;
    station?: string;
  }
): Promise<ChatApiResult> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        userId: opts?.userId ?? 'default-user',
        model: opts?.model,
        imageData: opts?.imageData,
        station: opts?.station,
      }),
      signal: opts?.signal,
    });

    let data: Record<string, unknown> | null = null;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errText =
        (typeof data?.response === 'string' && data.response) ||
        (typeof data?.error === 'string' && data.error) ||
        response.statusText ||
        `HTTP ${response.status}`;
      return { ok: false, error: errText };
    }

    const text =
      (typeof data?.response === 'string' && data.response) ||
      (typeof data?.content === 'string' && data.content) ||
      '(empty reply)';

    return { ok: true, text, raw: data ?? undefined };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, error: 'Request cancelled' };
    }
    const msg =
      err instanceof Error ? err.message : 'Network error — chat unreachable';
    return { ok: false, error: msg };
  }
}
