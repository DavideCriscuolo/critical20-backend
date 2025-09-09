const connection = require("../db/connection");

// Funzione per generare un codice casuale alfanumerico maiuscolo (se lungo 15 probabilità basse che si generi un codice già esistente)
const generateCode = (length = 15) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Funzione per generare un codice unico, verificando che non esista già
const generateUniqueCode = (callback, length = 15) => {
  const tryGenerate = () => {
    const code = generateCode(length);
    const sql = "SELECT COUNT(*) AS count FROM discount_codes WHERE code = ?";
    connection.query(sql, [code], (err, results) => {
      if (err) return callback(err, null);
      if (results[0].count > 0) {
        // se il codice esiste già, rigeneriamo
        tryGenerate();
      } else {
        callback(null, code);
      }
    });
  };
  tryGenerate();
};

// Validazione comune
const validateDiscountData = ({ value, valid_from, valid_to, is_used }, checkIsUsed = true) => {
  const errors = [];
  if (value === undefined || isNaN(Number(value))) {
    errors.push("value mancante o non valido (deve essere numero)");
  }
  if (!valid_from || isNaN(Date.parse(valid_from))) {
    errors.push("valid_from mancante o non valido (deve essere data)");
  }
  if (!valid_to || isNaN(Date.parse(valid_to))) {
    errors.push("valid_to mancante o non valido (deve essere data)");
  }
  if (checkIsUsed && is_used !== undefined && typeof is_used !== "boolean") {
    errors.push("is_used deve essere booleano se fornito");
  }
  return errors;
};

// Lista di tutti i codici sconto
const index = (req, res) => {
  const sql = "SELECT * FROM discount_codes";
  connection.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Singolo codice sconto valido e non usato
const show = (req, res) => {
  const code = req.params.code.toUpperCase();
  const sql = `
    SELECT * FROM discount_codes
    WHERE code = ? AND valid_from <= CURDATE() AND valid_to >= CURDATE() AND is_used = false
  `;
  connection.query(sql, [code], (err, results) => {
    if (err) return res.status(500).json({ error: "Errore nel database" });
    if (results.length === 0) return res.status(404).json({ error: "Codice sconto non trovato" });
    res.json(results[0]);
  });
};

// Creazione di un nuovo codice sconto con codice generato automaticamente
const store = (req, res) => {
  const { value, valid_from, valid_to } = req.body;
  const errors = validateDiscountData({ value, valid_from, valid_to }, false);
  if (errors.length > 0) return res.status(400).json({ error: "Dati mancanti o non validi", dettagli: errors });

  generateUniqueCode((err, code) => {
    if (err) return res.status(500).json({ error: "Errore nella generazione del codice" });

    const sql = `
      INSERT INTO discount_codes (code, value, valid_from, valid_to, is_used)
      VALUES (?, ?, ?, ?, false)
    `;
    connection.query(sql, [code, value, valid_from, valid_to], (err, result) => {
      if (err) return res.status(500).json({ error: "Errore nel database" });
      res.status(201).json({ message: "Codice sconto creato con successo", code, id: result.insertId });
    });
  });
};

// Aggiornamento completo
const update = (req, res) => {
  const { id } = req.params;
  const { code, value, valid_from, valid_to, is_used } = req.body;
  const errors = validateDiscountData({ value, valid_from, valid_to, is_used });
  if (!code || typeof code !== "string") errors.push("code mancante o non valido");

  if (errors.length > 0) return res.status(400).json({ error: "Dati mancanti o non validi", dettagli: errors });

  const sql = `
    UPDATE discount_codes SET code = ?, value = ?, valid_from = ?, valid_to = ?, is_used = ?
    WHERE id = ?
  `;
  connection.query(sql, [code.toUpperCase(), value, valid_from, valid_to, is_used, id], (err, result) => {
    if (err) return res.status(500).json({ error: "Errore nel database" });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Codice sconto non trovato" });
    res.json({ message: "Codice sconto aggiornato con successo" });
  });
};

// Modifica parziale
const modify = (req, res) => {
  const { id } = req.params;
  const { code, value, valid_from, valid_to, is_used } = req.body;

  const updates = [];
  const values = [];
  const errors = [];

  if (code !== undefined) {
    if (typeof code !== "string") errors.push("code non valido");
    else { updates.push("code = ?"); values.push(code.toUpperCase()); }
  }
  if (value !== undefined) {
    if (isNaN(Number(value))) errors.push("value non valido");
    else { updates.push("value = ?"); values.push(value); }
  }
  if (valid_from !== undefined) {
    if (isNaN(Date.parse(valid_from))) errors.push("valid_from non valido");
    else { updates.push("valid_from = ?"); values.push(valid_from); }
  }
  if (valid_to !== undefined) {
    if (isNaN(Date.parse(valid_to))) errors.push("valid_to non valido");
    else { updates.push("valid_to = ?"); values.push(valid_to); }
  }
  if (is_used !== undefined) {
    if (typeof is_used !== "boolean") errors.push("is_used deve essere booleano");
    else { updates.push("is_used = ?"); values.push(is_used); }
  }

  if (errors.length > 0) return res.status(400).json({ error: "Dati non validi", dettagli: errors });
  if (updates.length === 0) return res.status(400).json({ error: "Nessun campo da aggiornare" });

  const sql = `UPDATE discount_codes SET ${updates.join(", ")} WHERE id = ?`;
  values.push(id);
  connection.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: "Errore nel database" });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Codice sconto non trovato" });
    res.json({ message: "Codice sconto modificato con successo" });
  });
};

// Eliminazione
const destroy = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM discount_codes WHERE id = ?";
  connection.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: "Errore nel database" });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Codice sconto non trovato" });
    res.json({ message: "Codice sconto eliminato con successo" });
  });
};

module.exports = { index, show, store, update, modify, destroy };
