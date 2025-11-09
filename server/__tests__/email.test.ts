import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { handleTask as enqueueTask } from '../agents/emailAgent';
import {
  deliverOutboxOnce,
  getEmailOutbox,
  writeEmailOutbox,
} from '../agents/emailDeliveryWorker';
import nodemailer from 'nodemailer';

const OUTBOX = join(process.cwd(), 'memory', 'email_outbox.json');

async function ensureMemoryDir() {
  const dir = join(process.cwd(), 'memory');
  try {
    await fs.access(dir);
  } catch (e) {
    await fs.mkdir(dir, { recursive: true });
  }
}

beforeEach(async () => {
  await ensureMemoryDir();
  await fs.writeFile(OUTBOX, '[]', 'utf-8');
  // Enable email sending in tests
  process.env.SEND_EMAILS = 'true';
});

afterEach(async () => {
  try {
    await fs.writeFile(OUTBOX, '[]', 'utf-8');
  } catch (e) {}
  vi.restoreAllMocks();
});

describe('Email queue and delivery', () => {
  it('enqueues an email via agent', async () => {
    const task: any = {
      action: 'enqueue',
      payload: { to: 'test@example.com', subject: 'Hi', body: 'Hello' },
    };
    const res = await enqueueTask(task as any);
    expect(res.queued).toBeDefined();

    const outbox = await getEmailOutbox();
    expect(outbox.length).toBe(1);
    expect(outbox[0].to).toBe('test@example.com');
  });

  it('delivers via SendGrid when fetch returns ok', async () => {
    // Set env vars
    process.env.EMAIL_PROVIDER = 'sendgrid';
    process.env.SENDGRID_API_KEY = 'fake-key';

    // write an outbox item
    await writeEmailOutbox([
      {
        id: 't1',
        to: 'a@b.com',
        subject: 's',
        body: 'b',
        sent: false,
        attempts: 0,
      },
    ]);

    // mock fetch
    globalThis.fetch = vi.fn(async () => ({ ok: true })) as any;

    const res = await deliverOutboxOnce();
    expect(res.sent).toBe(1);

    const outbox = await getEmailOutbox();
    expect(outbox[0].sent).toBe(true);
  });

  it('delivers via SMTP when transporter accepted', async () => {
    // Set env vars
    process.env.EMAIL_PROVIDER = 'smtp';
    process.env.EMAIL_SMTP_HOST = 'smtp.test.com';
    process.env.EMAIL_SMTP_PORT = '587';

    // write an outbox item
    await writeEmailOutbox([
      {
        id: 't2',
        to: 'a@b.com',
        subject: 's',
        body: 'b',
        sent: false,
        attempts: 0,
      },
    ]);

    // mock nodemailer
    const sendMailMock = vi.fn().mockResolvedValue({ accepted: ['a@b.com'] });
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: sendMailMock,
    } as any);

    const res = await deliverOutboxOnce();
    expect(res.sent).toBe(1);

    const outbox = await getEmailOutbox();
    expect(outbox[0].sent).toBe(true);
  });
});
