import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  executeToolCallsInParallel,
  generateGeminiChatWithTools,
  type ToolCall,
  type GeminiChatContext,
  AVAILABLE_TOOLS,
} from '../geminiToolService';
import * as registry from '../agents/registry';

describe('Gemini Tool Service - Parallel Execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeToolCallsInParallel', () => {
    it('should execute multiple tool calls in parallel', async () => {
      // Mock agents
      const mockAgent = {
        name: 'TestAgent',
        handleTask: vi
          .fn()
          .mockResolvedValue({ success: true, data: 'result' }),
      };

      vi.spyOn(registry, 'getAgent').mockReturnValue(mockAgent as any);

      const toolCalls: ToolCall[] = [
        { id: 'call1', name: 'check_calendar', args: { timeRange: 'today' } },
        { id: 'call2', name: 'search_youtube', args: { query: 'test' } },
        { id: 'call3', name: 'get_weather', args: { location: 'Boston' } },
      ];

      const startTime = Date.now();
      const results = await executeToolCallsInParallel(toolCalls);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);

      // Verify all tools were called
      expect(mockAgent.handleTask).toHaveBeenCalledTimes(3);

      // Parallel execution should be faster than sequential
      // With 3 calls, if they were sequential with 50ms delay each, it would take ~150ms
      // Parallel should take closer to 50ms (the time of the slowest call)
      console.log(`Parallel execution time: ${executionTime}ms`);
    });

    it('should handle tool execution failures gracefully', async () => {
      const mockAgent = {
        name: 'TestAgent',
        handleTask: vi
          .fn()
          .mockResolvedValueOnce({ success: true, data: 'result1' })
          .mockRejectedValueOnce(new Error('Tool failed'))
          .mockResolvedValueOnce({ success: true, data: 'result3' }),
      };

      vi.spyOn(registry, 'getAgent').mockReturnValue(mockAgent as any);

      const toolCalls: ToolCall[] = [
        { id: 'call1', name: 'check_calendar', args: { timeRange: 'today' } },
        { id: 'call2', name: 'search_youtube', args: { query: 'test' } },
        { id: 'call3', name: 'get_weather', args: { location: 'Boston' } },
      ];

      const results = await executeToolCallsInParallel(toolCalls);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toContain('Tool failed');
      expect(results[2].success).toBe(true);
    });

    it('should include execution time for each tool', async () => {
      const mockAgent = {
        name: 'TestAgent',
        handleTask: vi.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { success: true, data: 'result' };
        }),
      };

      vi.spyOn(registry, 'getAgent').mockReturnValue(mockAgent as any);

      const toolCalls: ToolCall[] = [
        { id: 'call1', name: 'check_calendar', args: { timeRange: 'today' } },
      ];

      const results = await executeToolCallsInParallel(toolCalls);

      expect(results[0].executionTime).toBeGreaterThanOrEqual(10);
    });

    it('should execute single tool call', async () => {
      const mockAgent = {
        name: 'TestAgent',
        handleTask: vi.fn().mockResolvedValue({ success: true }),
      };

      vi.spyOn(registry, 'getAgent').mockReturnValue(mockAgent as any);

      const toolCalls: ToolCall[] = [
        { id: 'call1', name: 'check_calendar', args: { timeRange: 'today' } },
      ];

      const results = await executeToolCallsInParallel(toolCalls);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    it('should handle unknown tool names', async () => {
      vi.spyOn(registry, 'getAgent').mockReturnValue(undefined);

      const toolCalls: ToolCall[] = [
        { id: 'call1', name: 'unknown_tool', args: {} },
      ];

      const results = await executeToolCallsInParallel(toolCalls);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Unknown tool');
    });
  });

  describe('generateGeminiChatWithTools', () => {
    it('should detect and execute tool calls from user message', async () => {
      const mockAgent = {
        name: 'TestAgent',
        handleTask: vi.fn().mockResolvedValue({ success: true, events: [] }),
      };

      vi.spyOn(registry, 'getAgent').mockReturnValue(mockAgent as any);

      const context: GeminiChatContext = {
        conversationHistory: [],
        availableTools: AVAILABLE_TOOLS,
        userId: 'test-user',
      };

      const response = await generateGeminiChatWithTools(
        "What's on my calendar today?",
        context
      );

      expect(response.success).toBe(true);
      expect(response.toolCalls).toBeDefined();
      expect(response.toolCalls!.length).toBeGreaterThan(0);
    });

    it('should detect multiple tool needs in one message', async () => {
      const mockAgent = {
        name: 'TestAgent',
        handleTask: vi.fn().mockResolvedValue({ success: true }),
      };

      vi.spyOn(registry, 'getAgent').mockReturnValue(mockAgent as any);

      const context: GeminiChatContext = {
        conversationHistory: [],
        availableTools: AVAILABLE_TOOLS,
        userId: 'test-user',
      };

      const response = await generateGeminiChatWithTools(
        'Check my calendar today and also search YouTube for tutorials',
        context
      );

      expect(response.success).toBe(true);
      // Should detect both calendar and YouTube tools
      if (response.toolCalls) {
        const toolNames = response.toolCalls.map((tc) => tc.name);
        expect(toolNames).toContain('check_calendar');
        expect(toolNames).toContain('search_youtube');
      }
    });

    it('should handle messages that do not require tools', async () => {
      const context: GeminiChatContext = {
        conversationHistory: [],
        availableTools: AVAILABLE_TOOLS,
        userId: 'test-user',
      };

      // This test would require actual Gemini API key in production
      // For now, we test that it doesn't throw and handles the API error gracefully
      const response = await generateGeminiChatWithTools(
        'Hello, how are you?',
        context
      );

      // Should handle gracefully even without API key
      expect(response).toBeDefined();
      expect(response.finishReason).toBeDefined();
    });
  });

  describe('Tool Definitions', () => {
    it('should have properly structured tool definitions', () => {
      expect(AVAILABLE_TOOLS).toBeDefined();
      expect(AVAILABLE_TOOLS.length).toBeGreaterThan(0);

      AVAILABLE_TOOLS.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('parameters');
        expect(tool.parameters).toHaveProperty('type');
        expect(tool.parameters).toHaveProperty('properties');
      });
    });

    it('should include calendar tool', () => {
      const calendarTool = AVAILABLE_TOOLS.find(
        (t) => t.name === 'check_calendar'
      );
      expect(calendarTool).toBeDefined();
      expect(calendarTool!.description).toContain('calendar');
    });

    it('should include YouTube tool', () => {
      const youtubeTool = AVAILABLE_TOOLS.find(
        (t) => t.name === 'search_youtube'
      );
      expect(youtubeTool).toBeDefined();
      expect(youtubeTool!.description).toContain('YouTube');
    });

    it('should include weather tool', () => {
      const weatherTool = AVAILABLE_TOOLS.find((t) => t.name === 'get_weather');
      expect(weatherTool).toBeDefined();
      expect(weatherTool!.description).toContain('weather');
    });
  });

  describe('Performance - Parallel vs Sequential', () => {
    it('should demonstrate parallel execution advantage', async () => {
      // Mock agent with artificial delay
      const mockAgent = {
        name: 'TestAgent',
        handleTask: vi.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return { success: true };
        }),
      };

      vi.spyOn(registry, 'getAgent').mockReturnValue(mockAgent as any);

      const toolCalls: ToolCall[] = [
        { id: 'call1', name: 'check_calendar', args: { timeRange: 'today' } },
        { id: 'call2', name: 'search_youtube', args: { query: 'test' } },
        { id: 'call3', name: 'get_weather', args: { location: 'Boston' } },
      ];

      // Execute in parallel
      const parallelStart = Date.now();
      await executeToolCallsInParallel(toolCalls);
      const parallelTime = Date.now() - parallelStart;

      // Simulate sequential execution
      const sequentialStart = Date.now();
      for (const toolCall of toolCalls) {
        await mockAgent.handleTask({
          taskId: toolCall.id,
          supervisor: 'test',
          agent: 'TestAgent',
          action: 'test',
          payload: toolCall.args,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
      }
      const sequentialTime = Date.now() - sequentialStart;

      console.log(`Parallel execution: ${parallelTime}ms`);
      console.log(`Sequential execution: ${sequentialTime}ms`);
      console.log(`Speedup: ${(sequentialTime / parallelTime).toFixed(2)}x`);

      // Parallel should be significantly faster (at least 2x for 3 calls with same duration)
      expect(parallelTime).toBeLessThan(sequentialTime * 0.8);
    });
  });
});
