/**
 * Enhanced API Routes for AI SDK Integration
 * Provides REST endpoints for chat, RAG, and WebSocket services
 */

import { Router, Request, Response } from 'express';
import { streamAIResponse, generateAIResponse, convertToAISDKMessages } from './ai-sdk-integration';
import { getRAGService } from './rag-service';
import { getRedisCache } from './redis-cache-service';
import { getVectorDB, initializeVectorDB } from './vector-db-service';
import { getConnectionStats } from './optimized-websocket-service';

export const enhancedRouter = Router();

/**
 * POST /api/chat
 * Stream chat responses using Vercel AI SDK
 */
enhancedRouter.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, provider = 'openai', model, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    // Check Redis cache first
    const redisCache = getRedisCache();
    const cachedResponse = await redisCache.getCachedLLMResponse(messages);

    if (cachedResponse) {
      return res.json({
        id: `cached_${Date.now()}`,
        role: 'assistant',
        content: cachedResponse,
        cached: true,
      });
    }

    // Convert to AI SDK format
    const aiMessages = convertToAISDKMessages(messages);

    // Stream response
    const streamResult = await streamAIResponse({
      provider,
      model,
      messages: aiMessages,
      systemPrompt,
    });

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';

    // Stream to client
    for await (const textPart of streamResult.textStream) {
      fullResponse += textPart;
      res.write(`data: ${JSON.stringify({ content: textPart })}\n\n`);
    }

    // Cache the complete response
    await redisCache.cacheLLMResponse(messages, fullResponse);

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/chat/generate
 * Non-streaming chat endpoint
 */
enhancedRouter.post('/api/chat/generate', async (req: Request, res: Response) => {
  try {
    const { messages, provider = 'openai', model, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    // Check cache
    const redisCache = getRedisCache();
    const cachedResponse = await redisCache.getCachedLLMResponse(messages);

    if (cachedResponse) {
      return res.json({
        content: cachedResponse,
        cached: true,
      });
    }

    // Generate response
    const aiMessages = convertToAISDKMessages(messages);
    const response = await generateAIResponse({
      provider,
      model,
      messages: aiMessages,
      systemPrompt,
    });

    // Cache response
    await redisCache.cacheLLMResponse(messages, response);

    res.json({ content: response, cached: false });
  } catch (error: any) {
    console.error('Generate API error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/rag/ingest
 * Ingest documents into RAG system
 */
enhancedRouter.post('/api/rag/ingest', async (req: Request, res: Response) => {
  try {
    const { documents } = req.body;

    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({ error: 'Documents array required' });
    }

    const ragService = getRAGService();
    await ragService.ingestDocuments(documents);

    res.json({
      success: true,
      message: `Ingested ${documents.length} documents`,
    });
  } catch (error: any) {
    console.error('RAG ingest error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/rag/query
 * Query RAG system
 */
enhancedRouter.post('/api/rag/query', async (req: Request, res: Response) => {
  try {
    const { query, topK = 5, filter, rerank = true } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    const ragService = getRAGService();
    const result = await ragService.query({ query, topK, filter, rerank });

    res.json(result);
  } catch (error: any) {
    console.error('RAG query error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * DELETE /api/rag/document/:id
 * Delete document from RAG system
 */
enhancedRouter.delete('/api/rag/document/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ragService = getRAGService();
    await ragService.deleteDocument(id);

    res.json({ success: true, message: `Document ${id} deleted` });
  } catch (error: any) {
    console.error('RAG delete error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/cache/stats
 * Get Redis cache statistics
 */
enhancedRouter.get('/api/cache/stats', async (req: Request, res: Response) => {
  try {
    const redisCache = getRedisCache();
    const stats = await redisCache.getStats();

    res.json(stats);
  } catch (error: any) {
    console.error('Cache stats error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/vector/stats
 * Get vector database statistics
 */
enhancedRouter.get('/api/vector/stats', async (req: Request, res: Response) => {
  try {
    const vectorDB = getVectorDB();
    const stats = await vectorDB.getStats();

    res.json(stats);
  } catch (error: any) {
    console.error('Vector stats error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/websocket/stats
 * Get WebSocket connection statistics
 */
enhancedRouter.get('/api/websocket/stats', async (req: Request, res: Response) => {
  try {
    const stats = getConnectionStats();
    res.json(stats);
  } catch (error: any) {
    console.error('WebSocket stats error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/health
 * Health check endpoint with service status
 */
enhancedRouter.get('/api/health', async (req: Request, res: Response) => {
  try {
    const redisCache = getRedisCache();
    const vectorDB = getVectorDB();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisCache.isAvailable(),
        vectorDB: true, // Vector DB doesn't expose availability
        websocket: true,
      },
    };

    res.json(health);
  } catch (error: any) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});
