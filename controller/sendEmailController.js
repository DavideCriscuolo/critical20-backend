const sendgrid = require("@sendgrid/mail");
const discountCodesController = require("./discountCodesController.js");
const connection = require("../db/connection");
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmailWelcome = async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Genera codice univoco
    const newDiscountCode = await discountCodesController.generateUniqueCode();

    // 2. Calcola validità (da oggi a 2 settimane)
    const today = new Date();
    // formato YYYY-MM-DD
    const valid_from = today.toISOString().split("T")[0]; 
    const valid_to = new Date(today.setDate(today.getDate() + 14))
      .toISOString()
      .split("T")[0];

    const value = 10;

    // 3. Salva nel DB il codice creatp
    const insertSql = `
      INSERT INTO discount_codes (code, value, valid_from, valid_to, is_used)
      VALUES (?, ?, ?, ?, false)
    `;

    await new Promise((resolve, reject) => {
      connection.query(
        insertSql,
        [newDiscountCode, value, valid_from, valid_to],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });

    // 4. Invia email con codice
    const msg = {
      to: email,
      from: "critical20ecommerce@gmail.com",
      subject: "Email di Benvenuto",
      text: "Email di Benvenuto",
      html: `
        <h1>Benvenuto/a in Critical20! 🎲</h1>
        <p>Siamo felici di averti nella nostra community 🎉</p>
        <p>Ecco il tuo codice sconto personale del <b>10%</b> sul prossimo ordine:</p>
        <p style="font-size:18px; font-weight:bold; color:#28a745;">${newDiscountCode}</p>
        <p>Il codice è valido dal <b>${valid_from}</b> al <b>${valid_to}</b>.</p>
        <p>Non perdere l’occasione, inizia subito a esplorare il nostro shop!</p>
      `,
    };

    await sendgrid.send(msg);

    // 5. Risposta 
    res.status(200).json({
      message: "Email inviata e codice salvato",
      code: newDiscountCode,
      value,
      valid_from,
      valid_to,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore nell'invio dell'email o nel salvataggio del codice" });
  }
};

async function sendOrderEmail({ toCustomer, toAdmin, orderData }) {
  const { user_name, user_email, productList, total_price, shopping_fee, phone, address, address_shipping, discountValue } = orderData;

  // Genera tabella prodotti in HTML
  const productRows = productList.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.quantity}</td>
      <td>${p.unit_price.toFixed(2)}€</td>
      <td>${p.subtotal.toFixed(2)}€</td>
    </tr>
  `).join("");

  const htmlContent = `
    <h2>Ciao ${user_name}, grazie per il tuo ordine! 🙌</h2>
    <p>Abbiamo ricevuto correttamente la tua richiesta. Ecco il riepilogo:</p>

    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width:100%; text-align:left;">
      <thead style="background:#f5f5f5;">
        <tr>
          <th>Prodotto</th>
          <th>Quantità</th>
          <th>Prezzo unitario</th>
          <th>Subtotale</th>
        </tr>
      </thead>
      <tbody>
        ${productRows}
      </tbody>
    </table>

    <p>💸 Sconto applicato: <b>${discountValue !== null ? discountValue + '%' : '-'}</b></p>
    <p>📦 Spese di spedizione: <b>${shopping_fee.toFixed(2)}€</b></p>
    <h3>Totale ordine: <b>${total_price.toFixed(2)}€</b></h3>

    <p>Riceverai una notifica quando il tuo pacco sarà spedito.</p>
    <h2>Grazie per aver scelto <b>Critical20</b> 🎲 </h2>
  `;

  // Email per il cliente
  const customerMsg = {
    to: toCustomer,
    from: "critical20ecommerce@gmail.com", 
    subject: "Conferma Ordine - Critical20 Ecommerce",
    html: htmlContent,
  };

  // Email per l’admin
  const adminMsg = {
    to: toAdmin,
    from: "critical20ecommerce@gmail.com",
    subject: `Nuovo ordine da ${user_name}`,
    html: `
      <h2>Nuovo ordine ricevuto 🛒</h2>
      <p><b>Cliente:</b> ${user_name} (${user_email})</p>
      <p><b>Telefono:</b> ${phone}</p>
      <p><b>Indirizzo di spedizione:</b> ${address_shipping}</p>
      <h3>Email inviata al cliente:</h3>
      ${htmlContent}
    `,
  };

  try {
    await sendgrid.send(customerMsg);
    await sendgrid.send(adminMsg);
    console.log("Email di conferma e notifica inviate con successo");
  } catch (err) {
    console.error("Errore nell'invio email ordine:", err);
  }
}

module.exports = { sendEmailWelcome, sendOrderEmail };
