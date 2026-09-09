const db = require('../config/database');

const favoriteModel = {
  getAll() {
    return db.prepare(`
      SELECT id, source_currency, target_currency, created_at
      FROM favorites
      ORDER BY id ASC
    `).all();
  },

  add(sourceCurrency, targetCurrency) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO favorites (source_currency, target_currency)
      VALUES (?, ?)
    `);
    const info = stmt.run(sourceCurrency.toUpperCase(), targetCurrency.toUpperCase());
    return {
      id: info.lastInsertRowid,
      source_currency: sourceCurrency.toUpperCase(),
      target_currency: targetCurrency.toUpperCase()
    };
  },

  remove(id) {
    return db.prepare('DELETE FROM favorites WHERE id = ?').run(id);
  },

  exists(sourceCurrency, targetCurrency) {
    const row = db.prepare(`
      SELECT id FROM favorites
      WHERE source_currency = ? AND target_currency = ?
    `).get(sourceCurrency.toUpperCase(), targetCurrency.toUpperCase());
    return !!row;
  }
};

module.exports = favoriteModel;
