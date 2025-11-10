/**
 * Homomorphic Encryption Prototype
 * 
 * This module provides a prototype implementation of homomorphic encryption (HE) for PII fields.
 * Homomorphic encryption allows computation on encrypted data without decryption, ensuring
 * privacy while maintaining functionality.
 * 
 * IMPORTANT PRODUCTION NOTES:
 * =========================
 * This is a PROTOTYPE implementation for demonstration and architectural planning.
 * 
 * For production deployment, consider:
 * 1. Replace with a true HE library (e.g., Microsoft SEAL, HElib, PALISADE)
 * 2. Implement proper key management and rotation
 * 3. Add secure key storage (Hardware Security Modules, KMS)
 * 4. Implement proper error handling and validation
 * 5. Add performance optimizations for large-scale operations
 * 6. Consider Format-Preserving Encryption (FPE) as an alternative for certain use cases
 * 7. Implement comprehensive audit logging for all encryption/decryption operations
 * 8. Add rate limiting and access controls
 * 
 * Current Implementation:
 * ----------------------
 * This prototype uses a simple tagging mechanism to simulate homomorphic encryption behavior.
 * In production, actual HE schemes like Paillier, BGV, or BFV would be used.
 */

import crypto from 'crypto';

// Encryption key - In production, this would be stored securely in KMS/HSM
const ENCRYPTION_KEY = process.env.HE_ENCRYPTION_KEY || 'default-prototype-key-change-in-production';

// Salt for key derivation
const SALT = 'milla-rayne-he-salt-v1';

/**
 * Derive an encryption key from the master key
 */
function deriveKey(): Buffer {
  return crypto.pbkdf2Sync(ENCRYPTION_KEY, SALT, 100000, 32, 'sha256');
}

/**
 * Generate an initialization vector
 */
function generateIV(): Buffer {
  return crypto.randomBytes(16);
}

/**
 * Encrypt data using homomorphic encryption (prototype)
 * 
 * In this prototype, we use AES encryption with a special marker to indicate
 * the data is homomorphically encrypted. In production, this would use a
 * true HE scheme that allows computation on encrypted data.
 * 
 * @param data - The plaintext data to encrypt
 * @returns The encrypted data with HE marker
 * 
 * @example
 * ```typescript
 * const encrypted = encryptHomomorphic("sensitive user location");
 * // Returns: "HE_v1:base64encodeddata"
 * ```
 */
export function encryptHomomorphic(data: string): string {
  if (!data || typeof data !== 'string') {
    throw new Error('Data to encrypt must be a non-empty string');
  }

  try {
    const key = deriveKey();
    const iv = generateIV();
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Combine IV and encrypted data
    const combined = iv.toString('base64') + ':' + encrypted;
    
    // Add HE marker to indicate this is homomorphically encrypted
    // In production, this would be actual HE ciphertext
    return `HE_v1:${combined}`;
  } catch (error) {
    console.error('[HE] Encryption failed:', error);
    throw new Error('Failed to encrypt data homomorphically');
  }
}

/**
 * Decrypt homomorphically encrypted data
 * 
 * @param encryptedData - The encrypted data with HE marker
 * @returns The decrypted plaintext
 * 
 * @example
 * ```typescript
 * const decrypted = decryptHomomorphic("HE_v1:base64encodeddata");
 * // Returns: "sensitive user location"
 * ```
 */
export function decryptHomomorphic(encryptedData: string): string {
  if (!encryptedData || typeof encryptedData !== 'string') {
    throw new Error('Encrypted data must be a non-empty string');
  }

  // Check for HE marker
  if (!encryptedData.startsWith('HE_v1:')) {
    throw new Error('Invalid homomorphic encryption format');
  }

  try {
    // Remove HE marker
    const combined = encryptedData.slice(6); // Remove "HE_v1:"
    
    // Split IV and encrypted data
    const [ivBase64, encrypted] = combined.split(':');
    if (!ivBase64 || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }
    
    const key = deriveKey();
    const iv = Buffer.from(ivBase64, 'base64');
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[HE] Decryption failed:', error);
    throw new Error('Failed to decrypt homomorphically encrypted data');
  }
}

/**
 * Query homomorphically encrypted data
 * 
 * This function simulates querying encrypted data without decryption.
 * In a true HE implementation, this would perform computations directly
 * on the encrypted data.
 * 
 * PROTOTYPE BEHAVIOR:
 * - For this prototype, we decrypt, search, and re-encrypt
 * - In production HE, the data would never be decrypted
 * - Production systems would use specialized HE search algorithms
 * 
 * @param encryptedData - The encrypted data to query
 * @param query - The search query
 * @returns Object indicating if query matches and relevance score
 * 
 * @example
 * ```typescript
 * const result = queryHomomorphic(encrypted, "location");
 * // Returns: { matches: true, score: 0.85, encrypted: true }
 * ```
 */
export function queryHomomorphic(
  encryptedData: string,
  query: string
): { matches: boolean; score: number; encrypted: boolean } {
  if (!encryptedData || !query) {
    return { matches: false, score: 0, encrypted: true };
  }

  try {
    // PROTOTYPE: We decrypt for searching
    // In production HE, this would be done on encrypted data
    const decrypted = decryptHomomorphic(encryptedData);
    
    // Perform search
    const lowerDecrypted = decrypted.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    // Check for exact match
    if (lowerDecrypted.includes(lowerQuery)) {
      return { matches: true, score: 1.0, encrypted: true };
    }
    
    // Check for partial match using simple similarity
    const words = lowerDecrypted.split(/\s+/);
    const queryWords = lowerQuery.split(/\s+/);
    
    let matchCount = 0;
    for (const queryWord of queryWords) {
      for (const word of words) {
        if (word.includes(queryWord) || queryWord.includes(word)) {
          matchCount++;
          break;
        }
      }
    }
    
    const score = matchCount / queryWords.length;
    const matches = score > 0.5;
    
    return { matches, score, encrypted: true };
  } catch (error) {
    console.error('[HE] Query failed:', error);
    return { matches: false, score: 0, encrypted: true };
  }
}

/**
 * Check if data is homomorphically encrypted
 * 
 * @param data - The data to check
 * @returns True if data is HE encrypted
 */
export function isHomomorphicallyEncrypted(data: string): boolean {
  return typeof data === 'string' && data.startsWith('HE_v1:');
}

/**
 * Re-encrypt data with a new key (for key rotation)
 * 
 * In production, this would be used for periodic key rotation
 * to maintain security.
 * 
 * @param encryptedData - Currently encrypted data
 * @returns Re-encrypted data
 */
export function reencryptHomomorphic(encryptedData: string): string {
  const decrypted = decryptHomomorphic(encryptedData);
  return encryptHomomorphic(decrypted);
}

/**
 * Perform a computation on encrypted data (prototype)
 * 
 * This demonstrates the concept of computing on encrypted data.
 * In this prototype, we show length calculation as an example.
 * Production HE would support addition, multiplication, comparisons, etc.
 * 
 * @param encryptedData - The encrypted data
 * @param operation - Operation to perform ('length', 'contains', etc.)
 * @param params - Operation parameters
 * @returns Result of computation (may be encrypted)
 */
export function computeOnEncrypted(
  encryptedData: string,
  operation: 'length' | 'contains' | 'compare',
  params?: any
): any {
  // PROTOTYPE: Demonstrates the concept
  // Production HE would perform these operations without decryption
  
  switch (operation) {
    case 'length': {
      const decrypted = decryptHomomorphic(encryptedData);
      return decrypted.length;
    }
    case 'contains': {
      if (!params?.substring) {
        throw new Error('substring parameter required for contains operation');
      }
      const result = queryHomomorphic(encryptedData, params.substring);
      return result.matches;
    }
    case 'compare': {
      if (!params?.otherEncrypted) {
        throw new Error('otherEncrypted parameter required for compare operation');
      }
      const data1 = decryptHomomorphic(encryptedData);
      const data2 = decryptHomomorphic(params.otherEncrypted);
      return data1 === data2;
    }
    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }
}
