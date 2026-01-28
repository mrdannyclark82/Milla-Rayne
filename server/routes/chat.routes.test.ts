import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { registerChatRoutes } from './chat.routes';
import * as authService from '../authService';
import * as chatOrchestrator from '../services/chatOrchestrator.service';
import * as smartHomeService from '../smartHomeService';
import * as sceneDetectionService from '../sceneDetectionService';

vi.mock('../authService');
vi.mock('../services/chatOrchestrator.service');
vi.mock('../voiceAnalysisService');
vi.mock('../smartHomeService');
vi.mock('../sceneDetectionService');

describe('Chat Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    registerChatRoutes(app);
    vi.clearAllMocks();

    // Default mocks
    vi.spyOn(smartHomeService, 'getSmartHomeSensorData').mockResolvedValue({});
    vi.spyOn(sceneDetectionService, 'detectSceneContext').mockReturnValue({
      hasSceneChange: false,
      location: 'living room',
      mood: 'calm',
      timeOfDay: 'evening',
    } as any);
  });

  describe('GET /api/ai-model/current', () => {
    it('should return default model if not authenticated', async () => {
      const response = await request(app).get('/api/ai-model/current');
      expect(response.status).toBe(200);
      expect(response.body.model).toBe('minimax');
    });

    it('should return user model if authenticated', async () => {
      vi.spyOn(authService, 'validateSession').mockResolvedValue({
        valid: true,
        user: { id: 'user-1' } as any,
      });
      vi.spyOn(authService, 'getUserAIModel').mockResolvedValue({
        success: true,
        model: 'xai',
      });

      const response = await request(app)
        .get('/api/ai-model/current')
        .set('Cookie', ['session_token=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body.model).toBe('xai');
    });
  });

  describe('POST /api/chat', () => {
    it('should return AI response for a message', async () => {
      vi.spyOn(chatOrchestrator, 'validateAndSanitizePrompt').mockImplementation(p => p);
      vi.spyOn(chatOrchestrator, 'generateAIResponse').mockResolvedValue({
        content: 'Hello Danny!',
      });

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hi Milla' });

      expect(response.status).toBe(200);
      expect(response.body.response).toBe('Hello Danny!');
    });

    it('should return 400 for empty message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: '' });

      expect(response.status).toBe(400);
    });
  });
});
