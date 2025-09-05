const connection = require("../db/connection");

function index(req, res) {
  const { name, editor } = req.query;
  let sql = `
        SELECT products.*,
               GROUP_CONCAT(DISTINCT product_medias.file_path) AS file_paths,
               GROUP_CONCAT(DISTINCT categories.name) AS category_names
        FROM boardgames_shop.products
        JOIN product_medias ON products.id = product_medias.id_product
        JOIN product_category ON products.id = product_category.id_product
        JOIN categories ON product_category.id_category = categories.id
    `;

  const params = [];

  if (name) {
    sql += " AND LOWER(products.name) = ?";
    params.push(name.toLowerCase());
  } else if (editor) {
    sql += " AND LOWER(products.editor) = ?";
    params.push(editor.toLowerCase());
  }

  sql += " GROUP BY products.id, products.name;";

  connection.query(sql, params, (err, results) => {
    if (err) {
      console.error("Errore durante la query:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    const formattedResults = results.map((product) => ({
      ...product,
      file_paths: product.file_paths ? product.file_paths.split(",") : [],
      categories: product.category_names
        ? product.category_names.split(",")
        : [],
    }));

    res.json(formattedResults);
  });
}

const show = (req, res) => {
  const id = req.params.id;

  const sql =
    " SELECT products.*, GROUP_CONCAT(DISTINCT product_medias.file_path) AS file_paths,GROUP_CONCAT(DISTINCT categories.name) AS category_names,GROUP_CONCAT(DISTINCT categories.id) AS id_category FROM boardgames_shop.products JOIN product_medias ON products.id = product_medias.id_product JOIN product_category ON products.id = product_category.id_product JOIN categories ON product_category.id_category = categories.id where products.id=?";
  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Errore durante la query:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    const formattedResults = results.map((product) => ({
      ...product,
      file_paths: product.file_paths ? product.file_paths.split(",") : [],
      categories: product.category_names
        ? product.category_names.split(",")
        : [],
      id_category: product.id_category ? product.id_category.split(",") : [],
    }));
    if (results.length === 0) {
      return res.status(404).json({ error: "Gioco non trovato" });
    }
    res.json(formattedResults);
  });
};

const showNew = (req, res) => {
  console.log("ciao");
  const sql =
    "SELECT products.*, GROUP_CONCAT(DISTINCT product_medias.file_path ) AS file_paths FROM products JOIN product_medias ON products.id = product_medias.id_product GROUP BY products.id ORDER BY created_at DESC LIMIT 4;";
  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Errore durante la query:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    // const formattedResults = results.map((product) => ({
    //   ...product,
    //   file_paths: product.file_paths ? product.file_paths.split(",") : [],
    //   categories: product.category_names
    //     ? product.category_names.split(",")
    //     : [],
    // }));

    res.json(results);
  });
};

module.exports = { index, show, showNew };
