import { AgentTask } from './taskStorage';

export interface AgentDefinition {
  name: string;
  description?: string;
  handleTask: (task: AgentTask) => Promise<any>;
}

const registry = new Map<string, AgentDefinition>();

export function registerAgent(def: AgentDefinition) {
  registry.set(def.name, def);
}

export function getAgent(name: string): AgentDefinition | undefined {
  return registry.get(name);
}

export function listAgents(): AgentDefinition[] {
  return Array.from(registry.values());
}
