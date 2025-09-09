const connection = require("../db/connection");


// mostra la lista di tutti gli invoices
const index = (req, res) => {
  const sql = "SELECT * FROM invoices;";

  connection.query(sql, (err, results) => {
    if (err) {
      res.status(500).send({ error: err.message });
    } else {
      res.json(results);
    }
  });
};

// restituisce il singolo invoice tramite id
const show = (req, res) => {
  const id = req.params.id;
  const sql= `
    SELECT * FROM invoices
    WHERE invoices.id = ?
  `

  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Errore durante la query:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "invoice non trovato" });
    }
    res.json(results);
  });
}

// creiamo un nuovo invoice (POST)
const storeCheckout = (req, res) => {
  const { order_date, status, user_name, user_email, id_discount_code, items } = req.body;

  const errors = [];
  if (!order_date) errors.push("order_date mancante");
  if (!status || typeof status !== "string") errors.push("status mancante o non valido");
  if (!user_name || typeof user_name !== "string") errors.push("user_name mancante o non valido");
  if (!user_email || typeof user_email !== "string") errors.push("user_email mancante o non valido");
  if (id_discount_code === undefined || isNaN(Number(id_discount_code))) errors.push("id_discount_code mancante o non valido");
  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push("items mancante o vuoto");
  } else {
    items.forEach((item, index) => {
      if (!item.id_order || isNaN(Number(item.id_order))) {
        errors.push(`items[${index}].id_order mancante o non valido`);
      }
      if (item.quantity === undefined || isNaN(Number(item.quantity)) || item.quantity <= 0) {
        errors.push(`items[${index}].quantity mancante o non valido`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: "Dati mancanti o non validi", dettagli: errors });
  }

  // Recupero i prezzi reali dal DB
  const productIds = items.map(item => item.id_order);
  const sqlPrices = `SELECT id, price FROM products WHERE id IN (?)`;

  connection.query(sqlPrices, [productIds], (err, productResults) => {
    if (err) {
      console.error("Errore nel recupero prezzi:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    // Creo una mappa { id: price } per accesso rapido
    const priceMap = {};
    productResults.forEach(p => {
      priceMap[p.id] = parseFloat(p.price);
    });

    // Calcolo totale usando i prezzi reali
    let total_price = 0;
    const orderItemsData = items.map(item => {
      const realPrice = priceMap[item.id_order];
      if (!realPrice) {
        errors.push(`Prezzo non trovato per prodotto ID ${item.id_order}`);
      }
      total_price += realPrice * item.quantity;
      return [null, item.id_order, item.quantity, realPrice]; 
    });

    if (errors.length > 0) {
      return res.status(400).json({ error: "Prodotti non validi", dettagli: errors });
    }

    // Inserisco la invoice
    const sqlInvoice = `
      INSERT INTO invoices (order_date, status, total_price, user_name, user_email, id_discount_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    connection.query(sqlInvoice, [order_date, status, total_price, user_name, user_email, id_discount_code], (err, result) => {
      if (err) {
        console.error("Errore durante la creazione della invoice:", err);
        return res.status(500).json({ error: "Errore nel database" });
      }

      const invoiceId = result.insertId;
      const finalOrderItems = orderItemsData.map(item => [invoiceId, ...item.slice(1)]);

      // Inserisco gli order_items
      const sqlOrderItems = `
        INSERT INTO order_items (id_invoice, id_order, quantity, unit_price)
        VALUES ?
      `;

      connection.query(sqlOrderItems, [finalOrderItems], (err2) => {
        if (err2) {
          console.error("Errore durante l'inserimento degli order items:", err2);
          return res.status(500).json({ error: "Errore nel database" });
        }

        res.status(201).json({ message: "Checkout completato con successo", invoice_id: invoiceId, total_price });
      });
    });
  });
};

// aggiorniamo completamente un invoice sconto già esistente tramite id (PUT)
const update = (req, res) => {
  const { id } = req.params;
  const { order_date, status, total_price, user_name, user_email, id_discount_code } = req.body;

  let errors = [];

  if (!order_date || isNaN(Date.parse(order_date))) errors.push("order_date mancante o non valido (formato data)");
  if (!status || typeof status !== "string") errors.push("status mancante o non valido (deve essere stringa)");
  if (total_price === undefined || isNaN(Number(total_price))) errors.push("total_price mancante o non valido (deve essere numero)");
  if (!user_name || typeof user_name !== "string") errors.push("user_name mancante o non valido (deve essere stringa)");
  if (!user_email || typeof user_email !== "string") errors.push("user_email mancante o non valido (deve essere stringa)");
  if (id_discount_code === undefined || isNaN(Number(id_discount_code))) errors.push("id_discount_code mancante o non valido (deve essere numero)");

  if (errors.length > 0) {
    return res.status(400).json({ error: "Dati mancanti o non validi", dettagli: errors });
  }

  const sql = `
    UPDATE invoices
    SET order_date = ?, status = ?, total_price = ?, user_name = ?, user_email = ?, id_discount_code = ?
    WHERE id = ?
  `;

  connection.query(
    sql,
    [order_date, status, total_price, user_name, user_email, id_discount_code, id],
    (err, result) => {
      if (err) {
        console.error("Errore durante l'update:", err);
        return res.status(500).json({ error: "Errore nel database" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Invoice non trovato" });
      }

      res.json({ message: "Invoice aggiornato con successo" });
    }
  );
};



// aggiorniamo solo alcuni campi di un invoice già esistente tramite id (PATCH)
const modify = (req, res) => {
  const { id } = req.params;
  const { order_date, status, total_price, user_name, user_email, id_discount_code } = req.body;

  let updates = [];
  let values = [];
  let errors = [];

  if (order_date !== undefined) {
    if (!order_date || isNaN(Date.parse(order_date))) {
      errors.push("order_date non valido (formato data)");
    } else {
      updates.push("order_date = ?");
      values.push(order_date);
    }
  }

  if (status !== undefined) {
    if (typeof status !== "string") {
      errors.push("status non valido (deve essere stringa)");
    } else {
      updates.push("status = ?");
      values.push(status);
    }
  }

  if (total_price !== undefined) {
    if (isNaN(Number(total_price))) {
      errors.push("total_price non valido (deve essere numero)");
    } else {
      updates.push("total_price = ?");
      values.push(total_price);
    }
  }

  if (user_name !== undefined) {
    if (typeof user_name !== "string") {
      errors.push("user_name non valido (deve essere stringa)");
    } else {
      updates.push("user_name = ?");
      values.push(user_name);
    }
  }

  if (user_email !== undefined) {
    if (typeof user_email !== "string") {
      errors.push("user_email non valido (deve essere stringa)");
    } else {
      updates.push("user_email = ?");
      values.push(user_email);
    }
  }

  if (id_discount_code !== undefined) {
    if (isNaN(Number(id_discount_code))) {
      errors.push("id_discount_code non valido (deve essere numero)");
    } else {
      updates.push("id_discount_code = ?");
      values.push(id_discount_code);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: "Dati non validi", dettagli: errors });
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "Nessun campo da aggiornare" });
  }

  const sql = `
    UPDATE invoices
    SET ${updates.join(", ")}
    WHERE id = ?
  `;

  values.push(id);

  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error("Errore durante la modifica:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Invoice non trovato" });
    }

    res.json({ message: `Invoice con ${id} modificato con successo` });
  });
};




// eliminiamo il singolo invoice tramite id (DELETE)
const destroy = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM invoices WHERE id = ?";

  connection.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Errore durante l'eliminazione:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `Invoice con id: ${id} non trovato` });
    }

    res.json({ message: `Invoice con id: ${id} eliminato con successo ` });
  });
}




module.exports = { index, show, storeCheckout, update,modify, destroy};
