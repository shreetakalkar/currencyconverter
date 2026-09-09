const favoriteModel = require('../models/favoriteModel');
const exchangeService = require('../services/exchangeService');

const favoriteController = {
  async getFavorites(req, res) {
    try {
      const favorites = favoriteModel.getAll();
      const enrichedFavorites = await Promise.all(
        favorites.map(async (fav) => {
          try {
            const rates = await exchangeService.getLiveRates(fav.source_currency);
            const rate = rates[fav.target_currency] || null;
            return {
              ...fav,
              currentRate: rate
            };
          } catch {
            return {
              ...fav,
              currentRate: null
            };
          }
        })
      );
      return res.json({ success: true, data: enrichedFavorites });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  addFavorite(req, res) {
    try {
      const { source, target } = req.body;
      if (!source || !target) {
        return res.status(400).json({ success: false, error: 'Source and target currencies required' });
      }
      if (source.toUpperCase() === target.toUpperCase()) {
        return res.status(400).json({ success: false, error: 'Source and target currencies must be different' });
      }
      const newFav = favoriteModel.add(source, target);
      return res.status(201).json({ success: true, data: newFav });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  removeFavorite(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid favorite ID' });
      }
      favoriteModel.remove(id);
      return res.json({ success: true, message: 'Favorite removed successfully' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = favoriteController;
