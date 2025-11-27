import { AgentTask } from './taskStorage';

export interface AgentDefinition {
  name: string;
  description?: string;
  handleTask: (task: AgentTask) => Promise<any>;
}

export interface ExternalAgentDefinition {
  name: string;
  description?: string;
  endpoint?: string; // For remote agents
  type: 'local' | 'remote';
  version?: string;
}

const registry = new Map<string, AgentDefinition>();
const externalRegistry = new Map<string, ExternalAgentDefinition>();

export function registerAgent(def: AgentDefinition) {
  registry.set(def.name, def);
}

export function getAgent(name: string): AgentDefinition | undefined {
  return registry.get(name);
}

export function listAgents(): AgentDefinition[] {
  return Array.from(registry.values());
}

/**
 * Register an external agent
 */
export function registerExternalAgent(def: ExternalAgentDefinition) {
  externalRegistry.set(def.name, def);
  console.log(
    `[Registry] Registered external agent: ${def.name} (${def.type})`
  );
}

/**
 * Get an external agent definition
 */
export function getExternalAgent(
  name: string
): ExternalAgentDefinition | undefined {
  return externalRegistry.get(name);
}

/**
 * List all external agents
 */
export function listExternalAgents(): ExternalAgentDefinition[] {
  return Array.from(externalRegistry.values());
}

/**
 * Check if an agent is external
 */
export function isExternalAgent(name: string): boolean {
  return externalRegistry.has(name);
}
