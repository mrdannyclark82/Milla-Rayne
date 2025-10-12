/**
 * Automated Testing Service
 *
 * Provides automated testing capabilities for suggested code changes,
 * including syntax validation, basic correctness checks, and impact analysis.
 */

import {
  RepositoryImprovement,
  FileModification,
} from './repositoryModificationService';
import { RepositoryData } from './repositoryAnalysisService';

export interface TestResult {
  passed: boolean;
  testName: string;
  description: string;
  error?: string;
  warnings?: string[];
}

export interface ImprovementTestReport {
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

/**
 * Test if content is valid JSON
 */
function testJSONValidity(content: string): TestResult {
  try {
    JSON.parse(content);
    return {
      passed: true,
      testName: 'JSON Syntax',
      description: 'JSON file has valid syntax',
    };
  } catch (error) {
    return {
      passed: false,
      testName: 'JSON Syntax',
      description: 'JSON file syntax validation',
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

/**
 * Test if content is valid YAML
 */
function testYAMLValidity(content: string): TestResult {
  // Basic YAML validation (checking for common syntax errors)
  const errors: string[] = [];

  // Check for tab characters (YAML uses spaces only)
  if (content.includes('\t')) {
    errors.push('YAML should use spaces, not tabs');
  }

  // Check for basic structure
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) continue;

    // Check for consistent indentation
    const leadingSpaces = line.match(/^\s*/)?.[0].length || 0;
    if (leadingSpaces % 2 !== 0) {
      errors.push(
        `Line ${i + 1}: Inconsistent indentation (should be multiples of 2)`
      );
    }
  }

  if (errors.length > 0) {
    return {
      passed: false,
      testName: 'YAML Syntax',
      description: 'YAML file syntax validation',
      error: errors.join('; '),
    };
  }

  return {
    passed: true,
    testName: 'YAML Syntax',
    description: 'YAML file has valid basic syntax',
  };
}

/**
 * Test if content is valid Markdown
 */
function testMarkdownValidity(content: string): TestResult {
  const warnings: string[] = [];

  // Check for broken links
  const linkMatches = content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
  for (const match of linkMatches) {
    const url = match[2];
    if (url.startsWith('http') && !url.includes('://')) {
      warnings.push(`Potentially malformed URL: ${url}`);
    }
  }

  // Check for heading hierarchy
  const headings = content.matchAll(/^(#{1,6})\s+(.+)$/gm);
  let prevLevel = 0;
  for (const match of headings) {
    const level = match[1].length;
    if (level - prevLevel > 1) {
      warnings.push(`Heading hierarchy skip detected: ${match[0]}`);
    }
    prevLevel = level;
  }

  return {
    passed: true,
    testName: 'Markdown Syntax',
    description: 'Markdown file validation',
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Test JavaScript/TypeScript syntax
 */
function testJavaScriptSyntax(
  content: string,
  isTypeScript: boolean = false
): TestResult {
  const errors: string[] = [];

  // Check for common syntax errors

  // Unclosed brackets
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(
      `Mismatched braces: ${openBraces} opening, ${closeBraces} closing`
    );
  }

  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push(
      `Mismatched parentheses: ${openParens} opening, ${closeParens} closing`
    );
  }

  const openBrackets = (content.match(/\[/g) || []).length;
  const closeBrackets = (content.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    errors.push(
      `Mismatched brackets: ${openBrackets} opening, ${closeBrackets} closing`
    );
  }

  // Check for unclosed strings (basic check)
  const singleQuotes = (content.match(/(?<!\\)'/g) || []).length;
  const doubleQuotes = (content.match(/(?<!\\)"/g) || []).length;
  const backticks = (content.match(/(?<!\\)`/g) || []).length;

  if (singleQuotes % 2 !== 0) {
    errors.push('Possible unclosed single quotes');
  }
  if (doubleQuotes % 2 !== 0) {
    errors.push('Possible unclosed double quotes');
  }
  if (backticks % 2 !== 0) {
    errors.push('Possible unclosed template literals');
  }

  if (errors.length > 0) {
    return {
      passed: false,
      testName: isTypeScript ? 'TypeScript Syntax' : 'JavaScript Syntax',
      description: 'Basic syntax validation',
      error: errors.join('; '),
    };
  }

  return {
    passed: true,
    testName: isTypeScript ? 'TypeScript Syntax' : 'JavaScript Syntax',
    description: 'Basic syntax validation passed',
  };
}

/**
 * Test file modification for potential issues
 */
function testFileModification(file: FileModification): TestResult[] {
  const tests: TestResult[] = [];

  // Get file extension
  const ext = file.path.split('.').pop()?.toLowerCase();

  if (!file.content) {
    if (file.action !== 'delete') {
      tests.push({
        passed: false,
        testName: 'Content Check',
        description: 'File content validation',
        error: 'File modification is missing content',
      });
    }
    return tests;
  }

  // Test based on file type
  switch (ext) {
    case 'json':
      tests.push(testJSONValidity(file.content));
      break;

    case 'yml':
    case 'yaml':
      tests.push(testYAMLValidity(file.content));
      break;

    case 'md':
      tests.push(testMarkdownValidity(file.content));
      break;

    case 'js':
    case 'jsx':
      tests.push(testJavaScriptSyntax(file.content, false));
      break;

    case 'ts':
    case 'tsx':
      tests.push(testJavaScriptSyntax(file.content, true));
      break;

    default:
      // Generic content check
      tests.push({
        passed: true,
        testName: 'Content Check',
        description: 'File has content',
      });
  }

  // Check file size
  const sizeKB = Buffer.from(file.content).length / 1024;
  if (sizeKB > 500) {
    tests.push({
      passed: true,
      testName: 'File Size',
      description: 'File size check',
      warnings: [
        `File is ${sizeKB.toFixed(2)} KB - consider if this is intentional`,
      ],
    });
  }

  return tests;
}

/**
 * Analyze the impact of an improvement
 */
function analyzeImpact(
  improvement: RepositoryImprovement
): ImprovementTestReport['estimatedImpact'] {
  let linesAdded = 0;
  let linesRemoved = 0;
  const filesChanged = improvement.files.length;

  for (const file of improvement.files) {
    if (file.content) {
      const lines = file.content.split('\n').length;
      if (file.action === 'create') {
        linesAdded += lines;
      } else if (file.action === 'update') {
        // Estimate that half are modifications
        linesAdded += Math.floor(lines / 2);
        linesRemoved += Math.floor(lines / 2);
      }
    }
  }

  // Determine risk level
  let risk: 'low' | 'medium' | 'high' = 'low';

  if (filesChanged > 10 || linesAdded > 500) {
    risk = 'high';
  } else if (filesChanged > 5 || linesAdded > 200) {
    risk = 'medium';
  }

  // Increase risk for certain file types
  const criticalFiles = improvement.files.filter(
    (f) =>
      f.path.includes('config') ||
      f.path.includes('security') ||
      f.path.includes('auth') ||
      f.path.includes('.env')
  );

  if (criticalFiles.length > 0) {
    risk = risk === 'low' ? 'medium' : 'high';
  }

  return {
    filesChanged,
    linesAdded,
    linesRemoved,
    risk,
  };
}

/**
 * Test a single improvement
 */
export function testImprovement(
  improvement: RepositoryImprovement
): ImprovementTestReport {
  const allTests: TestResult[] = [];
  const warnings: string[] = [];

  // Test each file modification
  for (const file of improvement.files) {
    const fileTests = testFileModification(file);
    allTests.push(...fileTests);

    // Collect warnings
    for (const test of fileTests) {
      if (test.warnings) {
        warnings.push(...test.warnings);
      }
    }
  }

  // Check for potential issues
  const dangerousActions = improvement.files.filter(
    (f) => f.action === 'delete'
  );
  if (dangerousActions.length > 0) {
    warnings.push(
      `This improvement will delete ${dangerousActions.length} file(s). Please review carefully.`
    );
  }

  // Analyze impact
  const estimatedImpact = analyzeImpact(improvement);

  if (estimatedImpact.risk === 'high') {
    warnings.push(
      'This is a high-risk change. Thorough review and testing recommended.'
    );
  } else if (estimatedImpact.risk === 'medium') {
    warnings.push(
      'This is a medium-risk change. Review and testing recommended.'
    );
  }

  const overallPassed = allTests.every((test) => test.passed);

  return {
    improvementTitle: improvement.title,
    overallPassed,
    tests: allTests,
    warnings,
    estimatedImpact,
  };
}

/**
 * Test all improvements in a batch
 */
export function testAllImprovements(
  improvements: RepositoryImprovement[]
): ImprovementTestReport[] {
  return improvements.map((improvement) => testImprovement(improvement));
}

/**
 * Generate a test summary report
 */
export function generateTestSummary(reports: ImprovementTestReport[]): string {
  const totalTests = reports.reduce((sum, r) => sum + r.tests.length, 0);
  const passedTests = reports.reduce(
    (sum, r) => sum + r.tests.filter((t) => t.passed).length,
    0
  );
  const totalWarnings = reports.reduce((sum, r) => sum + r.warnings.length, 0);

  const highRiskChanges = reports.filter(
    (r) => r.estimatedImpact.risk === 'high'
  ).length;
  const mediumRiskChanges = reports.filter(
    (r) => r.estimatedImpact.risk === 'medium'
  ).length;

  let summary = `## 🧪 Test Summary\n\n`;
  summary += `**Overall Status:** ${passedTests === totalTests ? '✅ All tests passed' : `⚠️ ${totalTests - passedTests} test(s) failed`}\n\n`;
  summary += `- Total improvements tested: ${reports.length}\n`;
  summary += `- Tests run: ${totalTests}\n`;
  summary += `- Tests passed: ${passedTests}\n`;
  summary += `- Warnings: ${totalWarnings}\n\n`;

  if (highRiskChanges > 0 || mediumRiskChanges > 0) {
    summary += `### ⚠️ Risk Assessment\n\n`;
    if (highRiskChanges > 0) {
      summary += `- **High Risk:** ${highRiskChanges} improvement(s)\n`;
    }
    if (mediumRiskChanges > 0) {
      summary += `- **Medium Risk:** ${mediumRiskChanges} improvement(s)\n`;
    }
    summary += `\n`;
  }

  // Detail each improvement
  summary += `### 📋 Detailed Results\n\n`;
  for (const report of reports) {
    const status = report.overallPassed ? '✅' : '❌';
    summary += `${status} **${report.improvementTitle}**\n`;
    summary += `   - Files: ${report.estimatedImpact.filesChanged}\n`;
    summary += `   - Lines added: ~${report.estimatedImpact.linesAdded}\n`;
    summary += `   - Risk: ${report.estimatedImpact.risk.toUpperCase()}\n`;

    if (report.warnings.length > 0) {
      summary += `   - Warnings: ${report.warnings.length}\n`;
    }

    const failedTests = report.tests.filter((t) => !t.passed);
    if (failedTests.length > 0) {
      summary += `   - Failed tests:\n`;
      for (const test of failedTests) {
        summary += `     - ${test.testName}: ${test.error}\n`;
      }
    }

    summary += `\n`;
  }

  return summary;
}

/**
 * Validate improvements before applying them
 */
export function validateImprovements(
  improvements: RepositoryImprovement[],
  repoData: RepositoryData
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Test all improvements
  const testReports = testAllImprovements(improvements);

  // Collect errors from failed tests
  for (const report of testReports) {
    if (!report.overallPassed) {
      const failedTests = report.tests.filter((t) => !t.passed);
      for (const test of failedTests) {
        errors.push(
          `${report.improvementTitle} - ${test.testName}: ${test.error}`
        );
      }
    }

    warnings.push(...report.warnings);
  }

  // Check for conflicting changes
  const filePaths = improvements.flatMap((imp) => imp.files.map((f) => f.path));
  const duplicates = filePaths.filter(
    (path, index) => filePaths.indexOf(path) !== index
  );

  if (duplicates.length > 0) {
    warnings.push(
      `Multiple improvements modify the same file(s): ${[...new Set(duplicates)].join(', ')}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
