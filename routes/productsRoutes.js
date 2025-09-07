const express = require("express");
const router = express.Router();
const productsController = require("../controller/productsController.js");

// Rotta per ottenere tutti i prodotti
router.get("/products", productsController.index);
// Rotta per ottenere i nuovi prodotti inseriti
router.get("/products/new", productsController.showNew);
// Rotta per ottenere il singolo prodotto
router.get("/products/:id", productsController.show);
// Rotta per creare un nuovo prodotto
router.post("/products/insert", productsController.store);
// Rotta per cambiare interamente un prodotto tramite id
router.put("/products/:id", productsController.modify);
//Rotta per eliminare un prodotto tramite id
router.delete("/products/:id", productsController.destroy);
module.exports = router;
