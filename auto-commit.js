#!/usr/bin/env node

const chokidar = require('chokidar');
const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const REPO_PATH = __dirname;
const IGNORED_PATHS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/*.log',
  '**/memory/milla.db*',
  '**/.env'
];

let changesPending = false;
let isCommitting = false;

function execCommand(command, cwd = REPO_PATH) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr, stdout });
        return;
      }
      resolve(stdout.trim());
    });
  });
}

async function hasGitChanges() {
  try {
    const status = await execCommand('git status --porcelain');
    return status.length > 0;
  } catch (err) {
    console.error('Error checking git status:', err.stderr || err.message);
    return false;
  }
}

async function commitChanges() {
  if (isCommitting) {
    console.log('[Auto-Commit] Already committing, skipping...');
    return;
  }

  try {
    isCommitting = true;
    
    const hasChanges = await hasGitChanges();
    if (!hasChanges) {
      console.log('[Auto-Commit] No changes to commit');
      changesPending = false;
      return;
    }

    console.log('[Auto-Commit] Adding changes...');
    await execCommand('git add .');

    const timestamp = new Date().toISOString();
    const commitMessage = `WIP: Auto-commit from local watcher (${timestamp})`;
    
    console.log('[Auto-Commit] Committing changes...');
    await execCommand(`git commit -m "${commitMessage}"`);
    
    console.log(`[Auto-Commit] ✓ Successfully committed at ${timestamp}`);
    changesPending = false;
  } catch (err) {
    if (err.stdout && err.stdout.includes('nothing to commit')) {
      console.log('[Auto-Commit] No changes to commit');
      changesPending = false;
    } else {
      console.error('[Auto-Commit] ✗ Error during commit:', err.stderr || err.message);
    }
  } finally {
    isCommitting = false;
  }
}

async function pushToOrigin() {
  try {
    console.log('[Auto-Push] Checking for changes to push...');
    
    const hasChanges = await hasGitChanges();
    if (hasChanges) {
      console.log('[Auto-Push] Uncommitted changes detected, committing first...');
      await commitChanges();
    }

    const branch = await execCommand('git branch --show-current');
    console.log(`[Auto-Push] Pushing ${branch} to origin...`);
    
    await execCommand(`git push origin ${branch}`);
    console.log(`[Auto-Push] ✓ Successfully pushed to origin/${branch}`);
  } catch (err) {
    if (err.stderr && err.stderr.includes('Everything up-to-date')) {
      console.log('[Auto-Push] Everything up-to-date');
    } else if (err.stderr && err.stderr.includes('no upstream branch')) {
      console.error('[Auto-Push] ✗ No upstream branch configured. Set with: git push -u origin <branch>');
    } else {
      console.error('[Auto-Push] ✗ Error during push:', err.stderr || err.message);
    }
  }
}

async function checkGitRepo() {
  try {
    await execCommand('git rev-parse --git-dir');
    return true;
  } catch {
    console.error('Error: Not a git repository');
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Milla-Rayne Auto-Commit Watcher');
  console.log('='.repeat(60));
  console.log(`Repository: ${REPO_PATH}`);
  console.log(`Started at: ${new Date().toISOString()}\n`);

  const isGitRepo = await checkGitRepo();
  if (!isGitRepo) {
    process.exit(1);
  }

  console.log('[Watcher] Initializing file watcher...');
  const watcher = chokidar.watch(REPO_PATH, {
    ignored: IGNORED_PATHS,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  watcher
    .on('add', filePath => {
      console.log(`[Watcher] File added: ${path.relative(REPO_PATH, filePath)}`);
      changesPending = true;
    })
    .on('change', filePath => {
      console.log(`[Watcher] File changed: ${path.relative(REPO_PATH, filePath)}`);
      changesPending = true;
    })
    .on('unlink', filePath => {
      console.log(`[Watcher] File removed: ${path.relative(REPO_PATH, filePath)}`);
      changesPending = true;
    })
    .on('error', error => {
      console.error('[Watcher] ✗ Error:', error);
    })
    .on('ready', () => {
      console.log('[Watcher] ✓ Ready and watching for changes\n');
    });

  console.log('[Cron] Setting up scheduled tasks...');
  
  cron.schedule('*/15 * * * *', async () => {
    console.log(`\n[Cron] 15-minute check triggered at ${new Date().toISOString()}`);
    if (changesPending) {
      await commitChanges();
    } else {
      console.log('[Cron] No pending changes detected');
    }
  });
  console.log('[Cron] ✓ Auto-commit every 15 minutes');

  cron.schedule('0 0 * * *', async () => {
    console.log(`\n[Cron] Daily push triggered at ${new Date().toISOString()}`);
    await pushToOrigin();
  });
  console.log('[Cron] ✓ Auto-push daily at midnight');

  console.log('\n' + '='.repeat(60));
  console.log('Watcher is running. Press Ctrl+C to stop.');
  console.log('='.repeat(60) + '\n');

  process.on('SIGINT', () => {
    console.log('\n\n[Shutdown] Stopping watcher...');
    watcher.close();
    console.log('[Shutdown] Goodbye!');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n\n[Shutdown] Received SIGTERM, stopping watcher...');
    watcher.close();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
