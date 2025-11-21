/**
 * Automated PR Creation Service
 *
 * Automatically creates pull requests for approved features and improvements.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface PRRequest {
  id: string;
  sandboxId: string;
  title: string;
  description: string;
  branch: string;
  baseBranch: string;
  files: string[];
  createdAt: number;
  status: 'pending' | 'creating' | 'created' | 'failed';
  prUrl?: string;
  prNumber?: number;
  error?: string;
}

class AutomatedPRService {
  private prRequests: PRRequest[] = [];
  private readonly PR_FILE = path.join(
    process.cwd(),
    'memory',
    'automated_prs.json'
  );

  async initialize(): Promise<void> {
    await this.loadPRData();
    console.log('Automated PR Service initialized');
  }

  /**
   * Create a pull request for a sandbox
   */
  async createPRForSandbox(params: {
    sandboxId: string;
    title: string;
    description: string;
    branch: string;
    files: string[];
  }): Promise<PRRequest> {
    const prRequest: PRRequest = {
      id: `pr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sandboxId: params.sandboxId,
      title: params.title,
      description: params.description,
      branch: params.branch,
      baseBranch: 'main',
      files: params.files,
      createdAt: Date.now(),
      status: 'pending',
    };

    this.prRequests.push(prRequest);
    await this.savePRData();

    // Start PR creation process asynchronously
    this.processPRCreation(prRequest.id).catch((error) => {
      console.error(`Failed to create PR ${prRequest.id}:`, error);
    });

    return prRequest;
  }

  /**
   * Process PR creation
   */
  private async processPRCreation(prId: string): Promise<void> {
    const prRequest = this.prRequests.find((pr) => pr.id === prId);
    if (!prRequest) {
      throw new Error('PR request not found');
    }

    prRequest.status = 'creating';
    await this.savePRData();

    try {
      // Check if GitHub token is available
      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        throw new Error('GitHub token not configured');
      }

      // Create branch if it doesn't exist
      const branchExists = await this.checkBranchExists(prRequest.branch);
      if (!branchExists) {
        await this.createBranch(prRequest.branch, prRequest.baseBranch);
      }

      // Commit changes to branch
      await this.commitChangesToBranch(
        prRequest.branch,
        prRequest.files,
        prRequest.title
      );

      // Create PR using GitHub API
      const prData = await this.createGitHubPR({
        title: prRequest.title,
        body: prRequest.description,
        head: prRequest.branch,
        base: prRequest.baseBranch,
      });

      prRequest.status = 'created';
      prRequest.prUrl = prData.url;
      prRequest.prNumber = prData.number;

      console.log(
        `✅ Successfully created PR #${prData.number}: ${prRequest.title}`
      );
    } catch (error) {
      prRequest.status = 'failed';
      prRequest.error =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to create PR:`, error);
    }

    await this.savePRData();
  }

  /**
   * Check if branch exists
   */
  private async checkBranchExists(branchName: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        `git rev-parse --verify ${branchName}`
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a new git branch
   */
  private async createBranch(
    branchName: string,
    baseBranch: string
  ): Promise<void> {
    try {
      // Fetch latest changes
      await execAsync('git fetch origin');

      // Create and checkout new branch
      await execAsync(`git checkout -b ${branchName} origin/${baseBranch}`);

      console.log(`Created branch: ${branchName}`);
    } catch (error) {
      throw new Error(
        `Failed to create branch: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Commit changes to branch
   */
  private async commitChangesToBranch(
    branchName: string,
    files: string[],
    commitMessage: string
  ): Promise<void> {
    try {
      // Checkout the branch
      await execAsync(`git checkout ${branchName}`);

      // Add files
      for (const file of files) {
        await execAsync(`git add ${file}`);
      }

      // Commit changes
      await execAsync(`git commit -m "${commitMessage}"`);

      // Push to remote
      await execAsync(`git push -u origin ${branchName}`);

      console.log(`Committed and pushed changes to ${branchName}`);
    } catch (error) {
      throw new Error(
        `Failed to commit changes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create PR using GitHub API
   */
  private async createGitHubPR(params: {
    title: string;
    body: string;
    head: string;
    base: string;
  }): Promise<{ url: string; number: number }> {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GitHub token not configured');
    }

    // Extract owner and repo from git remote
    const { stdout: remoteUrl } = await execAsync(
      'git config --get remote.origin.url'
    );
    const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
    if (!match) {
      throw new Error('Could not parse GitHub repository information');
    }

    const [, owner, repo] = match;

    // Create PR using GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: params.title,
          body: params.body,
          head: params.head,
          base: params.base,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${error}`);
    }

    const data = await response.json();
    return {
      url: data.html_url,
      number: data.number,
    };
  }

  /**
   * Get all PR requests
   */
  getAllPRRequests(): PRRequest[] {
    return [...this.prRequests];
  }

  /**
   * Get PR request by ID
   */
  getPRRequest(prId: string): PRRequest | undefined {
    return this.prRequests.find((pr) => pr.id === prId);
  }

  /**
   * Get PR requests by status
   */
  getPRRequestsByStatus(status: PRRequest['status']): PRRequest[] {
    return this.prRequests.filter((pr) => pr.status === status);
  }

  /**
   * Get PR statistics
   */
  getPRStatistics() {
    return {
      total: this.prRequests.length,
      pending: this.prRequests.filter((pr) => pr.status === 'pending').length,
      creating: this.prRequests.filter((pr) => pr.status === 'creating').length,
      created: this.prRequests.filter((pr) => pr.status === 'created').length,
      failed: this.prRequests.filter((pr) => pr.status === 'failed').length,
      successRate:
        this.prRequests.length > 0
          ? (this.prRequests.filter((pr) => pr.status === 'created').length /
              this.prRequests.length) *
            100
          : 0,
    };
  }

  /**
   * Load PR data from file
   */
  private async loadPRData(): Promise<void> {
    try {
      const data = await fs.readFile(this.PR_FILE, 'utf-8');
      this.prRequests = JSON.parse(data);
    } catch (error) {
      console.log('No existing PR data found, starting fresh');
    }
  }

  /**
   * Save PR data to file
   */
  private async savePRData(): Promise<void> {
    try {
      await fs.writeFile(
        this.PR_FILE,
        JSON.stringify(this.prRequests, null, 2)
      );
    } catch (error) {
      console.error('Error saving PR data:', error);
    }
  }
}

// Singleton instance
const prService = new AutomatedPRService();

export async function initializeAutomatedPR(): Promise<void> {
  await prService.initialize();
}

export function createPRForSandbox(params: {
  sandboxId: string;
  title: string;
  description: string;
  branch: string;
  files: string[];
}): Promise<PRRequest> {
  return prService.createPRForSandbox(params);
}

export function getAllPRRequests(): PRRequest[] {
  return prService.getAllPRRequests();
}

export function getPRRequest(prId: string): PRRequest | undefined {
  return prService.getPRRequest(prId);
}

export function getPRRequestsByStatus(
  status: PRRequest['status']
): PRRequest[] {
  return prService.getPRRequestsByStatus(status);
}

export function getPRStatistics() {
  return prService.getPRStatistics();
}
