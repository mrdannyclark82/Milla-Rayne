import sys

with open('server/metacognitiveService.ts', 'r') as f:
    content = f.read()

# Import injection
import_marker = "import type { AgentTask } from './agents/taskStorage';"
import_injection = """import type { AgentTask } from './agents/taskStorage';
import { config } from './config';
import { storage } from './storage';
import { getEmailOutbox, writeEmailOutbox } from './agents/emailDeliveryWorker';"""

content = content.replace(import_marker, import_injection)

# Logic injection
logic_marker = """    // TODO: In production:
    // 1. Trigger immediate notification to admin
    // 2. Create high-priority task for coding agent
    // 3. Optionally pause affected agent until fix is deployed
    // await notifyAdminCriticalFailure(failureContext);
    // await createUrgentFixTask(failureContext);"""

logic_injection = """    // 1. Trigger immediate notification to admin
    await notifyAdminCriticalFailure(failureContext);

    // 2. Create high-priority task for coding agent
    await createUrgentFixTask(failureContext);

    // 3. Optionally pause affected agent until fix is deployed
    // TODO: Implement agent pausing logic (requires AgentController support)"""

content = content.replace(logic_marker, logic_injection)

# Helper functions injection
end_marker = """export function clearSCPAQueue(): void {
  const clearedCount = scpaQueue.length;
  scpaQueue.length = 0;
  console.log(`🧹 [SCPA] Queue cleared: ${clearedCount} items removed`);
}"""

helpers_injection = """export function clearSCPAQueue(): void {
  const clearedCount = scpaQueue.length;
  scpaQueue.length = 0;
  console.log(`🧹 [SCPA] Queue cleared: ${clearedCount} items removed`);
}

/**
 * Notify admin about a critical failure
 */
async function notifyAdminCriticalFailure(
  context: AgentFailureContext
): Promise<void> {
  try {
    let toAddress = config.admin.email;

    if (!toAddress) {
      // Try to find an active user to notify
      try {
        const sessions = await storage.getActiveUserSessions();
        if (sessions && sessions.length > 0) {
          const user = await storage.getUserById(sessions[0].userId);
          if (user && user.email) {
            toAddress = user.email;
          }
        }
      } catch (err) {
        console.warn('[SCPA] Failed to find active user for notification', err);
      }
    }

    if (!toAddress) {
      // Fallback to configured from address if available, assuming admin checks it
      toAddress = config.email.fromAddress;
    }

    if (!toAddress) {
      console.error(
        '[SCPA] ❌ Could not determine admin email for critical failure notification'
      );
      return;
    }

    const subject = `🚨 CRITICAL ALERT: ${context.agentName} Failure`;
    const body = `
CRITICAL FAILURE DETECTED

Agent: ${context.agentName}
Task ID: ${context.taskId}
Time: ${new Date(context.timestamp).toISOString()}
Error: ${context.error}

Stack Trace:
${context.stackTrace || 'No stack trace available'}

Context:
${JSON.stringify(context.taskContext, null, 2)}

This requires immediate attention. A high-priority fix task has been created.
`;

    const outbox = await getEmailOutbox();
    const { v4: uuidv4 } = await import('uuid');

    outbox.push({
      id: uuidv4(),
      to: toAddress,
      subject,
      body,
      html: body.replace(/\\n/g, '<br>'),
      createdAt: new Date().toISOString(),
      sent: false,
      attempts: 0,
      priority: 'high',
    });

    await writeEmailOutbox(outbox);
    console.log(`[SCPA] 📧 Critical failure notification queued for ${toAddress}`);
  } catch (err) {
    console.error('[SCPA] Failed to queue critical failure notification:', err);
  }
}

/**
 * Create a high-priority task for the coding agent to fix the critical failure
 */
async function createUrgentFixTask(context: AgentFailureContext): Promise<void> {
  try {
    const { addTask } = await import('./agents/taskStorage');
    const { v4: uuidv4 } = await import('uuid');

    const fixTaskId = uuidv4();
    await addTask({
      taskId: fixTaskId,
      agent: 'codingAgent',
      action: 'emergency_fix',
      supervisor: 'SCPA',
      payload: {
        description: `EMERGENCY FIX for ${context.agentName}: ${context.error}`,
        priority: 'critical',
        scpaFailure: true,
        originalError: context,
        attemptCount: context.attemptCount,
        instructions:
          'Analyze the attached error context and apply a fix immediately. Verify the fix before marking complete.',
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
      metadata: {
        priority: 'critical', // Explicit priority field in metadata
        scpaFailure: true,
        originalError: context,
      },
    } as any);

    console.log(
      `[SCPA] 🚑 Emergency fix task created for coding agent: ${fixTaskId}`
    );
  } catch (err) {
    console.error('[SCPA] Failed to create emergency fix task:', err);
  }
}"""

content = content.replace(end_marker, helpers_injection)

with open('server/metacognitiveService.ts', 'w') as f:
    f.write(content)
