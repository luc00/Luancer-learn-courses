// server.js — backend minimale per Ordinem.
// Il suo unico compito: creare una "sessione di pagamento" su Stripe per un corso
// e restituire al sito il link a cui reindirizzare il cliente.
// La chiave segreta di Stripe (che sblocca l'accesso al tuo account) vive SOLO
// qui, sul server, mai nel codice del sito che gira nel browser.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// URL pubblico del tuo sito (dove Stripe rimanda il cliente dopo il pagamento)
const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

app.use(cors());
app.use(express.json());

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { courseId, title, price, lang } = req.body || {};

    if (!courseId || !title || !price) {
      return res.status(400).json({ error: "Dati del corso mancanti o incompleti." });
    }
    const amountCents = Math.round(Number(price) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: "Prezzo del corso non valido." });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: String(title).slice(0, 250) },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${SITE_URL}/?success=1&course=${encodeURIComponent(courseId)}&lang=${encodeURIComponent(lang || "")}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/?canceled=1&course=${encodeURIComponent(courseId)}`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Errore creazione sessione Stripe:", err.message);
    res.status(500).json({ error: "Impossibile avviare il pagamento in questo momento." });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Ordinem backend in ascolto sulla porta ${PORT}`));
