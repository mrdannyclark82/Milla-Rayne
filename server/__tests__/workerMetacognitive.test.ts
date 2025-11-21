import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runTask } from '../agents/worker';
import type { AgentTask } from '../agents/taskStorage';
import * as taskStorage from '../agents/taskStorage';
import * as registry from '../agents/registry';
import * as metacognitiveService from '../metacognitiveService';

// Mock dependencies
vi.mock('../agents/taskStorage');
vi.mock('../agents/registry');
vi.mock('../agents/auditLog');
vi.mock('../metacognitiveService');

describe('Agent Worker with Metacognitive Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should monitor task alignment after successful completion', async () => {
    const mockAgent = {
      name: 'TestAgent',
      description: 'Test agent',
      handleTask: vi
        .fn()
        .mockResolvedValue({ success: true, data: 'test result' }),
    };

    const task: AgentTask = {
      taskId: 'test-task-1',
      supervisor: 'user',
      agent: 'TestAgent',
      action: 'test',
      payload: { query: 'test query' },
      status: 'pending',
      metadata: { userId: 'test-user' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(registry.getAgent).mockReturnValue(mockAgent as any);
    vi.mocked(taskStorage.updateTask).mockResolvedValue({
      ...task,
      status: 'completed',
    } as any);
    vi.mocked(metacognitiveService.monitorTaskAlignment).mockResolvedValue(
      null
    );

    await runTask(task);

    // Verify task was completed
    expect(taskStorage.updateTask).toHaveBeenCalledWith(
      task.taskId,
      expect.objectContaining({
        status: 'completed',
      })
    );

    // Verify metacognitive monitoring was called
    expect(metacognitiveService.monitorTaskAlignment).toHaveBeenCalled();
  });

  it('should store metacognitive feedback when misalignment is detected', async () => {
    const mockAgent = {
      name: 'TestAgent',
      description: 'Test agent',
      handleTask: vi.fn().mockResolvedValue({ success: true }),
    };

    const task: AgentTask = {
      taskId: 'test-task-2',
      supervisor: 'user',
      agent: 'TestAgent',
      action: 'test',
      payload: {},
      status: 'pending',
      metadata: { userId: 'test-user' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const feedback = {
      type: 'warning' as const,
      message: 'Task may not align with user goals',
      suggestedAction: 'Consider alternative approach',
      confidence: 0.75,
      reasoning: 'Task conflicts with user preferences',
    };

    vi.mocked(registry.getAgent).mockReturnValue(mockAgent as any);
    vi.mocked(taskStorage.updateTask).mockResolvedValue({
      ...task,
      status: 'completed',
    } as any);
    vi.mocked(metacognitiveService.monitorTaskAlignment).mockResolvedValue(
      feedback
    );

    await runTask(task);

    // Verify feedback was stored in task metadata
    expect(taskStorage.updateTask).toHaveBeenCalledWith(
      task.taskId,
      expect.objectContaining({
        metadata: expect.objectContaining({
          metacognitiveFeedback: expect.objectContaining({
            type: 'warning',
            message: 'Task may not align with user goals',
            suggestedAction: 'Consider alternative approach',
            confidence: 0.75,
          }),
        }),
      })
    );
  });

  it('should not fail task if metacognitive monitoring fails', async () => {
    const mockAgent = {
      name: 'TestAgent',
      description: 'Test agent',
      handleTask: vi.fn().mockResolvedValue({ success: true }),
    };

    const task: AgentTask = {
      taskId: 'test-task-3',
      supervisor: 'user',
      agent: 'TestAgent',
      action: 'test',
      payload: {},
      status: 'pending',
      metadata: { userId: 'test-user' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(registry.getAgent).mockReturnValue(mockAgent as any);
    vi.mocked(taskStorage.updateTask).mockResolvedValue({
      ...task,
      status: 'completed',
    } as any);
    vi.mocked(metacognitiveService.monitorTaskAlignment).mockRejectedValue(
      new Error('Metacognitive service unavailable')
    );

    // Should not throw
    await expect(runTask(task)).resolves.not.toThrow();

    // Task should still be marked as completed
    expect(taskStorage.updateTask).toHaveBeenCalledWith(
      task.taskId,
      expect.objectContaining({
        status: 'completed',
      })
    );
  });
});
