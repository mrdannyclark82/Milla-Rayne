/**
 * Input Sanitization and Validation Utilities
 * 
 * This module provides robust sanitization and validation functions to prevent:
 * - Prompt injection attacks
 * - XSS attacks
 * - SQL injection
 * - Command injection
 * - Path traversal
 */

import { z } from 'zod';

/**
 * Sanitize user input to prevent prompt injection
 * Removes or escapes potentially malicious patterns that could manipulate AI responses
 */
export function sanitizePromptInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Remove excessive newlines and control characters (keeping basic formatting)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Limit consecutive newlines to prevent prompt injection via formatting
  sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');

  // Remove suspicious instruction patterns that might try to override system prompts
  const suspiciousPatterns = [
    /ignore\s+(previous|all|above)\s+(instructions?|prompts?|commands?)/gi,
    /forget\s+(everything|all)\s+(you\s+)?(know|learned|were\s+told)/gi,
    /you\s+are\s+now\s+(a|an)\s+\w+/gi,
    /system\s*:\s*/gi,
    /assistant\s*:\s*/gi,
    /<\s*\/?system\s*>/gi,
    /<\s*\/?prompt\s*>/gi,
  ];

  for (const pattern of suspiciousPatterns) {
    sanitized = sanitized.replace(pattern, '[filtered]');
  }

  // Trim excessive whitespace
  sanitized = sanitized.trim();
  
  // Limit overall length to prevent resource exhaustion
  const MAX_LENGTH = 50000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized;
}

/**
 * Sanitize HTML content to prevent XSS
 * Removes dangerous HTML tags and attributes
 * Uses a more robust approach to handle edge cases
 * 
 * NOTE: For production use, consider using a dedicated HTML sanitization library
 * like DOMPurify or sanitize-html which handle edge cases more thoroughly.
 * This implementation uses regex which has known limitations with HTML parsing.
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }

  // For maximum security, consider stripping ALL HTML tags
  // This is the safest approach if HTML rendering is not required
  let sanitized = html.replace(/<[^>]*>/g, '');
  
  // Remove any remaining javascript: and vbscript: protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  
  // Remove event handler patterns that might remain
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  return sanitized;
}

/**
 * Sanitize file paths to prevent path traversal attacks
 */
export function sanitizePath(path: string): string {
  if (typeof path !== 'string') {
    return '';
  }

  // Remove null bytes
  let sanitized = path.replace(/\0/g, '');
  
  // Remove path traversal patterns
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.replace(/\.\//, '');
  
  // Remove leading slashes to prevent absolute path access
  sanitized = sanitized.replace(/^\/+/, '');
  
  // Remove backslashes (Windows path separators)
  sanitized = sanitized.replace(/\\/g, '/');
  
  // Remove multiple consecutive slashes
  sanitized = sanitized.replace(/\/+/g, '/');
  
  return sanitized;
}

/**
 * Validate and sanitize email addresses
 */
export const emailSchema = z.string().email().max(255);

export function sanitizeEmail(email: string): string | null {
  try {
    const validated = emailSchema.parse(email.toLowerCase().trim());
    return validated;
  } catch {
    return null;
  }
}

/**
 * Validate and sanitize usernames
 */
export const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be at most 50 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

export function sanitizeUsername(username: string): string | null {
  try {
    const validated = usernameSchema.parse(username.trim());
    return validated;
  } catch {
    return null;
  }
}

/**
 * Sanitize SQL-like strings (for non-parameterized queries, though parameterized queries should always be preferred)
 */
export function sanitizeSqlString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Escape single quotes
  let sanitized = input.replace(/'/g, "''");
  
  // Remove SQL comment markers
  sanitized = sanitized.replace(/--/g, '');
  sanitized = sanitized.replace(/\/\*/g, '');
  sanitized = sanitized.replace(/\*\//g, '');
  
  return sanitized;
}

/**
 * Sanitize JSON input
 */
export function sanitizeJsonInput(input: string): string | null {
  try {
    // Parse and re-stringify to ensure valid JSON
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
}

/**
 * Validate URL
 */
export const urlSchema = z.string().url().max(2048);

export function sanitizeUrl(url: string): string | null {
  try {
    const validated = urlSchema.parse(url.trim());
    const parsed = new URL(validated);
    
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    
    return validated;
  } catch {
    return null;
  }
}

/**
 * Sanitize command-line input to prevent command injection
 */
export function sanitizeCommandInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove shell metacharacters that could be used for command injection
  const dangerousChars = /[;&|`$(){}[\]<>\\!]/g;
  let sanitized = input.replace(dangerousChars, '');
  
  // Remove newlines and carriage returns
  sanitized = sanitized.replace(/[\r\n]/g, ' ');
  
  // Trim excessive whitespace
  sanitized = sanitized.trim().replace(/\s+/g, ' ');
  
  return sanitized;
}

/**
 * Rate limiting helper - validates request frequency
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return true;
  }

  if (record.count >= config.maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Clear rate limit records older than their window
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up rate limits every hour
setInterval(cleanupRateLimits, 60 * 60 * 1000);

/**
 * General purpose input validator
 */
export function validateInput(
  input: any,
  schema: z.ZodSchema
): { valid: boolean; data?: any; error?: string } {
  try {
    const validated = schema.parse(input);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = (error as any).issues || [];
      return {
        valid: false,
        error: issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }
    return { valid: false, error: 'Validation failed' };
  }
}
