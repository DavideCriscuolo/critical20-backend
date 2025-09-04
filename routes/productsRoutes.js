const express = require('express');
const router = express.Router();
const productsController = require('../controller/productsController.js');

// Rotta per ottenere tutti i prodotti
router.get('/products', productsController.index);



module.exports = router;
