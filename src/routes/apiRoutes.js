const express = require('express');
const router = express.Router();

const currencyRoutes = require('./currencyRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const historyRoutes = require('./historyRoutes');

router.use('/', currencyRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/history', historyRoutes);

module.exports = router;
