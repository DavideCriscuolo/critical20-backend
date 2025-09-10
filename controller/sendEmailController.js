const sendgrid = require("@sendgrid/mail");
const discountCodesController = require("./discountCodesController.js");
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmailWelcome = async (req, res) => {
  const { email } = req.body;

  try {
    const newDiscountCode = await discountCodesController.generateUniqueCode();

    const msg = {
      to: email,
      from: "critical20ecommerce@gmail.com",
      subject: "Email di Benvenuto",
      text: "Email di Benvenuto",
      html: ` <h1>Grazie per averci scelto</h1>
        <p>Ecco il tuo codice sconto: ${newDiscountCode}</p>
      `,
    };

    await sendgrid.send(msg);
    res.status(200).json({ message: msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore nell'invio dell'email" });
  }
};

module.exports = { sendEmailWelcome };
