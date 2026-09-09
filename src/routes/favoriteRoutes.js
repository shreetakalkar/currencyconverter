const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { validateFavorite } = require('../middleware/validator');

router.get('/', favoriteController.getFavorites);
router.post('/', validateFavorite, favoriteController.addFavorite);
router.delete('/:id', favoriteController.removeFavorite);

module.exports = router;
