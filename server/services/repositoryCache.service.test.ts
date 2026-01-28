import { describe, it, expect, beforeEach, vi } from 'vitest';
import { repositoryCache } from './repositoryCache.service';

describe('Repository Cache Service', () => {
  beforeEach(() => {
    repositoryCache.clear();
  });

  it('should store and retrieve data', () => {
    const userId = 'user-1';
    const data = {
      repoUrl: 'https://github.com/test/repo',
      repoData: { some: 'data' },
      analysis: { some: 'analysis' },
      timestamp: Date.now(),
    };

    repositoryCache.set(userId, data);
    const retrieved = repositoryCache.get(userId);

    expect(retrieved).toEqual(data);
  });

  it('should return undefined for expired data', () => {
    const userId = 'user-1';
    const data = {
      repoUrl: 'https://github.com/test/repo',
      repoData: {},
      analysis: {},
      timestamp: Date.now() - (31 * 60 * 1000), // 31 minutes ago
    };

    repositoryCache.set(userId, data);
    const retrieved = repositoryCache.get(userId);

    expect(retrieved).toBeUndefined();
  });

  it('should return undefined if not found', () => {
    const retrieved = repositoryCache.get('non-existent');
    expect(retrieved).toBeUndefined();
  });

  it('should delete data', () => {
    const userId = 'user-1';
    const data = {
      repoUrl: 'url',
      repoData: {},
      analysis: {},
      timestamp: Date.now(),
    };

    repositoryCache.set(userId, data);
    repositoryCache.delete(userId);
    
    expect(repositoryCache.get(userId)).toBeUndefined();
  });
});
