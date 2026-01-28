import { Router, type Express } from 'express';
import { 
  getPersonalTasks, 
  startTask, 
  completeTask, 
  getTaskSummary 
} from '../personalTaskService';
import { asyncHandler } from '../utils/routeHelpers';

/**
 * Personal Task and Self-Improvement Task Routes
 */
export function registerPersonalTaskRoutes(app: Express) {
  const router = Router();

  router.get('/personal-tasks', asyncHandler(async (req, res) => {
    const tasks = getPersonalTasks();
    res.json(tasks);
  }));

  router.get('/task-summary', asyncHandler(async (req, res) => {
    const summary = getTaskSummary();
    res.json({ summary });
  }));

  router.post('/personal-tasks/:taskId/start', asyncHandler(async (req, res) => {
    const task = await startTask(req.params.taskId);
    res.json({ success: !!task, task });
  }));

  router.post('/personal-tasks/:taskId/complete', asyncHandler(async (req, res) => {
    const task = await completeTask(req.params.taskId);
    res.json({ success: !!task, task });
  }));

  // Mount routes
  app.use('/api', router);
}
