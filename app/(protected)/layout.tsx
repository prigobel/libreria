import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const handleSignOut = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                Libreria
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link
                  href="/dashboard"
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  I miei libri
                </Link>
                <Link
                  href="/add-book"
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Aggiungi libro
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </div>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                >
                  Esci
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex justify-around py-2">
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 px-4 py-2 text-gray-700 dark:text-gray-300"
          >
            <span className="text-xl">📚</span>
            <span className="text-xs">Libri</span>
          </Link>
          <Link
            href="/add-book"
            className="flex flex-col items-center gap-1 px-4 py-2 text-gray-700 dark:text-gray-300"
          >
            <span className="text-xl">➕</span>
            <span className="text-xs">Aggiungi</span>
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
