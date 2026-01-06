'use client';

import Image from 'next/image';

interface BookResult {
  title: string;
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

interface BookSearchResultsProps {
  results: BookResult[];
  onSelect: (book: BookResult) => void;
  isLoading?: boolean;
}

export default function BookSearchResults({
  results,
  onSelect,
  isLoading = false,
}: BookSearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Ricerca in corso...
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-gray-600 dark:text-gray-400">
          Nessun risultato trovato
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Seleziona il libro corretto ({results.length} risultati)
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {results.map((book, index) => (
          <button
            key={index}
            onClick={() => onSelect(book)}
            className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-20 h-28 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden relative">
              {book.coverUrl ? (
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-2xl">
                  📖
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                {book.title}
              </h4>
              {book.authors && book.authors.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {book.authors.join(', ')}
                </p>
              )}
              {book.publisher && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {book.publisher}
                  {book.publishedDate && ` • ${book.publishedDate}`}
                </p>
              )}
              {book.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                  {book.description}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
