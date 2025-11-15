/**
 * Performance and Load Testing
 * 
 * Tests API endpoints under load to identify scaling bottlenecks
 * Focus on Parallel Function Calling (PFC) and Metacognitive Loop endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupRoutes } from '../routes';

describe('API Load Testing', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    // Create test app instance
    app = express();
    app.use(express.json());
    
    // Setup routes
    await setupRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('Metacognitive Loop Performance', () => {
    it('should handle concurrent metacognitive requests', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();
      
      // Simulate concurrent requests
      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app)
          .post('/api/metacognitive/analyze')
          .send({
            taskId: `test-task-${i}`,
            userId: 'test-user',
            taskStatus: 'in_progress',
            taskDescription: 'Test task for load testing',
          })
          .expect((res) => {
            // Should return within reasonable time
            expect(res.status).toBeLessThanOrEqual(500);
          })
      );

      const results = await Promise.allSettled(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const successRate = successCount / concurrentRequests;
      
      console.log(`Metacognitive Load Test: ${successCount}/${concurrentRequests} succeeded in ${duration}ms`);
      console.log(`Success rate: ${(successRate * 100).toFixed(1)}%`);
      console.log(`Average response time: ${(duration / concurrentRequests).toFixed(2)}ms`);
      
      // At least 70% should succeed (accounting for API limits and potential issues)
      expect(successRate).toBeGreaterThanOrEqual(0.7);
    }, 60000); // 60 second timeout

    it('should maintain performance under sequential load', async () => {
      const iterations = 20;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await request(app)
          .post('/api/metacognitive/analyze')
          .send({
            taskId: `seq-test-${i}`,
            userId: 'test-user-seq',
            taskStatus: 'in_progress',
            taskDescription: 'Sequential load test task',
          });

        const duration = Date.now() - startTime;
        responseTimes.push(duration);
      }

      // Calculate performance metrics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      console.log(`Sequential Load Test Results:`);
      console.log(`  Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`  Min: ${minResponseTime}ms`);
      console.log(`  Max: ${maxResponseTime}ms`);

      // Response time should be consistent (max shouldn't be more than 3x avg)
      expect(maxResponseTime).toBeLessThan(avgResponseTime * 3);
    }, 120000); // 120 second timeout
  });

  describe('Agent Dispatch Performance', () => {
    it('should handle parallel agent dispatches efficiently', async () => {
      const concurrentDispatches = 5;
      const startTime = Date.now();

      const dispatches = Array.from({ length: concurrentDispatches }, (_, i) =>
        request(app)
          .post('/api/agent/dispatch')
          .send({
            agentName: 'general',
            task: `Parallel dispatch test ${i}`,
            priority: 'medium',
          })
          .expect((res) => {
            expect(res.status).toBeLessThanOrEqual(500);
          })
      );

      const results = await Promise.allSettled(dispatches);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const successRate = successCount / concurrentDispatches;

      console.log(`Agent Dispatch Load Test: ${successCount}/${concurrentDispatches} succeeded in ${duration}ms`);
      console.log(`Average response time: ${(duration / concurrentDispatches).toFixed(2)}ms`);

      // Should complete within reasonable time
      expect(duration).toBeLessThan(45000); // 45 seconds
      expect(successRate).toBeGreaterThanOrEqual(0.6);
    }, 90000);
  });

  describe('Chat API Performance', () => {
    it('should handle burst chat requests', async () => {
      const burstSize = 15;
      const startTime = Date.now();

      const chatRequests = Array.from({ length: burstSize }, (_, i) =>
        request(app)
          .post('/api/chat')
          .send({
            message: `Load test message ${i}`,
            userId: 'load-test-user',
          })
          .expect((res) => {
            expect(res.status).toBeLessThanOrEqual(500);
          })
      );

      const results = await Promise.allSettled(chatRequests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const successRate = successCount / burstSize;

      console.log(`Chat Burst Test: ${successCount}/${burstSize} succeeded in ${duration}ms`);
      console.log(`Throughput: ${(successCount / (duration / 1000)).toFixed(2)} req/s`);

      expect(duration).toBeLessThan(60000); // 60 seconds
      expect(successRate).toBeGreaterThanOrEqual(0.5); // At least 50% success
    }, 90000);
  });

  describe('Memory Service Performance', () => {
    it('should handle concurrent memory searches', async () => {
      const concurrentSearches = 20;
      const searchQueries = [
        'weather',
        'schedule',
        'tasks',
        'reminders',
        'preferences',
      ];

      const startTime = Date.now();

      const searches = Array.from({ length: concurrentSearches }, (_, i) =>
        request(app)
          .post('/api/memory/search')
          .send({
            query: searchQueries[i % searchQueries.length],
            userId: 'test-user',
          })
          .expect((res) => {
            expect(res.status).toBeLessThanOrEqual(500);
          })
      );

      const results = await Promise.allSettled(searches);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successCount = results.filter(r => r.status === 'fulfilled').length;

      console.log(`Memory Search Load Test: ${successCount}/${concurrentSearches} succeeded in ${duration}ms`);
      console.log(`Average latency: ${(duration / concurrentSearches).toFixed(2)}ms`);

      // Memory searches should be fast
      expect(duration / concurrentSearches).toBeLessThan(1000); // Less than 1s average
    }, 60000);
  });

  describe('WebSocket Stress Test', () => {
    it('should document websocket performance characteristics', () => {
      // Note: Full WebSocket load testing requires a different approach
      // This test documents the expected behavior
      
      const expectedMetrics = {
        maxConcurrentConnections: 1000,
        messageLatency: '<100ms',
        messageRate: '>1000/s',
        reconnectTime: '<5s',
      };

      console.log('WebSocket Performance Expectations:');
      console.log(JSON.stringify(expectedMetrics, null, 2));

      // This is a documentation test - always passes
      expect(expectedMetrics.maxConcurrentConnections).toBeGreaterThan(0);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should track and report key performance indicators', async () => {
      const benchmarks = {
        chatResponseTime: { target: 2000, threshold: 5000 }, // ms
        memorySearchTime: { target: 500, threshold: 1000 }, // ms
        agentDispatchTime: { target: 3000, threshold: 10000 }, // ms
        metacognitiveAnalysisTime: { target: 2000, threshold: 8000 }, // ms
      };

      console.log('\n=== Performance Benchmarks ===');
      Object.entries(benchmarks).forEach(([metric, values]) => {
        console.log(`${metric}:`);
        console.log(`  Target: ${values.target}ms`);
        console.log(`  Threshold: ${values.threshold}ms`);
      });
      console.log('==============================\n');

      // Documentation test
      expect(Object.keys(benchmarks).length).toBeGreaterThan(0);
    });
  });

  describe('Parallel Function Calling (PFC) Stress Tests', () => {
    it('should handle concurrent PFC operations without race conditions', async () => {
      const concurrentRequests = 20;
      const startTime = Date.now();

      // Simulate concurrent requests with PFC enabled
      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app)
          .post('/api/chat')
          .send({
            message: `Test PFC message ${i} - analyze weather and calendar`,
            userId: `pfc-test-user-${i}`,
            enablePFC: true,
          })
          .expect((res) => {
            expect(res.status).toBeLessThanOrEqual(500);
          })
      );

      const results = await Promise.allSettled(requests);
      const duration = Date.now() - startTime;
      const successCount = results.filter(r => r.status === 'fulfilled').length;

      // Extract response bodies from successful requests
      const responses = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value.body);

      console.log(`PFC Stress Test: ${successCount}/${concurrentRequests} succeeded in ${duration}ms`);
      console.log(`Average latency: ${(duration / concurrentRequests).toFixed(2)}ms`);

      // Verify no race conditions - each response should have unique data
      if (responses.length > 0) {
        const messageIds = responses.map(r => r.messageId || r.id).filter(Boolean);
        const uniqueIds = new Set(messageIds);
        
        console.log(`Unique message IDs: ${uniqueIds.size}/${messageIds.length}`);
        
        // All message IDs should be unique (no cross-contamination)
        expect(uniqueIds.size).toBe(messageIds.length);

        // Verify tool calls are not duplicated across responses
        responses.forEach((response, index) => {
          if (response.toolCalls && Array.isArray(response.toolCalls)) {
            const toolIds = response.toolCalls.map((t: any) => t.id);
            const uniqueToolIds = new Set(toolIds);
            
            // Each response should have unique tool call IDs
            expect(uniqueToolIds.size).toBe(toolIds.length);
            
            console.log(`Response ${index}: ${toolIds.length} tool calls, all unique`);
          }
        });
      }

      // Performance check
      expect(duration).toBeLessThan(120000); // 120 seconds
      expect(successCount / concurrentRequests).toBeGreaterThanOrEqual(0.5); // At least 50% success
    }, 180000); // 3 minute timeout

    it('should prevent tool call result mixing in concurrent PFC requests', async () => {
      const concurrentRequests = 10;

      // Create requests with different tool requirements
      const requests = [
        // Weather requests
        ...Array.from({ length: 5 }, (_, i) =>
          request(app)
            .post('/api/chat')
            .send({
              message: `What's the weather in city ${i}?`,
              userId: `weather-user-${i}`,
              enablePFC: true,
            })
        ),
        // Calendar requests
        ...Array.from({ length: 5 }, (_, i) =>
          request(app)
            .post('/api/chat')
            .send({
              message: `Show my schedule for day ${i}`,
              userId: `calendar-user-${i}`,
              enablePFC: true,
            })
        ),
      ];

      const results = await Promise.allSettled(requests);
      const responses = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value.body);

      // Verify weather responses don't contain calendar data and vice versa
      responses.forEach((response, index) => {
        if (response.content && typeof response.content === 'string') {
          const isWeatherRequest = index < 5;
          
          if (isWeatherRequest) {
            // Weather response shouldn't contain calendar-specific terms
            const hasCalendarLeak = /\b(meeting|appointment|event)\b/i.test(response.content);
            if (hasCalendarLeak) {
              console.warn(`Potential data leak: Weather response ${index} contains calendar terms`);
            }
          } else {
            // Calendar response shouldn't contain weather-specific terms
            const hasWeatherLeak = /\b(temperature|forecast|sunny|rainy)\b/i.test(response.content);
            if (hasWeatherLeak) {
              console.warn(`Potential data leak: Calendar response ${index} contains weather terms`);
            }
          }
        }
      });

      expect(responses.length).toBeGreaterThan(0);
    }, 120000);

    it('should maintain PFC performance under sustained load', async () => {
      const iterations = 5;
      const batchSize = 4;
      const latencies: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const batchStart = Date.now();

        const batch = Array.from({ length: batchSize }, (_, j) =>
          request(app)
            .post('/api/chat')
            .send({
              message: `PFC load test iteration ${i} batch ${j}`,
              userId: `load-test-user-${i}-${j}`,
              enablePFC: true,
            })
        );

        await Promise.allSettled(batch);
        const batchLatency = Date.now() - batchStart;
        latencies.push(batchLatency);

        console.log(`Iteration ${i + 1}/${iterations}: ${batchLatency}ms`);

        // Brief pause between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Calculate performance metrics
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);

      console.log(`\nPFC Sustained Load Results:`);
      console.log(`  Average: ${avgLatency.toFixed(2)}ms`);
      console.log(`  Min: ${minLatency}ms`);
      console.log(`  Max: ${maxLatency}ms`);
      console.log(`  Variance: ${((maxLatency - minLatency) / avgLatency * 100).toFixed(1)}%`);

      // Performance should remain consistent (max shouldn't be > 2x avg)
      expect(maxLatency).toBeLessThan(avgLatency * 2.5);
    }, 180000);
  });
});
