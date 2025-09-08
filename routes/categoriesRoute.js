const express = require("express");
const router = express.Router();
const categoriesController = require("../controller/categories");
// Rotta per ottenere tutte le categorie
router.get("/categories", categoriesController.index);
// Rotta per ottenere una categoria tramite id
router.get("/categories/:id", categoriesController.show);
// Rotta per creare una nuova categoria
router.post("/categories", categoriesController.store);
// Rotta per cambiare interamente una categoria
router.put("/categories/:id", categoriesController.update);
// Rotta per eliminare una categoria
router.delete("/categories/:id", categoriesController.destroy);
module.exports = router;
