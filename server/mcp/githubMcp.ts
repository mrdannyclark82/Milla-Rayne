/**
 * GitHub MCP Service
 * Enhanced GitHub operations through MCP protocol
 */

import { Octokit } from '@octokit/rest';
import { config } from '../config.js';

export interface GitHubRepository {
  owner: string;
  repo: string;
  fullName: string;
  description?: string;
  stars: number;
  language?: string;
}

export interface GitHubFile {
  path: string;
  content: string;
  sha: string;
  size: number;
}

export class GitHubMCPService {
  private octokit: Octokit | null = null;

  constructor() {
    const token = config.github?.token;
    if (token) {
      this.octokit = new Octokit({ auth: token });
    }
  }

  /**
   * Check if GitHub API is available
   */
  isAvailable(): boolean {
    return this.octokit !== null;
  }

  /**
   * Search repositories
   */
  async searchRepositories(query: string, limit = 10): Promise<GitHubRepository[]> {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    const response = await this.octokit.search.repos({
      q: query,
      per_page: limit,
      sort: 'stars',
      order: 'desc',
    });

    return response.data.items.map(repo => ({
      owner: repo.owner.login,
      repo: repo.name,
      fullName: repo.full_name,
      description: repo.description || undefined,
      stars: repo.stargazers_count,
      language: repo.language || undefined,
    }));
  }

  /**
   * Get file contents from repository
   */
  async getFileContents(owner: string, repo: string, path: string, ref?: string): Promise<GitHubFile> {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    const response = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    if (Array.isArray(response.data) || response.data.type !== 'file') {
      throw new Error(`${path} is not a file`);
    }

    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');

    return {
      path: response.data.path,
      content,
      sha: response.data.sha,
      size: response.data.size,
    };
  }

  /**
   * List repository contents
   */
  async listContents(owner: string, repo: string, path = ''): Promise<any[]> {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    const response = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if (!Array.isArray(response.data)) {
      return [response.data];
    }

    return response.data;
  }

  /**
   * Create an issue
   */
  async createIssue(owner: string, repo: string, title: string, body: string, labels?: string[]): Promise<any> {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    const response = await this.octokit.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });

    return response.data;
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    owner: string, 
    repo: string, 
    title: string, 
    body: string, 
    head: string, 
    base: string
  ): Promise<any> {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    const response = await this.octokit.pulls.create({
      owner,
      repo,
      title,
      body,
      head,
      base,
    });

    return response.data;
  }

  /**
   * List commits
   */
  async listCommits(owner: string, repo: string, sha?: string, limit = 30): Promise<any[]> {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    const response = await this.octokit.repos.listCommits({
      owner,
      repo,
      sha,
      per_page: limit,
    });

    return response.data;
  }

  /**
   * Search code across repositories
   */
  async searchCode(query: string, limit = 10): Promise<any[]> {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    const response = await this.octokit.search.code({
      q: query,
      per_page: limit,
    });

    return response.data.items;
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<any> {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    const response = await this.octokit.repos.get({
      owner,
      repo,
    });

    return response.data;
  }
}

let githubService: GitHubMCPService | null = null;

export function getGitHubMCPService(): GitHubMCPService {
  if (!githubService) {
    githubService = new GitHubMCPService();
  }
  return githubService;
}
