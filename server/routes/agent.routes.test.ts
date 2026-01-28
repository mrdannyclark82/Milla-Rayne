import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerAgentRoutes } from './agent.routes';
import * as taskStorage from '../agents/taskStorage';
import * as userTaskService from '../userTaskService';
import { agentController } from '../agentController';

vi.mock('../agents/taskStorage');
vi.mock('../userTaskService');
vi.mock('../agentController');
vi.mock('../agents/worker');

describe('Agent Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerAgentRoutes(app);
    vi.clearAllMocks();
  });

  describe('POST /api/agent/tasks', () => {
    it('should create a new agent task', async () => {
      const taskData = { agent: 'TestAgent', action: 'test_action' };
      const response = await request(app)
        .post('/api/agent/tasks')
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(taskStorage.addTask).toHaveBeenCalled();
    });
  });

  describe('GET /api/user-tasks', () => {
    it('should return user tasks', async () => {
      vi.spyOn(userTaskService, 'getUserTasks').mockReturnValue([{ id: '1', title: 'Task 1' } as any]);
      const response = await request(app).get('/api/user-tasks');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Task 1');
    });
  });

  describe('POST /api/agent/:agentName', () => {
    it('should dispatch a task to an agent', async () => {
      vi.spyOn(agentController, 'dispatch').mockResolvedValue('Agent response');
      const response = await request(app)
        .post('/api/agent/TestAgent')
        .send({ task: 'Do something' });

      expect(response.status).toBe(200);
      expect(response.body.response).toBe('Agent response');
      expect(agentController.dispatch).toHaveBeenCalledWith('TestAgent', 'Do something');
    });
  });
});
