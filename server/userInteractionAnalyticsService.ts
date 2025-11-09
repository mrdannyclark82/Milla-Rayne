/**
 * User Interaction Analytics Service
 * 
 * Tracks user interactions, analyzes patterns, and identifies areas for improvement.
 * This service measures Milla's success based on user engagement and interaction quality.
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface UserInteraction {
  id: string;
  timestamp: number;
  type: 'message' | 'command' | 'feature_use' | 'error' | 'feedback';
  feature?: string;
  success: boolean;
  duration?: number;
  userSatisfaction?: number; // 1-5 scale
  context?: string;
}

export interface InteractionPattern {
  feature: string;
  usageCount: number;
  successRate: number;
  averageDuration: number;
  lastUsed: number;
  userSatisfactionAvg?: number;
}

export interface ImprovementSuggestion {
  id: string;
  type: 'bug_fix' | 'feature_enhancement' | 'new_feature' | 'performance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  basedOnInteractions: string[];
  estimatedImpact: number; // 1-10 scale
  createdAt: number;
  status: 'identified' | 'in_progress' | 'testing' | 'completed';
}

export interface MillaSuccessMetrics {
  totalInteractions: number;
  successfulInteractions: number;
  averageResponseTime: number;
  userSatisfactionScore: number;
  featuresUsed: number;
  errorsEncountered: number;
  improvementsSuggested: number;
  improvementsImplemented: number;
  userEngagementTrend: 'increasing' | 'stable' | 'decreasing';
}

class UserInteractionAnalyticsService {
  private interactions: UserInteraction[] = [];
  private patterns: Map<string, InteractionPattern> = new Map();
  private suggestions: ImprovementSuggestion[] = [];
  private readonly ANALYTICS_FILE = path.join(process.cwd(), 'memory', 'user_analytics.json');
  private readonly MAX_INTERACTIONS_STORED = 10000;

  async initialize(): Promise<void> {
    await this.loadAnalytics();
    console.log('User Interaction Analytics Service initialized');
  }

  /**
   * Track a new user interaction
   */
  async trackInteraction(interaction: Omit<UserInteraction, 'id' | 'timestamp'>): Promise<void> {
    const newInteraction: UserInteraction = {
      ...interaction,
      id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.interactions.push(newInteraction);

    // Keep only recent interactions to prevent memory bloat
    if (this.interactions.length > this.MAX_INTERACTIONS_STORED) {
      this.interactions = this.interactions.slice(-this.MAX_INTERACTIONS_STORED);
    }

    // Update patterns
    if (newInteraction.feature) {
      await this.updatePattern(newInteraction);
    }

    // Analyze for improvement opportunities
    await this.analyzeForImprovements();

    // Save periodically (every 10 interactions)
    if (this.interactions.length % 10 === 0) {
      await this.saveAnalytics();
    }
  }

  /**
   * Update interaction patterns for a feature
   */
  private async updatePattern(interaction: UserInteraction): Promise<void> {
    const feature = interaction.feature!;
    const existing = this.patterns.get(feature);

    if (existing) {
      existing.usageCount++;
      existing.successRate = ((existing.successRate * (existing.usageCount - 1)) + (interaction.success ? 1 : 0)) / existing.usageCount;
      
      if (interaction.duration) {
        existing.averageDuration = ((existing.averageDuration * (existing.usageCount - 1)) + interaction.duration) / existing.usageCount;
      }
      
      if (interaction.userSatisfaction) {
        const prevAvg = existing.userSatisfactionAvg || 3;
        existing.userSatisfactionAvg = ((prevAvg * (existing.usageCount - 1)) + interaction.userSatisfaction) / existing.usageCount;
      }
      
      existing.lastUsed = interaction.timestamp;
    } else {
      this.patterns.set(feature, {
        feature,
        usageCount: 1,
        successRate: interaction.success ? 1 : 0,
        averageDuration: interaction.duration || 0,
        lastUsed: interaction.timestamp,
        userSatisfactionAvg: interaction.userSatisfaction,
      });
    }
  }

  /**
   * Analyze interactions to identify improvement opportunities
   */
  private async analyzeForImprovements(): Promise<void> {
    const recentInteractions = this.interactions.slice(-100);
    
    // Identify features with low success rates
    for (const [feature, pattern] of this.patterns.entries()) {
      if (pattern.successRate < 0.7 && pattern.usageCount > 5) {
        const existingSuggestion = this.suggestions.find(
          s => s.type === 'bug_fix' && s.description.includes(feature) && s.status !== 'completed'
        );
        
        if (!existingSuggestion) {
          this.suggestions.push({
            id: `sug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'bug_fix',
            priority: pattern.successRate < 0.5 ? 'critical' : 'high',
            description: `Improve reliability of feature: ${feature} (current success rate: ${(pattern.successRate * 100).toFixed(1)}%)`,
            basedOnInteractions: recentInteractions
              .filter(i => i.feature === feature && !i.success)
              .map(i => i.id)
              .slice(-5),
            estimatedImpact: 10 - Math.floor(pattern.successRate * 10),
            createdAt: Date.now(),
            status: 'identified',
          });
        }
      }

      // Identify slow features
      if (pattern.averageDuration > 5000 && pattern.usageCount > 5) {
        const existingSuggestion = this.suggestions.find(
          s => s.type === 'performance' && s.description.includes(feature) && s.status !== 'completed'
        );
        
        if (!existingSuggestion) {
          this.suggestions.push({
            id: `sug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'performance',
            priority: pattern.averageDuration > 10000 ? 'high' : 'medium',
            description: `Optimize performance of feature: ${feature} (avg response time: ${(pattern.averageDuration / 1000).toFixed(2)}s)`,
            basedOnInteractions: recentInteractions
              .filter(i => i.feature === feature)
              .map(i => i.id)
              .slice(-5),
            estimatedImpact: Math.min(10, Math.floor(pattern.averageDuration / 1000)),
            createdAt: Date.now(),
            status: 'identified',
          });
        }
      }
    }

    // Identify frequently used features that could be enhanced
    const topFeatures = Array.from(this.patterns.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    for (const pattern of topFeatures) {
      if (pattern.userSatisfactionAvg && pattern.userSatisfactionAvg < 4 && pattern.usageCount > 10) {
        const existingSuggestion = this.suggestions.find(
          s => s.type === 'feature_enhancement' && s.description.includes(pattern.feature) && s.status !== 'completed'
        );
        
        if (!existingSuggestion) {
          this.suggestions.push({
            id: `sug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'feature_enhancement',
            priority: 'medium',
            description: `Enhance popular feature: ${pattern.feature} (user satisfaction: ${pattern.userSatisfactionAvg.toFixed(1)}/5)`,
            basedOnInteractions: recentInteractions
              .filter(i => i.feature === pattern.feature)
              .map(i => i.id)
              .slice(-5),
            estimatedImpact: Math.floor((5 - pattern.userSatisfactionAvg) * 2),
            createdAt: Date.now(),
            status: 'identified',
          });
        }
      }
    }

    // Keep only recent suggestions (last 50)
    this.suggestions = this.suggestions.slice(-50);
  }

  /**
   * Get Milla's success metrics
   */
  getSuccessMetrics(): MillaSuccessMetrics {
    const recentInteractions = this.interactions.slice(-1000);
    const successfulInteractions = recentInteractions.filter(i => i.success).length;
    const totalInteractions = recentInteractions.length;
    
    const avgResponseTime = recentInteractions
      .filter(i => i.duration)
      .reduce((sum, i) => sum + (i.duration || 0), 0) / recentInteractions.filter(i => i.duration).length || 0;

    const userSatInteractions = recentInteractions.filter(i => i.userSatisfaction);
    const userSatisfactionScore = userSatInteractions.length > 0
      ? userSatInteractions.reduce((sum, i) => sum + (i.userSatisfaction || 0), 0) / userSatInteractions.length
      : 0;

    const featuresUsed = this.patterns.size;
    const errorsEncountered = recentInteractions.filter(i => i.type === 'error').length;
    const improvementsSuggested = this.suggestions.filter(s => s.status === 'identified').length;
    const improvementsImplemented = this.suggestions.filter(s => s.status === 'completed').length;

    // Calculate engagement trend
    const oldInteractions = this.interactions.slice(-2000, -1000);
    const oldCount = oldInteractions.length;
    const newCount = recentInteractions.length;
    let userEngagementTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    
    if (newCount > oldCount * 1.1) {
      userEngagementTrend = 'increasing';
    } else if (newCount < oldCount * 0.9) {
      userEngagementTrend = 'decreasing';
    }

    return {
      totalInteractions,
      successfulInteractions,
      averageResponseTime: avgResponseTime,
      userSatisfactionScore,
      featuresUsed,
      errorsEncountered,
      improvementsSuggested,
      improvementsImplemented,
      userEngagementTrend,
    };
  }

  /**
   * Get interaction patterns
   */
  getInteractionPatterns(): InteractionPattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Get improvement suggestions
   */
  getImprovementSuggestions(status?: ImprovementSuggestion['status']): ImprovementSuggestion[] {
    if (status) {
      return this.suggestions.filter(s => s.status === status);
    }
    return [...this.suggestions].sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || b.estimatedImpact - a.estimatedImpact;
    });
  }

  /**
   * Update suggestion status
   */
  async updateSuggestionStatus(suggestionId: string, status: ImprovementSuggestion['status']): Promise<boolean> {
    const suggestion = this.suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      suggestion.status = status;
      await this.saveAnalytics();
      return true;
    }
    return false;
  }

  /**
   * Load analytics from file
   */
  private async loadAnalytics(): Promise<void> {
    try {
      const data = await fs.readFile(this.ANALYTICS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      this.interactions = parsed.interactions || [];
      this.suggestions = parsed.suggestions || [];
      
      // Rebuild patterns map
      if (parsed.patterns) {
        this.patterns = new Map(Object.entries(parsed.patterns));
      }
    } catch (error) {
      // File doesn't exist yet, start fresh
      console.log('No existing analytics found, starting fresh');
    }
  }

  /**
   * Save analytics to file
   */
  private async saveAnalytics(): Promise<void> {
    try {
      const data = {
        interactions: this.interactions,
        patterns: Object.fromEntries(this.patterns),
        suggestions: this.suggestions,
        lastUpdated: Date.now(),
      };
      await fs.writeFile(this.ANALYTICS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving analytics:', error);
    }
  }
}

// Singleton instance
const analyticsService = new UserInteractionAnalyticsService();

export async function initializeUserAnalytics(): Promise<void> {
  await analyticsService.initialize();
}

export function trackUserInteraction(interaction: Omit<UserInteraction, 'id' | 'timestamp'>): Promise<void> {
  return analyticsService.trackInteraction(interaction);
}

export function getMillaSuccessMetrics(): MillaSuccessMetrics {
  return analyticsService.getSuccessMetrics();
}

export function getInteractionPatterns(): InteractionPattern[] {
  return analyticsService.getInteractionPatterns();
}

export function getImprovementSuggestions(status?: ImprovementSuggestion['status']): ImprovementSuggestion[] {
  return analyticsService.getImprovementSuggestions(status);
}

export function updateSuggestionStatus(suggestionId: string, status: ImprovementSuggestion['status']): Promise<boolean> {
  return analyticsService.updateSuggestionStatus(suggestionId, status);
}
