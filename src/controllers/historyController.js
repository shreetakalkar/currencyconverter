const historyModel = require('../models/historyModel');

const historyController = {
  getHistory(req, res) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const history = historyModel.getRecent(limit);
      return res.json({ success: true, data: history });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  clearHistory(req, res) {
    try {
      historyModel.clear();
      return res.json({ success: true, message: 'History cleared successfully' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = historyController;
