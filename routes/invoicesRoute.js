const express = require("express");
const router = express.Router();
const invoicesController = require("../controller/invoicesController.js");

// Rotta per ottenere tutti gli invoices
router.get("/invoices", invoicesController.index);

// Rotta per ottenere l'invoice con id corrispondente
router.get("/invoices/:id", invoicesController.show);

// Rotta per creare un nuovo invoice
router.post("/invoices", invoicesController.store);

// Rotta per cambiare interamente un invoice sconto tramite id
router.put("/invoices/:id", invoicesController.update);

// Rotta per cambiare solo alcuni campi di un invoice tramite id
router.patch("/invoices/:id", invoicesController.update);

// Rotta per eliminare un invoice sconto tramite id
router.delete("/invoices/:id", invoicesController.destroy);


module.exports = router;
