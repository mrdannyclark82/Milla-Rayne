/**
 * External Finance Agent Service
 *
 * This is a minimal external agent service that demonstrates the A2A (Agent-to-Agent)
 * protocol communication. This agent can be deployed separately and communicated with
 * via the agentCommsService.
 *
 * Key Features:
 * - Handles finance-related commands (balance queries, transactions, budgets)
 * - Implements the ExternalAgentCommand protocol
 * - Provides mock financial data for demonstration
 * - Can be extended to integrate with real financial APIs
 */

import type {
  ExternalAgentCommand,
  ExternalAgentResponse,
} from '../shared/schema';

/**
 * Finance Agent - External Agent Service
 *
 * This agent handles financial operations and queries.
 */
export class FinanceAgent {
  private readonly agentName = 'FinanceAgent';
  private readonly version = '1.0.0';

  // Mock financial data storage
  private accountBalances = new Map<string, number>([
    ['checking', 1500.5],
    ['savings', 5240.75],
    ['investment', 12350.0],
  ]);

  private transactionHistory = new Map<
    string,
    Array<{
      id: string;
      date: string;
      amount: number;
      type: 'debit' | 'credit';
      description: string;
    }>
  >();

  private budgets = new Map<
    string,
    {
      category: string;
      limit: number;
      spent: number;
      period: 'monthly' | 'weekly';
    }
  >();

  constructor() {
    this.initializeMockData();
    console.log(
      `[${this.agentName}] Finance Agent initialized (v${this.version})`
    );
  }

  /**
   * Initialize mock data for demonstration
   */
  private initializeMockData(): void {
    // Mock transaction history
    this.transactionHistory.set('checking', [
      {
        id: 'tx_001',
        date: '2025-01-10',
        amount: -45.5,
        type: 'debit',
        description: 'Grocery Store',
      },
      {
        id: 'tx_002',
        date: '2025-01-09',
        amount: 2500.0,
        type: 'credit',
        description: 'Salary Deposit',
      },
      {
        id: 'tx_003',
        date: '2025-01-08',
        amount: -120.0,
        type: 'debit',
        description: 'Restaurant',
      },
    ]);

    // Mock budgets
    this.budgets.set('groceries', {
      category: 'groceries',
      limit: 500,
      spent: 245.5,
      period: 'monthly',
    });

    this.budgets.set('entertainment', {
      category: 'entertainment',
      limit: 200,
      spent: 120.0,
      period: 'monthly',
    });
  }

  /**
   * Process an external command
   *
   * @param command - The external agent command
   * @returns Promise resolving to the agent's response
   */
  async processCommand(
    command: ExternalAgentCommand
  ): Promise<ExternalAgentResponse> {
    const startTime = Date.now();

    console.log(`[${this.agentName}] Processing command: ${command.command}`);

    try {
      let data: any = null;

      switch (command.command) {
        case 'GET_BALANCE':
          data = this.handleGetBalance(command.args);
          break;

        case 'GET_TRANSACTIONS':
          data = this.handleGetTransactions(command.args);
          break;

        case 'GET_BUDGET':
          data = this.handleGetBudget(command.args);
          break;

        case 'CREATE_TRANSACTION':
          data = this.handleCreateTransaction(command.args);
          break;

        case 'UPDATE_BUDGET':
          data = this.handleUpdateBudget(command.args);
          break;

        case 'GET_FINANCIAL_SUMMARY':
          data = this.handleGetFinancialSummary(command.args);
          break;

        default:
          throw new Error(`Unknown command: ${command.command}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        statusCode: 'OK',
        data,
        metadata: {
          executionTime,
          timestamp: new Date().toISOString(),
          agentVersion: this.version,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      console.error(`[${this.agentName}] Error processing command:`, error);

      return {
        success: false,
        statusCode: 'ERROR',
        error: {
          code: 'COMMAND_EXECUTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
        metadata: {
          executionTime,
          timestamp: new Date().toISOString(),
          agentVersion: this.version,
        },
      };
    }
  }

  /**
   * Handle GET_BALANCE command
   */
  private handleGetBalance(args: Record<string, any>): any {
    const account = args.account || 'checking';
    const balance = this.accountBalances.get(account);

    if (balance === undefined) {
      throw new Error(`Account not found: ${account}`);
    }

    return {
      account,
      balance,
      currency: 'USD',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Handle GET_TRANSACTIONS command
   */
  private handleGetTransactions(args: Record<string, any>): any {
    const account = args.account || 'checking';
    const limit = args.limit || 10;

    const transactions = this.transactionHistory.get(account) || [];

    return {
      account,
      transactions: transactions.slice(0, limit),
      totalCount: transactions.length,
    };
  }

  /**
   * Handle GET_BUDGET command
   */
  private handleGetBudget(args: Record<string, any>): any {
    const category = args.category;

    if (!category) {
      // Return all budgets
      return {
        budgets: Array.from(this.budgets.values()),
      };
    }

    const budget = this.budgets.get(category);

    if (!budget) {
      throw new Error(`Budget category not found: ${category}`);
    }

    return {
      ...budget,
      remaining: budget.limit - budget.spent,
      percentUsed: (budget.spent / budget.limit) * 100,
    };
  }

  /**
   * Handle CREATE_TRANSACTION command
   */
  private handleCreateTransaction(args: Record<string, any>): any {
    const { account, amount, type, description } = args;

    if (!account || amount === undefined || !type || !description) {
      throw new Error('Missing required transaction parameters');
    }

    // Update account balance
    const currentBalance = this.accountBalances.get(account) || 0;
    const newBalance =
      type === 'credit' ? currentBalance + amount : currentBalance - amount;

    this.accountBalances.set(account, newBalance);

    // Add to transaction history
    const transaction = {
      id: `tx_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: type === 'debit' ? -Math.abs(amount) : Math.abs(amount),
      type,
      description,
    };

    const transactions = this.transactionHistory.get(account) || [];
    transactions.unshift(transaction);
    this.transactionHistory.set(account, transactions);

    return {
      transaction,
      newBalance,
    };
  }

  /**
   * Handle UPDATE_BUDGET command
   */
  private handleUpdateBudget(args: Record<string, any>): any {
    const { category, limit, spent, period } = args;

    if (!category) {
      throw new Error('Budget category is required');
    }

    const existingBudget = this.budgets.get(category);

    const updatedBudget = {
      category,
      limit: limit !== undefined ? limit : existingBudget?.limit || 0,
      spent: spent !== undefined ? spent : existingBudget?.spent || 0,
      period: period || existingBudget?.period || 'monthly',
    };

    this.budgets.set(category, updatedBudget);

    return {
      budget: updatedBudget,
      updated: true,
    };
  }

  /**
   * Handle GET_FINANCIAL_SUMMARY command
   */
  private handleGetFinancialSummary(args: Record<string, any>): any {
    // Calculate total balance
    let totalBalance = 0;
    const accountSummaries: any[] = [];

    for (const [account, balance] of this.accountBalances.entries()) {
      totalBalance += balance;
      accountSummaries.push({
        account,
        balance,
        currency: 'USD',
      });
    }

    // Calculate budget summary
    let totalBudget = 0;
    let totalSpent = 0;
    const budgetSummaries: any[] = [];

    for (const budget of this.budgets.values()) {
      totalBudget += budget.limit;
      totalSpent += budget.spent;
      budgetSummaries.push({
        category: budget.category,
        limit: budget.limit,
        spent: budget.spent,
        remaining: budget.limit - budget.spent,
        percentUsed: (budget.spent / budget.limit) * 100,
      });
    }

    return {
      totalBalance,
      accounts: accountSummaries,
      budgets: {
        total: totalBudget,
        spent: totalSpent,
        remaining: totalBudget - totalSpent,
        categories: budgetSummaries,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get agent status
   */
  getStatus(): {
    name: string;
    version: string;
    available: boolean;
    uptime: number;
  } {
    return {
      name: this.agentName,
      version: this.version,
      available: true,
      uptime: process.uptime(),
    };
  }
}

// Singleton instance
const financeAgent = new FinanceAgent();

/**
 * Process a command using the Finance Agent
 *
 * @param command - The external agent command
 * @returns Promise resolving to the agent's response
 */
export async function processFinanceCommand(
  command: ExternalAgentCommand
): Promise<ExternalAgentResponse> {
  return financeAgent.processCommand(command);
}

/**
 * Get Finance Agent status
 */
export function getFinanceAgentStatus() {
  return financeAgent.getStatus();
}
