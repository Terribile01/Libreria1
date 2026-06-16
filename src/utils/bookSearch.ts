import { Book } from '../types';
import { ApiKeyManager } from './apiKeys';

export interface ExternalBook extends Book {
  source: 'OpenLibrary' | 'ProjectGutenberg' | 'GoogleBooks' | 'Local' | 'InternetArchive';
  externalUrl?: string;
}

/**
 * Utility to search books from Open Library, Project Gutenberg and Google Books
 */
export const BookSearchService = {

  /**
   * Search on Open Library (Used for metadata enrichment)
   */
  searchOpenLibrary: async (query: string): Promise<ExternalBook[]> => {
    if (!query || query.length < 3) return [];

    try {
      const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();

      return data.docs.map((doc: any) => ({
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
    } catch (error) {
      console.error("OpenLibrary search error:", error);
      return [];
    }
  },

  /**
   * Search on Internet Archive
   */
  searchInternetArchive: async (query: string): Promise<ExternalBook[]> => {
    if (!query || query.length < 3) return [];

    try {
      // Search for books with full text available
      const response = await fetch(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+mediatype:texts&fl[]=identifier,title,creator,description,subject&rows=10&output=json`);
      const data = await response.json();

      if (!data.response || !data.response.docs) return [];

      return data.response.docs.map((doc: any) => ({
        id: `ia-${doc.identifier}`,
        title: doc.title,
        author: doc.creator ? (Array.isArray(doc.creator) ? doc.creator[0] : doc.creator) : 'Autore Sconosciuto',
        coverUrl: `https://archive.org/services/img/${doc.identifier}`,
        category: 'Classici',
        description: doc.description ? (Array.isArray(doc.description) ? doc.description[0].substring(0, 200) : doc.description.substring(0, 200)) : 'Documento storico dall\'Internet Archive.',
        source: 'InternetArchive' as const,
        externalUrl: `https://archive.org/details/${doc.identifier}`
      }));
    } catch (error) {
      console.error("Internet Archive search error:", error);
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
        description: `Un classico immortale proveniente dal Progetto Gutenberg. Lingue: ${book.languages ? book.languages.join(', ') : 'Sconosciuta'}.`,
        source: 'ProjectGutenberg' as const,
        externalUrl: (book.formats && (book.formats['text/html'] || book.formats['text/plain'])) || `https://www.gutenberg.org/ebooks/${book.id}`
      }));
    } catch (error) {
      console.error("Project Gutenberg search error:", error);
      return [];
    }
  },

  /**
   * Search on Google Books (General Fallback)
   */
  searchGoogleBooks: async (query: string): Promise<ExternalBook[]> => {
    if (!query || query.length < 3) return [];

    try {
      console.log(`[GoogleBooks] Searching for: ${query}`);
      const apiKey = ApiKeyManager.get('GOOGLE_BOOKS_API_KEY');
      const keyQuery = apiKey ? `&key=${apiKey}` : '';

      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=15${keyQuery}`);
      const data = await response.json();

      if (!data.items) return [];

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
   * We search specifically for publishers or terms related to Liber Liber
   */
  searchLiberLiber: async (query: string): Promise<ExternalBook[]> => {
    if (!query || query.length < 3) return [];

    try {
      console.log(`[LiberLiber-Proxy] Searching for: ${query}`);
      const apiKey = ApiKeyManager.get('GOOGLE_BOOKS_API_KEY');
      const keyQuery = apiKey ? `&key=${apiKey}` : '';

      // Try searching with inpublisher: "Liber Liber" or just as a keyword
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}+inpublisher:"Liber Liber"&maxResults=10${keyQuery}`);
      const data = await response.json();

      let items = data.items || [];

      // Fallback if inpublisher is too strict
      if (items.length === 0) {
        const fallbackResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}+"Liber Liber"&maxResults=10${keyQuery}`);
        const fallbackData = await fallbackResponse.json();
        items = fallbackData.items || [];
      }

      return items.map((item: any) => {
        const info = item.volumeInfo;
        return {
          id: `ll-${item.id}`,
          title: info.title,
          author: info.authors ? info.authors[0] : 'Autore Sconosciuto',
          coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || 'https://images.unsplash.com/photo-1543004218-ee14110497f8?auto=format&fit=crop&q=80&w=300',
          category: 'Classici',
          description: `Edizione digitale curata dal Progetto Liber Liber (ODV). ${info.description ? info.description.substring(0, 150) + '...' : 'Un classico reso accessibile grazie a Liber Liber.'}`,
          source: 'GoogleBooks' as any,
          extraLabel: 'LIBER LIBER',
          externalUrl: info.infoLink
        };
      });
    } catch (error) {
      console.error("Liber Liber search error:", error);
      return [];
    }
  },

  /**
   * Combined search - Enhanced hierarchy and metadata enrichment
   */
  unifiedSearch: async (query: string): Promise<ExternalBook[]> => {
    console.log(`[UnifiedSearch] Starting search for: ${query}`);

    const searchPromises = [
      BookSearchService.searchLiberLiber(query).catch(e => { console.error("LL Error", e); return []; }),
      BookSearchService.searchInternetArchive(query).catch(e => { console.error("IA Error", e); return []; }),
      BookSearchService.searchGutenberg(query).catch(e => { console.error("PG Error", e); return []; }),
      BookSearchService.searchGoogleBooks(query).catch(e => { console.error("GB Error", e); return []; }),
      BookSearchService.searchOpenLibrary(query).catch(e => { console.error("OL Error", e); return []; })
    ];

    const resultsArray = await Promise.all(searchPromises);
    const [llResults, iaResults, pgResults, gbResults, olResults] = resultsArray;

    console.log(`[UnifiedSearch] Results - LL: ${llResults.length}, IA: ${iaResults.length}, PG: ${pgResults.length}, GB: ${gbResults.length}, OL: ${olResults.length}`);

    // Hierarchy: Liber Liber > IA > PG > Google (Fallback)
    const primaryResults = [...llResults, ...iaResults, ...pgResults, ...gbResults];

    // Filter duplicates
    const seen = new Set();
    const uniqueResults = primaryResults.filter(book => {
      const key = `${book.title.toLowerCase().trim()}|${book.author.toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Enrichment: Use OpenLibrary to fill missing descriptions in uniqueResults
    const finalResults = uniqueResults.map(book => {
      if (book.description && book.description.length > 50) return book;

      const enrichment = olResults.find(ol =>
        ol.title.toLowerCase().includes(book.title.toLowerCase().substring(0, 10))
      );

      if (enrichment && enrichment.description) {
        return { ...book, description: enrichment.description };
      }
      return book;
    });

    return finalResults;
  }
};
