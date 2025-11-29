/**
 * API Resilience Module
 * Provides caching, circuit breaking, and rate limiting for API calls
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

interface RateLimitState {
  requests: number[];
  limit: number;
  window: number; // in milliseconds
}

/**
 * Simple in-memory cache with TTL support
 */
class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 1000;

  set<T>(key: string, data: T, ttl: number = 300000): void {
    // Clear old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by failing fast when service is unhealthy
 */
class CircuitBreaker {
  private states: Map<string, CircuitBreakerState> = new Map();
  private threshold: number = 5; // Open circuit after 5 failures
  private timeout: number = 60000; // 60 seconds
  private halfOpenRequests: number = 3; // Allow 3 requests in half-open state

  private getState(service: string): CircuitBreakerState {
    if (!this.states.has(service)) {
      this.states.set(service, {
        failures: 0,
        lastFailureTime: 0,
        state: 'CLOSED',
      });
    }
    return this.states.get(service)!;
  }

  async execute<T>(
    service: string,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const state = this.getState(service);

    // Check if circuit is open
    if (state.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - state.lastFailureTime;
      if (timeSinceLastFailure < this.timeout) {
        console.warn(`⚡ Circuit breaker OPEN for ${service}, failing fast`);
        if (fallback) {
          return fallback();
        }
        throw new Error(`Circuit breaker is OPEN for service: ${service}`);
      } else {
        // Try to move to half-open
        state.state = 'HALF_OPEN';
        console.log(`⚡ Circuit breaker moving to HALF_OPEN for ${service}`);
      }
    }

    try {
      const result = await fn();

      // Success - reset circuit breaker
      if (state.state === 'HALF_OPEN' || state.failures > 0) {
        console.log(`✅ Circuit breaker CLOSED for ${service}`);
      }
      state.failures = 0;
      state.state = 'CLOSED';
      return result;
    } catch (error) {
      // Failure - increment counter
      state.failures++;
      state.lastFailureTime = Date.now();

      console.error(
        `❌ Circuit breaker failure ${state.failures}/${this.threshold} for ${service}`
      );

      // Open circuit if threshold reached
      if (state.failures >= this.threshold) {
        state.state = 'OPEN';
        console.error(`🚨 Circuit breaker OPENED for ${service}`);
      }

      if (fallback) {
        return fallback();
      }
      throw error;
    }
  }

  getStatus(): Record<string, CircuitBreakerState> {
    const status: Record<string, CircuitBreakerState> = {};
    this.states.forEach((state, service) => {
      status[service] = { ...state };
    });
    return status;
  }

  reset(service?: string): void {
    if (service) {
      this.states.delete(service);
    } else {
      this.states.clear();
    }
  }

  // Mock function for testing - simulates failures
  simulateFailure(shouldFail: boolean = false): void {
    if (shouldFail || Math.random() < 0.02) {
      // 2% failure rate
      throw new Error('Simulated API failure for testing');
    }
  }
}

/**
 * Rate Limiter Implementation
 * Prevents overwhelming external services with too many requests
 */
class RateLimiter {
  private limiters: Map<string, RateLimitState> = new Map();

  private getState(
    service: string,
    limit: number,
    window: number
  ): RateLimitState {
    if (!this.limiters.has(service)) {
      this.limiters.set(service, {
        requests: [],
        limit,
        window,
      });
    }
    return this.limiters.get(service)!;
  }

  async execute<T>(
    service: string,
    fn: () => Promise<T>,
    limit: number = 10,
    window: number = 1000 // 1 second
  ): Promise<T> {
    const state = this.getState(service, limit, window);
    const now = Date.now();

    // Remove old requests outside the window
    state.requests = state.requests.filter((time) => now - time < state.window);

    // Check if rate limit exceeded
    if (state.requests.length >= state.limit) {
      const oldestRequest = Math.min(...state.requests);
      const waitTime = state.window - (now - oldestRequest);
      console.warn(
        `⏱️  Rate limit reached for ${service}, waiting ${waitTime}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.execute(service, fn, limit, window);
    }

    // Record this request
    state.requests.push(now);

    // Execute the function
    return fn();
  }

  getStatus(): Record<
    string,
    { current: number; limit: number; window: number }
  > {
    const status: Record<string, any> = {};
    const now = Date.now();

    this.limiters.forEach((state, service) => {
      const activeRequests = state.requests.filter(
        (time) => now - time < state.window
      );
      status[service] = {
        current: activeRequests.length,
        limit: state.limit,
        window: state.window,
      };
    });

    return status;
  }
}

// Export singleton instances
export const apiCache = new SimpleCache();
export const circuitBreaker = new CircuitBreaker();
export const rateLimiter = new RateLimiter();

/**
 * Helper function to wrap API calls with resilience patterns
 */
export async function resilientAPICall<T>(
  service: string,
  fn: () => Promise<T>,
  options: {
    cacheKey?: string;
    cacheTTL?: number;
    rateLimit?: { limit: number; window: number };
    fallback?: () => Promise<T>;
  } = {}
): Promise<T> {
  // Check cache first
  if (options.cacheKey && apiCache.has(options.cacheKey)) {
    console.log(`💾 Cache HIT for ${service}`);
    return apiCache.get<T>(options.cacheKey)!;
  }

  // Wrap with rate limiter
  const rateLimitedFn = options.rateLimit
    ? () =>
        rateLimiter.execute(
          service,
          fn,
          options.rateLimit!.limit,
          options.rateLimit!.window
        )
    : fn;

  // Wrap with circuit breaker
  const result = await circuitBreaker.execute(
    service,
    rateLimitedFn,
    options.fallback
  );

  // Cache the result
  if (options.cacheKey) {
    apiCache.set(options.cacheKey, result, options.cacheTTL);
  }

  return result;
}
