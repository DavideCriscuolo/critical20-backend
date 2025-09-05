const express = require("express");
const cors = require("cors");
const dontenv = require("dotenv");
dontenv.config();
const port = process.env.PORT;
const app = express();
const routerCategories = require("./routes/categoriesRoute");
const routerProducts = require("./routes/productsRoutes.js");
const routerDiscountCodes = require("./routes/discountCodesRoute.js")
const errorsHandlers = require("./middleware/errorsHandler.js");
const notFound = require("./middleware/notFound.js");

app.use(cors());
app.use(express.json());
app.use("/api", routerCategories);
app.use("/api", routerProducts);
app.use("/api", routerDiscountCodes);
app.use(express.static("public"));

app.listen(port, () => {
  console.log("Il server sta girando sulla porta " + port);
});


app.use(notFound);
app.use(errorsHandlers);