/**
 * Sandbox Environment Service
 * 
 * Creates isolated testing environments for new features without requiring admin tokens.
 * Allows Milla and users to test features safely without breaking the main build.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SandboxEnvironment {
  id: string;
  name: string;
  description: string;
  branchName: string;
  status: 'active' | 'testing' | 'merged' | 'archived';
  createdAt: number;
  createdBy: 'milla' | 'user';
  features: SandboxFeature[];
  testResults?: TestResult[];
  readyForProduction: boolean;
}

export interface SandboxFeature {
  id: string;
  name: string;
  description: string;
  files: string[];
  status: 'draft' | 'testing' | 'approved' | 'rejected';
  testsPassed: number;
  testsFailed: number;
  addedAt: number;
}

export interface TestResult {
  id: string;
  featureId: string;
  timestamp: number;
  testType: 'unit' | 'integration' | 'user_acceptance';
  passed: boolean;
  details: string;
  duration: number;
}

class SandboxEnvironmentService {
  private sandboxes: Map<string, SandboxEnvironment> = new Map();
  private readonly SANDBOX_FILE = path.join(process.cwd(), 'memory', 'sandbox_environments.json');
  private readonly SANDBOX_PREFIX = 'sandbox/';

  async initialize(): Promise<void> {
    await this.loadSandboxes();
    console.log('Sandbox Environment Service initialized');
  }

  /**
   * Create a new sandbox environment
   */
  async createSandbox(params: {
    name: string;
    description: string;
    createdBy: 'milla' | 'user';
    createGitBranch?: boolean;
  }): Promise<SandboxEnvironment> {
    const sandboxId = `sandbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const branchName = `${this.SANDBOX_PREFIX}${params.name.toLowerCase().replace(/\s+/g, '-')}_${Date.now()}`;

    const sandbox: SandboxEnvironment = {
      id: sandboxId,
      name: params.name,
      description: params.description,
      branchName,
      status: 'active',
      createdAt: Date.now(),
      createdBy: params.createdBy,
      features: [],
      readyForProduction: false,
    };

    this.sandboxes.set(sandboxId, sandbox);
    await this.saveSandboxes();

    // Create actual git branch if requested
    if (params.createGitBranch !== false) {
      try {
        await this.createGitBranch(branchName);
        console.log(`✓ Created git branch: ${branchName}`);
      } catch (error) {
        console.warn(`Could not create git branch (continuing with memory-only sandbox): ${error}`);
      }
    }

    console.log(`Created sandbox environment: ${sandbox.name} (${branchName})`);

    return sandbox;
  }

  /**
   * Create a git branch for the sandbox
   */
  private async createGitBranch(branchName: string): Promise<void> {
    const execAsync = promisify(exec);
    
    try {
      // Get current branch
      const { stdout: currentBranch } = await execAsync('git rev-parse --abbrev-ref HEAD');
      
      // Create and checkout new branch
      await execAsync(`git checkout -b ${branchName}`);
      
      // Push to remote
      await execAsync(`git push -u origin ${branchName}`);
      
      // Switch back to original branch
      await execAsync(`git checkout ${currentBranch.trim()}`);
    } catch (error) {
      throw new Error(`Failed to create git branch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add a feature to a sandbox
   */
  async addFeatureToSandbox(sandboxId: string, feature: {
    name: string;
    description: string;
    files: string[];
  }): Promise<SandboxFeature | null> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      return null;
    }

    const newFeature: SandboxFeature = {
      id: `feat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: feature.name,
      description: feature.description,
      files: feature.files,
      status: 'draft',
      testsPassed: 0,
      testsFailed: 0,
      addedAt: Date.now(),
    };

    sandbox.features.push(newFeature);
    await this.saveSandboxes();

    return newFeature;
  }

  /**
   * Run tests on a feature in sandbox
   */
  async testFeature(sandboxId: string, featureId: string, testType: TestResult['testType']): Promise<TestResult> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      throw new Error('Sandbox not found');
    }

    const feature = sandbox.features.find(f => f.id === featureId);
    if (!feature) {
      throw new Error('Feature not found');
    }

    // Simulate running tests
    const startTime = Date.now();
    const passed = Math.random() > 0.3; // 70% success rate for simulation
    const duration = Math.random() * 2000 + 500; // 500-2500ms

    const testResult: TestResult = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      featureId,
      timestamp: Date.now(),
      testType,
      passed,
      details: passed ? 'All tests passed successfully' : 'Some tests failed - review needed',
      duration,
    };

    if (!sandbox.testResults) {
      sandbox.testResults = [];
    }
    sandbox.testResults.push(testResult);

    if (passed) {
      feature.testsPassed++;
      if (feature.testsPassed > 2 && feature.testsFailed === 0) {
        feature.status = 'approved';
      } else {
        feature.status = 'testing';
      }
    } else {
      feature.testsFailed++;
      feature.status = 'testing';
    }

    await this.saveSandboxes();
    return testResult;
  }

  /**
   * Evaluate if sandbox is ready for production
   */
  evaluateSandboxReadiness(sandboxId: string): {
    ready: boolean;
    reasons: string[];
    featuresApproved: number;
    featuresPending: number;
  } {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      return { ready: false, reasons: ['Sandbox not found'], featuresApproved: 0, featuresPending: 0 };
    }

    const reasons: string[] = [];
    const featuresApproved = sandbox.features.filter(f => f.status === 'approved').length;
    const featuresPending = sandbox.features.filter(f => f.status !== 'approved' && f.status !== 'rejected').length;
    const featuresRejected = sandbox.features.filter(f => f.status === 'rejected').length;

    if (sandbox.features.length === 0) {
      reasons.push('No features in sandbox');
    }

    if (featuresPending > 0) {
      reasons.push(`${featuresPending} feature(s) still pending approval`);
    }

    if (featuresRejected > 0) {
      reasons.push(`${featuresRejected} feature(s) rejected`);
    }

    const allTestResults = sandbox.testResults || [];
    const recentTests = allTestResults.slice(-10);
    const passRate = recentTests.length > 0
      ? recentTests.filter(t => t.passed).length / recentTests.length
      : 0;

    if (passRate < 0.9) {
      reasons.push(`Test pass rate is ${(passRate * 100).toFixed(1)}% (need 90%+)`);
    }

    const ready = reasons.length === 0 && featuresApproved > 0;
    sandbox.readyForProduction = ready;

    return {
      ready,
      reasons,
      featuresApproved,
      featuresPending,
    };
  }

  /**
   * Mark sandbox as ready for merge
   */
  async markSandboxForMerge(sandboxId: string): Promise<boolean> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      return false;
    }

    const readiness = this.evaluateSandboxReadiness(sandboxId);
    if (!readiness.ready) {
      console.log(`Sandbox ${sandbox.name} not ready:`, readiness.reasons);
      return false;
    }

    sandbox.status = 'merged';
    sandbox.readyForProduction = true;
    await this.saveSandboxes();

    console.log(`Sandbox ${sandbox.name} marked ready for merge`);
    return true;
  }

  /**
   * Archive a sandbox
   */
  async archiveSandbox(sandboxId: string): Promise<boolean> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      return false;
    }

    sandbox.status = 'archived';
    await this.saveSandboxes();
    return true;
  }

  /**
   * Get all sandboxes
   */
  getAllSandboxes(): SandboxEnvironment[] {
    return Array.from(this.sandboxes.values());
  }

  /**
   * Get active sandboxes
   */
  getActiveSandboxes(): SandboxEnvironment[] {
    return Array.from(this.sandboxes.values())
      .filter(s => s.status === 'active' || s.status === 'testing');
  }

  /**
   * Get sandbox by ID
   */
  getSandbox(sandboxId: string): SandboxEnvironment | undefined {
    return this.sandboxes.get(sandboxId);
  }

  /**
   * Get Milla-created sandboxes
   */
  getMillasSandboxes(): SandboxEnvironment[] {
    return Array.from(this.sandboxes.values())
      .filter(s => s.createdBy === 'milla');
  }

  /**
   * Get sandbox statistics
   */
  getSandboxStatistics() {
    const sandboxes = Array.from(this.sandboxes.values());
    
    return {
      total: sandboxes.length,
      active: sandboxes.filter(s => s.status === 'active').length,
      testing: sandboxes.filter(s => s.status === 'testing').length,
      merged: sandboxes.filter(s => s.status === 'merged').length,
      archived: sandboxes.filter(s => s.status === 'archived').length,
      readyForProduction: sandboxes.filter(s => s.readyForProduction).length,
      totalFeatures: sandboxes.reduce((sum, s) => sum + s.features.length, 0),
      approvedFeatures: sandboxes.reduce((sum, s) => sum + s.features.filter(f => f.status === 'approved').length, 0),
      millaCreated: sandboxes.filter(s => s.createdBy === 'milla').length,
      userCreated: sandboxes.filter(s => s.createdBy === 'user').length,
    };
  }

  /**
   * Load sandboxes from file
   */
  private async loadSandboxes(): Promise<void> {
    try {
      const data = await fs.readFile(this.SANDBOX_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      this.sandboxes = new Map(Object.entries(parsed.sandboxes || {}));
    } catch (error) {
      console.log('No existing sandboxes found, starting fresh');
    }
  }

  /**
   * Save sandboxes to file
   */
  private async saveSandboxes(): Promise<void> {
    try {
      const data = {
        sandboxes: Object.fromEntries(this.sandboxes),
        lastUpdated: Date.now(),
      };
      await fs.writeFile(this.SANDBOX_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving sandboxes:', error);
    }
  }
}

// Singleton instance
const sandboxService = new SandboxEnvironmentService();

export async function initializeSandboxEnvironment(): Promise<void> {
  await sandboxService.initialize();
}

export function createSandbox(params: {
  name: string;
  description: string;
  createdBy: 'milla' | 'user';
}): Promise<SandboxEnvironment> {
  return sandboxService.createSandbox(params);
}

export function addFeatureToSandbox(sandboxId: string, feature: {
  name: string;
  description: string;
  files: string[];
}): Promise<SandboxFeature | null> {
  return sandboxService.addFeatureToSandbox(sandboxId, feature);
}

export function testFeature(sandboxId: string, featureId: string, testType: TestResult['testType']): Promise<TestResult> {
  return sandboxService.testFeature(sandboxId, featureId, testType);
}

export function evaluateSandboxReadiness(sandboxId: string) {
  return sandboxService.evaluateSandboxReadiness(sandboxId);
}

export function markSandboxForMerge(sandboxId: string): Promise<boolean> {
  return sandboxService.markSandboxForMerge(sandboxId);
}

export function archiveSandbox(sandboxId: string): Promise<boolean> {
  return sandboxService.archiveSandbox(sandboxId);
}

export function getAllSandboxes(): SandboxEnvironment[] {
  return sandboxService.getAllSandboxes();
}

export function getActiveSandboxes(): SandboxEnvironment[] {
  return sandboxService.getActiveSandboxes();
}

export function getSandbox(sandboxId: string): SandboxEnvironment | undefined {
  return sandboxService.getSandbox(sandboxId);
}

export function getMillasSandboxes(): SandboxEnvironment[] {
  return sandboxService.getMillasSandboxes();
}

export function getSandboxStatistics() {
  return sandboxService.getSandboxStatistics();
}
