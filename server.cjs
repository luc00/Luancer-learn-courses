// server.js — backend minimale per Ordinem.
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const SITE_URL = process.env.SITE_URL || "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me-in-production";

// Configurazione CORS avanzata per evitare blocchi tra Vercel e Render
app.use(cors({
  origin: SITE_URL || "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { courseId, title, price, lang } = req.body || {};

    if (!courseId || !title || !price) {
      return res.status(400).json({ error: "Dati del corso mancanti o incompleti." });
    }

    // Gestisce sia "198" che "198,00" o "198.00"
    const cleanPrice = typeof price === "string" ? price.replace(",", ".") : price;
    const amountCents = Math.round(Number(cleanPrice) * 100);

    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: "Prezzo del corso non valido." });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
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

/* ------------------------------------------------------------------ */
/* ACCOUNT — signup / login / password reset                          */
/* ------------------------------------------------------------------ */

const users = new Map();
const resetTokens = new Map();

function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

app.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: "Compila tutti i campi." });
    if (!isValidEmail(email)) return res.status(400).json({ error: "Email non valida." });
    if (password.length < 8) return res.status(400).json({ error: "La password deve avere almeno 8 caratteri." });
    const key = String(email).toLowerCase();
    if (users.has(key)) return res.status(409).json({ error: "Esiste già un account con questa email." });
    const passwordHash = await bcrypt.hash(password, 10);
    users.set(key, { name: String(name).slice(0, 120), email: key, passwordHash });
    const token = jwt.sign({ email: key }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: { name, email: key } });
  } catch (err) {
    console.error("Errore signup:", err.message);
    res.status(500).json({ error: "Impossibile creare l'account in questo momento." });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Inserisci email e password." });
    const key = String(email).toLowerCase();
    const user = users.get(key);
    if (!user) return res.status(401).json({ error: "Email o password non corretti." });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Email o password non corretti." });
    const token = jwt.sign({ email: key }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error("Errore login:", err.message);
    res.status(500).json({ error: "Impossibile accedere in questo momento." });
  }
});

app.post("/auth/forgot-password", (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !isValidEmail(email)) return res.status(400).json({ error: "Inserisci un'email valida." });
    const key = String(email).toLowerCase();
    if (users.has(key)) {
      const token = crypto.randomBytes(24).toString("hex");
      resetTokens.set(token, { email: key, expires: Date.now() + 1000 * 60 * 30 });
      const resetLink = `${SITE_URL}/?resetToken=${token}`;
      console.log(`[reset password] Link per ${key}: ${resetLink}`);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Errore forgot-password:", err.message);
    res.status(500).json({ error: "Impossibile inviare l'email in questo momento." });
  }
});

app.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: "Richiesta non valida." });
    if (password.length < 8) return res.status(400).json({ error: "La password deve avere almeno 8 caratteri." });
    const entry = resetTokens.get(token);
    if (!entry || entry.expires < Date.now()) {
      return res.status(400).json({ error: "Il link è scaduto o non è valido. Richiedine uno nuovo." });
    }
    const user = users.get(entry.email);
    if (!user) return res.status(400).json({ error: "Account non trovato." });
    user.passwordHash = await bcrypt.hash(password, 10);
    resetTokens.delete(token);
    res.json({ ok: true });
  } catch (err) {
    console.error("Errore reset-password:", err.message);
    res.status(500).json({ error: "Impossibile reimpostare la password in questo momento." });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Ordinem backend in ascolto sulla porta ${PORT}`));o sulla porta ${PORT}`));
