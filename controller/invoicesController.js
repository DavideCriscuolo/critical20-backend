const connection = require("../db/connection");
const { sendOrderEmail } = require("./sendEmailController");

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
  const sql = `
    SELECT * FROM invoices
    WHERE invoices.id = ?
  `;

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
};

const storeCheckout = (req, res) => {
  const {
    order_date,
    status,
    user_name,
    user_email,
    address_shipping,
    address,
    phone,
    discount_code,
    items,
  } = req.body;

  // Array per collezionare errori di validazione
  const errors = [];

  // Validazione campi principali
  if (!order_date) errors.push("order_date mancante");
  if (!status || typeof status !== "string")
    errors.push("status mancante o non valido");
  if (!user_name || typeof user_name !== "string")
    errors.push("user_name mancante o non valido");
  if (!user_email || typeof user_email !== "string")
    errors.push("user_email mancante o non valido");
  if (!address_shipping || typeof address_shipping !== "string")
    errors.push("address_shipping mancante o non valido");
  if (!address || typeof address !== "string")
    errors.push("address mancante o non valido");
  if (!phone || typeof phone !== "string")
    errors.push("phone mancante o non valido");

  // Validazione items
  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push("items mancante o vuoto");
  } else {
    items.forEach((item, index) => {
      if (!item.id_order || isNaN(Number(item.id_order))) {
        errors.push(`items[${index}].id_order mancante o non valido`);
      }
      if (
        item.quantity === undefined ||
        isNaN(Number(item.quantity)) ||
        item.quantity <= 0
      ) {
        errors.push(`items[${index}].quantity mancante o non valido`);
      }
    });
  }

  // Se ci sono errori, interrompiamo subito
  if (errors.length > 0) {
    return res
      .status(400)
      .json({ error: "Dati mancanti o non validi", dettagli: errors });
  }

  // Estrazione id prodotti da recuperare nel DB
  const productIds = items.map((item) => item.id_order);
  const sqlPrices = `SELECT id, name, price FROM products WHERE id IN (?)`;

  // Query al DB per recuperare nome e prezzo reali dei prodotti
  connection.query(sqlPrices, [productIds], (err, productResults) => {
    if (err) {
      console.error("Errore nel recupero prezzi:", err);
      return res.status(500).json({ error: "Errore nel database" });
    }

    // Creo una mappa { id: { name, price } }
    const productMap = {};
    productResults.forEach((p) => {
      productMap[p.id] = { name: p.name, price: parseFloat(p.price) };
    });

    // Calcolo del totale base e costruzione della lista prodotti
    let total_price = 0;
    const productList = [];
    const orderItemsData = items.map((item) => {
      const product = productMap[item.id_order];
      if (!product) {
        errors.push(`Prodotto non trovato per ID ${item.id_order}`);
        return;
      }

      // Sommo al totale
      total_price += product.price * item.quantity;

      // Array per insert nel DB
      const dbRow = [null, item.id_order, item.quantity, product.price];

      // Oggetto leggibile per la risposta JSON
      productList.push({
        name: product.name,
        unit_price: product.price,
        quantity: item.quantity,
        subtotal: Number((product.price * item.quantity).toFixed(2)),
      });

      return dbRow;
    });

    if (errors.length > 0) {
      return res
        .status(400)
        .json({ error: "Prodotti non validi", dettagli: errors });
    }

    // --- Gestione codice sconto ---
    if (discount_code) {
      const sqlDiscount = `
        SELECT id, value, valid_from, valid_to, is_used
        FROM discount_codes
        WHERE code = ?
      `;

      connection.query(sqlDiscount, [discount_code], (err, discountResults) => {
        if (err) {
          console.error("Errore nel recupero del codice sconto:", err);
          return res.status(500).json({ error: "Errore nel database" });
        }

        if (discountResults.length === 0) {
          return res
            .status(400)
            .json({ error: "Codice sconto non valido o inesistente" });
        }

        const discount = discountResults[0];
        const now = new Date();

        if (discount.is_used) {
          return res
            .status(400)
            .json({ error: "Codice sconto già utilizzato" });
        }
        if (discount.valid_from && new Date(discount.valid_from) > now) {
          return res
            .status(400)
            .json({ error: "Codice sconto non ancora valido" });
        }
        if (discount.valid_to && new Date(discount.valid_to) < now) {
          return res.status(400).json({ error: "Codice sconto scaduto" });
        }

        // Applico lo sconto percentuale
        const discountValue = parseFloat(discount.value);
        total_price = total_price - (total_price * discountValue) / 100;

        // Spese di spedizione (gratis sopra i 50€)
        let shopping_fee = total_price >= 50 ? 0 : 4.99;
        total_price += shopping_fee;

        // Creo la invoice passando anche la productList
        createInvoice(
          order_date,
          status,
          total_price,
          user_name,
          user_email,
          address_shipping,
          address,
          phone,
          discount.id,
          discountValue,
          orderItemsData,
          res,
          true,
          shopping_fee,
          productList
        );
      });
    } else {
      // Nessun codice sconto
      let shopping_fee = total_price >= 50 ? 0 : 4.99;
      total_price += shopping_fee;

      createInvoice(
        order_date,
        status,
        total_price,
        user_name,
        user_email,
        address_shipping,
        address,
        phone,
        null,
        null,
        orderItemsData,
        res,
        false,
        shopping_fee,
        productList
      );
    }
  });
};

// Funzione helper per creare la invoice
// Funzione helper per creare la invoice
function createInvoice(
  order_date,
  status,
  total_price,
  user_name,
  user_email,
  address_shipping,
  address,
  phone,
  id_discount_code,
  discountValue,
  orderItemsData,
  res,
  markDiscountUsed,
  shopping_fee,
  productList
) {
  const sqlInvoice = `
    INSERT INTO invoices (order_date, status, total_price, user_name, user_email, address_shipping, address, phone, id_discount_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    sqlInvoice,
    [
      order_date,
      status,
      total_price,
      user_name,
      user_email,
      address_shipping,
      address,
      phone,
      id_discount_code,
    ],
    (err, result) => {
      if (err) {
        console.error("Errore durante la creazione della invoice:", err);
        return res.status(500).json({ error: "Errore nel database" });
      }

      const invoiceId = result.insertId;
      const finalOrderItems = orderItemsData.map((item) => [
        invoiceId,
        ...item.slice(1),
      ]);

      const sqlOrderItems = `
        INSERT INTO order_items (id_invoice, id_order, quantity, unit_price)
        VALUES ?
      `;

      // 🔹 Qui la callback diventa async
      connection.query(sqlOrderItems, [finalOrderItems], async (err2) => {
        if (err2) {
          console.error(
            "Errore durante l'inserimento degli order items:",
            err2
          );
          return res.status(500).json({ error: "Errore nel database" });
        }

        // Se c'è un codice sconto valido, segno come utilizzato
        if (markDiscountUsed && id_discount_code) {
          const sqlUpdateDiscount = `
            UPDATE discount_codes SET is_used = 1 WHERE id = ?
          `;
          connection.query(sqlUpdateDiscount, [id_discount_code], (err3) => {
            if (err3) {
              console.error(
                "Errore durante l'aggiornamento del codice sconto:",
                err3
              );
            }
          });
        }

        // --- Invio email di riepilogo ordine ---
        try {
          await sendOrderEmail({
            toCustomer: user_email,
            toAdmin: "critical20ecommerce@gmail.com",
            orderData: {
              user_name,
              user_email,
              address_shipping,
              address,
              phone,
              productList,
              total_price,
              shopping_fee,
              discountValue
            },
          });
        } catch (emailErr) {
          console.error("Errore nell'invio email ordine:", emailErr);
          // Non blocchiamo la response in caso di errore
        }

        // Risposta al client
        res.status(201).json({
          message: "Checkout completato con successo",
          invoice_id: invoiceId,
          productList,
          total_price: Number(total_price.toFixed(2)),
          shopping_fee: Number(shopping_fee.toFixed(2)),
        });
      });
    }
  );
}

// aggiorniamo completamente un invoice sconto già esistente tramite id (PUT)
const update = (req, res) => {
  const { id } = req.params;
  const {
    order_date,
    status,
    total_price,
    user_name,
    user_email,
    address_shipping,
    address,
    phone,
    id_discount_code,
  } = req.body;

  let errors = [];

  if (!order_date || isNaN(Date.parse(order_date)))
    errors.push("order_date mancante o non valido (formato data)");
  if (!status || typeof status !== "string")
    errors.push("status mancante o non valido (deve essere stringa)");
  if (total_price === undefined || isNaN(Number(total_price)))
    errors.push("total_price mancante o non valido (deve essere numero)");
  if (!user_name || typeof user_name !== "string")
    errors.push("user_name mancante o non valido (deve essere stringa)");
  if (!user_email || typeof user_email !== "string")
    errors.push("user_email mancante o non valido (deve essere stringa)");
  if (id_discount_code === undefined || isNaN(Number(id_discount_code)))
    errors.push("id_discount_code mancante o non valido (deve essere numero)");
  if (!address_shipping || typeof address_shipping !== "string")
    errors.push("address_shipping mancante o non valido");
  if (!address || typeof address !== "string")
    errors.push("address mancante o non valido");
  if (!phone || typeof phone !== "string")
    errors.push("phone mancante o non valido");

  if (errors.length > 0) {
    return res
      .status(400)
      .json({ error: "Dati mancanti o non validi", dettagli: errors });
  }

  const sql = `
    UPDATE invoices
    SET order_date = ?, status = ?, total_price = ?, user_name = ?, user_email = ?, address_shipping = ?, address = ?, phone = ?, id_discount_code = ?
    WHERE id = ?
  `;

  connection.query(
    sql,
    [
      order_date,
      status,
      total_price,
      user_name,
      user_email,
      address_shipping,
      address,
      phone,
      id_discount_code,
      id,
    ],
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
  const {
    order_date,
    status,
    total_price,
    user_name,
    user_email,
    address_shipping,
    address,
    phone,

    id_discount_code,
  } = req.body;

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

  if (address_shipping !== undefined) {
    if (typeof address_shipping !== "string") {
      errors.push("address_shipping non valido (deve essere stringa)");
    } else {
      updates.push("address_shipping = ?");
      values.push(address_shipping);
    }
  }

  if (address !== undefined) {
    if (typeof address !== "string") {
      errors.push("address non valido (deve essere stringa)");
    } else {
      updates.push("address = ?");
      values.push(address);
    }
  }

  if (phone !== undefined) {
    if (typeof phone !== "string") {
      errors.push("phone non valido (deve essere stringa)");
    } else {
      updates.push("phone = ?");
      values.push(phone);
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
      return res
        .status(404)
        .json({ error: `Invoice con id: ${id} non trovato` });
    }

    res.json({ message: `Invoice con id: ${id} eliminato con successo ` });
  });
};

module.exports = { index, show, storeCheckout, update, modify, destroy };
