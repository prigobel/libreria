# 📚 Libreria - Cataloga i tuoi libri

Web app mobile-first per catalogare la tua libreria personale fotografando i dorsi dei libri, con riconoscimento automatico OCR e integrazione API per metadati e copertine.

## ✨ Features

- 📸 **Fotografia dorsi libri** tramite camera del cellulare
- 🔍 **OCR automatico** per estrarre titoli (Tesseract.js)
- 🌐 **Integrazione API** (Open Library + Google Books) per metadati automatici
- 🔒 **Autenticazione Google** tramite Supabase Auth
- 📖 **Catalogo personale** con ricerca e filtri
- 📊 **Statistiche** lettura (letti, in lettura, da leggere)
- 🎨 **UI responsive** mobile-first con Tailwind CSS
- ⚡ **Ottimizzato** con Next.js 15 e Turbopack

## 🚀 Setup Iniziale

### 1. Installazione dipendenze

Le dipendenze sono già installate. Se necessario:

```bash
npm install
```

### 2. Configurazione Supabase

#### 2.1 Crea progetto Supabase

1. Vai su [supabase.com](https://supabase.com)
2. Crea un nuovo progetto
3. Annota **Project URL** e **Anon Key**

#### 2.2 Configura Google OAuth

1. Vai su [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuovo progetto (o usa uno esistente)
3. Abilita **Google+ API**
4. Vai su "Credenziali" → "Crea credenziali" → "ID client OAuth 2.0"
5. Tipo applicazione: **Applicazione web**
6. Aggiungi URI di reindirizzamento autorizzati:
   ```
   https://[TUO-PROJECT-REF].supabase.co/auth/v1/callback
   ```
7. Copia **Client ID** e **Client Secret**

8. Nel Supabase Dashboard:
   - Vai su **Authentication** → **Providers** → **Google**
   - Abilita Google provider
   - Incolla Client ID e Client Secret
   - Salva

#### 2.3 Crea database e storage

1. Nel Supabase Dashboard, vai su **SQL Editor**
2. Apri il file `supabase-setup.sql`
3. Copia e incolla tutto il contenuto nell'editor SQL
4. Esegui lo script

5. Vai su **Storage**
6. Crea un nuovo bucket chiamato `book-spines`
7. Imposta come **privato** (non pubblico)

#### 2.4 Configura variabili ambiente

Crea un file `.env.local` nella root del progetto:

```bash
cp .env.local.example .env.local
```

Modifica `.env.local` con i tuoi dati:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tuo-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tua-anon-key

# Opzionale: per aumentare limite richieste Google Books
# GOOGLE_BOOKS_API_KEY=tua-api-key
```

### 3. Avvia il server di sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

## 📱 Come Usare

### Primo accesso

1. Vai su `/login`
2. Clicca su "Continua con Google"
3. Autorizza l'applicazione
4. Verrai reindirizzato alla dashboard

### Aggiungere un libro

1. Vai su "Aggiungi libro" o `/add-book`
2. Fotografa il dorso del libro
3. Attendi l'OCR (riconoscimento automatico del titolo)
4. Modifica la ricerca se necessario
5. Seleziona il libro corretto dai risultati
6. Il libro verrà salvato automaticamente

### Gestire i libri

- **Dashboard**: visualizza tutti i tuoi libri
- **Dettaglio libro**: clicca su un libro per vedere info complete
- **Elimina**: elimina un libro dalla pagina dettaglio

## 🏗️ Struttura Progetto

```
libreria/
├── app/
│   ├── (auth)/
│   │   └── login/              # Pagina login Google
│   ├── (protected)/
│   │   ├── dashboard/          # Libreria personale
│   │   ├── add-book/           # Aggiungi libro (camera + OCR)
│   │   └── book/[id]/          # Dettaglio libro
│   └── auth/callback/          # OAuth callback
├── components/
│   ├── CameraCapture.tsx       # Componente camera + OCR
│   └── BookSearchResults.tsx   # Risultati ricerca
├── lib/
│   ├── supabase/               # Client Supabase
│   ├── api/
│   │   ├── googleBooks.ts      # API Google Books
│   │   └── openLibrary.ts      # API Open Library
│   └── ocr/                    # Configurazione Tesseract
├── types/
│   └── database.types.ts       # Types generati da Supabase
└── supabase-setup.sql          # SQL per setup database
```

## 🚀 Deploy su Vercel

### 1. Collega repository GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tuo-username/libreria.git
git push -u origin main
```

### 2. Deploy su Vercel

1. Vai su [vercel.com](https://vercel.com)
2. Importa il repository GitHub
3. Configura le variabili ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### 3. Aggiorna Google OAuth redirect URI

Aggiungi l'URL Vercel ai redirect URI autorizzati in Google Cloud Console:
```
https://tuo-dominio.vercel.app/auth/callback
```

## 📊 API Utilizzate

### Open Library (Gratuita)
- **Limite**: Illimitato
- **Endpoint**: `https://openlibrary.org/search.json`
- **Docs**: [openlibrary.org/dev/docs/api](https://openlibrary.org/dev/docs/api)

### Google Books
- **Limite gratuito**: 1000 richieste/giorno
- **Endpoint**: `https://www.googleapis.com/books/v1/volumes`
- **Docs**: [developers.google.com/books](https://developers.google.com/books)

### Tesseract.js (OCR)
- **Completamente gratuito**
- **Client-side** (nessun server richiesto)
- **Supporto italiano** (`ita` + `eng`)

## 🔒 Sicurezza

- ✅ Row Level Security (RLS) abilitato su tutte le tabelle
- ✅ Autenticazione OAuth con Google
- ✅ Middleware per protezione route
- ✅ Storage bucket con policy isolamento utenti
- ✅ Validazione input
- ✅ HTTPS enforced su Vercel

## 🛠️ Sviluppo

### Build production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

### Generare types da Supabase

```bash
npx supabase gen types typescript --project-id tuo-project-ref > types/database.types.ts
```

## 📝 TODO Future

- [ ] PWA (Progressive Web App) per installazione
- [ ] Barcode scanner per ISBN
- [ ] Modifica informazioni libro
- [ ] Export CSV/PDF libreria
- [ ] Condivisione liste pubbliche
- [ ] Prestiti (tracking)
- [ ] Statistiche avanzate
- [ ] Raccomandazioni libri simili
- [ ] Dark mode toggle

## 📄 Licenza

MIT

---

Sviluppato con ❤️ usando Next.js, Supabase e Tailwind CSS
