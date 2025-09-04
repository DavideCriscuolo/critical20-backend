const connection = require('../db/conncetion.js');

function index(req, res) {
    const {name, editor} = req.query;
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
    } 
    else if (editor) {
        sql += " AND LOWER(products.editor) = ?";
        params.push(editor.toLowerCase());
    }

    sql += " GROUP BY products.id, products.name;";

    
    connection.query(sql, params, (err, results) => {
        if (err) {
            console.error("Errore durante la query:", err);
            return res.status(500).json({ error: "Errore nel database" });
        }

        const formattedResults = results.map(product => ({
            ...product,
            file_paths: product.file_paths ? product.file_paths.split(",") : [],
            categories: product.category_names ? product.category_names.split(",") : []
        }));

        res.json(formattedResults);
    });
}

module.exports = { index };
