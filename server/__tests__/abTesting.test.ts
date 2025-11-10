import { describe, it, expect, beforeAll } from 'vitest';
import {
  initializeABTesting,
  createPersonalityVariant,
  getActivePersonalityVariants,
  assignUserToTestGroup,
  getUserPersonalityVariant,
  getPromptModificationsForUser,
  trackUserInteraction,
  getVariantMetrics,
  getAllVariantMetrics,
  createABTest,
  getActiveABTests,
  analyzeABTestResults,
  getABTestingStatistics,
} from '../abTestingService';
import { applyPersonalityVariant, getVariantInfo, createVariantPrompt } from '../personalityPromptHelper';

describe('A/B Testing Service - Adaptive Personality', () => {
  beforeAll(async () => {
    await initializeABTesting();
  });

  describe('Personality Variants', () => {
    it('should have default variants initialized', () => {
      const variants = getActivePersonalityVariants();
      
      expect(variants.length).toBeGreaterThan(0);
      expect(variants.some(v => v.name.includes('Control'))).toBe(true);
      expect(variants.some(v => v.name.includes('Empathetic'))).toBe(true);
    });

    it('should create a new personality variant', () => {
      const variant = createPersonalityVariant({
        name: 'Test Variant',
        description: 'A test personality variant',
        promptModifications: {
          toneAdjustments: 'Be more formal',
        },
        active: true,
      });

      expect(variant).toBeDefined();
      expect(variant.id).toMatch(/^variant_/);
      expect(variant.name).toBe('Test Variant');
      expect(variant.promptModifications.toneAdjustments).toBe('Be more formal');
    });

    it('should get active variants', () => {
      const activeVariants = getActivePersonalityVariants();
      
      expect(activeVariants.length).toBeGreaterThan(0);
      expect(activeVariants.every(v => v.active)).toBe(true);
    });
  });

  describe('User Assignment', () => {
    it('should assign user to a variant', () => {
      const userId = 'test_user_1';
      const assignment = assignUserToTestGroup(userId);
      
      expect(assignment).toBeDefined();
      expect(assignment.userId).toBe(userId);
      expect(assignment.variantId).toBeDefined();
      expect(assignment.assignedAt).toBeLessThanOrEqual(Date.now());
      expect(assignment.interactionCount).toBe(0);
    });

    it('should return same assignment for same user', () => {
      const userId = 'test_user_2';
      const assignment1 = assignUserToTestGroup(userId);
      const assignment2 = assignUserToTestGroup(userId);
      
      expect(assignment1.variantId).toBe(assignment2.variantId);
      expect(assignment1.assignedAt).toBe(assignment2.assignedAt);
    });

    it('should assign user to specific variant', () => {
      const userId = 'test_user_3';
      const variants = getActivePersonalityVariants();
      const targetVariant = variants[0];
      
      const assignment = assignUserToTestGroup(userId, targetVariant.id);
      
      expect(assignment.variantId).toBe(targetVariant.id);
    });

    it('should get user variant', () => {
      const userId = 'test_user_4';
      assignUserToTestGroup(userId);
      
      const variant = getUserPersonalityVariant(userId);
      
      expect(variant).toBeDefined();
      expect(variant?.id).toBeDefined();
      expect(variant?.name).toBeDefined();
    });

    it('should return null for unassigned user', () => {
      const variant = getUserPersonalityVariant('nonexistent_user');
      
      expect(variant).toBeNull();
    });
  });

  describe('Prompt Modifications', () => {
    it('should get prompt modifications for user', () => {
      const userId = 'test_user_5';
      const variants = getActivePersonalityVariants();
      const variantWithMods = variants.find(v => 
        Object.keys(v.promptModifications).length > 0
      );
      
      if (variantWithMods) {
        assignUserToTestGroup(userId, variantWithMods.id);
        const modifications = getPromptModificationsForUser(userId);
        
        expect(modifications).toBeDefined();
      }
    });

    it('should apply personality variant to prompt', () => {
      const userId = 'test_user_6';
      const basePrompt = 'You are a helpful assistant.';
      
      // Assign to variant with modifications
      const variants = getActivePersonalityVariants();
      const variantWithMods = variants.find(v => 
        v.promptModifications.toneAdjustments
      );
      
      if (variantWithMods) {
        assignUserToTestGroup(userId, variantWithMods.id);
        const modifiedPrompt = applyPersonalityVariant(basePrompt, userId);
        
        expect(modifiedPrompt).toContain(basePrompt);
        expect(modifiedPrompt.length).toBeGreaterThan(basePrompt.length);
      }
    });

    it('should return original prompt for control group', () => {
      const userId = 'test_user_7';
      const basePrompt = 'You are a helpful assistant.';
      
      // Assign to control variant (no modifications)
      const controlVariant = getActivePersonalityVariants().find(v => 
        v.name.includes('Control')
      );
      
      if (controlVariant) {
        assignUserToTestGroup(userId, controlVariant.id);
        const modifiedPrompt = applyPersonalityVariant(basePrompt, userId);
        
        expect(modifiedPrompt).toBe(basePrompt);
      }
    });

    it('should create variant prompt with tracking', () => {
      const userId = 'test_user_8';
      const basePrompt = 'You are a helpful assistant.';
      
      const variants = getActivePersonalityVariants();
      const variantWithMods = variants.find(v => 
        Object.keys(v.promptModifications).length > 0
      );
      
      if (variantWithMods) {
        assignUserToTestGroup(userId, variantWithMods.id);
        const result = createVariantPrompt(basePrompt, userId, true);
        
        expect(result.prompt).toBeDefined();
        expect(result.hasModifications).toBe(true);
      }
    });

    it('should get variant info', () => {
      const userId = 'test_user_9';
      assignUserToTestGroup(userId);
      
      const info = getVariantInfo(userId);
      
      expect(info.hasVariant).toBe(true);
    });
  });

  describe('Interaction Tracking', () => {
    it('should track user interactions', () => {
      const userId = 'test_user_10';
      const assignment = assignUserToTestGroup(userId);
      
      trackUserInteraction(userId, 500);
      trackUserInteraction(userId, 600);
      trackUserInteraction(userId, 550);
      
      const metrics = getVariantMetrics(assignment.variantId);
      
      expect(metrics).toBeDefined();
      expect(metrics?.totalInteractions).toBeGreaterThanOrEqual(3);
    });

    it('should update variant metrics', () => {
      const userId = 'test_user_11';
      const assignment = assignUserToTestGroup(userId);
      
      // Track multiple interactions
      for (let i = 0; i < 5; i++) {
        trackUserInteraction(userId, 500 + i * 10);
      }
      
      const metrics = getVariantMetrics(assignment.variantId);
      
      expect(metrics?.averageResponseTime).toBeGreaterThan(0);
      expect(metrics?.totalUsers).toBeGreaterThan(0);
    });

    it('should get all variant metrics', () => {
      const allMetrics = getAllVariantMetrics();
      
      expect(allMetrics).toBeDefined();
      expect(Object.keys(allMetrics).length).toBeGreaterThan(0);
    });
  });

  describe('A/B Tests', () => {
    it('should create an A/B test', () => {
      const variants = getActivePersonalityVariants().slice(0, 2);
      
      const test = createABTest({
        name: 'Personality Test 1',
        description: 'Testing empathy vs efficiency',
        variants,
        startDate: Date.now(),
        active: true,
        trafficSplit: {
          [variants[0].id]: 0.5,
          [variants[1].id]: 0.5,
        },
      });
      
      expect(test).toBeDefined();
      expect(test.id).toMatch(/^test_/);
      expect(test.name).toBe('Personality Test 1');
      expect(test.variants.length).toBe(2);
    });

    it('should get active tests', () => {
      const activeTests = getActiveABTests();
      
      expect(activeTests.length).toBeGreaterThan(0);
      expect(activeTests.every(t => t.active)).toBe(true);
    });

    it('should analyze test results', async () => {
      const variants = getActivePersonalityVariants().slice(0, 2);
      
      const test = createABTest({
        name: 'Analysis Test',
        description: 'Test for analysis',
        variants,
        startDate: Date.now(),
        active: true,
        trafficSplit: {
          [variants[0].id]: 0.5,
          [variants[1].id]: 0.5,
        },
      });
      
      // Generate some test data
      for (let i = 0; i < 10; i++) {
        const userId = `analysis_user_${i}`;
        const variantId = i < 5 ? variants[0].id : variants[1].id;
        assignUserToTestGroup(userId, variantId);
        
        for (let j = 0; j < 3; j++) {
          trackUserInteraction(userId, 500 + Math.random() * 200);
        }
      }
      
      const results = await analyzeABTestResults(test.id);
      
      expect(results).toBeDefined();
      expect(results.testId).toBe(test.id);
      expect(results.winningVariant).toBeDefined();
      expect(results.recommendation).toBeDefined();
      expect(['deploy', 'continue_testing', 'abandon']).toContain(results.recommendation);
    });
  });

  describe('Statistics', () => {
    it('should provide A/B testing statistics', () => {
      const stats = getABTestingStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.totalVariants).toBeGreaterThan(0);
      expect(stats.activeVariants).toBeGreaterThan(0);
      expect(stats.totalUsers).toBeGreaterThan(0);
      expect(stats.totalTests).toBeGreaterThan(0);
    });
  });
});
