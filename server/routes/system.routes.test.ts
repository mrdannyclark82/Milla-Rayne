import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerSystemRoutes } from './system.routes';
import { agentController } from '../agentController';
import { circuitBreaker } from '../apiResilience';
import * as selfEvolution from '../selfEvolutionService';
import * as metacognitiveService from '../metacognitiveService';
import * as memoryScheduler from '../memorySummarizationScheduler';

vi.mock('../agentController');
vi.mock('../apiResilience');
vi.mock('../metacognitiveService');
vi.mock('../memorySummarizationScheduler');
vi.mock('../selfEvolutionService');
vi.mock('../moodService');

describe('System Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerSystemRoutes(app);
    vi.clearAllMocks();

    // Default mocks
    vi.spyOn(circuitBreaker, 'getStatus').mockReturnValue({});
    vi.spyOn(metacognitiveService, 'getSCPAQueueStatus').mockReturnValue({ queueSize: 0, criticalFailures: 0 } as any);
    vi.spyOn(memoryScheduler, 'getSchedulerStatus').mockReturnValue({ isRunning: false, successRate: 1 } as any);
  });

  describe('GET /api/monitoring/health', () => {
    it('should return system health', async () => {
      vi.spyOn(agentController, 'getAllMetrics').mockReturnValue({});
      vi.spyOn(agentController, 'getRegisteredAgents').mockReturnValue([]);
      
      const response = await request(app).get('/api/monitoring/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.health).toBe('healthy');
    });
  });

  describe('GET /api/self-improvement/status', () => {
    it('should return evolution status', async () => {
      vi.spyOn(selfEvolution, 'getServerEvolutionStatus').mockReturnValue({ isRunning: false } as any);
      
      const response = await request(app).get('/api/self-improvement/status');

      expect(response.status).toBe(200);
      expect(response.body.server.isRunning).toBe(false);
    });
  });
});
