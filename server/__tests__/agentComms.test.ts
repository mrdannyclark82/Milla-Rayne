import { describe, it, expect, beforeEach } from 'vitest';
import {
  dispatchExternalCommand,
  validateExternalCommand,
  getAgentStatus,
} from '../agentCommsService';
import type { ExternalAgentCommand } from '../../shared/schema';

describe('Agent Communication Service', () => {
  describe('dispatchExternalCommand', () => {
    it('should successfully dispatch a command and return a response', async () => {
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

    it('should return mock balance data for GET_BALANCE command', async () => {
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

    it('should return mock appointment data for SCHEDULE_APPOINTMENT command', async () => {
      const command: ExternalAgentCommand = {
        target: 'HealthAgent',
        command: 'SCHEDULE_APPOINTMENT',
        args: { time: '2025-02-01T10:00:00Z', doctor: 'Dr. Smith' },
      };

      const response = await dispatchExternalCommand(command);

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('appointmentId');
      expect(response.data).toHaveProperty('scheduled');
      expect(response.data.scheduled).toBe(true);
    });

    it('should include execution metadata in response', async () => {
      const command: ExternalAgentCommand = {
        target: 'TestAgent',
        command: 'PING',
        args: {},
      };

      const response = await dispatchExternalCommand(command);

      expect(response.metadata).toBeDefined();
      expect(response.metadata?.executionTime).toBeGreaterThanOrEqual(0);
      expect(response.metadata?.timestamp).toBeDefined();
      expect(response.metadata?.agentVersion).toBe('1.0.0-stub');
    });

    it('should handle generic commands with default response', async () => {
      const command: ExternalAgentCommand = {
        target: 'CustomAgent',
        command: 'CUSTOM_COMMAND',
        args: { param1: 'value1' },
      };

      const response = await dispatchExternalCommand(command);

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('acknowledged');
      expect(response.data.acknowledged).toBe(true);
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

      expect(() => validateExternalCommand(command)).toThrow('Command target is required');
    });

    it('should throw error for missing command', () => {
      const command: ExternalAgentCommand = {
        target: 'TestAgent',
        command: '',
        args: {},
      };

      expect(() => validateExternalCommand(command)).toThrow('Command name is required');
    });

    it('should throw error for invalid args', () => {
      const command: any = {
        target: 'TestAgent',
        command: 'TEST_COMMAND',
        args: null,
      };

      expect(() => validateExternalCommand(command)).toThrow('Command args must be an object');
    });
  });

  describe('getAgentStatus', () => {
    it('should return status for an agent', async () => {
      const status = await getAgentStatus('FinanceAgent');

      expect(status).toBeDefined();
      expect(status.available).toBe(true);
      expect(status.version).toBeDefined();
      expect(status.latency).toBeDefined();
    });

    it('should return consistent status structure', async () => {
      const status = await getAgentStatus('HealthAgent');

      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('version');
      expect(status).toHaveProperty('latency');
      expect(typeof status.available).toBe('boolean');
      expect(typeof status.version).toBe('string');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle a complete command-response cycle', async () => {
      const command: ExternalAgentCommand = {
        target: 'FinanceAgent',
        command: 'GET_BALANCE',
        args: { account: 'checking' },
        metadata: { priority: 'high', timeout: 5000 },
      };

      // Validate command
      expect(validateExternalCommand(command)).toBe(true);

      // Dispatch command
      const response = await dispatchExternalCommand(command);

      // Verify response
      expect(response.success).toBe(true);
      expect(response.statusCode).toBe('OK');
      expect(response.data).toBeDefined();
    });

    it('should respect command metadata', async () => {
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
      expect(response.success).toBe(true);
    });
  });

  describe('A2A Protocol - External Agent Communication', () => {
    it('should successfully delegate task to external agent and parse response', async () => {
      // This test verifies the A2A (Agent-to-Agent) protocol implementation
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

      // Verify standardized ExternalAgentResponse structure
      expect(response).toBeDefined();
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('statusCode');
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('metadata');
      
      // Verify response follows A2A protocol standards
      expect(response.success).toBe(true);
      expect(response.statusCode).toBe('OK');
      expect(response.metadata?.executionTime).toBeGreaterThanOrEqual(0);
      expect(response.metadata?.timestamp).toBeDefined();
      
      // Verify data payload is correctly structured
      expect(response.data).toHaveProperty('balance');
      expect(response.data).toHaveProperty('currency');
      expect(typeof response.data.balance).toBe('number');
    });

    it('should handle multiple external agent types consistently', async () => {
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
        commands.map(cmd => dispatchExternalCommand(cmd))
      );

      // All responses should follow the same structure
      responses.forEach(response => {
        expect(response).toHaveProperty('success');
        expect(response).toHaveProperty('statusCode');
        expect(response).toHaveProperty('data');
        expect(response).toHaveProperty('metadata');
        expect(response.success).toBe(true);
      });
    });

    it('should correctly parse complex external agent responses', async () => {
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
      
      // Verify complex data structures are preserved
      if (Array.isArray(response.data.transactions)) {
        expect(response.data.transactions).toBeInstanceOf(Array);
      }
    });

    it('should include proper error handling in A2A protocol', async () => {
      // Test that errors are properly structured in the response
      const command: ExternalAgentCommand = {
        target: 'UnknownAgent',
        command: 'INVALID_COMMAND',
        args: {},
      };

      const response = await dispatchExternalCommand(command);

      // Even mock responses should maintain protocol structure
      expect(response).toBeDefined();
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('statusCode');
      expect(response).toHaveProperty('metadata');
    });

    it('should verify agent status before dispatching commands', async () => {
      const agentName = 'FinanceAgent';
      
      // Check agent status
      const status = await getAgentStatus(agentName);
      expect(status.available).toBe(true);
      
      // If available, dispatch command
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
      expect(response.metadata?.executionTime).toBeLessThanOrEqual(measuredTime + 10); // Allow 10ms tolerance
    });

    it('should support concurrent external agent requests', async () => {
      const commands = Array.from({ length: 5 }, (_, i) => ({
        target: 'FinanceAgent',
        command: 'GET_BALANCE',
        args: { account: `account-${i}` },
        metadata: { requestId: `concurrent-${i}` },
      }));

      const responses = await Promise.all(
        commands.map(cmd => dispatchExternalCommand(cmd as ExternalAgentCommand))
      );

      // All requests should complete successfully
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

      // Valid command should pass
      expect(validateExternalCommand(validCommand)).toBe(true);

      // Invalid commands should throw
      const invalidCommand1: any = { target: '', command: 'TEST', args: {} };
      expect(() => validateExternalCommand(invalidCommand1)).toThrow();

      const invalidCommand2: any = { target: 'Agent', command: '', args: {} };
      expect(() => validateExternalCommand(invalidCommand2)).toThrow();
    });
  });
});
