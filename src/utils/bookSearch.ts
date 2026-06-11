import { Book } from '../types';

export interface ExternalBook extends Book {
  source: 'OpenLibrary' | 'ProjectGutenberg' | 'GoogleBooks' | 'Local';
  externalUrl?: string;
}

/**
 * Utility to search books from Open Library, Project Gutenberg and Google Books
 */
export const BookSearchService = {

  /**
   * Search on Open Library
   */
  searchOpenLibrary: async (query: string): Promise<ExternalBook[]> => {
    if (!query || query.length < 3) return [];

    try {
      // Trying to prioritize Italian via query addition
      const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}+language:ita&limit=10`);
      const data = await response.json();

      let results = data.docs.map((doc: any) => ({
        id: `ol-${doc.key.replace('/works/', '')}`,
        title: doc.title,
        author: doc.author_name ? doc.author_name[0] : 'Autore Sconosciuto',
        coverUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
          : 'https://images.unsplash.com/photo-1543004218-ee14110497f8?auto=format&fit=crop&q=80&w=300',
        category: 'Romanzi',
        description: doc.first_sentence ? doc.first_sentence[0] : `Un'opera affascinante catalogata in Open Library. ${doc.subject ? 'Tratta di: ' + doc.subject.slice(0, 3).join(', ') : ''}`,
        source: 'OpenLibrary' as const,
        externalUrl: `https://openlibrary.org${doc.key}`
      }));

      // If no results with Italian filter, try general search
      if (results.length === 0) {
        const genResponse = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`);
        const genData = await genResponse.json();
        results = genData.docs.map((doc: any) => ({
          id: `ol-${doc.key.replace('/works/', '')}`,
          title: doc.title,
          author: doc.author_name ? doc.author_name[0] : 'Autore Sconosciuto',
          coverUrl: doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
            : 'https://images.unsplash.com/photo-1543004218-ee14110497f8?auto=format&fit=crop&q=80&w=300',
          category: 'Romanzi',
          description: doc.first_sentence ? doc.first_sentence[0] : `Un'opera affascinante catalogata in Open Library.`,
          source: 'OpenLibrary' as const,
          externalUrl: `https://openlibrary.org${doc.key}`
        }));
      }

      return results;
    } catch (error) {
      console.error("OpenLibrary search error:", error);
      return [];
    }
  },

  /**
   * Search on Project Gutenberg (via Gutendex)
   */
  searchGutenberg: async (query: string): Promise<ExternalBook[]> => {
    if (!query || query.length < 3) return [];

    try {
      // Prioritize Italian by searching with language filter
      const response = await fetch(`https://gutendex.com/books/?languages=it&search=${encodeURIComponent(query)}`);
      const data = await response.json();

      let results = data.results.slice(0, 10).map((book: any) => ({
        id: `pg-${book.id}`,
        title: book.title,
        author: book.authors.length > 0 ? book.authors[0].name : 'Autore Sconosciuto',
        coverUrl: (book.formats && book.formats['image/jpeg']) || 'https://images.unsplash.com/photo-1543004218-ee14110497f8?auto=format&fit=crop&q=80&w=300',
        category: 'Classici',
        description: `Un classico immortale proveniente dal Progetto Gutenberg. Lingue: ${book.languages ? book.languages.join(', ') : 'Sconosciuta'}.`,
        source: 'ProjectGutenberg' as const,
        externalUrl: (book.formats && (book.formats['text/html'] || book.formats['text/plain'])) || `https://www.gutenberg.org/ebooks/${book.id}`
      }));

      // If no Italian results, try general
      if (results.length === 0) {
        const genResponse = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(query)}`);
        const genData = await genResponse.json();
        results = genData.results.slice(0, 5).map((book: any) => ({
          id: `pg-${book.id}`,
          title: book.title,
          author: book.authors.length > 0 ? book.authors[0].name : 'Autore Sconosciuto',
          coverUrl: (book.formats && book.formats['image/jpeg']) || 'https://images.unsplash.com/photo-1543004218-ee14110497f8?auto=format&fit=crop&q=80&w=300',
          category: 'Classici',
          description: `Un classico immortale dal Progetto Gutenberg.`,
          source: 'ProjectGutenberg' as const,
          externalUrl: (book.formats && (book.formats['text/html'] || book.formats['text/plain'])) || `https://www.gutenberg.org/ebooks/${book.id}`
        }));
      }

      return results;
    } catch (error) {
      console.error("Project Gutenberg search error:", error);
      return [];
    }
  },

  /**
   * Search on Google Books (Very good for Italian)
   */
  searchGoogleBooks: async (query: string): Promise<ExternalBook[]> => {
    if (!query || query.length < 3) return [];

    try {
      console.log(`[GoogleBooks] Searching for: ${query}`);
      // Use langRestrict=it for Italian priority
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=it&maxResults=15`);
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        console.log(`[GoogleBooks] No results with langRestrict=it, trying general search...`);
        const genResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`);
        const genData = await genResponse.json();
        if (!genData.items) return [];
        data.items = genData.items;
      }

      console.log(`[GoogleBooks] Found ${data.items.length} items`);

      return data.items.map((item: any) => {
        const info = item.volumeInfo;
        return {
          id: `gb-${item.id}`,
          title: info.title,
          author: info.authors ? info.authors[0] : 'Autore Sconosciuto',
          coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://images.unsplash.com/photo-1543004218-ee14110497f8?auto=format&fit=crop&q=80&w=300',
          category: info.categories ? info.categories[0] : 'Romanzi',
          description: info.description ? (info.description.substring(0, 200) + '...') : 'Nessuna descrizione disponibile.',
          source: 'GoogleBooks' as const,
          externalUrl: info.infoLink
        };
      });
    } catch (error) {
      console.error("Google Books search error:", error);
      return [];
    }
  },

  /**
   * Search on Liber Liber (via Google Books specialized query)
   * Liber Liber doesn't have a direct JSON API, so we target it through Google Books or try a direct approach if possible.
   * For now, let's optimize the Google Books query to look for Liber Liber explicitly if results are low.
   */
  searchLiberLiber: async (query: string): Promise<ExternalBook[]> => {
    if (!query || query.length < 3) return [];

    try {
      console.log(`[LiberLiber-Proxy] Searching for: ${query}`);
      // Search for "Liber Liber" + query to find their editions
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}+"Liber Liber"&maxResults=5`);
      const data = await response.json();

      if (!data.items) return [];

      return data.items.map((item: any) => {
        const info = item.volumeInfo;
        return {
          id: `ll-${item.id}`,
          title: info.title,
          author: info.authors ? info.authors[0] : 'Autore Sconosciuto',
          coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://images.unsplash.com/photo-1543004218-ee14110497f8?auto=format&fit=crop&q=80&w=300',
          category: 'Classici',
          description: `Edizione di qualità curata dal Progetto Liber Liber. ${info.description ? info.description.substring(0, 150) + '...' : ''}`,
          source: 'GoogleBooks' as any, // Labeling as GoogleBooks for now but we can change the source type
          extraLabel: 'LIBER LIBER',
          externalUrl: info.infoLink
        };
      }).filter((b: any) => b.title.toLowerCase().includes(query.toLowerCase()) || b.author.toLowerCase().includes(query.toLowerCase()));
    } catch (error) {
      return [];
    }
  },

  /**
   * Combined search
   */
  unifiedSearch: async (query: string): Promise<ExternalBook[]> => {
    console.log(`[UnifiedSearch] Starting search for: ${query}`);

    // We run them in parallel but wait for Google Books first to ensure its results are ready for priority
    const [llResults, gbResults, olResults, pgResults] = await Promise.all([
      BookSearchService.searchLiberLiber(query),
      BookSearchService.searchGoogleBooks(query),
      BookSearchService.searchOpenLibrary(query),
      BookSearchService.searchGutenberg(query)
    ]);

    console.log(`[UnifiedSearch] Results - LL: ${llResults.length}, GB: ${gbResults.length}, OL: ${olResults.length}, PG: ${pgResults.length}`);

    // Priority: Liber Liber (if found), then Google Books, then others
    // We filter duplicates by ID
    const all = [...llResults, ...gbResults, ...olResults, ...pgResults];
    const seen = new Set();
    return all.filter(book => {
      const duplicate = seen.has(book.id);
      seen.add(book.id);
      return !duplicate;
    });
  }
};
