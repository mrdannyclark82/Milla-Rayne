import type {
  ExternalAgentCommand,
  ExternalAgentResponse,
} from '../shared/schema';
import {
  processFinanceCommand,
  getFinanceAgentStatus,
} from './externalFinanceAgent';
import { agentController } from './agentController';
import {
  getAgent as getRegistryAgent,
  listAgents as listRegistryAgents,
} from './agents/registry';
import type { AgentTask } from './agents/taskStorage';

/**
 * Agent Communication Service
 *
 * Routes commands to real registered agents when possible.
 * Bridges agentController (BaseAgent) + agents/registry (handleTask).
 * No mock success theater for unwired targets.
 */

/** External-facing names → agentController short names */
const CONTROLLER_NAME_MAP: Record<string, string> = {
  CodingAgent: 'coding',
  coding: 'coding',
  EnhancementAgent: 'enhancement',
  enhancement: 'enhancement',
  MillaAgent: 'milla',
  milla: 'milla',
  ImageAgent: 'image',
  image: 'image',
  imageGeneration: 'image',
};

/** External-facing / short names → agents/registry PascalCase names */
const REGISTRY_NAME_MAP: Record<string, string> = {
  CalendarAgent: 'CalendarAgent',
  calendar: 'CalendarAgent',
  TasksAgent: 'TasksAgent',
  tasks: 'TasksAgent',
  EmailAgent: 'EmailAgent',
  email: 'EmailAgent',
  YouTubeAgent: 'YouTubeAgent',
  youtube: 'YouTubeAgent',
  CodingAgent: 'CodingAgent',
  coding: 'CodingAgent',
};

const allowedAgents = [
  'FinanceAgent',
  'HealthAgent',
  'TravelAgent',
  'SmartHomeAgent',
  'CalendarAgent',
  'TasksAgent',
  'EmailAgent',
  'YouTubeAgent',
  'CodingAgent',
  'EnhancementAgent',
  'MillaAgent',
  'ImageAgent',
  'TestAgent',
  'CustomAgent',
  'calendar',
  'tasks',
  'email',
  'youtube',
  'coding',
  'enhancement',
  'milla',
  'image',
];

function listWiredAgents(): string[] {
  const controller = agentController.getRegisteredAgents();
  const registry = listRegistryAgents().map((a) => a.name);
  return Array.from(new Set([...controller, ...registry]));
}

/**
 * Dispatch a command to an external or local AI agent system
 */
export async function dispatchExternalCommand(
  command: ExternalAgentCommand
): Promise<ExternalAgentResponse> {
  const startTime = Date.now();

  if (!allowedAgents.includes(command.target)) {
    console.warn(
      `[AgentComms] ⚠️ Unauthorized agent target: ${command.target}`
    );
    return {
      success: false,
      statusCode: 'UNAUTHORIZED',
      data: null,
      metadata: {
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        agentVersion: '1.0.0',
      },
      error: {
        code: 'UNAUTHORIZED_AGENT',
        message: `Agent target '${command.target}' is not in the approved whitelist`,
      },
    };
  }

  console.log('[AgentComms] Dispatching command:', {
    target: command.target,
    command: command.command,
    args: Object.keys(command.args || {}),
    priority: command.metadata?.priority || 'medium',
  });

  try {
    if (command.target === 'FinanceAgent') {
      return await processFinanceCommand(command);
    }

    // Path 1: BaseAgent via agentController
    const controllerName =
      CONTROLLER_NAME_MAP[command.target] ||
      (agentController.getAgent(command.target) ? command.target : undefined);
    if (controllerName && agentController.getAgent(controllerName)) {
      const taskText = [
        command.command,
        command.args && Object.keys(command.args).length
          ? JSON.stringify(command.args)
          : '',
      ]
        .filter(Boolean)
        .join(' ');

      const result = await agentController.dispatch(controllerName, taskText, {
        metadata: {
          externalCommand: command.command,
          args: command.args,
          source: 'agentComms',
        },
      });

      return {
        success: true,
        statusCode: 'OK',
        data: { result, agent: controllerName, via: 'agentController' },
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          agentVersion: '1.0.0-local',
        },
      };
    }

    // Path 2: handleTask agents (Calendar, Tasks, Email, YouTube, Coding registry)
    const registryName =
      REGISTRY_NAME_MAP[command.target] || command.target;
    const registryAgent = getRegistryAgent(registryName);
    if (registryAgent) {
      const task: AgentTask = {
        taskId: `comms_${Date.now()}`,
        supervisor: 'agentComms',
        agent: registryName,
        action: command.command,
        payload: command.args || {},
        metadata: {
          ...(command.metadata || {}),
          source: 'agentComms',
        },
        status: 'in_progress',
        createdAt: new Date().toISOString(),
      };

      const result = await registryAgent.handleTask(task);

      return {
        success: true,
        statusCode: 'OK',
        data: { result, agent: registryName, via: 'registry' },
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          agentVersion: '1.0.0-registry',
        },
      };
    }

    const executionTime = Date.now() - startTime;
    const wired = listWiredAgents();
    console.warn('[AgentComms] No real backend for agent:', {
      target: command.target,
      command: command.command,
      wired,
    });

    return {
      success: false,
      statusCode: 'NOT_IMPLEMENTED',
      error: {
        code: 'AGENT_NOT_WIRED',
        message: `Agent "${command.target}" has no real backend. Wired agents: ${wired.join(', ') || 'none'}`,
        details: { command: command.command, args: command.args },
      },
      metadata: {
        executionTime,
        timestamp: new Date().toISOString(),
        agentVersion: '1.0.0-honest',
      },
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    console.error('[AgentComms] Command execution failed:', {
      target: command.target,
      command: command.command,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      statusCode: 'ERROR',
      error: {
        code: 'EXECUTION_FAILED',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
        details: error,
      },
      metadata: {
        executionTime,
        timestamp: new Date().toISOString(),
        agentVersion: '1.0.0',
      },
    };
  }
}

export function validateExternalCommand(
  command: ExternalAgentCommand
): boolean {
  if (!command.target || command.target.trim().length === 0) {
    throw new Error('Command target is required');
  }

  if (!command.command || command.command.trim().length === 0) {
    throw new Error('Command name is required');
  }

  if (!command.args || typeof command.args !== 'object') {
    throw new Error('Command args must be an object');
  }

  return true;
}

export async function getAgentStatus(targetAgent: string): Promise<{
  available: boolean;
  version: string;
  latency?: number;
}> {
  console.log(`[AgentComms] Checking status of agent: ${targetAgent}`);

  if (targetAgent === 'FinanceAgent') {
    try {
      const status = getFinanceAgentStatus();
      return {
        available: status.available,
        version: status.version,
        latency: 10,
      };
    } catch (error) {
      console.error(`[AgentComms] Error getting FinanceAgent status:`, error);
      return {
        available: false,
        version: 'unknown',
        latency: undefined,
      };
    }
  }

  const controllerName =
    CONTROLLER_NAME_MAP[targetAgent] || targetAgent;
  if (agentController.getAgent(controllerName)) {
    return {
      available: true,
      version: '1.0.0-local',
      latency: 5,
    };
  }

  const registryName = REGISTRY_NAME_MAP[targetAgent] || targetAgent;
  if (getRegistryAgent(registryName)) {
    return {
      available: true,
      version: '1.0.0-registry',
      latency: 5,
    };
  }

  return {
    available: false,
    version: 'unwired',
    latency: undefined,
  };
}
