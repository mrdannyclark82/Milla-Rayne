import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMemoriesFromTxt, getKnowledgeFromCsv, updateMemories } from '../memoryService';
import { promises as fs } from 'fs';
import { join } from 'path';

// Mock the 'fs' module with an inline factory to avoid hoisting issues.
// This ensures the mock is fully defined before any imports that might use it.
vi.mock('fs', () => {
  const fsPromisesMock = {
    access: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  };
  return {
    promises: fsPromisesMock,
    default: {
      promises: fsPromisesMock,
    }
  };
});

describe('Memory Service', () => {
  // We need to refer to the mocked fs.promises, not the original.
  // Vitest's mocking wraps the module, so we can get the mock this way.
  let fsPromisesMock: {
    access: vi.fn,
    readFile: vi.fn,
    writeFile: vi.fn,
  };

  beforeEach(async () => {
    // Dynamically import the mocked fs to get the mock functions
    const fsMock = await import('fs');
    fsPromisesMock = fsMock.promises;
    // Reset mocks before each test
    fsPromisesMock.access.mockReset();
    fsPromisesMock.readFile.mockReset();
    fsPromisesMock.writeFile.mockReset();
  });

  describe('getMemoriesFromTxt', () => {
    it('should return memories from the txt file', async () => {
      const mockMemories = 'This is a memory.';
      fsPromisesMock.access.mockResolvedValue(undefined as void);
      fsPromisesMock.readFile.mockResolvedValue(mockMemories);

      const result = await getMemoriesFromTxt();

      const memoryPath = join(process.cwd(), 'memory', 'memories.txt');
      expect(fsPromisesMock.access).toHaveBeenCalledWith(memoryPath);
      expect(fsPromisesMock.readFile).toHaveBeenCalledWith(memoryPath, 'utf-8');
      expect(result.success).toBe(true);
      expect(result.content).toBe(mockMemories);
    });

    it('should return an error if the memory file is not found', async () => {
      fsPromisesMock.access.mockRejectedValue(new Error('File not found'));

      const result = await getMemoriesFromTxt();

      const memoryPath = join(process.cwd(), 'memory', 'memories.txt');
      expect(fsPromisesMock.access).toHaveBeenCalledWith(memoryPath);
      expect(fsPromisesMock.readFile).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Memory file not found');
    });
  });

  describe('getKnowledgeFromCsv', () => {
    it('should return knowledge from the csv file', async () => {
      const mockKnowledgeCsv = 'This is a fact about Danny Ray.';
      fsPromisesMock.access.mockResolvedValue(undefined as void);
      fsPromisesMock.readFile.mockResolvedValue(mockKnowledgeCsv);

      const result = await getKnowledgeFromCsv();

      const knowledgePath = join(process.cwd(), 'memory', 'knowledge.csv');
      expect(fsPromisesMock.access).toHaveBeenCalledWith(knowledgePath);
      expect(fsPromisesMock.readFile).toHaveBeenCalledWith(knowledgePath, 'utf-8');
      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].details).toBe('This is a fact about Danny Ray.');
    });

    it('should return an error if the knowledge file is not found', async () => {
        const knowledgePath = join(process.cwd(), 'memory', 'knowledge.csv');
        fsPromisesMock.access.mockRejectedValue(new Error('File not found'));

        const result = await getKnowledgeFromCsv();

        expect(fsPromisesMock.access).toHaveBeenCalledWith(knowledgePath);
        expect(fsPromisesMock.readFile).not.toHaveBeenCalled();
        expect(result.success).toBe(false);
        expect(result.error).toBe('Knowledge file not found');
      });
  });

import { loadMemoryCore, searchMemoryCore } from '../memoryService';
  describe('updateMemories', () => {
    it('should append new memory to the file', async () => {
      const initialMemories = 'Initial memory line.';
      const newMemory = 'This is a new memory.';
      const memoryPath = join(process.cwd(), 'memory', 'memories.txt');
      const timestamp = new Date().toISOString().split('T')[0];
      const expectedContent = `${initialMemories}\n\n[${timestamp}] ${newMemory}`;

      fsPromisesMock.readFile.mockResolvedValue(initialMemories);
      fsPromisesMock.writeFile.mockResolvedValue(undefined as void);

      const result = await updateMemories(newMemory);

      expect(fsPromisesMock.readFile).toHaveBeenCalledWith(memoryPath, 'utf-8');
      expect(fsPromisesMock.writeFile).toHaveBeenCalledWith(memoryPath, expectedContent, 'utf-8');
      expect(result.success).toBe(true);
    });

    it('should create a new file if it does not exist', async () => {
        const newMemory = 'This is a new memory.';
        const memoryPath = join(process.cwd(), 'memory', 'memories.txt');
        const timestamp = new Date().toISOString().split('T')[0];
        const expectedContent = `\n\n[${timestamp}] ${newMemory}`;

        // Simulate file not found on read
        fsPromisesMock.readFile.mockRejectedValue({ code: 'ENOENT' });
        fsPromisesMock.writeFile.mockResolvedValue(undefined as void);

        const result = await updateMemories(newMemory);

        expect(fsPromisesMock.readFile).toHaveBeenCalledWith(memoryPath, 'utf-8');
        expect(fsPromisesMock.writeFile).toHaveBeenCalledWith(memoryPath, expectedContent, 'utf-8');
        expect(result.success).toBe(true);
    });
  });

  describe('loadMemoryCore', () => {
    it('should load memories from memories.txt and knowledge.csv', async () => {
      const mockMemories = 'memory one\nmemory two';
      const mockKnowledge = 'knowledge one\nknowledge two';
      fsPromisesMock.access.mockResolvedValue(undefined as void);
      fsPromisesMock.readFile.mockImplementation((path) => {
        if (path.toString().includes('memories.txt')) {
          return Promise.resolve(mockMemories);
        }
        if (path.toString().includes('knowledge.csv')) {
          return Promise.resolve(mockKnowledge);
        }
        return Promise.reject(new Error('File not found'));
      });

      const result = await loadMemoryCore();
      expect(result.success).toBe(true);
      expect(result.entries.length).toBe(4);
      expect(result.entries[0].content).toBe('memory one');
      expect(result.entries[2].content).toBe('knowledge one');
    });
  });

  describe('searchMemoryCore', () => {
    it('should return relevant search results', async () => {
      const mockMemories = 'the quick brown fox';
      const mockKnowledge = 'jumps over the lazy dog';
      fsPromisesMock.access.mockResolvedValue(undefined as void);
      fsPromisesMock.readFile.mockImplementation((path) => {
        if (path.toString().includes('memories.txt')) {
          return Promise.resolve(mockMemories);
        }
        if (path.toString().includes('knowledge.csv')) {
          return Promise.resolve(mockKnowledge);
        }
        return Promise.reject(new Error('File not found'));
      });

      const results = await searchMemoryCore('fox');
      expect(results.length).toBe(1);
      expect(results[0].entry.content).toBe('the quick brown fox');
    });
  });
});