import cron from 'node-cron';
import { migrateMemories } from './migrateToSqlite.js';

// Schedule daily migration at 02:00 (server local time)
const CRON_SCHEDULE = process.env.MIGRATION_CRON || '0 2 * * *';

console.log(`Starting migration scheduler (cron: ${CRON_SCHEDULE})`);

// Run immediately once on startup if requested
if (process.env.MIGRATION_RUN_ON_START === 'true') {
  console.log('Running migration immediately on scheduler start...');
  migrateMemories().catch((err) =>
    console.error('Scheduled immediate migration failed:', err)
  );
}

// Schedule daily
cron.schedule(CRON_SCHEDULE, async () => {
  console.log('Scheduled migration starting...');
  try {
    await migrateMemories();
    console.log('Scheduled migration finished successfully');
  } catch (err) {
    console.error('Scheduled migration failed:', err);
  }
});

// Keep the process alive when started directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Migration scheduler running. Press Ctrl+C to exit.');
}
