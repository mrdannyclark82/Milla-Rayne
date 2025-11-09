/**
 * YouTube News Monitor Scheduler
 *
 * Schedules and manages automated daily news monitoring.
 * Runs at configurable times and handles retries.
 */

import { runDailyNewsMonitoring } from './youtubeNewsMonitor';

// ===========================================================================================
// CONFIGURATION
// ===========================================================================================

interface SchedulerConfig {
  enabled: boolean;
  runTime: string; // HH:MM format (24-hour)
  timezone: string;
  autoAnalyzeCount: number; // How many top stories to auto-analyze
  retryAttempts: number;
  retryDelayMinutes: number;
}

const DEFAULT_CONFIG: SchedulerConfig = {
  enabled: true,
  runTime: '08:00', // 8 AM
  timezone: 'America/Chicago',
  autoAnalyzeCount: 3,
  retryAttempts: 3,
  retryDelayMinutes: 30,
};

// ===========================================================================================
// SCHEDULER STATE
// ===========================================================================================

let schedulerInterval: NodeJS.Timeout | null = null;
let lastRun: Date | null = null;
let config: SchedulerConfig = { ...DEFAULT_CONFIG };

// ===========================================================================================
// SCHEDULER FUNCTIONS
// ===========================================================================================

/**
 * Start the news monitoring scheduler
 */
export function startNewsMonitorScheduler(
  customConfig?: Partial<SchedulerConfig>
): void {
  if (schedulerInterval) {
    console.log('⚠️ News monitor scheduler already running');
    return;
  }

  // Merge custom config
  if (customConfig) {
    config = { ...config, ...customConfig };
  }

  if (!config.enabled) {
    console.log('📰 News monitor scheduler is disabled');
    return;
  }

  console.log('🚀 Starting YouTube news monitor scheduler');
  console.log(`   ⏰ Scheduled for ${config.runTime} ${config.timezone}`);
  console.log(`   🔬 Auto-analyzing top ${config.autoAnalyzeCount} stories`);

  // Check every minute if it's time to run
  schedulerInterval = setInterval(() => {
    checkAndRunNewsMonitoring();
  }, 60 * 1000); // Check every minute

  console.log('✅ News monitor scheduler started');
}

/**
 * Stop the news monitoring scheduler
 */
export function stopNewsMonitorScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('⏹️ News monitor scheduler stopped');
  }
}

/**
 * Check if it's time to run and execute if so
 */
async function checkAndRunNewsMonitoring(): Promise<void> {
  const now = new Date();

  // Check if already ran today
  if (lastRun) {
    const lastRunDate = lastRun.toLocaleDateString();
    const todayDate = now.toLocaleDateString();

    if (lastRunDate === todayDate) {
      // Already ran today
      return;
    }
  }

  // Check if current time matches schedule
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  if (currentTime === config.runTime) {
    console.log('⏰ Time to run daily news monitoring!');
    await executeNewsMonitoring();
  }
}

/**
 * Execute news monitoring with retry logic
 */
async function executeNewsMonitoring(attempt: number = 1): Promise<void> {
  try {
    console.log(
      `📰 Running daily news monitoring (attempt ${attempt}/${config.retryAttempts})...`
    );

    const digest = await runDailyNewsMonitoring();

    lastRun = new Date();
    console.log('✅ Daily news monitoring completed successfully');
    console.log(`   📊 ${digest.totalVideos} videos found`);
    console.log(`   🔬 ${digest.analysisCount} stories analyzed`);
  } catch (error) {
    console.error(
      `❌ Daily news monitoring failed (attempt ${attempt}):`,
      error
    );

    if (attempt < config.retryAttempts) {
      console.log(`⏳ Retrying in ${config.retryDelayMinutes} minutes...`);

      setTimeout(
        () => {
          executeNewsMonitoring(attempt + 1);
        },
        config.retryDelayMinutes * 60 * 1000
      );
    } else {
      console.error('❌ Daily news monitoring failed after all retry attempts');
    }
  }
}

/**
 * Run news monitoring immediately (manual trigger)
 */
export async function runNewsMonitoringNow(
  userId: string = 'default-user'
): Promise<void> {
  console.log('▶️ Manually triggering news monitoring...');

  try {
    const digest = await runDailyNewsMonitoring(userId);
    lastRun = new Date();

    console.log('✅ Manual news monitoring completed');
    console.log(`   📊 ${digest.totalVideos} videos found`);
    console.log(`   🔬 ${digest.analysisCount} stories analyzed`);

    return digest as any;
  } catch (error) {
    console.error('❌ Manual news monitoring failed:', error);
    throw error;
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  running: boolean;
  enabled: boolean;
  lastRun: Date | null;
  nextRun: string | null;
  config: SchedulerConfig;
} {
  let nextRun: string | null = null;

  if (config.enabled) {
    const now = new Date();
    const [hours, minutes] = config.runTime.split(':').map(Number);
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If already passed today, show tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    nextRun = scheduledTime.toISOString();
  }

  return {
    running: schedulerInterval !== null,
    enabled: config.enabled,
    lastRun,
    nextRun,
    config,
  };
}

/**
 * Update scheduler configuration
 */
export function updateSchedulerConfig(updates: Partial<SchedulerConfig>): void {
  const wasRunning = schedulerInterval !== null;

  // Stop if running
  if (wasRunning) {
    stopNewsMonitorScheduler();
  }

  // Update config
  config = { ...config, ...updates };

  console.log('✏️ Scheduler configuration updated:', updates);

  // Restart if was running
  if (wasRunning && config.enabled) {
    startNewsMonitorScheduler();
  }
}

// ===========================================================================================
// AUTO-START ON IMPORT (if enabled)
// ===========================================================================================

// Check if should auto-start based on environment variable
const AUTO_START = process.env.NEWS_MONITOR_AUTO_START === 'true';

if (AUTO_START) {
  console.log('🔄 Auto-starting news monitor scheduler...');
  startNewsMonitorScheduler();
}
