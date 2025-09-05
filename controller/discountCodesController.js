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




module.exports = { index, show };
