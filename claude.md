# Libreria - App per Catalogazione Libri

## Overview
Web app mobile-first per catalogare libri tramite fotografia dei dorsi, con riconoscimento OCR dei titoli e integrazione automatica di metadati e copertine da servizi gratuiti.

## Stack Tecnologico

### Frontend
- **Next.js 14+** (App Router)
- **Tailwind CSS** per lo styling
- **shadcn/ui** (opzionale) per componenti UI
- **React Hook Form** per i form

### Backend & Database
- **Supabase**
  - PostgreSQL database
  - Authentication (Google OAuth)
  - Storage per immagini dorsi/copertine
  - Row Level Security (RLS)

### OCR & Riconoscimento Testo
- **Tesseract.js** (client-side, gratuito)
- Alternativa: **Google Cloud Vision API** (limite gratuito: 1000 richieste/mese)

### API Libri (Gratuite)
1. **Open Library API** (openlibrary.org/dev/docs/api)
   - Completamente gratuita
   - Database enorme
   - Copertine disponibili

2. **Google Books API**
   - 1000 richieste/giorno gratis
   - Dati dettagliati e affidabili

### Deployment
- **Vercel** (hobby plan gratuito)

---

## Configurazione Supabase

### 1. Autenticazione Google

#### Setup nel Dashboard Supabase
1. Vai su Authentication → Providers → Google
2. Abilita Google provider
3. Ottieni credenziali OAuth da Google Cloud Console:
   - Crea progetto su console.cloud.google.com
   - Abilita Google+ API
   - Crea OAuth 2.0 Client ID (Web application)
   - Authorized redirect URIs: `https://[PROJECT_REF].supabase.co/auth/v1/callback`
4. Inserisci Client ID e Client Secret in Supabase

#### Configurazione Next.js
```bash
npm install @supabase/ssr @supabase/supabase-js
```

File `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Struttura Database Supabase

### Tabella: `profiles`
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Tabella: `books`
```sql
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Dati principali
  title TEXT NOT NULL,
  subtitle TEXT,
  authors TEXT[], -- Array di autori
  isbn_10 TEXT,
  isbn_13 TEXT,

  -- Dettagli
  publisher TEXT,
  published_date TEXT,
  page_count INTEGER,
  language TEXT DEFAULT 'it',
  description TEXT,
  categories TEXT[], -- Array di generi

  -- Immagini
  cover_url TEXT, -- URL copertina da API esterna
  spine_image_url TEXT, -- URL immagine dorso caricata

  -- Metadati
  google_books_id TEXT, -- ID da Google Books
  open_library_id TEXT, -- ID da Open Library

  -- Status e note personali
  read_status TEXT CHECK (read_status IN ('to_read', 'reading', 'read')) DEFAULT 'to_read',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  personal_notes TEXT,
  acquisition_date DATE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX books_user_id_idx ON books(user_id);
CREATE INDEX books_title_idx ON books USING gin(to_tsvector('italian', title));
CREATE INDEX books_isbn_13_idx ON books(isbn_13);

-- RLS Policies
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own books"
  ON books FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books"
  ON books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books"
  ON books FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books"
  ON books FOR DELETE
  USING (auth.uid() = user_id);
```

### Tabella: `book_tags` (opzionale)
```sql
CREATE TABLE book_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE book_tag_relations (
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES book_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, tag_id)
);

-- RLS Policies
ALTER TABLE book_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_tag_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tags"
  ON book_tags FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tag relations"
  ON book_tag_relations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_tag_relations.book_id
      AND books.user_id = auth.uid()
    )
  );
```

### Storage Bucket per Immagini
```sql
-- Creare bucket "book-spines" nel dashboard Supabase Storage
-- Policies per il bucket:

-- Policy per upload (INSERT)
CREATE POLICY "Users can upload own spine images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'book-spines' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy per lettura (SELECT)
CREATE POLICY "Users can view own spine images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'book-spines' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy per cancellazione (DELETE)
CREATE POLICY "Users can delete own spine images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'book-spines' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Struttura Progetto Next.js

```
libreria/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── callback/
│   │       └── route.ts          # OAuth callback handler
│   ├── (protected)/
│   │   ├── layout.tsx             # Layout con auth check
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Libreria personale
│   │   ├── add-book/
│   │   │   └── page.tsx           # Aggiungi libro (camera/OCR)
│   │   └── book/
│   │       └── [id]/
│   │           ├── page.tsx       # Dettaglio libro
│   │           └── edit/
│   │               └── page.tsx   # Modifica libro
│   ├── api/
│   │   ├── ocr/
│   │   │   └── route.ts           # Endpoint OCR (se server-side)
│   │   ├── books/
│   │   │   ├── search/
│   │   │   │   └── route.ts       # Ricerca nelle API esterne
│   │   │   └── [id]/
│   │   │       └── route.ts       # CRUD libro
│   │   └── upload/
│   │       └── route.ts           # Upload immagine dorso
│   ├── layout.tsx
│   └── page.tsx                   # Landing page
├── components/
│   ├── ui/                        # Componenti UI riutilizzabili
│   ├── BookCard.tsx
│   ├── BookForm.tsx
│   ├── CameraCapture.tsx          # Componente camera
│   ├── OCRProcessor.tsx
│   └── SearchResults.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Client-side Supabase
│   │   ├── server.ts              # Server-side Supabase
│   │   └── middleware.ts
│   ├── ocr/
│   │   └── tesseract.ts           # Configurazione Tesseract
│   ├── api/
│   │   ├── openLibrary.ts         # Client Open Library API
│   │   └── googleBooks.ts         # Client Google Books API
│   └── utils.ts
├── types/
│   └── database.types.ts          # Types generati da Supabase
├── middleware.ts                  # Auth middleware
└── public/
```

---

## Implementazione Features Chiave

### 1. Fotografia Dorso & OCR

#### Opzione A: Tesseract.js (Client-side, completamente gratuito)
```tsx
// components/CameraCapture.tsx
'use client';

import { useRef, useState } from 'react';
import Tesseract from 'tesseract.js';

export function CameraCapture() {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setImage(imageUrl);

    // OCR processing
    setIsProcessing(true);
    try {
      const { data: { text } } = await Tesseract.recognize(
        imageUrl,
        'ita', // lingua italiana
        {
          logger: (m) => console.log(m), // progress
        }
      );
      setText(text);
      // Puoi fare parsing del testo per estrarre titoli
    } catch (error) {
      console.error('OCR error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        capture="environment" // camera posteriore su mobile
        onChange={handleCapture}
      />
      {isProcessing && <p>Riconoscimento testo in corso...</p>}
      {text && <p>Testo riconosciuto: {text}</p>}
    </div>
  );
}
```

#### Opzione B: Google Cloud Vision API (Server-side)
```typescript
// app/api/ocr/route.ts
import vision from '@google-cloud/vision';

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get('image') as File;

  const client = new vision.ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });

  const [result] = await client.textDetection(image);
  const detections = result.textAnnotations;
  const text = detections?.[0]?.description || '';

  return Response.json({ text });
}
```

### 2. Integrazione API Libri

```typescript
// lib/api/openLibrary.ts
export async function searchBookByTitle(title: string) {
  const response = await fetch(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=5`
  );
  const data = await response.json();
  return data.docs.map((book: any) => ({
    title: book.title,
    authors: book.author_name,
    isbn: book.isbn?.[0],
    publishYear: book.first_publish_year,
    coverUrl: book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
      : null,
    openLibraryId: book.key,
  }));
}

export async function getBookByISBN(isbn: string) {
  const response = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
  );
  const data = await response.json();
  const bookData = data[`ISBN:${isbn}`];

  if (!bookData) return null;

  return {
    title: bookData.title,
    authors: bookData.authors?.map((a: any) => a.name),
    publishers: bookData.publishers?.map((p: any) => p.name),
    publishDate: bookData.publish_date,
    pages: bookData.number_of_pages,
    coverUrl: bookData.cover?.large || bookData.cover?.medium,
    subjects: bookData.subjects?.map((s: any) => s.name),
  };
}
```

```typescript
// lib/api/googleBooks.ts
export async function searchGoogleBooks(query: string) {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY; // opzionale per più richieste
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}${apiKey ? `&key=${apiKey}` : ''}`;

  const response = await fetch(url);
  const data = await response.json();

  return data.items?.map((item: any) => ({
    id: item.id,
    title: item.volumeInfo.title,
    subtitle: item.volumeInfo.subtitle,
    authors: item.volumeInfo.authors,
    publisher: item.volumeInfo.publisher,
    publishedDate: item.volumeInfo.publishedDate,
    description: item.volumeInfo.description,
    pageCount: item.volumeInfo.pageCount,
    categories: item.volumeInfo.categories,
    coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
    isbn10: item.volumeInfo.industryIdentifiers?.find((i: any) => i.type === 'ISBN_10')?.identifier,
    isbn13: item.volumeInfo.industryIdentifiers?.find((i: any) => i.type === 'ISBN_13')?.identifier,
  })) || [];
}
```

---

## Setup Iniziale

### 1. Creare progetto Next.js
```bash
npx create-next-app@latest libreria --typescript --tailwind --app --eslint
cd libreria
npm install @supabase/ssr @supabase/supabase-js
npm install tesseract.js
npm install react-hook-form @hookform/resolvers zod
```

### 2. Configurare Supabase
1. Crea progetto su supabase.com
2. Esegui SQL per tabelle (vedi sopra)
3. Crea bucket Storage "book-spines"
4. Configura Google OAuth
5. Copia URL e anon key in `.env.local`

### 3. Generare Types TypeScript da Supabase
```bash
npm install supabase --save-dev
npx supabase login
npx supabase gen types typescript --project-id your-project-ref > types/database.types.ts
```

### 4. Deploy su Vercel
```bash
npm install -g vercel
vercel login
vercel
# Aggiungi environment variables nel dashboard Vercel
```

---

## Workflow Utente

1. **Login con Google** → Redirect a dashboard
2. **Dashboard** → Visualizza libreria personale (griglia libri)
3. **Aggiungi Libro**:
   - Fotografa dorso libro
   - OCR estrae titolo/autore
   - App cerca su Open Library / Google Books
   - Mostra risultati con copertine
   - Utente seleziona libro corretto
   - Salva in database
4. **Dettaglio Libro** → Visualizza info complete, modifica status/rating/note
5. **Ricerca/Filtri** → Filtra per autore, genere, status

---

## Ottimizzazioni Mobile

- **PWA**: Configurare `manifest.json` e service worker per installabilità
- **Responsive**: Tailwind breakpoints per layout mobile-first
- **Image Optimization**: Next.js Image component per copertine
- **Offline Support**: Cache libri con service worker
- **Camera Access**: HTML5 Media Capture API per accesso diretto camera

---

## Note di Sicurezza

- ✅ RLS abilitato su tutte le tabelle
- ✅ Autenticazione richiesta per tutte le route protette
- ✅ Validazione input con Zod
- ✅ Environment variables per API keys
- ✅ HTTPS enforced su Vercel
- ✅ Storage policies per isolamento file utenti

---

## Estensioni Future

- [ ] Condivisione liste libri pubbliche
- [ ] Prestiti (tracking a chi hai prestato libri)
- [ ] Statistiche lettura (libri letti per anno/mese)
- [ ] Wishlist / liste lettura
- [ ] Integrazione Goodreads
- [ ] Export CSV/PDF della libreria
- [ ] Barcode scanner per ISBN
- [ ] Raccomandazioni basate su libri simili
