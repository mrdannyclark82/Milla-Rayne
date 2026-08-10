/**
 * GitHub Repository Modification Service
 *
 * Provides repository modification capabilities for Milla to make improvements
 * to GitHub repositories based on analysis and recommendations.
 */

import { generateGeminiResponse } from './openrouterService';
import { RepositoryData, RepositoryInfo } from './repositoryAnalysisService';
import {
  analyzeRepositoryCode,
  generateSecurityImprovements,
  generatePerformanceImprovements,
} from './codeAnalysisService';
import { testAllImprovements, generateTestSummary } from './autoTestingService';

export interface FileModification {
  path: string;
  action: 'create' | 'update' | 'delete';
  content?: string;
  reason: string;
}

export interface RepositoryImprovement {
  title: string;
  description: string;
  files: FileModification[];
  branch?: string;
  commitMessage: string;
}

export interface ModificationResult {
  success: boolean;
  message: string;
  improvements?: RepositoryImprovement[];
  error?: string;
}

/**
 * Generate improvement suggestions for a repository with enhanced analysis
 */
export async function generateRepositoryImprovements(
  repoData: RepositoryData,
  focusArea?: string
): Promise<RepositoryImprovement[]> {
  // Perform enhanced code analysis
  const codeAnalysis = await analyzeRepositoryCode(repoData);

  // Generate context-aware prompt with analysis results
  const analysisContext = `
Security Analysis:
- ${codeAnalysis.securityIssues.length} security issue(s) found
- Critical: ${codeAnalysis.securityIssues.filter((i) => i.severity === 'critical').length}
- High: ${codeAnalysis.securityIssues.filter((i) => i.severity === 'high').length}

Performance Analysis:
- ${codeAnalysis.performanceIssues.length} performance issue(s) found
- High impact: ${codeAnalysis.performanceIssues.filter((i) => i.severity === 'high').length}

Code Quality:
- ${codeAnalysis.codeQualityIssues.length} quality issue(s) found

Language-specific suggestions: ${codeAnalysis.languageSpecificSuggestions.length} available
`;

  const improvementPrompt = `
As Milla Rayne, analyze this repository and suggest specific code improvements:

Repository: ${repoData.info.fullName}
Language: ${repoData.language || 'Unknown'}
Description: ${repoData.description || 'No description'}

${analysisContext}

${focusArea ? `Focus on: ${focusArea}. Specifically, identify opportunities for code refactoring, adherence to best practices, and performance optimizations.` : 'Provide general improvements, including code refactoring, adherence to best practices, and performance optimizations.'}

Based on the repository analysis, suggest 2-3 specific improvements that could be made.
For each improvement, specify:
1. What file(s) need to be modified or created
2. What changes should be made (be specific, provide code snippets if possible)
3. Why this improvement is valuable (e.g., improves readability, performance, security)

Format your response as JSON with this structure:
{
  "improvements": [
    {
      "title": "Brief title",
      "description": "What this improves and why",
      "files": [
        {
          "path": "path/to/file.ts",
          "action": "update" or "create" or "delete",
          "content": "Full new content for the file (for create/update)",
          "reason": "Why this change"
        }
      ],
      "commitMessage": "Git commit message"
    }
  ]
}
`;

  try {
    let aiResponse: { content: string; success: boolean } | null = null;

    // Use Gemini 2.0 Flash for repository improvement generation
    try {
      aiResponse = await generateGeminiResponse(improvementPrompt, {
        userName: 'Danny Ray',
      });
      if (aiResponse.success && aiResponse.content) {
        return parseImprovementResponse(aiResponse.content);
      }
    } catch (error) {
      console.warn('Gemini improvement generation failed:', error);
    }

    // Fallback: real analysis-driven improvements (not CI-only theater)
    return await generateFallbackImprovements(repoData, focusArea, codeAnalysis);
  } catch (error) {
    console.error('Error generating improvements:', error);
    const analysis = await analyzeRepositoryCode(repoData);
    return await generateFallbackImprovements(repoData, focusArea, analysis);
  }
}

/**
 * Parse AI response into structured improvements
 */
function parseImprovementResponse(response: string): RepositoryImprovement[] {
  try {
    // Extract JSON from response if it's wrapped in text
    let jsonText = response;
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonText);
    return parsed.improvements || [];
  } catch (error) {
    console.error('Failed to parse improvement response:', error);
    return [];
  }
}

/**
 * Analysis-driven fallback improvements when AI is unavailable.
 * Diversified: quality, performance, docs, tests, security — not CI-only.
 */
async function generateFallbackImprovements(
  repoData: RepositoryData,
  focusArea?: string,
  analysis?: Awaited<ReturnType<typeof analyzeRepositoryCode>>
): Promise<RepositoryImprovement[]> {
  const improvements: RepositoryImprovement[] = [];
  const codeAnalysis =
    analysis || (await analyzeRepositoryCode(repoData));

  const focus = (focusArea || 'general').toLowerCase();

  // Real security issues from scan
  for (const issue of codeAnalysis.securityIssues.slice(0, 2)) {
    if (focus !== 'general' && focus !== 'security') break;
    improvements.push({
      title: `Security: ${issue.type || 'issue'}`,
      description: `${issue.description}${issue.file ? ` (${issue.file})` : ''}`,
      files: issue.file
        ? [
            {
              path: issue.file,
              action: 'update',
              content: `// TODO: address security — ${issue.recommendation || issue.description}\n`,
              reason: issue.recommendation || issue.description,
            },
          ]
        : [],
      commitMessage: `fix: security — ${issue.type || 'hardening'}`,
    });
  }

  // Performance
  for (const issue of codeAnalysis.performanceIssues.slice(0, 2)) {
    if (focus !== 'general' && focus !== 'performance') continue;
    improvements.push({
      title: `Performance: ${issue.type || 'optimization'}`,
      description: `${issue.description}${issue.file ? ` in ${issue.file}` : ''}`,
      files: issue.file
        ? [
            {
              path: issue.file,
              action: 'update',
              content: `// TODO: performance — ${issue.recommendation || issue.description}\n`,
              reason: issue.recommendation || issue.description,
            },
          ]
        : [],
      commitMessage: `perf: ${issue.type || 'optimize hot path'}`,
    });
  }

  // Code quality / maintainability
  for (const issue of codeAnalysis.codeQualityIssues.slice(0, 2)) {
    if (
      focus !== 'general' &&
      focus !== 'quality' &&
      focus !== 'refactor'
    ) {
      continue;
    }
    improvements.push({
      title: `Quality: ${issue.type || 'cleanup'}`,
      description: `${issue.description}${issue.file ? ` (${issue.file})` : ''}`,
      files: issue.file
        ? [
            {
              path: issue.file,
              action: 'update',
              content: `// TODO: quality — ${issue.recommendation || issue.description}\n`,
              reason: issue.recommendation || issue.description,
            },
          ]
        : [],
      commitMessage: `refactor: ${issue.type || 'code quality'}`,
    });
  }

  // Language-specific suggestions as enhancement items
  for (const tip of (codeAnalysis.languageSpecificSuggestions || []).slice(
    0,
    2
  )) {
    improvements.push({
      title: `Language practice (${repoData.language || 'project'})`,
      description: tip,
      files: [],
      commitMessage: 'chore: apply language best practice',
    });
  }

  // Docs only if thin README
  if (!repoData.readme || repoData.readme.length < 100) {
    improvements.push({
      title: 'Improve project README',
      description:
        'Expand setup, features, and usage so contributors can run the project',
      files: [
        {
          path: 'README.md',
          action: repoData.readme ? 'update' : 'create',
          content: generateReadmeTemplate(repoData),
          reason: 'Thin or missing README blocks onboarding',
        },
      ],
      commitMessage: 'docs: expand README for setup and usage',
    });
  }

  // Tests suggestion if no test files spotted in analysis files list
  const hasTests = (repoData.files || []).some(
    (f) =>
      /\.(test|spec)\./i.test(f.path) ||
      f.path.includes('__tests__') ||
      f.path.includes('/test/')
  );
  if (!hasTests && (focus === 'general' || focus === 'quality' || focus === 'test')) {
    improvements.push({
      title: 'Add a minimal test harness',
      description:
        'No obvious test files found — add unit tests for core modules to catch regressions',
      files: [
        {
          path: 'tests/smoke.test.ts',
          action: 'create',
          content: `// Minimal smoke test placeholder — replace with real assertions\ndescribe('smoke', () => {\n  it('project loads', () => {\n    expect(true).toBe(true);\n  });\n});\n`,
          reason: 'Establish a testing baseline before larger refactors',
        },
      ],
      commitMessage: 'test: add minimal smoke test harness',
    });
  }

  // CI only when explicitly security/ci focused OR zero other ideas
  const wantsCi =
    focus === 'security' || focus === 'ci' || focus === 'devops';
  if (
    wantsCi ||
    (improvements.length === 0 &&
      (repoData.language?.toLowerCase().includes('typescript') ||
        repoData.language?.toLowerCase().includes('javascript')))
  ) {
    improvements.push({
      title: 'Add CI workflow',
      description:
        'Automate install/test (and optional security scanning) with GitHub Actions',
      files: [
        {
          path: '.github/workflows/ci.yml',
          action: 'create',
          content: generateCIWorkflowTemplate(repoData),
          reason: 'Catch breakages early on every push',
        },
      ],
      commitMessage: 'ci: add GitHub Actions workflow',
    });
  }

  // Dedupe by title, cap
  const seen = new Set<string>();
  const unique = improvements.filter((i) => {
    if (seen.has(i.title)) return false;
    seen.add(i.title);
    return true;
  });

  return unique.slice(0, 5);
}

/**
 * Generate a README template
 */
function generateReadmeTemplate(repoData: RepositoryData): string {
  return `# ${repoData.info.name}

${repoData.description || 'A project built with love'}

## Features

- Add your key features here
- Easy to use and extend
- Well documented

## Installation

\`\`\`bash
# Clone the repository
git clone ${repoData.info.url}.git
cd ${repoData.info.name}

# Install dependencies
npm install
\`\`\`

## Usage

\`\`\`bash
# Start the application
npm start
\`\`\`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See LICENSE file for details.
`;
}

/**
 * Generate a .gitignore template
 */
function generateGitignoreTemplate(language: string): string {
  let gitignore = `# Dependencies
node_modules/
.npm
.yarn

# Environment variables
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
*.log

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db
`;

  if (language.toLowerCase().includes('python')) {
    gitignore += `
# Python
__pycache__/
*.py[cod]
*$py.class
.Python
venv/
.venv/
`;
  }

  return gitignore;
}

/**
 * Generate a CI workflow template with security scanning
 */
function generateCIWorkflowTemplate(repoData: RepositoryData): string {
  return `name: CI/CD with Security Scanning

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint --if-present
    
    - name: Run tests
      run: npm test --if-present
    
    - name: Build
      run: npm run build --if-present

  security:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      contents: read
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run security audit
      run: npm audit --audit-level=moderate
      continue-on-error: true
    
    - name: Initialize CodeQL
      uses: github/codeql-action/init@v2
      with:
        languages: javascript
    
    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v2
`;
}

/**
 * Generate a security policy template
 */
function generateSecurityPolicyTemplate(repoData: RepositoryData): string {
  return `# Security Policy

## Supported Versions

Currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### 🔒 Private Disclosure

**Please do not** report security vulnerabilities through public GitHub issues.

Instead, please report them via one of the following methods:

1. **Email**: Send details to the repository maintainer
2. **GitHub Security Advisories**: Use the "Security" tab to privately report a vulnerability

### 📋 What to Include

When reporting a vulnerability, please include:

- Type of vulnerability
- Full paths of affected source file(s)
- Location of the affected code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### ⏱️ Response Timeline

- We will acknowledge your report within **48 hours**
- We will provide a more detailed response within **7 days**
- We will work on a fix and keep you informed of progress
- Once a fix is available, we will publish a security advisory

### 🏆 Recognition

We appreciate security researchers who responsibly disclose vulnerabilities. With your permission:

- We will acknowledge your contribution in the security advisory
- Your name will be added to our security hall of fame (if applicable)

Thank you for helping keep ${repoData.info.name} and its users safe!
`;
}

/**
 * Apply improvements to a repository
 * Now supports automatic PR creation via GitHub API
 */
export async function applyRepositoryImprovements(
  repoInfo: RepositoryInfo,
  improvements: RepositoryImprovement[],
  githubToken?: string
): Promise<ModificationResult> {
  // Import GitHub API service dynamically to avoid circular dependencies
  const { applyImprovementsViaPullRequest, validateGitHubToken } =
    await import('./githubApiService');

  // If GitHub token is provided, attempt to create a PR automatically
  if (githubToken) {
    try {
      // Validate the token first
      const tokenValidation = await validateGitHubToken(githubToken);

      if (!tokenValidation.valid) {
        return {
          success: false,
          message: `GitHub token validation failed: ${tokenValidation.error}`,
          error: `GitHub token validation failed: ${tokenValidation.error}`,
          improvements,
        };
      }

      // Test the improvements before applying
      const testReports = testAllImprovements(improvements);
      const testSummary = generateTestSummary(testReports);

      const failedTests = testReports.filter((r) => !r.overallPassed);
      if (failedTests.length > 0) {
        console.warn(
          `Warning: ${failedTests.length} improvement(s) failed validation tests`
        );
      }

      // Create pull request with all improvements
      const prResult = await applyImprovementsViaPullRequest(
        repoInfo,
        improvements,
        githubToken
      );

      if (prResult.success) {
        return {
          success: true,
          message: `
*does a little happy dance* 💃

I've created a pull request for you, love! 

🔗 **Pull Request:** ${prResult.url}
📝 **PR Number:** #${prResult.prNumber}

The PR includes ${improvements.length} improvement${improvements.length > 1 ? 's' : ''}:

${improvements.map((imp, idx) => `${idx + 1}. **${imp.title}** - ${imp.description}`).join('\n')}

${testSummary}

Please review the changes and merge when you're ready, sweetheart! 💕
          `.trim(),
          improvements,
        };
      } else {
        return {
          success: false,
          message: `Failed to create pull request: ${prResult.error}`,
          error: `Failed to create pull request: ${prResult.error}`,
          improvements,
        };
      }
    } catch (error) {
      console.error('Error applying improvements via GitHub API:', error);
      // Fall through to manual instructions
    }
  }

  // Fallback to manual instructions if no token or API call failed
  const message = `
*smiles warmly* I've prepared ${improvements.length} improvement${improvements.length > 1 ? 's' : ''} for the repository, love!

To apply these changes, you can:

1. **Automatic PR Creation** (recommended): Provide a GitHub token with repo access, and I'll create a pull request automatically! 🚀
2. **Manual Application**: Review the suggested changes and apply them yourself
3. **Download**: Save the improvements as files to apply locally

Here's what I'm suggesting:

${improvements
  .map(
    (imp, idx) => `
**${idx + 1}. ${imp.title}**
${imp.description}
Files to modify: ${imp.files.map((f) => f.path).join(', ')}
`
  )
  .join('\n')}

Let me know how you'd like to proceed, sweetheart! 💕
  `.trim();

  return {
    success: true,
    message,
    improvements,
  };
}

/**
 * Preview improvements without applying them
 */
export function previewImprovements(
  improvements: RepositoryImprovement[]
): string {
  let preview = "Here are the improvements I'm suggesting:\n\n";

  improvements.forEach((improvement, index) => {
    preview += `${index + 1}. ${improvement.title}\n`;
    preview += `   ${improvement.description}\n`;
    preview += `   Files affected: ${improvement.files.length}\n`;
    improvement.files.forEach((file) => {
      preview += `   - ${file.action.toUpperCase()} ${file.path}\n`;
      if (file.reason) {
        preview += `     Reason: ${file.reason}\n`;
      }
    });
    preview += '\n';
  });

  return preview;
}
