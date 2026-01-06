'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CameraCapture from '@/components/CameraCapture';
import BookSearchResults from '@/components/BookSearchResults';
import { searchGoogleBooks, getBookByISBN as getGoogleBookByISBN } from '@/lib/api/googleBooks';
import { searchBookByTitle, getBookByISBN as getOpenLibraryBookByISBN } from '@/lib/api/openLibrary';
import { createClient } from '@/lib/supabase/client';

interface BookResult {
  title: string;
  subtitle?: string;
  authors?: string[];
  coverUrl?: string;
  publisher?: string;
  publishedDate?: string;
  isbn13?: string;
  isbn10?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
}

export default function AddBookPage() {
  const [step, setStep] = useState<'capture' | 'search' | 'results'>('capture');
  const [extractedText, setExtractedText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [detectedISBN, setDetectedISBN] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Autofocus sul campo di ricerca quando si arriva allo step "search"
  useEffect(() => {
    if (step === 'search' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [step]);

  const handleISBNDetected = async (isbn: string) => {
    console.log('ISBN rilevato:', isbn);
    setDetectedISBN(isbn);
    setSearchQuery(isbn);

    // Cerca automaticamente per ISBN
    setIsSearching(true);
    setStep('results');

    try {
      // Cerca su entrambe le API usando l'ISBN
      const [googleBook, openLibraryBook] = await Promise.all([
        getGoogleBookByISBN(isbn),
        getOpenLibraryBookByISBN(isbn),
      ]);

      const results: BookResult[] = [];

      if (googleBook) {
        results.push({
          title: googleBook.title,
          subtitle: googleBook.subtitle,
          authors: googleBook.authors,
          coverUrl: googleBook.coverUrl,
          publisher: googleBook.publisher,
          publishedDate: googleBook.publishedDate,
          isbn13: googleBook.isbn13,
          isbn10: googleBook.isbn10,
          description: googleBook.description,
          pageCount: googleBook.pageCount,
          categories: googleBook.categories,
        });
      }

      if (openLibraryBook && !results.some(r => r.title === openLibraryBook.title)) {
        results.push({
          title: openLibraryBook.title,
          authors: openLibraryBook.authors,
          coverUrl: openLibraryBook.coverUrl,
          publisher: openLibraryBook.publisher,
          publishedDate: openLibraryBook.publishYear?.toString(),
          isbn13: isbn.length === 13 ? isbn : undefined,
          isbn10: isbn.length === 10 ? isbn : undefined,
          description: undefined,
          pageCount: openLibraryBook.numberOfPages,
          categories: openLibraryBook.subjects,
        });
      }

      if (results.length === 0) {
        alert('Nessun libro trovato con questo ISBN. Prova a cercare per titolo.');
        setStep('search');
      } else {
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Errore durante la ricerca per ISBN:', error);
      alert('Errore durante la ricerca. Riprova.');
      setStep('search');
    } finally {
      setIsSearching(false);
    }
  };

  const handleTextExtracted = (text: string) => {
    setExtractedText(text);
    // Prova a estrarre il titolo (prendendo le prime righe più lunghe)
    const lines = text.split('\n').filter((line) => line.trim().length > 3);
    const possibleTitle = lines[0] || text.substring(0, 50);
    setSearchQuery(possibleTitle.trim());
    setStep('search');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setStep('results');

    try {
      // Controlla se la query sembra un ISBN
      const cleanedQuery = searchQuery.replace(/[^0-9]/g, '');
      const isISBN = cleanedQuery.length === 10 || cleanedQuery.length === 13;

      let combined: BookResult[] = [];

      if (isISBN) {
        // Cerca per ISBN
        const [googleBook, openLibraryBook] = await Promise.all([
          getGoogleBookByISBN(cleanedQuery),
          getOpenLibraryBookByISBN(cleanedQuery),
        ]);

        if (googleBook) {
          combined.push({
            title: googleBook.title,
            subtitle: googleBook.subtitle,
            authors: googleBook.authors,
            coverUrl: googleBook.coverUrl,
            publisher: googleBook.publisher,
            publishedDate: googleBook.publishedDate,
            isbn13: googleBook.isbn13,
            isbn10: googleBook.isbn10,
            description: googleBook.description,
            pageCount: googleBook.pageCount,
            categories: googleBook.categories,
          });
        }

        if (openLibraryBook && !combined.some(r => r.title === openLibraryBook.title)) {
          combined.push({
            title: openLibraryBook.title,
            authors: openLibraryBook.authors,
            coverUrl: openLibraryBook.coverUrl,
            publisher: openLibraryBook.publisher,
            publishedDate: openLibraryBook.publishYear?.toString(),
            isbn13: cleanedQuery.length === 13 ? cleanedQuery : undefined,
            isbn10: cleanedQuery.length === 10 ? cleanedQuery : undefined,
            description: undefined,
            pageCount: openLibraryBook.numberOfPages,
            categories: openLibraryBook.subjects,
          });
        }
      } else {
        // Cerca per titolo
        const [googleResults, openLibraryResults] = await Promise.all([
          searchGoogleBooks(searchQuery),
          searchBookByTitle(searchQuery),
        ]);

        // Combina i risultati, dando priorità a Google Books
        combined = [
          ...googleResults.map((book) => ({
            title: book.title,
            subtitle: book.subtitle,
            authors: book.authors,
            coverUrl: book.coverUrl,
            publisher: book.publisher,
            publishedDate: book.publishedDate,
            isbn13: book.isbn13,
            isbn10: book.isbn10,
            description: book.description,
            pageCount: book.pageCount,
            categories: book.categories,
          })),
          ...openLibraryResults
            .filter(
              (olBook) =>
                !googleResults.some(
                  (gBook) => gBook.title.toLowerCase() === olBook.title.toLowerCase()
                )
            )
            .map((book) => ({
              title: book.title,
              authors: book.authors,
              coverUrl: book.coverUrl,
              publisher: book.publisher,
              publishedDate: book.publishYear?.toString(),
              isbn13: book.isbn,
              description: undefined,
              pageCount: book.numberOfPages,
              categories: book.subjects,
            })),
        ];
      }

      setSearchResults(combined);
    } catch (error) {
      console.error('Errore durante la ricerca:', error);
      alert('Errore durante la ricerca. Riprova.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = async (book: BookResult) => {
    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert('Devi effettuare il login');
        return;
      }

      const { data, error } = await supabase.from('books').insert({
        user_id: user.id,
        title: book.title,
        subtitle: book.subtitle || null,
        authors: book.authors || [],
        isbn_10: book.isbn10 || null,
        isbn_13: book.isbn13 || null,
        publisher: book.publisher || null,
        published_date: book.publishedDate || null,
        page_count: book.pageCount || null,
        description: book.description || null,
        categories: book.categories || [],
        cover_url: book.coverUrl || null,
        read_status: 'to_read',
      }).select();

      if (error) {
        console.error('Errore durante il salvataggio:', error);
        alert('Errore durante il salvataggio del libro');
        return;
      }

      // Redirect alla dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header con Debug Toggle */}
      <div className="flex justify-between items-start mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Aggiungi un libro
        </h1>
        <button
          onClick={() => setDebugMode(!debugMode)}
          className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
            debugMode
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
          title="Attiva/Disattiva modalità debug"
        >
          {debugMode ? '🐛 DEBUG ON' : '🐛 Debug'}
        </button>
      </div>

      {/* Debug Info Panel */}
      {debugMode && (
        <div className="mb-6 p-4 bg-gray-900 text-green-400 rounded-lg text-xs font-mono">
          <div className="font-bold mb-2">📊 Debug Info:</div>
          <div>Step: {step}</div>
          <div>Query: {searchQuery || '(vuoto)'}</div>
          <div>ISBN rilevato: {detectedISBN || 'nessuno'}</div>
          <div>Risultati: {searchResults.length}</div>
          <div>Testo estratto: {extractedText.length} caratteri</div>
        </div>
      )}

      {step === 'capture' && (
        <div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Scegli come aggiungere il libro:
          </p>
          <CameraCapture
            onTextExtracted={handleTextExtracted}
            onISBNDetected={handleISBNDetected}
            debugMode={debugMode}
          />

          {/* Manual Input Option */}
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  oppure
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setStep('search');
                setSearchQuery('');
              }}
              className="mt-4 w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group"
            >
              <span className="text-3xl">⌨️</span>
              <div className="text-left">
                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Inserimento manuale
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Digita titolo o ISBN
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {step === 'search' && (
        <div className="space-y-6">
          {detectedISBN && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                <span className="text-xl">✓</span>
                <div>
                  <div className="font-semibold">ISBN rilevato!</div>
                  <div className="text-sm">{detectedISBN}</div>
                </div>
              </div>
            </div>
          )}

          {extractedText && !detectedISBN && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Testo estratto dalla foto:
              </p>
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm whitespace-pre-wrap mb-4 max-h-32 overflow-y-auto">
                {extractedText}
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {detectedISBN
                ? 'ISBN rilevato (modifica se necessario)'
                : extractedText
                ? 'Cerca il libro (modifica se necessario)'
                : 'Inserisci titolo o ISBN del libro'}
            </label>
            <div className="flex gap-2">
              <input
                ref={searchInputRef}
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Es: Il nome della rosa, oppure 9788845292613"
                autoComplete="off"
              />
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isSearching}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cerca
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              💡 Puoi cercare per titolo o inserire un ISBN manualmente
            </p>
          </div>

          <button
            onClick={() => {
              setStep('capture');
              setDetectedISBN(null);
              setExtractedText('');
            }}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            ← Scatta/Carica un&apos;altra foto
          </button>
        </div>
      )}

      {step === 'results' && (
        <div className="space-y-6">
          {detectedISBN && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="text-sm text-green-800 dark:text-green-300">
                📊 Risultati per ISBN: <span className="font-mono font-semibold">{detectedISBN}</span>
              </div>
            </div>
          )}

          <BookSearchResults
            results={searchResults}
            onSelect={handleSelectBook}
            isLoading={isSearching}
          />

          {!isSearching && (
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep('search');
                  setDetectedISBN(null);
                }}
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Modifica ricerca
              </button>
              <button
                onClick={() => {
                  setStep('capture');
                  setDetectedISBN(null);
                  setExtractedText('');
                }}
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Nuova foto
              </button>
            </div>
          )}
        </div>
      )}

      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="text-gray-900 dark:text-white">
                Salvataggio in corso...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
