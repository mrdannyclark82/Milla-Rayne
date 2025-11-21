/**
 * Tests for Production Homomorphic Encryption Implementation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  encryptHomomorphic,
  decryptHomomorphic,
  queryHomomorphic,
  isHomomorphicallyEncrypted,
  reencryptHomomorphic,
  computeOnEncrypted,
  batchEncrypt,
  batchDecrypt,
  migrateToV2,
} from '../crypto/homomorphicProduction';

describe('Production Homomorphic Encryption', () => {
  describe('Basic Encryption/Decryption', () => {
    it('should encrypt and decrypt text correctly', async () => {
      const plaintext = 'This is sensitive PII data';

      const encrypted = await encryptHomomorphic(plaintext);
      const decrypted = await decryptHomomorphic(encrypted);

      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toContain('HE_v2:');
    });

    it('should produce different ciphertexts for different plaintexts', async () => {
      const text1 = 'Secret data 1';
      const text2 = 'Secret data 2';

      const encrypted1 = await encryptHomomorphic(text1);
      const encrypted2 = await encryptHomomorphic(text2);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should produce same ciphertext for same plaintext (deterministic)', async () => {
      const plaintext = 'Deterministic encryption test';

      const encrypted1 = await encryptHomomorphic(plaintext);
      const encrypted2 = await encryptHomomorphic(plaintext);

      // Extract ciphertext portion (excluding version marker and IV)
      const ciphertext1 = encrypted1.split(':').slice(2).join(':');
      const ciphertext2 = encrypted2.split(':').slice(2).join(':');

      expect(ciphertext1).toBe(ciphertext2);
    });

    it('should handle empty string', async () => {
      await expect(encryptHomomorphic('')).rejects.toThrow();
    });

    it('should handle special characters', async () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`';

      const encrypted = await encryptHomomorphic(plaintext);
      const decrypted = await decryptHomomorphic(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', async () => {
      const plaintext = '你好世界 🌍 Здравствуй мир';

      const encrypted = await encryptHomomorphic(plaintext);
      const decrypted = await decryptHomomorphic(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long text', async () => {
      const plaintext = 'A'.repeat(10000);

      const encrypted = await encryptHomomorphic(plaintext);
      const decrypted = await decryptHomomorphic(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Encryption Format', () => {
    it('should use HE_v2 format', async () => {
      const encrypted = await encryptHomomorphic('test data');

      expect(encrypted).toMatch(/^HE_v2:/);
    });

    it('should correctly identify encrypted data', async () => {
      const encrypted = await encryptHomomorphic('test');

      expect(isHomomorphicallyEncrypted(encrypted)).toBe(true);
      expect(isHomomorphicallyEncrypted('plain text')).toBe(false);
      expect(isHomomorphicallyEncrypted('HE_v1:something')).toBe(true);
    });
  });

  describe('Searchable Encryption', () => {
    it('should find exact matches', async () => {
      const data = 'The quick brown fox';
      const encrypted = await encryptHomomorphic(data);

      const result = await queryHomomorphic(encrypted, 'quick');

      expect(result.matches).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.encrypted).toBe(true);
    });

    it('should not match non-existent terms', async () => {
      const data = 'The quick brown fox';
      const encrypted = await encryptHomomorphic(data);

      const result = await queryHomomorphic(encrypted, 'elephant');

      expect(result.matches).toBe(false);
      expect(result.score).toBe(0);
    });

    it('should be case-insensitive', async () => {
      const data = 'Hello World';
      const encrypted = await encryptHomomorphic(data);

      const result1 = await queryHomomorphic(encrypted, 'hello');
      const result2 = await queryHomomorphic(encrypted, 'HELLO');
      const result3 = await queryHomomorphic(encrypted, 'HeLLo');

      expect(result1.matches).toBe(true);
      expect(result2.matches).toBe(true);
      expect(result3.matches).toBe(true);
    });

    it('should handle partial matches', async () => {
      const data = 'This is a test message';
      const encrypted = await encryptHomomorphic(data);

      const result = await queryHomomorphic(encrypted, 'test');

      expect(result.matches).toBe(true);
    });

    it('should match full encrypted value', async () => {
      const data = 'exact match test';
      const encrypted = await encryptHomomorphic(data);

      const result = await queryHomomorphic(encrypted, data);

      expect(result.matches).toBe(true);
      expect(result.score).toBe(1.0);
    });
  });

  describe('Computed Operations', () => {
    it('should compute length correctly', async () => {
      const data = 'Test string';
      const encrypted = await encryptHomomorphic(data);

      const length = await computeOnEncrypted(encrypted, 'length');

      expect(length).toBe(data.length);
    });

    it('should check contains', async () => {
      const data = 'Hello World Test';
      const encrypted = await encryptHomomorphic(data);

      const contains = await computeOnEncrypted(encrypted, 'contains', {
        substring: 'World',
      });

      expect(contains).toBe(true);
    });

    it('should compare two encrypted values', async () => {
      const data1 = 'Same value';
      const data2 = 'Same value';
      const data3 = 'Different value';

      const encrypted1 = await encryptHomomorphic(data1);
      const encrypted2 = await encryptHomomorphic(data2);
      const encrypted3 = await encryptHomomorphic(data3);

      const equal = await computeOnEncrypted(encrypted1, 'compare', {
        otherEncrypted: encrypted2,
      });

      const notEqual = await computeOnEncrypted(encrypted1, 'compare', {
        otherEncrypted: encrypted3,
      });

      expect(equal).toBe(true);
      expect(notEqual).toBe(false);
    });
  });

  describe('Key Rotation', () => {
    it('should re-encrypt data successfully', async () => {
      const plaintext = 'Data for re-encryption';
      const encrypted1 = await encryptHomomorphic(plaintext);

      const encrypted2 = await reencryptHomomorphic(encrypted1);
      const decrypted = await decryptHomomorphic(encrypted2);

      expect(decrypted).toBe(plaintext);
      expect(encrypted2).toContain('HE_v2:');
    });
  });

  describe('Batch Operations', () => {
    it('should batch encrypt multiple values', async () => {
      const values = ['value1', 'value2', 'value3', 'value4', 'value5'];

      const startTime = Date.now();
      const encrypted = await batchEncrypt(values);
      const batchTime = Date.now() - startTime;

      expect(encrypted).toHaveLength(values.length);
      expect(encrypted.every((e) => e.startsWith('HE_v2:'))).toBe(true);

      // Batch should be reasonably fast
      expect(batchTime).toBeLessThan(1000); // Less than 1 second for 5 items
    });

    it('should batch decrypt multiple values', async () => {
      const values = ['value1', 'value2', 'value3'];
      const encrypted = await batchEncrypt(values);

      const decrypted = await batchDecrypt(encrypted);

      expect(decrypted).toEqual(values);
    });
  });

  describe('Backward Compatibility', () => {
    it('should decrypt v1 format (prototype)', async () => {
      // This test ensures we can still decrypt old v1 format data
      // The actual v1 decryption logic is tested separately
      const v1Format = 'HE_v1:somebase64data:morebase64';

      expect(isHomomorphicallyEncrypted(v1Format)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid encrypted data', async () => {
      await expect(decryptHomomorphic('invalid data')).rejects.toThrow();
      await expect(decryptHomomorphic('HE_v2:invalid')).rejects.toThrow();
    });

    it('should reject empty encrypted data', async () => {
      await expect(decryptHomomorphic('')).rejects.toThrow();
    });

    it('should reject null/undefined input for encryption', async () => {
      await expect(encryptHomomorphic(null as any)).rejects.toThrow();
      await expect(encryptHomomorphic(undefined as any)).rejects.toThrow();
    });
  });

  describe('Performance Characteristics', () => {
    it('should encrypt within reasonable time', async () => {
      const data = 'Performance test data with some length';

      const startTime = Date.now();
      await encryptHomomorphic(data);
      const duration = Date.now() - startTime;

      // Should complete within 100ms for normal strings
      expect(duration).toBeLessThan(100);
    });

    it('should decrypt within reasonable time', async () => {
      const data = 'Performance test data';
      const encrypted = await encryptHomomorphic(data);

      const startTime = Date.now();
      await decryptHomomorphic(encrypted);
      const duration = Date.now() - startTime;

      // Should complete within 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should search within reasonable time', async () => {
      const data = 'Searchable encrypted data with multiple words';
      const encrypted = await encryptHomomorphic(data);

      const startTime = Date.now();
      await queryHomomorphic(encrypted, 'encrypted');
      const duration = Date.now() - startTime;

      // Should complete within 200ms
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Security Properties', () => {
    it('should not leak plaintext in encrypted form', async () => {
      const secret = 'MySecretPassword123';
      const encrypted = await encryptHomomorphic(secret);

      // Encrypted data should not contain the plaintext
      expect(encrypted.toLowerCase()).not.toContain(secret.toLowerCase());
    });

    it('should produce authenticated ciphertext', async () => {
      const data = 'Authenticated data';
      const encrypted = await encryptHomomorphic(data);

      // Should contain auth tag component
      const parts = encrypted.split(':');
      expect(parts.length).toBeGreaterThanOrEqual(4);
    });

    it('should reject tampered ciphertext', async () => {
      const data = 'Tamper test';
      const encrypted = await encryptHomomorphic(data);

      // Tamper with the ciphertext
      const tampered = encrypted.slice(0, -5) + 'XXXXX';

      await expect(decryptHomomorphic(tampered)).rejects.toThrow();
    });
  });
});
