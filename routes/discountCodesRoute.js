const express = require("express");
const router = express.Router();
const discountCodesController = require("../controller/discountCodesController.js");

// Rotta per ottenere tutti i codici sconto
router.get("/discoutCodes", discountCodesController.index);
// Rotta per ottenere il codice sconto valido che corrisponde al code
router.get("/discoutCodes/:code", discountCodesController.show);


module.exports = router;
