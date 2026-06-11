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
      // Use langRestrict=it for Italian priority
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=it&maxResults=10`);
      const data = await response.json();

      if (!data.items) return [];

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
   * Combined search
   */
  unifiedSearch: async (query: string): Promise<ExternalBook[]> => {
    const [gbResults, olResults, pgResults] = await Promise.all([
      BookSearchService.searchGoogleBooks(query),
      BookSearchService.searchOpenLibrary(query),
      BookSearchService.searchGutenberg(query)
    ]);

    // Priority: Google Books (best Italian), then others
    return [...gbResults, ...olResults, ...pgResults];
  }
};
