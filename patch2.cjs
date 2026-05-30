const fs = require('fs');

let content = fs.readFileSync('server/__tests__/fileStorageFilterPerf.test.ts', 'utf8');
content = content.replace(
  'storage.messages.set(msg.id, msg);',
  'storage.messages.set(msg.id, msg);\n      // @ts-ignore\n      if (msg.userId) {\n        // @ts-ignore\n        if (!storage.userMessageIds.has(msg.userId)) { storage.userMessageIds.set(msg.userId, new Set()); }\n        // @ts-ignore\n        storage.userMessageIds.get(msg.userId).add(msg.id);\n      } else {\n        // @ts-ignore\n        storage.globalMessageIds.add(msg.id);\n      }'
);
fs.writeFileSync('server/__tests__/fileStorageFilterPerf.test.ts', content, 'utf8');
