const express = require("express");
const cors = require("cors");
const dontenv = require("dotenv");
dontenv.config();
const port = process.env.PORT;
const app = express();
app.use(express.static("public"));
app.use(cors());
app.use(express.json());

app.listen(port, () => {
  console.log("Il server sta girando sulla porta " + port);
});
