import {
  Agent,
  BaseAgent,
  AgentExecutionResult,
  AgentExecutionContext,
} from './agents/base';

/**
 * Agent Controller - Manages agent registration and dispatch
 * Enforces BaseAgent interface usage for operational stability
 */
class AgentController {
  private agents: Map<string, BaseAgent> = new Map();
  private executionMetrics: Map<
    string,
    { successCount: number; failureCount: number; avgTime: number }
  > = new Map();

  /**
   * Register an agent (must extend BaseAgent)
   */
  registerAgent(agent: BaseAgent) {
    if (!(agent instanceof BaseAgent)) {
      throw new Error(`Agent '${agent.name}' must extend BaseAgent class`);
    }

    this.agents.set(agent.name, agent);
    this.executionMetrics.set(agent.name, {
      successCount: 0,
      failureCount: 0,
      avgTime: 0,
    });
    console.log(`✅ Agent registered: ${agent.name} - ${agent.description}`);
  }

  /**
   * Dispatch task to agent with proper error handling and metrics
   */
  async dispatch(
    agentName: string,
    task: string,
    context?: Partial<AgentExecutionContext>
  ): Promise<string> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(
        `Agent '${agentName}' not found. Available agents: ${Array.from(this.agents.keys()).join(', ')}`
      );
    }

    const startTime = Date.now();
    const executionContext: AgentExecutionContext = {
      taskId: context?.taskId || `task_${Date.now()}`,
      userId: context?.userId || 'default-user',
      timestamp: Date.now(),
      metadata: context?.metadata,
    };

    try {
      // Execute agent with context
      const result = await agent.execute(task);

      // Update metrics
      const executionTime = Date.now() - startTime;
      this.updateMetrics(agentName, true, executionTime);

      console.log(
        `✅ Agent '${agentName}' completed task in ${executionTime}ms`
      );
      return result;
    } catch (error) {
      // Update failure metrics
      const executionTime = Date.now() - startTime;
      this.updateMetrics(agentName, false, executionTime);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `❌ Agent '${agentName}' failed after ${executionTime}ms: ${errorMessage}`
      );

      // Re-throw with agent context
      throw new Error(`Agent '${agentName}' execution failed: ${errorMessage}`);
    }
  }

  /**
   * Update agent execution metrics
   */
  private updateMetrics(
    agentName: string,
    success: boolean,
    executionTime: number
  ): void {
    const metrics = this.executionMetrics.get(agentName);
    if (!metrics) return;

    if (success) {
      metrics.successCount++;
    } else {
      metrics.failureCount++;
    }

    // Update average execution time (exponential moving average)
    metrics.avgTime =
      metrics.avgTime === 0
        ? executionTime
        : metrics.avgTime * 0.8 + executionTime * 0.2;

    this.executionMetrics.set(agentName, metrics);
  }

  /**
   * Get agent metrics for monitoring
   */
  getAgentMetrics(agentName: string) {
    return this.executionMetrics.get(agentName);
  }

  /**
   * Get all registered agents
   */
  getRegisteredAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Get agent by name
   */
  getAgent(agentName: string): BaseAgent | undefined {
    return this.agents.get(agentName);
  }

  /**
   * Get all metrics for monitoring dashboard
   */
  getAllMetrics() {
    const allMetrics: Record<string, any> = {};
    this.executionMetrics.forEach((metrics, agentName) => {
      allMetrics[agentName] = {
        ...metrics,
        successRate:
          metrics.successCount + metrics.failureCount > 0
            ? (
                (metrics.successCount /
                  (metrics.successCount + metrics.failureCount)) *
                100
              ).toFixed(2) + '%'
            : 'N/A',
      };
    });
    return allMetrics;
  }
}

export const agentController = new AgentController();
