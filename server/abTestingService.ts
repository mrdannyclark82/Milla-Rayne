/**
 * A/B Testing Service for Adaptive Personality
 * 
 * This service implements A/B testing infrastructure for LLM personality variations.
 * It integrates with userSatisfactionSurveyService and selfEvolutionService to
 * test slight variations in Milla's core persona and measure user engagement metrics.
 * 
 * Key Features:
 * - Define personality variants for A/B testing
 * - Assign users to test groups
 * - Track engagement metrics per variant
 * - Analyze performance and select winning variants
 * - Integrate with survey data for feedback
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  getSurveyAnalytics,
  type SurveyAnalytics,
} from './userSatisfactionSurveyService';
import {
  getServerEvolutionStatus,
} from './selfEvolutionService';

/**
 * Personality variant for A/B testing
 */
export interface PersonalityVariant {
  id: string;
  name: string;
  description: string;
  promptModifications: {
    systemPrompt?: string;
    toneAdjustments?: string;
    communicationStyle?: string;
    additionalInstructions?: string;
  };
  active: boolean;
  createdAt: number;
}

/**
 * User assignment to a test group
 */
export interface UserTestAssignment {
  userId: string;
  variantId: string;
  assignedAt: number;
  interactionCount: number;
  lastInteraction: number;
}

/**
 * Engagement metrics for a variant
 */
export interface VariantMetrics {
  variantId: string;
  totalUsers: number;
  totalInteractions: number;
  averageInteractionsPerUser: number;
  averageResponseTime: number;
  satisfactionScore: number;
  retentionRate: number;
  engagementScore: number; // Composite score
}

/**
 * A/B test configuration
 */
export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: PersonalityVariant[];
  startDate: number;
  endDate?: number;
  active: boolean;
  trafficSplit: Record<string, number>; // variantId -> percentage
}

/**
 * A/B Test results
 */
export interface ABTestResults {
  testId: string;
  winningVariant: string;
  variantMetrics: Record<string, VariantMetrics>;
  statisticalSignificance: number;
  recommendation: 'deploy' | 'continue_testing' | 'abandon';
  summary: string;
}

class ABTestingService {
  private variants: PersonalityVariant[] = [];
  private userAssignments = new Map<string, UserTestAssignment>();
  private tests: ABTest[] = [];
  private variantMetrics = new Map<string, VariantMetrics>();
  
  private readonly STORAGE_PATH = path.join(process.cwd(), 'memory', 'ab_testing.json');
  
  // Default personality variants
  private readonly DEFAULT_VARIANTS: Omit<PersonalityVariant, 'id' | 'createdAt'>[] = [
    {
      name: 'Control (Original)',
      description: 'The original Milla personality without modifications',
      promptModifications: {},
      active: true,
    },
    {
      name: 'Empathetic Plus',
      description: 'Enhanced empathy and emotional intelligence',
      promptModifications: {
        toneAdjustments: 'Be more empathetic and emotionally supportive. Show deeper understanding of user feelings.',
        additionalInstructions: 'Acknowledge emotions explicitly and validate user experiences before providing solutions.',
      },
      active: true,
    },
    {
      name: 'Concise & Efficient',
      description: 'More direct and action-oriented communication',
      promptModifications: {
        communicationStyle: 'Be concise and direct. Focus on actionable insights and quick solutions.',
        additionalInstructions: 'Prioritize efficiency. Use bullet points where appropriate. Get to the point quickly.',
      },
      active: true,
    },
    {
      name: 'Playful & Creative',
      description: 'More playful, creative, and encouraging',
      promptModifications: {
        toneAdjustments: 'Be more playful and creative in your responses. Use analogies and creative examples.',
        additionalInstructions: 'Encourage creativity and exploration. Make interactions enjoyable and lighthearted when appropriate.',
      },
      active: true,
    },
  ];

  async initialize(): Promise<void> {
    await this.loadData();
    await this.ensureDefaultVariants();
    console.log('[ABTesting] A/B Testing Service initialized');
  }

  /**
   * Ensure default variants exist
   */
  private async ensureDefaultVariants(): Promise<void> {
    if (this.variants.length === 0) {
      for (const variantDef of this.DEFAULT_VARIANTS) {
        this.createVariant(variantDef);
      }
      await this.saveData();
    }
  }

  /**
   * Create a new personality variant
   */
  createVariant(variant: Omit<PersonalityVariant, 'id' | 'createdAt'>): PersonalityVariant {
    const newVariant: PersonalityVariant = {
      id: `variant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...variant,
      createdAt: Date.now(),
    };
    
    this.variants.push(newVariant);
    console.log(`[ABTesting] Created variant: ${newVariant.name}`);
    return newVariant;
  }

  /**
   * Get all active variants
   */
  getActiveVariants(): PersonalityVariant[] {
    return this.variants.filter(v => v.active);
  }

  /**
   * Get variant by ID
   */
  getVariant(variantId: string): PersonalityVariant | undefined {
    return this.variants.find(v => v.id === variantId);
  }

  /**
   * Assign a user to a variant (A/B test group)
   */
  assignUserToVariant(userId: string, variantId?: string): UserTestAssignment {
    // Check if user already has an assignment
    let assignment = this.userAssignments.get(userId);
    
    if (assignment) {
      return assignment;
    }
    
    // If no variant specified, assign randomly based on active variants
    if (!variantId) {
      const activeVariants = this.getActiveVariants();
      if (activeVariants.length === 0) {
        throw new Error('No active variants available');
      }
      
      // Simple random assignment (in production, use proper traffic splitting)
      const randomIndex = Math.floor(Math.random() * activeVariants.length);
      variantId = activeVariants[randomIndex].id;
    }
    
    assignment = {
      userId,
      variantId,
      assignedAt: Date.now(),
      interactionCount: 0,
      lastInteraction: Date.now(),
    };
    
    this.userAssignments.set(userId, assignment);
    console.log(`[ABTesting] Assigned user ${userId} to variant: ${variantId}`);
    
    return assignment;
  }

  /**
   * Get user's assigned variant
   */
  getUserVariant(userId: string): PersonalityVariant | null {
    const assignment = this.userAssignments.get(userId);
    if (!assignment) {
      return null;
    }
    
    return this.getVariant(assignment.variantId) || null;
  }

  /**
   * Track a user interaction
   */
  trackInteraction(userId: string, responseTime?: number): void {
    const assignment = this.userAssignments.get(userId);
    
    if (assignment) {
      assignment.interactionCount++;
      assignment.lastInteraction = Date.now();
      
      // Update variant metrics
      this.updateVariantMetrics(assignment.variantId, responseTime);
    }
  }

  /**
   * Update metrics for a variant
   */
  private updateVariantMetrics(variantId: string, responseTime?: number): void {
    let metrics = this.variantMetrics.get(variantId);
    
    if (!metrics) {
      metrics = {
        variantId,
        totalUsers: 0,
        totalInteractions: 0,
        averageInteractionsPerUser: 0,
        averageResponseTime: 0,
        satisfactionScore: 0,
        retentionRate: 0,
        engagementScore: 0,
      };
    }
    
    metrics.totalInteractions++;
    
    if (responseTime) {
      const currentTotal = metrics.averageResponseTime * (metrics.totalInteractions - 1);
      metrics.averageResponseTime = (currentTotal + responseTime) / metrics.totalInteractions;
    }
    
    // Recalculate users count
    const usersForVariant = Array.from(this.userAssignments.values())
      .filter(a => a.variantId === variantId);
    metrics.totalUsers = usersForVariant.length;
    
    if (metrics.totalUsers > 0) {
      metrics.averageInteractionsPerUser = metrics.totalInteractions / metrics.totalUsers;
    }
    
    this.variantMetrics.set(variantId, metrics);
  }

  /**
   * Get metrics for a variant
   */
  getVariantMetrics(variantId: string): VariantMetrics | null {
    return this.variantMetrics.get(variantId) || null;
  }

  /**
   * Get metrics for all variants
   */
  getAllVariantMetrics(): Record<string, VariantMetrics> {
    const metrics: Record<string, VariantMetrics> = {};
    
    for (const [variantId, variantMetrics] of this.variantMetrics.entries()) {
      metrics[variantId] = variantMetrics;
    }
    
    return metrics;
  }

  /**
   * Analyze A/B test results and determine winner
   */
  async analyzeTestResults(testId: string): Promise<ABTestResults> {
    const test = this.tests.find(t => t.id === testId);
    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }
    
    const variantMetrics: Record<string, VariantMetrics> = {};
    let bestScore = -1;
    let winningVariant = '';
    
    // Calculate engagement scores for each variant
    for (const variant of test.variants) {
      const metrics = this.getVariantMetrics(variant.id);
      
      if (metrics) {
        // Calculate composite engagement score
        const engagementScore = this.calculateEngagementScore(metrics);
        metrics.engagementScore = engagementScore;
        
        variantMetrics[variant.id] = metrics;
        
        if (engagementScore > bestScore) {
          bestScore = engagementScore;
          winningVariant = variant.id;
        }
      }
    }
    
    // Calculate statistical significance (simplified)
    const significance = this.calculateStatisticalSignificance(variantMetrics);
    
    // Determine recommendation
    let recommendation: 'deploy' | 'continue_testing' | 'abandon' = 'continue_testing';
    
    if (significance > 0.95 && bestScore > 0.7) {
      recommendation = 'deploy';
    } else if (significance < 0.6 || bestScore < 0.3) {
      recommendation = 'abandon';
    }
    
    const winningVariantName = this.getVariant(winningVariant)?.name || 'Unknown';
    
    return {
      testId,
      winningVariant,
      variantMetrics,
      statisticalSignificance: significance,
      recommendation,
      summary: `Winning variant: ${winningVariantName} with engagement score ${bestScore.toFixed(2)}. Statistical significance: ${(significance * 100).toFixed(1)}%. Recommendation: ${recommendation}.`,
    };
  }

  /**
   * Calculate engagement score for a variant
   */
  private calculateEngagementScore(metrics: VariantMetrics): number {
    // Composite score based on multiple factors
    const interactionScore = Math.min(metrics.averageInteractionsPerUser / 10, 1);
    const responseTimeScore = Math.max(1 - (metrics.averageResponseTime / 5000), 0);
    const satisfactionScore = metrics.satisfactionScore / 5; // Assuming 1-5 scale
    
    // Weighted average
    return (
      interactionScore * 0.4 +
      responseTimeScore * 0.2 +
      satisfactionScore * 0.4
    );
  }

  /**
   * Calculate statistical significance (simplified)
   */
  private calculateStatisticalSignificance(
    variantMetrics: Record<string, VariantMetrics>
  ): number {
    const variantIds = Object.keys(variantMetrics);
    
    if (variantIds.length < 2) {
      return 0;
    }
    
    // Simplified significance based on sample size and score differences
    const totalInteractions = Object.values(variantMetrics)
      .reduce((sum, m) => sum + m.totalInteractions, 0);
    
    const scores = Object.values(variantMetrics).map(m => m.engagementScore);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const scoreDifference = maxScore - minScore;
    
    // Higher sample size and larger differences = higher significance
    const sampleSizeFactor = Math.min(totalInteractions / 1000, 1);
    const differenceFactor = scoreDifference;
    
    return Math.min(sampleSizeFactor * differenceFactor * 2, 0.99);
  }

  /**
   * Create an A/B test
   */
  createABTest(test: Omit<ABTest, 'id'>): ABTest {
    const newTest: ABTest = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...test,
    };
    
    this.tests.push(newTest);
    console.log(`[ABTesting] Created A/B test: ${newTest.name}`);
    return newTest;
  }

  /**
   * Get active tests
   */
  getActiveTests(): ABTest[] {
    return this.tests.filter(t => t.active);
  }

  /**
   * Get prompt modifications for a user
   */
  getPromptModificationsForUser(userId: string): PersonalityVariant['promptModifications'] | null {
    const variant = this.getUserVariant(userId);
    return variant ? variant.promptModifications : null;
  }

  /**
   * Get A/B testing statistics
   */
  getStatistics(): {
    totalVariants: number;
    activeVariants: number;
    totalUsers: number;
    totalTests: number;
    activeTests: number;
  } {
    return {
      totalVariants: this.variants.length,
      activeVariants: this.variants.filter(v => v.active).length,
      totalUsers: this.userAssignments.size,
      totalTests: this.tests.length,
      activeTests: this.tests.filter(t => t.active).length,
    };
  }

  /**
   * Load data from storage
   */
  private async loadData(): Promise<void> {
    try {
      const data = await fs.readFile(this.STORAGE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      
      this.variants = parsed.variants || [];
      this.tests = parsed.tests || [];
      
      // Restore user assignments
      if (parsed.userAssignments) {
        for (const [userId, assignment] of Object.entries(parsed.userAssignments as Record<string, UserTestAssignment>)) {
          this.userAssignments.set(userId, assignment);
        }
      }
      
      // Restore variant metrics
      if (parsed.variantMetrics) {
        for (const [variantId, metrics] of Object.entries(parsed.variantMetrics as Record<string, VariantMetrics>)) {
          this.variantMetrics.set(variantId, metrics);
        }
      }
    } catch (error) {
      console.log('[ABTesting] No existing data found, starting fresh');
    }
  }

  /**
   * Save data to storage
   */
  private async saveData(): Promise<void> {
    try {
      const data = {
        variants: this.variants,
        tests: this.tests,
        userAssignments: Object.fromEntries(this.userAssignments),
        variantMetrics: Object.fromEntries(this.variantMetrics),
      };
      
      await fs.writeFile(this.STORAGE_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[ABTesting] Error saving data:', error);
    }
  }

  /**
   * Periodic save
   */
  async periodicSave(): Promise<void> {
    await this.saveData();
  }
}

// Singleton instance
const abTestingService = new ABTestingService();

/**
 * Initialize the A/B testing service
 */
export async function initializeABTesting(): Promise<void> {
  await abTestingService.initialize();
  
  // Set up periodic save (every 5 minutes)
  setInterval(() => {
    abTestingService.periodicSave();
  }, 5 * 60 * 1000);
}

/**
 * Create a new personality variant
 */
export function createPersonalityVariant(
  variant: Omit<PersonalityVariant, 'id' | 'createdAt'>
): PersonalityVariant {
  return abTestingService.createVariant(variant);
}

/**
 * Get all active personality variants
 */
export function getActivePersonalityVariants(): PersonalityVariant[] {
  return abTestingService.getActiveVariants();
}

/**
 * Assign user to a variant
 */
export function assignUserToTestGroup(userId: string, variantId?: string): UserTestAssignment {
  return abTestingService.assignUserToVariant(userId, variantId);
}

/**
 * Get user's assigned variant
 */
export function getUserPersonalityVariant(userId: string): PersonalityVariant | null {
  return abTestingService.getUserVariant(userId);
}

/**
 * Get prompt modifications for user
 */
export function getPromptModificationsForUser(
  userId: string
): PersonalityVariant['promptModifications'] | null {
  return abTestingService.getPromptModificationsForUser(userId);
}

/**
 * Track user interaction
 */
export function trackUserInteraction(userId: string, responseTime?: number): void {
  abTestingService.trackInteraction(userId, responseTime);
}

/**
 * Get variant metrics
 */
export function getVariantMetrics(variantId: string): VariantMetrics | null {
  return abTestingService.getVariantMetrics(variantId);
}

/**
 * Get all variant metrics
 */
export function getAllVariantMetrics(): Record<string, VariantMetrics> {
  return abTestingService.getAllVariantMetrics();
}

/**
 * Create an A/B test
 */
export function createABTest(test: Omit<ABTest, 'id'>): ABTest {
  return abTestingService.createABTest(test);
}

/**
 * Get active A/B tests
 */
export function getActiveABTests(): ABTest[] {
  return abTestingService.getActiveTests();
}

/**
 * Analyze A/B test results
 */
export async function analyzeABTestResults(testId: string): Promise<ABTestResults> {
  return abTestingService.analyzeTestResults(testId);
}

/**
 * Get A/B testing statistics
 */
export function getABTestingStatistics() {
  return abTestingService.getStatistics();
}
