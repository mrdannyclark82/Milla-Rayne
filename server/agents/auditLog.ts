import { promises as fs } from 'fs';
import { join } from 'path';

const AUDIT_LOG = join(process.cwd(), 'memory', 'agent_audit.log');

/**
 * Append-only audit log for all agent task lifecycle events
 * Format: ISO timestamp | taskId | agent | action | status | details
 */
export async function logAuditEvent(
  taskId: string,
  agent: string,
  action: string,
  status: 'created' | 'started' | 'completed' | 'failed' | 'cancelled',
  details?: string
): Promise<void> {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` | ${details}` : '';
  const line = `${timestamp} | ${taskId} | ${agent} | ${action} | ${status}${detailsStr}\n`;

  try {
    await fs.appendFile(AUDIT_LOG, line, 'utf-8');
  } catch (err) {
    // If file doesn't exist, create it
    if ((err as any).code === 'ENOENT') {
      await fs.writeFile(AUDIT_LOG, line, 'utf-8');
    } else {
      console.error('Failed to write audit log:', err);
    }
  }
}

/**
 * Read recent audit log entries (last N lines)
 */
export async function readAuditLog(maxLines: number = 100): Promise<string[]> {
  try {
    const content = await fs.readFile(AUDIT_LOG, 'utf-8');
    const lines = content
      .trim()
      .split('\n')
      .filter((l) => l.length > 0);
    return lines.slice(-maxLines);
  } catch (err) {
    if ((err as any).code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

/**
 * Get audit entries for a specific task
 */
export async function getTaskAuditTrail(taskId: string): Promise<string[]> {
  const all = await readAuditLog(1000);
  return all.filter((line) => line.includes(` | ${taskId} | `));
}
