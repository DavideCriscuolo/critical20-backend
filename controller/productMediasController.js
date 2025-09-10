const connection = require("../db/connection");

// mostra la lista di tutti i product_medias
const index = (req, res) => {
  const sql = "SELECT * FROM product_medias";

  connection.query(sql, (err, results) => {
    if (err) {
      res.status(500).send({ error: err.message });
    } else {
      res.json(results);
    }
  });
};

// restituisce i product medias in base all'id del prodotto
const show = (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT * FROM product_medias
    WHERE product_medias.id_product = ?;
  `;

  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Errore durante la query:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "invoice non trovato" });
    }
    res.json(results);
  });
};

// creiamo un nuovo invoice (POST)
const store = (req, res) => {
  const { id_product, file_path, alt_text } = req.body;

  if (id_product === null || id_product === undefined || id_product === "") {
    return res.status(400).json({ error: "Id prodotto mancante" });
  }
  if (
    file_path === null ||
    file_path === undefined ||
    typeof file_path !== "string"
  ) {
    return res.status(400).json({ error: "Path mancante" });
  }
  if (
    file_path === null ||
    file_path === undefined ||
    typeof file_path !== "string"
  ) {
    return res.status(400).json({ error: "Alt testo mancante" });
  }

  const sql1 = "SELECT * FROM product_medias WHERE id_product=?";

  connection.query(sql1, [id_product], (err, results) => {
    if (err) {
      console.error("Errore durante la query:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    // calcoliamo la nuova posizione
    const count = results.length;
    const newPosition = count; // se 0 → parte da 0, altrimenti continua

    console.log("Nuova posizione da assegnare:", newPosition);

    const insertSql = `
    INSERT INTO product_medias (id_product, file_path, alt_text, position)
    VALUES (?, ?, ?, ?)
  `;
    connection.query(
      insertSql,
      [id_product, file_path, alt_text, newPosition],
      (err, result) => {
        if (err) {
          console.error("Errore durante l'inserimento:", err);
          return res.status(500).json({ error: "Errore nel database" });
        }

        res.status(201).json({
          message: "product_media creato con successo",
          id: result.insertId,
          position: newPosition,
        });
      }
    );
  });
};

// aggiorniamo completamente un product_media esistente tramite id (PUT)
const update = (req, res) => {
  const id = req.params.id;
  const { id_product, file_path, alt_text, position } = req.body;

  if (id_product === null || id_product === undefined || id_product === "") {
    return res.status(400).json({ error: "Id prodotto mancante" });
  }
  if (
    file_path === null ||
    file_path === undefined ||
    typeof file_path !== "string"
  ) {
    return res.status(400).json({ error: "Path mancante" });
  }
  if (
    file_path === null ||
    file_path === undefined ||
    typeof file_path !== "string"
  ) {
    return res.status(400).json({ error: "Alt testo mancante" });
  }
  const sql = `
    UPDATE product_medias
    SET id_product = ?, file_path = ?, alt_text = ?, position = ?
    WHERE id = ?
  `;

  connection.query(
    sql,
    [id_product, file_path, alt_text, position, id],
    (err, result) => {
      if (err) {
        console.error("Errore durante l'aggiornamento:", err);
        return res.status(500).json({ error: "Errore nel database" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Product media non trovato" });
      }

      res.json({ message: "Product media aggiornato con successo" });
    }
  );
};

// eliminiamo il singolo product_media tramite id (DELETE)
const destroy = (req, res) => {
  const id = req.params.id;

  const sql = "DELETE FROM product_medias WHERE id = ?";

  connection.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Errore durante l'eliminazione:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product media non trovato" });
    }

    res.json({ message: "Product media eliminato con successo" });
  });
};

module.exports = { index, show, store, update, destroy };
