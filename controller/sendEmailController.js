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
        <h1>Grazie per averci scelto</h1>
        <p>Ecco il tuo codice sconto: <b>${newDiscountCode}</b></p>
        <p>Valido dal ${valid_from} al ${valid_to}</p>
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

module.exports = { sendEmailWelcome };
