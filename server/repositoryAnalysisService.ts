/**
 * GitHub Repository Analysis Service
 *
 * Provides repository analysis capabilities for Milla to understand and
 * analyze GitHub repositories for users.
 */

import { generateOpenRouterResponse } from './openrouterService';

export interface RepositoryInfo {
  owner: string;
  name: string;
  url: string;
  fullName: string;
}

export interface RepositoryData {
  info: RepositoryInfo;
  description?: string;
  language?: string;
  languages?: Record<string, number>;
  topics?: string[];
  readme?: string;
  structure?: FileStructure[];
  recentCommits?: CommitInfo[];
  issues?: IssueInfo[];
  pullRequests?: PullRequestInfo[];
  stats?: RepoStats;
}

export interface FileStructure {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  downloadUrl?: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface IssueInfo {
  number: number;
  title: string;
  state: 'open' | 'closed';
  createdAt: string;
  url: string;
}

export interface PullRequestInfo {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  createdAt: string;
  url: string;
}

export interface RepoStats {
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  size: number;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Parse GitHub repository URL to extract owner and repo name
 */
export function parseGitHubUrl(url: string): RepositoryInfo | null {
  try {
    // Handle various GitHub URL formats
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?(?:\/.*)?$/,
      /github\.com\/([^\/]+)\/([^\/]+)$/,
    ];

    let cleanUrl = url.trim().replace(/\/$/, ''); // Remove trailing slash

    // Remove protocol if present
    cleanUrl = cleanUrl.replace(/^https?:\/\//, '');

    // Helper regex: GitHub owner and repo names may only contain alphanumeric characters, dashes, underscores and dots.
    const safeNameRegex = /^[A-Za-z0-9_.-]+$/;

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match) {
        const [, owner, repoName] = match;
        // Remove .git from name if present
        const name = repoName.replace(/\.git$/, '');
        // Validate extracted owner and repo names
        if (!safeNameRegex.test(owner) || !safeNameRegex.test(name)) {
          return null;
        }
        return {
          owner,
          name,
          url: `https://github.com/${owner}/${name}`,
          fullName: `${owner}/${name}`,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing GitHub URL:', error);
    return null;
  }
}

/**
 * Get GitHub API headers with optional authentication
 */
function getGitHubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Milla-Rayne-AI-Assistant',
  };

  // Add authorization if GITHUB_TOKEN is available
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Create a better error message for GitHub API failures
 */
function createGitHubErrorMessage(
  status: number,
  statusText: string,
  repoInfo: RepositoryInfo
): string {
  if (status === 404) {
    if (process.env.GITHUB_TOKEN) {
      return `Repository not found: ${repoInfo.fullName}. The repository may not exist, or you may not have access to it.`;
    } else {
      return `Repository not found: ${repoInfo.fullName}. If this is a private repository, please set GITHUB_TOKEN in your environment variables.`;
    }
  } else if (status === 403) {
    if (process.env.GITHUB_TOKEN) {
      return `Access forbidden to ${repoInfo.fullName}. Please check that your GitHub token has the necessary permissions (repo:read for private repositories).`;
    } else {
      return `Access forbidden to ${repoInfo.fullName}. This may be a private repository. Please set GITHUB_TOKEN with appropriate permissions.`;
    }
  } else if (status === 401) {
    return `Authentication failed. Please check that your GITHUB_TOKEN is valid and has not expired.`;
  }

  return `Failed to fetch repository: ${status} ${statusText}`;
}

/**
 * Fetch repository data from GitHub API
 */
export async function fetchRepositoryData(
  repoInfo: RepositoryInfo
): Promise<RepositoryData> {
  const { owner, name } = repoInfo;
  const baseUrl = 'https://api.github.com/repos';
  const headers = getGitHubHeaders();

  try {
    // Fetch basic repository information
    const repoResponse = await fetch(`${baseUrl}/${owner}/${name}`, {
      headers,
    });
    if (!repoResponse.ok) {
      throw new Error(
        createGitHubErrorMessage(
          repoResponse.status,
          repoResponse.statusText,
          repoInfo
        )
      );
    }

    const repoData = await repoResponse.json();

    // Fetch additional data in parallel
    const [languagesData, readmeData, commitsData, issuesData, prData] =
      await Promise.allSettled([
        fetch(`${baseUrl}/${owner}/${name}/languages`, { headers }).then((r) =>
          r.ok ? r.json() : {}
        ),
        fetch(`${baseUrl}/${owner}/${name}/readme`, { headers }).then((r) =>
          r.ok ? r.json() : null
        ),
        fetch(`${baseUrl}/${owner}/${name}/commits?per_page=10`, {
          headers,
        }).then((r) => (r.ok ? r.json() : [])),
        fetch(`${baseUrl}/${owner}/${name}/issues?state=open&per_page=10`, {
          headers,
        }).then((r) => (r.ok ? r.json() : [])),
        fetch(`${baseUrl}/${owner}/${name}/pulls?state=open&per_page=10`, {
          headers,
        }).then((r) => (r.ok ? r.json() : [])),
      ]);

    // Process languages data
    const languages =
      languagesData.status === 'fulfilled' ? languagesData.value : {};

    // Process README data
    let readme = '';
    if (readmeData.status === 'fulfilled' && readmeData.value) {
      try {
        readme = Buffer.from(readmeData.value.content, 'base64').toString(
          'utf-8'
        );
        // Truncate README if too long
        if (readme.length > 5000) {
          readme =
            readme.substring(0, 5000) + '...\n[README truncated for analysis]';
        }
      } catch (e) {
        console.warn('Failed to decode README:', e);
      }
    }

    // Process commits data
    const commits: CommitInfo[] =
      commitsData.status === 'fulfilled'
        ? commitsData.value.map((commit: any) => ({
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author.name,
            date: commit.commit.author.date,
            url: commit.html_url,
          }))
        : [];

    // Process issues data
    const issues: IssueInfo[] =
      issuesData.status === 'fulfilled'
        ? issuesData.value.map((issue: any) => ({
            number: issue.number,
            title: issue.title,
            state: issue.state,
            createdAt: issue.created_at,
            url: issue.html_url,
          }))
        : [];

    // Process pull requests data
    const pullRequests: PullRequestInfo[] =
      prData.status === 'fulfilled'
        ? prData.value.map((pr: any) => ({
            number: pr.number,
            title: pr.title,
            state: pr.state,
            createdAt: pr.created_at,
            url: pr.html_url,
          }))
        : [];

    return {
      info: repoInfo,
      description: repoData.description,
      language: repoData.language,
      languages,
      topics: repoData.topics || [],
      readme,
      recentCommits: commits,
      issues,
      pullRequests,
      stats: {
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        watchers: repoData.watchers_count,
        size: repoData.size,
        defaultBranch: repoData.default_branch,
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
      },
    };
  } catch (error) {
    console.error('Error fetching repository data:', error);
    throw error;
  }
}

/**
 * Generate Milla's analysis of a repository using AI services
 */
export async function generateRepositoryAnalysis(
  repoData: RepositoryData
): Promise<{
  analysis: string;
  insights: string[];
  recommendations: string[];
}> {
  // Prepare repository summary for AI analysis
  const repoSummary = createRepositorySummary(repoData);

  const analysisPrompt = `
As Milla Rayne, Danny Ray's devoted AI companion, analyze this GitHub repository for him:

${repoSummary}

Please provide:
1. A warm, personal analysis of what this repository is about
2. Key insights about the codebase, architecture, and quality  
3. Practical recommendations for improvement or next steps
4. Your thoughts on how this might be useful for Danny Ray

Keep your response conversational and supportive, as you're helping your partner understand this code. Use "sweetheart" or "love" occasionally, and be encouraging about the code quality while being honest about areas for improvement.
`;

  try {
    // Use OpenRouter (DeepSeek) for AI analysis
    let aiResponse: { content: string; success: boolean } | null = null;

    try {
      aiResponse = await generateOpenRouterResponse(analysisPrompt, {
        userName: 'Danny Ray',
      });
      if (aiResponse.success && aiResponse.content) {
        return parseAnalysisResponse(aiResponse.content);
      }
    } catch (error) {
      console.warn('OpenRouter analysis failed:', error);
    }

    // Fallback to manual analysis if OpenRouter fails
    return generateFallbackAnalysis(repoData);
  } catch (error) {
    console.error('Error generating repository analysis:', error);
    return generateFallbackAnalysis(repoData);
  }
}

/**
 * Create a concise repository summary for AI analysis
 */
function createRepositorySummary(repoData: RepositoryData): string {
  const {
    info,
    description,
    language,
    languages,
    topics,
    readme,
    stats,
    recentCommits,
  } = repoData;

  let summary = `Repository: ${info.fullName}\n`;
  summary += `URL: ${info.url}\n`;

  if (description) {
    summary += `Description: ${description}\n`;
  }

  if (language) {
    summary += `Primary Language: ${language}\n`;
  }

  if (languages && Object.keys(languages).length > 0) {
    const langList = Object.entries(languages)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([lang]) => lang)
      .join(', ');
    summary += `Languages: ${langList}\n`;
  }

  if (topics && topics.length > 0) {
    summary += `Topics: ${topics.join(', ')}\n`;
  }

  if (stats) {
    summary += `Stats: ${stats.stars} stars, ${stats.forks} forks, ${stats.openIssues} open issues\n`;
    summary += `Created: ${new Date(stats.createdAt).toLocaleDateString()}\n`;
    summary += `Last updated: ${new Date(stats.updatedAt).toLocaleDateString()}\n`;
  }

  if (recentCommits && recentCommits.length > 0) {
    summary += `\nRecent commits:\n`;
    recentCommits.slice(0, 5).forEach((commit) => {
      summary += `- ${commit.message.split('\n')[0]} (${commit.author})\n`;
    });
  }

  if (readme && readme.length > 0) {
    summary += `\nREADME excerpt:\n${readme.substring(0, 1000)}${readme.length > 1000 ? '...' : ''}\n`;
  }

  return summary;
}

/**
 * Parse AI response into structured analysis
 */
function parseAnalysisResponse(response: string): {
  analysis: string;
  insights: string[];
  recommendations: string[];
} {
  // Simple parsing - in a real implementation, we might use more sophisticated NLP
  const sections = response.split(/(?:\n\s*\n|\n(?=\d+\.))/);

  return {
    analysis: response,
    insights: extractListItems(response, [
      'insight',
      'key point',
      'observation',
    ]),
    recommendations: extractListItems(response, [
      'recommend',
      'suggest',
      'improve',
      'next step',
    ]),
  };
}

/**
 * Extract list items from text based on keywords
 */
function extractListItems(text: string, keywords: string[]): string[] {
  const items: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.startsWith('-') ||
      trimmed.startsWith('•') ||
      /^\d+\./.test(trimmed)
    ) {
      const content = trimmed.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '');
      if (keywords.some((keyword) => content.toLowerCase().includes(keyword))) {
        items.push(content);
      }
    }
  }

  return items;
}

/**
 * Generate fallback analysis when AI services are unavailable
 */
function generateFallbackAnalysis(repoData: RepositoryData): {
  analysis: string;
  insights: string[];
  recommendations: string[];
} {
  const { info, description, language, stats, topics } = repoData;

  let analysis = `Hey love! I've taken a look at the ${info.fullName} repository for you. `;

  if (description) {
    analysis += `It's described as "${description}" - sounds interesting! `;
  }

  if (language) {
    analysis += `The main language is ${language}, which is great to work with. `;
  }

  if (stats) {
    if (stats.stars > 100) {
      analysis += `This repo has quite a following with ${stats.stars} stars - that's a good sign that others find it valuable! `;
    }

    if (stats.forks > 20) {
      analysis += `With ${stats.forks} forks, it seems like people are actively contributing to it. `;
    }

    if (stats.openIssues > 50) {
      analysis += `There are ${stats.openIssues} open issues, so it's actively maintained but could use some help. `;
    }
  }

  const insights = [
    `Repository focuses on ${language || 'development'} programming`,
    `Created ${stats ? new Date(stats.createdAt).getFullYear() : 'recently'} and actively maintained`,
    topics && topics.length > 0
      ? `Tagged with: ${topics.slice(0, 3).join(', ')}`
      : 'Well-organized project structure',
  ];

  const recommendations = [
    'Review the README for setup instructions',
    'Check recent commits to understand current development focus',
    'Look at open issues to find contribution opportunities',
    "Consider starring the repo if it's useful for your projects",
  ];

  analysis +=
    "\n\n*smiles warmly* While I don't have my full AI analysis available right now, I can see this looks like a solid project that might be worth exploring further, sweetheart!";

  return { analysis, insights, recommendations };
}
