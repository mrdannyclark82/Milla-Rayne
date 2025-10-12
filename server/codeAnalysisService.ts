/**
 * Code Analysis Service
 *
 * Provides sophisticated code analysis including security scanning,
 * performance optimization suggestions, and language-specific improvements.
 */

import { RepositoryData } from './repositoryAnalysisService';

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  file?: string;
  line?: number;
  recommendation: string;
  cwe?: string; // Common Weakness Enumeration
}

export interface PerformanceIssue {
  severity: 'high' | 'medium' | 'low';
  type: string;
  description: string;
  file?: string;
  impact: string;
  recommendation: string;
}

export interface CodeQualityIssue {
  type: string;
  description: string;
  file?: string;
  recommendation: string;
}

export interface CodeAnalysisResult {
  securityIssues: SecurityIssue[];
  performanceIssues: PerformanceIssue[];
  codeQualityIssues: CodeQualityIssue[];
  languageSpecificSuggestions: string[];
}

/**
 * Language-specific security patterns
 */
const SECURITY_PATTERNS: Record<
  string,
  {
    pattern: RegExp;
    issue: string;
    severity: SecurityIssue['severity'];
    cwe: string;
    recommendation: string;
  }[]
> = {
  javascript: [
    {
      pattern: /eval\s*\(/gi,
      issue: 'Use of eval() function',
      severity: 'critical',
      cwe: 'CWE-95',
      recommendation:
        'Avoid using eval(). Use safer alternatives like JSON.parse() for data or Function constructor with strict validation.',
    },
    {
      pattern: /innerHTML\s*=/gi,
      issue: 'Direct innerHTML assignment (XSS risk)',
      severity: 'high',
      cwe: 'CWE-79',
      recommendation:
        'Use textContent or a sanitization library like DOMPurify to prevent XSS attacks.',
    },
    {
      pattern: /document\.write\s*\(/gi,
      issue: 'Use of document.write()',
      severity: 'medium',
      cwe: 'CWE-79',
      recommendation:
        'Avoid document.write(). Use DOM manipulation methods instead.',
    },
    {
      pattern: /password\s*=\s*['"][^'"]+['"]/gi,
      issue: 'Hardcoded password detected',
      severity: 'critical',
      cwe: 'CWE-798',
      recommendation:
        'Never hardcode passwords. Use environment variables or secure credential management systems.',
    },
    {
      pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
      issue: 'Hardcoded API key detected',
      severity: 'critical',
      cwe: 'CWE-798',
      recommendation:
        'Store API keys in environment variables, not in source code.',
    },
    {
      pattern: /Math\.random\(\)/gi,
      issue: 'Use of Math.random() for security purposes',
      severity: 'medium',
      cwe: 'CWE-338',
      recommendation:
        'Use crypto.randomBytes() or crypto.getRandomValues() for cryptographic purposes.',
    },
  ],
  typescript: [
    {
      pattern: /eval\s*\(/gi,
      issue: 'Use of eval() function',
      severity: 'critical',
      cwe: 'CWE-95',
      recommendation: 'Avoid using eval(). Use safer alternatives.',
    },
    {
      pattern: /any\s+\w+/gi,
      issue: 'Use of "any" type reduces type safety',
      severity: 'low',
      cwe: 'CWE-1321',
      recommendation:
        'Use specific types instead of "any" to maintain type safety.',
    },
    {
      pattern: /@ts-ignore/gi,
      issue: 'TypeScript error suppression with @ts-ignore',
      severity: 'low',
      cwe: 'CWE-1321',
      recommendation:
        'Fix the underlying type issues instead of suppressing them.',
    },
    {
      pattern: /password\s*:\s*string\s*=\s*['"][^'"]+['"]/gi,
      issue: 'Hardcoded password detected',
      severity: 'critical',
      cwe: 'CWE-798',
      recommendation: 'Never hardcode passwords. Use environment variables.',
    },
  ],
  python: [
    {
      pattern: /eval\s*\(/gi,
      issue: 'Use of eval() function',
      severity: 'critical',
      cwe: 'CWE-95',
      recommendation:
        'Avoid eval(). Use ast.literal_eval() for safe evaluation of Python literals.',
    },
    {
      pattern: /exec\s*\(/gi,
      issue: 'Use of exec() function',
      severity: 'critical',
      cwe: 'CWE-95',
      recommendation:
        'Avoid exec(). It can execute arbitrary code and is a security risk.',
    },
    {
      pattern: /pickle\.loads?\(/gi,
      issue: 'Use of pickle with untrusted data',
      severity: 'high',
      cwe: 'CWE-502',
      recommendation:
        'Avoid pickle for untrusted data. Use JSON or other safe serialization formats.',
    },
    {
      pattern: /sql\s*=.*\+.*input/gi,
      issue: 'Potential SQL injection vulnerability',
      severity: 'critical',
      cwe: 'CWE-89',
      recommendation:
        'Use parameterized queries or ORM to prevent SQL injection.',
    },
  ],
};

/**
 * Performance optimization patterns
 */
const PERFORMANCE_PATTERNS: Record<
  string,
  {
    pattern: RegExp;
    issue: string;
    severity: PerformanceIssue['severity'];
    impact: string;
    recommendation: string;
  }[]
> = {
  javascript: [
    {
      pattern: /for\s*\([^)]*\)\s*\{[^}]*document\.querySelector/gi,
      issue: 'DOM queries inside loops',
      severity: 'high',
      impact: 'Repeated DOM queries slow down execution significantly',
      recommendation:
        'Cache DOM queries outside loops or use querySelectorAll once.',
    },
    {
      pattern: /setInterval\s*\([^,]*,\s*[0-9]{1,2}\)/gi,
      issue: 'High-frequency setInterval (< 100ms)',
      severity: 'medium',
      impact: 'Can cause performance issues and battery drain',
      recommendation:
        'Use requestAnimationFrame for animations or increase interval duration.',
    },
    {
      pattern: /console\.log/gi,
      issue: 'Console logging in production',
      severity: 'low',
      impact: 'Unnecessary overhead in production environments',
      recommendation:
        'Remove or conditionally disable console.log in production builds.',
    },
  ],
  typescript: [
    {
      pattern: /for\s*\([^)]*\)\s*\{[^}]*\.push\(/gi,
      issue: 'Array.push in loops',
      severity: 'medium',
      impact: 'Frequent array resizing can impact performance',
      recommendation:
        'Pre-allocate array size if known, or use Array.from/map for transformations.',
    },
    {
      pattern: /JSON\.parse\(JSON\.stringify/gi,
      issue: 'Deep cloning with JSON.parse(JSON.stringify())',
      severity: 'medium',
      impact:
        'Inefficient for deep cloning, loses functions and special objects',
      recommendation: 'Use structuredClone() or a proper deep cloning library.',
    },
  ],
  python: [
    {
      pattern: /\+\=.*list\s*\[/gi,
      issue: 'String concatenation in loops',
      severity: 'high',
      impact: 'Creates new string objects repeatedly, very inefficient',
      recommendation:
        'Use list and join() or io.StringIO for efficient string building.',
    },
    {
      pattern: /for.*in.*range\(len\(/gi,
      issue: 'Using range(len()) for iteration',
      severity: 'low',
      impact: 'Less Pythonic and slightly slower',
      recommendation:
        'Use enumerate() for index-value pairs or iterate directly.',
    },
  ],
};

/**
 * Language-specific improvement suggestions
 */
const LANGUAGE_BEST_PRACTICES: Record<string, string[]> = {
  javascript: [
    'Consider using const/let instead of var for better scoping',
    'Use async/await instead of promise chains for better readability',
    'Implement proper error handling with try-catch blocks',
    'Add JSDoc comments for better documentation',
    'Use strict mode ("use strict") for better error checking',
  ],
  typescript: [
    'Enable strict mode in tsconfig.json for better type safety',
    'Use interfaces for object shapes and types for unions/intersections',
    'Avoid using "any" type - use "unknown" with type guards instead',
    'Use readonly for immutable properties',
    'Implement proper error handling with custom error types',
  ],
  python: [
    'Follow PEP 8 style guidelines for consistent formatting',
    'Use type hints for better code documentation and IDE support',
    'Implement context managers (with statements) for resource management',
    'Use list comprehensions for readable and efficient transformations',
    'Add docstrings to all public functions and classes',
  ],
  java: [
    'Use try-with-resources for automatic resource management',
    'Prefer composition over inheritance',
    'Use Optional to handle null values',
    'Implement proper exception handling with specific exception types',
    'Use streams API for functional-style operations',
  ],
  go: [
    'Always check and handle errors explicitly',
    'Use defer for cleanup operations',
    'Implement proper context handling for cancellation',
    'Use interfaces for better testability',
    'Follow Go naming conventions (MixedCaps)',
  ],
};

/**
 * Analyze code for security vulnerabilities
 */
export function analyzeSecurityIssues(
  code: string,
  language: string,
  filename?: string
): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const patterns = SECURITY_PATTERNS[language.toLowerCase()] || [];

  for (const pattern of patterns) {
    const matches = code.matchAll(pattern.pattern);
    for (const match of matches) {
      issues.push({
        severity: pattern.severity,
        type: pattern.issue,
        description: `Found "${match[0]}" which may pose a security risk`,
        file: filename,
        recommendation: pattern.recommendation,
        cwe: pattern.cwe,
      });
    }
  }

  return issues;
}

/**
 * Analyze code for performance issues
 */
export function analyzePerformanceIssues(
  code: string,
  language: string,
  filename?: string
): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];
  const patterns = PERFORMANCE_PATTERNS[language.toLowerCase()] || [];

  for (const pattern of patterns) {
    const matches = code.matchAll(pattern.pattern);
    for (const match of matches) {
      issues.push({
        severity: pattern.severity,
        type: pattern.issue,
        description: `Found "${match[0].substring(0, 50)}..." which may impact performance`,
        file: filename,
        impact: pattern.impact,
        recommendation: pattern.recommendation,
      });
    }
  }

  return issues;
}

/**
 * Get language-specific improvement suggestions
 */
export function getLanguageSpecificSuggestions(language: string): string[] {
  return (
    LANGUAGE_BEST_PRACTICES[language.toLowerCase()] || [
      'Follow language best practices and style guidelines',
      'Implement comprehensive error handling',
      'Add documentation comments to public APIs',
      'Use consistent naming conventions',
      'Write unit tests for critical functionality',
    ]
  );
}

/**
 * Analyze code quality issues
 */
export function analyzeCodeQuality(
  code: string,
  language: string,
  filename?: string
): CodeQualityIssue[] {
  const issues: CodeQualityIssue[] = [];

  // Check for long functions (> 100 lines)
  const functionMatches = code.match(/function\s+\w+[^{]*\{/g);
  if (functionMatches) {
    const lines = code.split('\n');
    if (lines.length > 100) {
      issues.push({
        type: 'Long function',
        description: 'Function exceeds 100 lines',
        file: filename,
        recommendation:
          'Break down into smaller, focused functions for better maintainability',
      });
    }
  }

  // Check for TODO/FIXME comments
  const todoMatches = code.matchAll(/\/\/\s*(TODO|FIXME)[:|\s]/gi);
  for (const match of todoMatches) {
    issues.push({
      type: 'Unresolved TODO/FIXME',
      description: `Found ${match[1]} comment`,
      file: filename,
      recommendation: 'Address TODO/FIXME items or create issues to track them',
    });
  }

  // Check for commented-out code
  const commentedCodeLines = code
    .split('\n')
    .filter(
      (line) =>
        line.trim().startsWith('//') &&
        line.length > 50 &&
        !line.includes('TODO') &&
        !line.includes('FIXME') &&
        !line.includes('Note:')
    );

  if (commentedCodeLines.length > 5) {
    issues.push({
      type: 'Commented-out code',
      description: `Found ${commentedCodeLines.length} lines of commented code`,
      file: filename,
      recommendation: 'Remove commented-out code. Use version control instead.',
    });
  }

  return issues;
}

/**
 * Perform comprehensive code analysis on a repository
 */
export async function analyzeRepositoryCode(
  repoData: RepositoryData
): Promise<CodeAnalysisResult> {
  const language = repoData.language || 'javascript';

  // For now, analyze the README as a sample
  // In a full implementation, this would fetch and analyze actual source files
  const sampleCode = repoData.readme || '';

  const securityIssues = analyzeSecurityIssues(sampleCode, language);
  const performanceIssues = analyzePerformanceIssues(sampleCode, language);
  const codeQualityIssues = analyzeCodeQuality(sampleCode, language);
  const languageSpecificSuggestions = getLanguageSpecificSuggestions(language);

  // Add general security recommendations
  if (securityIssues.length === 0) {
    securityIssues.push({
      severity: 'medium',
      type: 'Security Best Practices',
      description: 'Consider adding security scanning to your CI/CD pipeline',
      recommendation:
        'Integrate tools like Snyk, Dependabot, or CodeQL for automated security scanning',
      cwe: 'CWE-1395',
    });
  }

  return {
    securityIssues,
    performanceIssues,
    codeQualityIssues,
    languageSpecificSuggestions,
  };
}

/**
 * Generate security improvement suggestions
 */
export function generateSecurityImprovements(
  securityIssues: SecurityIssue[]
): string[] {
  const improvements: string[] = [];

  const criticalIssues = securityIssues.filter(
    (i) => i.severity === 'critical'
  );
  const highIssues = securityIssues.filter((i) => i.severity === 'high');

  if (criticalIssues.length > 0) {
    improvements.push(
      `🚨 Found ${criticalIssues.length} critical security issue${criticalIssues.length > 1 ? 's' : ''} that need immediate attention`
    );
  }

  if (highIssues.length > 0) {
    improvements.push(
      `⚠️ Found ${highIssues.length} high-severity security issue${highIssues.length > 1 ? 's' : ''}`
    );
  }

  // Always recommend security tools
  improvements.push(
    '🔒 Add security scanning tools to your CI/CD pipeline',
    '📝 Consider implementing a security.md file with vulnerability reporting guidelines',
    '🔐 Enable Dependabot for automated dependency updates'
  );

  return improvements;
}

/**
 * Generate performance improvement suggestions
 */
export function generatePerformanceImprovements(
  performanceIssues: PerformanceIssue[]
): string[] {
  const improvements: string[] = [];

  const highIssues = performanceIssues.filter((i) => i.severity === 'high');

  if (highIssues.length > 0) {
    improvements.push(
      `⚡ Found ${highIssues.length} high-impact performance issue${highIssues.length > 1 ? 's' : ''}`
    );
  }

  improvements.push(
    '📊 Consider adding performance monitoring to track metrics',
    '🎯 Implement code splitting for faster initial load times',
    '💾 Add caching strategies for frequently accessed data'
  );

  return improvements;
}
