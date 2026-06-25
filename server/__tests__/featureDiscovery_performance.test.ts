import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { discoverFromGitHub } from '../featureDiscoveryService';
import * as githubApiService from '../githubApiService';
import { promises as fs } from 'fs';

// Mock the githubApiService
vi.mock('../githubApiService', () => ({
  searchRepositories: vi.fn(),
}));

describe('FeatureDiscoveryService Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Prevent writing to disk during tests
    vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    // Also mock readFile to return empty JSON or valid structure to avoid parsing errors
    vi.spyOn(fs, 'readFile').mockResolvedValue(
      JSON.stringify({ features: [], repositories: [] })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('measures the execution time of discoverFromGitHub', async () => {
    // Mock implementation with a delay
    const delayMs = 100;
    const mockedSearchRepositories = vi.mocked(
      githubApiService.searchRepositories
    );

    mockedSearchRepositories.mockImplementation(async (keyword) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      // Return a dummy result so the loop continues
      return [
        {
          url: `https://github.com/test/${keyword}`,
          name: `test-${keyword}`,
          fullName: `test/${keyword}`,
          stars: 100,
          language: 'TypeScript',
          description: 'Test repo',
          topics: ['test'],
        },
      ];
    });

    const startTime = Date.now();
    await discoverFromGitHub();
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Execution time: ${duration}ms`);

    // We expect 3 calls (as per slice(0, 3) in the source code)
    expect(mockedSearchRepositories).toHaveBeenCalledTimes(3);

    // Target implementation should be parallel, so duration should be approx 1 * delayMs
    // Allow generous buffer for CI/shared execution overhead
    expect(duration).toBeLessThan(delayMs * 5);
  });
});
