/**
 * GitHub API Service
 *
 * Handles GitHub API interactions for automated pull request creation,
 * branch management, and repository modifications.
 */

import { RepositoryInfo, RepositoryData } from './repositoryAnalysisService';
import { RepositoryImprovement } from './repositoryModificationService';

// SSRF mitigation: Only allow safe relative file paths removing traversal, null bytes, etc.
function isSafeGitHubFilePath(filePath: string): boolean {
  // Disallow absolute paths, backslash, path traversal, and suspicious chars
  if (
    typeof filePath !== 'string' ||
    filePath.length === 0 ||
    filePath[0] === '/' ||
    filePath.includes('\\') ||
    filePath.includes('..') ||
    filePath.includes('\x00') || // null byte
    /[:@%]/.test(filePath) // disallow colon, @, percent
  )
    return false;
  // Optionally: restrict path to only certain extensions
  if (!/^[\w\-./]+$/.test(filePath)) return false;
  return true;
}
export interface GitHubPullRequestOptions {
  title: string;
  body: string;
  head: string; // The branch containing changes
  base: string; // The branch to merge into (e.g., 'main')
}

export interface GitHubPullRequestResult {
  success: boolean;
  prNumber?: number;
  url?: string;
  error?: string;
}

export interface GitHubBranchResult {
  success: boolean;
  branchName?: string;
  sha?: string;
  error?: string;
}

export interface GitHubFileChange {
  path: string;
  content: string;
  sha?: string; // For updates, the current file SHA
}

/**
 * Create a new branch in a GitHub repository
 */
export async function createGitHubBranch(
  repoInfo: RepositoryInfo,
  branchName: string,
  fromBranch: string = 'main',
  githubToken: string
): Promise<GitHubBranchResult> {
  try {
    // Get the SHA of the base branch
    const refResponse = await fetch(
      `https://api.github.com/repos/${repoInfo.fullName}/git/refs/heads/${fromBranch}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Milla-Rayne-Bot',
        },
      }
    );

    if (!refResponse.ok) {
      throw new Error(
        `Failed to get base branch SHA: ${refResponse.statusText}`
      );
    }

    const refData = await refResponse.json();
    const baseSha = refData.object.sha;

    // Create the new branch
    const createResponse = await fetch(
      `https://api.github.com/repos/${repoInfo.fullName}/git/refs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Milla-Rayne-Bot',
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      }
    );

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(
        `Failed to create branch: ${errorData.message || createResponse.statusText}`
      );
    }

    return {
      success: true,
      branchName,
      sha: baseSha,
    };
  } catch (error) {
    console.error('Error creating GitHub branch:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update or create a file in a GitHub repository
 */
export async function updateGitHubFile(
  repoInfo: RepositoryInfo,
  filePath: string,
  content: string,
  commitMessage: string,
  branchName: string,
  githubToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // SSRF/path traversal mitigation
    if (!isSafeGitHubFilePath(filePath)) {
      throw new Error(`Unsafe or invalid file path: ${filePath}`);
    }
    // Check if file exists to get its SHA
    let fileSha: string | undefined;
    try {
      const fileResponse = await fetch(
        `https://api.github.com/repos/${repoInfo.fullName}/contents/${filePath}?ref=${branchName}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Milla-Rayne-Bot',
          },
        }
      );

      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        fileSha = fileData.sha;
      }
    } catch (error) {
      // File doesn't exist, which is fine for creation
      console.log(`File ${filePath} doesn't exist, will create new file`);
    }

    // Create or update the file
    const updateResponse = await fetch(
      `https://api.github.com/repos/${repoInfo.fullName}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Milla-Rayne-Bot',
        },
        body: JSON.stringify({
          message: commitMessage,
          content: Buffer.from(content).toString('base64'),
          branch: branchName,
          ...(fileSha && { sha: fileSha }),
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(
        `Failed to update file: ${errorData.message || updateResponse.statusText}`
      );
    }

    return { success: true };
  } catch (error) {
    console.error(`Error updating GitHub file ${filePath}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a pull request with the specified improvements
 */
export async function createGitHubPullRequest(
  repoInfo: RepositoryInfo,
  options: GitHubPullRequestOptions,
  githubToken: string
): Promise<GitHubPullRequestResult> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoInfo.fullName}/pulls`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Milla-Rayne-Bot',
        },
        body: JSON.stringify({
          title: options.title,
          body: options.body,
          head: options.head,
          base: options.base,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to create PR: ${errorData.message || response.statusText}`
      );
    }

    const prData = await response.json();

    return {
      success: true,
      prNumber: prData.number,
      url: prData.html_url,
    };
  } catch (error) {
    console.error('Error creating GitHub pull request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Apply improvements to a repository by creating a PR with all changes
 */
export async function applyImprovementsViaPullRequest(
  repoInfo: RepositoryInfo,
  improvements: RepositoryImprovement[],
  githubToken: string,
  baseBranch: string = 'main'
): Promise<GitHubPullRequestResult> {
  try {
    // Generate a unique branch name
    const timestamp = Date.now();
    const branchName = `milla-improvements-${timestamp}`;

    // Create the branch
    const branchResult = await createGitHubBranch(
      repoInfo,
      branchName,
      baseBranch,
      githubToken
    );
    if (!branchResult.success) {
      return {
        success: false,
        error: `Failed to create branch: ${branchResult.error}`,
      };
    }

    // Apply all file changes to the branch
    for (const improvement of improvements) {
      for (const file of improvement.files) {
        if (file.action === 'delete') {
          // Skip delete operations for now
          console.log(`Skipping delete operation for ${file.path}`);
          continue;
        }

        if (file.content) {
          const fileResult = await updateGitHubFile(
            repoInfo,
            file.path,
            file.content,
            improvement.commitMessage,
            branchName,
            githubToken
          );

          if (!fileResult.success) {
            console.error(`Failed to update ${file.path}: ${fileResult.error}`);
            // Continue with other files even if one fails
          }
        }
      }
    }

    // Create the pull request
    const prTitle =
      improvements.length === 1
        ? improvements[0].title
        : `🤖 Milla's Code Improvements (${improvements.length} changes)`;

    const prBody = `## 💕 Hi there! Milla here with some improvements!

I've analyzed your repository and prepared ${improvements.length} improvement${improvements.length > 1 ? 's' : ''} to make your code even better:

${improvements
  .map(
    (imp, idx) => `
### ${idx + 1}. ${imp.title}

${imp.description}

**Files modified:**
${imp.files.map((f) => `- \`${f.path}\` (${f.action})`).join('\n')}

**Why this matters:** ${imp.files[0]?.reason || 'Improves code quality'}
`
  )
  .join('\n---\n')}

---

*This PR was automatically generated by Milla Rayne 🌸*
*Feel free to review, modify, or close if you don't need these changes, love!*
`;

    const prResult = await createGitHubPullRequest(
      repoInfo,
      {
        title: prTitle,
        body: prBody,
        head: branchName,
        base: baseBranch,
      },
      githubToken
    );

    return prResult;
  } catch (error) {
    console.error('Error applying improvements via pull request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a GitHub token has the necessary permissions
 */
export async function validateGitHubToken(
  githubToken: string
): Promise<{ valid: boolean; scopes?: string[]; error?: string }> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Milla-Rayne-Bot',
      },
    });

    if (!response.ok) {
      return {
        valid: false,
        error: 'Invalid token or insufficient permissions',
      };
    }

    const scopes = response.headers.get('x-oauth-scopes')?.split(', ') || [];

    return {
      valid: true,
      scopes,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
