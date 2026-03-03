const fs = require('fs');
const content = fs.readFileSync('server/agents/worker.ts', 'utf8');
console.log(content.includes('task.taskId') ? 'Found task.taskId' : 'Not found');
const lines = content.split('\n');
console.log('Lines 98-105:');
lines.slice(97, 105).forEach((line, i) => console.log(`${i+98}: ${line}`));
