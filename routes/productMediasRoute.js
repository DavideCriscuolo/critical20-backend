const express = require("express");
const router = express.Router();
const productMediasController = require("../controller/productMediasController.js");

// Rotta per ottenere tutti i product medias
router.get("/productMedias", productMediasController.index);

// Rotta per ottenere i product medias con id del gioco corrispondente
router.get("/productMedias/:id", productMediasController.show);

// Rotta per creare un nuovo product media
router.post("/productMedias", productMediasController.store);

// Rotta per cambiare interamente un product media tramite id
router.put("/productMedias/:id", productMediasController.update);


// Rotta per eliminare un product media tramite id
router.delete("/productMedias/:id", productMediasController.destroy);


module.exports = router;
