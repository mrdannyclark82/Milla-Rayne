import { Agent } from './agents/base';

class AgentController {
  private agents: Map<string, Agent> = new Map();

  registerAgent(agent: Agent) {
    this.agents.set(agent.name, agent);
  }

  async dispatch(agentName: string, task: string): Promise<string> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      return `Agent '${agentName}' not found.`;
    }
    return agent.execute(task);
  }
}

export const agentController = new AgentController();
