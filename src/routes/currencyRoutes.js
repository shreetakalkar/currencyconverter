const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');
const { validateConversion } = require('../middleware/validator');

router.get('/currencies', currencyController.getCurrencies);
router.get('/rates', currencyController.getRates);
router.post('/convert', validateConversion, currencyController.convert);
router.get('/history/trends', currencyController.getHistoricalTrends);
router.get('/travel-budget', currencyController.getTravelBudget);

module.exports = router;
