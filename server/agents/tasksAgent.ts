import { registerAgent } from './registry';
import { AgentTask } from './taskStorage';
import {
  addNoteToGoogleTasks,
  listTasks,
  completeTask,
  deleteTask,
} from '../googleTasksService';
import { z } from 'zod';

/**
 * TasksAgent - Domain agent for Google Tasks operations
 * Wraps googleTasksService to provide task-based task management
 * (Yes, tasks managing tasks - it's meta!)
 */
async function handleTask(task: AgentTask): Promise<any> {
  const { action, payload } = task;
  const userId = (payload as any)?.userId || 'default-user';

  if (action === 'add_task' || action === 'create_task') {
    const schema = z.object({
      title: z.string(),
      content: z.string().optional(),
      notes: z.string().optional(),
      userId: z.string().optional(),
    });

    const parsed = schema.parse(payload || {});
    const content = parsed.content || parsed.notes || '';

    const result = await addNoteToGoogleTasks(
      parsed.title,
      content,
      parsed.userId || userId
    );

    if (!result.success) {
      throw new Error(result.error || result.message);
    }

    return {
      success: true,
      taskId: result.taskId,
      taskLink: result.taskLink,
      message: result.message,
    };
  }

  if (action === 'list_tasks') {
    const schema = z.object({
      maxResults: z.number().optional(),
      showCompleted: z.boolean().optional(),
      userId: z.string().optional(),
    });

    const parsed = schema.parse(payload || {});

    const result = await listTasks(
      parsed.userId || userId,
      parsed.maxResults,
      parsed.showCompleted
    );

    if (!result.success) {
      throw new Error(result.error || result.message);
    }

    return {
      success: true,
      tasks: result.tasks || [],
      message: result.message,
    };
  }

  if (action === 'complete_task') {
    const schema = z.object({
      taskId: z.string(),
      userId: z.string().optional(),
    });

    const parsed = schema.parse(payload || {});

    const result = await completeTask(
      parsed.userId || userId,
      parsed.taskId
    );

    if (!result.success) {
      throw new Error(result.error || result.message);
    }

    return {
      success: true,
      message: result.message,
    };
  }

  if (action === 'delete_task') {
    const schema = z.object({
      taskId: z.string(),
      userId: z.string().optional(),
    });

    const parsed = schema.parse(payload || {});

    const result = await deleteTask(parsed.userId || userId, parsed.taskId);

    if (!result.success) {
      throw new Error(result.error || result.message);
    }

    return {
      success: true,
      message: result.message,
    };
  }

  throw new Error(`Unknown action for TasksAgent: ${action}`);
}

// Register the agent in the registry on module load
registerAgent({
  name: 'TasksAgent',
  description: 'Manages Google Tasks: create, list, complete, delete',
  handleTask,
});

export { handleTask };
export default { handleTask };
