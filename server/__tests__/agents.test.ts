import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import calendarAgentModule from '../agents/calendarAgent.js';
import { millaAgent } from '../agents/millaAgent.js';
import { readTasks, writeTasks, AgentTask, updateTask, getTask } from '../agents/taskStorage.js';
import { logAuditEvent, getTaskAuditTrail } from '../agents/auditLog.js';
import { runTask } from '../agents/worker.js';
import * as googleCalendarService from '../googleCalendarService.js';
import * as registry from '../agents/registry.js';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

describe('CalendarAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create calendar event', async () => {
    // Mock googleCalendarService
    const mockAddEvent = vi.spyOn(googleCalendarService, 'addEventToGoogleCalendar')
      .mockResolvedValue({ success: true, eventId: 'test-event-123' } as any);

    const task: AgentTask = {
      taskId: 'test-task-1',
      supervisor: 'MillaAgent',
      agent: 'CalendarAgent',
      action: 'create_event',
      payload: {
        title: 'Test Meeting',
        date: '2025-02-01',
        time: '10:00',
        description: 'Test description'
      },
      status: 'pending'
    };

    const result = await calendarAgentModule.handleTask(task);

    expect(result.success).toBe(true);
    expect(result.eventId).toBe('test-event-123');
    expect(mockAddEvent).toHaveBeenCalledWith(
      'Test Meeting',
      '2025-02-01',
      '10:00',
      'Test description',
      'default-user'
    );
  });

  it('should list calendar events', async () => {
    const mockListEvents = vi.spyOn(googleCalendarService, 'listEvents')
      .mockResolvedValue({ success: true, events: [
        { id: 'event1', summary: 'Event 1' },
        { id: 'event2', summary: 'Event 2' }
      ] } as any);

    const task: AgentTask = {
      taskId: 'test-task-2',
      supervisor: 'MillaAgent',
      agent: 'CalendarAgent',
      action: 'list_events',
      payload: {
        maxResults: 10
      },
      status: 'pending'
    };

    const result = await calendarAgentModule.handleTask(task);

    expect(result.success).toBe(true);
    expect(result.events).toHaveLength(2);
    expect(mockListEvents).toHaveBeenCalledWith('default-user', undefined, undefined, 10);
  });

  it('should delete calendar event', async () => {
    const mockDeleteEvent = vi.spyOn(googleCalendarService, 'deleteEvent')
      .mockResolvedValue({ success: true } as any);

    const task: AgentTask = {
      taskId: 'test-task-3',
      supervisor: 'MillaAgent',
      agent: 'CalendarAgent',
      action: 'delete_event',
      payload: {
        eventId: 'event-to-delete'
      },
      status: 'pending'
    };

    const result = await calendarAgentModule.handleTask(task);

    expect(result.success).toBe(true);
    expect(mockDeleteEvent).toHaveBeenCalledWith('default-user', 'event-to-delete');
  });

  it('should reject invalid action payload', async () => {
    const task: AgentTask = {
      taskId: 'test-task-4',
      supervisor: 'MillaAgent',
      agent: 'CalendarAgent',
      action: 'create_event',
      payload: {
        title: 'Test',
        // Missing required date field
      },
      status: 'pending'
    };

    await expect(calendarAgentModule.handleTask(task)).rejects.toThrow();
  });
});

describe('MillaAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear tasks before each test
    writeTasks([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create task from JSON instructions', async () => {
    const mockGetAgent = vi.spyOn(registry, 'getAgent')
      .mockReturnValue({ name: 'EmailAgent', description: 'Email agent', handleTask: vi.fn() } as any);

    const instructions = JSON.stringify({
      agent: 'EmailAgent',
      action: 'draft',
      payload: { to: 'test@example.com', subject: 'Test', body: 'Hello' },
      metadata: { safety_level: 'low' }
    });

    const result = await millaAgent.execute(instructions);

    expect(result).toContain('Created task');
    
    const tasks = await readTasks();
    expect(tasks.length).toBeGreaterThan(0);
    
    const task = tasks[tasks.length - 1];
    expect(task.agent).toBe('EmailAgent');
    expect(task.action).toBe('draft');
    // getAgent is called during task creation in MillaAgent
    // but we can't easily assert it since it's internal
  });

  it('should auto-run low-safety tasks', async () => {
    const mockAgent = { name: 'EmailAgent', description: 'Email agent', handleTask: vi.fn().mockResolvedValue({ success: true }) };
    vi.spyOn(registry, 'getAgent').mockReturnValue(mockAgent as any);

    const instructions = JSON.stringify({
      agent: 'EmailAgent',
      action: 'draft',
      payload: { to: 'test@example.com', subject: 'Test', body: 'Hello' },
      metadata: { safety_level: 'low', requireUserApproval: false }
    });

    const result = await millaAgent.execute(instructions);

    expect(result).toContain('Created task');

    // Wait for background task execution
    await new Promise(resolve => setTimeout(resolve, 100));

    const tasks = await readTasks();
    const task = tasks[tasks.length - 1];
    expect(task.status).toBe('completed');
  });

  it('should create enhancement search task for unclear instructions', async () => {
    const instructions = 'Tell me a joke';

    const result = await millaAgent.execute(instructions);

    expect(result).toContain('fallback enhancement search');

    const tasks = await readTasks();
    const task = tasks[tasks.length - 1];
    expect(task).toBeTruthy();
    expect(task.agent).toBe('enhancement');
    expect(task.action).toBe('search');
  });
});

describe('Task Approval Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writeTasks([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should block execution of unapproved high-safety tasks', async () => {
    const mockAgent = { name: 'TestAgent', description: 'Test', handleTask: vi.fn().mockResolvedValue({ success: true }) };
    vi.spyOn(registry, 'getAgent').mockReturnValue(mockAgent as any);

    // Create task requiring approval
    const task: AgentTask = {
      taskId: uuidv4(),
      supervisor: 'MillaAgent',
      agent: 'TestAgent',
      action: 'dangerous_action',
      payload: { data: 'test' },
      metadata: { requireUserApproval: true, safety_level: 'high' },
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const tasks = await readTasks();
    tasks.push(task);
    await writeTasks(tasks);

    // Try to run without approval - should fail
    await expect(runTask(task)).rejects.toThrow('requires user approval');

    const updatedTask = await getTask(task.taskId);
    expect(updatedTask?.status).toBe('failed');
  });

  it('should allow execution after approval', async () => {
    const mockAgent = { name: 'TestAgent', description: 'Test', handleTask: vi.fn().mockResolvedValue({ success: true }) };
    vi.spyOn(registry, 'getAgent').mockReturnValue(mockAgent as any);

    // Create task requiring approval
    const task: AgentTask = {
      taskId: uuidv4(),
      supervisor: 'MillaAgent',
      agent: 'TestAgent',
      action: 'dangerous_action',
      payload: { data: 'test' },
      metadata: { requireUserApproval: true, safety_level: 'high' },
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const tasks = await readTasks();
    tasks.push(task);
    await writeTasks(tasks);

    // Approve the task first
    const approvedTask = await updateTask(task.taskId, {
      metadata: { ...task.metadata, approved: true }
    });

    // Now run should succeed
    await runTask(approvedTask!);

    const updatedTask = await getTask(task.taskId);
    expect(updatedTask?.status).toBe('completed');
    expect(mockAgent.handleTask).toHaveBeenCalled();
  });
});

describe('Audit Log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear audit log
    if (fs.existsSync('./memory/agent_audit.log')) {
      fs.writeFileSync('./memory/agent_audit.log', '');
    }
  });

  it('should log task lifecycle events', async () => {
    await logAuditEvent('test-task-1', 'EmailAgent', 'draft', 'started');
    await logAuditEvent('test-task-1', 'EmailAgent', 'draft', 'completed', 'Email drafted successfully');

    const trail = await getTaskAuditTrail('test-task-1');

    expect(trail.length).toBe(2);
    expect(trail[0]).toContain('started');
    expect(trail[1]).toContain('completed');
    expect(trail[1]).toContain('Email drafted successfully');
  });

  it('should filter audit trail by task ID', async () => {
    await logAuditEvent('task-a', 'EmailAgent', 'draft', 'started');
    await logAuditEvent('task-b', 'CalendarAgent', 'create_event', 'started');
    await logAuditEvent('task-a', 'EmailAgent', 'draft', 'completed');

    const trailA = await getTaskAuditTrail('task-a');
    const trailB = await getTaskAuditTrail('task-b');

    expect(trailA.length).toBe(2);
    expect(trailB.length).toBe(1);
    expect(trailA[0]).toContain('task-a');
    expect(trailB[0]).toContain('task-b');
  });

  it('should log approval and rejection events', async () => {
    // Use 'created' status for approval simulation (or could use 'completed' with details)
    await logAuditEvent('test-task-2', 'TestAgent', 'action', 'created', 'User approved task');
    await logAuditEvent('test-task-3', 'TestAgent', 'action', 'cancelled', 'User rejected: too risky');

    const approvalTrail = await getTaskAuditTrail('test-task-2');
    const rejectionTrail = await getTaskAuditTrail('test-task-3');

    expect(approvalTrail[0]).toContain('created');
    expect(approvalTrail[0]).toContain('User approved task');
    expect(rejectionTrail[0]).toContain('cancelled');
    expect(rejectionTrail[0]).toContain('too risky');
  });
});
