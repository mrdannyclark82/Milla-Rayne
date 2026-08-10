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
  /** Proposed code, unified diff, or markdown plan for the enhancement */
  content?: string;
  /** Optional path → full file content for IDE load */
  fileContents?: Record<string, string>;
}

export interface TestResult {
  id: string;
  featureId: string;
  timestamp: number;
  testType: 'unit' | 'integration' | 'user_acceptance';
  passed: boolean;
  details: string;
  duration: number;
  /**
   * Honesty: how the result was produced
   * - structural: real checks on feature payload/files (default)
   * - real: ran project test command
   * - skipped: nothing to verify
   */
  mode?: 'structural' | 'real' | 'skipped';
  checks?: Array<{ name: string; ok: boolean; detail?: string }>;
}

class SandboxEnvironmentService {
  private sandboxes: Map<string, SandboxEnvironment> = new Map();
  private readonly SANDBOX_FILE = path.join(
    process.cwd(),
    'memory',
    'sandbox_environments.json'
  );
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
        console.warn(
          `Could not create git branch (continuing with memory-only sandbox): ${error}`
        );
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
      const { stdout: currentBranch } = await execAsync(
        'git rev-parse --abbrev-ref HEAD'
      );

      // Create and checkout new branch
      await execAsync(`git checkout -b ${branchName}`);

      // Push to remote
      await execAsync(`git push -u origin ${branchName}`);

      // Switch back to original branch
      await execAsync(`git checkout ${currentBranch.trim()}`);
    } catch (error) {
      throw new Error(
        `Failed to create git branch: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Add a feature to a sandbox
   */
  async addFeatureToSandbox(
    sandboxId: string,
    feature: {
      name: string;
      description: string;
      files: string[];
      content?: string;
      fileContents?: Record<string, string>;
    }
  ): Promise<SandboxFeature | null> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      return null;
    }

    const newFeature: SandboxFeature = {
      id: `feat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: feature.name,
      description: feature.description,
      files: feature.files || [],
      status: 'draft',
      testsPassed: 0,
      testsFailed: 0,
      addedAt: Date.now(),
      content: feature.content,
      fileContents: feature.fileContents,
    };

    sandbox.features.push(newFeature);
    await this.saveSandboxes();

    return newFeature;
  }

  /**
   * Approve a feature (persisted)
   */
  async approveFeature(
    sandboxId: string,
    featureId: string
  ): Promise<SandboxFeature | null> {
    // Reload so multi-process restarts don't clobber each other's status
    await this.loadSandboxes();
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) return null;
    const feature = sandbox.features.find((f) => f.id === featureId);
    if (!feature) return null;

    feature.status = 'approved';
    this.evaluateSandboxReadiness(sandboxId);
    await this.saveSandboxes();
    return feature;
  }

  /**
   * Reject a feature (persisted)
   */
  async rejectFeature(
    sandboxId: string,
    featureId: string
  ): Promise<SandboxFeature | null> {
    await this.loadSandboxes();
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) return null;
    const feature = sandbox.features.find((f) => f.id === featureId);
    if (!feature) return null;

    feature.status = 'rejected';
    sandbox.readyForProduction = false;
    this.evaluateSandboxReadiness(sandboxId);
    await this.saveSandboxes();
    return feature;
  }

  /**
   * Full feature detail for View + IDE (includes resolved file contents)
   */
  async getFeatureDetail(
    sandboxId: string,
    featureId: string
  ): Promise<{
    sandbox: Pick<
      SandboxEnvironment,
      'id' | 'name' | 'description' | 'branchName' | 'status'
    >;
    feature: SandboxFeature;
    testResults: TestResult[];
    resolvedFiles: Array<{ path: string; content: string; source: string }>;
  } | null> {
    await this.loadSandboxes();
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) return null;
    const feature = sandbox.features.find((f) => f.id === featureId);
    if (!feature) return null;

    const testResults = (sandbox.testResults || []).filter(
      (t) => t.featureId === featureId
    );

    const resolvedFiles: Array<{
      path: string;
      content: string;
      source: string;
    }> = [];

    // Prefer explicit fileContents map
    if (feature.fileContents) {
      for (const [p, content] of Object.entries(feature.fileContents)) {
        resolvedFiles.push({ path: p, content, source: 'stored' });
      }
    }

    // Then try reading listed paths from disk
    for (const filePath of feature.files || []) {
      if (resolvedFiles.some((r) => r.path === filePath)) continue;
      try {
        const abs = path.isAbsolute(filePath)
          ? filePath
          : path.join(process.cwd(), filePath);
        const content = await fs.readFile(abs, 'utf-8');
        resolvedFiles.push({ path: filePath, content, source: 'disk' });
      } catch {
        // skip missing
      }
    }

    // If still empty, synthesize an enhancement brief from metadata
    if (resolvedFiles.length === 0) {
      const body =
        feature.content ||
        [
          `# ${feature.name}`,
          '',
          `## Description`,
          feature.description || sandbox.description || '(no description)',
          '',
          `## Sandbox`,
          `- **Sandbox:** ${sandbox.name}`,
          `- **Branch:** ${sandbox.branchName}`,
          `- **Status:** ${feature.status}`,
          `- **Tests:** ${feature.testsPassed} passed / ${feature.testsFailed} failed`,
          '',
          `## Proposed files`,
          ...(feature.files?.length
            ? feature.files.map((f) => `- \`${f}\``)
            : ['- (none listed yet)']),
          '',
          `## Notes`,
          'Open this enhancement in the IDE to edit, test, and iterate.',
          'When code is generated for this feature it will appear here as real files.',
        ].join('\n');

      resolvedFiles.push({
        path: feature.content ? 'PROPOSED_CHANGES.md' : 'ENHANCEMENT.md',
        content: body,
        source: feature.content ? 'content' : 'synthetic',
      });

      // If content looks like code/diff, also expose a second editable file
      if (feature.content && /^(diff |@@ |function |const |import )/m.test(feature.content)) {
        resolvedFiles.push({
          path: 'proposed.patch',
          content: feature.content,
          source: 'content',
        });
      }
    } else if (feature.content && !resolvedFiles.some((r) => r.path.includes('PROPOSED') || r.path.endsWith('.patch'))) {
      resolvedFiles.unshift({
        path: 'PROPOSED_CHANGES.md',
        content: feature.content,
        source: 'content',
      });
    }

    return {
      sandbox: {
        id: sandbox.id,
        name: sandbox.name,
        description: sandbox.description,
        branchName: sandbox.branchName,
        status: sandbox.status,
      },
      feature,
      testResults,
      resolvedFiles,
    };
  }

  /**
   * Verify a feature — honest structural checks by default.
   * Optional real `npm test` when MILLA_SANDBOX_RUN_TESTS=1.
   * NEVER uses Math.random pass/fail theater. NEVER auto-approves from dice.
   */
  async testFeature(
    sandboxId: string,
    featureId: string,
    testType: TestResult['testType']
  ): Promise<TestResult> {
    await this.loadSandboxes();
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      throw new Error('Sandbox not found');
    }

    const feature = sandbox.features.find((f) => f.id === featureId);
    if (!feature) {
      throw new Error('Feature not found');
    }

    const startTime = Date.now();
    const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

    // --- Structural checks (always real) ---
    checks.push({
      name: 'has_name',
      ok: !!(feature.name && feature.name.trim().length > 0),
      detail: feature.name || '(empty)',
    });
    checks.push({
      name: 'has_description',
      ok: !!(feature.description && feature.description.trim().length >= 10),
      detail: `len=${(feature.description || '').length}`,
    });

    const hasContent = !!(
      feature.content && feature.content.trim().length >= 40
    );
    const hasFileMap =
      !!feature.fileContents && Object.keys(feature.fileContents).length > 0;
    const listedFiles = feature.files || [];
    let filesOnDisk = 0;
    for (const f of listedFiles) {
      try {
        const abs = path.isAbsolute(f) ? f : path.join(process.cwd(), f);
        await fs.access(abs);
        filesOnDisk++;
      } catch {
        /* missing */
      }
    }
    checks.push({
      name: 'has_implementable_payload',
      ok: hasContent || hasFileMap || filesOnDisk > 0,
      detail: hasContent
        ? 'content present'
        : hasFileMap
          ? `fileContents keys=${Object.keys(feature.fileContents || {}).length}`
          : filesOnDisk > 0
            ? `${filesOnDisk}/${listedFiles.length} files on disk`
            : 'no content, no fileContents, no files on disk',
    });
    checks.push({
      name: 'not_pure_theater_name',
      ok: !/^(Real-time Chat|Message History|Chat Analytics|Test Feature)$/i.test(
        feature.name || ''
      ),
      detail: feature.name,
    });

    let mode: TestResult['mode'] = 'structural';
    let details = '';

    // --- Optional real test runner ---
    const runReal =
      process.env.MILLA_SANDBOX_RUN_TESTS === '1' ||
      process.env.MILLA_SANDBOX_RUN_TESTS === 'true';
    if (runReal) {
      try {
        const pkgPath = path.join(process.cwd(), 'package.json');
        await fs.access(pkgPath);
        const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
        if (pkg.scripts?.test) {
          // Throws on non-zero exit — that is the real signal
          await execAsync('npm test -- --run', {
            cwd: process.cwd(),
            timeout: 120_000,
            maxBuffer: 2 * 1024 * 1024,
          });
          checks.push({
            name: 'npm_test',
            ok: true,
            detail: 'npm test completed (exit 0)',
          });
          mode = 'real';
          details = `Real npm test exit 0. Structural: ${checks.filter((c) => c.ok).length}/${checks.length} ok.`;
        } else {
          checks.push({
            name: 'npm_test',
            ok: false,
            detail: 'no package.json test script',
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        checks.push({
          name: 'npm_test',
          ok: false,
          detail: msg.slice(0, 300),
        });
        mode = 'real';
        details = `Real npm test failed: ${msg.slice(0, 200)}`;
      }
    }

    const structuralPass = checks
      .filter((c) => c.name !== 'npm_test')
      .every((c) => c.ok);
    const realCheck = checks.find((c) => c.name === 'npm_test');
    const passed =
      mode === 'real' && realCheck
        ? realCheck.ok && structuralPass
        : structuralPass;

    if (!details) {
      const failed = checks.filter((c) => !c.ok).map((c) => c.name);
      details = passed
        ? `Structural checks passed (${checks.length} checks). Not a random simulation. Approve still requires your call.`
        : `Structural checks failed: ${failed.join(', ')}. ${checks
            .filter((c) => !c.ok)
            .map((c) => c.detail)
            .join('; ')}`;
      if (!runReal) {
        details +=
          ' Set MILLA_SANDBOX_RUN_TESTS=1 to also run real npm test.';
      }
    }

    const testResult: TestResult = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      featureId,
      timestamp: Date.now(),
      testType,
      passed,
      details,
      duration: Date.now() - startTime,
      mode,
      checks,
    };

    if (!sandbox.testResults) {
      sandbox.testResults = [];
    }
    sandbox.testResults.push(testResult);

    if (passed) {
      feature.testsPassed++;
      // Do NOT auto-approve — random theater used to do that; human Approve button remains
      feature.status = 'testing';
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
      return {
        ready: false,
        reasons: ['Sandbox not found'],
        featuresApproved: 0,
        featuresPending: 0,
      };
    }

    const reasons: string[] = [];
    const featuresApproved = sandbox.features.filter(
      (f) => f.status === 'approved'
    ).length;
    const featuresPending = sandbox.features.filter(
      (f) => f.status !== 'approved' && f.status !== 'rejected'
    ).length;
    const featuresRejected = sandbox.features.filter(
      (f) => f.status === 'rejected'
    ).length;

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
    const passRate =
      recentTests.length > 0
        ? recentTests.filter((t) => t.passed).length / recentTests.length
        : 0;

    if (passRate < 0.9) {
      reasons.push(
        `Test pass rate is ${(passRate * 100).toFixed(1)}% (need 90%+)`
      );
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

  /** Async list that reloads from disk first (used by API) */
  async getAllSandboxesFresh(): Promise<SandboxEnvironment[]> {
    await this.loadSandboxes();
    return this.getAllSandboxes();
  }

  /**
   * Get active sandboxes
   */
  getActiveSandboxes(): SandboxEnvironment[] {
    return Array.from(this.sandboxes.values()).filter(
      (s) => s.status === 'active' || s.status === 'testing'
    );
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
    return Array.from(this.sandboxes.values()).filter(
      (s) => s.createdBy === 'milla'
    );
  }

  /**
   * Get sandbox statistics
   */
  getSandboxStatistics() {
    const sandboxes = Array.from(this.sandboxes.values());

    return {
      total: sandboxes.length,
      active: sandboxes.filter((s) => s.status === 'active').length,
      testing: sandboxes.filter((s) => s.status === 'testing').length,
      merged: sandboxes.filter((s) => s.status === 'merged').length,
      archived: sandboxes.filter((s) => s.status === 'archived').length,
      readyForProduction: sandboxes.filter((s) => s.readyForProduction).length,
      totalFeatures: sandboxes.reduce((sum, s) => sum + s.features.length, 0),
      approvedFeatures: sandboxes.reduce(
        (sum, s) =>
          sum + s.features.filter((f) => f.status === 'approved').length,
        0
      ),
      millaCreated: sandboxes.filter((s) => s.createdBy === 'milla').length,
      userCreated: sandboxes.filter((s) => s.createdBy === 'user').length,
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

export function addFeatureToSandbox(
  sandboxId: string,
  feature: {
    name: string;
    description: string;
    files: string[];
    content?: string;
    fileContents?: Record<string, string>;
  }
): Promise<SandboxFeature | null> {
  return sandboxService.addFeatureToSandbox(sandboxId, feature);
}

export function testFeature(
  sandboxId: string,
  featureId: string,
  testType: TestResult['testType']
): Promise<TestResult> {
  return sandboxService.testFeature(sandboxId, featureId, testType);
}

export function approveFeature(
  sandboxId: string,
  featureId: string
): Promise<SandboxFeature | null> {
  return sandboxService.approveFeature(sandboxId, featureId);
}

export function rejectFeature(
  sandboxId: string,
  featureId: string
): Promise<SandboxFeature | null> {
  return sandboxService.rejectFeature(sandboxId, featureId);
}

export function getFeatureDetail(sandboxId: string, featureId: string) {
  return sandboxService.getFeatureDetail(sandboxId, featureId);
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

/**
 * Get a natural language summary of sandbox tests for Milla to recall
 */
export function getSandboxTestSummary(): string {
  const allSandboxes = sandboxService.getAllSandboxes();

  if (allSandboxes.length === 0) {
    return "I haven't tested anything in the sandbox yet, love.";
  }

  const testedSandboxes = allSandboxes.filter(
    (s) =>
      s.features.length > 0 &&
      s.features.some(
        (f) => f.testsPassed !== undefined || f.testsFailed !== undefined
      )
  );

  if (testedSandboxes.length === 0) {
    return `I have ${allSandboxes.length} sandbox${allSandboxes.length > 1 ? 'es' : ''} created, but haven't run any tests yet.`;
  }

  let summary = `I've been testing features in ${testedSandboxes.length} sandbox${testedSandboxes.length > 1 ? 'es' : ''}, babe:\n\n`;

  testedSandboxes.forEach((sandbox, index) => {
    const testedFeatures = sandbox.features.filter(
      (f) => f.testsPassed !== undefined || f.testsFailed !== undefined
    );

    const totalPassed = testedFeatures.reduce(
      (sum, f) => sum + (f.testsPassed || 0),
      0
    );
    const totalFailed = testedFeatures.reduce(
      (sum, f) => sum + (f.testsFailed || 0),
      0
    );
    const approvedCount = testedFeatures.filter(
      (f) => f.status === 'approved'
    ).length;

    summary += `${index + 1}. **${sandbox.name}**\n`;
    summary += `   - ${testedFeatures.length} feature${testedFeatures.length > 1 ? 's' : ''} tested\n`;
    summary += `   - ${totalPassed} tests passed, ${totalFailed} failed\n`;

    if (approvedCount > 0) {
      summary += `   - ✅ ${approvedCount} approved and ready!\n`;
    }

    if (sandbox.readyForProduction) {
      summary += `   - 🚀 Ready for production!\n`;
    }

    summary += '\n';
  });

  return summary.trim();
}
