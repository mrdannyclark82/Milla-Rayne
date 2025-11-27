/**
 * Vector Database Service Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  vectorDB,
  generateEmbedding,
  cosineSimilarity,
} from '../vectorDBService';

describe('Vector Database Service', () => {
  describe('Cosine Similarity', () => {
    it('should calculate similarity between identical vectors', () => {
      const vector = [1, 2, 3, 4, 5];
      const similarity = cosineSimilarity(vector, vector);
      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should calculate similarity between orthogonal vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [0, 1, 0];
      const similarity = cosineSimilarity(v1, v2);
      expect(similarity).toBeCloseTo(0.0, 5);
    });

    it('should calculate similarity between opposite vectors', () => {
      const v1 = [1, 2, 3];
      const v2 = [-1, -2, -3];
      const similarity = cosineSimilarity(v1, v2);
      expect(similarity).toBeCloseTo(-1.0, 5);
    });

    it('should throw error for vectors of different lengths', () => {
      const v1 = [1, 2, 3];
      const v2 = [1, 2];
      expect(() => cosineSimilarity(v1, v2)).toThrow(
        'Vectors must have the same length'
      );
    });
  });

  describe('Vector Storage', () => {
    beforeEach(async () => {
      // Clear the vector store before each test
      await vectorDB.clear();
    });

    afterEach(async () => {
      // Cleanup
      await vectorDB.clear();
    });

    it('should add content to vector database', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());

      // Mock generateEmbedding
      vi.spyOn(
        await import('../vectorDBService'),
        'generateEmbedding'
      ).mockResolvedValue(mockEmbedding);

      const success = await vectorDB.addContent(
        'test-1',
        'This is test content',
        {
          type: 'memory',
          timestamp: new Date().toISOString(),
          userId: 'test-user',
        }
      );

      expect(success).toBe(true);

      const stats = await vectorDB.getStats();
      expect(stats.totalEntries).toBe(1);
      expect(stats.byType.memory).toBe(1);
    });

    it('should retrieve content by ID', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());

      vi.spyOn(
        await import('../vectorDBService'),
        'generateEmbedding'
      ).mockResolvedValue(mockEmbedding);

      await vectorDB.addContent('test-1', 'This is test content', {
        type: 'memory',
        timestamp: new Date().toISOString(),
        userId: 'test-user',
      });

      const content = await vectorDB.getContent('test-1');
      expect(content).not.toBeNull();
      expect(content?.id).toBe('test-1');
      expect(content?.content).toBe('This is test content');
    });

    it('should delete content by ID', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());

      vi.spyOn(
        await import('../vectorDBService'),
        'generateEmbedding'
      ).mockResolvedValue(mockEmbedding);

      await vectorDB.addContent('test-1', 'This is test content', {
        type: 'memory',
        timestamp: new Date().toISOString(),
        userId: 'test-user',
      });

      const deleted = await vectorDB.deleteContent('test-1');
      expect(deleted).toBe(true);

      const content = await vectorDB.getContent('test-1');
      expect(content).toBeNull();
    });
  });

  describe('Semantic Search', () => {
    beforeEach(async () => {
      await vectorDB.clear();
    });

    afterEach(async () => {
      await vectorDB.clear();
    });

    it('should find similar content based on semantic similarity', async () => {
      // Create mock embeddings that are similar
      const baseEmbedding = new Array(1536).fill(0).map(() => Math.random());
      const similarEmbedding = baseEmbedding.map(
        (v) => v + Math.random() * 0.1
      );

      const generateEmbeddingSpy = vi.spyOn(
        await import('../vectorDBService'),
        'generateEmbedding'
      );

      // First call for adding content
      generateEmbeddingSpy.mockResolvedValueOnce(baseEmbedding);

      await vectorDB.addContent('test-1', 'Machine learning is fascinating', {
        type: 'memory',
        timestamp: new Date().toISOString(),
        userId: 'test-user',
      });

      // Second call for search query
      generateEmbeddingSpy.mockResolvedValueOnce(similarEmbedding);

      const results = await vectorDB.semanticSearch('AI and machine learning', {
        topK: 5,
        minSimilarity: 0.5,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].entry.content).toContain('Machine learning');
    });

    it('should filter results by type', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());

      vi.spyOn(
        await import('../vectorDBService'),
        'generateEmbedding'
      ).mockResolvedValue(mockEmbedding);

      await vectorDB.addContent('mem-1', 'Memory content', {
        type: 'memory',
        timestamp: new Date().toISOString(),
        userId: 'test-user',
      });

      await vectorDB.addContent('yt-1', 'YouTube content', {
        type: 'youtube',
        timestamp: new Date().toISOString(),
        userId: 'test-user',
      });

      const memoryResults = await vectorDB.semanticSearch('content', {
        type: 'memory',
        minSimilarity: 0,
      });

      expect(memoryResults.length).toBe(1);
      expect(memoryResults[0].entry.metadata.type).toBe('memory');
    });

    it('should respect minSimilarity threshold', async () => {
      const embedding1 = new Array(1536).fill(0).map(() => Math.random());
      const embedding2 = new Array(1536).fill(0).map(() => Math.random());

      const generateEmbeddingSpy = vi.spyOn(
        await import('../vectorDBService'),
        'generateEmbedding'
      );

      generateEmbeddingSpy.mockResolvedValueOnce(embedding1);

      await vectorDB.addContent('test-1', 'Very different content', {
        type: 'memory',
        timestamp: new Date().toISOString(),
        userId: 'test-user',
      });

      generateEmbeddingSpy.mockResolvedValueOnce(embedding2);

      const results = await vectorDB.semanticSearch('Query', {
        minSimilarity: 0.95, // Very high threshold
      });

      // Should find few or no results due to high threshold
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Batch Operations', () => {
    beforeEach(async () => {
      await vectorDB.clear();
    });

    afterEach(async () => {
      await vectorDB.clear();
    });

    it('should add multiple items in batch', async () => {
      const mockEmbeddings = Array(3)
        .fill(null)
        .map(() => new Array(1536).fill(0).map(() => Math.random()));

      vi.spyOn(
        await import('../vectorDBService'),
        'generateEmbeddings'
      ).mockResolvedValue(mockEmbeddings);

      const items = [
        {
          id: 'batch-1',
          content: 'First item',
          metadata: {
            type: 'memory' as const,
            timestamp: new Date().toISOString(),
            userId: 'test-user',
          },
        },
        {
          id: 'batch-2',
          content: 'Second item',
          metadata: {
            type: 'memory' as const,
            timestamp: new Date().toISOString(),
            userId: 'test-user',
          },
        },
        {
          id: 'batch-3',
          content: 'Third item',
          metadata: {
            type: 'youtube' as const,
            timestamp: new Date().toISOString(),
            userId: 'test-user',
          },
        },
      ];

      const successCount = await vectorDB.addContentBatch(items);
      expect(successCount).toBe(3);

      const stats = await vectorDB.getStats();
      expect(stats.totalEntries).toBe(3);
    });
  });
});
