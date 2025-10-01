/**
 * AI Updates Scheduler
 * Handles periodic fetching of AI updates using node-cron
 */

import cron, { type ScheduledTask } from 'node-cron';
import { fetchAIUpdates } from './aiUpdatesService.js';

let scheduledTask: ScheduledTask | null = null;

/**
 * Initialize AI updates scheduler based on environment configuration
 */
export function initializeAIUpdatesScheduler(): void {
  const enablePredictiveUpdates = process.env.ENABLE_PREDICTIVE_UPDATES === 'true';
  const cronExpression = process.env.AI_UPDATES_CRON;

  if (!enablePredictiveUpdates) {
    console.log('Predictive updates disabled (ENABLE_PREDICTIVE_UPDATES not set to true)');
    return;
  }

  if (!cronExpression) {
    console.log('AI updates scheduling disabled (AI_UPDATES_CRON not set)');
    return;
  }

  // Validate cron expression
  if (!cron.validate(cronExpression)) {
    console.error(`Invalid cron expression: ${cronExpression}`);
    return;
  }

  console.log(`Scheduling AI updates with cron expression: ${cronExpression}`);

  // Schedule the task
  scheduledTask = cron.schedule(cronExpression, async () => {
    console.log('Running scheduled AI updates fetch...');
    try {
      const result = await fetchAIUpdates();
      console.log(`Scheduled fetch complete: ${result.itemsAdded} items added`);
      if (result.errors.length > 0) {
        console.error('Fetch errors:', result.errors);
      }
    } catch (error) {
      console.error('Error in scheduled AI updates fetch:', error);
    }
  });

  console.log('AI updates scheduler initialized successfully');
}

/**
 * Stop the scheduler (for cleanup)
 */
export function stopAIUpdatesScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('AI updates scheduler stopped');
  }
}

/**
 * Manually trigger a fetch (for testing or admin purposes)
 */
export async function triggerManualFetch(): Promise<void> {
  console.log('Manual AI updates fetch triggered');
  await fetchAIUpdates();
}
