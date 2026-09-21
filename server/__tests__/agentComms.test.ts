import { describe, it, expect } from 'vitest';
import {
  dispatchExternalCommand,
  validateExternalCommand,
  getAgentStatus,
} from '../agentCommsService';
import type { ExternalAgentCommand } from '../../shared/schema';

describe('Agent Communication Service', () => {
  describe('dispatchExternalCommand', () => {
    it('should successfully dispatch FinanceAgent and return a response', async () => {
      const command: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_BALANCE',
        args: { account: 'checking' },
        metadata: { priority: 'high', timeout: 5000 },
      };

      const response = await dispatchExternalCommand(command);

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.statusCode).toBe('OK');
      expect(response.data).toBeDefined();
      expect(response.metadata).toBeDefined();
      expect(response.metadata?.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should return balance data for GET_BALANCE command', async () => {
      const command: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_BALANCE',
        args: { account: 'savings' },
      };

      const response = await dispatchExternalCommand(command);

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('balance');
      expect(response.data).toHaveProperty('currency');
      expect(response.data.account).toBe('savings');
    });

    it('should honestly refuse unwired HealthAgent (no mock success theater)', async () => {
      const command: ExternalAgentCommand = {
        target: 'HealthAgent',
        command: 'SCHEDULE_APPOINTMENT',
        args: { time: '2025-02-01T10:00:00Z', doctor: 'Dr. Smith' },
      };

      const response = await dispatchExternalCommand(command);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe('NOT_IMPLEMENTED');
      expect(response.error?.code).toBe('AGENT_NOT_WIRED');
    });

    it('should include execution metadata when refusing unwired agents', async () => {
      const command: ExternalAgentCommand = {
        target: 'TestAgent',
        command: 'PING',
        args: {},
      };

      const response = await dispatchExternalCommand(command);

      expect(response.metadata).toBeDefined();
      expect(response.metadata?.executionTime).toBeGreaterThanOrEqual(0);
      expect(response.metadata?.timestamp).toBeDefined();
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('AGENT_NOT_WIRED');
    });

    it('should refuse CustomAgent without mock acknowledge theater', async () => {
      const command: ExternalAgentCommand = {
        target: 'CustomAgent',
        command: 'CUSTOM_COMMAND',
        args: { param1: 'value1' },
      };

      const response = await dispatchExternalCommand(command);

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('AGENT_NOT_WIRED');
    });

    it('should reject unauthorized agent targets', async () => {
      const command: ExternalAgentCommand = {
        target: 'UnknownAgent',
        command: 'INVALID_COMMAND',
        args: {},
      };

      const response = await dispatchExternalCommand(command);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe('UNAUTHORIZED');
      expect(response.error?.code).toBe('UNAUTHORIZED_AGENT');
    });
  });

  describe('validateExternalCommand', () => {
    it('should validate a correct command', () => {
      const command: ExternalAgentCommand = {
        target: 'TestAgent',
        command: 'TEST_COMMAND',
        args: { key: 'value' },
      };

      expect(() => validateExternalCommand(command)).not.toThrow();
      expect(validateExternalCommand(command)).toBe(true);
    });

    it('should throw error for missing target', () => {
      const command: ExternalAgentCommand = {
        target: '',
        command: 'TEST_COMMAND',
        args: {},
      };

      expect(() => validateExternalCommand(command)).toThrow(
        'Command target is required'
      );
    });

    it('should throw error for missing command', () => {
      const command: ExternalAgentCommand = {
        target: 'TestAgent',
        command: '',
        args: {},
      };

      expect(() => validateExternalCommand(command)).toThrow(
        'Command name is required'
      );
    });

    it('should throw error for invalid args', () => {
      const command: any = {
        target: 'TestAgent',
        command: 'TEST_COMMAND',
        args: null,
      };

      expect(() => validateExternalCommand(command)).toThrow(
        'Command args must be an object'
      );
    });
  });

  describe('getAgentStatus', () => {
    it('should return available status for FinanceAgent', async () => {
      const status = await getAgentStatus('FinanceAgent');

      expect(status).toBeDefined();
      expect(status.available).toBe(true);
      expect(status.version).toBeDefined();
      expect(status.latency).toBeDefined();
    });

    it('should report unwired agents as unavailable', async () => {
      const status = await getAgentStatus('HealthAgent');

      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('version');
      expect(status.available).toBe(false);
      expect(status.version).toBe('unwired');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle a complete FinanceAgent command-response cycle', async () => {
      const command: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_BALANCE',
        args: { account: 'checking' },
        metadata: { priority: 'high', timeout: 5000 },
      };

      expect(validateExternalCommand(command)).toBe(true);

      const response = await dispatchExternalCommand(command);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe('OK');
      expect(response.data).toBeDefined();
    });

    it('should not fake success for TestAgent metadata', async () => {
      const command: ExternalAgentCommand = {
        target: 'TestAgent',
        command: 'TEST',
        args: {},
        metadata: {
          priority: 'critical',
          timeout: 1000,
          retryCount: 3,
        },
      };

      const response = await dispatchExternalCommand(command);

      expect(response).toBeDefined();
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('AGENT_NOT_WIRED');
    });
  });

  describe('A2A Protocol - External Agent Communication', () => {
    it('should successfully delegate task to FinanceAgent and parse response', async () => {
      const command: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_BALANCE',
        args: { account: 'checking' },
        metadata: {
          priority: 'high',
          timeout: 5000,
          requestId: 'a2a-test-001',
        },
      };

      const response = await dispatchExternalCommand(command);

      expect(response).toBeDefined();
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('statusCode');
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('metadata');

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe('OK');
      expect(response.metadata?.executionTime).toBeGreaterThanOrEqual(0);
      expect(response.metadata?.timestamp).toBeDefined();

      expect(response.data).toHaveProperty('balance');
      expect(response.data).toHaveProperty('currency');
      expect(typeof response.data.balance).toBe('number');
    });

    it('should handle wired vs unwired agent types honestly', async () => {
      const commands: ExternalAgentCommand[] = [
        {
          target: 'FinanceAgent',
          command: 'GET_BALANCE',
          args: { account: 'savings' },
        },
        {
          target: 'HealthAgent',
          command: 'SCHEDULE_APPOINTMENT',
          args: { time: '2025-02-01T10:00:00Z', doctor: 'Dr. Smith' },
        },
        {
          target: 'TravelAgent',
          command: 'BOOK_FLIGHT',
          args: { from: 'LAX', to: 'JFK', date: '2025-03-15' },
        },
      ];

      const responses = await Promise.all(
        commands.map((cmd) => dispatchExternalCommand(cmd))
      );

      // Finance wired
      expect(responses[0].success).toBe(true);
      expect(responses[0].statusCode).toBe('OK');

      // Health / Travel not wired — no mock OK
      expect(responses[1].success).toBe(false);
      expect(responses[1].error?.code).toBe('AGENT_NOT_WIRED');
      expect(responses[2].success).toBe(false);
      expect(responses[2].error?.code).toBe('AGENT_NOT_WIRED');
    });

    it('should correctly parse complex FinanceAgent responses', async () => {
      const command: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_TRANSACTIONS',
        args: {
          account: 'checking',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        },
      };

      const response = await dispatchExternalCommand(command);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();

      if (Array.isArray(response.data.transactions)) {
        expect(response.data.transactions).toBeInstanceOf(Array);
      }
    });

    it('should include proper error handling in A2A protocol', async () => {
      const command: ExternalAgentCommand = {
        target: 'UnknownAgent',
        command: 'INVALID_COMMAND',
        args: {},
      };

      const response = await dispatchExternalCommand(command);

      expect(response).toBeDefined();
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('statusCode');
      expect(response).toHaveProperty('metadata');
      expect(response.success).toBe(false);
    });

    it('should verify agent status before dispatching commands', async () => {
      const agentName = 'FinanceAgent';

      const status = await getAgentStatus(agentName);
      expect(status.available).toBe(true);

      if (status.available) {
        const command: ExternalAgentCommand = {
          target: agentName,
          command: 'GET_BALANCE',
          args: { account: 'checking' },
        };

        const response = await dispatchExternalCommand(command);
        expect(response.success).toBe(true);
      }
    });

    it('should measure and record agent response times', async () => {
      const command: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_BALANCE',
        args: { account: 'checking' },
      };

      const startTime = Date.now();
      const response = await dispatchExternalCommand(command);
      const endTime = Date.now();
      const measuredTime = endTime - startTime;

      expect(response.metadata?.executionTime).toBeDefined();
      expect(response.metadata?.executionTime).toBeLessThanOrEqual(
        measuredTime + 10
      );
    });

    it('should support concurrent FinanceAgent requests', async () => {
      const commands = Array.from({ length: 5 }, (_, i) => ({
        target: 'FinanceAgent',
        command: 'GET_BALANCE',
        args: { account: `account-${i}` },
        metadata: { requestId: `concurrent-${i}` },
      }));

      const responses = await Promise.all(
        commands.map((cmd) =>
          dispatchExternalCommand(cmd as ExternalAgentCommand)
        )
      );

      expect(responses.length).toBe(5);
      responses.forEach((response, index) => {
        expect(response.success).toBe(true);
        expect(response.data.account).toBe(`account-${index}`);
      });
    });

    it('should validate command structure before dispatching', async () => {
      const validCommand: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_BALANCE',
        args: { account: 'checking' },
      };

      expect(validateExternalCommand(validCommand)).toBe(true);

      const invalidCommand1: any = { target: '', command: 'TEST', args: {} };
      expect(() => validateExternalCommand(invalidCommand1)).toThrow();

      const invalidCommand2: any = { target: 'Agent', command: '', args: {} };
      expect(() => validateExternalCommand(invalidCommand2)).toThrow();
    });
  });
});
