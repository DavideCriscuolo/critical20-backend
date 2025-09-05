const express = require("express");
const router = express.Router();
const discountCodesController = require("../controller/discountCodesController.js");

// Rotta per ottenere tutti i prodotti
router.get("/discoutCodes", discountCodesController.index);


module.exports = router;
