import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <main className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Libreria
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-md">
          Cataloga la tua libreria personale fotografando i dorsi dei libri
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Inizia ora
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-lg font-semibold border-2 border-indigo-600 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
          >
            Dashboard
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="text-3xl mb-2">📸</div>
            <h3 className="font-semibold mb-2">Fotografia</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Scatta foto ai dorsi dei libri
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="text-3xl mb-2">🔍</div>
            <h3 className="font-semibold mb-2">Riconoscimento</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              OCR automatico dei titoli
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="text-3xl mb-2">📚</div>
            <h3 className="font-semibold mb-2">Catalogo</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Info e copertine automatiche
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
