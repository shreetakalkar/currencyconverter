const db = require('../config/database');

const historyModel = {
  record(sourceCurrency, targetCurrency, amount, result, rate) {
    const stmt = db.prepare(`
      INSERT INTO conversion_history (source_currency, target_currency, amount, result, rate)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      sourceCurrency.toUpperCase(),
      targetCurrency.toUpperCase(),
      amount,
      result,
      rate
    );
    return {
      id: info.lastInsertRowid,
      source_currency: sourceCurrency.toUpperCase(),
      target_currency: targetCurrency.toUpperCase(),
      amount,
      result,
      rate
    };
  },

  getRecent(limit = 20) {
    return db.prepare(`
      SELECT id, source_currency, target_currency, amount, result, rate, created_at
      FROM conversion_history
      ORDER BY id DESC
      LIMIT ?
    `).all(limit);
  },

  clear() {
    return db.prepare('DELETE FROM conversion_history').run();
  }
};

module.exports = historyModel;
