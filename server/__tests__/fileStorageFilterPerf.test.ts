import { describe, it, expect } from 'vitest';
import { FileStorage } from '../fileStorage';

describe('FileStorage getMessages Performance', () => {
  it('measures getMessages with and without userId for a large number of messages', async () => {
    const storage = new FileStorage();
    // Use an internal hack to populate the messages map quickly
    const numMessages = 1000000;
    const targetUserId = 'target-user';
    const otherUserId = 'other-user';

    // @ts-ignore
    storage.initPromise = Promise.resolve(); // Bypass load

    // populate map
    for (let i = 0; i < numMessages; i++) {
      const isTarget = i % 100 === 0;
      const msg = {
        id: `msg-${i}`,
        content: `Content ${i}`,
        role: 'user',
        timestamp: new Date(Date.now() - i * 1000), // sequential descending
        userId: isTarget ? targetUserId : otherUserId
      };
      // @ts-ignore
      storage.messages.set(msg.id, msg);
      // @ts-ignore
      if (msg.userId) {
        // @ts-ignore
        if (!storage.userMessageIds.has(msg.userId)) { storage.userMessageIds.set(msg.userId, new Set()); }
        // @ts-ignore
        storage.userMessageIds.get(msg.userId).add(msg.id);
      } else {
        // @ts-ignore
        storage.globalMessageIds.add(msg.id);
      }
    }

    const startNoUser = Date.now();
    await storage.getMessages();
    const durationNoUser = Date.now() - startNoUser;

    const startWithUser = Date.now();
    const filteredMessages = await storage.getMessages(targetUserId);
    const durationWithUser = Date.now() - startWithUser;

    console.log(`getMessages (no user, ${numMessages} items): ${durationNoUser}ms`);
    console.log(`getMessages (with user, ${numMessages} items): ${durationWithUser}ms`);
    console.log(`Filtered count: ${filteredMessages.length}`);

    expect(filteredMessages.length).toBe(numMessages / 100);
  });
});
