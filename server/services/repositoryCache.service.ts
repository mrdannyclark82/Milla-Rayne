interface RepositoryCacheEntry {
  repoUrl: string;
  repoData: any;
  analysis: any | null;
  improvements?: any[];
  timestamp: number;
}

class RepositoryCacheService {
  private cache = new Map<string, RepositoryCacheEntry>();
  private readonly CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

  set(userId: string, entry: RepositoryCacheEntry) {
    this.cache.set(userId, entry);
  }

  get(userId: string): RepositoryCacheEntry | undefined {
    const entry = this.cache.get(userId);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.CACHE_EXPIRY_MS) {
      this.cache.delete(userId);
      return undefined;
    }

    return entry;
  }

  delete(userId: string) {
    this.cache.delete(userId);
  }

  clear() {
    this.cache.clear();
  }
}

export const repositoryCache = new RepositoryCacheService();
