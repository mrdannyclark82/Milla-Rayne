import { promises as fs } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';
import { config } from '../config';
import nodemailer from 'nodemailer';

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

// Exported helpers for admin APIs / tests
export { readOutbox as getEmailOutbox, writeOutbox as writeEmailOutbox };

// Simple in-memory metrics for observability
export const emailMetrics = {
  sent: 0,
  failed: 0,
  pending: 0,
};

async function sendViaSendGrid(
  item: any
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = config.email.sendgridApiKey || process.env.SENDGRID_API_KEY;
  if (!apiKey) return { ok: false, error: 'SendGrid API key not configured' };

  const body: any = {
    personalizations: [
      {
        to: Array.isArray(item.to)
          ? item.to.map((t: string) => ({ email: t }))
          : [{ email: item.to }],
        subject: item.subject,
      },
    ],
    from: {
      email:
        config.email.fromAddress ||
        process.env.EMAIL_FROM ||
        'noreply@example.com',
    },
    content: [{ type: 'text/plain', value: item.body }],
  };

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.ok) return { ok: true };
    const txt = await res.text().catch(() => '');
    return { ok: false, error: `SendGrid responded ${res.status}: ${txt}` };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
}

async function sendViaSMTP(
  item: any
): Promise<{ ok: boolean; error?: string }> {
  const smtp = config.email.smtp || {};
  if (!smtp.host || !smtp.port) {
    return { ok: false, error: 'SMTP configuration missing (host/port)' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure === true, // true for 465, false for other ports
      requireTLS: smtp.requireTLS === true,
      auth:
        smtp.user && smtp.pass
          ? { user: smtp.user, pass: smtp.pass }
          : undefined,
    } as any);

    const toList = Array.isArray(item.to) ? item.to.join(', ') : item.to;

    const mailOptions: any = {
      from:
        config.email.fromAddress ||
        process.env.EMAIL_FROM ||
        'noreply@example.com',
      to: toList,
      subject: item.subject,
      text: item.body,
    };

    // Support HTML if provided
    if (item.html) mailOptions.html = item.html;

    const res = await transporter.sendMail(mailOptions);

    // Nodemailer returns an info object; consider success if accepted has entries
    if (
      (res && res.accepted && res.accepted.length > 0) ||
      (res && res.messageId)
    ) {
      return { ok: true };
    }

    return { ok: false, error: `SMTP sendMail result: ${JSON.stringify(res)}` };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
}

export async function deliverOutboxOnce(): Promise<{
  sent: number;
  failed: number;
  skipped: number;
}> {
  const items = await readOutbox();
  let changed = false;
  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  // refresh pending metric
  emailMetrics.pending = items.filter((i) => !i.sent).length;

  for (const item of items) {
    if (item.sent) continue;

    // Respect nextAttemptAt for exponential backoff
    if (
      item.nextAttemptAt &&
      new Date(item.nextAttemptAt).getTime() > Date.now()
    ) {
      // Not yet time to retry
      skippedCount++;
      continue;
    }

    // Only proceed if email sending is enabled
    if (!config.email.sendEmails) {
      console.log(
        '[emailDeliveryWorker] SEND_EMAILS disabled; skipping delivery'
      );
      return {
        sent: 0,
        failed: 0,
        skipped: items.filter((i) => !i.sent).length,
      };
    }

    // Respect max attempts
    item.attempts = item.attempts || 0;
    if (item.attempts >= (config.email.maxAttempts || 3)) {
      // Give up
      item.failed = true;
      item.failedAt = item.failedAt || new Date().toISOString();
      item.error = item.error || 'Max attempts reached';
      failedCount++;
      changed = true;
      console.warn(
        '[emailDeliveryWorker] Giving up on',
        item.id,
        'after',
        item.attempts,
        'attempts'
      );
      continue;
    }

    console.log(
      '[emailDeliveryWorker] Delivering email',
      item.id || '<no-id>',
      'attempt',
      item.attempts + 1
    );

    // Currently support SendGrid provider
    if (config.email.provider === 'sendgrid') {
      const result = await sendViaSendGrid(item);
      item.attempts = (item.attempts || 0) + 1;
      item.lastAttemptedAt = new Date().toISOString();
      if (result.ok) {
        item.sent = true;
        item.sentAt = new Date().toISOString();
        sentCount++;
        emailMetrics.sent += 1;
        changed = true;
        console.log('[emailDeliveryWorker] Sent', item.id);
      } else {
        // record error and schedule next attempt
        item.error = result.error || 'Unknown send error';
        item.attempts = (item.attempts || 0) + 1;
        const base = config.email.baseBackoffMs || 60000;
        const maxBack = config.email.maxBackoffMs || 24 * 60 * 60 * 1000;
        const nextDelay = Math.min(
          base * Math.pow(2, item.attempts - 1),
          maxBack
        );
        item.nextAttemptAt = new Date(Date.now() + nextDelay).toISOString();
        failedCount += 1;
        emailMetrics.failed += 1;
        changed = true;
        console.error(
          '[emailDeliveryWorker] Failed to send',
          item.id,
          result.error,
          'scheduling nextAttemptAt',
          item.nextAttemptAt
        );
      }
    } else if (config.email.provider === 'smtp') {
      const result = await sendViaSMTP(item);
      if (result.ok) {
        item.sent = true;
        item.sentAt = new Date().toISOString();
        sentCount++;
        emailMetrics.sent += 1;
        changed = true;
        console.log('[emailDeliveryWorker] Sent via SMTP', item.id);
      } else {
        // schedule retry with backoff
        item.error = result.error || 'SMTP send error';
        item.attempts = (item.attempts || 0) + 1;
        const base = config.email.baseBackoffMs || 60000;
        const maxBack = config.email.maxBackoffMs || 24 * 60 * 60 * 1000;
        const nextDelay = Math.min(
          base * Math.pow(2, item.attempts - 1),
          maxBack
        );
        item.nextAttemptAt = new Date(Date.now() + nextDelay).toISOString();
        failedCount += 1;
        emailMetrics.failed += 1;
        changed = true;
        console.error(
          '[emailDeliveryWorker] Failed to send via SMTP',
          item.id,
          result.error,
          'scheduling nextAttemptAt',
          item.nextAttemptAt
        );
      }
    } else {
      // Provider not implemented: mark attempted and leave unsent for manual processing
      item.attempts = (item.attempts || 0) + 1;
      item.lastAttemptedAt = new Date().toISOString();
      item.error = 'Provider not implemented: ' + String(config.email.provider);
      skippedCount++;
      changed = true;
    }
  }

  if (changed) {
    await writeOutbox(items);
  }

  return { sent: sentCount, failed: failedCount, skipped: skippedCount };
}

let loopHandle: NodeJS.Timeout | null = null;

export function startEmailDeliveryLoop(): void {
  if (!config.email.sendEmails) {
    console.log(
      '[emailDeliveryWorker] Email sending disabled by config.SEND_EMAILS'
    );
    return;
  }

  const interval = config.email.deliveryIntervalMs || 60000;
  if (loopHandle) return; // already running

  console.log(
    `[emailDeliveryWorker] Starting delivery loop (interval ${interval}ms)`
  );
  loopHandle = setInterval(() => {
    deliverOutboxOnce().catch((err) =>
      console.error('Email delivery error:', err)
    );
  }, interval);

  // Also run immediately once
  deliverOutboxOnce().catch((err) =>
    console.error('Initial email delivery error:', err)
  );
}

export function stopEmailDeliveryLoop(): void {
  if (loopHandle) {
    clearInterval(loopHandle);
    loopHandle = null;
  }
}
