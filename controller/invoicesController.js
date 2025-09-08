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
// const store = (req, res) => {
//   const { order_date, status, total_price, user_name, user_email, id_discount_code} = req.body;

//   if (!order_date || !status || !total_price || !user_name || !user_email || !id_discount_code) {
//     return res.status(400).json({ error: "Dati mancanti" });
//   }

//   const sql = `
//     INSERT INTO invoices (order_date, status, total_price, user_name, user_email, id_discount_code)
//     VALUES (?, ?, ?, ?, ?, ?)
//   `;

//   connection.query(sql, [order_date, status, total_price, user_name, user_email, id_discount_code], (err, result) => {
//     if (err) {
//       console.error("Errore durante l'inserimento:", err);
//       return res.status(500).json({ error: "Errore nel database" });
//     }

//     res.status(201).json({ message: "invoice creato con successo", id: result.insertId });
//   });
// }

const storeCheckout = (req, res) => {
  const { order_date, status, user_name, user_email, id_discount_code, items } = req.body;

  const errors = [];

  // Validazioni base
  if (!order_date) errors.push("order_date mancante");
  if (!status || typeof status !== "string") errors.push("status mancante o non valido");
  if (!user_name || typeof user_name !== "string") errors.push("user_name mancante o non valido");
  if (!user_email || typeof user_email !== "string") errors.push("user_email mancante o non valido");
  if (id_discount_code === undefined || isNaN(Number(id_discount_code))) errors.push("id_discount_code mancante o non valido");

  // Validazione items
  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push("items mancante o vuoto");
  } 
  else {
    items.forEach((item, index) => {
      if (!item.id_order || isNaN(Number(item.id_order))) {
        errors.push(`items[${index}].id_order mancante o non valido`);
      }
      if (item.quantity === undefined || isNaN(Number(item.quantity)) || item.quantity <= 0) {
        errors.push(`items[${index}].quantity mancante o non valido`);
      }
      if (item.unit_price === undefined || isNaN(Number(item.unit_price)) || item.unit_price < 0) {
        errors.push(`items[${index}].unit_price mancante o non valido`);
      }
    });
  }

  // Se ci sono errori, fermo tutto
  if (errors.length > 0) {
    return res.status(400).json({ error: "Dati mancanti o non validi", dettagli: errors });
  }

  // Calcolo totale lato backend
  const total_price = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

  // Query per invoice
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

    // Query per gli order_items
    const sqlOrderItems = `
      INSERT INTO order_items (id_invoice, id_order, quantity, unit_price)
      VALUES ?
    `;

    // Preparo array per insert multiplo
    const orderItemsData = items.map(item => [invoiceId, item.id_order, item.quantity, item.unit_price]);

    connection.query(sqlOrderItems, [orderItemsData], (err2) => {
      if (err2) {
        console.error("Errore durante l'inserimento degli order items:", err2);
        return res.status(500).json({ error: "Errore nel database" });
      }

      res.status(201).json({ message: "Checkout completato con successo", invoice_id: invoiceId, total_price });
    });
  });
};



// aggiorniamo completamente un invoice sconto già esistente tramite id (PUT)
const update = (req, res) => {
  const { id } = req.params;
  const { order_date, status, total_price, user_name, user_email, id_discount_code } = req.body;

  if (!order_date || !status || !total_price || !user_name || !user_email || !id_discount_code) {
    return res.status(400).json({ error: "Dati mancanti" });
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

  if (order_date !== undefined) {
    updates.push("order_date = ?");
    values.push(order_date);
  }
  if (status !== undefined) {
    updates.push("status = ?");
    values.push(status);
  }
  if (total_price !== undefined) {
    updates.push("total_price = ?");
    values.push(total_price);
  }
  if (user_name !== undefined) {
    updates.push("user_name = ?");
    values.push(user_name);
  }
  if (user_email !== undefined) {
    updates.push("user_email = ?");
    values.push(user_email);
  }
  if (id_discount_code !== undefined) {
    updates.push("id_discount_code = ?");
    values.push(id_discount_code);
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

    res.json({ message: "Invoice modificato con successo" });
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
      return res.status(404).json({ error: "Codice sconto non trovato" });
    }

    res.json({ message: "Codice sconto eliminato con successo" });
  });
}




module.exports = { index, show, storeCheckout, update,modify, destroy};
