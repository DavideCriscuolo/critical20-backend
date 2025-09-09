const connection = require("../db/connection");

const { slugify} = require("../utils/slug.js")

function index(req, res) {
  const { name, editor, age, players, difficulty, sort, page } = req.query;

  let whereClause = " WHERE 1=1 ";
  const params = [];

  if (name) {
    whereClause += " AND LOWER(products.name) LIKE ?";
    params.push(`%${name.toLowerCase()}%`);
  }
  if (editor) {
    whereClause += " AND LOWER(products.editor) LIKE ?";
    params.push(`%${editor.toLowerCase()}%`);
  }
  if (age) {
    whereClause += " AND products.age >= ?";
    params.push(parseInt(age));
  }
  if (players) {
    whereClause += " AND products.players >= ?";
    params.push(parseInt(players));
  }
  if (difficulty) {
    whereClause += " AND LOWER(products.difficulty) LIKE ?";
    params.push(`%${difficulty.toLowerCase()}%`);
  }

  // Query conteggio
  const countSql = `
    SELECT COUNT(DISTINCT products.id) AS total
    FROM boardgames_shop.products
    JOIN product_medias ON products.id = product_medias.id_product
    JOIN product_category ON products.id = product_category.id_product
    JOIN categories ON product_category.id_category = categories.id
    ${whereClause}
  `;

  connection.query(countSql, params, (err, countResult) => {
    if (err) {
      console.error("Errore durante il conteggio:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    const total = countResult[0].total;
    const limit = 20;
    const currentPage = parseInt(page) > 0 ? parseInt(page) : 1;
    const offset = (currentPage - 1) * limit;

    let sql = `
      SELECT products.*,
             GROUP_CONCAT(DISTINCT product_medias.file_path) AS file_paths,
             GROUP_CONCAT(DISTINCT categories.name) AS category_names
      FROM boardgames_shop.products
      JOIN product_medias ON products.id = product_medias.id_product
      JOIN product_category ON products.id = product_category.id_product
      JOIN categories ON product_category.id_category = categories.id
      ${whereClause}
      GROUP BY products.id, products.name
    `;

    // Ordinamento
    if (sort) {
      switch (sort) {
        case "name_asc":
          sql += " ORDER BY products.name ASC";
          break;
        case "name_desc":
          sql += " ORDER BY products.name DESC";
          break;
        case "price_asc":
          sql += " ORDER BY products.price ASC";
          break;
        case "price_desc":
          sql += " ORDER BY products.price DESC";
          break;
      }
    }

    sql += " LIMIT ? OFFSET ?";
    connection.query(sql, [...params, limit, offset], (err, results) => {
      if (err) {
        console.error("Errore durante la query:", err);
        return res.status(500).json({ error: "Errore nel database" });
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const formattedResults = results.map((product) => ({
        ...product,
        slug: slugify(product.name),
        price: product.price ? parseFloat(product.price) : null,
        file_paths: product.file_paths
          ? product.file_paths.split(",").map((f) => `${baseUrl}/${f}`)
          : [],
        categories: product.category_names
          ? product.category_names.split(",")
          : [],
      }));

      res.json({
        page: currentPage,
        perPage: limit,
        total,
        totalPages: Math.ceil(total / limit),
        results: formattedResults,
      });
    });
  });
}



// crea un nuovo gioco
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

  if (!name || typeof name !== "string") {
    return res
      .status(400)
      .json({ error: "Nome mancante o tipo di dato non corretto" });
  }

  if (!description || typeof description !== "string") {
    return res
      .status(400)
      .json({ error: "Descrizione mancante o tipo di dato non corretto" });
  }
  if (!price || isNaN(price) || price < 0) {
    return res
      .status(400)
      .json({ error: "Prezzo mancante o tipo di dato non corretto" });
  }

  if (!original_price || isNaN(original_price) || original_price < 0) {
    return res
      .status(400)
      .json({ error: "Prezzo originale mancante o tipo di dato non corretto" });
  }
  if (
    is_on_sale === undefined ||
    isNaN(is_on_sale) ||
    is_on_sale < 0 ||
    is_on_sale > 1
  ) {
    return res
      .status(400)
      .json({ error: "Sconto mancante o tipo di dato non corretto" });
  }
  if (!stock_quantity || isNaN(stock_quantity)) {
    return res
      .status(400)
      .json({ error: "Quantita mancante o tipo di dato non corretto" });
  }
  if (!isbn || typeof isbn !== "string") {
    return res
      .status(400)
      .json({ error: "ISBN mancante o tipo di dato non corretto" });
  }
  if (!code || typeof description !== "string") {
    return res
      .status(400)
      .json({ error: "Codice mancante o tipo di dato non corretto" });
  }
  if (!img || typeof img !== "string") {
    return res
      .status(400)
      .json({ error: "Immagine mancante o tipo di dato non corretto  " });
  }
  if (!duration || isNaN(duration)) {
    return res
      .status(400)
      .json({ error: "Durata mancante o tipo di dato non corretto" });
  }
  if (!players || isNaN(players)) {
    return res
      .status(400)
      .json({ error: "Giocatori mancanti o tipo di dato non corretto" });
  }
  if (!difficulty || typeof difficulty !== "string") {
    return res
      .status(400)
      .json({ error: "Difficolta mancante o tipo di dato non corretto" });
  }
  if (!editor || typeof editor !== "string") {
    return res
      .status(400)
      .json({ error: "Editor mancante o tipo di dato non corretto" });
  }
  if (!language || typeof language !== "string") {
    return res
      .status(400)
      .json({ error: "Lingua mancante o tipo di dato non corretto" });
  }
  if (!age || isNaN(age)) {
    return res
      .status(400)
      .json({ error: "Eta mancante o tipo di dato non corretto" });
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

      res
        .status(201)
        .json({
          message: "Gioco creato con successo",
          id: results.insertId,
          ...req.body,
        });
    }
  );
};

const show = (req, res) => {
  const slug = req.params.slug; 

  // Query per recuperare tutti i giochi
  const sql = `
    SELECT products.*,
           GROUP_CONCAT(DISTINCT product_medias.file_path) AS file_paths,  
           GROUP_CONCAT(DISTINCT categories.name) AS category_names,
           GROUP_CONCAT(DISTINCT categories.id) AS id_category
    FROM boardgames_shop.products
    JOIN product_medias ON products.id = product_medias.id_product
    JOIN product_category ON products.id = product_category.id_product
    JOIN categories ON product_category.id_category = categories.id
    GROUP BY products.id
  `;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Errore durante la query:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    // Normalizziamo i risultati e cerchiamo quello che corrisponde allo slug
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const formattedResults = results.map((product) => ({
      ...product,
      slug: slugify(product.name), // <-- Generiamo slug dal name
      file_paths: product.file_paths
        ? product.file_paths.split(",").map((f) => `${baseUrl}/${f}`)
        : [],
      categories: product.category_names
        ? product.category_names.split(",")
        : [],
      id_category: product.id_category ? product.id_category.split(",") : [],
      price: Number(product.price),
      original_price: Number(product.original_price),
    }));

    // Cerchiamo il prodotto giusto confrontando slug
    const product = formattedResults.find((p) => p.slug === slug);

    if (!product) {
      return res.status(404).json({ error: "Gioco non trovato" });
    }

    res.json(product);
  });
};


// mostra i 4 giochi più recenti
const showNew = (req, res) => {
  const sql = `
    SELECT products.*,
           GROUP_CONCAT(DISTINCT product_medias.file_path) AS file_paths
    FROM products
    JOIN product_medias ON products.id = product_medias.id_product
    GROUP BY products.id
    ORDER BY created_at DESC
    LIMIT 4;
  `;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Errore durante la query:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const formattedResults = results.map((product) => ({
      ...product,
      slug: slugify(product.name), 
      file_paths: product.file_paths
        ? product.file_paths.split(",").map((f) => `${baseUrl}/${f}`)
        : [],
    }));

    res.json(formattedResults);
  });
};
// aggiorniamo un gioco tramite l id
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

  //se manca il nome o non è di tipo string
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Nome mancante" });
  }

  if (!description || typeof description !== "string") {
    return res.status(400).json({ error: "Descrizione mancante" });
  }
  if (!price || isNaN(price)) {
    return res.status(400).json({ error: "Prezzo mancante" });
  }
  if (!original_price || isNaN(original_price)) {
    return res.status(400).json({ error: "Prezzo originale mancante" });
  }
  if (is_on_sale === undefined) {
    return res.status(400).json({ error: "Sconto mancante" });
  }
  if (!stock_quantity || isNaN(stock_quantity)) {
    return res.status(400).json({ error: "Quantita mancante" });
  }
  if (!isbn || typeof isbn !== "string") {
    return res.status(400).json({ error: "ISBN mancante" });
  }
  if (!code || typeof description !== "string") {
    return res.status(400).json({ error: "Codice mancante" });
  }
  if (!img || typeof img !== "string") {
    return res.status(400).json({ error: "Immagine mancante" });
  }
  if (!duration || isNaN(duration)) {
    return res.status(400).json({ error: "Durata mancante" });
  }
  if (!players || isNaN(players)) {
    return res.status(400).json({ error: "Giocatori mancanti" });
  }
  if (!difficulty || typeof difficulty !== "string") {
    return res.status(400).json({ error: "Difficolta mancante" });
  }
  if (!editor || typeof editor !== "string") {
    return res.status(400).json({ error: "Editor mancante" });
  }
  if (!language || typeof language !== "string") {
    return res.status(400).json({ error: "Lingua mancante" });
  }
  if (!age || isNaN(age)) {
    return res.status(400).json({ error: "Eta mancante" });
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
// eliminiamo un gioco tramite l id
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
