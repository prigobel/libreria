import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch user's books
  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching books:', error);
  }

  const totalBooks = books?.length || 0;
  const booksRead = books?.filter((b) => b.read_status === 'read').length || 0;
  const booksReading = books?.filter((b) => b.read_status === 'reading').length || 0;
  const booksToRead = books?.filter((b) => b.read_status === 'to_read').length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {totalBooks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Totali</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {booksRead}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Letti</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {booksReading}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">In lettura</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {booksToRead}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Da leggere</div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          La mia libreria
        </h2>
        <Link
          href="/add-book"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Aggiungi libro
        </Link>
      </div>

      {!books || books.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Nessun libro ancora
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Inizia ad aggiungere libri alla tua collezione
          </p>
          <Link
            href="/add-book"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Aggiungi il primo libro
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/book/${book.id}`}
              className="group bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="aspect-[2/3] relative bg-gray-200 dark:bg-gray-700">
                {book.cover_url ? (
                  <Image
                    src={book.cover_url}
                    alt={book.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl">
                    📖
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm line-clamp-2 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {book.title}
                </h3>
                {book.authors && book.authors.length > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                    {book.authors.join(', ')}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
