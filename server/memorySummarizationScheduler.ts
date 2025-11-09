import cron, { type ScheduledTask } from 'node-cron';
import { generateMemorySummaries } from './memorySummarizationService';
import { config } from './config';

let scheduledTask: ScheduledTask | null = null;

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
    console.log('Running scheduled memory summarization...');
    try {
      // TODO: Replace 'default-user' with actual userId from active sessions or iterate through users
      // For now, we'll summarize for a default user or the primary user.
      const summaries = await generateMemorySummaries('default-user');
      console.log(
        `Scheduled memory summarization complete: ${summaries.length} new summaries generated`
      );
    } catch (error) {
      console.error('Error in scheduled memory summarization:', error);
    }
  });

  console.log('Memory summarization scheduler initialized successfully');
}

/**
 * Stop the scheduler (for cleanup)
 */
export function stopMemorySummarizationScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('Memory summarization scheduler stopped');
  }
}
