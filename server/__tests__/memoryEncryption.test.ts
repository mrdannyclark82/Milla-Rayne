import { describe, it, expect, beforeEach } from 'vitest';
import {
  encryptSensitiveMemoryFields,
  decryptSensitiveMemoryFields,
  searchEncryptedContext,
  type MemoryCoreEntry,
} from '../memoryService';
import { isHomomorphicallyEncrypted } from '../crypto/homomorphicProduction';

describe('Memory Service - Homomorphic Encryption Integration', () => {
  describe('encryptSensitiveMemoryFields', () => {
    it('should encrypt context containing location information', async () => {
      const entry: MemoryCoreEntry = {
        id: 'test-1',
        timestamp: new Date().toISOString(),
        speaker: 'user',
        content: 'I went to the store',
        context: 'user location: New York City',
        searchableContent: 'i went to the store',
      };

      const encrypted = await encryptSensitiveMemoryFields(entry);

      expect(encrypted.context).toBeDefined();
      expect(isHomomorphicallyEncrypted(encrypted.context!)).toBe(true);
      expect(encrypted.context).not.toBe(entry.context);
    });

    it('should encrypt context containing personal information', async () => {
      const entry: MemoryCoreEntry = {
        id: 'test-2',
        timestamp: new Date().toISOString(),
        speaker: 'user',
        content: 'Calling my doctor',
        context: 'private: medical appointment',
        searchableContent: 'calling my doctor',
      };

      const encrypted = await encryptSensitiveMemoryFields(entry);

      expect(isHomomorphicallyEncrypted(encrypted.context!)).toBe(true);
    });

    it('should not encrypt non-sensitive context', async () => {
      const entry: MemoryCoreEntry = {
        id: 'test-3',
        timestamp: new Date().toISOString(),
        speaker: 'user',
        content: 'Had a great day',
        context: 'general conversation',
        searchableContent: 'had a great day',
      };

      const encrypted = await encryptSensitiveMemoryFields(entry);

      expect(encrypted.context).toBe('general conversation');
      expect(isHomomorphicallyEncrypted(encrypted.context!)).toBe(false);
    });

    it('should handle missing context', async () => {
      const entry: MemoryCoreEntry = {
        id: 'test-4',
        timestamp: new Date().toISOString(),
        speaker: 'user',
        content: 'Hello',
        searchableContent: 'hello',
      };

      const encrypted = await encryptSensitiveMemoryFields(entry);

      expect(encrypted.context).toBeUndefined();
    });

    it('should detect various sensitive keywords', async () => {
      const sensitiveContexts = [
        'home address: 123 Main St',
        'phone number: 555-1234',
        'bank account information',
        'confidential notes',
        'health records',
        'ssn: 123-45-6789',
      ];

      for (const context of sensitiveContexts) {
        const entry: MemoryCoreEntry = {
          id: 'test',
          timestamp: new Date().toISOString(),
          speaker: 'user',
          content: 'test',
          context,
          searchableContent: 'test',
        };

        const encrypted = await encryptSensitiveMemoryFields(entry);
        expect(isHomomorphicallyEncrypted(encrypted.context!)).toBe(true);
      }
    });
  });

  describe('decryptSensitiveMemoryFields', () => {
    it('should decrypt encrypted context', async () => {
      const originalEntry: MemoryCoreEntry = {
        id: 'test-5',
        timestamp: new Date().toISOString(),
        speaker: 'user',
        content: 'Discussing location',
        context: 'user lives in San Francisco',
        searchableContent: 'discussing location',
      };

      const encrypted = await encryptSensitiveMemoryFields(originalEntry);
      const decrypted = await decryptSensitiveMemoryFields(encrypted);

      expect(decrypted.context).toBe(originalEntry.context);
      expect(isHomomorphicallyEncrypted(decrypted.context!)).toBe(false);
    });

    it('should leave non-encrypted context unchanged', async () => {
      const entry: MemoryCoreEntry = {
        id: 'test-6',
        timestamp: new Date().toISOString(),
        speaker: 'user',
        content: 'Regular conversation',
        context: 'general chat',
        searchableContent: 'regular conversation',
      };

      const decrypted = await decryptSensitiveMemoryFields(entry);

      expect(decrypted.context).toBe('general chat');
    });

    it('should handle entries without context', async () => {
      const entry: MemoryCoreEntry = {
        id: 'test-7',
        timestamp: new Date().toISOString(),
        speaker: 'user',
        content: 'Hello',
        searchableContent: 'hello',
      };

      const decrypted = await decryptSensitiveMemoryFields(entry);

      expect(decrypted.context).toBeUndefined();
    });
  });

  describe('searchEncryptedContext', () => {
    it('should search in encrypted context using homomorphic query', async () => {
      const entry: MemoryCoreEntry = {
        id: 'test-8',
        timestamp: new Date().toISOString(),
        speaker: 'user',
        content: 'Location update',
        context: 'user location: Boston, Massachusetts',
        searchableContent: 'location update',
      };

      const encrypted = await encryptSensitiveMemoryFields(entry);
      const result = await searchEncryptedContext(encrypted, 'Boston');

      expect(result.matches).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should search in non-encrypted context normally', async () => {
      const entry: MemoryCoreEntry = {
        id: 'test-9',
        timestamp: new Date().toISOString(),
        speaker: 'user',
        content: 'Weather discussion',
        context: 'talking about weather',
        searchableContent: 'weather discussion',
      };

      const result = await searchEncryptedContext(entry, 'weather');

      expect(result.matches).toBe(true);
      expect(result.score).toBe(1.0);
    });

    it('should return false for no match', async () => {
      const entry: MemoryCoreEntry = {
        id: 'test-10',
        timestamp: new Date().toISOString(),
        speaker: 'user',
        content: 'Random talk',
        context: 'user location: Seattle',
        searchableContent: 'random talk',
      };

      const encrypted = await encryptSensitiveMemoryFields(entry);
      const result = await searchEncryptedContext(encrypted, 'Chicago');

      expect(result.matches).toBe(false);
    });

    it('should handle missing context', async () => {
      const entry: MemoryCoreEntry = {
        id: 'test-11',
        timestamp: new Date().toISOString(),
        speaker: 'user',
        content: 'Test',
        searchableContent: 'test',
      };

      const result = await searchEncryptedContext(entry, 'anything');

      expect(result.matches).toBe(false);
      expect(result.score).toBe(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete encrypt-search-decrypt workflow', async () => {
      const originalEntry: MemoryCoreEntry = {
        id: 'integration-1',
        timestamp: new Date().toISOString(),
        speaker: 'user',
        content: 'Personal information',
        context: 'home address: 123 Main St, Springfield',
        searchableContent: 'personal information',
      };

      // Step 1: Encrypt sensitive fields
      const encrypted = await encryptSensitiveMemoryFields(originalEntry);
      expect(isHomomorphicallyEncrypted(encrypted.context!)).toBe(true);

      // Step 2: Search without decryption
      const searchResult = await searchEncryptedContext(encrypted, 'Springfield');
      expect(searchResult.matches).toBe(true);

      // Step 3: Decrypt for authorized access
      const decrypted = await decryptSensitiveMemoryFields(encrypted);
      expect(decrypted.context).toBe(originalEntry.context);
    });

    it('should preserve non-sensitive data while encrypting sensitive data', async () => {
      const entry: MemoryCoreEntry = {
        id: 'integration-2',
        timestamp: new Date().toISOString(),
        speaker: 'user',
        content: 'This content should not be encrypted',
        context: 'private medical notes',
        topics: ['health', 'personal'],
        emotionalTone: 'neutral',
        searchableContent: 'this content should not be encrypted',
      };

      const encrypted = await encryptSensitiveMemoryFields(entry);

      // Content and metadata should remain unchanged
      expect(encrypted.content).toBe(entry.content);
      expect(encrypted.topics).toEqual(entry.topics);
      expect(encrypted.emotionalTone).toBe(entry.emotionalTone);

      // Only context should be encrypted
      expect(isHomomorphicallyEncrypted(encrypted.context!)).toBe(true);
    });

    it('should handle multiple entries with mixed sensitivity', async () => {
      const entries: MemoryCoreEntry[] = [
        {
          id: 'multi-1',
          timestamp: new Date().toISOString(),
          speaker: 'user',
          content: 'Regular chat',
          context: 'general conversation',
          searchableContent: 'regular chat',
        },
        {
          id: 'multi-2',
          timestamp: new Date().toISOString(),
          speaker: 'user',
          content: 'Location data',
          context: 'user location: Portland',
          searchableContent: 'location data',
        },
        {
          id: 'multi-3',
          timestamp: new Date().toISOString(),
          speaker: 'user',
          content: 'Another regular chat',
          context: 'friendly discussion',
          searchableContent: 'another regular chat',
        },
      ];

      const processed = await Promise.all(entries.map(entry => encryptSensitiveMemoryFields(entry)));

      // First and third should not be encrypted
      expect(isHomomorphicallyEncrypted(processed[0].context!)).toBe(false);
      expect(isHomomorphicallyEncrypted(processed[2].context!)).toBe(false);

      // Second should be encrypted
      expect(isHomomorphicallyEncrypted(processed[1].context!)).toBe(true);
    });
  });
});
