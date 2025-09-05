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




module.exports = { index };
