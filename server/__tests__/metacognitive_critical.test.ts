import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reportAgentFailure, clearSCPAQueue } from '../metacognitiveService';
import * as emailWorker from '../agents/emailDeliveryWorker';
import * as taskStorage from '../agents/taskStorage';

// Mock dependencies
vi.mock('../agents/emailDeliveryWorker', () => ({
  getEmailOutbox: vi.fn().mockResolvedValue([]),
  writeEmailOutbox: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../agents/taskStorage', () => ({
  addTask: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../config', () => ({
  config: {
    email: {
      fromAddress: 'system@example.com',
    },
    admin: {
      email: 'admin@example.com', // Mock admin email
    },
  },
}));

// Mock storage
vi.mock('../storage', () => ({
  storage: {
    getActiveUserSessions: vi.fn().mockResolvedValue([{ userId: 'admin-user' }]),
    getUserById: vi.fn().mockResolvedValue({ email: 'admin@test.com' }),
  },
}));

describe('Metacognitive Service - Critical Failures', () => {
  beforeEach(() => {
    clearSCPAQueue();
    vi.clearAllMocks();
  });

  it('should handle critical failures by notifying admin and creating urgent task', async () => {
    const error = new Error('CRITICAL: System meltdown imminent');

    // We import the mocked modules to spy on them
    const { getEmailOutbox, writeEmailOutbox } = await import('../agents/emailDeliveryWorker');
    const { addTask } = await import('../agents/taskStorage');

    await reportAgentFailure(error, {
      agentName: 'core-system',
      severity: 'critical',
      taskId: 'task-123',
    });

    // Verify email notification
    expect(getEmailOutbox).toHaveBeenCalled();
    expect(writeEmailOutbox).toHaveBeenCalled();

    // Check email content
    const writeCall = vi.mocked(writeEmailOutbox).mock.calls[0];
    expect(writeCall).toBeDefined();
    const outbox = writeCall[0];
    expect(outbox).toHaveLength(1);
    expect(outbox[0].subject).toContain('CRITICAL ALERT: core-system Failure');
    expect(outbox[0].to).toBe('admin@example.com');
    expect(outbox[0].priority).toBe('high');

    // Verify task creation
    expect(addTask).toHaveBeenCalled();
    const addTaskCall = vi.mocked(addTask).mock.calls[0]; // It might be called twice (one for SCPA generic, one for critical fix)

    // Find the critical fix task
    const calls = vi.mocked(addTask).mock.calls;
    const criticalTask = calls.find(call => call[0].action === 'emergency_fix');

    expect(criticalTask).toBeDefined();
    expect(criticalTask![0].agent).toBe('codingAgent');
    expect(criticalTask![0].payload.priority).toBe('critical');
    expect(criticalTask![0].payload.description).toContain('EMERGENCY FIX');
  });

  it('should fallback to user email if admin email is not configured', async () => {
     // Remock config for this test case
     vi.resetModules();
     vi.doMock('../config', () => ({
        config: {
            email: { fromAddress: 'system@example.com' },
            admin: { email: undefined }
        }
     }));

     // Re-import to get new mock
     const { reportAgentFailure: reportFailureRel } = await import('../metacognitiveService');
     const { writeEmailOutbox } = await import('../agents/emailDeliveryWorker');

     const error = new Error('CRITICAL: Another failure');
     await reportFailureRel(error, { agentName: 'test', severity: 'critical' });

     const writeCall = vi.mocked(writeEmailOutbox).mock.calls[0];
     expect(writeCall).toBeDefined();
     expect(writeCall[0][0].to).toBe('admin@test.com'); // From storage mock
  });
});
