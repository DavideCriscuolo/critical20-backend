const connection = require("../db/connection");

// mostra la lista di tutti gli order_items
const index = (req, res) => {
  const sql = "SELECT * FROM order_items";

  connection.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send({ error: err.message });
    }
    res.json(results);
  });
};

// restituisce l' order_items in base all'id 
const show = (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT * FROM order_items
    WHERE id = ?;
  `;

  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Errore durante la query:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Order items non trovati" });
    }
    res.json(results);
  });
};

// restituisce tutti gli order_items in base all'id dell'invoice
const showByinvoice = (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT * FROM order_items
    WHERE id_invoice = ?;
  `;

  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Errore durante la query:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Order items non trovati" });
    }
    res.json(results);
  });
};

// creiamo un nuovo order_item (POST)
const store = (req, res) => {
  const { id_invoice, id_order, quantity, unit_price } = req.body;

  if ([id_invoice, id_order, quantity, unit_price].some(v => v === undefined || v === null)) {
    return res.status(400).json({ error: "Dati mancanti" });
  }

  const sql = `
    INSERT INTO order_items (id_invoice, id_order, quantity, unit_price)
    VALUES (?, ?, ?, ?)
  `;

  connection.query(sql, [id_invoice, id_order, quantity, unit_price], (err, result) => {
    if (err) {
      console.error("Errore durante l'inserimento:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    res.status(201).json({ message: "Order item creato con successo", id: result.insertId });
  });
};

// aggiorniamo completamente un order_item esistente tramite id (PUT)
const update = (req, res) => {
  const id = req.params.id;
  const { id_invoice, id_order, quantity, unit_price } = req.body;

  if ([id_invoice, id_order, quantity, unit_price].some(v => v === undefined || v === null)) {
    return res.status(400).json({ error: "Dati mancanti" });
  }

  const sql = `
    UPDATE order_items
    SET id_invoice = ?, id_order = ?, quantity = ?, unit_price = ?
    WHERE id = ?
  `;

  connection.query(sql, [id_invoice, id_order, quantity, unit_price, id], (err, result) => {
    if (err) {
      console.error("Errore durante l'aggiornamento:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order item non trovato" });
    }

    res.json({ message: "Order item aggiornato con successo" });
  });
};

// eliminiamo il singolo order_item tramite id (DELETE)
const destroy = (req, res) => {
  const id = req.params.id;

  const sql = "DELETE FROM order_items WHERE id = ?";

  connection.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Errore durante l'eliminazione:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Order item non trovato" });
    }

    res.json({ message: "Order item eliminato con successo" });
  });
};

module.exports = { index, show, showByinvoice, store, update, destroy };
