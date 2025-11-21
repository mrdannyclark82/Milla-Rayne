import { getAgent } from './registry';
import { AgentTask, updateTask } from './taskStorage';
import { logAuditEvent } from './auditLog';
import {
  monitorTaskAlignment,
  formatFeedbackForContext,
} from '../metacognitiveService';

/**
 * Simple in-process worker that pulls tasks from caller and executes them.
 * This implementation provides a runTask function that can be called by the API
 * or by a scheduled worker loop. For a production system this would be backed
 * by Redis / a proper queue.
 */
export async function runTask(task: AgentTask): Promise<void> {
  try {
    // Check if task requires approval
    if (task.metadata?.requireUserApproval && !task.metadata?.approved) {
      const errorMsg = 'Task requires user approval before running';
      await updateTask(task.taskId, {
        status: 'failed',
        result: { error: errorMsg },
      });
      await logAuditEvent(
        task.taskId,
        task.agent,
        task.action,
        'failed',
        errorMsg
      );
      throw new Error(errorMsg);
    }

    // Log start
    await logAuditEvent(task.taskId, task.agent, task.action, 'started');

    // Mark task in progress
    await updateTask(task.taskId, {
      status: 'in_progress',
      updatedAt: new Date().toISOString(),
    });

    const agent = getAgent(task.agent);
    if (!agent) {
      await updateTask(task.taskId, {
        status: 'failed',
        result: { error: 'Agent not found' },
      });
      await logAuditEvent(
        task.taskId,
        task.agent,
        task.action,
        'failed',
        'Agent not found'
      );
      return;
    }

    const result = await agent.handleTask(task);

    await updateTask(task.taskId, {
      status: 'completed',
      result,
      updatedAt: new Date().toISOString(),
    });
    await logAuditEvent(task.taskId, task.agent, task.action, 'completed');

    // Monitor task alignment with user goals (metacognitive loop)
    try {
      const updatedTask = await updateTask(task.taskId, { result });
      if (updatedTask) {
        const feedback = await monitorTaskAlignment(updatedTask);
        if (feedback) {
          // Store feedback in task metadata for future reference
          await updateTask(task.taskId, {
            metadata: {
              ...updatedTask.metadata,
              metacognitiveFeedback: {
                type: feedback.type,
                message: feedback.message,
                suggestedAction: feedback.suggestedAction,
                confidence: feedback.confidence,
                timestamp: new Date().toISOString(),
              },
            },
          });
          console.log(
            `[Metacognitive] Feedback recorded for task ${task.taskId}:`,
            feedback.message
          );
        }
      }
    } catch (metacognitiveError) {
      // Don't fail the task if metacognitive monitoring fails
      console.error(
        '[Metacognitive] Error monitoring task alignment:',
        metacognitiveError
      );
    }
  } catch (err: any) {
    console.error('Worker error running task', task.taskId, err);
    const errorMsg = err?.message || String(err);
    await updateTask(task.taskId, {
      status: 'failed',
      result: { error: errorMsg },
    });
    await logAuditEvent(
      task.taskId,
      task.agent,
      task.action,
      'failed',
      errorMsg
    );
    // Re-throw to allow test assertions
    throw err;
  }
}

/**
 * Get metacognitive feedback for a task if available
 */
export function getTaskFeedback(task: AgentTask): string | null {
  const feedback = task.metadata?.metacognitiveFeedback;
  if (!feedback) return null;

  return formatFeedbackForContext({
    type: feedback.type,
    message: feedback.message,
    suggestedAction: feedback.suggestedAction,
    confidence: feedback.confidence,
    reasoning: '',
  });
}
