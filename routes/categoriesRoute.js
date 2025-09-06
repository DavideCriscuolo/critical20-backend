const express = require("express");
const router = express.Router();
const categoriesController = require("../controller/categories");
router.get("/categories", categoriesController.index);
router.get("/categories/:id", categoriesController.show);
router.post("/categories", categoriesController.store);
router.put("/categories/:id", categoriesController.update);
router.delete("/categories/:id", categoriesController.destroy);
module.exports = router;
