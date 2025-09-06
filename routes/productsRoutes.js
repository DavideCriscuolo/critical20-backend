const express = require("express");
const router = express.Router();
const productsController = require("../controller/productsController.js");

// Rotta per ottenere tutti i prodotti
router.get("/products", productsController.index);
router.get("/products/new", productsController.showNew);
router.get("/products/:id", productsController.show);
router.post("/products/insert", productsController.store);
router.put("/products/:id", productsController.modify);
router.delete("/products/:id", productsController.destroy);
module.exports = router;
