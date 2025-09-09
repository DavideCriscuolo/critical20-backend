
function slugify(text) {
  return text
    .toString()
    .normalize("NFD")                // Normalizza caratteri accentati
    .replace(/[\u0300-\u036f]/g, "") // Rimuove accenti
    .toLowerCase()
    .trim()
    .replace(/[:]/g, "-")            // Sostituisce i due punti con trattini
    .replace(/\s+/g, "-")            // Sostituisce gli spazi con trattini
    .replace(/[^a-z0-9\-]/g, "")     // Rimuove tutto ciò che non è alfanumerico o trattino
    .replace(/\-+/g, "-")            // Evita trattini multipli consecutivi
    .replace(/^-+|-+$/g, "");        // Rimuove trattini iniziali/finali
}



module.exports = { slugify };
