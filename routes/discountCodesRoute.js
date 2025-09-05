const express = require("express");
const router = express.Router();
const discountCodesController = require("../controller/discountCodesController.js");

// Rotta per ottenere tutti i codici sconto
router.get("/discoutCodes", discountCodesController.index);

// Rotta per ottenere il codice sconto valido che corrisponde al code
router.get("/discoutCodes/:code", discountCodesController.show);

// Rotta per creare un nuovo codice sconto
router.post("/discoutCodes", discountCodesController.store);

// Rotta per cambiare interamente un codice sconto tramite id
router.put("/discoutCodes/:id", discountCodesController.update);

// Rotta per cambiare solo alcuni campi un codice sconto tramite id
router.patch("/discoutCodes/:id", discountCodesController.update);

// Rotta per eliminare un codice sconto tramite id
router.delete("/discoutCodes/:id", discountCodesController.destroy);


module.exports = router;
