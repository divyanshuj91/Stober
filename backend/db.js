const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'sessions.sqlite');
let db;

function initDB() {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database', err.message);
    } else {
      console.log('Connected to SQLite database.');
      db.run(`CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        features TEXT,
        score REAL,
        flags TEXT,
        timestamp INTEGER,
        label TEXT DEFAULT 'unknown'
      )`);
    }
  });
}

function logSession(sessionId, features, result) {
  return new Promise((resolve, reject) => {
    const { trustScore, flags } = result;
    const stmt = db.prepare(`INSERT INTO logs (session_id, features, score, flags, timestamp) VALUES (?, ?, ?, ?, ?)`);
    stmt.run(sessionId, JSON.stringify(features), trustScore, JSON.stringify(flags), Date.now(), function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
    stmt.finalize();
  });
}

function getLogs() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function updateLabel(id, label) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE logs SET label = ? WHERE id = ?`, [label, id], function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = {
  initDB,
  logSession,
  getLogs,
  updateLabel
};
