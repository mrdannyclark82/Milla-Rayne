/**
 * GitHub Repository Modification Service
 *
 * Provides repository modification capabilities for Milla to make improvements
 * to GitHub repositories based on analysis and recommendations.
 */

import { generateGrokResponse } from './openrouterService';
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

    // Use Grok 1 Fast for repository improvement generation
    try {
      aiResponse = await generateGrokResponse(improvementPrompt, {
        userName: 'Danny Ray',
      });
      if (aiResponse.success && aiResponse.content) {
        return parseImprovementResponse(aiResponse.content);
      }
    } catch (error) {
      console.warn('Grok improvement generation failed:', error);
    }

    // Fallback to simple improvements if Grok fails
    return generateFallbackImprovements(repoData, focusArea);
  } catch (error) {
    console.error('Error generating improvements:', error);
    return generateFallbackImprovements(repoData, focusArea);
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
 * Generate fallback improvements when AI is unavailable
 */
function generateFallbackImprovements(
  repoData: RepositoryData,
  focusArea?: string
): RepositoryImprovement[] {
  const improvements: RepositoryImprovement[] = [];

  // Perform code analysis for security and performance insights
  analyzeRepositoryCode(repoData)
    .then((analysis) => {
      console.log('Code analysis completed:', {
        security: analysis.securityIssues.length,
        performance: analysis.performanceIssues.length,
        quality: analysis.codeQualityIssues.length,
      });
    })
    .catch((err) => console.error('Code analysis failed:', err));

  // README improvement
  if (!repoData.readme || repoData.readme.length < 100) {
    improvements.push({
      title: 'Add comprehensive README',
      description:
        'Create a detailed README with setup instructions, features, and usage examples',
      files: [
        {
          path: 'README.md',
          action: repoData.readme ? 'update' : 'create',
          content: generateReadmeTemplate(repoData),
          reason:
            'Good documentation helps users and contributors understand the project',
        },
      ],
      commitMessage: 'docs: add comprehensive README documentation',
    });
  }

  // Add .gitignore if missing
  improvements.push({
    title: 'Add .gitignore file',
    description: 'Prevent committing sensitive files and dependencies',
    files: [
      {
        path: '.gitignore',
        action: 'create',
        content: generateGitignoreTemplate(repoData.language || ''),
        reason:
          'Prevents accidentally committing node_modules, .env files, and other sensitive data',
      },
    ],
    commitMessage:
      'chore: add .gitignore to prevent committing sensitive files',
  });

  // Add GitHub Actions workflow
  if (
    repoData.language?.toLowerCase().includes('typescript') ||
    repoData.language?.toLowerCase().includes('javascript')
  ) {
    improvements.push({
      title: 'Add CI/CD workflow with security scanning',
      description:
        'Automate testing, building, and security scanning with GitHub Actions',
      files: [
        {
          path: '.github/workflows/ci.yml',
          action: 'create',
          content: generateCIWorkflowTemplate(repoData),
          reason:
            'Automated testing and security scanning ensures code quality and prevents vulnerabilities',
        },
      ],
      commitMessage:
        'ci: add GitHub Actions workflow for automated testing and security scanning',
    });
  }

  // Add SECURITY.md file
  improvements.push({
    title: 'Add security policy',
    description: 'Document security vulnerability reporting process',
    files: [
      {
        path: 'SECURITY.md',
        action: 'create',
        content: generateSecurityPolicyTemplate(repoData),
        reason:
          'Provides a clear process for security researchers to report vulnerabilities',
      },
    ],
    commitMessage: 'docs: add security policy for vulnerability reporting',
  });

  return improvements.slice(0, 5); // Return top 5 improvements
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
  const { applyImprovementsViaPullRequest, validateGitHubToken } = await import(
    './githubApiService'
  );

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
