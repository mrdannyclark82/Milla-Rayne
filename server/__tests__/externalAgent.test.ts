import { describe, it, expect, beforeAll } from 'vitest';
import { processFinanceCommand, getFinanceAgentStatus } from '../externalFinanceAgent';
import { dispatchExternalCommand, getAgentStatus } from '../agentCommsService';
import { registerExternalAgent, getExternalAgent, listExternalAgents, isExternalAgent } from '../agents/registry';
import type { ExternalAgentCommand } from '../../shared/schema';

describe('External Agent Communication - Finance Agent', () => {
  beforeAll(() => {
    // Register the Finance Agent in the registry
    registerExternalAgent({
      name: 'FinanceAgent',
      description: 'Handles financial operations and queries',
      type: 'local',
      version: '1.0.0',
    });
  });

  describe('Finance Agent Direct Communication', () => {
    it('should process GET_BALANCE command', async () => {
      const command: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_BALANCE',
        args: { account: 'checking' },
      };

      const response = await processFinanceCommand(command);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe('OK');
      expect(response.data).toBeDefined();
      expect(response.data.account).toBe('checking');
      expect(response.data.balance).toBe(1500.50);
      expect(response.data.currency).toBe('USD');
    });

    it('should process GET_TRANSACTIONS command', async () => {
      const command: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_TRANSACTIONS',
        args: { account: 'checking', limit: 5 },
      };

      const response = await processFinanceCommand(command);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.account).toBe('checking');
      expect(response.data.transactions).toBeDefined();
      expect(Array.isArray(response.data.transactions)).toBe(true);
    });

    it('should process GET_BUDGET command', async () => {
      const command: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_BUDGET',
        args: { category: 'groceries' },
      };

      const response = await processFinanceCommand(command);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.category).toBe('groceries');
      expect(response.data.limit).toBeDefined();
      expect(response.data.spent).toBeDefined();
      expect(response.data.remaining).toBeDefined();
    });

    it('should process CREATE_TRANSACTION command', async () => {
      const command: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'CREATE_TRANSACTION',
        args: {
          account: 'checking',
          amount: 50.00,
          type: 'debit',
          description: 'Test Transaction',
        },
      };

      const response = await processFinanceCommand(command);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.transaction).toBeDefined();
      expect(response.data.newBalance).toBeDefined();
    });

    it('should process GET_FINANCIAL_SUMMARY command', async () => {
      const command: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_FINANCIAL_SUMMARY',
        args: {},
      };

      const response = await processFinanceCommand(command);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.totalBalance).toBeDefined();
      expect(response.data.accounts).toBeDefined();
      expect(response.data.budgets).toBeDefined();
    });

    it('should handle errors for unknown commands', async () => {
      const command: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'UNKNOWN_COMMAND',
        args: {},
      };

      const response = await processFinanceCommand(command);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe('ERROR');
      expect(response.error).toBeDefined();
      expect(response.error?.message).toContain('Unknown command');
    });

    it('should return agent status', () => {
      const status = getFinanceAgentStatus();

      expect(status).toBeDefined();
      expect(status.name).toBe('FinanceAgent');
      expect(status.version).toBe('1.0.0');
      expect(status.available).toBe(true);
      expect(status.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('A2A Protocol Integration via AgentCommsService', () => {
    it('should dispatch command to Finance Agent through dispatcher', async () => {
      const command: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_BALANCE',
        args: { account: 'savings' },
      };

      const response = await dispatchExternalCommand(command);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.account).toBe('savings');
      expect(response.data.balance).toBe(5240.75);
    });

    it('should handle finance transactions through dispatcher', async () => {
      const command: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_TRANSACTIONS',
        args: { account: 'checking' },
      };

      const response = await dispatchExternalCommand(command);

      expect(response.success).toBe(true);
      expect(response.data.transactions).toBeDefined();
    });

    it('should get agent status through dispatcher', async () => {
      const status = await getAgentStatus('FinanceAgent');

      expect(status).toBeDefined();
      expect(status.available).toBe(true);
      expect(status.version).toBe('1.0.0');
      expect(status.latency).toBeDefined();
    });

    it('should handle complex financial queries', async () => {
      const command: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_FINANCIAL_SUMMARY',
        args: {},
        metadata: {
          priority: 'high',
          timeout: 5000,
        },
      };

      const response = await dispatchExternalCommand(command);

      expect(response.success).toBe(true);
      expect(response.data.totalBalance).toBeGreaterThan(0);
      expect(response.data.accounts.length).toBeGreaterThan(0);
      expect(response.data.budgets).toBeDefined();
    });
  });

  describe('External Agent Registry', () => {
    it('should retrieve registered Finance Agent from registry', () => {
      const agent = getExternalAgent('FinanceAgent');

      expect(agent).toBeDefined();
      expect(agent?.name).toBe('FinanceAgent');
      expect(agent?.type).toBe('local');
      expect(agent?.description).toContain('financial');
    });

    it('should list all external agents', () => {
      const agents = listExternalAgents();

      expect(agents.length).toBeGreaterThan(0);
      expect(agents.some(a => a.name === 'FinanceAgent')).toBe(true);
    });

    it('should identify Finance Agent as external', () => {
      expect(isExternalAgent('FinanceAgent')).toBe(true);
    });

    it('should return undefined for non-existent external agent', () => {
      const agent = getExternalAgent('NonExistentAgent');

      expect(agent).toBeUndefined();
    });
  });

  describe('End-to-End Scenarios', () => {
    it('should complete a full financial workflow', async () => {
      // 1. Check agent status
      const status = await getAgentStatus('FinanceAgent');
      expect(status.available).toBe(true);

      // 2. Get initial balance
      const balanceCmd: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_BALANCE',
        args: { account: 'checking' },
      };
      const balanceResponse = await dispatchExternalCommand(balanceCmd);
      expect(balanceResponse.success).toBe(true);
      const initialBalance = balanceResponse.data.balance;

      // 3. Create a transaction
      const transactionCmd: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'CREATE_TRANSACTION',
        args: {
          account: 'checking',
          amount: 100,
          type: 'credit',
          description: 'Test deposit',
        },
      };
      const transactionResponse = await dispatchExternalCommand(transactionCmd);
      expect(transactionResponse.success).toBe(true);
      expect(transactionResponse.data.newBalance).toBe(initialBalance + 100);

      // 4. Get updated balance
      const updatedBalanceResponse = await dispatchExternalCommand(balanceCmd);
      expect(updatedBalanceResponse.data.balance).toBe(initialBalance + 100);

      // 5. Get financial summary
      const summaryCmd: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_FINANCIAL_SUMMARY',
        args: {},
      };
      const summaryResponse = await dispatchExternalCommand(summaryCmd);
      expect(summaryResponse.success).toBe(true);
      expect(summaryResponse.data.totalBalance).toBeGreaterThan(initialBalance);
    });

    it('should handle budget management workflow', async () => {
      // 1. Get current budget
      const getBudgetCmd: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_BUDGET',
        args: { category: 'entertainment' },
      };
      const budgetResponse = await dispatchExternalCommand(getBudgetCmd);
      expect(budgetResponse.success).toBe(true);
      const initialSpent = budgetResponse.data.spent;

      // 2. Update budget
      const updateBudgetCmd: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'UPDATE_BUDGET',
        args: {
          category: 'entertainment',
          limit: 300,
          spent: initialSpent + 50,
        },
      };
      const updateResponse = await dispatchExternalCommand(updateBudgetCmd);
      expect(updateResponse.success).toBe(true);
      expect(updateResponse.data.budget.limit).toBe(300);
      expect(updateResponse.data.budget.spent).toBe(initialSpent + 50);
    });
  });
});
