# Luancer & Co. — Ordinem

Sito di corsi online + sezione lingue, con pagamenti Stripe e account utente.

## Struttura della repository

```
web/       il sito (React + Vite + Tailwind) — quello che i visitatori vedono
server/    il backend (Node/Express) — pagamenti Stripe e account utente
```

Sono due progetti separati con un proprio `package.json`, perché si pubblicano in due posti diversi (vedi sotto).

## 1. Far girare il sito in locale

```bash
cd web
npm install
npm run dev
```

Apri l'indirizzo che ti mostra il terminale (di solito `http://localhost:5173`).

## 2. Pubblicare il sito

`web/` è un progetto Vite standard. Build di produzione:

```bash
cd web
npm run build
```

Genera la cartella `web/dist/` pronta per essere pubblicata su **Vercel**, **Netlify**, **Cloudflare Pages** o GitHub Pages (collega la repo, imposta la cartella `web` come root del progetto, build command `npm run build`, output `dist`).

## 3. Pubblicare il backend (pagamenti + account)

Guida completa, passo per passo (Stripe, IBAN, email di recupero password, Google/Apple): **`server/README.md`**.

In breve:
```bash
cd server
npm install
cp .env.example .env   # poi inserisci le tue chiavi vere in .env
npm start
```
Pubblicalo su Render.com o Railway.app, poi collega l'URL ottenuto nel sito: apri `web/src/App.jsx`, cerca `API_BASE` in cima al file e sostituiscilo con l'URL del backend pubblicato.

## Nota su questa repo

Questa versione sostituisce i file sparsi che c'erano prima (un `App.tsx` e un `Ordinem-corsi-online.jsx` non allineati, un `server.js` senza le rotte di accesso). Ora **`web/src/App.jsx`** è l'unica versione del sito, completa di:
- catalogo con 2.100 corsi generati, filtri, copertine per disciplina
- sezione da 100 lingue con lezioni video e quiz stile Duolingo
- lettore video reale (link YouTube/Vimeo o file locale)
- pagamento con Stripe Checkout, con selezione lingua del corso obbligatoria
- login, registrazione, recupero password via email, tutto collegato al backend in `server/`
- navigazione "Indietro"/"Menu" su ogni pagina
