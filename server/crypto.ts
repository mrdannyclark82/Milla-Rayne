/**
 * Cryptographic utilities for encrypting/decrypting sensitive data
 * Uses AES-256-GCM for authenticated encryption
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits
const TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits
const ITERATIONS = 100000;
const ENCODING_VERSION = 'v1';

/**
 * Derive a key from the MEMORY_KEY using PBKDF2
 */
function deriveKey(memoryKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(memoryKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt plaintext using AES-256-GCM
 * Returns: enc:v1:base64(salt:iv:tag:ciphertext)
 */
export function encrypt(plaintext: string, memoryKey: string): string {
  if (!memoryKey) {
    throw new Error('MEMORY_KEY is required for encryption');
  }

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Derive key from memory key
  const key = deriveKey(memoryKey, salt);
  
  // Encrypt
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  
  // Get authentication tag
  const tag = cipher.getAuthTag();
  
  // Combine: salt + iv + tag + ciphertext
  const combined = Buffer.concat([salt, iv, tag, encrypted]);
  
  // Return with version prefix
  return `enc:${ENCODING_VERSION}:${combined.toString('base64')}`;
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * Expects: enc:v1:base64(salt:iv:tag:ciphertext)
 */
export function decrypt(ciphertext: string, memoryKey: string): string {
  if (!memoryKey) {
    throw new Error('MEMORY_KEY is required for decryption');
  }

  // Check for encryption prefix
  if (!ciphertext.startsWith('enc:')) {
    throw new Error('Invalid encrypted data format');
  }

  // Parse version and data
  const parts = ciphertext.split(':');
  if (parts.length !== 3 || parts[0] !== 'enc') {
    throw new Error('Invalid encrypted data format');
  }

  const version = parts[1];
  if (version !== ENCODING_VERSION) {
    throw new Error(`Unsupported encryption version: ${version}`);
  }

  // Decode base64
  const combined = Buffer.from(parts[2], 'base64');
  
  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  // Derive key
  const key = deriveKey(memoryKey, salt);
  
  // Decrypt
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return decrypted.toString('utf8');
}

/**
 * Check if data is already encrypted
 */
export function isEncrypted(data: string): boolean {
  return data.startsWith('enc:v1:');
}

/**
 * Get MEMORY_KEY from environment with validation
 */
export function getMemoryKey(): string {
  const key = process.env.MEMORY_KEY;
  
  if (!key) {
    throw new Error('MEMORY_KEY environment variable is not set');
  }

  if (key.length < 32) {
    throw new Error('MEMORY_KEY must be at least 32 characters long');
  }

  return key;
}

/**
 * Generate a secure random MEMORY_KEY
 */
export function generateMemoryKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
