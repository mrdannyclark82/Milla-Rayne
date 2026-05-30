import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
// Mock external dependencies BEFORE importing the module under test
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('original content'),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('diff', () => ({
  applyPatch: vi.fn().mockReturnValue('patched content'),
}));

// Mock child_process
const mockExec = vi.fn();
vi.mock('child_process', () => ({
  exec: (cmd, cb) => {
      mockExec(cmd);
      if (cmd.includes('rev-parse')) {
          cb(null, { stdout: 'main', stderr: '' });
      } else {
          cb(null, { stdout: 'success', stderr: '' });
      }
  }
}));

// Mock Sandbox Service
vi.mock('../sandboxEnvironmentService.js', () => ({
  createSandbox: vi.fn(),
  addFeatureToSandbox: vi.fn(),
  testFeature: vi.fn(),
  getSandbox: vi.fn(),
  evaluateSandboxReadiness: vi.fn(),
  markSandboxForMerge: vi.fn(),
}));

// Mock PR Service
vi.mock('../automatedPRService.js', () => ({
  createPRForSandbox: vi.fn(),
}));

// Import module after mocking
import { generateFix, codingAgent } from '../agents/codingAgent.js';
import * as sandboxService from '../sandboxEnvironmentService.js';
import * as automatedPRService from '../automatedPRService.js';
import * as fs from 'fs/promises';

describe('CodingAgent SCPA Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExec.mockClear();
  });

  it('should execute full SCPA lifecycle on self_correct task', async () => {
    // Setup Mocks
    const mockSandbox = {
      id: 'sandbox-scpa',
      name: 'scpa-fix-test',
      branchName: 'sandbox/scpa-fix-test',
      status: 'active',
    };
    vi.mocked(sandboxService.createSandbox).mockResolvedValue(mockSandbox as any);
    vi.mocked(sandboxService.getSandbox).mockReturnValue(mockSandbox as any);

    vi.mocked(sandboxService.addFeatureToSandbox).mockResolvedValue({
      id: 'feat-1',
      name: 'Fix',
      status: 'draft',
      testsPassed: 0,
      testsFailed: 0,
      addedAt: Date.now(),
      description: 'desc',
      files: []
    } as any);

    vi.mocked(sandboxService.testFeature).mockResolvedValue({
      passed: true,
      id: 'test-1',
      featureId: 'feat-1',
      timestamp: Date.now(),
      testType: 'unit',
      details: 'passed',
      duration: 100
    } as any);

    vi.mocked(automatedPRService.createPRForSandbox).mockResolvedValue({
      id: 'pr-1',
      sandboxId: 'sandbox-scpa',
      status: 'created',
      prUrl: 'http://pr',
    } as any);

    // Mock failure context
    const failureContext = {
      agentName: 'TestAgent',
      error: 'null pointer exception',
    };

    // Call generateFix directly
    const result = await generateFix(failureContext);

    // Verify
    expect(result.success).toBe(true);
    expect(sandboxService.createSandbox).toHaveBeenCalled();
    expect(sandboxService.addFeatureToSandbox).toHaveBeenCalled();

    // Check if applyPatchToSandbox logic was executed (via exec calls)
    expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('git checkout sandbox/scpa-fix-test'));
    expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('git add .'));
    expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('git commit'));
    expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('git push'));

    // Tests should be run
    expect(sandboxService.testFeature).toHaveBeenCalledTimes(2); // unit + integration

    // PR should be created
    expect(automatedPRService.createPRForSandbox).toHaveBeenCalledWith(expect.objectContaining({
        sandboxId: 'sandbox-scpa',
        skipCommit: true
    }));
  });

  it('should handle self_correct action in handleTask', async () => {
     const mockSandbox = {
      id: 'sandbox-scpa-2',
      name: 'scpa-fix-test-2',
      branchName: 'sandbox/scpa-fix-test-2',
      status: 'active',
    };
    vi.mocked(sandboxService.createSandbox).mockResolvedValue(mockSandbox as any);
    vi.mocked(sandboxService.getSandbox).mockReturnValue(mockSandbox as any);
    vi.mocked(sandboxService.addFeatureToSandbox).mockResolvedValue({} as any);
    vi.mocked(sandboxService.testFeature).mockResolvedValue({ passed: true } as any);
    vi.mocked(automatedPRService.createPRForSandbox).mockResolvedValue({} as any);

     const task = {
         action: 'self_correct',
         payload: {
             originalError: {
                 agentName: 'AgentX',
                 error: 'Timeout'
             }
         }
     };

     await codingAgent.handleTask(task as any);

     expect(sandboxService.createSandbox).toHaveBeenCalled();
     expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('git checkout sandbox/scpa-fix-test-2'));
  });
});
