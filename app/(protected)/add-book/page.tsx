'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CameraCapture from '@/components/CameraCapture';
import BookSearchResults from '@/components/BookSearchResults';
import { searchGoogleBooks } from '@/lib/api/googleBooks';
import { searchBookByTitle } from '@/lib/api/openLibrary';
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
  const router = useRouter();
  const supabase = createClient();

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
      // Cerca su entrambe le API in parallelo
      const [googleResults, openLibraryResults] = await Promise.all([
        searchGoogleBooks(searchQuery),
        searchBookByTitle(searchQuery),
      ]);

      // Combina i risultati, dando priorità a Google Books
      const combined: BookResult[] = [
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
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Aggiungi un libro
      </h1>

      {step === 'capture' && (
        <div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Fotografa il dorso del libro per estrarre automaticamente il titolo
          </p>
          <CameraCapture onTextExtracted={handleTextExtracted} />
        </div>
      )}

      {step === 'search' && (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Testo estratto dalla foto:
            </p>
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm whitespace-pre-wrap mb-4">
              {extractedText}
            </div>
          </div>

          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Cerca il libro (modifica se necessario)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Titolo del libro..."
              />
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isSearching}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cerca
              </button>
            </div>
          </div>

          <button
            onClick={() => setStep('capture')}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            ← Scatta un&apos;altra foto
          </button>
        </div>
      )}

      {step === 'results' && (
        <div className="space-y-6">
          <BookSearchResults
            results={searchResults}
            onSelect={handleSelectBook}
            isLoading={isSearching}
          />

          {!isSearching && (
            <div className="flex gap-4">
              <button
                onClick={() => setStep('search')}
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Modifica ricerca
              </button>
              <button
                onClick={() => setStep('capture')}
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
