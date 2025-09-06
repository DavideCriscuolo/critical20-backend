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
const store = (req, res) => {
  const {
    name,
    description,
    price,
    original_price,
    is_on_sale,
    stock_quantity,
    isbn,
    code,
    img,
    duration,
    players,
    difficulty,
    editor,
    language,
    age,
  } = req.body;

  if (
    !name ||
    !description ||
    !price ||
    !original_price ||
    is_on_sale === undefined ||
    !stock_quantity ||
    !isbn ||
    !code ||
    !img ||
    !duration ||
    !players ||
    !difficulty ||
    !editor ||
    !language ||
    !age
  ) {
    return res.status(400).json({ error: "Dati mancanti" });
  }

  const sqlInsertProduct =
    "INSERT INTO products (name, description, price, original_price, is_on_sale, stock_quantity, created_at, isbn, code, img, duration, players, difficulty, editor, language, age) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?);";

  connection.query(
    sqlInsertProduct,
    [
      name,
      description,
      price,
      original_price,
      is_on_sale,
      stock_quantity,
      isbn,
      code,
      img,
      duration,
      players,
      difficulty,
      editor,
      language,
      age,
    ],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Errore nel database" });
      }

      const id_product = results.insertId;
      const { file_path, alt_text, position } = req.body;
      if (!file_path || !alt_text || position === undefined) {
        return res.status(400).json({ error: "Dati mancanti" });
      }

      const sqlInsertImg =
        "INSERT INTO `product_medias` (`id_product`, `file_path`, `alt_text`, `position`) VALUES (?, ?, ?, ?);";
      connection.query(
        sqlInsertImg,
        [id_product, file_path, alt_text, position],
        (err, results) => {
          if (err) {
            console.log(req.body);
            return res.status(500).json({ error: "Errore nel database" });
          }
          res.status(201).json(results);
        }
      );
    }
  );
};
const show = (req, res) => {
  const id = req.params.id;

  const sql =
    " SELECT products.*, GROUP_CONCAT(DISTINCT product_medias.file_path) AS file_paths,GROUP_CONCAT(DISTINCT categories.name) AS category_names,GROUP_CONCAT(DISTINCT categories.id) AS id_category FROM boardgames_shop.products JOIN product_medias ON products.id = product_medias.id_product JOIN product_category ON products.id = product_category.id_product JOIN categories ON product_category.id_category = categories.id where products.id=?";
  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Errore durante la query:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    if (results.length > 0 && results[0].id === null) {
      return res.status(404).json({ error: "Gioco non trovato" });
    }
    const formattedResults = results.map((product) => ({
      ...product,
      file_paths: product.file_paths ? product.file_paths.split(",") : [],
      categories: product.category_names
        ? product.category_names.split(",")
        : [],
      id_category: product.id_category ? product.id_category.split(",") : [],
    }));
    res.json(formattedResults);
  });
};

const showNew = (req, res) => {
  const sql =
    "SELECT products.*, GROUP_CONCAT(DISTINCT product_medias.file_path ) AS file_paths FROM products JOIN product_medias ON products.id = product_medias.id_product GROUP BY products.id ORDER BY created_at DESC LIMIT 4;";
  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Errore durante la query:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    const formattedResults = results.map((product) => ({
      ...product,
      file_paths: product.file_paths ? product.file_paths.split(",") : [],
    }));

    res.json(formattedResults);
  });
};
const modify = (req, res) => {
  const id = req.params.id;
  const {
    name,
    description,
    price,
    original_price,
    is_on_sale,
    stock_quantity,
    isbn,
    code,
    img,
    duration,
    players,
    difficulty,
    editor,
    language,
    age,
  } = req.body;

  if (
    !name ||
    !description ||
    !price ||
    !original_price ||
    is_on_sale === undefined ||
    !stock_quantity ||
    !isbn ||
    !code ||
    !img ||
    !duration ||
    !players ||
    !difficulty ||
    !editor ||
    !language ||
    !age
  ) {
    return res.status(400).json({ error: "Dati mancanti" });
  }
  const sql =
    "UPDATE products SET name = ?, description = ?, price = ?, original_price = ?, is_on_sale = ?, stock_quantity = ?, created_at = NOW(), isbn = ?, code = ?, img = ?, duration = ?, players = ?, difficulty = ?, editor = ?, language = ?, age = ? WHERE id = ?;";

  connection.query(
    sql,
    [
      name,
      description,
      price,
      original_price,
      is_on_sale,
      stock_quantity,
      isbn,
      code,
      img,
      duration,
      players,
      difficulty,
      editor,
      language,
      age,
      id,
    ],
    (err, results) => {
      if (err) {
        console.log("errore durante l'aggiornamento:", err);
        return res.status(500).json({ error: "Errore nel database" });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Gioco non trovato" });
      }

      res.json({ message: "Gioco aggiornato con successo" });
    }
  );
};
const destroy = (req, res) => {
  const id = req.params.id;

  const sql = "DELETE FROM products WHERE id = ?";

  connection.query(sql, [id], (err, result) => {
    if (err) {
      console.log("errore durante l'eliminazione:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Gioco non trovato" });
    }

    res.json({ message: "Gioco eliminato con successo" });
  });
};

module.exports = { index, show, showNew, store, modify, destroy };
