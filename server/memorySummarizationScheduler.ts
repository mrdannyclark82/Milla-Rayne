import cron, { type ScheduledTask } from 'node-cron';
import { generateMemorySummaries } from './memorySummarizationService';
import { config } from './config';

let scheduledTask: ScheduledTask | null = null;
// P3.6: Add tracking for async execution
let isRunning = false;
let totalRuns = 0;
let successfulRuns = 0;
let failedRuns = 0;
let lastRunTime: number = 0;

/**
 * Initialize Memory Summarization Scheduler based on environment configuration
 */
export function initializeMemorySummarizationScheduler(): void {
  const enableSummarization = config.memory.enableSummarization;
  const cronExpression = config.memory.summarizationCron;

  if (!enableSummarization) {
    console.log(
      'Memory summarization disabled (ENABLE_MEMORY_SUMMARIZATION not set to true)'
    );
    return;
  }

  if (!cronExpression) {
    console.log(
      'Memory summarization scheduling disabled (MEMORY_SUMMARIZATION_CRON not set)'
    );
    return;
  }

  // Validate cron expression
  if (!cron.validate(cronExpression)) {
    console.error(
      `Invalid cron expression for memory summarization: ${cronExpression}`
    );
    return;
  }

  console.log(
    `Scheduling memory summarization with cron expression: ${cronExpression}`
  );

  // Schedule the task
  scheduledTask = cron.schedule(cronExpression, async () => {
    // P3.6: Non-blocking async execution with tracking
    const startTime = Date.now();
    totalRuns++;

    console.log(
      `🔄 [Memory Scheduler] Run #${totalRuns} started at ${new Date().toISOString()}`
    );

    try {
      // Get all active users from the database
      const { storage } = await import('./storage');

      // Try to get all users (this might not exist in all versions)
      let users: string[] = ['default-user'];
      try {
        // Attempt to get recent active users (users with messages in last 7 days)
        const db = (storage as any).db;
        if (db) {
          const recentUsers = db
            .prepare(
              `
            SELECT DISTINCT user_id 
            FROM messages 
            WHERE created_at > datetime('now', '-7 days')
            AND user_id IS NOT NULL
          `
            )
            .all();

          if (recentUsers && recentUsers.length > 0) {
            users = recentUsers.map((row: any) => row.user_id);
            console.log(
              `📊 [Memory Scheduler] Found ${users.length} active users`
            );
          }
        }
      } catch (dbError) {
        console.log(
          '📊 [Memory Scheduler] Could not get users from DB, using default-user'
        );
      }

      // Summarize memories for each user
      let totalSummaries = 0;
      for (const userId of users) {
        try {
          const summaries = await generateMemorySummaries(userId);
          totalSummaries += summaries.length;
          console.log(
            `✅ [Memory Scheduler] User ${userId}: ${summaries.length} summaries`
          );
        } catch (userError) {
          console.error(
            `❌ [Memory Scheduler] Failed for user ${userId}:`,
            userError
          );
        }
      }

      const duration = Date.now() - startTime;
      successfulRuns++;
      lastRunTime = Date.now();

      console.log(
        `✅ [Memory Scheduler] Run #${totalRuns} completed in ${duration}ms`
      );
      console.log(
        `✅ [Memory Scheduler] Generated ${totalSummaries} total summaries for ${users.length} users`
      );
      console.log(
        `📊 [Memory Scheduler] Success rate: ${successfulRuns}/${totalRuns} (${((successfulRuns / totalRuns) * 100).toFixed(1)}%)`
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      failedRuns++;

      console.error(
        `❌ [Memory Scheduler] Run #${totalRuns} failed after ${duration}ms:`,
        error
      );
      console.log(
        `📊 [Memory Scheduler] Failure rate: ${failedRuns}/${totalRuns} (${((failedRuns / totalRuns) * 100).toFixed(1)}%)`
      );
    }
  });

  isRunning = true;
  console.log('Memory summarization scheduler initialized successfully');
}

/**
 * Stop the scheduler (for cleanup)
 */
export function stopMemorySummarizationScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    isRunning = false;
    console.log('Memory summarization scheduler stopped');
  }
}

/**
 * P3.6: Get scheduler status for monitoring
 */
export function getSchedulerStatus(): {
  isRunning: boolean;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number;
  lastRunTime: number | null;
  cronExpression: string | null;
} {
  return {
    isRunning,
    totalRuns,
    successfulRuns,
    failedRuns,
    successRate: totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0,
    lastRunTime: lastRunTime || null,
    cronExpression: config.memory.summarizationCron || null,
  };
}

/**
 * P3.6: Force an immediate summarization run (for testing/manual trigger)
 */
export async function forceMemorySummarization(userId?: string): Promise<void> {
  console.log('⚡ [Memory Scheduler] Manual run triggered');
  const startTime = Date.now();

  try {
    // If userId provided, use it; otherwise iterate through active users
    if (userId) {
      const summaries = await generateMemorySummaries(userId);
      const duration = Date.now() - startTime;
      console.log(
        `✅ [Memory Scheduler] Manual run completed in ${duration}ms`
      );
      console.log(
        `✅ [Memory Scheduler] Generated ${summaries.length} summaries for user ${userId}`
      );
    } else {
      // Get all active users
      const { storage } = await import('./storage');
      let users: string[] = ['default-user'];

      try {
        const db = (storage as any).db;
        if (db) {
          const recentUsers = db
            .prepare(
              `
            SELECT DISTINCT user_id 
            FROM messages 
            WHERE created_at > datetime('now', '-7 days')
            AND user_id IS NOT NULL
          `
            )
            .all();

          if (recentUsers && recentUsers.length > 0) {
            users = recentUsers.map((row: any) => row.user_id);
          }
        }
      } catch (dbError) {
        console.log('Using default-user for manual run');
      }

      let totalSummaries = 0;
      for (const uid of users) {
        const summaries = await generateMemorySummaries(uid);
        totalSummaries += summaries.length;
        console.log(`✅ User ${uid}: ${summaries.length} summaries`);
      }

      const duration = Date.now() - startTime;
      console.log(
        `✅ [Memory Scheduler] Manual run completed in ${duration}ms`
      );
      console.log(
        `✅ [Memory Scheduler] Generated ${totalSummaries} total summaries for ${users.length} users`
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `❌ [Memory Scheduler] Manual run failed after ${duration}ms:`,
      error
    );
    throw error;
  }
}
