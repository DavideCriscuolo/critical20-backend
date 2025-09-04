const mysql = require("mysql");

const credentials = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PW,
  database: process.env.DB_NAME,
};

const connection = mysql.createConnection(credentials);

console.log(connection);

connection.connect((err) => {
  if (err) {
    console.log(err.message);
  } else {
    console.log("Connection Success");
  }
});
module.exports = connection;
