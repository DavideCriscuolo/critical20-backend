# Critical20 - E-commerce di Giochi da Tavolo

Critical20 è una piattaforma e-commerce dedicata agli appassionati di giochi da tavolo. Il progetto è composto da un backend Node.js/Express e un frontend React, pensati per offrire un'esperienza moderna, veloce e intuitiva sia agli utenti che agli amministratori.

---

## Struttura del Progetto

```
critical20-backend/
  controller/
  db/
  middleware/
  public/
  routes/
  utils/
  .env
  package.json
  server.js

critical20-frontend/
  public/
  src/
    assets/
    components/
    layouts/
    pages/
    style/
  package.json
  vite.config.js
  index.html
```

---

## Funzionalità Principali

### Frontend (React)

- **Homepage**: vetrina dei nuovi arrivi, promozioni e navigazione rapida.
- **Catalogo Prodotti**: ricerca, filtri per difficoltà/categoria, visualizzazione dettagliata dei giochi.
- **Dettaglio Prodotto**: immagini, descrizione, info tecniche, aggiunta a carrello e wishlist.
- **Carrello**: gestione quantità, rimozione prodotti, calcolo totale e sconti.
- **Wishlist**: salvataggio giochi preferiti, aggiunta rapida al carrello.
- **Checkout**: inserimento dati utente, indirizzi, codice sconto, riepilogo e conferma ordine.
- **Email di Benvenuto**: popup alla prima visita con invio di un codice sconto personalizzato.
- **Responsive Design**: completamente ottimizzato per mobile e desktop.
- **Animazioni**: transizioni, alert, feedback visivi.

### Backend (Node.js + Express + MySQL)

- **Gestione Prodotti**: CRUD completo, immagini multiple, categorie, filtri avanzati.
- **Categorie**: gestione e assegnazione ai prodotti.
- **Carrello e Ordini**: salvataggio ordini, generazione invoice, gestione order items.
- **Codici Sconto**: generazione automatica, validazione, scadenza e uso singolo.
- **Invio Email**: integrazione con SendGrid per conferme ordine e benvenuto.
- **Validazione Dati**: controlli approfonditi su tutti gli endpoint.
- **Gestione Errori**: middleware dedicati per errori e 404.

---

## Come Avviare il Progetto

### Prerequisiti

- Node.js (v16+)
- MySQL
- NPM

### 1. Backend

1. Configura il file `.env` in `critical20-backend/` con le variabili per il database e la chiave SendGrid.
2. Installa le dipendenze:
   ```sh
   cd critical20-backend
   npm install
   ```
3. Avvia il server:
   ```sh
   npm run watch
   ```
   Il backend sarà disponibile su `http://localhost:3030`.

### 2. Frontend

1. Installa le dipendenze:
   ```sh
   cd critical20-frontend
   npm install
   ```
2. Avvia il frontend:
   ```sh
   npm run dev
   ```
   L'app sarà disponibile su `http://localhost:5173` (o porta indicata da Vite).

---

## Database

- **Tabelle principali**: `products`, `categories`, `product_medias`, `product_category`, `order_items`, `invoices`, `discount_codes`
- **Relazioni**: ogni prodotto può avere più immagini e categorie; ogni ordine contiene più prodotti.

---

## API Principali

- `GET /api/products` — Lista prodotti (con filtri)
- `GET /api/products/:slug` — Dettaglio prodotto
- `POST /api/invoices` — Creazione ordine/checkout
- `POST /api/sendEmailWelcome` — Invio email benvenuto + codice sconto
- `GET /api/discoutCodes/:code` — Validazione codice sconto
- `GET /api/categories` — Lista categorie

---

## Personalizzazione

- **Immagini**: tutte le immagini sono in `public/img` e `public/imgProduct`.
- **Stili**: personalizzabili tramite i file CSS in `src/style/`.
- **Componenti**: modulari e facilmente estendibili in `src/components/`.

---

## Team

- Asia Venditti
- Marzia Blasi
- Cristian Buonocore
- Edoardo Lova
- Davide Criscuolo

---

## Licenza

Questo progetto è a scopo didattico e non commerciale.

---

## Note

- Per la produzione, ricordati di configurare correttamente le variabili d'ambiente e la sicurezza delle API.
- Il progetto è pensato per essere facilmente esteso con funzionalità come autenticazione, dashboard admin, recensioni, ecc.

---

Buon divertimento con Critical20! 🎲
