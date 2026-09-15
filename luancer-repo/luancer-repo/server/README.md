# Collegare Stripe e ricevere i pagamenti sul tuo conto

## 1. Crea l'account Stripe e collega il conto bancario
Questa è l'unica parte dove il tuo IBAN va inserito — sul sito di Stripe, mai nel codice.

1. Vai su https://dashboard.stripe.com/register e crea un account
2. Completa la verifica identità/attività richiesta da Stripe per l'Italia
3. Vai su **Impostazioni → Pagamenti bancari** (Payouts) e collega il tuo IBAN
4. Per default Stripe accredita automaticamente ogni pochi giorni (puoi cambiare la frequenza)

## 2. Prendi le chiavi API
Dashboard Stripe → **Sviluppatori → Chiavi API**
- Per fare prove: usa la chiave che inizia con `sk_test_...`
- Quando sei pronto a incassare davvero: passa a `sk_live_...`

## 3. Pubblica il backend (la cartella `server/`)
Questo piccolo server è l'unico pezzo che tocca la chiave segreta di Stripe — non va mai messo nel sito React.

Opzioni gratuite/economiche per pubblicarlo: **Render.com**, **Railway.app**, o una Function di Vercel/Netlify.

Su Render, ad esempio:
1. Crea un nuovo "Web Service" collegato a questa cartella `server/`
2. Build command: `npm install` — Start command: `npm start`
3. In "Environment" imposta le variabili:
   - `STRIPE_SECRET_KEY` = la tua chiave segreta Stripe
   - `SITE_URL` = l'indirizzo pubblico del tuo sito Ordinem
4. Deploy — ti darà un URL tipo `https://ordinem-backend.onrender.com`

## 4. Collega il sito al backend
Nel file `Ordinem-corsi-online.jsx`, in cima al file, trova:

```js
const API_BASE = "https://YOUR-BACKEND-URL.example.com";
```

e sostituiscilo con l'URL che Render/Railway ti ha dato al passo 3.

## 5. Prova il pagamento
Con la chiave `sk_test_...`, usa una carta di test Stripe per verificare che tutto funzioni:
- Numero: `4242 4242 4242 4242`
- Scadenza: una data futura qualsiasi — CVC: `123`

Se il pagamento va a buon fine, Stripe rimanda l'utente al sito con `?success=1` e il corso risulta iscritto nella lingua scelta. Se annulla, torna con `?canceled=1` e un messaggio che lo invita a riprovare.

## 6. Passa alla modalità "live"
Quando hai testato tutto: sostituisci `sk_test_...` con `sk_live_...` nelle variabili d'ambiente del backend (passo 3). Da quel momento i pagamenti sono reali e Stripe li accredita, secondo il calendario che hai impostato, sul conto che hai collegato al passo 1.

---
**Nota di sicurezza:** non condividere mai la chiave che inizia con `sk_` (secret) — è quella che permette di muovere soldi sul tuo account Stripe. Il file `.env` con le chiavi vere non va mai caricato online (es. GitHub pubblico).

## 7. Accesso utenti (login, registrazione, password dimenticata)
Lo stesso backend gestisce anche gli account. Non serve altro setup oltre a quello già fatto sopra:

- **Email/password**: funziona subito, con password vere salvate in modo sicuro (hash bcrypt), non in chiaro
- **Password dimenticata**: quando un utente la richiede, il link di reset viene stampato nei log del server (Render/Railway mostrano i log in tempo reale). Per inviarlo davvero via email, collega un servizio come **Resend**, **SendGrid** o **Postmark** nel punto segnato `TODO` in `server.js`, dentro `/auth/forgot-password`
- **Google / Apple**: i bottoni ci sono già nell'interfaccia, ma sono spenti finché non registri le tue app OAuth:
  - Google: https://console.cloud.google.com/ → crea credenziali OAuth 2.0
  - Apple: https://developer.apple.com/ → "Sign in with Apple" (richiede un account Apple Developer a pagamento)
  - Una volta ottenute le credenziali, aggiungi le rotte corrispondenti in `server.js` (la libreria `passport` con `passport-google-oauth20` / `passport-apple` è la via più comune)

**⚠️ Importante sugli utenti**: in questa versione minimale gli account vivono in memoria sul server — se il server riavvia (es. dopo un deploy), la lista utenti si svuota. Prima di avere clienti veri, sostituisci `users`/`resetTokens` in `server.js` con un vero database (Postgres su Render/Supabase è una scelta semplice e gratuita per iniziare).
