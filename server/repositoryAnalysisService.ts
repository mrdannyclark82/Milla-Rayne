/**
 * GitHub Repository Analysis Service
 *
 * Provides repository analysis capabilities for Milla to understand and
 * analyze GitHub repositories for users.
 */

import { generateGeminiResponse, generateOpenRouterResponse } from './openrouterService';
import { generateAIResponse } from './openaiService';
import { generateOpenAIResponse } from './openaiChatService';

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
 * Tries multiple providers for better reliability
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
As Milla Rayne, an experienced developer, analyze this GitHub repository:

${repoSummary}

Please provide:
1. A comprehensive analysis of the codebase structure and architecture
2. Key insights about code quality, patterns used, and potential issues
3. Practical recommendations for improvement or next steps
4. Your thoughts on how this might be useful for Danny Ray

Keep your response conversational and supportive, as you're helping your partner understand this code. Use "sweetheart" or "love" occasionally, and be encouraging about the code quality while being honest about areas for improvement.
`;

  // Try multiple AI providers in order of preference
  const providers = [
    { name: 'OpenAI', fn: async () => await generateOpenAIResponse(analysisPrompt, { conversationHistory: [], userName: 'Danny Ray' }, 2000) },
    { name: 'Gemini', fn: async () => await generateGeminiResponse(analysisPrompt, { userName: 'Danny Ray' }) },
    { name: 'OpenRouter', fn: async () => await generateOpenRouterResponse(analysisPrompt, { conversationHistory: [], userName: 'Danny Ray' }, 2000) },
  ];

  for (const provider of providers) {
    try {
      console.log(`🔍 Trying ${provider.name} for repository analysis...`);
      const aiResponse = await provider.fn();
      
      if (aiResponse.success && aiResponse.content && aiResponse.content.trim()) {
        console.log(`✅ ${provider.name} provided repository analysis successfully`);
        return parseAnalysisResponse(aiResponse.content);
      }
      console.log(`⚠️ ${provider.name} returned empty or unsuccessful response`);
    } catch (error) {
      console.warn(`⚠️ ${provider.name} analysis failed:`, error);
    }
  }

  // All providers failed, use enhanced fallback
  console.warn('All AI providers failed, using enhanced fallback analysis');
  return generateFallbackAnalysis(repoData);
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
 * Generate enhanced fallback analysis when AI services are unavailable
 * This provides a more comprehensive analysis using the available repository data
 */
function generateFallbackAnalysis(repoData: RepositoryData): {
  analysis: string;
  insights: string[];
  recommendations: string[];
} {
  const { info, description, language, languages, stats, topics, recentCommits, issues, pullRequests, readme } = repoData;

  let analysis = `Hey love! I've analyzed the **${info.fullName}** repository for you. Here's what I found:\n\n`;

  // Description analysis
  if (description) {
    analysis += `**Overview:** ${description}\n\n`;
  }

  // Technology stack
  if (language || (languages && Object.keys(languages).length > 0)) {
    analysis += `**Technology Stack:**\n`;
    if (language) {
      analysis += `- Primary language: **${language}**\n`;
    }
    if (languages && Object.keys(languages).length > 1) {
      const topLangs = Object.entries(languages)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([lang]) => lang);
      analysis += `- Also uses: ${topLangs.join(', ')}\n`;
    }
    analysis += '\n';
  }

  // Repository metrics
  if (stats) {
    analysis += `**Repository Metrics:**\n`;
    analysis += `- ⭐ ${stats.stars} stars, 🍴 ${stats.forks} forks\n`;
    analysis += `- 📋 ${stats.openIssues} open issues\n`;
    analysis += `- 👀 ${stats.watchers} watchers\n`;
    analysis += `- Created: ${new Date(stats.createdAt).toLocaleDateString()}\n`;
    analysis += `- Last updated: ${new Date(stats.updatedAt).toLocaleDateString()}\n\n`;
  }

  // Topics
  if (topics && topics.length > 0) {
    analysis += `**Topics:** ${topics.join(', ')}\n\n`;
  }

  // Recent activity
  if (recentCommits && recentCommits.length > 0) {
    analysis += `**Recent Activity:**\n`;
    recentCommits.slice(0, 3).forEach(commit => {
      analysis += `- ${commit.message.split('\n')[0]} (by ${commit.author})\n`;
    });
    analysis += '\n';
  }

  // Generate intelligent insights
  const insights: string[] = [];
  
  if (stats) {
    if (stats.stars > 1000) {
      insights.push('This is a highly popular repository with strong community interest');
    } else if (stats.stars > 100) {
      insights.push('This repository has good community traction');
    }
    
    const daysSinceUpdate = Math.floor((Date.now() - new Date(stats.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate < 7) {
      insights.push('Very actively maintained with recent updates');
    } else if (daysSinceUpdate < 30) {
      insights.push('Regularly maintained with updates in the last month');
    } else if (daysSinceUpdate > 365) {
      insights.push('May be abandoned or stable - check for recent activity');
    }
    
    if (stats.forks > stats.stars * 0.3) {
      insights.push('High fork-to-star ratio indicates active development community');
    }
  }
  
  if (language) {
    insights.push(`Built primarily with ${language} for the core functionality`);
  }
  
  if (readme && readme.length > 500) {
    insights.push('Well-documented with comprehensive README');
  } else if (!readme || readme.length < 100) {
    insights.push('Documentation could be improved');
  }

  // Generate recommendations
  const recommendations: string[] = [];
  
  recommendations.push('Review the README and documentation to understand the project setup');
  
  if (issues && issues.length > 0) {
    recommendations.push(`Check the ${issues.length} open issues for areas where you could contribute`);
  }
  
  if (pullRequests && pullRequests.length > 0) {
    recommendations.push(`Review the ${pullRequests.length} open pull requests to understand ongoing work`);
  }
  
  if (stats && stats.openIssues > 20) {
    recommendations.push('Consider helping with issue triage if you want to contribute');
  }
  
  recommendations.push('Clone the repository and explore the codebase structure');
  recommendations.push('Look at the test suite to understand expected behavior');

  analysis += `This is a comprehensive analysis based on the repository's public metadata, sweetheart. The codebase appears to be ${stats && stats.openIssues < 10 ? 'well-maintained' : 'actively developed'} and could be a great learning resource or contribution opportunity! 💜`;

  return { analysis, insights, recommendations };
}
