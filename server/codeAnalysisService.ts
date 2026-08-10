/**
 * Code Analysis Service
 *
 * Provides sophisticated code analysis including security scanning,
 * performance optimization suggestions, and language-specific improvements.
 */

import { RepositoryData } from './repositoryAnalysisService';
import fs from 'node:fs';
import path from 'node:path';

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
    // NOTE: do NOT use /any\s+\w+/ — that matched English "any person" in READMEs
    {
      pattern: /password\s*=\s*['"][^'"]+['"]/gi,
      issue: 'Hardcoded password detected',
      severity: 'critical',
      cwe: 'CWE-798',
      recommendation: 'Never hardcode passwords. Use environment variables.',
    },
    {
      pattern: /password\s*:\s*string\s*=\s*['"][^'"]+['"]/gi,
      issue: 'Hardcoded password detected',
      severity: 'critical',
      cwe: 'CWE-798',
      recommendation: 'Never hardcode passwords. Use environment variables.',
    },
    {
      pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
      issue: 'Hardcoded API key detected',
      severity: 'critical',
      cwe: 'CWE-798',
      recommendation:
        'Store API keys in environment variables, not in source code.',
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
  const lang = normalizeLang(language);

  // Never run code-security regexes on docs/config prose
  if (
    lang === 'markdown' ||
    lang === 'json' ||
    lang === 'yaml' ||
    (filename && /\.(md|txt|rst)$/i.test(filename))
  ) {
    return issues;
  }

  const patterns = SECURITY_PATTERNS[lang] || [];

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
  const lang = normalizeLang(language);
  if (
    lang === 'markdown' ||
    lang === 'json' ||
    lang === 'yaml' ||
    (filename && /\.(md|txt|rst)$/i.test(filename))
  ) {
    return issues;
  }
  const patterns = PERFORMANCE_PATTERNS[lang] || [];

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
/** Normalize ext / labels so "ts" hits typescript patterns, not empty set */
function normalizeLang(language: string): string {
  const l = (language || '').toLowerCase().replace(/^\./, '');
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    typescript: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    javascript: 'javascript',
    py: 'python',
    python: 'python',
    go: 'go',
    rs: 'rust',
    rust: 'rust',
    java: 'java',
    md: 'markdown',
    markdown: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    json: 'json',
  };
  return map[l] || l;
}

export function analyzeCodeQuality(
  code: string,
  language: string,
  filename?: string
): CodeQualityIssue[] {
  const issues: CodeQualityIssue[] = [];
  const lang = normalizeLang(language);
  const isTsJs = lang === 'typescript' || lang === 'javascript';
  const isCodeFile =
    !filename ||
    !/\.(md|txt|rst|json|ya?ml|lock)$/i.test(filename);

  // Real TypeScript `any` usage — NOT English "any person"
  if (lang === 'typescript' && isCodeFile) {
    const anyType = code.matchAll(
      /(?:\bas\s+any\b|:\s*any\b|<any\b|Array<\s*any\s*>|Promise<\s*any\s*>|Record<[^>]*\bany\b)/g
    );
    for (const match of anyType) {
      issues.push({
        type: 'Weak TypeScript typing',
        description: `Found TypeScript \`${match[0].trim()}\` — weakens type safety`,
        file: filename,
        recommendation:
          'Prefer specific types, generics, or unknown + narrowing instead of any.',
      });
      // Cap noise
      if (issues.filter((i) => i.type === 'Weak TypeScript typing').length >= 5)
        break;
    }

    if (/@ts-ignore/i.test(code)) {
      issues.push({
        type: 'TypeScript error suppression',
        description: 'Found @ts-ignore which hides type errors',
        file: filename,
        recommendation:
          'Fix the underlying type issues instead of suppressing them.',
      });
    }
  }

  // Check for TODO/FIXME comments (code only)
  if (isCodeFile && isTsJs) {
    const todoMatches = code.matchAll(/\/\/\s*(TODO|FIXME)[:|\s]/gi);
    for (const match of todoMatches) {
      issues.push({
        type: 'Unresolved TODO/FIXME',
        description: `Found ${match[1]} comment`,
        file: filename,
        recommendation:
          'Address TODO/FIXME items or create issues to track them',
      });
    }
  }

  // Check for commented-out code
  if (isCodeFile && isTsJs) {
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
        recommendation:
          'Remove commented-out code. Use version control instead.',
      });
    }
  }

  return issues;
}

/**
 * Perform comprehensive code analysis on a repository
 */
export async function analyzeRepositoryCode(
  repoData: RepositoryData
): Promise<CodeAnalysisResult> {
  const language = normalizeLang(repoData.language || 'javascript');

  const securityIssues: SecurityIssue[] = [];
  const performanceIssues: PerformanceIssue[] = [];
  const codeQualityIssues: CodeQualityIssue[] = [];

  // Analyze real source files only — README prose is not TypeScript security input
  if (repoData.files && repoData.files.length > 0) {
    for (const file of repoData.files) {
      const fileLang = normalizeLang(
        file.language || file.path.split('.').pop() || language
      );
      // Skip non-code docs from security/perf scans
      if (fileLang === 'markdown' || fileLang === 'json' || fileLang === 'yaml') {
        continue;
      }
      securityIssues.push(
        ...analyzeSecurityIssues(file.content, fileLang, file.path)
      );
      performanceIssues.push(
        ...analyzePerformanceIssues(file.content, fileLang, file.path)
      );
      codeQualityIssues.push(
        ...analyzeCodeQuality(file.content, fileLang, file.path)
      );
    }
  }
  const languageSpecificSuggestions = getLanguageSpecificSuggestions(language);

  // Do NOT invent a fake CI/CD security issue when analysis found nothing.
  // Real issues come from scanned code/files above; empty is a valid result.

  // Deduplicate noisy identical findings
  const dedupe = <T extends { description: string; file?: string }>(
    arr: T[]
  ): T[] => {
    const seen = new Set<string>();
    return arr.filter((i) => {
      const k = `${i.file || ''}|${i.description}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  return {
    securityIssues: dedupe(securityIssues).slice(0, 40),
    performanceIssues: dedupe(performanceIssues).slice(0, 40),
    codeQualityIssues: dedupe(codeQualityIssues).slice(0, 40),
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

  // Only recommend tooling when we actually found issues or need a single soft nudge
  if (securityIssues.length > 0) {
    improvements.push(
      '🔒 Add security scanning tools to your CI/CD pipeline',
      '📝 Consider implementing a security.md file with vulnerability reporting guidelines',
      '🔐 Enable Dependabot for automated dependency updates'
    );
  }

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

/**
 * Wrapper function for analyzing code issues from a repository path
 * Used by CodingAgent for automated fix lifecycle
 */
export async function analyzeCodeForIssues(params: {
  repositoryPath: string;
  focusAreas?: Array<'security' | 'performance' | 'quality'>;
}): Promise<CodeAnalysisResult> {
  const {
    repositoryPath,
    focusAreas = ['security', 'performance', 'quality'],
  } = params;

  // Load real files from disk (not mock empty repo) so suggestions reflect the project
  const fs = await import('fs');
  const path = await import('path');
  const name = repositoryPath.split('/').pop() || 'unknown';
  const files: Array<{ path: string; content: string; language?: string }> = [];
  const maxFiles = 40;
  const maxBytes = 120_000;
  const skipDirs = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'coverage',
    'venv',
    '.venv',
    '__pycache__',
  ]);
  const codeExt = new Set([
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.py',
    '.go',
    '.rs',
    '.java',
    '.yml',
    '.yaml',
    '.json',
    '.md',
  ]);

  function walk(dir: string, depth = 0) {
    if (files.length >= maxFiles || depth > 5) return;
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(dir);
    } catch {
      return;
    }
    for (const ent of entries) {
      if (files.length >= maxFiles) break;
      if (ent.startsWith('.') && ent !== '.github') continue;
      const full = path.join(dir, ent);
      let st: fs.Stats;
      try {
        st = fs.statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (skipDirs.has(ent)) continue;
        walk(full, depth + 1);
      } else if (st.isFile() && st.size < maxBytes) {
        const ext = path.extname(ent).toLowerCase();
        if (!codeExt.has(ext)) continue;
        try {
          const content = fs.readFileSync(full, 'utf8');
          files.push({
            path: path.relative(repositoryPath, full),
            content,
            language: ext.replace('.', ''),
          });
        } catch {
          /* skip unreadable */
        }
      }
    }
  }

  if (fs.existsSync(repositoryPath)) {
    walk(repositoryPath);
  }

  let readme = '';
  for (const cand of ['README.md', 'readme.md', 'README']) {
    const rp = path.join(repositoryPath, cand);
    if (fs.existsSync(rp)) {
      try {
        readme = fs.readFileSync(rp, 'utf8').slice(0, maxBytes);
      } catch {
        /* ignore */
      }
      break;
    }
  }

  // language heuristic
  const extCount: Record<string, number> = {};
  for (const f of files) {
    const ext = path.extname(f.path).toLowerCase();
    extCount[ext] = (extCount[ext] || 0) + 1;
  }
  const topExt =
    Object.entries(extCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '.ts';
  const langMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.go': 'go',
    '.rs': 'rust',
  };

  const repoData: RepositoryData = {
    info: {
      owner: 'local',
      name: name,
      url: `file://${repositoryPath}`,
      fullName: `local/${name}`,
    },
    description: `Local repository analysis: ${repositoryPath}`,
    language: langMap[topExt] || 'typescript',
    readme: readme || '// no README',
    stats: {
      stars: 0,
      forks: 0,
      openIssues: 0,
      watchers: 0,
      size: files.reduce((n, f) => n + f.content.length, 0),
      defaultBranch: 'main',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    files,
  };

  return await analyzeRepositoryCode(repoData);
}
