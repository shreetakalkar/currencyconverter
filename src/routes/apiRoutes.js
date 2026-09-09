const express = require('express');
const router = express.Router();

const currencyController = require('../controllers/currencyController');
const favoriteController = require('../controllers/favoriteController');
const historyController = require('../controllers/historyController');

router.get('/currencies', currencyController.getCurrencies);
router.get('/rates', currencyController.getRates);
router.post('/convert', currencyController.convert);
router.get('/history/trends', currencyController.getHistoricalTrends);
router.get('/travel-budget', currencyController.getTravelBudget);

router.get('/favorites', favoriteController.getFavorites);
router.post('/favorites', favoriteController.addFavorite);
router.delete('/favorites/:id', favoriteController.removeFavorite);

router.get('/history', historyController.getHistory);
router.delete('/history', historyController.clearHistory);

module.exports = router;
