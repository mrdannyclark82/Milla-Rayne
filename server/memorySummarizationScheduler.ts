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
    
    console.log(`🔄 [Memory Scheduler] Run #${totalRuns} started at ${new Date().toISOString()}`);
    
    try {
      // TODO: Replace 'default-user' with actual userId from active sessions or iterate through users
      // For now, we'll summarize for a default user or the primary user.
      const summaries = await generateMemorySummaries('default-user');
      
      const duration = Date.now() - startTime;
      successfulRuns++;
      lastRunTime = Date.now();
      
      console.log(`✅ [Memory Scheduler] Run #${totalRuns} completed in ${duration}ms`);
      console.log(`✅ [Memory Scheduler] Generated ${summaries.length} new summaries`);
      console.log(`📊 [Memory Scheduler] Success rate: ${successfulRuns}/${totalRuns} (${((successfulRuns/totalRuns)*100).toFixed(1)}%)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      failedRuns++;
      
      console.error(`❌ [Memory Scheduler] Run #${totalRuns} failed after ${duration}ms:`, error);
      console.log(`📊 [Memory Scheduler] Failure rate: ${failedRuns}/${totalRuns} (${((failedRuns/totalRuns)*100).toFixed(1)}%)`);
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
export async function forceMemorySummarization(): Promise<void> {
  console.log('⚡ [Memory Scheduler] Manual run triggered');
  const startTime = Date.now();
  
  try {
    const summaries = await generateMemorySummaries('default-user');
    const duration = Date.now() - startTime;
    console.log(`✅ [Memory Scheduler] Manual run completed in ${duration}ms`);
    console.log(`✅ [Memory Scheduler] Generated ${summaries.length} summaries`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [Memory Scheduler] Manual run failed after ${duration}ms:`, error);
    throw error;
  }
}

