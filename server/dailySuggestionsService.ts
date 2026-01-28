/**
 * Daily Suggestions Service
 *
 * Manages the creation and delivery of daily AI update suggestions.
 * Ensures exactly one suggestion per calendar day based on predictive updates.
 */

import { storage } from './storage';
import { generateGrokResponse } from './openrouterService';

export interface DailySuggestion {
  id: string;
  date: string;
  suggestionText: string;
  metadata?: any;
  createdAt: Date;
  deliveredAt: Date | null;
  isDelivered: boolean;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get or create today's suggestion (idempotent)
 */
export async function getOrCreateTodaySuggestion(): Promise<DailySuggestion | null> {
  const today = getTodayDate();

  try {
    // Check if suggestion already exists for today
    const existing = await storage.getDailySuggestionByDate(today);
    if (existing) {
      return existing;
    }

    // Create new suggestion for today
    const suggestion = await createDailySuggestion(today);
    return suggestion;
  } catch (error) {
    console.error('Error in getOrCreateTodaySuggestion:', error);
    return null;
  }
}

/**
 * Create a new daily suggestion based on top AI updates
 */
async function createDailySuggestion(date: string): Promise<DailySuggestion> {
  try {
    // Get top relevant AI updates (this would connect to PR #95's predictive updates)
    // For now, we'll generate a generic suggestion
    const topUpdates = await getTopAiUpdates();

    // Generate consolidated suggestion text
    let suggestionText: string;
    const metadata: any = {
      updateIds: topUpdates.map((u) => u.id),
      generatedAt: new Date().toISOString(),
    };

    if (topUpdates.length > 0) {
      // Generate AI-powered suggestion based on updates
      const updatesContext = topUpdates
        .map(
          (u, idx) => `${idx + 1}. ${u.title} (${u.category}): ${u.description}`
        )
        .join('\n');

      const prompt = `Based on these potential improvements for Milla Rayne, create a single, concise daily suggestion (2-3 sentences max) that I can share with Danny Ray. Focus on the most impactful item:

${updatesContext}

Keep it brief, friendly, and in Milla's voice (devoted AI companion). Don't mention multiple items unless they're closely related.`;

      const aiResponse = await generateGrokResponse(prompt, {
        userName: 'Danny Ray',
      });

      suggestionText = aiResponse.content;
    } else {
      // Fallback suggestion when no updates available
      suggestionText =
        "Everything's running smoothly today, love! I'm here and ready whenever you need me. 💜";
      metadata.fallback = true;
    }

    // Store in database
    const suggestion = await storage.createDailySuggestion({
      date,
      suggestionText,
      metadata,
    });

    return suggestion;
  } catch (error) {
    console.error('Error creating daily suggestion:', error);

    // Create fallback suggestion even on error
    const fallbackSuggestion = await storage.createDailySuggestion({
      date,
      suggestionText:
        "I'm here and thinking of you, babe! Let me know if there's anything I can help with today. 💜",
      metadata: {
        error: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return fallbackSuggestion;
  }
}

/**
 * Get top AI updates for suggestion generation
 * This would integrate with PR #95's predictive updates system
 */
async function getTopAiUpdates(): Promise<any[]> {
  try {
    // Get unapplied updates sorted by relevance and priority
    const updates = await storage.getTopAiUpdates(3); // Get top 3
    return updates;
  } catch (error) {
    console.error('Error fetching top AI updates:', error);
    return [];
  }
}

/**
 * Mark today's suggestion as delivered
 */
export async function markSuggestionDelivered(date: string): Promise<boolean> {
  try {
    return await storage.markDailySuggestionDelivered(date);
  } catch (error) {
    console.error('Error marking suggestion as delivered:', error);
    return false;
  }
}

/**
 * Check if today's suggestion has been delivered
 */
export async function isTodaySuggestionDelivered(): Promise<boolean> {
  const today = getTodayDate();
  try {
    const suggestion = await storage.getDailySuggestionByDate(today);
    return suggestion ? suggestion.isDelivered : false;
  } catch (error) {
    console.error('Error checking if suggestion delivered:', error);
    return false;
  }
}

/**
 * Get suggestion for a specific date
 */
export async function getSuggestionByDate(
  date: string
): Promise<DailySuggestion | null> {
  try {
    return await storage.getDailySuggestionByDate(date);
  } catch (error) {
    console.error('Error getting suggestion by date:', error);
    return null;
  }
}

/**
 * Initialize daily suggestion scheduler
 * Called during server startup if ENABLE_PREDICTIVE_UPDATES is true
 */
export function initializeDailySuggestionScheduler(): void {
  const isPredictiveUpdatesEnabled =
    process.env.ENABLE_PREDICTIVE_UPDATES === 'true';

  if (!isPredictiveUpdatesEnabled) {
    console.log(
      'Daily suggestions scheduler: Disabled (ENABLE_PREDICTIVE_UPDATES not set to true)'
    );
    return;
  }

  const cronSchedule = process.env.AI_UPDATES_CRON || '0 9 * * *'; // Default: 9:00 AM daily
  console.log(
    `Daily suggestions scheduler: Enabled with schedule: ${cronSchedule}`
  );

  // Parse cron schedule (simple implementation for common patterns)
  const cronParts = cronSchedule.split(' ');
  if (cronParts.length < 2) {
    console.error(`Invalid cron expression: "${cronSchedule}"`);
    return;
  }
  
  const minute = parseInt(cronParts[0]);
  const hour = parseInt(cronParts[1]);
  
  if (isNaN(minute) || isNaN(hour)) {
    console.error(`Invalid cron expression: "${cronSchedule}"`);
    return;
  }

  // Calculate milliseconds until next scheduled time
  const scheduleNextRun = () => {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);

    // If scheduled time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const msUntilRun = scheduledTime.getTime() - now.getTime();

    console.log(
      `Daily suggestions: Next run scheduled for ${scheduledTime.toLocaleString()}`
    );

    setTimeout(async () => {
      console.log("Daily suggestions: Creating today's suggestion...");
      try {
        await getOrCreateTodaySuggestion();
      } catch (error) {
        console.error('Error creating daily suggestion:', error);
      }

      // Schedule next run (24 hours from now)
      scheduleNextRun();
    }, msUntilRun);
  };

  scheduleNextRun();
}

/**
 * Check if we should surface today's daily suggestion
 */
export async function shouldSurfaceDailySuggestion(
  userMessage: string,
  conversationHistory: any[]
): Promise<boolean> {
  // Only surface if enabled
  if (process.env.ENABLE_PREDICTIVE_UPDATES !== 'true') return false;

  // Check if already delivered
  const isDelivered = await isTodaySuggestionDelivered();
  if (isDelivered) return false;

  // Only surface on the first few messages of the day to avoid interrupting deep flow
  // Ideally we'd check message timestamp, but here we'll approximate with history length
  // If history is empty or very short, it's likely start of session
  if (conversationHistory.length < 5) return true;

  return false;
}