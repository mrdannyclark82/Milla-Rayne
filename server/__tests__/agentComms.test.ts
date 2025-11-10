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
});
