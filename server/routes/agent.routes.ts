import { Router, type Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  addTask, 
  getTask as getAgentTask, 
  listTasks as listAgentTasks,
  updateTask as updateAgentTask
} from '../agents/taskStorage';
import { runTask } from '../agents/worker';
import { listAgents } from '../agents/registry';
import { agentController } from '../agentController';
import { 
  getUserTasks, 
  createUserTask, 
  updateUserTask, 
  deleteUserTask, 
  getUpcomingTasks 
} from '../userTaskService';
import { asyncHandler } from '../utils/routeHelpers';

/**
 * Agent and Task Routes
 */
export function registerAgentRoutes(app: Express) {
  const router = Router();

  // Agent orchestration endpoints
  router.post('/agent/tasks', asyncHandler(async (req, res) => {
    const { supervisor, agent, action, payload, metadata } = req.body;
    if (!agent || !action) {
      return res.status(400).json({ error: 'agent and action are required' });
    }

    const task = {
      taskId: uuidv4(),
      supervisor: supervisor || 'MillaAgent',
      agent,
      action,
      payload: payload || {},
      metadata: metadata || {},
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addTask(task);
    res.status(201).json({ success: true, task });
  }));

  router.get('/agent/tasks', asyncHandler(async (req, res) => {
    const tasks = await listAgentTasks();
    res.json({ success: true, tasks });
  }));

  router.get('/agent/tasks/:id', asyncHandler(async (req, res) => {
    const task = await getAgentTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, task });
  }));

  router.post('/agent/tasks/:id/run', asyncHandler(async (req, res) => {
    const task = await getAgentTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (task.status === 'in_progress') {
      return res.status(400).json({ error: 'Task is already in progress' });
    }

    if (task.metadata?.requireUserApproval && !task.metadata?.approved) {
      return res.status(403).json({ error: 'Task requires user approval before running' });
    }

    runTask(task).catch((err) => console.error('Background runTask error:', err));
    res.json({ success: true, running: true, taskId: task.taskId });
  }));

  router.patch('/agent/tasks/:id', asyncHandler(async (req, res) => {
    const patch = req.body || {};
    const updated = await updateAgentTask(req.params.id, patch as any);
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, task: updated });
  }));

  router.post('/agent/tasks/:id/approve', asyncHandler(async (req, res) => {
    const task = await getAgentTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const updated = await updateAgentTask(req.params.id, {
      metadata: { ...task.metadata, approved: true },
    });

    const { logAuditEvent } = await import('../agents/auditLog.js');
    await logAuditEvent(task.taskId, task.agent, task.action, 'created', 'User approved task');

    res.json({ success: true, task: updated });
  }));

  router.get('/agent/registry', asyncHandler(async (req, res) => {
    const agents = listAgents().map((a) => ({
      name: a.name,
      description: a.description,
    }));
    res.json({ success: true, agents });
  }));

  router.post('/agent/:agentName', asyncHandler(async (req, res) => {
    const { agentName } = req.params;
    const { task } = req.body;

    if (!task) {
      return res.status(400).json({ error: 'Task is required' });
    }

    const result = await agentController.dispatch(agentName, task);
    res.json({ response: result, success: true });
  }));

  // User Tasks CRUD
  router.get('/user-tasks', asyncHandler(async (req, res) => {
    const tasks = getUserTasks();
    res.json(tasks);
  }));

  router.post('/user-tasks', asyncHandler(async (req, res) => {
    const task = await createUserTask(req.body);
    res.status(201).json(task);
  }));

  router.put('/user-tasks/:id', asyncHandler(async (req, res) => {
    const task = await updateUserTask(req.params.id, req.body);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  }));

  router.delete('/user-tasks/:id', asyncHandler(async (req, res) => {
    const deleted = await deleteUserTask(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  }));

  router.get('/user-tasks/upcoming', asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days as string) || 7;
    const tasks = getUpcomingTasks(days);
    res.json(tasks);
  }));

  // Mount routes
  app.use('/api', router);
}
