const express = require("express");
const router = express.Router();
const orderItemController = require("../controller/orderItemsController.js");

// Rotta per ottenere tutti gli order items
router.get("/orderItem", orderItemController.index);

// Rotta per ottenere l' order item tramite id
router.get("/orderItem/:id", orderItemController.show);

// Rotta per ottenere gli order items con id dell'invoice
router.get("/orderItemByInvoice/:id", orderItemController.showByinvoice);

// Rotta per creare un nuovo order item
router.post("/orderItem", orderItemController.store);

// Rotta per cambiare interamente un order item
router.put("/orderItem/:id", orderItemController.update);


// Rotta per eliminare un order item tramite id
router.delete("/orderItem/:id", orderItemController.destroy);


module.exports = router;
