export interface GoogleBook {
  id: string;
  title: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
  coverUrl?: string;
  isbn10?: string;
  isbn13?: string;
  language?: string;
}

export async function searchGoogleBooks(query: string): Promise<GoogleBook[]> {
  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}${apiKey ? `&key=${apiKey}` : ''}&maxResults=10`;

    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Google Books');
    }

    const data = await response.json();

    if (!data.items) return [];

    return data.items.map((item: any) => ({
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
      isbn10: item.volumeInfo.industryIdentifiers?.find(
        (i: any) => i.type === 'ISBN_10'
      )?.identifier,
      isbn13: item.volumeInfo.industryIdentifiers?.find(
        (i: any) => i.type === 'ISBN_13'
      )?.identifier,
      language: item.volumeInfo.language,
    }));
  } catch (error) {
    console.error('Error searching Google Books:', error);
    return [];
  }
}

export async function getBookByISBN(isbn: string): Promise<GoogleBook | null> {
  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${apiKey ? `&key=${apiKey}` : ''}`;

    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Google Books');
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) return null;

    const item = data.items[0];

    return {
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
      isbn10: item.volumeInfo.industryIdentifiers?.find(
        (i: any) => i.type === 'ISBN_10'
      )?.identifier,
      isbn13: item.volumeInfo.industryIdentifiers?.find(
        (i: any) => i.type === 'ISBN_13'
      )?.identifier,
      language: item.volumeInfo.language,
    };
  } catch (error) {
    console.error('Error fetching book by ISBN from Google Books:', error);
    return null;
  }
}
