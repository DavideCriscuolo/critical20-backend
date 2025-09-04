const express = require("express");
const router = express.Router();
const categoriesController = require("../controller/categories");
router.get("/categories", categoriesController.index);
module.exports = router;
