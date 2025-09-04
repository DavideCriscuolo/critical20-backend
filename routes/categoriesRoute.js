const express = require("express");
const router = express.Router();
const categoriesController = require("../controller/categories");
router.get("/categories", categoriesController.index);
router.get("/categories/:id", categoriesController.show);
module.exports = router;
