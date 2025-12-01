const Database = require('better-sqlite3');

const db = new Database('./memory/milla.db');

try {
  const stmt = db.prepare("SELECT id, content, timestamp FROM messages ORDER BY timestamp DESC LIMIT 10;");
  const rows = stmt.all();
  console.log('Recent messages:');
  rows.forEach(row => {
    console.log(`ID: ${row.id}, Timestamp: ${row.timestamp}, Content: ${row.content.substring(0, 100)}...`);
  });
} catch (err) {
  console.error(err.message);
} finally {
  db.close();
}