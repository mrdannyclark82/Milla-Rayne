import { describe, it, expect, beforeEach, vi } from 'vitest';
import { codingAgent } from '../agents/codingAgent.js';
import { AgentTask } from '../agents/taskStorage.js';
import * as sandboxService from '../sandboxEnvironmentService.js';
import * as automatedPRService from '../automatedPRService.js';
import * as codeAnalysisService from '../codeAnalysisService.js';

describe('CodingAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleTask', () => {
    it('should handle analyze_code action', async () => {
      // Mock code analysis
      const mockAnalysis = {
        securityIssues: [
          {
            severity: 'high' as const,
            type: 'security',
            description: 'Potential XSS vulnerability',
            recommendation: 'Sanitize user input',
          },
        ],
        performanceIssues: [],
        codeQualityIssues: [],
        languageSpecificSuggestions: [],
      };

      vi.spyOn(codeAnalysisService, 'analyzeCodeForIssues').mockResolvedValue(
        mockAnalysis
      );

      const task: AgentTask = {
        taskId: 'test-task-1',
        supervisor: 'MillaAgent',
        agent: 'CodingAgent',
        action: 'analyze_code',
        payload: {
          repositoryPath: '/test/repo',
        },
        status: 'pending',
      };

      const result = await codingAgent.handleTask(task);

      expect(result).toHaveLength(1);
      expect(result[0].issueType).toBe('security');
      expect(result[0].severity).toBe('high');
    });

    it('should handle automated_fix action', async () => {
      // Mock sandbox creation
      const mockSandbox = {
        id: 'sandbox-123',
        name: 'fix-test',
        description: 'Test fix',
        branchName: 'sandbox/fix-test',
        status: 'active' as const,
        createdAt: Date.now(),
        createdBy: 'milla' as const,
        features: [],
        readyForProduction: false,
      };

      vi.spyOn(sandboxService, 'createSandbox').mockResolvedValue(mockSandbox);

      const mockFeature = {
        id: 'feature-123',
        name: 'Fix: Test issue',
        description: 'Test fix',
        files: ['test.ts'],
        status: 'approved' as const,
        testsPassed: 2,
        testsFailed: 0,
        addedAt: Date.now(),
      };

      vi.spyOn(sandboxService, 'addFeatureToSandbox').mockResolvedValue(
        mockFeature
      );

      vi.spyOn(sandboxService, 'testFeature').mockResolvedValue({
        id: 'test-123',
        featureId: 'feature-123',
        timestamp: Date.now(),
        testType: 'unit',
        passed: true,
        details: 'All tests passed',
        duration: 100,
      });

      vi.spyOn(sandboxService, 'evaluateSandboxReadiness').mockReturnValue({
        ready: true,
        reasons: [],
        featuresApproved: 1,
        featuresPending: 0,
      });

      vi.spyOn(sandboxService, 'markSandboxForMerge').mockResolvedValue(true);

      const mockPR = {
        id: 'pr-123',
        sandboxId: 'sandbox-123',
        title: 'Test PR',
        description: 'Test',
        branch: 'sandbox/fix-test',
        baseBranch: 'main',
        files: ['test.ts'],
        createdAt: Date.now(),
        status: 'created' as const,
        prUrl: 'https://github.com/test/repo/pull/1',
        prNumber: 1,
      };

      vi.spyOn(automatedPRService, 'createPRForSandbox').mockResolvedValue(
        mockPR
      );

      // Mock code analysis to return issues
      vi.spyOn(codeAnalysisService, 'analyzeCodeForIssues').mockResolvedValue({
        securityIssues: [
          {
            severity: 'high' as const,
            type: 'security',
            description: 'Test issue',
            file: 'test.ts',
            recommendation: 'Fix it',
          },
        ],
        performanceIssues: [],
        codeQualityIssues: [],
        languageSpecificSuggestions: [],
      });

      const task: AgentTask = {
        taskId: 'test-task-2',
        supervisor: 'MillaAgent',
        agent: 'CodingAgent',
        action: 'automated_fix',
        payload: {
          repositoryPath: '/test/repo',
        },
        status: 'pending',
      };

      const result = await codingAgent.handleTask(task);

      expect(result.success).toBe(true);
      expect(result.sandboxId).toBe('sandbox-123');
      expect(result.prUrl).toBe('https://github.com/test/repo/pull/1');
    });

    it('should return error for unknown action', async () => {
      const task: AgentTask = {
        taskId: 'test-task-3',
        supervisor: 'MillaAgent',
        agent: 'CodingAgent',
        action: 'unknown_action',
        payload: {},
        status: 'pending',
      };

      const result = await codingAgent.handleTask(task);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown action');
    });
  });

  describe('performAutomatedFixLifecycle', () => {
    it('should return error if no issues found', async () => {
      vi.spyOn(codeAnalysisService, 'analyzeCodeForIssues').mockResolvedValue({
        securityIssues: [],
        performanceIssues: [],
        codeQualityIssues: [],
        languageSpecificSuggestions: [],
      });

      const result = await codingAgent.performAutomatedFixLifecycle({
        repositoryPath: '/test/repo',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('No issues identified');
    });
  });
});
