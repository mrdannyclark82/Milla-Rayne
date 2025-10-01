/**
 * Cryptographic utilities for field-level encryption
 * Uses AES-256-GCM for authenticated encryption of sensitive data
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// Encryption version for future compatibility
const ENCRYPTION_VERSION = 'v1';
const ENCRYPTION_PREFIX = 'enc:';

// Algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get or generate encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
  const memoryKey = process.env.MEMORY_KEY;
  
  if (!memoryKey) {
    console.warn('MEMORY_KEY not set - encryption disabled. Data will be stored in plaintext.');
    return Buffer.alloc(0);
  }
  
  // Derive a proper key from the MEMORY_KEY using scrypt
  const salt = Buffer.from('milla-rayne-salt'); // Static salt for deterministic key
  return scryptSync(memoryKey, salt, KEY_LENGTH);
}

/**
 * Check if encryption is enabled
 */
export function isEncryptionEnabled(): boolean {
  return !!process.env.MEMORY_KEY;
}

/**
 * Encrypt a string value using AES-256-GCM
 * Format: enc:v1:<base64-encoded-data>
 * 
 * @param plaintext - The text to encrypt
 * @returns Encrypted string with version prefix, or plaintext if encryption disabled
 */
export function encrypt(plaintext: string): string {
  if (!isEncryptionEnabled()) {
    return plaintext;
  }
  
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV + encrypted data + auth tag
    const combined = Buffer.concat([iv, encrypted, authTag]);
    
    // Format: enc:v1:<base64-data>
    return `${ENCRYPTION_PREFIX}${ENCRYPTION_VERSION}:${combined.toString('base64')}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt an encrypted string value
 * Supports format: enc:v1:<base64-encoded-data>
 * 
 * @param ciphertext - The encrypted text to decrypt
 * @returns Decrypted plaintext, or original string if not encrypted
 */
export function decrypt(ciphertext: string): string {
  // If not encrypted, return as-is (backward compatibility)
  if (!ciphertext.startsWith(ENCRYPTION_PREFIX)) {
    return ciphertext;
  }
  
  if (!isEncryptionEnabled()) {
    throw new Error('Cannot decrypt data: MEMORY_KEY not set');
  }
  
  try {
    // Parse format: enc:v1:<base64-data>
    const parts = ciphertext.split(':');
    if (parts.length !== 3 || parts[0] !== 'enc') {
      throw new Error('Invalid encrypted data format');
    }
    
    const version = parts[1];
    const encodedData = parts[2];
    
    if (version !== ENCRYPTION_VERSION) {
      throw new Error(`Unsupported encryption version: ${version}`);
    }
    
    const key = getEncryptionKey();
    const combined = Buffer.from(encodedData, 'base64');
    
    // Extract components: IV + encrypted data + auth tag
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if a value is encrypted
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith(ENCRYPTION_PREFIX);
}
