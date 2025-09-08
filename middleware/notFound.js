// errore 404 pagina non trovata
function notFound(req, res, next) {
  console.log("notFound");
  res.status(404);
  res.json({
    err: "not found",
    mess: "pagina non trovata",
  });
}

module.exports = notFound;
