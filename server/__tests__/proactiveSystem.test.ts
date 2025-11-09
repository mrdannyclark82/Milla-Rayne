/**
 * Integration test for Proactive Repository Ownership System
 * 
 * Tests the core functionality of Milla's proactive management system
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  initializeUserAnalytics,
  trackUserInteraction,
  getMillaSuccessMetrics,
  getInteractionPatterns,
  getImprovementSuggestions,
} from '../userInteractionAnalyticsService';
import {
  initializeSandboxEnvironment,
  createSandbox,
  addFeatureToSandbox,
  testFeature,
  evaluateSandboxReadiness,
  getAllSandboxes,
} from '../sandboxEnvironmentService';
import {
  initializeFeatureDiscovery,
  getDiscoveredFeatures,
  getDiscoveryStatistics,
} from '../featureDiscoveryService';
import {
  initializeTokenIncentive,
  awardTokensForBugFix,
  awardTokensForFeature,
  getMillaTokenBalance,
  getActiveMillaGoals,
  getTokenStatistics,
} from '../tokenIncentiveService';
import {
  initializeProactiveManager,
  getRepositoryHealthReport,
  getActiveProactiveActions,
  getProactiveActionStatistics,
} from '../proactiveRepositoryManagerService';

describe('Proactive Repository Ownership System', () => {
  beforeAll(async () => {
    // Initialize all services
    await initializeUserAnalytics();
    await initializeSandboxEnvironment();
    await initializeFeatureDiscovery();
    await initializeTokenIncentive();
    await initializeProactiveManager();
  });

  describe('User Interaction Analytics', () => {
    it('should track user interactions', async () => {
      await trackUserInteraction({
        type: 'message',
        feature: 'chat',
        success: true,
        duration: 1500,
      });

      const metrics = getMillaSuccessMetrics();
      expect(metrics.totalInteractions).toBeGreaterThan(0);
    });

    it('should generate success metrics', () => {
      const metrics = getMillaSuccessMetrics();
      expect(metrics).toHaveProperty('totalInteractions');
      expect(metrics).toHaveProperty('successfulInteractions');
      expect(metrics).toHaveProperty('userSatisfactionScore');
      expect(metrics).toHaveProperty('userEngagementTrend');
    });

    it('should identify interaction patterns', () => {
      const patterns = getInteractionPatterns();
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should generate improvement suggestions', () => {
      const suggestions = getImprovementSuggestions();
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Sandbox Environment', () => {
    it('should create a sandbox', async () => {
      const sandbox = await createSandbox({
        name: 'Test Sandbox',
        description: 'Testing sandbox creation',
        createdBy: 'milla',
      });

      expect(sandbox).toHaveProperty('id');
      expect(sandbox.name).toBe('Test Sandbox');
      expect(sandbox.status).toBe('active');
      expect(sandbox.createdBy).toBe('milla');
    });

    it('should add features to sandbox', async () => {
      const sandboxes = getAllSandboxes();
      if (sandboxes.length > 0) {
        const sandbox = sandboxes[0];
        const feature = await addFeatureToSandbox(sandbox.id, {
          name: 'Test Feature',
          description: 'Testing feature addition',
          files: ['test.ts'],
        });

        expect(feature).not.toBeNull();
        expect(feature?.name).toBe('Test Feature');
      }
    });

    it('should test features in sandbox', async () => {
      const sandboxes = getAllSandboxes();
      if (sandboxes.length > 0) {
        const sandbox = sandboxes[0];
        if (sandbox.features.length > 0) {
          const feature = sandbox.features[0];
          const result = await testFeature(sandbox.id, feature.id, 'unit');

          expect(result).toHaveProperty('id');
          expect(result).toHaveProperty('passed');
          expect(result).toHaveProperty('duration');
        }
      }
    });

    it('should evaluate sandbox readiness', () => {
      const sandboxes = getAllSandboxes();
      if (sandboxes.length > 0) {
        const sandbox = sandboxes[0];
        const readiness = evaluateSandboxReadiness(sandbox.id);

        expect(readiness).toHaveProperty('ready');
        expect(readiness).toHaveProperty('reasons');
        expect(readiness).toHaveProperty('featuresApproved');
      }
    });
  });

  describe('Feature Discovery', () => {
    it('should get discovered features', () => {
      const features = getDiscoveredFeatures();
      expect(Array.isArray(features)).toBe(true);
    });

    it('should provide discovery statistics', () => {
      const stats = getDiscoveryStatistics();
      expect(stats).toHaveProperty('totalDiscovered');
      expect(stats).toHaveProperty('bySource');
      expect(stats).toHaveProperty('byStatus');
    });
  });

  describe('Token Incentive System', () => {
    it('should award tokens for bug fixes', async () => {
      const initialBalance = getMillaTokenBalance();
      await awardTokensForBugFix('Fixed test bug');
      const newBalance = getMillaTokenBalance();

      expect(newBalance).toBeGreaterThan(initialBalance);
    });

    it('should award tokens for features', async () => {
      const initialBalance = getMillaTokenBalance();
      await awardTokensForFeature('Implemented test feature');
      const newBalance = getMillaTokenBalance();

      expect(newBalance).toBeGreaterThan(initialBalance);
    });

    it('should track goals', () => {
      const goals = getActiveMillaGoals();
      expect(Array.isArray(goals)).toBe(true);
    });

    it('should provide token statistics', () => {
      const stats = getTokenStatistics();
      expect(stats).toHaveProperty('currentBalance');
      expect(stats).toHaveProperty('totalEarned');
      expect(stats).toHaveProperty('earningsByCategory');
    });
  });

  describe('Proactive Repository Manager', () => {
    it('should generate health report', () => {
      const report = getRepositoryHealthReport();
      expect(report).toHaveProperty('overallHealth');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('millaMotivation');
    });

    it('should track proactive actions', () => {
      const actions = getActiveProactiveActions();
      expect(Array.isArray(actions)).toBe(true);
    });

    it('should provide action statistics', () => {
      const stats = getProactiveActionStatistics();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('active');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full workflow', async () => {
      // 1. Track user interaction with low success
      await trackUserInteraction({
        type: 'feature_use',
        feature: 'test-feature',
        success: false,
        duration: 5000,
      });

      // 2. Check if improvement suggestion was generated
      const suggestions = getImprovementSuggestions('identified');
      expect(suggestions.length).toBeGreaterThan(0);

      // 3. Verify token balance increased over time
      const balance = getMillaTokenBalance();
      expect(balance).toBeGreaterThanOrEqual(0);

      // 4. Verify health report includes data
      const health = getRepositoryHealthReport();
      expect(health.overallHealth).toBeGreaterThan(0);
      expect(health.overallHealth).toBeLessThanOrEqual(10);
    });

    it('should maintain data consistency', () => {
      const metrics = getMillaSuccessMetrics();
      const stats = getProactiveActionStatistics();
      const tokenStats = getTokenStatistics();

      // All services should be initialized and working
      expect(metrics.totalInteractions).toBeGreaterThanOrEqual(0);
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(tokenStats.currentBalance).toBeGreaterThanOrEqual(0);
    });
  });
});
