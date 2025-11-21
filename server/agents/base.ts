/**
 * Base Agent Interface - Mandatory abstract class for all agents
 * Provides standardized logging, error handling, and execution patterns
 */

export interface Agent {
  name: string;
  description: string;
  execute(task: string): Promise<string>;
}

export interface AgentExecutionContext {
  taskId: string;
  userId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface AgentExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  logs?: string[];
  executionTime?: number;
}

/**
 * Abstract Base Agent Class
 * All agents MUST extend this class for standardized behavior
 */
export abstract class BaseAgent implements Agent {
  public readonly name: string;
  public readonly description: string;
  protected logs: string[] = [];

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }

  /**
   * Protected logging method for agent operations
   */
  protected log(
    message: string,
    level: 'info' | 'warn' | 'error' = 'info'
  ): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${this.name}] [${level.toUpperCase()}] ${message}`;
    this.logs.push(logEntry);

    // Also log to console with appropriate level
    switch (level) {
      case 'error':
        console.error(logEntry);
        break;
      case 'warn':
        console.warn(logEntry);
        break;
      default:
        console.log(logEntry);
    }
  }

  /**
   * Protected error handler with standardized logging
   */
  protected handleError(error: Error, context: string): AgentExecutionResult {
    const errorMessage = `Error in ${context}: ${error.message}`;
    this.log(errorMessage, 'error');
    this.log(`Stack trace: ${error.stack}`, 'error');

    return {
      success: false,
      error: errorMessage,
      logs: [...this.logs],
    };
  }

  /**
   * Get agent execution logs
   */
  public getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * Clear agent logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Abstract execute method - must be implemented by all agents
   * Wraps execution with timing and standardized error handling
   */
  public async execute(task: string): Promise<string> {
    const startTime = Date.now();
    this.clearLogs();
    this.log(`Starting execution for task: ${task.substring(0, 100)}...`);

    try {
      const result = await this.executeInternal(task);
      const executionTime = Date.now() - startTime;
      this.log(`Execution completed successfully in ${executionTime}ms`);
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.log(`Execution failed after ${executionTime}ms`, 'error');

      // P2.4: Report failure to SCPA for self-correction
      try {
        const { reportAgentFailure } = await import('../metacognitiveService');
        await reportAgentFailure(error as Error, {
          agentName: this.name,
          taskId: `task_${Date.now()}`,
          attemptCount: 1,
          taskContext: { task, executionTime },
        });
      } catch (reportError) {
        console.error('Failed to report agent failure to SCPA:', reportError);
      }

      throw error;
    }
  }

  /**
   * Abstract internal execute method - MUST be implemented by subclasses
   */
  protected abstract executeInternal(task: string): Promise<string>;

  /**
   * Optional lifecycle hook - called before execution
   */
  protected async beforeExecute(context: AgentExecutionContext): Promise<void> {
    // Default implementation does nothing
    // Subclasses can override for initialization
  }

  /**
   * Optional lifecycle hook - called after execution
   */
  protected async afterExecute(result: AgentExecutionResult): Promise<void> {
    // Default implementation does nothing
    // Subclasses can override for cleanup
  }
}
