const sendgrid = require("@sendgrid/mail");
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
const sendEmail = (req, res) => {
  const { email } = req.body;
  const msg = {
    to: email,
    from: "critical20ecommerce@gmail.com",
    subject: "Email di Benvenuto",
    text: "Email di Benvenuto",
    html: `<h1> Benvenuto nel nostro sito</h1>
      <p>Ecco il tuo codice sconto: WELCOME10</p>
        `,
  };
  sendgrid
    .send(msg)
    .then(() => res.status(200).json({ message: "Email inviata con sucesso" }))
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Errore nell'invio dell'email" });
    });
};

module.exports = { sendEmail };
