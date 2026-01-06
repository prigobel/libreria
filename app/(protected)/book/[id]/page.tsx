import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: book, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !book) {
    notFound();
  }

  const handleDelete = async () => {
    'use server';
    const supabase = await createClient();
    const { id } = await params;

    await supabase.from('books').delete().eq('id', id);
    redirect('/dashboard');
  };

  const statusLabels = {
    to_read: 'Da leggere',
    reading: 'In lettura',
    read: 'Letto',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline mb-6"
      >
        ← Torna alla libreria
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Cover Image */}
          <div className="md:flex-shrink-0 md:w-64 bg-gray-200 dark:bg-gray-700">
            {book.cover_url ? (
              <div className="relative w-full aspect-[2/3]">
                <Image
                  src={book.cover_url}
                  alt={book.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-full aspect-[2/3] text-8xl">
                📖
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="p-8 flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {book.title}
            </h1>
            {book.subtitle && (
              <h2 className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                {book.subtitle}
              </h2>
            )}

            {book.authors && book.authors.length > 0 && (
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                di {book.authors.join(', ')}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              {book.publisher && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Editore
                  </span>
                  <p className="text-gray-900 dark:text-white">{book.publisher}</p>
                </div>
              )}
              {book.published_date && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Data pubblicazione
                  </span>
                  <p className="text-gray-900 dark:text-white">
                    {book.published_date}
                  </p>
                </div>
              )}
              {book.page_count && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Pagine
                  </span>
                  <p className="text-gray-900 dark:text-white">{book.page_count}</p>
                </div>
              )}
              {book.language && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Lingua
                  </span>
                  <p className="text-gray-900 dark:text-white uppercase">
                    {book.language}
                  </p>
                </div>
              )}
            </div>

            {(book.isbn_10 || book.isbn_13) && (
              <div className="mb-6">
                <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                  ISBN
                </span>
                <div className="flex gap-4 text-sm">
                  {book.isbn_13 && (
                    <span className="text-gray-900 dark:text-white">
                      ISBN-13: {book.isbn_13}
                    </span>
                  )}
                  {book.isbn_10 && (
                    <span className="text-gray-900 dark:text-white">
                      ISBN-10: {book.isbn_10}
                    </span>
                  )}
                </div>
              </div>
            )}

            {book.categories && book.categories.length > 0 && (
              <div className="mb-6">
                <span className="text-sm text-gray-500 dark:text-gray-400 block mb-2">
                  Categorie
                </span>
                <div className="flex flex-wrap gap-2">
                  {book.categories.map((category, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <span className="text-sm text-gray-500 dark:text-gray-400 block mb-2">
                Stato lettura
              </span>
              <span
                className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
                  book.read_status === 'read'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : book.read_status === 'reading'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}
              >
                {statusLabels[book.read_status as keyof typeof statusLabels]}
              </span>
            </div>

            {book.rating && (
              <div className="mb-6">
                <span className="text-sm text-gray-500 dark:text-gray-400 block mb-2">
                  Valutazione
                </span>
                <div className="flex gap-1 text-2xl">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>
                      {i < book.rating! ? '⭐' : '☆'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {book.description && (
              <div className="mb-6">
                <span className="text-sm text-gray-500 dark:text-gray-400 block mb-2">
                  Descrizione
                </span>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {book.description}
                </p>
              </div>
            )}

            {book.personal_notes && (
              <div className="mb-6">
                <span className="text-sm text-gray-500 dark:text-gray-400 block mb-2">
                  Note personali
                </span>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {book.personal_notes}
                </p>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <form action={handleDelete} className="flex-1">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Elimina libro
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Aggiunto il {new Date(book.created_at).toLocaleDateString('it-IT')}
      </div>
    </div>
  );
}
