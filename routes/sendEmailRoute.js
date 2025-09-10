const express = require("express");
const router = express.Router();
const sendEmailController = require("../controller/sendEmailController.js");

// Rotta per inviare email
router.post("/sendEmailWelcome", sendEmailController.sendEmailWelcome);

module.exports = router;
