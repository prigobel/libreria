# 🚀 Setup Rapido - Libreria

## ✅ Progetto Completato!

Il progetto Next.js è stato creato con successo. Ora devi solo configurare Supabase per farlo funzionare.

## 📋 Prossimi Passi

### 1. Crea il progetto Supabase (5 minuti)

1. Vai su [supabase.com](https://supabase.com) e crea un account (gratis)
2. Clicca su "New Project"
3. Scegli un nome (es. "libreria")
4. Scegli una password forte per il database
5. Seleziona la region più vicina (es. "Frankfurt" per l'Italia)
6. Clicca su "Create new project" e attendi ~2 minuti

### 2. Configura il Database (2 minuti)

1. Nel dashboard Supabase, vai su **SQL Editor** (icona `</>` nella sidebar)
2. Clicca su "New query"
3. Apri il file `supabase-setup.sql` nel tuo progetto
4. Copia **tutto** il contenuto del file
5. Incolla nell'editor SQL di Supabase
6. Clicca su "Run" (o premi Ctrl+Enter)
7. Dovresti vedere "Success. No rows returned" ✅

### 3. Crea lo Storage Bucket (1 minuto)

1. Nel dashboard Supabase, vai su **Storage** (icona cartella nella sidebar)
2. Clicca su "Create a new bucket"
3. Nome: `book-spines`
4. **NON** selezionare "Public bucket" (deve rimanere privato)
5. Clicca su "Create bucket"

### 4. Configura Google OAuth (5 minuti)

#### 4.1 Ottieni le credenziali da Google

1. Vai su [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuovo progetto o seleziona uno esistente
3. Nel menu laterale, vai su **API e servizi** → **Credenziali**
4. Clicca su "Crea credenziali" → "ID client OAuth 2.0"
5. Tipo applicazione: **Applicazione web**
6. Nome: "Libreria App"
7. In "URI di reindirizzamento autorizzati", aggiungi:
   ```
   https://[IL-TUO-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   ⚠️ Sostituisci `[IL-TUO-PROJECT-REF]` con il vero reference del tuo progetto Supabase (lo trovi nell'URL quando sei nel dashboard)

8. Clicca su "Crea"
9. Copia il **Client ID** e il **Client Secret**

#### 4.2 Configura in Supabase

1. Nel dashboard Supabase, vai su **Authentication** → **Providers**
2. Cerca "Google" nella lista e cliccaci sopra
3. Attiva lo switch "Enable Sign in with Google"
4. Incolla il **Client ID** di Google
5. Incolla il **Client Secret** di Google
6. Clicca su "Save"

### 5. Configura le Variabili Ambiente (1 minuto)

1. Nel dashboard Supabase, vai su **Settings** → **API**
2. Copia:
   - **Project URL** (nella sezione "Project URL")
   - **anon public** key (nella sezione "Project API keys")

3. Nel tuo progetto, crea il file `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

4. Apri `.env.local` e inserisci i valori:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[tuo-project-ref].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[tua-anon-key]
   ```

### 6. Avvia l'App! 🎉

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

---

## ✨ Test dell'App

1. Clicca su "Inizia ora" o vai su `/login`
2. Clicca su "Continua con Google"
3. Autorizza l'app con il tuo account Google
4. Dovresti essere reindirizzato alla Dashboard (vuota)
5. Clicca su "Aggiungi libro"
6. Fotografa il dorso di un libro
7. Attendi l'OCR (riconoscimento testo)
8. Cerca il libro e selezionalo dai risultati
9. Il libro apparirà nella tua libreria! 🎉

---

## 🐛 Troubleshooting

### "Invalid Redirect URI"
- Verifica che l'URI in Google Cloud Console corrisponda esattamente a quello di Supabase
- Formato: `https://[project-ref].supabase.co/auth/v1/callback`

### "Invalid API key"
- Controlla che le variabili in `.env.local` siano corrette
- Assicurati di usare la **anon key**, non la **service_role key**

### "Table does not exist"
- Verifica di aver eseguito tutto lo script `supabase-setup.sql`
- Controlla nel SQL Editor se ci sono stati errori

### L'OCR non funziona bene
- Assicurati di fotografare il dorso in buona luce
- Il testo deve essere il più chiaro possibile
- Puoi modificare manualmente la ricerca dopo l'OCR

---

## 🚀 Deploy su Vercel

Quando sei pronto per il deploy:

1. Committa il codice su GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tuo-username/libreria.git
   git push -u origin main
   ```

2. Vai su [vercel.com](https://vercel.com)
3. Importa il repository GitHub
4. Aggiungi le variabili ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

6. Aggiorna Google OAuth con il nuovo URL Vercel:
   - Aggiungi `https://tuo-app.vercel.app/auth/callback` agli URI autorizzati

---

## 📚 Documentazione Completa

Consulta il file `README.md` per la documentazione completa del progetto.

Il file `claude.md` contiene la pianificazione dettagliata con tutte le specifiche tecniche.

---

**Buon catalogamento! 📚✨**
