import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SqliteStorage } from '../sqliteStorage';
import { VectorClock, PNCounter, ORSet, LWWRegister } from '../lib/crdt';

// Mock config to avoid loading real config which might require env vars
vi.mock('../config', () => ({
  config: {
    stripe: { secretKey: 'mock-key' },
    google: { clientId: 'mock', clientSecret: 'mock' },
    ai: { geminiKey: 'mock' },
  },
}));

describe('SqliteStorage CRDT Merge', () => {
  let storage: SqliteStorage;
  // Use in-memory DB
  const dbPath = ':memory:';

  beforeEach(() => {
    storage = new SqliteStorage(dbPath);
  });

  afterEach(() => {
    storage.close();
  });

  it('should merge VectorClocks correctly', () => {
    const localVC = new VectorClock({ A: 1, B: 2 });
    const remoteVC = new VectorClock({ A: 2, C: 1 });

    const localData = {
      clock1: localVC.toJSON(),
    };
    const remoteData = {
      clock1: remoteVC.toJSON(),
    };

    const merged = storage.mergeCRDT(localData, remoteData);

    expect(merged.clock1._t).toBe('vc');
    expect(merged.clock1.clock).toEqual({ A: 2, B: 2, C: 1 });
  });

  it('should merge PNCounters correctly', () => {
    const localCounter = new PNCounter('A');
    localCounter.increment(10);

    const remoteCounter = new PNCounter('B');
    remoteCounter.increment(5);
    remoteCounter.decrement(2);

    const localData = { cnt: localCounter.toJSON() };
    const remoteData = { cnt: remoteCounter.toJSON() };

    const merged = storage.mergeCRDT(localData, remoteData);
    const mergedCounter = PNCounter.fromJSON(merged.cnt);

    expect(mergedCounter.value).toBe(13); // 10 + 5 - 2
  });

  it('should merge ORSets correctly', () => {
    const localSet = new ORSet<string>();
    localSet.add('A');

    const remoteSet = new ORSet<string>();
    remoteSet.add('B');

    const localData = { set: localSet.toJSON() };
    const remoteData = { set: remoteSet.toJSON() };

    const merged = storage.mergeCRDT(localData, remoteData);
    const mergedSet = ORSet.fromJSON<string>(merged.set);

    expect(mergedSet.has('A')).toBe(true);
    expect(mergedSet.has('B')).toBe(true);
  });

  it('should fallback to LWW for plain objects', () => {
    const local = {
      id: 'doc1',
      content: 'old',
      timestamp: 100,
      site_id: 'A',
    };
    const remote = {
      id: 'doc1',
      content: 'new',
      timestamp: 200,
      site_id: 'B',
    };

    const merged = storage.mergeCRDT({ doc1: local }, { doc1: remote });
    expect(merged.doc1.content).toBe('new');
  });

  it('should use vector clocks in plain objects for LWW decision', () => {
    const vc1 = new VectorClock({ A: 1 });
    const vc2 = new VectorClock({ A: 2 });

    const local = {
      id: 'doc1',
      vector_clock: vc1.toJSON(),
      content: 'old',
    };
    const remote = {
      id: 'doc1',
      vector_clock: vc2.toJSON(),
      content: 'new',
    };

    const merged = storage.mergeCRDT({ doc1: local }, { doc1: remote });
    expect(merged.doc1.content).toBe('new');
  });

  it('should handle new entries from remote', () => {
    const localData = {};
    const remoteData = {
      newKey: { val: 1 },
    };
    const merged = storage.mergeCRDT(localData, remoteData);
    expect(merged.newKey).toEqual({ val: 1 });
  });

  it('should handle missing local entries (implicit in new entries)', () => {
    // Covered by above
  });
});
