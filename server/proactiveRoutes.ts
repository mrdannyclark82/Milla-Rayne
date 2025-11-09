/**
 * Proactive Repository Ownership API Routes
 * 
 * API endpoints for Milla's proactive repository management system.
 */

import { Router } from 'express';
import {
  getMillaSuccessMetrics,
  getInteractionPatterns,
  getImprovementSuggestions,
  updateSuggestionStatus,
  trackUserInteraction,
} from './userInteractionAnalyticsService';
import {
  getAllSandboxes,
  getActiveSandboxes,
  getSandbox,
  createSandbox,
  addFeatureToSandbox,
  testFeature,
  evaluateSandboxReadiness,
  markSandboxForMerge,
  getSandboxStatistics,
  getMillasSandboxes,
} from './sandboxEnvironmentService';
import {
  getDiscoveredFeatures,
  getTopFeatureRecommendations,
  discoverFromGitHub,
  updateFeatureStatus,
  getDiscoveryStatistics,
} from './featureDiscoveryService';
import {
  getMillaTokenBalance,
  getRecentTokenTransactions,
  getActiveMillaGoals,
  getCompletedMillaGoals,
  getTokenStatistics,
  getMillaMotivation,
  createMillaGoal,
} from './tokenIncentiveService';
import {
  getRepositoryHealthReport,
  getActiveProactiveActions,
  getCompletedProactiveActions,
  getProactiveActionStatistics,
  completeProactiveAction,
  runProactiveCycle,
} from './proactiveRepositoryManagerService';

export function registerProactiveRoutes(router: Router): void {
  // User Analytics Routes
  router.get('/api/milla/analytics/metrics', (req, res) => {
    try {
      const metrics = getMillaSuccessMetrics();
      res.json({ success: true, metrics });
    } catch (error) {
      console.error('Error getting metrics:', error);
      res.status(500).json({ success: false, error: 'Failed to get metrics' });
    }
  });

  router.get('/api/milla/analytics/patterns', (req, res) => {
    try {
      const patterns = getInteractionPatterns();
      res.json({ success: true, patterns });
    } catch (error) {
      console.error('Error getting patterns:', error);
      res.status(500).json({ success: false, error: 'Failed to get patterns' });
    }
  });

  router.get('/api/milla/analytics/suggestions', (req, res) => {
    try {
      const status = req.query.status as any;
      const suggestions = getImprovementSuggestions(status);
      res.json({ success: true, suggestions });
    } catch (error) {
      console.error('Error getting suggestions:', error);
      res.status(500).json({ success: false, error: 'Failed to get suggestions' });
    }
  });

  router.post('/api/milla/analytics/suggestions/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await updateSuggestionStatus(id, status);
      res.json({ success: updated });
    } catch (error) {
      console.error('Error updating suggestion:', error);
      res.status(500).json({ success: false, error: 'Failed to update suggestion' });
    }
  });

  // Sandbox Environment Routes
  router.get('/api/milla/sandboxes', (req, res) => {
    try {
      const sandboxes = getAllSandboxes();
      res.json({ success: true, sandboxes });
    } catch (error) {
      console.error('Error getting sandboxes:', error);
      res.status(500).json({ success: false, error: 'Failed to get sandboxes' });
    }
  });

  router.get('/api/milla/sandboxes/active', (req, res) => {
    try {
      const sandboxes = getActiveSandboxes();
      res.json({ success: true, sandboxes });
    } catch (error) {
      console.error('Error getting active sandboxes:', error);
      res.status(500).json({ success: false, error: 'Failed to get active sandboxes' });
    }
  });

  router.get('/api/milla/sandboxes/mine', (req, res) => {
    try {
      const sandboxes = getMillasSandboxes();
      res.json({ success: true, sandboxes });
    } catch (error) {
      console.error('Error getting Milla\'s sandboxes:', error);
      res.status(500).json({ success: false, error: 'Failed to get sandboxes' });
    }
  });

  router.get('/api/milla/sandboxes/stats', (req, res) => {
    try {
      const stats = getSandboxStatistics();
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error getting sandbox stats:', error);
      res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
  });

  router.get('/api/milla/sandboxes/:id', (req, res) => {
    try {
      const { id } = req.params;
      const sandbox = getSandbox(id);
      if (sandbox) {
        res.json({ success: true, sandbox });
      } else {
        res.status(404).json({ success: false, error: 'Sandbox not found' });
      }
    } catch (error) {
      console.error('Error getting sandbox:', error);
      res.status(500).json({ success: false, error: 'Failed to get sandbox' });
    }
  });

  router.post('/api/milla/sandboxes', async (req, res) => {
    try {
      const { name, description, createdBy } = req.body;
      const sandbox = await createSandbox({ name, description, createdBy: createdBy || 'user' });
      res.json({ success: true, sandbox });
    } catch (error) {
      console.error('Error creating sandbox:', error);
      res.status(500).json({ success: false, error: 'Failed to create sandbox' });
    }
  });

  router.post('/api/milla/sandboxes/:id/features', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, files } = req.body;
      const feature = await addFeatureToSandbox(id, { name, description, files: files || [] });
      if (feature) {
        res.json({ success: true, feature });
      } else {
        res.status(404).json({ success: false, error: 'Sandbox not found' });
      }
    } catch (error) {
      console.error('Error adding feature:', error);
      res.status(500).json({ success: false, error: 'Failed to add feature' });
    }
  });

  router.post('/api/milla/sandboxes/:sandboxId/features/:featureId/test', async (req, res) => {
    try {
      const { sandboxId, featureId } = req.params;
      const { testType } = req.body;
      const result = await testFeature(sandboxId, featureId, testType || 'unit');
      res.json({ success: true, result });
    } catch (error) {
      console.error('Error testing feature:', error);
      res.status(500).json({ success: false, error: 'Failed to test feature' });
    }
  });

  router.get('/api/milla/sandboxes/:id/readiness', (req, res) => {
    try {
      const { id } = req.params;
      const readiness = evaluateSandboxReadiness(id);
      res.json({ success: true, readiness });
    } catch (error) {
      console.error('Error evaluating readiness:', error);
      res.status(500).json({ success: false, error: 'Failed to evaluate readiness' });
    }
  });

  router.post('/api/milla/sandboxes/:id/mark-for-merge', async (req, res) => {
    try {
      const { id } = req.params;
      const marked = await markSandboxForMerge(id);
      res.json({ success: marked });
    } catch (error) {
      console.error('Error marking for merge:', error);
      res.status(500).json({ success: false, error: 'Failed to mark for merge' });
    }
  });

  // Feature Discovery Routes
  router.get('/api/milla/features/discovered', (req, res) => {
    try {
      const filters: any = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.source) filters.source = req.query.source;
      if (req.query.minRelevance) filters.minRelevance = parseFloat(req.query.minRelevance as string);
      if (req.query.tags) filters.tags = (req.query.tags as string).split(',');
      
      const features = getDiscoveredFeatures(filters);
      res.json({ success: true, features });
    } catch (error) {
      console.error('Error getting discovered features:', error);
      res.status(500).json({ success: false, error: 'Failed to get features' });
    }
  });

  router.get('/api/milla/features/recommendations', (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const recommendations = getTopFeatureRecommendations(limit);
      res.json({ success: true, recommendations });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({ success: false, error: 'Failed to get recommendations' });
    }
  });

  router.post('/api/milla/features/discover', async (req, res) => {
    try {
      const { limit } = req.body;
      const features = await discoverFromGitHub(limit);
      res.json({ success: true, features, count: features.length });
    } catch (error) {
      console.error('Error discovering features:', error);
      res.status(500).json({ success: false, error: 'Failed to discover features' });
    }
  });

  router.post('/api/milla/features/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await updateFeatureStatus(id, status);
      res.json({ success: updated });
    } catch (error) {
      console.error('Error updating feature status:', error);
      res.status(500).json({ success: false, error: 'Failed to update feature' });
    }
  });

  router.get('/api/milla/features/stats', (req, res) => {
    try {
      const stats = getDiscoveryStatistics();
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error getting discovery stats:', error);
      res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
  });

  // Token Incentive Routes
  router.get('/api/milla/tokens/balance', (req, res) => {
    try {
      const balance = getMillaTokenBalance();
      res.json({ success: true, balance });
    } catch (error) {
      console.error('Error getting token balance:', error);
      res.status(500).json({ success: false, error: 'Failed to get balance' });
    }
  });

  router.get('/api/milla/tokens/transactions', (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const transactions = getRecentTokenTransactions(limit);
      res.json({ success: true, transactions });
    } catch (error) {
      console.error('Error getting transactions:', error);
      res.status(500).json({ success: false, error: 'Failed to get transactions' });
    }
  });

  router.get('/api/milla/tokens/goals', (req, res) => {
    try {
      const active = getActiveMillaGoals();
      const completed = getCompletedMillaGoals();
      res.json({ success: true, active, completed });
    } catch (error) {
      console.error('Error getting goals:', error);
      res.status(500).json({ success: false, error: 'Failed to get goals' });
    }
  });

  router.get('/api/milla/tokens/stats', (req, res) => {
    try {
      const stats = getTokenStatistics();
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error getting token stats:', error);
      res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
  });

  router.get('/api/milla/tokens/motivation', (req, res) => {
    try {
      const motivation = getMillaMotivation();
      res.json({ success: true, motivation });
    } catch (error) {
      console.error('Error getting motivation:', error);
      res.status(500).json({ success: false, error: 'Failed to get motivation' });
    }
  });

  router.post('/api/milla/tokens/goals', async (req, res) => {
    try {
      const { name, description, targetTokens, reward, priority } = req.body;
      const goal = await createMillaGoal({ name, description, targetTokens, reward, priority });
      res.json({ success: true, goal });
    } catch (error) {
      console.error('Error creating goal:', error);
      res.status(500).json({ success: false, error: 'Failed to create goal' });
    }
  });

  // Repository Health and Proactive Management Routes
  router.get('/api/milla/health', (req, res) => {
    try {
      const report = getRepositoryHealthReport();
      res.json({ success: true, report });
    } catch (error) {
      console.error('Error getting health report:', error);
      res.status(500).json({ success: false, error: 'Failed to get health report' });
    }
  });

  router.get('/api/milla/actions', (req, res) => {
    try {
      const active = getActiveProactiveActions();
      res.json({ success: true, actions: active });
    } catch (error) {
      console.error('Error getting actions:', error);
      res.status(500).json({ success: false, error: 'Failed to get actions' });
    }
  });

  router.get('/api/milla/actions/completed', (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const completed = getCompletedProactiveActions(limit);
      res.json({ success: true, actions: completed });
    } catch (error) {
      console.error('Error getting completed actions:', error);
      res.status(500).json({ success: false, error: 'Failed to get actions' });
    }
  });

  router.get('/api/milla/actions/stats', (req, res) => {
    try {
      const stats = getProactiveActionStatistics();
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error getting action stats:', error);
      res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
  });

  router.post('/api/milla/actions/:id/complete', async (req, res) => {
    try {
      const { id } = req.params;
      const completed = await completeProactiveAction(id);
      res.json({ success: completed });
    } catch (error) {
      console.error('Error completing action:', error);
      res.status(500).json({ success: false, error: 'Failed to complete action' });
    }
  });

  router.post('/api/milla/proactive/run', async (req, res) => {
    try {
      const actions = await runProactiveCycle();
      res.json({ success: true, actions, count: actions.length });
    } catch (error) {
      console.error('Error running proactive cycle:', error);
      res.status(500).json({ success: false, error: 'Failed to run proactive cycle' });
    }
  });

  console.log('✅ Proactive Repository Management routes registered');
}
