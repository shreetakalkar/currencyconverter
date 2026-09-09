const db = require('../config/database');

const cacheModel = {
  get(base) {
    const row = db.prepare('SELECT rates_json, updated_at FROM rates_cache WHERE base = ?').get(base.toUpperCase());
    if (!row) {
      return null;
    }
    try {
      return {
        rates: JSON.parse(row.rates_json),
        updated_at: row.updated_at
      };
    } catch {
      return null;
    }
  },

  set(base, rates) {
    const stmt = db.prepare(`
      INSERT INTO rates_cache (base, rates_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(base) DO UPDATE SET
        rates_json = excluded.rates_json,
        updated_at = excluded.updated_at
    `);
    stmt.run(base.toUpperCase(), JSON.stringify(rates), Date.now());
  }
};

module.exports = cacheModel;
