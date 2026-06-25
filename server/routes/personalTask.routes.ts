import { Router, type Express } from 'express';
import {
  getPersonalTasks,
  startTask,
  completeTask,
  getTaskSummary,
} from '../personalTaskService';
import { asyncHandler } from '../utils/routeHelpers';

/**
 * Personal Task and Self-Improvement Task Routes
 */
export function registerPersonalTaskRoutes(app: Express) {
  const router = Router();

  router.get(
    '/personal-tasks',
    asyncHandler(async (req, res) => {
      const tasks = getPersonalTasks();
      res.json(tasks);
    })
  );

  router.get(
    '/task-summary',
    asyncHandler(async (req, res) => {
      const summary = getTaskSummary();
      res.json({ summary });
    })
  );

  router.post(
    '/personal-tasks/:taskId/start',
    asyncHandler(async (req, res) => {
      const { taskId } = req.params;
      if (typeof taskId !== 'string' || !taskId) {
        return res.status(400).json({ success: false, error: 'Invalid task ID' });
      }
      const task = await startTask(taskId);
      res.json({ success: !!task, task });
    })
  );

  router.post(
    '/personal-tasks/:taskId/complete',
    asyncHandler(async (req, res) => {
      const { taskId } = req.params;
      if (typeof taskId !== 'string' || !taskId) {
        return res.status(400).json({ success: false, error: 'Invalid task ID' });
      }
      const insights =
        req.body && typeof req.body.insights === 'string'
          ? req.body.insights
          : 'Task completed manually.';
      const success = await completeTask(taskId, insights);
      const task = success ? getPersonalTasks().find((t) => t.id === taskId) : null;
      res.json({ success, task });
    })
  );

  // Mount routes
  app.use('/api', router);
}
