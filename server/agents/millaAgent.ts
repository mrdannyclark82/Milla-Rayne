import { Agent } from './base';
import { v4 as uuidv4 } from 'uuid';
import { addTask } from './taskStorage';
import { runTask } from './worker';

/**
 * MillaAgent - Supervisor agent that can create and dispatch domain agent tasks.
 * This is a lightweight supervisor implementation used by the server when a
 * higher-level instruction is sent to 'milla' via the simple agentController.
 */
class MillaAgent implements Agent {
  name = 'milla';
  description = 'Supervisor agent that orchestrates domain agents and task creation.';

  async execute(task: string): Promise<string> {
    // Task may be a JSON string describing a domain task. Try to parse it.
    let parsed: any = null;
    try {
      parsed = JSON.parse(task);
    } catch (err) {
      // Not JSON - treat as a natural language instruction. Try a simple parsing heuristic.
      parsed = { instruction: task };
    }

    // If the instruction is a direct domain task, transform into AgentTask
    // Expected shape: { agent: "YouTubeAgent", action: "analyze_video", payload: { url: "..." }, metadata: {} }
    if (parsed && parsed.agent && parsed.action) {
      const agentTask = {
        taskId: uuidv4(),
        supervisor: 'MillaAgent',
        agent: parsed.agent,
        action: parsed.action,
        payload: parsed.payload || {},
        metadata: parsed.metadata || { safety_level: 'low' },
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any;

      await addTask(agentTask);

      // Optionally auto-run low-safety tasks immediately
      if ((agentTask.metadata && agentTask.metadata.autoRun) || agentTask.metadata.safety_level === 'low') {
        // Fire-and-forget
        runTask(agentTask).catch((err) => console.error('MillaAgent runTask error:', err));
      }

      return `Created task ${agentTask.taskId} for agent ${agentTask.agent}`;
    }

    // Fallback: create a generic enhancement task for human review
    const fallback = {
      taskId: uuidv4(),
      supervisor: 'MillaAgent',
      agent: 'enhancement',
      action: 'search',
      payload: { query: parsed.instruction || String(task) },
      metadata: { safety_level: 'low' },
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;

    await addTask(fallback);
    runTask(fallback).catch((err) => console.error('MillaAgent runTask error:', err));

    return `Created fallback enhancement search task ${fallback.taskId}`;
  }
}

export const millaAgent = new MillaAgent();

export default millaAgent;
