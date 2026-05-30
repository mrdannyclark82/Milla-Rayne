const fs = require('fs');
let content = fs.readFileSync('server/agents/worker.ts', 'utf8');
content = content.replace(
  "console.error('Worker error running task', task.taskId, err);",
  "console.error('Worker error running task', task?.taskId, err);"
);
content = content.replace(
  "await updateTask(task.taskId, {",
  "if (task?.taskId) await updateTask(task.taskId, {"
);
fs.writeFileSync('server/agents/worker.ts', content, 'utf8');
