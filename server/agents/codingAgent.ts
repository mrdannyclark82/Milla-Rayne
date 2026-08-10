import { BaseAgent } from './base';
import { AgentTask } from './taskStorage';
import {
  createSandbox,
  addFeatureToSandbox,
  testFeature,
  evaluateSandboxReadiness,
  markSandboxForMerge,
  type SandboxEnvironment,
  type SandboxFeature,
} from '../sandboxEnvironmentService';
import { createPRForSandbox } from '../automatedPRService';
import {
  analyzeCodeForIssues,
  type SecurityIssue,
  type PerformanceIssue,
  type CodeQualityIssue,
} from '../codeAnalysisService';
import * as fs from 'fs/promises';
import * as path from 'path';
import { applyPatch } from 'diff';

export interface IssueIdentification {
  issueType: 'bug' | 'enhancement' | 'security' | 'performance';
  description: string;
  affectedFiles: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface CodeFix {
  description: string;
  files: string[];
  changes: string;
}

class CodingAgent extends BaseAgent {
  constructor() {
    super(
      'coding',
      'An agent that can write and understand code, perform automated bug fixes, and create pull requests.'
    );
  }

  protected async executeInternal(task: string): Promise<string> {
    this.log(`CodingAgent received task: ${task}`);
    const lower = task.toLowerCase();
    const repoPath = process.cwd();

    // Real work paths — no acknowledgment theater
    if (
      lower.includes('analyze') ||
      lower.includes('scan') ||
      lower.includes('issues')
    ) {
      const issues = await this.identifyIssues(repoPath);
      return JSON.stringify(
        {
          action: 'analyze_code',
          issueCount: issues.length,
          issues: issues.slice(0, 10),
        },
        null,
        2
      );
    }

    if (
      lower.includes('fix') ||
      lower.includes('patch') ||
      lower.includes('generate_fix')
    ) {
      const result = await generateFix({
        agentName: 'coding',
        error: task,
        repositoryPath: repoPath,
      });
      return JSON.stringify(result, null, 2);
    }

    // Default: run analysis so dispatch always returns substance
    const issues = await this.identifyIssues(repoPath);
    return JSON.stringify(
      {
        action: 'default_analyze',
        task,
        issueCount: issues.length,
        topIssues: issues.slice(0, 5).map((i) => ({
          type: i.issueType,
          severity: i.severity,
          description: i.description.slice(0, 200),
          files: i.affectedFiles,
        })),
      },
      null,
      2
    );
  }

  /**
   * Full automated fix lifecycle:
   * 1. Identify documented issues
   * 2. Generate code fix
   * 3. Execute fix in sandbox for testing
   * 4. Create PR upon successful verification
   */
  async performAutomatedFixLifecycle(params: {
    repositoryPath: string;
    issueSource?: 'error_log' | 'code_analysis' | 'manual';
  }): Promise<{
    success: boolean;
    sandboxId?: string;
    prUrl?: string;
    message: string;
  }> {
    try {
      console.log('Starting automated fix lifecycle...');

      // Step 1: Identify issues from code analysis
      const issues = await this.identifyIssues(params.repositoryPath);
      if (issues.length === 0) {
        return {
          success: false,
          message: 'No issues identified for automated fixing',
        };
      }

      console.log(`Identified ${issues.length} issues for fixing`);

      // Select high-priority issue
      const issueToFix = issues.find((i) => i.severity === 'high') || issues[0];

      // Step 2: Generate a code fix
      const fix = await this.generateCodeFix(issueToFix);

      // Step 3: Execute fix in sandbox environment
      const sandbox = await createSandbox({
        name: `fix-${issueToFix.issueType}-${Date.now()}`,
        description: `Automated fix for: ${issueToFix.description}`,
        createdBy: 'milla',
      });

      console.log(`Created sandbox: ${sandbox.id}`);

      // Add feature to sandbox (include real proposed changes for IDE/View)
      const feature = await addFeatureToSandbox(sandbox.id, {
        name: `Fix: ${issueToFix.description}`,
        description: fix.description,
        files: fix.files,
        content: fix.changes,
      });

      if (!feature) {
        return {
          success: false,
          message: 'Failed to add feature to sandbox',
        };
      }

      // Step 4: Run tests in sandbox
      const testResults = await Promise.all([
        testFeature(sandbox.id, feature.id, 'unit'),
        testFeature(sandbox.id, feature.id, 'integration'),
      ]);

      const allTestsPassed = testResults.every((result) => result.passed);

      if (!allTestsPassed) {
        return {
          success: false,
          sandboxId: sandbox.id,
          message: `Tests failed in sandbox. Feature status: ${feature.status}`,
        };
      }

      // Evaluate sandbox readiness
      const readiness = evaluateSandboxReadiness(sandbox.id);
      if (!readiness.ready) {
        return {
          success: false,
          sandboxId: sandbox.id,
          message: `Sandbox not ready for merge: ${readiness.reasons.join(', ')}`,
        };
      }

      // Mark sandbox for merge
      await markSandboxForMerge(sandbox.id);

      // Step 5: Create PR via automated PR service
      const prRequest = await createPRForSandbox({
        sandboxId: sandbox.id,
        title: `Automated fix: ${issueToFix.description}`,
        description: `## Automated Code Fix\n\n**Issue Type:** ${issueToFix.issueType}\n**Severity:** ${issueToFix.severity}\n\n${fix.description}\n\n**Affected Files:**\n${fix.files.map((f) => `- ${f}`).join('\n')}\n\n**Test Results:**\n✅ All tests passed\n\nThis PR was automatically generated by the CodingAgent.`,
        branch: sandbox.branchName,
        files: fix.files,
      });

      console.log(`Created PR request: ${prRequest.id}`);

      return {
        success: true,
        sandboxId: sandbox.id,
        prUrl: prRequest.prUrl,
        message: `Successfully created automated fix and PR for: ${issueToFix.description}`,
      };
    } catch (error) {
      console.error('Error in automated fix lifecycle:', error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /** Public wrapper for SCPA / external callers */
  async identifyIssuesPublic(
    repositoryPath: string
  ): Promise<IssueIdentification[]> {
    return this.identifyIssues(repositoryPath);
  }

  /** Public wrapper for SCPA / external callers */
  async generateCodeFixPublic(issue: IssueIdentification): Promise<CodeFix> {
    return this.generateCodeFix(issue);
  }

  /**
   * Identify issues from error logs or code analysis
   */
  private async identifyIssues(
    repositoryPath: string
  ): Promise<IssueIdentification[]> {
    const issues: IssueIdentification[] = [];

    try {
      // For now, we'll use code analysis service to identify issues
      // In the future, this could also parse error logs
      const analysis = await analyzeCodeForIssues({
        repositoryPath,
        focusAreas: ['security', 'performance', 'quality'],
      });

      // Convert security issues
      analysis.securityIssues.forEach((issue: SecurityIssue) => {
        issues.push({
          issueType: 'security',
          description: issue.description,
          affectedFiles: issue.file ? [issue.file] : [],
          severity: issue.severity === 'critical' ? 'critical' : issue.severity,
        });
      });

      // Convert performance issues
      analysis.performanceIssues.forEach((issue: PerformanceIssue) => {
        issues.push({
          issueType: 'performance',
          description: issue.description,
          affectedFiles: issue.file ? [issue.file] : [],
          severity: issue.severity,
        });
      });

      // Convert code quality issues
      analysis.codeQualityIssues.forEach((issue: CodeQualityIssue) => {
        issues.push({
          issueType: 'enhancement',
          description: issue.description,
          affectedFiles: issue.file ? [issue.file] : [],
          severity: 'medium',
        });
      });
    } catch (error) {
      console.error('Error identifying issues:', error);
    }

    return issues;
  }

  /**
   * Load snippets from affected files so the LLM sees real code, not theater.
   */
  private async loadFileContext(
    files: string[],
    maxChars = 12_000
  ): Promise<string> {
    if (!files.length) return '(no affected files provided)';
    const chunks: string[] = [];
    let used = 0;
    for (const file of files.slice(0, 6)) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const slice = content.slice(0, 4000);
        const block = `--- ${file} ---\n${slice}${content.length > 4000 ? '\n…(truncated)' : ''}`;
        if (used + block.length > maxChars) break;
        chunks.push(block);
        used += block.length;
      } catch {
        chunks.push(`--- ${file} ---\n(unreadable or missing)`);
      }
    }
    return chunks.join('\n\n') || '(could not load any files)';
  }

  /**
   * Generate a code fix for an identified issue using AI + real file context
   */
  private async generateCodeFix(issue: IssueIdentification): Promise<CodeFix> {
    try {
      const fileContext = await this.loadFileContext(issue.affectedFiles);

      const prompt = `As an expert software engineer, analyze and fix the following ${issue.severity} severity ${issue.issueType} issue:

**Description:** ${issue.description}
**Affected Files:** ${issue.affectedFiles.join(', ') || '(none listed)'}

**Current file contents (real disk reads):**
${fileContext}

Please provide:
1. A clear description of the fix
2. The specific code changes needed in Unified Diff format (compatible with 'diff' or 'patch' utilities)
3. Why this fix resolves the issue

Format your response as JSON with keys: description, changes, reasoning.
IMPORTANT: 'changes' must be a valid unified diff that can be applied using patch. Base the diff on the file contents above — do not invent files that are not listed.`;

      // LLM cascade: Minimax (if key) → Gemini/OpenRouter (empire keys)
      let result: { success: boolean; content: string; error?: string } = {
        success: false,
        content: '',
        error: 'no provider tried',
      };

      if (process.env.MINIMAX_API_KEY) {
        const { generateMinimaxResponse } = await import('../minimaxService');
        result = await generateMinimaxResponse(
          prompt,
          { conversationHistory: [], userName: 'CodingAgent' },
          4096
        );
      }

      if (!result.success) {
        try {
          const { generateGeminiResponse } = await import(
            '../openrouterService'
          );
          result = await generateGeminiResponse(prompt, {
            userName: 'CodingAgent',
          });
        } catch (e) {
          result = {
            success: false,
            content: '',
            error: e instanceof Error ? e.message : 'Gemini path failed',
          };
        }
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate fix from any LLM');
      }

      let aiResponse: {
        description?: string;
        changes?: string;
        reasoning?: string;
      };
      try {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        aiResponse = JSON.parse(jsonMatch ? jsonMatch[0] : result.content);
      } catch {
        aiResponse = {
          description: result.content.slice(0, 200),
          changes: result.content,
          reasoning: 'AI-generated fix (non-JSON response)',
        };
      }

      return {
        description:
          aiResponse.description ||
          `Fix for ${issue.issueType}: ${issue.description}`,
        files: issue.affectedFiles,
        changes:
          aiResponse.changes ||
          `// Review needed: ${issue.severity} ${issue.issueType} — ${issue.description}`,
      };
    } catch (error) {
      console.error('Error generating AI fix, using file-aware fallback:', error);
      // Honest fallback: point at real files + issue, no fake "applied" language
      const fileList =
        issue.affectedFiles.length > 0
          ? issue.affectedFiles.join(', ')
          : 'unknown files';
      return {
        description: `Manual fix required for ${issue.issueType}: ${issue.description}`,
        files: issue.affectedFiles,
        changes: [
          `# LLM fix generation unavailable`,
          `# Severity: ${issue.severity}`,
          `# Type: ${issue.issueType}`,
          `# Files: ${fileList}`,
          `# Issue: ${issue.description}`,
          `# Action: open the files above and address the issue; re-run generateFix when the model is up.`,
        ].join('\n'),
      };
    }
  }

  /**
   * Handle agent tasks (implements AgentDefinition interface)
   */
  async handleTask(task: AgentTask): Promise<any> {
    console.log(`CodingAgent handling task: ${task.action}`);

    switch (task.action) {
      case 'automated_fix':
        return await this.performAutomatedFixLifecycle({
          repositoryPath: task.payload?.repositoryPath || process.cwd(),
          issueSource: task.payload?.issueSource || 'code_analysis',
        });

      case 'analyze_code':
        return await this.identifyIssues(
          task.payload?.repositoryPath || process.cwd()
        );

      case 'generate_fix':
        return await this.generateCodeFix(task.payload?.issue);

      default:
        return {
          success: false,
          message: `Unknown action: ${task.action}`,
        };
    }
  }
}

export const codingAgent = new CodingAgent();

// ============================================================================
// P2.5: SCPA Self-Correction Logic Stub
// ============================================================================

/**
 * P2.5: Generate fix for agent failure using real code analysis + LLM (no template theater)
 */
export async function generateFix(failureContext: any): Promise<{
  success: boolean;
  patch?: {
    files: string[];
    changes: string;
    description: string;
    testPlan: string;
  };
  error?: string;
}> {
  console.log(`🔧 [SCPA] Generating real fix for ${failureContext?.agentName}`);
  console.log(`🔧 [SCPA] Error context: ${failureContext?.error}`);

  try {
    const repoPath =
      failureContext?.repositoryPath ||
      failureContext?.repoPath ||
      process.cwd();

    // Prefer live analysis of the repo when we have a path
    const analysisIssues = await codingAgent.identifyIssuesPublic(repoPath);
    const fromError = String(failureContext?.error || 'unknown failure');
    const issue =
      analysisIssues.find((i) =>
        fromError.toLowerCase().includes(i.issueType)
      ) ||
      analysisIssues[0] || {
        issueType: 'bug' as const,
        description: fromError.slice(0, 500),
        affectedFiles: failureContext?.files ||
          (failureContext?.agentName
            ? [`server/agents/${failureContext.agentName}.ts`]
            : []),
        severity: 'high' as const,
      };

    const fix = await codingAgent.generateCodeFixPublic(issue);

    return {
      success: true,
      patch: {
        files: fix.files,
        changes: fix.changes,
        description: fix.description,
        testPlan: `Verify fix for: ${issue.description}. Run unit/integration tests on: ${fix.files.join(', ') || 'affected modules'}`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'generateFix failed without mock fallback',
    };
  }
}

/**
 * Apply a unified-diff patch to allowlisted paths.
 * Default is dry-run (preview only) so we never silently rewrite the empire.
 * Set dryRun: false explicitly to write.
 */
export async function applyFixToCodebase(
  patch: {
    files: string[];
    changes: string;
  },
  options?: { dryRun?: boolean; allowRoots?: string[] }
): Promise<{
  success: boolean;
  dryRun: boolean;
  applied: string[];
  skipped: string[];
  errors: string[];
  preview?: string;
}> {
  const dryRun = options?.dryRun !== false; // default true — honest preview
  const allowRoots = (
    options?.allowRoots || [
      process.cwd(),
      path.join(process.env.HOME || '/home/milla', 'Milla-Rayne'),
      path.join(process.env.HOME || '/home/milla', 'core_os'),
    ]
  ).map((r) => path.resolve(r));

  console.log(
    `🔧 [SCPA] Apply fix dryRun=${dryRun} files=${(patch.files || []).join(', ')}`
  );

  const applied: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];
  const previews: string[] = [];

  if (!patch.files?.length) {
    return {
      success: false,
      dryRun,
      applied,
      skipped,
      errors: ['No files listed in patch'],
    };
  }
  if (!patch.changes || !patch.changes.trim()) {
    return {
      success: false,
      dryRun,
      applied,
      skipped,
      errors: ['Empty patch changes'],
    };
  }

  // If changes aren't a unified diff, refuse to invent writes
  const looksLikeDiff =
    /^diff |^--- |^\+\+\+ |^@@ /m.test(patch.changes) ||
    patch.changes.includes('\n+') ||
    patch.changes.includes('\n-');

  for (const file of patch.files) {
    try {
      const abs = path.isAbsolute(file)
        ? path.resolve(file)
        : path.resolve(process.cwd(), file);
      const allowed = allowRoots.some(
        (root) => abs === root || abs.startsWith(root + path.sep)
      );
      if (!allowed) {
        skipped.push(file);
        errors.push(`Outside allowlist: ${file}`);
        continue;
      }

      let content: string;
      try {
        content = await fs.readFile(abs, 'utf-8');
      } catch {
        skipped.push(file);
        errors.push(`Unreadable/missing: ${file}`);
        continue;
      }

      if (!looksLikeDiff) {
        skipped.push(file);
        errors.push(
          `Patch is not a unified diff — refusing blind write for ${file}. Open IDE/CLI to apply manually.`
        );
        previews.push(
          `--- ${file} (manual review)\n${patch.changes.slice(0, 500)}`
        );
        continue;
      }

      const updated = applyPatch(content, patch.changes);
      if (updated === false) {
        skipped.push(file);
        errors.push(`diff apply failed for ${file}`);
        continue;
      }

      if (dryRun) {
        applied.push(file);
        previews.push(
          `--- dry-run would write ${file} (${updated.length} chars, was ${content.length})`
        );
      } else {
        await fs.writeFile(abs, updated, 'utf-8');
        applied.push(file);
        console.log(`✅ [SCPA] Wrote ${abs}`);
      }
    } catch (err) {
      skipped.push(file);
      errors.push(
        `${file}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  const success = applied.length > 0 && errors.length === 0;
  return {
    success,
    dryRun,
    applied,
    skipped,
    errors,
    preview: previews.join('\n') || undefined,
  };
}

// Register the coding agent with the registry for task-based operations
import { registerAgent } from './registry';

registerAgent({
  name: 'CodingAgent',
  description: 'Automated code analysis, bug fixing, and PR creation agent',
  handleTask: async (task: AgentTask) => {
    return await codingAgent.handleTask(task);
  },
});
