/**
 * Self-Evolution Service - Server-side recursive improvement capabilities
 *
 * This service handles the server-side aspects of recursive self-improvement,
 * including code analysis, algorithmic optimization, and system evolution.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { loadMemoryCore, searchMemoryCore } from './memoryService';

export interface ServerPerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  successRate: number;
  throughput: number;
  errorRate: number;
}

export interface AlgorithmOptimization {
  id: string;
  algorithm: string;
  currentPerformance: number;
  optimizedVersion: string;
  expectedImprovement: number;
  testResults?: {
    performance: number;
    accuracy: number;
    stability: number;
  };
  status: 'analyzing' | 'testing' | 'implementing' | 'active' | 'rejected';
  createdAt: Date;
}

export interface SystemEvolutionRecord {
  id: string;
  timestamp: Date;
  evolutionType: 'algorithm' | 'memory' | 'response' | 'learning';
  description: string;
  performanceBefore: ServerPerformanceMetrics;
  performanceAfter?: ServerPerformanceMetrics;
  success: boolean;
  rollbackAvailable: boolean;
}

/**
 * Server-side Self-Evolution Engine
 * Handles recursive improvements to server algorithms and performance
 */
export class ServerSelfEvolutionEngine {
  private static evolutionHistory: SystemEvolutionRecord[] = [];
  private static activeOptimizations: Map<string, AlgorithmOptimization> =
    new Map();
  private static performanceBaseline: ServerPerformanceMetrics | null = null;
  private static lastEvolutionCheck = 0;
  private static readonly EVOLUTION_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

  /**
   * Initialize the self-evolution system
   */
  static async initialize(): Promise<void> {
    console.log('Initializing Server Self-Evolution Engine...');

    try {
      await this.loadEvolutionHistory();
      await this.establishPerformanceBaseline();

      // Start periodic evolution checks (but don't block initialization)
      setTimeout(() => this.schedulePeriodicEvolution(), 5000);

      console.log('Server Self-Evolution Engine initialized successfully');
    } catch (error) {
      console.error('Error initializing Server Self-Evolution Engine:', error);
    }
  }

  /**
   * Triggers a server-side evolution cycle
   */
  static async triggerEvolutionCycle(): Promise<SystemEvolutionRecord[]> {
    console.log('Starting server evolution cycle...');

    const currentMetrics = await this.collectPerformanceMetrics();
    const optimizationOpportunities =
      await this.analyzeOptimizationOpportunities(currentMetrics);
    const implementedEvolutions: SystemEvolutionRecord[] = [];

    for (const opportunity of optimizationOpportunities) {
      try {
        const evolution = await this.implementEvolution(
          opportunity,
          currentMetrics
        );
        implementedEvolutions.push(evolution);

        // Test the evolution
        const newMetrics = await this.collectPerformanceMetrics();
        evolution.performanceAfter = newMetrics;
        evolution.success = this.evaluateEvolutionSuccess(
          currentMetrics,
          newMetrics
        );

        if (!evolution.success && evolution.rollbackAvailable) {
          await this.rollbackEvolution(evolution);
        }
      } catch (error) {
        console.error('Error implementing evolution:', error);
      }
    }

    await this.saveEvolutionHistory();
    this.lastEvolutionCheck = Date.now();

    console.log(
      `Evolution cycle completed. Implemented ${implementedEvolutions.length} evolutions.`
    );
    return implementedEvolutions;
  }

  /**
   * Analyzes current server performance and identifies optimization opportunities
   */
  private static async analyzeOptimizationOpportunities(
    metrics: ServerPerformanceMetrics
  ): Promise<
    Array<{
      type: SystemEvolutionRecord['evolutionType'];
      description: string;
      priority: number;
    }>
  > {
    const opportunities = [];

    // Memory optimization opportunities
    if (metrics.memoryUsage > 0.8) {
      opportunities.push({
        type: 'memory' as const,
        description:
          'Optimize memory usage through better caching and garbage collection',
        priority: 0.9,
      });
    }

    // Response time optimization
    if (metrics.responseTime > 2000) {
      opportunities.push({
        type: 'response' as const,
        description:
          'Optimize response generation algorithms for faster processing',
        priority: 0.8,
      });
    }

    // Algorithm efficiency improvements
    if (metrics.successRate < 0.95) {
      opportunities.push({
        type: 'algorithm' as const,
        description: 'Improve algorithm accuracy and reliability',
        priority: 0.85,
      });
    }

    // Learning system enhancements
    const memoryCore = await loadMemoryCore();
    if (memoryCore.entries.length > 1000) {
      opportunities.push({
        type: 'learning' as const,
        description: 'Enhance memory processing and pattern recognition',
        priority: 0.7,
      });
    }

    return opportunities.sort((a, b) => b.priority - a.priority).slice(0, 3);
  }

  /**
   * Implements a specific evolution/optimization
   */
  private static async implementEvolution(
    opportunity: {
      type: SystemEvolutionRecord['evolutionType'];
      description: string;
    },
    baselineMetrics: ServerPerformanceMetrics
  ): Promise<SystemEvolutionRecord> {
    const evolutionId = `evolution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const evolution: SystemEvolutionRecord = {
      id: evolutionId,
      timestamp: new Date(),
      evolutionType: opportunity.type,
      description: opportunity.description,
      performanceBefore: baselineMetrics,
      success: false,
      rollbackAvailable: true,
    };

    // Implement the specific evolution based on type
    switch (opportunity.type) {
      case 'memory':
        await this.optimizeMemoryUsage(evolution);
        break;
      case 'response':
        await this.optimizeResponseGeneration(evolution);
        break;
      case 'algorithm':
        await this.optimizeAlgorithms(evolution);
        break;
      case 'learning':
        await this.optimizeLearningSystem(evolution);
        break;
    }

    this.evolutionHistory.push(evolution);
    return evolution;
  }

  /**
   * Optimizes memory usage patterns
   */
  private static async optimizeMemoryUsage(
    evolution: SystemEvolutionRecord
  ): Promise<void> {
    console.log('Implementing memory optimization...');

    // Example memory optimization: implement more efficient caching
    const memoryOptimizations = {
      cacheSize: this.calculateOptimalCacheSize(),
      garbageCollectionFrequency: this.calculateOptimalGCFrequency(),
      memoryPooling: true,
    };

    // Store optimization parameters for potential rollback
    evolution.rollbackAvailable = true;

    console.log('Memory optimization implemented:', memoryOptimizations);
  }

  /**
   * Optimizes response generation algorithms
   */
  private static async optimizeResponseGeneration(
    evolution: SystemEvolutionRecord
  ): Promise<void> {
    console.log('Implementing response generation optimization...');

    // Example: optimize response caching and pre-computation
    const responseOptimizations = {
      enableResponseCaching: true,
      precomputeCommonResponses: true,
      optimizeTokenization: true,
      parallelProcessing: true,
    };

    // In a real implementation, this would modify actual algorithms
    console.log(
      'Response generation optimization implemented:',
      responseOptimizations
    );
  }

  /**
   * Optimizes core algorithms for better performance
   */
  private static async optimizeAlgorithms(
    evolution: SystemEvolutionRecord
  ): Promise<void> {
    console.log('Implementing algorithm optimization...');

    // Example: optimize pattern matching and decision trees
    const algorithmOptimizations = {
      improvedPatternMatching: this.optimizePatternMatchingAlgorithm(),
      enhancedDecisionTrees: this.optimizeDecisionTreeAlgorithm(),
      betterHeuristics: this.optimizeHeuristicAlgorithms(),
    };

    console.log('Algorithm optimization implemented:', algorithmOptimizations);
  }

  /**
   * Optimizes learning and adaptation systems
   */
  private static async optimizeLearningSystem(
    evolution: SystemEvolutionRecord
  ): Promise<void> {
    console.log('Implementing learning system optimization...');

    // Example: improve learning algorithms and memory processing
    const learningOptimizations = {
      enhancedMemoryConsolidation: true,
      improvedPatternRecognition: true,
      adaptiveLearningRates: true,
      betterFeedbackProcessing: true,
    };

    console.log(
      'Learning system optimization implemented:',
      learningOptimizations
    );
  }

  /**
   * Collects current server performance metrics
   */
  private static async collectPerformanceMetrics(): Promise<ServerPerformanceMetrics> {
    const memoryUsage = process.memoryUsage();
    const startTime = Date.now();

    // Simple performance test
    await this.performQuickPerformanceTest();
    const responseTime = Date.now() - startTime;

    return {
      responseTime,
      memoryUsage: memoryUsage.heapUsed / memoryUsage.heapTotal,
      cpuUsage: this.getCPUUsage(),
      successRate: await this.calculateSuccessRate(),
      throughput: await this.calculateThroughput(),
      errorRate: await this.calculateErrorRate(),
    };
  }

  /**
   * Establishes performance baseline for comparison
   */
  private static async establishPerformanceBaseline(): Promise<void> {
    if (!this.performanceBaseline) {
      this.performanceBaseline = await this.collectPerformanceMetrics();
      console.log(
        'Performance baseline established:',
        this.performanceBaseline
      );
    }
  }

  /**
   * Evaluates if an evolution was successful
   */
  private static evaluateEvolutionSuccess(
    before: ServerPerformanceMetrics,
    after: ServerPerformanceMetrics
  ): boolean {
    const improvementThreshold = 0.05; // 5% improvement threshold

    // Calculate weighted improvement score
    const responseTimeImprovement =
      (before.responseTime - after.responseTime) / before.responseTime;
    const memoryImprovement =
      (before.memoryUsage - after.memoryUsage) / before.memoryUsage;
    const successRateImprovement =
      (after.successRate - before.successRate) / before.successRate;
    const throughputImprovement =
      (after.throughput - before.throughput) / before.throughput;

    const overallImprovement =
      responseTimeImprovement * 0.3 +
      memoryImprovement * 0.2 +
      successRateImprovement * 0.3 +
      throughputImprovement * 0.2;

    return overallImprovement > improvementThreshold;
  }

  /**
   * Rolls back an evolution that caused performance degradation
   */
  private static async rollbackEvolution(
    evolution: SystemEvolutionRecord
  ): Promise<void> {
    console.log(`Rolling back evolution: ${evolution.id}`);

    // In a real implementation, this would restore previous system state
    evolution.rollbackAvailable = false;
    evolution.success = false;
  }

  /**
   * Schedules periodic evolution checks
   */
  private static schedulePeriodicEvolution(): void {
    setInterval(async () => {
      if (this.shouldRunEvolution()) {
        try {
          await this.triggerEvolutionCycle();
        } catch (error) {
          console.error('Error in periodic evolution cycle:', error);
        }
      }
    }, this.EVOLUTION_CHECK_INTERVAL);
  }

  /**
   * Determines if evolution should run based on performance trends
   */
  private static shouldRunEvolution(): boolean {
    const timeSinceLastCheck = Date.now() - this.lastEvolutionCheck;
    return timeSinceLastCheck >= this.EVOLUTION_CHECK_INTERVAL;
  }

  // Helper methods for performance calculation and optimization
  private static async performQuickPerformanceTest(): Promise<void> {
    // Quick performance test to measure response time
    const testData = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      data: `test_${i}`,
    }));
    testData.forEach((item) => JSON.stringify(item));
  }

  private static getCPUUsage(): number {
    // Simple CPU usage estimation (placeholder)
    return Math.random() * 0.5 + 0.2; // 20-70% CPU usage simulation
  }

  private static async calculateSuccessRate(): Promise<number> {
    // Calculate success rate based on recent operations
    return 0.95; // 95% success rate (placeholder)
  }

  private static async calculateThroughput(): Promise<number> {
    // Calculate requests per second throughput
    return 100; // 100 req/s (placeholder)
  }

  private static async calculateErrorRate(): Promise<number> {
    // Calculate error rate
    return 0.02; // 2% error rate (placeholder)
  }

  private static calculateOptimalCacheSize(): number {
    const memUsage = process.memoryUsage();
    return Math.floor(memUsage.heapTotal * 0.1); // 10% of heap for cache
  }

  private static calculateOptimalGCFrequency(): number {
    return 30000; // 30 seconds (placeholder)
  }

  private static optimizePatternMatchingAlgorithm(): any {
    return { algorithm: 'improved_pattern_matching', efficiency: 1.2 };
  }

  private static optimizeDecisionTreeAlgorithm(): any {
    return { algorithm: 'optimized_decision_tree', efficiency: 1.15 };
  }

  private static optimizeHeuristicAlgorithms(): any {
    return { algorithm: 'enhanced_heuristics', efficiency: 1.1 };
  }

  private static async loadEvolutionHistory(): Promise<void> {
    try {
      const historyPath = join(
        process.cwd(),
        'memory',
        'evolution_history.json'
      );
      const data = await fs.readFile(historyPath, 'utf8');
      this.evolutionHistory = JSON.parse(data);
    } catch (error) {
      console.log('No existing evolution history found, starting fresh');
      this.evolutionHistory = [];
    }
  }

  private static async saveEvolutionHistory(): Promise<void> {
    try {
      const historyPath = join(
        process.cwd(),
        'memory',
        'evolution_history.json'
      );
      await fs.writeFile(
        historyPath,
        JSON.stringify(this.evolutionHistory, null, 2)
      );
    } catch (error) {
      console.error('Error saving evolution history:', error);
    }
  }

  /**
   * Get current evolution status
   */
  static getEvolutionStatus() {
    const recentEvolutions = this.evolutionHistory.slice(-5);
    const successfulEvolutions = this.evolutionHistory.filter((e) => e.success);

    return {
      totalEvolutions: this.evolutionHistory.length,
      successfulEvolutions: successfulEvolutions.length,
      successRate:
        this.evolutionHistory.length > 0
          ? successfulEvolutions.length / this.evolutionHistory.length
          : 0,
      recentEvolutions,
      lastEvolutionTime: this.lastEvolutionCheck,
      nextEvolutionDue:
        Date.now() - this.lastEvolutionCheck >= this.EVOLUTION_CHECK_INTERVAL,
      activeOptimizations: Array.from(this.activeOptimizations.values()),
    };
  }

  /**
   * Get complete evolution history
   */
  static async getEvolutionHistory(): Promise<SystemEvolutionRecord[]> {
    return [...this.evolutionHistory];
  }

  /**
   * Get evolution analytics and trends
   */
  static async getEvolutionAnalytics() {
    const history = this.evolutionHistory;
    const successfulEvolutions = history.filter((e) => e.success);
    const recentEvolutions = history.slice(-10);

    // Calculate performance trends
    const performanceDeltas = recentEvolutions
      .filter((e) => e.performanceAfter)
      .map((e) => {
        const before = e.performanceBefore;
        const after = e.performanceAfter!;
        return {
          responseTime:
            (before.responseTime - after.responseTime) / before.responseTime,
          memoryUsage:
            (before.memoryUsage - after.memoryUsage) / before.memoryUsage,
          cpuUsage: (before.cpuUsage - after.cpuUsage) / before.cpuUsage,
          errorRate: (before.errorRate - after.errorRate) / before.errorRate,
        };
      });

    const avgPerformanceImpact = performanceDeltas.reduce(
      (acc, delta) => {
        return {
          responseTime: acc.responseTime + delta.responseTime,
          memoryUsage: acc.memoryUsage + delta.memoryUsage,
          cpuUsage: acc.cpuUsage + delta.cpuUsage,
          errorRate: acc.errorRate + delta.errorRate,
        };
      },
      { responseTime: 0, memoryUsage: 0, cpuUsage: 0, errorRate: 0 }
    );

    const count = performanceDeltas.length || 1;
    Object.keys(avgPerformanceImpact).forEach((key) => {
      avgPerformanceImpact[key as keyof typeof avgPerformanceImpact] /= count;
    });

    // Categorize evolutions by type
    const evolutionsByType = history.reduce(
      (acc, evolution) => {
        acc[evolution.evolutionType] = (acc[evolution.evolutionType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalEvolutions: history.length,
      successfulEvolutions: successfulEvolutions.length,
      successRate:
        history.length > 0 ? successfulEvolutions.length / history.length : 0,
      averagePerformanceImpact: avgPerformanceImpact,
      evolutionsByType,
      trends: {
        performanceImpact: this.calculatePerformanceTrend(performanceDeltas),
        frequency: this.calculateEvolutionFrequency(),
      },
      recentActivity: recentEvolutions.map((evolution) => ({
        id: evolution.id,
        timestamp: evolution.timestamp,
        type: evolution.evolutionType,
        description: evolution.description,
        success: evolution.success,
        performanceImpact: evolution.performanceAfter
          ? this.calculateSinglePerformanceImpact(
              evolution.performanceBefore,
              evolution.performanceAfter
            )
          : null,
      })),
    };
  }

  /**
   * Calculate performance trend from deltas
   */
  private static calculatePerformanceTrend(
    deltas: any[]
  ): 'improving' | 'declining' | 'stable' {
    if (deltas.length === 0) return 'stable';

    const overallImpact =
      deltas.reduce((acc, delta) => {
        return (
          acc +
          (delta.responseTime +
            delta.memoryUsage +
            delta.cpuUsage +
            delta.errorRate) /
            4
        );
      }, 0) / deltas.length;

    if (overallImpact > 0.05) return 'improving';
    if (overallImpact < -0.05) return 'declining';
    return 'stable';
  }

  /**
   * Calculate evolution frequency trend
   */
  private static calculateEvolutionFrequency():
    | 'increasing'
    | 'decreasing'
    | 'stable' {
    if (this.evolutionHistory.length < 4) return 'stable';

    const recentPeriod = this.evolutionHistory.slice(-5);
    const olderPeriod = this.evolutionHistory.slice(-10, -5);

    const recentInterval = this.calculateAverageInterval(recentPeriod);
    const olderInterval = this.calculateAverageInterval(olderPeriod);

    if (recentInterval < olderInterval * 0.8) return 'increasing';
    if (recentInterval > olderInterval * 1.2) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate average interval between evolutions
   */
  private static calculateAverageInterval(
    evolutions: SystemEvolutionRecord[]
  ): number {
    if (evolutions.length < 2) return Infinity;

    const intervals = [];
    for (let i = 1; i < evolutions.length; i++) {
      const interval =
        new Date(evolutions[i].timestamp).getTime() -
        new Date(evolutions[i - 1].timestamp).getTime();
      intervals.push(interval);
    }

    return intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  /**
   * Calculate performance impact for a single evolution
   */
  private static calculateSinglePerformanceImpact(
    before: ServerPerformanceMetrics,
    after: ServerPerformanceMetrics
  ): number {
    const responseImpact =
      (before.responseTime - after.responseTime) / before.responseTime;
    const memoryImpact =
      (before.memoryUsage - after.memoryUsage) / before.memoryUsage;
    const cpuImpact = (before.cpuUsage - after.cpuUsage) / before.cpuUsage;
    const errorImpact = (before.errorRate - after.errorRate) / before.errorRate;

    return (responseImpact + memoryImpact + cpuImpact + errorImpact) / 4;
  }
}

/**
 * Initialize the server-side self-evolution engine
 */
export async function initializeServerSelfEvolution(): Promise<void> {
  await ServerSelfEvolutionEngine.initialize();
}

/**
 * Get current evolution status for API endpoints
 */
export function getServerEvolutionStatus() {
  return ServerSelfEvolutionEngine.getEvolutionStatus();
}

/**
 * Get detailed evolution history for API endpoints
 */
export async function getServerEvolutionHistory() {
  return await ServerSelfEvolutionEngine.getEvolutionHistory();
}

/**
 * Get evolution analytics for API endpoints
 */
export async function getServerEvolutionAnalytics() {
  return await ServerSelfEvolutionEngine.getEvolutionAnalytics();
}

/**
 * Manually trigger an evolution cycle
 */
export async function triggerServerEvolution(): Promise<
  SystemEvolutionRecord[]
> {
  return await ServerSelfEvolutionEngine.triggerEvolutionCycle();
}

/**
 * A/B Testing for Adaptive Personas
 *
 * This system manages A/B testing of different LLM persona configurations
 * to objectively determine which personality style yields better user outcomes.
 */

export interface PersonaConfig {
  id: string;
  name: string;
  style: 'pragmatic' | 'empathetic' | 'strategic' | 'creative' | 'balanced';
  systemPromptModifier: string;
  temperature: number;
  responseLength: 'concise' | 'moderate' | 'detailed';
  toneAdjustments: {
    formality: number; // 0-1
    enthusiasm: number; // 0-1
    directness: number; // 0-1
  };
}

export interface PersonaTestResult {
  personaId: string;
  conversationId: string;
  userId: string;
  timestamp: number;
  metrics: {
    taskCompletionRate: number;
    userSatisfactionScore: number;
    responseTime: number;
    engagementLevel: number;
  };
  outcome: 'success' | 'partial' | 'failure';
  userFeedback?: string;
}

export interface PersonaABTest {
  testId: string;
  startedAt: number;
  personaA: PersonaConfig;
  personaB: PersonaConfig;
  results: {
    personaA: PersonaTestResult[];
    personaB: PersonaTestResult[];
  };
  status: 'active' | 'completed' | 'paused';
  winner?: 'A' | 'B' | 'tie';
  confidence: number; // 0-1
}

// Active A/B tests and persona configurations
const activePersonaTests = new Map<string, PersonaABTest>();
const personaConfigs = new Map<string, PersonaConfig>();
let currentActivePersona: PersonaConfig | null = null;

// Default persona configurations
const defaultPersonas: PersonaConfig[] = [
  {
    id: 'persona_pragmatic',
    name: 'Pragmatic',
    style: 'pragmatic',
    systemPromptModifier:
      'Be direct, efficient, and solution-focused. Prioritize practical outcomes.',
    temperature: 0.3,
    responseLength: 'concise',
    toneAdjustments: {
      formality: 0.6,
      enthusiasm: 0.4,
      directness: 0.9,
    },
  },
  {
    id: 'persona_empathetic',
    name: 'Empathetic',
    style: 'empathetic',
    systemPromptModifier:
      'Be warm, supportive, and emotionally attuned. Show understanding and care.',
    temperature: 0.7,
    responseLength: 'moderate',
    toneAdjustments: {
      formality: 0.4,
      enthusiasm: 0.8,
      directness: 0.5,
    },
  },
  {
    id: 'persona_strategic',
    name: 'Strategic',
    style: 'strategic',
    systemPromptModifier:
      'Think long-term, consider multiple perspectives, and provide thoughtful analysis.',
    temperature: 0.5,
    responseLength: 'detailed',
    toneAdjustments: {
      formality: 0.7,
      enthusiasm: 0.5,
      directness: 0.6,
    },
  },
  {
    id: 'persona_creative',
    name: 'Creative',
    style: 'creative',
    systemPromptModifier:
      'Be imaginative, explore novel ideas, and think outside the box.',
    temperature: 0.9,
    responseLength: 'moderate',
    toneAdjustments: {
      formality: 0.3,
      enthusiasm: 0.9,
      directness: 0.4,
    },
  },
];

/**
 * Initialize persona A/B testing system
 */
export function initializePersonaABTesting(): void {
  console.log('[PersonaAB] Initializing A/B testing system...');

  // Load default personas
  defaultPersonas.forEach((persona) => {
    personaConfigs.set(persona.id, persona);
  });

  // Set default active persona (balanced)
  currentActivePersona =
    personaConfigs.get('persona_empathetic') || defaultPersonas[1];

  console.log(
    `[PersonaAB] Loaded ${personaConfigs.size} persona configurations`
  );
  console.log(`[PersonaAB] Active persona: ${currentActivePersona.name}`);
}

/**
 * Start a new A/B test between two personas
 */
export function startPersonaABTest(
  personaAId: string,
  personaBId: string
): PersonaABTest {
  const personaA = personaConfigs.get(personaAId);
  const personaB = personaConfigs.get(personaBId);

  if (!personaA || !personaB) {
    throw new Error('Invalid persona IDs');
  }

  const testId = `abtest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const test: PersonaABTest = {
    testId,
    startedAt: Date.now(),
    personaA,
    personaB,
    results: {
      personaA: [],
      personaB: [],
    },
    status: 'active',
    confidence: 0,
  };

  activePersonaTests.set(testId, test);

  console.log(`[PersonaAB] Started A/B test: ${testId}`);
  console.log(`[PersonaAB] Testing ${personaA.name} vs ${personaB.name}`);

  return test;
}

/**
 * Get the currently active persona configuration for AI dispatcher
 */
export function getActivePersonaConfig(): PersonaConfig {
  // In A/B test mode, alternate between personas
  const activeTests = Array.from(activePersonaTests.values()).filter(
    (test) => test.status === 'active'
  );

  if (activeTests.length > 0) {
    // Alternate between test personas (50/50 split)
    const test = activeTests[0];
    const usePersonaA = Math.random() < 0.5;
    return usePersonaA ? test.personaA : test.personaB;
  }

  return currentActivePersona || defaultPersonas[1];
}

/**
 * Record the result of a conversation using a specific persona
 */
export async function recordPersonaTestResult(
  personaId: string,
  conversationId: string,
  userId: string,
  metrics: PersonaTestResult['metrics'],
  outcome: 'success' | 'partial' | 'failure',
  userFeedback?: string
): Promise<void> {
  const result: PersonaTestResult = {
    personaId,
    conversationId,
    userId,
    timestamp: Date.now(),
    metrics,
    outcome,
    userFeedback,
  };

  // Find active test using this persona
  for (const test of activePersonaTests.values()) {
    if (test.status !== 'active') continue;

    if (test.personaA.id === personaId) {
      test.results.personaA.push(result);
      console.log(
        `[PersonaAB] Recorded result for Persona A: ${test.personaA.name}`
      );
    } else if (test.personaB.id === personaId) {
      test.results.personaB.push(result);
      console.log(
        `[PersonaAB] Recorded result for Persona B: ${test.personaB.name}`
      );
    }

    // Check if we have enough data to determine winner
    await evaluateABTest(test.testId);
  }
}

/**
 * Evaluate an A/B test and determine if there's a winner
 */
async function evaluateABTest(testId: string): Promise<void> {
  const test = activePersonaTests.get(testId);
  if (!test || test.status !== 'active') return;

  const resultsA = test.results.personaA;
  const resultsB = test.results.personaB;

  // Need at least 20 results per persona for statistical significance
  if (resultsA.length < 20 || resultsB.length < 20) {
    return;
  }

  // Calculate average metrics
  const avgA = calculateAverageMetrics(resultsA);
  const avgB = calculateAverageMetrics(resultsB);

  // Calculate composite score (weighted average)
  const scoreA =
    avgA.taskCompletionRate * 0.4 +
    avgA.userSatisfactionScore * 0.4 +
    avgA.engagementLevel * 0.2;

  const scoreB =
    avgB.taskCompletionRate * 0.4 +
    avgB.userSatisfactionScore * 0.4 +
    avgB.engagementLevel * 0.2;

  // Determine winner (require at least 10% improvement)
  const improvementThreshold = 0.1;
  const difference = Math.abs(scoreA - scoreB);

  if (difference < improvementThreshold) {
    test.winner = 'tie';
    test.confidence = 0.5;
  } else if (scoreA > scoreB) {
    test.winner = 'A';
    test.confidence = Math.min(difference / improvementThreshold, 1.0);
  } else {
    test.winner = 'B';
    test.confidence = Math.min(difference / improvementThreshold, 1.0);
  }

  // If confidence > 0.8, complete the test
  if (test.confidence >= 0.8) {
    test.status = 'completed';

    const winningPersona =
      test.winner === 'A'
        ? test.personaA
        : test.winner === 'B'
          ? test.personaB
          : null;

    if (winningPersona) {
      currentActivePersona = winningPersona;
      console.log(`[PersonaAB] ✅ Test ${testId} completed!`);
      console.log(
        `[PersonaAB] Winner: ${winningPersona.name} (confidence: ${(test.confidence * 100).toFixed(1)}%)`
      );
      console.log(`[PersonaAB] Setting as active persona`);
    }
  }
}

/**
 * Calculate average metrics from test results
 */
function calculateAverageMetrics(
  results: PersonaTestResult[]
): PersonaTestResult['metrics'] {
  if (results.length === 0) {
    return {
      taskCompletionRate: 0,
      userSatisfactionScore: 0,
      responseTime: 0,
      engagementLevel: 0,
    };
  }

  const sum = results.reduce(
    (acc, result) => ({
      taskCompletionRate:
        acc.taskCompletionRate + result.metrics.taskCompletionRate,
      userSatisfactionScore:
        acc.userSatisfactionScore + result.metrics.userSatisfactionScore,
      responseTime: acc.responseTime + result.metrics.responseTime,
      engagementLevel: acc.engagementLevel + result.metrics.engagementLevel,
    }),
    {
      taskCompletionRate: 0,
      userSatisfactionScore: 0,
      responseTime: 0,
      engagementLevel: 0,
    }
  );

  return {
    taskCompletionRate: sum.taskCompletionRate / results.length,
    userSatisfactionScore: sum.userSatisfactionScore / results.length,
    responseTime: sum.responseTime / results.length,
    engagementLevel: sum.engagementLevel / results.length,
  };
}

/**
 * Get all active A/B tests
 */
export function getActivePersonaABTests(): PersonaABTest[] {
  return Array.from(activePersonaTests.values()).filter(
    (test) => test.status === 'active'
  );
}

/**
 * Get A/B test statistics
 */
export function getPersonaABTestStats() {
  const tests = Array.from(activePersonaTests.values());
  const activeTests = tests.filter((t) => t.status === 'active');
  const completedTests = tests.filter((t) => t.status === 'completed');

  return {
    totalTests: tests.length,
    activeTests: activeTests.length,
    completedTests: completedTests.length,
    currentPersona: currentActivePersona?.name || 'Unknown',
    availablePersonas: Array.from(personaConfigs.values()).map((p) => ({
      id: p.id,
      name: p.name,
      style: p.style,
    })),
  };
}
