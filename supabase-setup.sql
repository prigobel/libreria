-- ================================================
-- LIBRERIA - Database Setup per Supabase
-- ================================================
-- Da eseguire nel SQL Editor di Supabase Dashboard
-- ================================================

-- 1. TABELLA PROFILES
-- ================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies per profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger per creare automaticamente il profilo al signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. TABELLA BOOKS
-- ================================================

CREATE TABLE IF NOT EXISTS books (
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
  spine_image_url TEXT, -- URL immagine dorso caricata su Supabase Storage

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
CREATE INDEX IF NOT EXISTS books_user_id_idx ON books(user_id);
CREATE INDEX IF NOT EXISTS books_title_idx ON books USING gin(to_tsvector('italian', title));
CREATE INDEX IF NOT EXISTS books_isbn_13_idx ON books(isbn_13);
CREATE INDEX IF NOT EXISTS books_created_at_idx ON books(created_at DESC);

-- RLS Policies per books
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own books" ON books;
CREATE POLICY "Users can view own books"
  ON books FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own books" ON books;
CREATE POLICY "Users can insert own books"
  ON books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own books" ON books;
CREATE POLICY "Users can update own books"
  ON books FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own books" ON books;
CREATE POLICY "Users can delete own books"
  ON books FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- 3. TABELLE TAGS (Opzionale - per organizzazione avanzata)
-- ================================================

CREATE TABLE IF NOT EXISTS book_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS book_tag_relations (
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES book_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, tag_id)
);

-- RLS Policies per book_tags
ALTER TABLE book_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tags" ON book_tags;
CREATE POLICY "Users can manage own tags"
  ON book_tags FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies per book_tag_relations
ALTER TABLE book_tag_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tag relations" ON book_tag_relations;
CREATE POLICY "Users can manage own tag relations"
  ON book_tag_relations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_tag_relations.book_id
      AND books.user_id = auth.uid()
    )
  );


-- ================================================
-- STORAGE BUCKET per immagini dei dorsi
-- ================================================
-- NOTA: Questa parte va eseguita tramite il Dashboard Supabase
-- o tramite l'API, non può essere eseguita con SQL.
--
-- Istruzioni:
-- 1. Vai su Storage nel Dashboard Supabase
-- 2. Crea un nuovo bucket chiamato "book-spines"
-- 3. Imposta il bucket come PRIVATO (non pubblico)
-- 4. Le policy di seguito vanno applicate tramite SQL Editor:

-- Policy per upload immagini dorsi (solo nella propria cartella user_id)
DROP POLICY IF EXISTS "Users can upload own spine images" ON storage.objects;
CREATE POLICY "Users can upload own spine images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'book-spines' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy per visualizzare proprie immagini
DROP POLICY IF EXISTS "Users can view own spine images" ON storage.objects;
CREATE POLICY "Users can view own spine images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'book-spines' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy per aggiornare proprie immagini
DROP POLICY IF EXISTS "Users can update own spine images" ON storage.objects;
CREATE POLICY "Users can update own spine images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'book-spines' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy per cancellare proprie immagini
DROP POLICY IF EXISTS "Users can delete own spine images" ON storage.objects;
CREATE POLICY "Users can delete own spine images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'book-spines' AND
  auth.uid()::text = (storage.foldername(name))[1]
);


-- ================================================
-- FUNZIONI UTILI
-- ================================================

-- Funzione per cercare libri per titolo (full text search)
CREATE OR REPLACE FUNCTION search_books(search_query TEXT, user_uuid UUID)
RETURNS SETOF books AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM books
  WHERE user_id = user_uuid
    AND (
      to_tsvector('italian', title) @@ plainto_tsquery('italian', search_query)
      OR title ILIKE '%' || search_query || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(authors) AS author
        WHERE author ILIKE '%' || search_query || '%'
      )
    )
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ================================================
-- QUERY UTILI per testing
-- ================================================

-- Contare libri per utente
-- SELECT user_id, COUNT(*) as total_books FROM books GROUP BY user_id;

-- Libri letti vs da leggere
-- SELECT read_status, COUNT(*) FROM books WHERE user_id = 'your-user-id' GROUP BY read_status;

-- Autori più presenti nella libreria
-- SELECT unnest(authors) as author, COUNT(*) as books_count
-- FROM books WHERE user_id = 'your-user-id'
-- GROUP BY author ORDER BY books_count DESC LIMIT 10;
