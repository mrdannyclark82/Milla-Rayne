import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerMemoryRoutes } from './memory.routes';
import { storage } from '../storage';
import * as memoryService from '../memoryService';

vi.mock('../storage');
vi.mock('../memoryService');
vi.mock('../services/chatOrchestrator.service');
vi.mock('../proactiveService');
vi.mock('../visualMemoryService');
vi.mock('../visualRecognitionService');
vi.mock('../dailySuggestionsService');

describe('Memory Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerMemoryRoutes(app);
    vi.clearAllMocks();
  });

  describe('GET /api/messages', () => {
    it('should return messages from storage', async () => {
      vi.spyOn(storage, 'getMessages').mockResolvedValue([{ id: '1', content: 'hello' } as any]);
      const response = await request(app).get('/api/messages');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].content).toBe('hello');
    });
  });

  describe('GET /api/knowledge', () => {
    it('should return knowledge items', async () => {
      vi.spyOn(memoryService, 'searchKnowledge').mockResolvedValue([{ topic: 'test' } as any]);
      const response = await request(app).get('/api/knowledge');

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
    });
  });
});
