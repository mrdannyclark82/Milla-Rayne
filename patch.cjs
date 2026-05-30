const fs = require('fs');

let content = fs.readFileSync('server/fileStorage.ts', 'utf8');

// 1. Add fields to class
content = content.replace(
  '  private messages: Map<string, Message>;',
  '  private messages: Map<string, Message>;\n  private userMessageIds: Map<string, Set<string>>;\n  private globalMessageIds: Set<string>;'
);

// 2. Initialize in constructor
content = content.replace(
  '    this.messages = new Map();',
  '    this.messages = new Map();\n    this.userMessageIds = new Map();\n    this.globalMessageIds = new Set();'
);

// 3. Populate indexes in loadMessages
content = content.replace(
  '            this.messages.set(msg.id, processedMessage);',
  `            this.messages.set(msg.id, processedMessage);\n            \n            if (processedMessage.userId) {\n              if (!this.userMessageIds.has(processedMessage.userId)) {\n                this.userMessageIds.set(processedMessage.userId, new Set());\n              }\n              this.userMessageIds.get(processedMessage.userId)!.add(msg.id);\n            } else {\n              this.globalMessageIds.add(msg.id);\n            }`
);

// 4. Update indexes in createMessage
content = content.replace(
  '    this.messages.set(id, message);',
  `    this.messages.set(id, message);\n    if (message.userId) {\n      if (!this.userMessageIds.has(message.userId)) {\n        this.userMessageIds.set(message.userId, new Set());\n      }\n      this.userMessageIds.get(message.userId)!.add(id);\n    } else {\n      this.globalMessageIds.add(id);\n    }`
);

// 5. Optimize getMessages
const getMessagesOld = `
  async getMessages(userId?: string): Promise<Message[]> {
    await this.initPromise;
    try {
      const allMessages = Array.from(this.messages.values());
      if (userId) {
        return allMessages.filter(
          (message) => message.userId === userId || message.userId === null
        );
      }
      // Ensure timestamps are Date objects before sorting
      return allMessages.sort((a, b) => {
        const timestampA =
          a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const timestampB =
          b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return timestampA.getTime() - timestampB.getTime();
      });
    } catch (error) {
      console.error('Error in getMessages:', error);
      // Return empty array as fallback
      return [];
    }
  }
`;

const getMessagesNew = `
  async getMessages(userId?: string): Promise<Message[]> {
    await this.initPromise;
    try {
      let filteredMessages: Message[] = [];

      if (userId) {
        // Optimize O(N) array filtering to O(K) where K is user's messages
        const userSet = this.userMessageIds.get(userId);

        // Add user specific messages
        if (userSet) {
          for (const msgId of userSet) {
            const msg = this.messages.get(msgId);
            if (msg) filteredMessages.push(msg);
          }
        }

        // Add global messages (userId === null)
        for (const msgId of this.globalMessageIds) {
          const msg = this.messages.get(msgId);
          if (msg) filteredMessages.push(msg);
        }
      } else {
        filteredMessages = Array.from(this.messages.values());
      }

      // Ensure timestamps are Date objects before sorting
      return filteredMessages.sort((a, b) => {
        const timestampA =
          a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const timestampB =
          b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return timestampA.getTime() - timestampB.getTime();
      });
    } catch (error) {
      console.error('Error in getMessages:', error);
      // Return empty array as fallback
      return [];
    }
  }
`;

content = content.replace(getMessagesOld.trim(), getMessagesNew.trim());

fs.writeFileSync('server/fileStorage.ts', content, 'utf8');
console.log('File patched successfully');
