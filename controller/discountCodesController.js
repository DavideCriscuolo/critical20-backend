const connection = require("../db/connection");


// mostra la lista di tutti i codici sconto
const index = (req, res) => {
  const sql = "SELECT * FROM discount_codes";

  connection.query(sql, (err, results) => {
    if (err) {
      res.status(500).send({ error: err.message });
    } else {
      res.json(results);
    }
  });
};

// restituisce il singolo codice sconto verificando se è ancora valido e non è stato usato usando 'code'
const show = (req, res) => {
  const code = req.params.code.toUpperCase();
  const sql= `
    SELECT * FROM boardgames_shop.discount_codes
    WHERE discount_codes.code = ?
    AND valid_from <= CURDATE()
    AND valid_to >= CURDATE()
    AND is_used = false
  `

  connection.query(sql, [code], (err, results) => {
    if (err) {
      console.error("Errore durante la query:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Codice sconto non trovato" });
    }
    res.json(results);
  });
}

// creiamo un nuovo codice sconto (POST)
const store = (req, res) => {
  const { code, value, valid_from, valid_to } = req.body;

  if (!code || !value || !valid_from || !valid_to) {
    return res.status(400).json({ error: "Dati mancanti" });
  }

  const sql = `
    INSERT INTO boardgames_shop.discount_codes (code, value, valid_from, valid_to, is_used)
    VALUES (?, ?, ?, ?, false)
  `;

  connection.query(sql, [code.toUpperCase(), value, valid_from, valid_to], (err, result) => {
    if (err) {
      console.error("Errore durante l'inserimento:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    res.status(201).json({ message: "Codice sconto creato con successo", id: result.insertId });
  });
}

// aggiorniamo completamente un codice sconto già esistente tramite id (PUT)
const update = (req, res) => {
  const { id } = req.params;
  const { code, value, valid_from, valid_to, is_used } = req.body;

  const sql = `
    UPDATE boardgames_shop.discount_codes
    SET code = ?, value = ?, valid_from = ?, valid_to = ?, is_used = ?
    WHERE id = ?
  `;

  connection.query(sql, [code.toUpperCase(), value, valid_from, valid_to, is_used, id], (err, result) => {
    if (err) {
      console.error("Errore durante l'aggiornamento:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Codice sconto non trovato" });
    }

    res.json({ message: "Codice sconto aggiornato con successo" });
  });
}

// aggiorniamo solo alcuni campi di un codice sconto già esistente tramite id (PATCH)
const modify = (req, res) => {
  const { id } = req.params;
  const { code, value, valid_from, valid_to, is_used } = req.body;

  let updates = [];
  let values = [];

  if (code !== undefined) {
    updates.push("code = ?");
    values.push(code);
  }
  if (value !== undefined) {
    updates.push("value = ?");
    values.push(value);
  }
  if (valid_from !== undefined) {
    updates.push("valid_from = ?");
    values.push(valid_from);
  }
  if (valid_to !== undefined) {
    updates.push("valid_to = ?");
    values.push(valid_to);
  }
  if (is_used !== undefined) {
    updates.push("is_used = ?");
    values.push(is_used);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "Nessun campo da aggiornare" });
  }

  let sql = `
    UPDATE boardgames_shop.discount_codes
    SET ${updates.join(", ")}
    WHERE id = ?
  `;

  values.push(id);

  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error("Errore durante la modifica:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Codice sconto non trovato" });
    }

    res.json({ message: "Codice sconto modificato con successo" });
  });
};



// eliminiamo il singolo codice sconto tramite id (DELETE)
const destroy = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM boardgames_shop.discount_codes WHERE id = ?";

  connection.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Errore durante l'eliminazione:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Codice sconto non trovato" });
    }

    res.json({ message: "Codice sconto eliminato con successo" });
  });
}




module.exports = { index, show, store, update,modify, destroy};
