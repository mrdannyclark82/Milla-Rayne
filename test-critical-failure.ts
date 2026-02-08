import { reportAgentFailure } from './server/metacognitiveService';

// Mock dependencies
import * as emailWorker from './server/agents/emailDeliveryWorker';
import * as taskStorage from './server/agents/taskStorage';
import { config } from './server/config';
import { storage } from './server/storage';

// Since we are running in tsx, we can't easily mock imports like jest/vitest.
// But we can monkey-patch the imported modules if they are mutable, or just run it and see the console output.
// The service imports dynamically, so monkey-patching static imports might not work for dynamic ones.
// However, metacognitiveService uses static imports for config/storage/emailWorker now (based on my patch).

// Monkey patch emailWorker
(emailWorker as any).getEmailOutbox = async () => [];
(emailWorker as any).writeEmailOutbox = async (items: any[]) => {
  console.log('[[MOCK]] writeEmailOutbox called with:', JSON.stringify(items, null, 2));
};

// Monkey patch config
(config as any).admin = { email: 'admin@test.com' };

// Monkey patch storage
(storage as any).getActiveUserSessions = async () => [{ userId: 'user-1' }];
(storage as any).getUserById = async () => ({ email: 'user@test.com' });

// We need to handle taskStorage which is dynamically imported in the service.
// We can't easily mock dynamic imports in a simple script without a loader hook.
// But we can let it run and fail or see if it works if the file exists.
// server/agents/taskStorage.ts exists.

async function run() {
  console.log('Running critical failure test...');
  try {
    await reportAgentFailure(new Error('CRITICAL FAILURE TEST'), {
      agentName: 'TestAgent',
      severity: 'critical'
    });
  } catch (err) {
    console.error('Error running test:', err);
  }
}

run();
