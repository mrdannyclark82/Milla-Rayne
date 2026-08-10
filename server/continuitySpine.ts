/**
 * Continuity Spine writer — append conversation turns to shared_chat.jsonl
 * so core_os Memory Agent can ingest (allowlisted source: milla-rayne).
 * Fail-open: never break chat if spine write fails.
 */
import fs from 'fs';
import path from 'path';

const SPINE_PATH = path.join(
  process.env.HOME || '/home/milla',
  'memory',
  'shared_chat.jsonl'
);

export function writeToContinuitySpine(params: {
  role: 'user' | 'assistant' | 'system';
  content: string;
  source?: string;
}): void {
  try {
    const content = (params.content || '').trim();
    if (!content) return;
    // Skip huge blobs / tool dumps
    if (content.length > 12000) return;
    if (content.startsWith('{"stdout"') || content.startsWith('{"stderr"')) return;

    const line =
      JSON.stringify({
        role: params.role,
        content,
        source: params.source || 'milla-rayne',
        timestamp: new Date().toISOString(),
      }) + '\n';
    fs.appendFileSync(SPINE_PATH, line, { encoding: 'utf8' });
  } catch {
    /* spine optional */
  }
}

/** Write last user message + assistant reply from a messages array */
export function spineFromChatMessages(
  messages: Array<{ role?: string; content?: string }>,
  assistantContent: string
): void {
  try {
    const lastUser = [...(messages || [])]
      .reverse()
      .find((m) => m.role === 'user' && m.content);
    if (lastUser?.content) {
      writeToContinuitySpine({ role: 'user', content: String(lastUser.content) });
    }
    if (assistantContent) {
      writeToContinuitySpine({
        role: 'assistant',
        content: assistantContent,
      });
    }
  } catch {
    /* spine optional */
  }
}
