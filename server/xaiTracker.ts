/**
 * XAI Tracker Service
 * 
 * Tracks AI reasoning and decision-making process for transparency
 * Provides data for the XAI overlay visualization on the client
 */

import type { ReasoningStep, XAIData } from '../client/src/components/XAIOverlay';

interface ReasoningSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  data: XAIData;
}

// Store reasoning sessions (in-memory for now, could be moved to database)
const reasoningSessions = new Map<string, ReasoningSession>();

// Clean up sessions older than 1 hour
const SESSION_TTL = 60 * 60 * 1000;

/**
 * Create a new reasoning session
 */
export function startReasoningSession(userId: string): string {
  // Use crypto.randomUUID() for cryptographically secure random IDs
  const crypto = require('crypto');
  const sessionId = `xai-${Date.now()}-${crypto.randomUUID().slice(0, 9)}`;
  
  reasoningSessions.set(sessionId, {
    sessionId,
    userId,
    startTime: new Date(),
    data: {
      reasoning: [],
    },
  });
  
  return sessionId;
}

/**
 * Track command intent recognition
 */
export function trackCommandIntent(sessionId: string, intent: string): void {
  const session = reasoningSessions.get(sessionId);
  if (!session) return;
  
  session.data.commandIntent = intent;
  session.data.reasoning.push({
    type: 'intent',
    title: 'Command Intent Recognized',
    content: intent,
    timestamp: new Date(),
  });
}

/**
 * Track tool selection
 */
export function trackToolSelection(sessionId: string, tools: string[]): void {
  const session = reasoningSessions.get(sessionId);
  if (!session) return;
  
  session.data.toolsSelected = tools;
  session.data.reasoning.push({
    type: 'tools',
    title: 'Tools Selected',
    content: tools,
    timestamp: new Date(),
    metadata: {
      count: tools.length,
    },
  });
}

/**
 * Track memory retrieval
 */
export function trackMemoryRetrieval(
  sessionId: string,
  memories: Array<{ content: string; relevance: number }>
): void {
  const session = reasoningSessions.get(sessionId);
  if (!session) return;
  
  session.data.memoryFragments = memories;
  session.data.reasoning.push({
    type: 'memory',
    title: 'Memory Fragments Retrieved',
    content: `Retrieved ${memories.length} relevant memory fragments`,
    timestamp: new Date(),
    metadata: {
      count: memories.length,
      avgRelevance: memories.reduce((sum, m) => sum + m.relevance, 0) / memories.length,
    },
  });
}

/**
 * Track response generation
 */
export function trackResponseGeneration(
  sessionId: string,
  model: string,
  tokensUsed?: number,
  processingTime?: number
): void {
  const session = reasoningSessions.get(sessionId);
  if (!session) return;
  
  session.data.responseGeneration = {
    model,
    tokensUsed,
    processingTime,
  };
  
  session.data.reasoning.push({
    type: 'response',
    title: 'Response Generated',
    content: `Generated response using ${model}`,
    timestamp: new Date(),
    metadata: {
      model,
      tokensUsed,
      processingTime,
    },
  });
}

/**
 * Add a custom reasoning step
 */
export function addReasoningStep(
  sessionId: string,
  type: 'intent' | 'tools' | 'memory' | 'response',
  title: string,
  content: string | string[],
  metadata?: Record<string, any>
): void {
  const session = reasoningSessions.get(sessionId);
  if (!session) return;
  
  session.data.reasoning.push({
    type,
    title,
    content,
    timestamp: new Date(),
    metadata,
  });
}

/**
 * Get reasoning data for a session
 */
export function getReasoningData(sessionId: string): XAIData | null {
  const session = reasoningSessions.get(sessionId);
  if (!session) return null;
  
  return session.data;
}

/**
 * Get all reasoning sessions for a user
 */
export function getUserReasoningSessions(userId: string): ReasoningSession[] {
  const userSessions: ReasoningSession[] = [];
  
  for (const session of reasoningSessions.values()) {
    if (session.userId === userId) {
      userSessions.push(session);
    }
  }
  
  return userSessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
}

/**
 * Clean up old sessions
 */
export function cleanupOldSessions(): void {
  const now = Date.now();
  
  for (const [sessionId, session] of reasoningSessions.entries()) {
    if (now - session.startTime.getTime() > SESSION_TTL) {
      reasoningSessions.delete(sessionId);
    }
  }
}

// Clean up old sessions every 15 minutes
setInterval(cleanupOldSessions, 15 * 60 * 1000);

/**
 * Export types for use in other modules
 */
export type { XAIData, ReasoningStep };
