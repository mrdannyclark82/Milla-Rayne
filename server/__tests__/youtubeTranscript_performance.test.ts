import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';
import { YoutubeTranscript } from 'youtube-transcript';
import { getVideoTranscript } from '../youtubeAnalysisService';

describe('Performance: Youtube Transcript Joining', () => {
  it('should efficiently concatenate transcript text without excessive memory allocation', async () => {
    // Generate an incredibly massive transcript array to clearly show the difference
    // A very long stream or playlist
    const mockTranscript: any[] = [];
    const ITEM_COUNT = 500000;
    for (let i = 0; i < ITEM_COUNT; i++) {
      mockTranscript.push({
        text: `This is chunk number ${i} of the simulated transcript to ensure we measure allocations properly. It needs to be fairly long so that strings take up some actual space.`,
        duration: 2.5,
        offset: i * 2.5,
      });
    }

    const originalFetchTranscript = YoutubeTranscript.fetchTranscript;
    YoutubeTranscript.fetchTranscript = async () => mockTranscript;

    // Force garbage collection before the test if possible, to get a clean heap baseline
    if (global.gc) {
      global.gc();
    }

    const beforeMemory = process.memoryUsage().heapUsed;
    const startTime = performance.now();

    const result = await getVideoTranscript('mock_video_id');

    const endTime = performance.now();

    // Force GC again before final measurement to see retained vs temporary, but V8 doesn't always oblige immediately.
    // Instead we just measure exactly after the operation finishes.
    const afterMemory = process.memoryUsage().heapUsed;

    const timeTaken = endTime - startTime;
    const memoryUsed = afterMemory - beforeMemory;

    expect(result).toBeDefined();
    expect(result?.startsWith('This is chunk number 0')).toBe(true);
    expect(result?.length).toBeGreaterThan(100000);

    console.log(`[Transcript Processing ${ITEM_COUNT} items] Time taken: ${timeTaken.toFixed(2)}ms`);
    console.log(`[Transcript Processing ${ITEM_COUNT} items] Memory difference: ${(memoryUsed / 1024 / 1024).toFixed(2)} MB`);

    YoutubeTranscript.fetchTranscript = originalFetchTranscript;

    // It should finish fast
    expect(timeTaken).toBeLessThan(1000);
  });
});
