# Advanced Repository Analysis Features

This document describes the advanced repository analysis features that have been implemented, including GitHub API integration, security scanning, performance optimization, language-specific improvements, and automated testing.

## Overview

The repository analysis system has been enhanced with four major capabilities:

1. **GitHub API Integration** - Automatic pull request creation
2. **Code Analysis Service** - Security and performance scanning
3. **Language-Specific Patterns** - Best practices for multiple languages
4. **Automated Testing** - Validation before changes are applied

## 1. GitHub API Integration

### Purpose

Automatically create pull requests with suggested improvements, eliminating manual file editing and Git operations.

### Features

- ✅ Branch creation from base branch
- ✅ File creation and updates via GitHub Contents API
- ✅ Pull request creation with detailed descriptions
- ✅ Token validation and permission checking
- ✅ Error handling and graceful fallbacks

### Service: `githubApiService.ts`

#### Key Functions

**`createGitHubBranch()`**

```typescript
createGitHubBranch(
  repoInfo: RepositoryInfo,
  branchName: string,
  fromBranch: string = 'main',
  githubToken: string
): Promise<GitHubBranchResult>
```

Creates a new branch from the specified base branch.

**`updateGitHubFile()`**

```typescript
updateGitHubFile(
  repoInfo: RepositoryInfo,
  filePath: string,
  content: string,
  commitMessage: string,
  branchName: string,
  githubToken: string
): Promise<{ success: boolean; error?: string }>
```

Creates or updates a file in the repository.

**`createGitHubPullRequest()`**

```typescript
createGitHubPullRequest(
  repoInfo: RepositoryInfo,
  options: GitHubPullRequestOptions,
  githubToken: string
): Promise<GitHubPullRequestResult>
```

Creates a pull request with the specified changes.

**`applyImprovementsViaPullRequest()`**

```typescript
applyImprovementsViaPullRequest(
  repoInfo: RepositoryInfo,
  improvements: RepositoryImprovement[],
  githubToken: string,
  baseBranch: string = 'main'
): Promise<GitHubPullRequestResult>
```

High-level function that creates a branch, applies all improvements, and creates a PR.

### Usage Example

```typescript
import { applyImprovementsViaPullRequest } from './githubApiService';

const result = await applyImprovementsViaPullRequest(
  {
    owner: 'username',
    name: 'repo',
    url: 'https://github.com/username/repo',
    fullName: 'username/repo',
  },
  improvements,
  'ghp_your_github_token'
);

if (result.success) {
  console.log(`PR created: ${result.url}`);
  console.log(`PR number: #${result.prNumber}`);
}
```

### API Endpoint

**POST** `/api/repository/apply-improvements`

Request body:

```json
{
  "repositoryUrl": "https://github.com/owner/repo",
  "improvements": [...],
  "githubToken": "ghp_your_token"
}
```

Response (success):

```json
{
  "success": true,
  "message": "Pull request created successfully!",
  "improvements": [...]
}
```

### GitHub Token Requirements

The token needs the following scopes:

- `repo` - Full control of private repositories
- `workflow` - Update GitHub Action workflows (if modifying workflow files)

Create a token at: https://github.com/settings/tokens

## 2. Code Analysis Service

### Purpose

Perform deep analysis of repository code to identify security vulnerabilities, performance issues, code quality problems, and provide language-specific suggestions.

### Features

- ✅ Security vulnerability detection with CWE references
- ✅ Performance issue identification
- ✅ Code quality analysis
- ✅ Language-specific best practices
- ✅ Pattern-based detection for multiple languages

### Service: `codeAnalysisService.ts`

#### Security Patterns

Detects issues like:

- **CWE-95**: Use of `eval()` function
- **CWE-79**: XSS via `innerHTML` assignment
- **CWE-798**: Hardcoded passwords and API keys
- **CWE-338**: Insecure random number generation
- **CWE-89**: SQL injection vulnerabilities
- **CWE-502**: Insecure deserialization (pickle)

Example security issue:

```typescript
{
  severity: 'critical',
  type: 'Hardcoded password detected',
  description: 'Found "password = \'secret123\'" which may pose a security risk',
  file: 'config.ts',
  recommendation: 'Never hardcode passwords. Use environment variables.',
  cwe: 'CWE-798'
}
```

#### Performance Patterns

Detects issues like:

- DOM queries inside loops
- High-frequency intervals (< 100ms)
- Inefficient string concatenation
- Array operations in tight loops
- JSON.parse(JSON.stringify()) for deep cloning

Example performance issue:

```typescript
{
  severity: 'high',
  type: 'DOM queries inside loops',
  description: 'Found "for(...) { document.querySelector..." which may impact performance',
  file: 'app.js',
  impact: 'Repeated DOM queries slow down execution significantly',
  recommendation: 'Cache DOM queries outside loops or use querySelectorAll once.'
}
```

#### Language-Specific Suggestions

**JavaScript/TypeScript:**

- Use const/let instead of var
- Async/await over promise chains
- Proper error handling with try-catch
- JSDoc comments
- Strict mode

**Python:**

- Follow PEP 8 style guidelines
- Use type hints
- Context managers (with statements)
- List comprehensions
- Docstrings

**Java:**

- Try-with-resources
- Composition over inheritance
- Optional for null handling
- Specific exception types
- Streams API

**Go:**

- Explicit error checking
- Defer for cleanup
- Context handling
- Interfaces for testability
- MixedCaps naming

#### Key Functions

**`analyzeSecurityIssues()`**

```typescript
analyzeSecurityIssues(
  code: string,
  language: string,
  filename?: string
): SecurityIssue[]
```

**`analyzePerformanceIssues()`**

```typescript
analyzePerformanceIssues(
  code: string,
  language: string,
  filename?: string
): PerformanceIssue[]
```

**`analyzeCodeQuality()`**

```typescript
analyzeCodeQuality(
  code: string,
  language: string,
  filename?: string
): CodeQualityIssue[]
```

**`analyzeRepositoryCode()`**

```typescript
analyzeRepositoryCode(
  repoData: RepositoryData
): Promise<CodeAnalysisResult>
```

### API Endpoint

**POST** `/api/repository/analyze-code`

Request body:

```json
{
  "repositoryUrl": "https://github.com/owner/repo"
}
```

Response:

```json
{
  "repository": {
    "owner": "owner",
    "name": "repo",
    "url": "...",
    "fullName": "owner/repo"
  },
  "analysis": {
    "securityIssues": [
      {
        "severity": "high",
        "type": "XSS vulnerability",
        "description": "...",
        "recommendation": "...",
        "cwe": "CWE-79"
      }
    ],
    "performanceIssues": [...],
    "codeQualityIssues": [...],
    "languageSpecificSuggestions": [...]
  },
  "success": true
}
```

## 3. Language-Specific Patterns

### Supported Languages

- JavaScript
- TypeScript
- Python
- Java
- Go

### Pattern Categories

1. **Security Patterns** - Language-specific security vulnerabilities
2. **Performance Patterns** - Language-specific performance anti-patterns
3. **Best Practices** - Idiomatic code patterns and conventions

### Adding New Languages

To add support for a new language:

1. Add security patterns to `SECURITY_PATTERNS` in `codeAnalysisService.ts`:

```typescript
rust: [
  {
    pattern: /unsafe\s+\{/gi,
    issue: 'Unsafe code block',
    severity: 'high',
    cwe: 'CWE-XXX',
    recommendation: 'Minimize unsafe code usage',
  },
];
```

2. Add performance patterns to `PERFORMANCE_PATTERNS`:

```typescript
rust: [
  {
    pattern: /clone\(\)/gi,
    issue: 'Excessive cloning',
    severity: 'medium',
    impact: 'Unnecessary memory allocations',
    recommendation: 'Use references where possible',
  },
];
```

3. Add best practices to `LANGUAGE_BEST_PRACTICES`:

```typescript
rust: [
  'Use Result type for error handling',
  'Prefer iterators over manual loops',
  'Follow Rust naming conventions',
  'Use cargo clippy for linting',
  'Write comprehensive tests with cargo test',
];
```

## 4. Automated Testing Service

### Purpose

Validate suggested changes before applying them to catch syntax errors, assess risk, and provide confidence in modifications.

### Features

- ✅ Syntax validation (JSON, YAML, Markdown, JS/TS)
- ✅ File size checks
- ✅ Risk assessment (low/medium/high)
- ✅ Impact estimation (lines changed, files modified)
- ✅ Comprehensive test reports
- ✅ Warning detection

### Service: `autoTestingService.ts`

#### Test Types

**Syntax Validation:**

- JSON: Valid JSON structure
- YAML: Indentation, tab usage, structure
- Markdown: Link validation, heading hierarchy
- JavaScript/TypeScript: Bracket matching, string closure

**Impact Analysis:**

- Files changed count
- Lines added estimation
- Lines removed estimation
- Risk level (low/medium/high)

**Risk Factors:**

- Number of files modified
- Total lines changed
- Critical file types (config, security, auth)
- Delete operations

#### Key Functions

**`testImprovement()`**

```typescript
testImprovement(
  improvement: RepositoryImprovement
): ImprovementTestReport
```

**`testAllImprovements()`**

```typescript
testAllImprovements(
  improvements: RepositoryImprovement[]
): ImprovementTestReport[]
```

**`validateImprovements()`**

```typescript
validateImprovements(
  improvements: RepositoryImprovement[],
  repoData: RepositoryData
): { valid: boolean; errors: string[]; warnings: string[] }
```

**`generateTestSummary()`**

```typescript
generateTestSummary(
  reports: ImprovementTestReport[]
): string
```

### Test Report Structure

```typescript
interface ImprovementTestReport {
  improvementTitle: string;
  overallPassed: boolean;
  tests: TestResult[];
  warnings: string[];
  estimatedImpact: {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
    risk: 'low' | 'medium' | 'high';
  };
}
```

### API Endpoint

**POST** `/api/repository/test-improvements`

Request body:

```json
{
  "repositoryUrl": "https://github.com/owner/repo",
  "improvements": [...]
}
```

Response:

```json
{
  "repository": {...},
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": ["This is a medium-risk change..."]
  },
  "testReports": [
    {
      "improvementTitle": "Add .gitignore file",
      "overallPassed": true,
      "tests": [
        {
          "passed": true,
          "testName": "Content Check",
          "description": "File has content"
        }
      ],
      "warnings": [],
      "estimatedImpact": {
        "filesChanged": 1,
        "linesAdded": 50,
        "linesRemoved": 0,
        "risk": "low"
      }
    }
  ],
  "testSummary": "## Test Summary\n\n**Overall Status:** ✅ All tests passed\n...",
  "success": true
}
```

## Integration with Existing System

### Enhanced `repositoryModificationService.ts`

The existing repository modification service has been enhanced to integrate all new services:

1. **Code Analysis Integration**: Runs analysis before generating improvements
2. **Testing Integration**: Tests improvements before applying
3. **GitHub API Integration**: Creates PRs when token is provided
4. **Security Policy**: Generates SECURITY.md files
5. **Enhanced CI/CD**: Includes CodeQL security scanning

### Workflow

```
1. User requests improvements
2. Fetch repository data
3. Run code analysis (security, performance, quality)
4. Generate improvements based on analysis
5. Test improvements automatically
6. If GitHub token provided:
   a. Validate token
   b. Create branch
   c. Apply file changes
   d. Create pull request
7. Return results to user
```

## Best Practices

### For Security Scanning

1. Run analysis regularly on main/develop branches
2. Address critical and high severity issues immediately
3. Review medium/low severity issues during code reviews
4. Keep security patterns updated with new CVE/CWE information

### For Performance Optimization

1. Focus on high-severity performance issues first
2. Measure before and after changes
3. Consider trade-offs between performance and readability
4. Profile production code to validate improvements

### For Automated Testing

1. Always run tests before applying improvements
2. Review warnings even if all tests pass
3. Pay attention to risk assessment
4. Test critical changes in staging environment first

### For GitHub API Integration

1. Use fine-grained personal access tokens when possible
2. Limit token scopes to minimum required permissions
3. Rotate tokens regularly
4. Never commit tokens to version control
5. Use environment variables for token storage

## Monitoring and Logging

All services include comprehensive logging:

```typescript
// Security issues found
console.log('Security analysis:', {
  critical: issues.filter((i) => i.severity === 'critical').length,
  high: issues.filter((i) => i.severity === 'high').length,
});

// Test results
console.log('Test validation:', {
  valid: validation.valid,
  errors: validation.errors.length,
  warnings: validation.warnings.length,
});

// GitHub API operations
console.log('PR created:', {
  number: result.prNumber,
  url: result.url,
});
```

## Error Handling

All services implement graceful error handling:

1. **GitHub API**: Falls back to manual instructions if API fails
2. **Code Analysis**: Returns empty arrays if analysis fails
3. **Testing**: Returns test failure details, not crashes
4. **Validation**: Provides specific error messages for debugging

## Performance Considerations

- Code analysis runs asynchronously
- Pattern matching is optimized with regex
- Large files (>500KB) generate warnings
- Testing is lightweight (no external dependencies)
- GitHub API calls are rate-limited (5000/hour)

## Security Considerations

- GitHub tokens are validated before use
- No tokens are logged or stored permanently
- All API calls use HTTPS
- Content is base64 encoded for GitHub API
- Sensitive patterns are detected but not logged

## Future Improvements

1. **Multi-file Analysis**: Analyze multiple files in parallel
2. **Custom Rules**: User-defined security/performance patterns
3. **Metrics Dashboard**: Visualize analysis trends over time
4. **Integration Tests**: Automated testing of test service itself
5. **Code Coverage**: Track which code paths have been analyzed
6. **Machine Learning**: Learn from past improvements to suggest better ones
7. **Dependency Analysis**: Scan package.json/requirements.txt for vulnerabilities
8. **Real-time Analysis**: WebSocket-based live code analysis
9. **Multi-language Support**: Expand to more programming languages
10. **Custom Templates**: User-defined improvement templates

## Contributing

To contribute new patterns or improvements:

1. Add test cases for your pattern
2. Update documentation
3. Submit PR with examples
4. Include rationale for the pattern

## Support

For issues or questions:

- Open an issue on GitHub
- Tag with `repository-analysis` label
- Provide example repository URL if applicable
