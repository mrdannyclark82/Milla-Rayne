import { registerAgent } from './registry';
import { AgentTask } from './taskStorage';
import { promises as fs } from 'fs';
import { join } from 'path';
import mustache from 'mustache';
import { z } from 'zod';

const OUTBOX = join(process.cwd(), 'memory', 'email_outbox.json');

async function ensureOutbox(): Promise<void> {
  try {
    await fs.access(OUTBOX);
  } catch (err) {
    await fs.writeFile(OUTBOX, '[]', 'utf-8');
  }
}

async function readOutbox(): Promise<any[]> {
  await ensureOutbox();
  const raw = await fs.readFile(OUTBOX, 'utf-8');
  try {
    return JSON.parse(raw || '[]');
  } catch (err) {
    await fs.writeFile(OUTBOX, '[]', 'utf-8');
    return [];
  }
}

async function writeOutbox(items: any[]): Promise<void> {
  await ensureOutbox();
  await fs.writeFile(OUTBOX, JSON.stringify(items, null, 2), 'utf-8');
}

/**
 * Basic EmailAgent for drafting and enqueuing email messages.
 * This implementation intentionally does not send real email by default.
 * Instead it persists drafts / queued messages to `memory/email_outbox.json`.
 */
async function handleTask(task: AgentTask): Promise<any> {
  const { action, payload } = task;

  if (action === 'draft') {
    const schema = z.object({
      to: z.union([z.string(), z.array(z.string())]).optional(),
      subject: z.string().optional(),
      body: z.string().optional(),
      template: z.string().optional(),
      templateData: z.record(z.string(), z.any()).optional(),
    });
    const parsed = schema.parse(payload || {});

    let finalBody = parsed.body || '';
    if (parsed.template && parsed.templateData) {
      finalBody = mustache.render(parsed.template, parsed.templateData);
    }

    return { draft: { to: parsed.to, subject: parsed.subject, body: finalBody } };
  }

  if (action === 'enqueue' || action === 'send') {
    const schema = z.object({
      to: z.union([z.string(), z.array(z.string())]),
      subject: z.string(),
      body: z.string().optional(),
      template: z.string().optional(),
      templateData: z.record(z.string(), z.any()).optional(),
      html: z.string().optional(),
    });

    const parsed = schema.parse(payload || {});

    let finalBody = parsed.body || '';
    if (parsed.template && parsed.templateData) {
      finalBody = mustache.render(parsed.template, parsed.templateData);
    }

    const outbox = await readOutbox();
    const id = `email_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const item: any = {
      id,
      to: parsed.to,
      subject: parsed.subject,
      body: finalBody,
      html: parsed.html,
      createdAt: new Date().toISOString(),
      sent: false,
      attempts: 0,
    };

    outbox.push(item);
    await writeOutbox(outbox);

    // Note: actual delivery not attempted here; worker will process queued items
    return { queued: item };
  }

  if (action === 'list_outbox') {
    const outbox = await readOutbox();
    return { outbox };
  }

  throw new Error(`Unknown action for EmailAgent: ${action}`);
}

// Register the agent in the registry on module load
registerAgent({ name: 'EmailAgent', description: 'Drafts and queues email messages', handleTask });

export { handleTask };
export default { handleTask };
