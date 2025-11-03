import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { initApp } from '../../server/index'; // Import initApp
import path from 'path';
import fs from 'fs';

vi.mock('undici', () => ({
  fetch: vi.fn(),
}));

let app: any; // Declare app variable

describe('POST /api/chat/audio', () => {
  beforeAll(async () => {
    app = await initApp(); // Initialize app before all tests
  });
  it('should upload an audio file and return a response', async () => {
    const { fetch } = await import('undici');
    (fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Audio processed successfully' }),
    } as Response);

    const audioFilePath = path.resolve(__dirname, 'test.webm');
    // Create a dummy audio file for testing
    fs.writeFileSync(audioFilePath, 'dummy audio data');

    const response = await request(app)
      .post('/api/chat/audio')
      .attach('audio', audioFilePath);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.response).toBeDefined();

    // Clean up the dummy file
    fs.unlinkSync(audioFilePath);
  });
});
