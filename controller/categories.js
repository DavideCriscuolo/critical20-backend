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

const show = (req, res) => {
  const id = parseInt(req.params.id);
  const sql = `
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
  `
  connection.query(sql, [id], (err, results)=>{
      if (err) {
          return res.status(500).json({error: true, mess: err.message});
      };
      if (results.length === 0) {
          return res.status(404).json({error: true, mess: 'category not found'});
      };
      res.json(results)
  });
}

module.exports = {
  index,
  show
};
