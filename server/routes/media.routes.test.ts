import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerMediaRoutes } from './media.routes';
import * as youtubeAnalysis from '../youtubeAnalysisService';
import * as moodBackground from '../moodBackgroundService';

vi.mock('../gemini');
vi.mock('../youtubeAnalysisService');
vi.mock('../moodBackgroundService');
vi.mock('../aiDispatcherService');

describe('Media Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerMediaRoutes(app);
    vi.clearAllMocks();
  });

  describe('POST /api/analyze-youtube', () => {
    it('should analyze a youtube video', async () => {
      vi.spyOn(youtubeAnalysis, 'isValidYouTubeUrl').mockReturnValue(true);
      vi.spyOn(youtubeAnalysis, 'analyzeYouTubeVideo').mockResolvedValue({
        videoInfo: { title: 'Test Video' },
      } as any);

      const response = await request(app)
        .post('/api/analyze-youtube')
        .send({ url: 'https://youtube.com/watch?v=123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Test Video');
    });

    it('should return 400 for invalid url', async () => {
      vi.spyOn(youtubeAnalysis, 'isValidYouTubeUrl').mockReturnValue(false);
      const response = await request(app)
        .post('/api/analyze-youtube')
        .send({ url: 'invalid' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/scene/mood-backgrounds', () => {
    it('should return cached backgrounds', async () => {
      vi.spyOn(moodBackground, 'getCachedMoodBackgrounds').mockReturnValue(['bg1.jpg']);
      const response = await request(app).get('/api/scene/mood-backgrounds');

      expect(response.status).toBe(200);
      expect(response.body.backgrounds).toContain('bg1.jpg');
    });
  });
});
