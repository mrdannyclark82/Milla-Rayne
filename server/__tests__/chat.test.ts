import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { registerModularRoutes } from '../routes/index';
import { storage } from '../storage';
import * as chatOrchestrator from '../services/chatOrchestrator.service';
import * as smartHomeService from '../smartHomeService';
import * as sceneDetectionService from '../sceneDetectionService';
import * as authService from '../authService';

vi.mock('../services/chatOrchestrator.service', () => ({
  validateAndSanitizePrompt: vi.fn(p => p),
  generateAIResponse: vi.fn().mockResolvedValue({ content: 'Mock response' }),
  shouldMillaRespond: vi.fn().mockResolvedValue({ shouldRespond: true }),
  generateFollowUpMessages: vi.fn().mockResolvedValue([]),
  generateProactiveRepositoryMessage: vi.fn().mockResolvedValue(null),
}));

vi.mock('../smartHomeService', () => ({
  getSmartHomeSensorData: vi.fn().mockResolvedValue({}),
}));

vi.mock('../sceneDetectionService', () => ({
  detectSceneContext: vi.fn().mockReturnValue({
    hasSceneChange: false,
    location: 'living room',
    mood: 'calm',
    timeOfDay: 'evening',
  }),
}));

vi.mock('../authService', () => ({
  validateSession: vi.fn().mockResolvedValue({ valid: false }),
  getUserAIModel: vi.fn().mockResolvedValue({ success: true, model: 'minimax' }),
  updateUserAIModel: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Chat API', () => {
  let app: express.Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    registerModularRoutes(app);
  });

  it('should return a successful response with a message from the AI', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'hello' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('response');
  });

  it('should return the graceful fallback for "what\'s new" when no updates are available', async () => {
    vi.mocked(chatOrchestrator.generateAIResponse).mockResolvedValueOnce({
        content: "I don't have any new AI updates to share right now, sweetheart."
    });

    const response = await request(app)
      .post('/api/chat')
      .send({ message: "what's new" });

    expect(response.status).toBe(200);
    expect(response.body.response).toContain(
      "I don't have any new AI updates to share right now, sweetheart."
    );
  });
});
