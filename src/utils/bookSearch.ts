import { Book } from '../types';

export interface ExternalBook extends Book {
  source: 'OpenLibrary' | 'ProjectGutenberg' | 'Local';
  externalUrl?: string;
}

/**
 * Utility to search books from Open Library and Project Gutenberg
 */
export const BookSearchService = {

  /**
   * Search on Open Library
   */
  searchOpenLibrary: async (query: string): Promise<ExternalBook[]> => {
    if (!query || query.length < 3) return [];

    try {
      const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();

      return data.docs.map((doc: any) => ({
        id: `ol-${doc.key.replace('/works/', '')}`,
        title: doc.title,
        author: doc.author_name ? doc.author_name[0] : 'Autore Sconosciuto',
        coverUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
          : 'https://images.unsplash.com/photo-1543004218-ee14110497f8?auto=format&fit=crop&q=80&w=300',
        category: 'Romanzi', // Default to Romanzi for external
        description: doc.first_sentence ? doc.first_sentence[0] : `Un'opera affascinante catalogata in Open Library. ${doc.subject ? 'Tratta di: ' + doc.subject.slice(0, 3).join(', ') : ''}`,
        source: 'OpenLibrary',
        externalUrl: `https://openlibrary.org${doc.key}`
      }));
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
      const response = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(query)}`);
      const data = await response.json();

      return data.results.slice(0, 10).map((book: any) => ({
        id: `pg-${book.id}`,
        title: book.title,
        author: book.authors.length > 0 ? book.authors[0].name : 'Autore Sconosciuto',
        coverUrl: (book.formats && book.formats['image/jpeg']) || 'https://images.unsplash.com/photo-1543004218-ee14110497f8?auto=format&fit=crop&q=80&w=300',
        category: 'Classici',
        description: `Un classico immortale proveniente dal Progetto Gutenberg. Lingue disponibili: ${book.languages ? book.languages.join(', ') : 'Sconosciuta'}. Download totali: ${book.download_count}.`,
        source: 'ProjectGutenberg',
        externalUrl: (book.formats && (book.formats['text/html'] || book.formats['text/plain'])) || `https://www.gutenberg.org/ebooks/${book.id}`
      }));
    } catch (error) {
      console.error("Project Gutenberg search error:", error);
      return [];
    }
  },

  /**
   * Combined search
   */
  unifiedSearch: async (query: string): Promise<ExternalBook[]> => {
    const [olResults, pgResults] = await Promise.all([
      BookSearchService.searchOpenLibrary(query),
      BookSearchService.searchGutenberg(query)
    ]);

    return [...olResults, ...pgResults];
  }
};
