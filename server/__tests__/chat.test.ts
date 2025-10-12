import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { registerRoutes } from '../routes';
import express from 'express';
import request from 'supertest';
import { Server } from 'http';

describe('Chat API', () => {
  const app = express();
  let server: Server;

  beforeAll(async () => {
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(() => {
    server.close();
  });

  it('should return a successful response with a message from the AI', async () => {
    const response = await request(server)
      .post('/api/chat')
      .send({ message: 'hello' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('response');
    expect(typeof response.body.response).toBe('string');
  });

  it('should return the graceful fallback for "what\'s new" when no updates are available', async () => {
    const response = await request(server)
      .post('/api/chat')
      .send({ message: "what's new" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('response');
    expect(response.body.response).toContain(
      "I don't have any new AI updates to share right now, sweetheart."
    );
  });
});
