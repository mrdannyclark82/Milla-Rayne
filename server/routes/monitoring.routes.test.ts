import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerMonitoringRoutes } from './monitoring.routes';
import { agentController } from '../agentController';
import * as featureFlags from '../featureFlags';

vi.mock('../agentController');
vi.mock('../apiResilience');
vi.mock('../xaiTracker');
vi.mock('../featureFlags');

describe('Monitoring Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerMonitoringRoutes(app);
    vi.clearAllMocks();
  });

  describe('GET /api/feature-flags', () => {
    it('should return feature flags', async () => {
      vi.spyOn(featureFlags, 'getFeatureFlags').mockReturnValue({ flag1: true } as any);
      const response = await request(app).get('/api/feature-flags');

      expect(response.status).toBe(200);
      expect(response.body.flags.flag1).toBe(true);
    });
  });

  describe('GET /api/monitoring/agents', () => {
    it('should return agent metrics', async () => {
      vi.spyOn(agentController, 'getAllMetrics').mockReturnValue({});
      vi.spyOn(agentController, 'getRegisteredAgents').mockReturnValue([]);
      const response = await request(app).get('/api/monitoring/agents');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
