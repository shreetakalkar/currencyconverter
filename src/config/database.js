const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'currency.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS rates_cache (
    base TEXT PRIMARY KEY,
    rates_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS conversion_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    amount REAL NOT NULL,
    result REAL NOT NULL,
    rate REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_currency, target_currency)
  );
`);

const seedFavorites = db.prepare('SELECT COUNT(*) as count FROM favorites').get();
if (seedFavorites.count === 0) {
  const insertFav = db.prepare('INSERT OR IGNORE INTO favorites (source_currency, target_currency) VALUES (?, ?)');
  const initialPairs = [
    ['USD', 'EUR'],
    ['USD', 'GBP'],
    ['USD', 'JPY'],
    ['EUR', 'GBP'],
    ['USD', 'CAD']
  ];
  for (const [source, target] of initialPairs) {
    insertFav.run(source, target);
  }
}

module.exports = db;
