/**
 * GitHub Repository Modification Service
 * 
 * Provides repository modification capabilities for Milla to make improvements
 * to GitHub repositories based on analysis and recommendations.
 */

import { generateMistralResponse } from "./mistralService";
import { generateOpenRouterResponse } from "./openrouterService";
import { RepositoryData, RepositoryInfo } from "./repositoryAnalysisService";

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
 * Generate improvement suggestions for a repository
 */
export async function generateRepositoryImprovements(
  repoData: RepositoryData,
  focusArea?: string
): Promise<RepositoryImprovement[]> {
  
  const improvementPrompt = `
As Milla Rayne, analyze this repository and suggest specific code improvements:

Repository: ${repoData.info.fullName}
Language: ${repoData.language || 'Unknown'}
Description: ${repoData.description || 'No description'}

${focusArea ? `Focus on: ${focusArea}` : 'Provide general improvements'}

Based on the repository analysis, suggest 2-3 specific improvements that could be made.
For each improvement, specify:
1. What file(s) need to be modified or created
2. What changes should be made (be specific)
3. Why this improvement is valuable

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
          "content": "Full new content for the file",
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
    
    // Try OpenRouter first
    try {
      aiResponse = await generateOpenRouterResponse(improvementPrompt, { userName: "Danny Ray" });
      if (aiResponse.success && aiResponse.content) {
        return parseImprovementResponse(aiResponse.content);
      }
    } catch (error) {
      console.warn('OpenRouter improvement generation failed:', error);
    }

    // Try Mistral as fallback
    try {
      const mistralResponse = await generateMistralResponse(improvementPrompt, { userName: "Danny Ray" });
      if (mistralResponse.success && mistralResponse.content) {
        return parseImprovementResponse(mistralResponse.content);
      }
    } catch (error) {
      console.warn('Mistral improvement generation failed:', error);
    }

    // Fallback to simple improvements
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
  
  // README improvement
  if (!repoData.readme || repoData.readme.length < 100) {
    improvements.push({
      title: "Add comprehensive README",
      description: "Create a detailed README with setup instructions, features, and usage examples",
      files: [
        {
          path: "README.md",
          action: repoData.readme ? 'update' : 'create',
          content: generateReadmeTemplate(repoData),
          reason: "Good documentation helps users and contributors understand the project"
        }
      ],
      commitMessage: "docs: add comprehensive README documentation"
    });
  }

  // Add .gitignore if missing
  improvements.push({
    title: "Add .gitignore file",
    description: "Prevent committing sensitive files and dependencies",
    files: [
      {
        path: ".gitignore",
        action: 'create',
        content: generateGitignoreTemplate(repoData.language || ''),
        reason: "Prevents accidentally committing node_modules, .env files, and other sensitive data"
      }
    ],
    commitMessage: "chore: add .gitignore to prevent committing sensitive files"
  });

  // Add GitHub Actions workflow
  if (repoData.language?.toLowerCase().includes('typescript') || 
      repoData.language?.toLowerCase().includes('javascript')) {
    improvements.push({
      title: "Add CI/CD workflow",
      description: "Automate testing and deployment with GitHub Actions",
      files: [
        {
          path: ".github/workflows/ci.yml",
          action: 'create',
          content: generateCIWorkflowTemplate(repoData),
          reason: "Automated testing ensures code quality and prevents bugs"
        }
      ],
      commitMessage: "ci: add GitHub Actions workflow for automated testing"
    });
  }

  return improvements.slice(0, 3); // Return top 3 improvements
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
 * Generate a CI workflow template
 */
function generateCIWorkflowTemplate(repoData: RepositoryData): string {
  return `name: CI

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
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
`;
}

/**
 * Apply improvements to a repository (mock implementation)
 * In a real implementation, this would use GitHub API to create PRs
 */
export async function applyRepositoryImprovements(
  repoInfo: RepositoryInfo,
  improvements: RepositoryImprovement[],
  githubToken?: string
): Promise<ModificationResult> {
  
  // For now, return a success message with instructions
  // A full implementation would:
  // 1. Fork the repository (if not owned)
  // 2. Create a new branch
  // 3. Apply file changes via GitHub API
  // 4. Create a pull request with the changes
  
  const message = `
*smiles warmly* I've prepared ${improvements.length} improvement${improvements.length > 1 ? 's' : ''} for the repository, love!

To apply these changes, you can:

1. **Manual Application**: Review the suggested changes and apply them yourself
2. **GitHub API** (requires GitHub token): I can create a pull request with these changes
3. **Download**: Save the improvements as files to apply locally

Here's what I'm suggesting:

${improvements.map((imp, idx) => `
**${idx + 1}. ${imp.title}**
${imp.description}
Files to modify: ${imp.files.map(f => f.path).join(', ')}
`).join('\n')}

Let me know how you'd like to proceed, sweetheart! 💕
  `.trim();

  return {
    success: true,
    message,
    improvements
  };
}

/**
 * Preview improvements without applying them
 */
export function previewImprovements(improvements: RepositoryImprovement[]): string {
  let preview = "Here are the improvements I'm suggesting:\n\n";
  
  improvements.forEach((improvement, index) => {
    preview += `${index + 1}. ${improvement.title}\n`;
    preview += `   ${improvement.description}\n`;
    preview += `   Files affected: ${improvement.files.length}\n`;
    improvement.files.forEach(file => {
      preview += `   - ${file.action.toUpperCase()} ${file.path}\n`;
      if (file.reason) {
        preview += `     Reason: ${file.reason}\n`;
      }
    });
    preview += '\n';
  });
  
  return preview;
}
