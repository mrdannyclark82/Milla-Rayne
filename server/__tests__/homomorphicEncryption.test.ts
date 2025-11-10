import { describe, it, expect, beforeEach } from 'vitest';
import {
  encryptHomomorphic,
  decryptHomomorphic,
  queryHomomorphic,
  isHomomorphicallyEncrypted,
  reencryptHomomorphic,
  computeOnEncrypted,
} from '../crypto/homomorphicPrototype';

describe('Homomorphic Encryption Prototype', () => {
  describe('encryptHomomorphic', () => {
    it('should encrypt data with HE_v1 prefix', () => {
      const plaintext = 'sensitive user location';
      const encrypted = encryptHomomorphic(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).toContain('HE_v1:');
      expect(encrypted.length).toBeGreaterThan(plaintext.length);
    });

    it('should produce different ciphertext for same plaintext (due to IV)', () => {
      const plaintext = 'test data';
      const encrypted1 = encryptHomomorphic(plaintext);
      const encrypted2 = encryptHomomorphic(plaintext);

      expect(encrypted1).not.toBe(encrypted2); // Different IVs
    });

    it('should throw error for empty string', () => {
      expect(() => encryptHomomorphic('')).toThrow('Data to encrypt must be a non-empty string');
    });

    it('should throw error for non-string input', () => {
      expect(() => encryptHomomorphic(null as any)).toThrow('Data to encrypt must be a non-empty string');
    });

    it('should handle special characters', () => {
      const plaintext = 'Test with special chars: !@#$%^&*()';
      const encrypted = encryptHomomorphic(plaintext);

      expect(encrypted).toContain('HE_v1:');
      expect(encrypted).toBeDefined();
    });
  });

  describe('decryptHomomorphic', () => {
    it('should decrypt data encrypted with encryptHomomorphic', () => {
      const plaintext = 'sensitive user data';
      const encrypted = encryptHomomorphic(plaintext);
      const decrypted = decryptHomomorphic(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long text', () => {
      const plaintext = 'This is a much longer piece of text that contains multiple sentences and should still be properly encrypted and decrypted without any issues.';
      const encrypted = encryptHomomorphic(plaintext);
      const decrypted = decryptHomomorphic(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for invalid format', () => {
      expect(() => decryptHomomorphic('invalid_format')).toThrow('Invalid homomorphic encryption format');
    });

    it('should throw error for malformed encrypted data', () => {
      expect(() => decryptHomomorphic('HE_v1:malformed')).toThrow('Failed to decrypt homomorphically encrypted data');
    });

    it('should handle Unicode characters', () => {
      const plaintext = 'Unicode test: 你好世界 🌍';
      const encrypted = encryptHomomorphic(plaintext);
      const decrypted = decryptHomomorphic(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('queryHomomorphic', () => {
    it('should find exact match in encrypted data', () => {
      const plaintext = 'user location: New York';
      const encrypted = encryptHomomorphic(plaintext);
      const result = queryHomomorphic(encrypted, 'New York');

      expect(result.matches).toBe(true);
      expect(result.score).toBe(1.0);
      expect(result.encrypted).toBe(true);
    });

    it('should be case insensitive', () => {
      const plaintext = 'User Location: San Francisco';
      const encrypted = encryptHomomorphic(plaintext);
      const result = queryHomomorphic(encrypted, 'san francisco');

      expect(result.matches).toBe(true);
    });

    it('should find partial matches', () => {
      const plaintext = 'Living in Los Angeles, California';
      const encrypted = encryptHomomorphic(plaintext);
      const result = queryHomomorphic(encrypted, 'Angeles');

      expect(result.matches).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should return false for no match', () => {
      const plaintext = 'user location: Chicago';
      const encrypted = encryptHomomorphic(plaintext);
      const result = queryHomomorphic(encrypted, 'Boston');

      expect(result.matches).toBe(false);
      expect(result.score).toBe(0);
    });

    it('should handle empty query', () => {
      const plaintext = 'some data';
      const encrypted = encryptHomomorphic(plaintext);
      const result = queryHomomorphic(encrypted, '');

      expect(result.matches).toBe(false);
      expect(result.score).toBe(0);
    });
  });

  describe('isHomomorphicallyEncrypted', () => {
    it('should detect HE encrypted data', () => {
      const encrypted = encryptHomomorphic('test data');
      expect(isHomomorphicallyEncrypted(encrypted)).toBe(true);
    });

    it('should return false for plaintext', () => {
      expect(isHomomorphicallyEncrypted('plain text')).toBe(false);
    });

    it('should return false for other encryption formats', () => {
      expect(isHomomorphicallyEncrypted('AES_v1:somedata')).toBe(false);
    });

    it('should handle non-string input', () => {
      expect(isHomomorphicallyEncrypted(null as any)).toBe(false);
      expect(isHomomorphicallyEncrypted(undefined as any)).toBe(false);
      expect(isHomomorphicallyEncrypted(123 as any)).toBe(false);
    });
  });

  describe('reencryptHomomorphic', () => {
    it('should re-encrypt data maintaining plaintext', () => {
      const plaintext = 'sensitive data for re-encryption';
      const encrypted1 = encryptHomomorphic(plaintext);
      const encrypted2 = reencryptHomomorphic(encrypted1);

      expect(encrypted2).not.toBe(encrypted1); // Different ciphertext
      expect(decryptHomomorphic(encrypted2)).toBe(plaintext); // Same plaintext
    });

    it('should produce HE encrypted format', () => {
      const encrypted1 = encryptHomomorphic('test');
      const encrypted2 = reencryptHomomorphic(encrypted1);

      expect(isHomomorphicallyEncrypted(encrypted2)).toBe(true);
    });
  });

  describe('computeOnEncrypted', () => {
    it('should compute length of encrypted data', () => {
      const plaintext = 'test data';
      const encrypted = encryptHomomorphic(plaintext);
      const length = computeOnEncrypted(encrypted, 'length');

      expect(length).toBe(plaintext.length);
    });

    it('should check if encrypted data contains substring', () => {
      const plaintext = 'user lives in Seattle';
      const encrypted = encryptHomomorphic(plaintext);
      const contains = computeOnEncrypted(encrypted, 'contains', { substring: 'Seattle' });

      expect(contains).toBe(true);
    });

    it('should compare two encrypted values', () => {
      const data1 = 'same data';
      const data2 = 'same data';
      const encrypted1 = encryptHomomorphic(data1);
      const encrypted2 = encryptHomomorphic(data2);
      
      const areEqual = computeOnEncrypted(encrypted1, 'compare', { otherEncrypted: encrypted2 });

      expect(areEqual).toBe(true);
    });

    it('should detect different encrypted values', () => {
      const encrypted1 = encryptHomomorphic('data1');
      const encrypted2 = encryptHomomorphic('data2');
      
      const areEqual = computeOnEncrypted(encrypted1, 'compare', { otherEncrypted: encrypted2 });

      expect(areEqual).toBe(false);
    });

    it('should throw error for unsupported operation', () => {
      const encrypted = encryptHomomorphic('test');
      expect(() => computeOnEncrypted(encrypted, 'unsupported' as any)).toThrow('Unsupported operation');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete encrypt-query-decrypt workflow', () => {
      const sensitiveData = 'User location: 123 Main St, New York, NY';
      
      // Encrypt
      const encrypted = encryptHomomorphic(sensitiveData);
      expect(isHomomorphicallyEncrypted(encrypted)).toBe(true);
      
      // Query without decryption
      const queryResult = queryHomomorphic(encrypted, 'New York');
      expect(queryResult.matches).toBe(true);
      
      // Decrypt for authorized access
      const decrypted = decryptHomomorphic(encrypted);
      expect(decrypted).toBe(sensitiveData);
    });

    it('should support key rotation workflow', () => {
      const plaintext = 'sensitive information';
      
      // Initial encryption
      const encrypted1 = encryptHomomorphic(plaintext);
      
      // Simulate key rotation
      const encrypted2 = reencryptHomomorphic(encrypted1);
      
      // Verify data integrity after rotation
      const decrypted = decryptHomomorphic(encrypted2);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle multiple sensitive fields', () => {
      const fields = [
        'user location: Boston',
        'phone: 555-1234',
        'email: user@example.com',
      ];
      
      const encrypted = fields.map(field => encryptHomomorphic(field));
      
      // All should be encrypted
      encrypted.forEach(enc => {
        expect(isHomomorphicallyEncrypted(enc)).toBe(true);
      });
      
      // Should be queryable
      const locationQuery = queryHomomorphic(encrypted[0], 'Boston');
      expect(locationQuery.matches).toBe(true);
      
      // Should be decryptable
      const decrypted = encrypted.map(enc => decryptHomomorphic(enc));
      expect(decrypted).toEqual(fields);
    });
  });
});
