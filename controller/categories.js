const connection = require("../db/connection");

const dotenv = require("dotenv");
dotenv.config();


// mostriamo l'elenco delle categorie (GET)
const index = (req, res) => {
  const sql = "SELECT * FROM categories";

  connection.query(sql, (err, results) => {
    if (err) {
      res.status(500).send({ error: err.message });
    } else {
      res.json(results);
    }
  });
};


//mostriamo la singola categoria con anche tutti i prodotti che hanno quella categoria (GET)
const show = (req, res) => {
  const id = parseInt(req.params.id);

  // Prima query: prendo i dati della categoria
  const sqlCategory = "SELECT * FROM categories WHERE id = ?";

  connection.query(sqlCategory, [id], (err, categoryResults) => {
    if (err) {
      return res.status(500).json({ error: true, mess: err.message });
    }
    if (categoryResults.length === 0) {
      return res.status(404).json({ error: true, mess: "category not found" });
    }

    const category = categoryResults[0];

    // Seconda query: prendo i giochi collegati
    const sqlProducts = `
      SELECT 
        p.*,
        GROUP_CONCAT(DISTINCT pm.file_path) AS file_path,
        GROUP_CONCAT(DISTINCT c.name) AS categories
      FROM boardgames_shop.products p
      JOIN product_medias pm ON p.id = pm.id_product
      JOIN product_category pc ON p.id = pc.id_product
      JOIN categories c ON pc.id_category = c.id
      WHERE pc.id_category = ?
      GROUP BY p.id, p.name;
    `;

    connection.query(sqlProducts, [id], (err, productResults) => {
      if (err) {
        return res.status(500).json({ error: true, mess: err.message });
      }

      // Risposta finale "ibrida"
      res.json({
        ...category,
        products: productResults
      });
    });
  });
};

//creiamo una nuova categoria (POST)
const store = (req, res) => {
  const {name, description} = req.body;
  if (!name || !description) {
    return res.status(400).json({ error: "Dati mancanti" });
  }

  const sql = `
    INSERT INTO categories (name , description)
    VALUES(?, ?)
  `;

  connection.query(sql, [name, description], (err, result) => {
    if(err){
      console.log("errore durante l'inserimento:", err)
      return res.status(500).json({error: "Errore nel database"})
    }

    res.status(201).json({message: "Categoria creata con successo", id: result.insertId})
  });
}

//aggiorniamo tutti i campi di una categoria (Put)
const update = (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).json({ error: "Dati mancanti" });
  }

  const sql = `
    UPDATE categories 
    SET name = ?, description = ?
    WHERE id = ?
  `;

  connection.query(sql, [name, description, id], (err, result) => {
    if (err) {
      console.log("errore durante l'aggiornamento:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Categoria non trovata" });
    }

    res.json({ message: "Categoria aggiornata con successo" });
  });
}

// eliminiamo una categoria (DELETE)
const destroy = (req, res) => {
  const id = parseInt(req.params.id);

  const sql = "DELETE FROM categories WHERE id = ?";

  connection.query(sql, [id], (err, result) => {
    if (err) {
      console.log("errore durante l'eliminazione:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Categoria non trovata" });
    }

    res.json({ message: "Categoria eliminata con successo" });
  });
};

module.exports = {
  index,
  show,
  store,
  update,
  destroy
};
