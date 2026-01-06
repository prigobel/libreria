export interface OpenLibraryBook {
  title: string;
  authors?: string[];
  isbn?: string;
  publishYear?: number;
  coverUrl?: string;
  openLibraryId?: string;
  publisher?: string;
  numberOfPages?: number;
  subjects?: string[];
}

export async function searchBookByTitle(
  title: string
): Promise<OpenLibraryBook[]> {
  try {
    const response = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=10`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Open Library');
    }

    const data = await response.json();

    return data.docs.map((book: any) => ({
      title: book.title,
      authors: book.author_name || [],
      isbn: book.isbn?.[0],
      publishYear: book.first_publish_year,
      coverUrl: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
        : undefined,
      openLibraryId: book.key,
      publisher: book.publisher?.[0],
      numberOfPages: book.number_of_pages_median,
      subjects: book.subject?.slice(0, 5),
    }));
  } catch (error) {
    console.error('Error searching Open Library:', error);
    return [];
  }
}

export async function getBookByISBN(isbn: string): Promise<OpenLibraryBook | null> {
  try {
    const response = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Open Library');
    }

    const data = await response.json();
    const bookData = data[`ISBN:${isbn}`];

    if (!bookData) return null;

    return {
      title: bookData.title,
      authors: bookData.authors?.map((a: any) => a.name) || [],
      isbn: isbn,
      publishYear: bookData.publish_date
        ? parseInt(bookData.publish_date.match(/\d{4}/)?.[0] || '0')
        : undefined,
      coverUrl: bookData.cover?.large || bookData.cover?.medium,
      publisher: bookData.publishers?.[0]?.name,
      numberOfPages: bookData.number_of_pages,
      subjects: bookData.subjects?.map((s: any) => s.name).slice(0, 5),
    };
  } catch (error) {
    console.error('Error fetching book by ISBN from Open Library:', error);
    return null;
  }
}
