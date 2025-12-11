import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { initApp } from '../index'; // Import initApp
import path from 'path';
import fs from 'fs';

vi.mock('../vite', async () => {
  const actual = await vi.importActual('../vite') as any;
  return {
    ...actual,
    serveStatic: vi.fn(),
  };
});

vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

vi.mock('../aiDispatcherService', () => ({
    dispatchAIResponse: vi.fn().mockResolvedValue({ content: 'This is a test AI response' }),
}));

let app: any; // Declare app variable

describe('POST /api/chat/audio', () => {
  beforeAll(async () => {
    app = await initApp(); // Initialize app before all tests
  });
  it('should upload an audio file and return a response', async () => {
    const fetch = (await import('node-fetch')).default as vi.Mock;
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ text: 'This is a test transcript' }),
    } as Response);

    const audioFilePath = path.resolve(__dirname, 'test.webm');
    // Create a dummy audio file for testing
    fs.writeFileSync(audioFilePath, 'dummy audio data');

    const response = await request(app)
      .post('/api/chat/audio')
      .attach('audio', audioFilePath);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.response).toBe('This is a test AI response');

    // Clean up the dummy file
    fs.unlinkSync(audioFilePath);
  });
});
