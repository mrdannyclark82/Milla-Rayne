/**
 * Conflict-free Replicated Data Types (CRDTs) Library
 *
 * Implements standard CRDTs for distributed system synchronization:
 * - VectorClock: For causality tracking
 * - LWWRegister: Last-Write-Wins Register
 * - ORSet: Observed-Remove Set
 * - PNCounter: Positive-Negative Counter
 * - RGA: Replicated Growable Array (for ordered lists)
 */

import { randomUUID } from 'crypto';

export type SiteId = string;
export type Timestamp = number;

/**
 * Vector Clock for tracking causality in distributed systems
 */
export class VectorClock {
  clock: Map<SiteId, number>;

  constructor(init: Record<SiteId, number> = {}) {
    this.clock = new Map(Object.entries(init));
  }

  increment(siteId: SiteId): void {
    const current = this.clock.get(siteId) || 0;
    this.clock.set(siteId, current + 1);
  }

  merge(other: VectorClock): void {
    for (const [site, counter] of other.clock.entries()) {
      const local = this.clock.get(site) || 0;
      this.clock.set(site, Math.max(local, counter));
    }
  }

  compare(other: VectorClock): 'less' | 'greater' | 'equal' | 'concurrent' {
    let hasLess = false;
    let hasGreater = false;

    const allSites = new Set([...this.clock.keys(), ...other.clock.keys()]);

    for (const site of allSites) {
      const local = this.clock.get(site) || 0;
      const remote = other.clock.get(site) || 0;

      if (local < remote) hasLess = true;
      if (local > remote) hasGreater = true;
    }

    if (hasLess && hasGreater) return 'concurrent';
    if (hasLess) return 'less';
    if (hasGreater) return 'greater';
    return 'equal';
  }

  toJSON(): any {
    return {
      _t: 'vc',
      clock: Object.fromEntries(this.clock),
    };
  }

  static fromJSON(json: any): VectorClock {
    if (json._t && json._t !== 'vc') {
      throw new Error(`Invalid type for VectorClock: ${json._t}`);
    }
    // Handle both legacy (plain object) and new (wrapped) format
    const clockData = json._t === 'vc' ? json.clock : json;
    return new VectorClock(clockData);
  }

  toString(): string {
    return JSON.stringify(this.toJSON());
  }
}

/**
 * Last-Write-Wins Register
 * Resolves conflicts by wall-clock time (or logical timestamp)
 */
export class LWWRegister<T> {
  value: T;
  timestamp: Timestamp;
  siteId: SiteId;

  constructor(value: T, timestamp: Timestamp, siteId: SiteId) {
    this.value = value;
    this.timestamp = timestamp;
    this.siteId = siteId;
  }

  set(value: T, timestamp: Timestamp, siteId: SiteId): void {
    // Only update if the new timestamp is greater, or equal with higher siteId (tie-breaker)
    if (
      timestamp > this.timestamp ||
      (timestamp === this.timestamp && siteId > this.siteId)
    ) {
      this.value = value;
      this.timestamp = timestamp;
      this.siteId = siteId;
    }
  }

  merge(other: LWWRegister<T>): void {
    this.set(other.value, other.timestamp, other.siteId);
  }

  toJSON(): any {
    return {
      _t: 'lww',
      value: this.value,
      timestamp: this.timestamp,
      siteId: this.siteId,
    };
  }

  static fromJSON<T>(json: any): LWWRegister<T> {
    if (json._t && json._t !== 'lww') {
      throw new Error(`Invalid type for LWWRegister: ${json._t}`);
    }
    return new LWWRegister<T>(json.value, json.timestamp, json.siteId);
  }
}

/**
 * Observed-Remove Set (Add-Wins Set)
 * Allows adding and removing elements concurrently.
 */
export class ORSet<T> {
  // Elements are stored as a map of Element -> Set of unique tags (UUIDs)
  // Presence of tags implies the element is in the set.
  elements: Map<T, Set<string>>;

  constructor() {
    this.elements = new Map();
  }

  add(element: T, tag: string = randomUUID()): void {
    if (!this.elements.has(element)) {
      this.elements.set(element, new Set());
    }
    this.elements.get(element)!.add(tag);
  }

  remove(element: T, tagsToRemove?: Set<string>): void {
    if (!this.elements.has(element)) return;

    if (tagsToRemove) {
      // Remove specific instances (observed at start of remove op)
      const currentTags = this.elements.get(element)!;
      for (const tag of tagsToRemove) {
        currentTags.delete(tag);
      }
      if (currentTags.size === 0) {
        this.elements.delete(element);
      }
    } else {
      // Clear all (local remove)
      this.elements.delete(element);
    }
  }

  has(element: T): boolean {
    return this.elements.has(element) && this.elements.get(element)!.size > 0;
  }

  values(): T[] {
    return Array.from(this.elements.keys());
  }

  merge(other: ORSet<T>): void {
    for (const [elem, remoteTags] of other.elements.entries()) {
      if (!this.elements.has(elem)) {
        this.elements.set(elem, new Set());
      }
      const localTags = this.elements.get(elem)!;
      for (const tag of remoteTags) {
        localTags.add(tag);
      }
    }
  }

  toJSON(): any {
    const elementsObj: any = {};
    for (const [k, v] of this.elements.entries()) {
      elementsObj[String(k)] = Array.from(v);
    }
    return {
      _t: 'orset',
      elements: elementsObj,
    };
  }

  static fromJSON<T>(json: any): ORSet<T> {
    if (json._t && json._t !== 'orset') {
      throw new Error(`Invalid type for ORSet: ${json._t}`);
    }
    const set = new ORSet<T>();
    const elements = json.elements || {};
    for (const [key, tags] of Object.entries(elements)) {
      // Note: key is always string here. If T is not string, this might be an issue.
      // We assume T is castable from string or is string.
      set.elements.set(key as unknown as T, new Set(tags as string[]));
    }
    return set;
  }
}

/**
 * Positive-Negative Counter
 * Supports increment and decrement
 */
export class PNCounter {
  id: SiteId;
  p: Map<SiteId, number>; // Positive increments
  n: Map<SiteId, number>; // Negative increments (decrements)

  constructor(id: SiteId) {
    this.id = id;
    this.p = new Map();
    this.n = new Map();
  }

  increment(amount: number = 1): void {
    const current = this.p.get(this.id) || 0;
    this.p.set(this.id, current + amount);
  }

  decrement(amount: number = 1): void {
    const current = this.n.get(this.id) || 0;
    this.n.set(this.id, current + amount);
  }

  get value(): number {
    let sumP = 0;
    let sumN = 0;
    for (const val of this.p.values()) sumP += val;
    for (const val of this.n.values()) sumN += val;
    return sumP - sumN;
  }

  merge(other: PNCounter): void {
    // Merge P: max(local, remote) for each site
    for (const [site, val] of other.p.entries()) {
      const local = this.p.get(site) || 0;
      this.p.set(site, Math.max(local, val));
    }
    // Merge N: max(local, remote) for each site
    for (const [site, val] of other.n.entries()) {
      const local = this.n.get(site) || 0;
      this.n.set(site, Math.max(local, val));
    }
  }

  toJSON(): any {
    return {
      _t: 'pnc',
      id: this.id,
      p: Object.fromEntries(this.p),
      n: Object.fromEntries(this.n),
    };
  }

  static fromJSON(json: any): PNCounter {
    if (json._t && json._t !== 'pnc') {
      throw new Error(`Invalid type for PNCounter: ${json._t}`);
    }
    const counter = new PNCounter(json.id);
    counter.p = new Map(Object.entries(json.p || {}));
    counter.n = new Map(Object.entries(json.n || {}));
    return counter;
  }
}

/**
 * Replicated Growable Array (RGA) node
 */
interface RGANode<T> {
  value: T;
  id: string; // timestamp + siteId
  timestamp: Timestamp;
  siteId: SiteId;
  next: string | null; // ID of next node
  deleted: boolean;
}

/**
 * Replicated Growable Array (RGA)
 * Ordered list preserving causality
 */
export class RGA<T> {
  siteId: SiteId;
  nodes: Map<string, RGANode<T>>;
  head: string | null; // Anchor (start)

  constructor(siteId: SiteId) {
    this.siteId = siteId;
    this.nodes = new Map();
    this.head = null;
  }

  // Generate unique ID
  private genId(timestamp: number): string {
    return `${timestamp}-${this.siteId}-${randomUUID()}`;
  }

  insertAfter(targetId: string | null, value: T): string {
    const timestamp = Date.now();
    const newId = this.genId(timestamp);

    const newNode: RGANode<T> = {
      value,
      id: newId,
      timestamp,
      siteId: this.siteId,
      next: null,
      deleted: false,
    };

    if (targetId === null) {
      newNode.next = this.head;
      this.head = newId;
    } else {
      const target = this.nodes.get(targetId);
      if (!target) throw new Error('Target node not found');
      newNode.next = target.next;
      target.next = newId;
    }

    this.nodes.set(newId, newNode);
    return newId;
  }

  remove(id: string): void {
    const node = this.nodes.get(id);
    if (node) {
      node.deleted = true;
    }
  }

  getValues(): T[] {
    const result: T[] = [];
    let currentId = this.head;
    while (currentId) {
      const node = this.nodes.get(currentId);
      if (node) {
        if (!node.deleted) {
          result.push(node.value);
        }
        currentId = node.next;
      } else {
        break;
      }
    }
    return result;
  }

  merge(other: RGA<T>): void {
    for (const [id, node] of other.nodes) {
      if (!this.nodes.has(id)) {
        // Basic merge: just add missing nodes.
        // NOTE: This does NOT correctly place them in order if we don't have the predecessors.
        // This is a simplified stub.
        this.nodes.set(id, { ...node });
      } else {
        const localNode = this.nodes.get(id)!;
        if (node.deleted && !localNode.deleted) {
          localNode.deleted = true;
        }
      }
    }
    // Simple head merge (LWW on head if conflict? or just keep local?)
    // This is insufficient for real RGA but sufficient for stub.
  }

  toJSON(): any {
    return {
      _t: 'rga',
      siteId: this.siteId,
      head: this.head,
      nodes: Object.fromEntries(this.nodes),
    };
  }

  static fromJSON<T>(json: any): RGA<T> {
    if (json._t && json._t !== 'rga') {
      throw new Error(`Invalid type for RGA: ${json._t}`);
    }
    const rga = new RGA<T>(json.siteId);
    rga.head = json.head;
    rga.nodes = new Map(Object.entries(json.nodes || {}));
    return rga;
  }
}
