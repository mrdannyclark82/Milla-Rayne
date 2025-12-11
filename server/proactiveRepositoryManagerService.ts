/**
 * Proactive Repository Manager Service
 *
 * Central coordination service that makes Milla proactive in maintaining and improving the repository.
 * Integrates user analytics, feature discovery, sandbox testing, and token incentives.
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  getMillaSuccessMetrics,
  getInteractionPatterns,
  getImprovementSuggestions,
  updateSuggestionStatus,
} from './userInteractionAnalyticsService';
import {
  discoverFromGitHub,
  discoverFromUserPatterns,
  getTopFeatureRecommendations,
  updateFeatureStatus,
} from './featureDiscoveryService';
import {
  createSandbox,
  addFeatureToSandbox,
  testFeature,
  evaluateSandboxReadiness,
  getActiveSandboxes,
  getSandboxStatistics,
} from './sandboxEnvironmentService';
import {
  awardTokensForBugFix,
  awardTokensForFeature,
  awardTokensForPR,
  awardTokensForTestPass,
  getMillaTokenBalance,
  getActiveMillaGoals,
  getMillaMotivation,
  getTokenStatistics,
} from './tokenIncentiveService';
import { codingAgent } from './agents/codingAgent';
import { config } from './config';

export enum ProactiveActionType {
  BugFix = 'bug_fix',
  FeatureProposal = 'feature_proposal',
  Optimization = 'optimization',
  SandboxCreation = 'sandbox_creation',
  PrPreparation = 'pr_preparation',
  UserEngagement = 'user_engagement',
  AutonomousFix = 'autonomous_fix',
}

export interface Suggestion {
  id: string;
  type: 'bug_fix' | 'optimization';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: number;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  relevance: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  estimatedValue: number;
}

export interface ProactiveAction {
  id: string;
  timestamp: number;
  type: ProactiveActionType;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: number; // 1-10 scale
  tokensEarned?: number;
  completedAt?: number;
  relatedIds?: string[];
}

export interface RepositoryHealthReport {
  timestamp: number;
  overallHealth: number; // 1-10 scale
  metrics: {
    userSatisfaction: number;
    codeQuality: number;
    featureCompletion: number;
    testCoverage: number;
    responseTime: number;
  };
  activeIssues: number;
  pendingImprovements: number;
  activeSandboxes: number;
  millaMotivation: string;
  recommendations: string[];
}

class ProactiveRepositoryManagerService {
  private actions: ProactiveAction[] = [];
  private readonly ACTIONS_FILE = path.join(
    process.cwd(),
    'memory',
    'proactive_actions.json'
  );
  private readonly CHECK_INTERVAL = config.proactiveRepoManager.checkInterval;
  private lastCheck: number = 0;
  private isProcessing: boolean = false;

  async initialize(): Promise<void> {
    await this.loadActions();
    this.scheduleProactiveChecks();
    console.log('Proactive Repository Manager initialized');
  }

  /**
   * Main proactive cycle - analyzes repository and takes action
   */
  async runProactiveCycle(): Promise<ProactiveAction[]> {
    if (this.isProcessing) {
      console.log('Proactive cycle already in progress, skipping...');
      return [];
    }

    this.isProcessing = true;
    console.log('🤖 Starting proactive repository management cycle...');

    try {
      const newActions: ProactiveAction[] = [];

      const interactionActions = await this._analyzeUserInteractions();
      newActions.push(...interactionActions);

      const featureActions = await this._discoverAndEvaluateFeatures();
      newActions.push(...featureActions);

      const sandboxActions = await this._checkSandboxes();
      newActions.push(...sandboxActions);

      const engagementActions = await this._createUserEngagementActions();
      newActions.push(...engagementActions);

      if (config.enableAutonomousCodeImprovement) {
        const autonomousActions = await this._runAutonomousCodeImprovements();
        newActions.push(...autonomousActions);
      }

      console.log(
        `✅ Proactive cycle complete. Created ${newActions.length} new actions.`
      );
      this.actions.push(...newActions);
      await this.saveActions();

      return newActions;
    } finally {
      this.isProcessing = false;
    }
  }

  private async _analyzeUserInteractions(): Promise<ProactiveAction[]> {
    const newActions: ProactiveAction[] = [];
    const suggestions = getImprovementSuggestions('identified');
    console.log(
      `📊 Found ${suggestions.length} improvement opportunities from user interactions`
    );

    for (const suggestion of suggestions.slice(
      0,
      config.proactiveRepoManager.suggestionsSlice
    )) {
      const action = await this.createActionFromSuggestion(suggestion);
      if (action) {
        newActions.push(action);
      }
    }
    return newActions;
  }

  private async _discoverAndEvaluateFeatures(): Promise<ProactiveAction[]> {
    const newActions: ProactiveAction[] = [];
    if (Date.now() - this.lastCheck > config.proactiveRepoManager.featureDiscoveryInterval) {
      // Once per day
      console.log('🔍 Discovering new features from GitHub...');
      const patterns = getInteractionPatterns();
      await discoverFromGitHub(5);
      await discoverFromUserPatterns(patterns);
      this.lastCheck = Date.now();
    }

    const topFeatures = getTopFeatureRecommendations(
      config.proactiveRepoManager.topFeatureRecommendations
    );
    for (const feature of topFeatures) {
      if (
        feature.relevance >= config.proactiveRepoManager.featureRelevanceThreshold &&
        feature.implementationComplexity !== 'high'
      ) {
        const action = await this.createActionForFeature(feature);
        if (action) {
          newActions.push(action);
        }
      }
    }
    return newActions;
  }

  private async _checkSandboxes(): Promise<ProactiveAction[]> {
    const newActions: ProactiveAction[] = [];
    const activeSandboxes = getActiveSandboxes();
    for (const sandbox of activeSandboxes) {
      for (const feature of sandbox.features) {
        if (feature.status === 'draft' || feature.status === 'testing') {
          const testResult = await testFeature(sandbox.id, feature.id, 'unit');
          if (testResult.passed) {
            await awardTokensForTestPass(
              `${feature.name} in ${sandbox.name}`,
              feature.id
            );
          }
        }
      }

      const readiness = evaluateSandboxReadiness(sandbox.id);
      if (readiness.ready) {
        const action = await this.createPRPreparationAction(sandbox);
        if (action) {
          newActions.push(action);
        }
      }
    }
    return newActions;
  }

  private async _createUserEngagementActions(): Promise<ProactiveAction[]> {
    const newActions: ProactiveAction[] = [];
    const metrics = getMillaSuccessMetrics();
    if (metrics.userEngagementTrend === 'decreasing') {
      const action = await this.createUserEngagementAction();
      if (action) {
        newActions.push(action);
      }
    }
    return newActions;
  }

  private async _runAutonomousCodeImprovements(): Promise<ProactiveAction[]> {
    const newActions: ProactiveAction[] = [];
    console.log('🔧 Running autonomous code improvement analysis...');
    try {
      const repositoryPath = process.cwd();
      const result = await codingAgent.performAutomatedFixLifecycle({
        repositoryPath,
        issueSource: 'proactive_cycle',
      });

      if (result.success) {
        const action: ProactiveAction = {
          id: `action_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          timestamp: Date.now(),
          type: ProactiveActionType.AutonomousFix,
          description: `Autonomous code improvement: ${result.message}`,
          status: 'completed',
          priority: 'medium',
          estimatedImpact: 7,
          completedAt: Date.now(),
          relatedIds: result.sandboxId ? [result.sandboxId] : [],
        };

        if (result.prUrl) {
          const tokenReward = await awardTokensForPR(
            `Autonomous fix: ${result.message}`,
            action.id
          );
          action.tokensEarned = tokenReward.amount;
        }

        newActions.push(action);
        console.log(
          `✅ Autonomous code improvement completed: ${result.message}`
        );
      } else {
        console.log(
          `ℹ️ Autonomous code improvement result: ${result.message}`
        );
      }
    } catch (error) {
      console.error('Error in autonomous code improvement:', error);
    }
    return newActions;
  }

  /**
   * Create action from improvement suggestion
   */
  private async createActionFromSuggestion(
    suggestion: Suggestion
  ): Promise<ProactiveAction | null> {
    // Check if action already exists for this suggestion
    const existing = this.actions.find(
      (a) => a.relatedIds?.includes(suggestion.id) && a.status !== 'completed'
    );
    if (existing) {
      return null;
    }

    const action: ProactiveAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: suggestion.type === 'bug_fix' ? ProactiveActionType.BugFix : ProactiveActionType.Optimization,
      description: suggestion.description,
      status: 'planned',
      priority: suggestion.priority,
      estimatedImpact: suggestion.estimatedImpact,
      relatedIds: [suggestion.id],
    };

    // Create sandbox for this improvement
    const sandbox = await createSandbox({
      name: `Fix: ${suggestion.description.substring(0, 50)}`,
      description: suggestion.description,
      createdBy: 'milla',
    });

    action.relatedIds!.push(sandbox.id);
    console.log(`📝 Created action: ${action.description}`);

    return action;
  }

  /**
   * Create action for discovered feature
   */
  private async createActionForFeature(
    feature: Feature
  ): Promise<ProactiveAction | null> {
    const existing = this.actions.find(
      (a) => a.relatedIds?.includes(feature.id) && a.status !== 'completed'
    );
    if (existing) {
      return null;
    }

    const action: ProactiveAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: ProactiveActionType.FeatureProposal,
      description: `Implement feature: ${feature.name}`,
      status: 'planned',
      priority: feature.estimatedValue >= 8 ? 'high' : 'medium',
      estimatedImpact: feature.estimatedValue,
      relatedIds: [feature.id],
    };

    // Create sandbox for this feature
    const sandbox = await createSandbox({
      name: feature.name,
      description: feature.description,
      createdBy: 'milla',
    });

    await addFeatureToSandbox(sandbox.id, {
      name: feature.name,
      description: feature.description,
      files: [],
    });

    action.relatedIds!.push(sandbox.id);
    await updateFeatureStatus(feature.id, 'in_sandbox');

    console.log(`💡 Created feature action: ${feature.name}`);
    return action;
  }

  /**
   * Create PR preparation action
   */
  private async createPRPreparationAction(
    sandbox: any
  ): Promise<ProactiveAction | null> {
    const existing = this.actions.find(
      (a) =>
        a.relatedIds?.includes(sandbox.id) &&
        a.type === ProactiveActionType.PrPreparation &&
        a.status !== 'completed'
    );
    if (existing) {
      return null;
    }

    const action: ProactiveAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: ProactiveActionType.PrPreparation,
      description: `Prepare PR for sandbox: ${sandbox.name}`,
      status: 'planned',
      priority: 'high',
      estimatedImpact: 8,
      relatedIds: [sandbox.id],
    };

    console.log(`📦 Sandbox ready for PR: ${sandbox.name}`);
    return action;
  }

  /**
   * Create user engagement action
   */
  private async createUserEngagementAction(): Promise<ProactiveAction | null> {
    const action: ProactiveAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: ProactiveActionType.UserEngagement,
      description: 'Improve user engagement with proactive features',
      status: 'planned',
      priority: 'high',
      estimatedImpact: 9,
    };

    console.log('👥 Created user engagement improvement action');
    return action;
  }

  /**
   * Complete an action and award tokens
   */
  async completeAction(actionId: string): Promise<boolean> {
    const action = this.actions.find((a) => a.id === actionId);
    if (!action) {
      return false;
    }

    action.status = 'completed';
    action.completedAt = Date.now();

    // Award tokens based on action type
    let tokensEarned = 0;
    switch (action.type) {
      case ProactiveActionType.BugFix:
        const bugReward = await awardTokensForBugFix(
          action.description,
          actionId
        );
        tokensEarned = bugReward.amount;
        break;
      case ProactiveActionType.FeatureProposal:
        const featureReward = await awardTokensForFeature(
          action.description,
          actionId
        );
        tokensEarned = featureReward.amount;
        break;
      case ProactiveActionType.PrPreparation:
        const prReward = await awardTokensForPR(action.description, actionId);
        tokensEarned = prReward.amount;
        break;
      case ProactiveActionType.AutonomousFix:
        const autonomousReward = await awardTokensForBugFix(action.description, actionId);
        tokensEarned = autonomousReward.amount;
        break;
      case ProactiveActionType.Optimization:
        tokensEarned = config.proactiveRepoManager.optimizationTokenAward;
        break;
    }

    action.tokensEarned = tokensEarned;
    await this.saveActions();

    console.log(
      `✅ Completed action: ${action.description} (earned ${tokensEarned} tokens)`
    );
    return true;
  }

  /**
   * Generate repository health report
   */
  generateHealthReport(): RepositoryHealthReport {
    const metrics = getMillaSuccessMetrics();
    const suggestions = getImprovementSuggestions('identified');
    const sandboxStats = getSandboxStatistics();
    const tokenStats = getTokenStatistics();

    // Calculate overall health score
    const userSatScore = metrics.userSatisfactionScore * 2; // 0-10
    const successRateScore =
      (metrics.successfulInteractions / metrics.totalInteractions) * 10;
    const responseScore = Math.max(0, 10 - metrics.averageResponseTime / 1000);
    const engagementScore =
      metrics.userEngagementTrend === 'increasing'
        ? 9
        : metrics.userEngagementTrend === 'stable'
          ? 7
          : 5;

    const overallHealth =
      (userSatScore + successRateScore + responseScore + engagementScore) / 4;

    const recommendations: string[] = [];

    if (metrics.userSatisfactionScore < 4) {
      recommendations.push(
        'Focus on improving user satisfaction through better responses and features'
      );
    }

    if (metrics.averageResponseTime > 3000) {
      recommendations.push('Optimize response time for better user experience');
    }

    if (suggestions.length > 10) {
      recommendations.push(
        `Address ${suggestions.length} pending improvement suggestions`
      );
    }

    if (sandboxStats.active === 0) {
      recommendations.push('Create new sandboxes to test upcoming features');
    }

    if (metrics.userEngagementTrend === 'decreasing') {
      recommendations.push(
        'Implement user engagement strategies to increase interaction'
      );
    }

    return {
      timestamp: Date.now(),
      overallHealth,
      metrics: {
        userSatisfaction: userSatScore,
        codeQuality: successRateScore,
        featureCompletion: Math.min(10, sandboxStats.merged),
        testCoverage: Math.min(10, sandboxStats.approvedFeatures),
        responseTime: responseScore,
      },
      activeIssues: metrics.errorsEncountered,
      pendingImprovements: suggestions.length,
      activeSandboxes: sandboxStats.active,
      millaMotivation: getMillaMotivation(),
      recommendations,
    };
  }

  /**
   * Get active actions
   */
  getActiveActions(): ProactiveAction[] {
    return this.actions
      .filter((a) => a.status === 'planned' || a.status === 'in_progress')
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (
          priorityOrder[b.priority] - priorityOrder[a.priority] ||
          b.estimatedImpact - a.estimatedImpact
        );
      });
  }

  /**
   * Get completed actions
   */
  getCompletedActions(limit: number = 20): ProactiveAction[] {
    return this.actions
      .filter((a) => a.status === 'completed')
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
      .slice(0, limit);
  }

  /**
   * Get action statistics
   */
  getActionStatistics() {
    const total = this.actions.length;
    const completed = this.actions.filter(
      (a) => a.status === 'completed'
    ).length;
    const active = this.actions.filter(
      (a) => a.status === 'planned' || a.status === 'in_progress'
    ).length;
    const blocked = this.actions.filter((a) => a.status === 'blocked').length;

    const totalTokensEarned = this.actions
      .filter((a) => a.tokensEarned)
      .reduce((sum, a) => sum + (a.tokensEarned || 0), 0);

    return {
      total,
      completed,
      active,
      blocked,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      totalTokensEarned,
      averageImpact:
        this.actions.reduce((sum, a) => sum + a.estimatedImpact, 0) / total ||
        0,
      byType: {
        bugFix: this.actions.filter(a => a.type === ProactiveActionType.BugFix).length,
        featureProposal: this.actions.filter(a => a.type === ProactiveActionType.FeatureProposal).length,
        optimization: this.actions.filter(a => a.type === ProactiveActionType.Optimization).length,
        sandboxCreation: this.actions.filter(a => a.type === ProactiveActionType.SandboxCreation).length,
        prPreparation: this.actions.filter(a => a.type === ProactiveActionType.PrPreparation).length,
        userEngagement: this.actions.filter(a => a.type === ProactiveActionType.UserEngagement).length,
        autonomousFix: this.actions.filter(a => a.type === ProactiveActionType.AutonomousFix).length,
      },
    };
  }

  /**
   * Schedule periodic proactive checks
   */
  private scheduleProactiveChecks(): void {
    setInterval(async () => {
      try {
        await this.runProactiveCycle();
      } catch (error) {
        console.error('Error in proactive cycle:', error);
      }
    }, this.CHECK_INTERVAL);

    // Run initial check after 1 minute
    setTimeout(async () => {
      await this.runProactiveCycle();
    }, config.proactiveRepoManager.initialCheckTimeout);
  }

  /**
   * Load actions from file
   */
  private async loadActions(): Promise<void> {
    try {
      const data = await fs.readFile(this.ACTIONS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      this.actions = parsed.actions || [];
      this.lastCheck = parsed.lastCheck || 0;
    } catch (error) {
      console.log('No existing actions found, starting fresh');
    }
  }

  /**
   * Save actions to file
   */
  private async saveActions(): Promise<void> {
    try {
      const data = {
        actions: this.actions,
        lastCheck: this.lastCheck,
        lastUpdated: Date.now(),
      };
      await fs.writeFile(this.ACTIONS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving actions:', error);
    }
  }
}

// Singleton instance
const managerService = new ProactiveRepositoryManagerService();

export async function initializeProactiveManager(): Promise<void> {
  await managerService.initialize();
}

export function runProactiveCycle(): Promise<ProactiveAction[]> {
  return managerService.runProactiveCycle();
}

export function completeProactiveAction(actionId: string): Promise<boolean> {
  return managerService.completeAction(actionId);
}

export function getRepositoryHealthReport(): RepositoryHealthReport {
  return managerService.generateHealthReport();
}

export function getActiveProactiveActions(): ProactiveAction[] {
  return managerService.getActiveActions();
}

export function getCompletedProactiveActions(
  limit?: number
): ProactiveAction[] {
  return managerService.getCompletedActions(limit);
}

export function getProactiveActionStatistics() {
  return managerService.getActionStatistics();
}
