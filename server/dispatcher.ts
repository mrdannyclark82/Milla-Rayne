/**
 * Enhanced AI Dispatcher
 * Intelligent routing with fallback chain, health monitoring, and caching
 * Supports multiple AI providers with automatic failover
 */

interface DispatcherConfig {
  fallbackChain: string[];
  enableCache: boolean;
  healthCheckInterval: number;
}

interface ModelHealth {
  available: boolean;
  lastCheck: number;
  failureCount: number;
import { OpenRouter } from 'openrouter'; // Assume existing import
import { agenticDispatch } from './agentic-dispatch';

// Placeholder for local Gemma inference - implement based on actual local model setup
async function localGemmaInference(query: string): Promise<string> {
  // TODO: Implement local Gemma inference using Ollama or similar
  throw new Error('Local Gemma inference not yet implemented');
}

class Dispatcher {
  private models: string[];
  private modelHealth: Map<string, ModelHealth> = new Map();
  private cache: Map<string, any> = new Map();
  private config: DispatcherConfig;

  constructor(config?: Partial<DispatcherConfig>) {
    this.models = [
      'gemini-flash',
      'gemini-pro', 
      'grok-4',
      'mistral',
      'gemma-local'
    ];

    this.config = {
      fallbackChain: this.models,
      enableCache: true,
      healthCheckInterval: 60000, // 1 minute
      ...config,
    };

    // Initialize health tracking
    this.models.forEach(model => {
      this.modelHealth.set(model, {
        available: true,
        lastCheck: Date.now(),
        failureCount: 0,
      });
    });

    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Dispatch query to available models with intelligent fallback
   */
  async dispatch(query: string): Promise<string> {
    // Check cache first
    if (this.config.enableCache) {
      const cached = this.cache.get(query);
      if (cached) {
        console.log('[Dispatcher] Cache hit');
        return cached;
      }
    }

    // Try models in order of health and availability
    const sortedModels = this.getSortedModels();

    for (const model of sortedModels) {
      const health = this.modelHealth.get(model);
      
      // Skip unhealthy models
      if (health && !health.available && health.failureCount > 3) {
        console.log(`[Dispatcher] Skipping unhealthy model: ${model}`);
        continue;
      }

      try {
        console.log(`[Dispatcher] Attempting ${model}...`);
        const result = await this.invokeModel(model, query);
        
        // Update health on success
        this.updateHealth(model, true);
        
        // Cache the result
        if (this.config.enableCache) {
          this.cache.set(query, result);
          
          // Limit cache size
          if (this.cache.size > 500) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
              this.cache.delete(firstKey);
            }
          }
  async dispatch(query: string, useAgenticMode: boolean = false): Promise<string> {
    // Use agentic dispatch for complex multi-step queries
    if (useAgenticMode) {
      try {
        const result = await agenticDispatch(query, true, {
          maxIterations: 5,
          requiresVerification: true,
        });
        return result.answer;
      } catch (e) {
        console.error('Agentic dispatch failed, falling back to standard:', e);
        // Fall through to standard dispatch
      }
    }

    // Standard model fallback chain
    for (const model of this.models) {
      try {
        if (model === 'gemma-local') {
          // Attempt local inference for offline scenarios
          // Note: This is a server-side operation, not browser-based
          return await localGemmaInference(query);
        }

        return result;
      } catch (e: any) {
        console.error(`[Dispatcher] Fallback from ${model}: ${e.message}`);
        this.updateHealth(model, false);
        continue;
      }
    }

    throw new Error('All models failed');
  }

  /**
   * Invoke a specific model
   */
  private async invokeModel(model: string, query: string): Promise<string> {
    // Local model always available for offline fallback
    if (model === 'gemma-local') {
      return await this.localGemmaInference(query);
    }

    // Mock API call - replace with actual OpenRouter/API calls
    // For example:
    // return await OpenRouter.invoke(model, query);
    
    // Simulate network delay and potential failure
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (Math.random() > 0.85) {
      throw new Error(`${model} temporarily unavailable`);
    }

    return `Response from ${model}: ${query.substring(0, 50)}...`;
  }

  /**
   * Local Gemma inference for offline use
   */
  private async localGemmaInference(query: string): Promise<string> {
    console.log('[Dispatcher] Using local Gemma3 (offline mode)');
    // This would integrate with locallm/gemma3-ai-edge.ts
    return `Local Gemma response: ${query}`;
  }

  /**
   * Get models sorted by health score
   */
  private getSortedModels(): string[] {
    return [...this.models].sort((a, b) => {
      const healthA = this.modelHealth.get(a)!;
      const healthB = this.modelHealth.get(b)!;
      
      // Prioritize available models
      if (healthA.available && !healthB.available) return -1;
      if (!healthA.available && healthB.available) return 1;
      
      // Then by failure count (lower is better)
      return healthA.failureCount - healthB.failureCount;
    });
  }

  /**
   * Update model health tracking
   */
  private updateHealth(model: string, success: boolean): void {
    const health = this.modelHealth.get(model);
    if (!health) return;

    if (success) {
      health.available = true;
      health.failureCount = Math.max(0, health.failureCount - 1);
    } else {
      health.failureCount++;
      if (health.failureCount > 3) {
        health.available = false;
      }
    }

    health.lastCheck = Date.now();
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(() => {
      this.models.forEach(model => {
        const health = this.modelHealth.get(model);
        if (health && !health.available) {
          // Gradually recover failed models
          if (Date.now() - health.lastCheck > 300000) { // 5 minutes
            console.log(`[Dispatcher] Attempting to recover ${model}`);
            health.failureCount = Math.max(0, health.failureCount - 1);
            if (health.failureCount === 0) {
              health.available = true;
            }
          }
        }
      });
    }, this.config.healthCheckInterval);
  }

  /**
   * Get dispatcher statistics
   */
  getStats() {
    return {
      models: this.models,
      health: Object.fromEntries(this.modelHealth),
      cacheSize: this.cache.size,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const dispatcher = new Dispatcher();
