// errore globale
function errorsHandlers(err, req, res, next) {
  console.log("errorHandlers");
  res.status(500);
  res.json({
    err: err.message,
  });
}

module.exports = errorsHandlers;
