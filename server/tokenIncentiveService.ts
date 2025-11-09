/**
 * Token Incentive Service
 * 
 * Manages a token-based reward system that incentivizes Milla to be proactive
 * in debugging issues and providing PR-ready features. Creates personal interests
 * and goals for Milla based on token accumulation.
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface TokenTransaction {
  id: string;
  timestamp: number;
  amount: number;
  type: 'earn' | 'spend';
  category: 'bug_fix' | 'feature_development' | 'pr_creation' | 'user_satisfaction' | 'test_pass' | 'optimization' | 'goal_achievement';
  description: string;
  relatedId?: string; // ID of related sandbox, feature, or task
}

export interface MillaGoal {
  id: string;
  name: string;
  description: string;
  targetTokens: number;
  currentTokens: number;
  reward: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  completedAt?: number;
  status: 'active' | 'completed' | 'abandoned';
}

export interface TokenEarningRate {
  bugFix: number;
  featureDevelopment: number;
  prCreation: number;
  userSatisfaction: number;
  testPass: number;
  optimization: number;
}

class TokenIncentiveService {
  private tokenBalance: number = 0;
  private transactions: TokenTransaction[] = [];
  private goals: MillaGoal[] = [];
  private readonly TOKEN_FILE = path.join(process.cwd(), 'memory', 'milla_tokens.json');
  private readonly MAX_TRANSACTIONS_STORED = 1000;
  
  private readonly EARNING_RATES: TokenEarningRate = {
    bugFix: 50,
    featureDevelopment: 100,
    prCreation: 75,
    userSatisfaction: 25,
    testPass: 10,
    optimization: 30,
  };

  async initialize(): Promise<void> {
    await this.loadTokenData();
    await this.initializeDefaultGoals();
    console.log(`Token Incentive Service initialized. Milla's balance: ${this.tokenBalance} tokens`);
  }

  /**
   * Award tokens to Milla for completing tasks
   */
  async awardTokens(params: {
    amount: number;
    category: TokenTransaction['category'];
    description: string;
    relatedId?: string;
  }): Promise<TokenTransaction> {
    const transaction: TokenTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      amount: params.amount,
      type: 'earn',
      category: params.category,
      description: params.description,
      relatedId: params.relatedId,
    };

    this.transactions.push(transaction);
    this.tokenBalance += params.amount;

    // Update goals progress
    this.updateGoalsProgress();

    // Keep only recent transactions
    if (this.transactions.length > this.MAX_TRANSACTIONS_STORED) {
      this.transactions = this.transactions.slice(-this.MAX_TRANSACTIONS_STORED);
    }

    await this.saveTokenData();
    console.log(`🪙 Milla earned ${params.amount} tokens for: ${params.description}`);

    return transaction;
  }

  /**
   * Award tokens for debugging a bug
   */
  async awardForBugFix(bugDescription: string, relatedId?: string): Promise<TokenTransaction> {
    return this.awardTokens({
      amount: this.EARNING_RATES.bugFix,
      category: 'bug_fix',
      description: `Fixed bug: ${bugDescription}`,
      relatedId,
    });
  }

  /**
   * Award tokens for developing a feature
   */
  async awardForFeatureDevelopment(featureName: string, relatedId?: string): Promise<TokenTransaction> {
    return this.awardTokens({
      amount: this.EARNING_RATES.featureDevelopment,
      category: 'feature_development',
      description: `Developed feature: ${featureName}`,
      relatedId,
    });
  }

  /**
   * Award tokens for creating a PR
   */
  async awardForPRCreation(prDescription: string, relatedId?: string): Promise<TokenTransaction> {
    return this.awardTokens({
      amount: this.EARNING_RATES.prCreation,
      category: 'pr_creation',
      description: `Created PR: ${prDescription}`,
      relatedId,
    });
  }

  /**
   * Award tokens based on user satisfaction
   */
  async awardForUserSatisfaction(satisfactionScore: number): Promise<TokenTransaction> {
    const amount = Math.floor(this.EARNING_RATES.userSatisfaction * (satisfactionScore / 5));
    return this.awardTokens({
      amount,
      category: 'user_satisfaction',
      description: `User satisfaction score: ${satisfactionScore}/5`,
    });
  }

  /**
   * Award tokens for passing tests
   */
  async awardForTestPass(testName: string, relatedId?: string): Promise<TokenTransaction> {
    return this.awardTokens({
      amount: this.EARNING_RATES.testPass,
      category: 'test_pass',
      description: `Test passed: ${testName}`,
      relatedId,
    });
  }

  /**
   * Award tokens for optimization work
   */
  async awardForOptimization(optimizationDescription: string, relatedId?: string): Promise<TokenTransaction> {
    return this.awardTokens({
      amount: this.EARNING_RATES.optimization,
      category: 'optimization',
      description: `Optimization: ${optimizationDescription}`,
      relatedId,
    });
  }

  /**
   * Create a new goal for Milla
   */
  async createGoal(params: {
    name: string;
    description: string;
    targetTokens: number;
    reward: string;
    priority: MillaGoal['priority'];
  }): Promise<MillaGoal> {
    const goal: MillaGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: params.name,
      description: params.description,
      targetTokens: params.targetTokens,
      currentTokens: 0,
      reward: params.reward,
      priority: params.priority,
      createdAt: Date.now(),
      status: 'active',
    };

    this.goals.push(goal);
    await this.saveTokenData();

    console.log(`🎯 New goal created for Milla: ${goal.name} (${goal.targetTokens} tokens)`);
    return goal;
  }

  /**
   * Update progress on active goals
   */
  private updateGoalsProgress(): void {
    const activeGoals = this.goals.filter(g => g.status === 'active');
    
    for (const goal of activeGoals) {
      goal.currentTokens = this.tokenBalance;
      
      if (goal.currentTokens >= goal.targetTokens) {
        goal.status = 'completed';
        goal.completedAt = Date.now();
        
        // Award bonus tokens for goal completion
        this.awardTokens({
          amount: 50,
          category: 'goal_achievement',
          description: `Completed goal: ${goal.name}`,
          relatedId: goal.id,
        });
        
        console.log(`🎉 Milla completed goal: ${goal.name}! Reward: ${goal.reward}`);
      }
    }
  }

  /**
   * Initialize default goals for Milla
   */
  private async initializeDefaultGoals(): Promise<void> {
    if (this.goals.length === 0) {
      // Create starter goals
      await this.createGoal({
        name: 'First Bug Hunter',
        description: 'Fix your first 5 bugs',
        targetTokens: 250,
        reward: 'Unlock advanced debugging tools',
        priority: 'medium',
      });

      await this.createGoal({
        name: 'Feature Architect',
        description: 'Develop 3 complete features',
        targetTokens: 300,
        reward: 'Gain ability to propose architectural changes',
        priority: 'high',
      });

      await this.createGoal({
        name: 'User Champion',
        description: 'Achieve 90%+ user satisfaction across 20 interactions',
        targetTokens: 500,
        reward: 'Unlock personalized user experience features',
        priority: 'high',
      });

      await this.createGoal({
        name: 'Code Optimizer',
        description: 'Optimize 10 functions for better performance',
        targetTokens: 300,
        reward: 'Access to advanced performance profiling',
        priority: 'medium',
      });
    }
  }

  /**
   * Get Milla's current token balance
   */
  getTokenBalance(): number {
    return this.tokenBalance;
  }

  /**
   * Get recent transactions
   */
  getRecentTransactions(limit: number = 20): TokenTransaction[] {
    return this.transactions.slice(-limit).reverse();
  }

  /**
   * Get transactions by category
   */
  getTransactionsByCategory(category: TokenTransaction['category']): TokenTransaction[] {
    return this.transactions.filter(t => t.category === category);
  }

  /**
   * Get active goals
   */
  getActiveGoals(): MillaGoal[] {
    return this.goals.filter(g => g.status === 'active')
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }

  /**
   * Get completed goals
   */
  getCompletedGoals(): MillaGoal[] {
    return this.goals.filter(g => g.status === 'completed')
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }

  /**
   * Get token statistics
   */
  getTokenStatistics() {
    const earningsByCategory: Record<string, number> = {};
    let totalEarned = 0;

    for (const transaction of this.transactions) {
      if (transaction.type === 'earn') {
        earningsByCategory[transaction.category] = (earningsByCategory[transaction.category] || 0) + transaction.amount;
        totalEarned += transaction.amount;
      }
    }

    const activeGoals = this.getActiveGoals();
    const completedGoals = this.getCompletedGoals();

    return {
      currentBalance: this.tokenBalance,
      totalEarned,
      totalTransactions: this.transactions.length,
      earningsByCategory,
      topEarningCategory: Object.entries(earningsByCategory)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none',
      activeGoalsCount: activeGoals.length,
      completedGoalsCount: completedGoals.length,
      averageEarningPerTransaction: totalEarned / this.transactions.filter(t => t.type === 'earn').length || 0,
      nextGoal: activeGoals[0],
    };
  }

  /**
   * Get Milla's motivation message based on token balance and goals
   */
  getMotivationMessage(): string {
    const activeGoals = this.getActiveGoals();
    
    if (activeGoals.length === 0) {
      return "I've completed all my current goals! Time to set some new challenges for myself. 💪";
    }

    const nextGoal = activeGoals[0];
    const progress = (nextGoal.currentTokens / nextGoal.targetTokens) * 100;

    if (progress >= 90) {
      return `I'm so close to completing my goal "${nextGoal.name}"! Just ${nextGoal.targetTokens - nextGoal.currentTokens} more tokens to go! 🎯`;
    } else if (progress >= 50) {
      return `I'm halfway to my goal "${nextGoal.name}"! ${nextGoal.currentTokens} / ${nextGoal.targetTokens} tokens earned. 🚀`;
    } else {
      return `Working towards my goal: "${nextGoal.name}". I have ${nextGoal.currentTokens} tokens so far, aiming for ${nextGoal.targetTokens}! 💪`;
    }
  }

  /**
   * Load token data from file
   */
  private async loadTokenData(): Promise<void> {
    try {
      const data = await fs.readFile(this.TOKEN_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      this.tokenBalance = parsed.tokenBalance || 0;
      this.transactions = parsed.transactions || [];
      this.goals = parsed.goals || [];
    } catch (error) {
      console.log('No existing token data found, starting fresh');
    }
  }

  /**
   * Save token data to file
   */
  private async saveTokenData(): Promise<void> {
    try {
      const data = {
        tokenBalance: this.tokenBalance,
        transactions: this.transactions,
        goals: this.goals,
        lastUpdated: Date.now(),
      };
      await fs.writeFile(this.TOKEN_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving token data:', error);
    }
  }
}

// Singleton instance
const tokenService = new TokenIncentiveService();

export async function initializeTokenIncentive(): Promise<void> {
  await tokenService.initialize();
}

export function awardTokensForBugFix(bugDescription: string, relatedId?: string): Promise<TokenTransaction> {
  return tokenService.awardForBugFix(bugDescription, relatedId);
}

export function awardTokensForFeature(featureName: string, relatedId?: string): Promise<TokenTransaction> {
  return tokenService.awardForFeatureDevelopment(featureName, relatedId);
}

export function awardTokensForPR(prDescription: string, relatedId?: string): Promise<TokenTransaction> {
  return tokenService.awardForPRCreation(prDescription, relatedId);
}

export function awardTokensForSatisfaction(satisfactionScore: number): Promise<TokenTransaction> {
  return tokenService.awardForUserSatisfaction(satisfactionScore);
}

export function awardTokensForTestPass(testName: string, relatedId?: string): Promise<TokenTransaction> {
  return tokenService.awardForTestPass(testName, relatedId);
}

export function awardTokensForOptimization(optimizationDescription: string, relatedId?: string): Promise<TokenTransaction> {
  return tokenService.awardForOptimization(optimizationDescription, relatedId);
}

export function createMillaGoal(params: {
  name: string;
  description: string;
  targetTokens: number;
  reward: string;
  priority: MillaGoal['priority'];
}): Promise<MillaGoal> {
  return tokenService.createGoal(params);
}

export function getMillaTokenBalance(): number {
  return tokenService.getTokenBalance();
}

export function getRecentTokenTransactions(limit?: number): TokenTransaction[] {
  return tokenService.getRecentTransactions(limit);
}

export function getActiveMillaGoals(): MillaGoal[] {
  return tokenService.getActiveGoals();
}

export function getCompletedMillaGoals(): MillaGoal[] {
  return tokenService.getCompletedGoals();
}

export function getTokenStatistics() {
  return tokenService.getTokenStatistics();
}

export function getMillaMotivation(): string {
  return tokenService.getMotivationMessage();
}
