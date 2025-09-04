const connection = require("../db/connection");

const dotenv = require("dotenv");
dotenv.config();

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

module.exports = {
  index,
};
