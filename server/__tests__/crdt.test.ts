import { describe, it, expect, beforeEach } from 'vitest';
import { VectorClock, LWWRegister, ORSet, PNCounter, RGA } from '../lib/crdt';

describe('CRDT Library', () => {
  describe('VectorClock', () => {
    it('should increment correctly', () => {
      const vc = new VectorClock();
      vc.increment('A');
      expect(vc.toJSON()).toEqual({ _t: 'vc', clock: { A: 1 } });
      vc.increment('A');
      expect(vc.toJSON()).toEqual({ _t: 'vc', clock: { A: 2 } });
      vc.increment('B');
      expect(vc.toJSON()).toEqual({ _t: 'vc', clock: { A: 2, B: 1 } });
    });

    it('should merge correctly', () => {
      const vc1 = new VectorClock({ A: 1, B: 2 });
      const vc2 = new VectorClock({ A: 2, C: 1 });

      vc1.merge(vc2);
      expect(vc1.toJSON()).toEqual({ _t: 'vc', clock: { A: 2, B: 2, C: 1 } });
    });

    it('should compare correctly', () => {
      const vc1 = new VectorClock({ A: 1, B: 1 });
      const vc2 = new VectorClock({ A: 1, B: 2 });
      const vc3 = new VectorClock({ A: 2, B: 1 });
      const vc4 = new VectorClock({ A: 1, B: 1 });

      expect(vc1.compare(vc2)).toBe('less');
      expect(vc2.compare(vc1)).toBe('greater');
      expect(vc1.compare(vc4)).toBe('equal');
      expect(vc2.compare(vc3)).toBe('concurrent');
    });

    it('should deserialize correctly', () => {
      const json = { _t: 'vc', clock: { A: 1, B: 2 } };
      const vc = VectorClock.fromJSON(json);
      expect(vc.toJSON()).toEqual(json);
    });

    it('should deserialize legacy format correctly', () => {
      const json = { A: 1, B: 2 };
      const vc = VectorClock.fromJSON(json);
      expect(vc.toJSON()).toEqual({ _t: 'vc', clock: json });
    });
  });

  describe('LWWRegister', () => {
    it('should update with newer timestamp', () => {
      const reg = new LWWRegister('initial', 100, 'A');
      reg.set('newer', 200, 'A');
      expect(reg.value).toBe('newer');
    });

    it('should ignore older timestamp', () => {
      const reg = new LWWRegister('initial', 200, 'A');
      reg.set('older', 100, 'B');
      expect(reg.value).toBe('initial');
    });

    it('should use siteId as tie-breaker', () => {
      const reg = new LWWRegister('siteA', 100, 'A');
      reg.set('siteB', 100, 'B'); // B > A
      expect(reg.value).toBe('siteB');

      reg.set('siteA_again', 100, 'A'); // A < B
      expect(reg.value).toBe('siteB');
    });

    it('should serialize/deserialize correctly', () => {
      const reg = new LWWRegister('val', 100, 'A');
      const json = reg.toJSON();
      expect(json).toEqual({
        _t: 'lww',
        value: 'val',
        timestamp: 100,
        siteId: 'A',
      });
      const reg2 = LWWRegister.fromJSON(json);
      expect(reg2.value).toBe('val');
    });
  });

  describe('ORSet', () => {
    it('should add and remove elements', () => {
      const set = new ORSet<string>();
      set.add('item1');
      expect(set.has('item1')).toBe(true);

      set.remove('item1');
      expect(set.has('item1')).toBe(false);
    });

    it('should handle concurrent add/remove (Add Wins logic)', () => {
      const setA = new ORSet<string>();
      const setB = new ORSet<string>();

      setA.add('item1', 'tag1');
      setB.add('item1', 'tag2');

      // A removes item1 (clearing 'tag1')
      setA.remove('item1');
      expect(setA.has('item1')).toBe(false);

      // Merge B into A
      // B still has 'tag2' for 'item1'.
      // A has no tags for 'item1'.
      // Merge: Union of tags -> {tag2} -> item1 is present.
      setA.merge(setB);
      expect(setA.has('item1')).toBe(true);
    });

    it('should serialize/deserialize correctly', () => {
      const set = new ORSet<string>();
      set.add('item1', 'tag1');
      const json = set.toJSON();
      expect(json._t).toBe('orset');
      expect(json.elements['item1']).toContain('tag1');

      const set2 = ORSet.fromJSON<string>(json);
      expect(set2.has('item1')).toBe(true);
    });
  });

  describe('PNCounter', () => {
    it('should increment and decrement', () => {
      const counter = new PNCounter('A');
      counter.increment(5);
      counter.decrement(2);
      expect(counter.value).toBe(3);
    });

    it('should merge correctly', () => {
      const c1 = new PNCounter('A');
      c1.increment(10); // P:{A:10}

      const c2 = new PNCounter('B');
      c2.increment(5); // P:{B:5}
      c2.decrement(2); // N:{B:2}

      c1.merge(c2);
      expect(c1.value).toBe(10 + 5 - 2);
    });

    it('should serialize/deserialize correctly', () => {
      const c1 = new PNCounter('A');
      c1.increment(10);
      const json = c1.toJSON();
      expect(json._t).toBe('pnc');
      expect(json.p['A']).toBe(10);

      const c2 = PNCounter.fromJSON(json);
      expect(c2.value).toBe(10);
      expect(c2.id).toBe('A');
    });
  });

  describe('Merge Logic (Integration Mock)', () => {
    // Replicating the logic in SqliteStorage.mergeCRDT/shouldKeepRemoteValue
    function shouldKeepRemoteValue(localValue: any, remoteValue: any): boolean {
      if (localValue.vector_clock && remoteValue.vector_clock) {
        try {
          const localVC = VectorClock.fromJSON(
            JSON.parse(localValue.vector_clock)
          );
          const remoteVC = VectorClock.fromJSON(
            JSON.parse(remoteValue.vector_clock)
          );
          const comparison = localVC.compare(remoteVC);
          if (comparison === 'less') return true;
          if (comparison === 'greater') return false;
          if (comparison === 'equal') return false;
        } catch (e) {}
      }

      const localTimestamp = new Date(localValue.timestamp || 0).getTime();
      const remoteTimestamp = new Date(remoteValue.timestamp || 0).getTime();

      if (remoteTimestamp > localTimestamp) return true;
      if (remoteTimestamp < localTimestamp) return false;

      const localSiteId = localValue.site_id || '';
      const remoteSiteId = remoteValue.site_id || '';
      return remoteSiteId > localSiteId;
    }

    it('should prefer vector clock causality', () => {
      const vc1 = new VectorClock({ A: 1 });
      const vc2 = new VectorClock({ A: 2 }); // Newer

      const local = {
        vector_clock: JSON.stringify(vc1.toJSON()),
        content: 'old',
      };
      const remote = {
        vector_clock: JSON.stringify(vc2.toJSON()),
        content: 'new',
      };

      expect(shouldKeepRemoteValue(local, remote)).toBe(true);
      expect(shouldKeepRemoteValue(remote, local)).toBe(false);
    });

    it('should fall back to LWW if vector clocks missing', () => {
      const local = { timestamp: '2023-01-01T12:00:00Z', content: 'old' };
      const remote = { timestamp: '2023-01-02T12:00:00Z', content: 'new' };

      expect(shouldKeepRemoteValue(local, remote)).toBe(true);
    });

    it('should use siteId tie-breaker', () => {
      const time = '2023-01-01T12:00:00Z';
      const local = { timestamp: time, site_id: 'A', content: 'valA' };
      const remote = { timestamp: time, site_id: 'B', content: 'valB' };

      // B > A, so remote wins
      expect(shouldKeepRemoteValue(local, remote)).toBe(true);

      // Reverse: A < B, local (B) wins against remote (A) -> shouldKeepRemote = false
      expect(shouldKeepRemoteValue(remote, local)).toBe(false);
    });

    it('should handle concurrent vector clocks via LWW', () => {
      const vcA = new VectorClock({ A: 1, B: 0 });
      const vcB = new VectorClock({ A: 0, B: 1 }); // Concurrent

      const local = {
        vector_clock: JSON.stringify(vcA.toJSON()),
        timestamp: '2023-01-01T10:00:00Z',
        site_id: 'A',
      };
      const remote = {
        vector_clock: JSON.stringify(vcB.toJSON()),
        timestamp: '2023-01-01T11:00:00Z', // Newer physical time
        site_id: 'B',
      };

      // Comparison is 'concurrent', so it falls through to LWW
      // Remote is newer, so it should be kept
      expect(shouldKeepRemoteValue(local, remote)).toBe(true);
    });
  });
});
