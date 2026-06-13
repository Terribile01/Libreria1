import { supabase } from './supabaseClient';
import { Book } from '../types';

export interface DatabaseBook {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  category: string;
  description: string;
  created_at: string;
  file_url?: string;
  external_url?: string;
}

export interface Reading {
  id: string;
  user_id: string;
  book_id: string;
  status: 'Da Leggere' | 'Letti' | 'Preferiti';
  note: string;
  created_at: string;
  // New hybrid source fields
  source_type: 'internal' | 'external';
  file_path?: string;
  external_url?: string;
  book?: Book;
}

// Helper to map UI Book to Database Book
const mapBookToDb = (book: Partial<Book> & { file_url?: string, external_url?: string }) => {
  const mapped: any = {};
  if (book.title !== undefined) mapped.title = book.title;
  if (book.author !== undefined) mapped.author = book.author;
  if (book.coverUrl !== undefined) mapped.cover_url = book.coverUrl;
  if (book.category !== undefined) mapped.category = book.category;
  if (book.description !== undefined) mapped.description = book.description;
  if (book.file_url !== undefined) mapped.file_url = book.file_url;
  if (book.external_url !== undefined) mapped.external_url = book.external_url;
  return mapped;
};

// Helper to map DB Book to UI Book
const mapDbToBook = (dbBook: any): Book & { file_url?: string, external_url?: string } => {
  return {
    id: dbBook.id,
    title: dbBook.title,
    author: dbBook.author,
    coverUrl: dbBook.cover_url,
    category: dbBook.category,
    description: dbBook.description,
    file_url: dbBook.file_url,
    external_url: dbBook.external_url,
  };
};

export const BookService = {
  // Get all books in the database
  getAllBooks: async () => {
    const { data, error } = await supabase.from('books').select('*');
    if (error) throw error;
    return (data || []).map(mapDbToBook);
  },

  // Get user's readings (join with books)
  getUserReadings: async (userId: string) => {
    const { data, error } = await supabase
      .from('readings')
      .select(`
        *,
        book:books(*)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map((r: any) => ({
      ...r,
      book: r.book ? mapDbToBook(r.book) : undefined
    })) as Reading[];
  },

  // Find book by title/author to check existence
  findBook: async (title: string, author: string) => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('title', title)
      .eq('author', author)
      .maybeSingle(); // Correctly handles zero results

    if (error) throw error;
    return data ? mapDbToBook(data) : null;
  },

  // Add book to catalog
  addBookToCatalog: async (book: Omit<Book, 'id'> & { file_url?: string, external_url?: string }) => {
    const dbBook = mapBookToDb(book);
    const { data, error } = await supabase
      .from('books')
      .insert([dbBook])
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Errore durante l\'inserimento del libro');
    return mapDbToBook(data);
  },

  // Add reading (connect user to book)
  addReading: async (userId: string, bookId: string, status: string = 'Da Leggere', note: string = '', extra?: Partial<Pick<Reading, 'source_type' | 'file_path' | 'external_url'>>) => {
    const { data, error } = await supabase
      .from('readings')
      .insert([{
        user_id: userId,
        book_id: bookId,
        status,
        note,
        source_type: extra?.source_type || 'external',
        file_path: extra?.file_path,
        external_url: extra?.external_url
      }])
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Errore durante l\'aggiunta alla libreria');
    return data as Reading;
  },

  // Update reading status, note or hybrid fields
  updateReading: async (readingId: string, updates: Partial<Pick<Reading, 'status' | 'note' | 'source_type' | 'file_path' | 'external_url'>>) => {
    const { data, error } = await supabase
      .from('readings')
      .update(updates)
      .eq('id', readingId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data as Reading;
  },

  // Remove reading
  removeReading: async (readingId: string) => {
    const { error } = await supabase
      .from('readings')
      .delete()
      .eq('id', readingId);

    if (error) throw error;
  },

  // Storage Logic: Upload file to 'library-files' bucket
  uploadLibraryFile: async (userId: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from('library-files')
      .upload(filePath, file);

    if (error) throw error;
    return { filePath: data.path };
  },

  // Get temporary download URL for a file
  getFileUrl: async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from('library-files')
      .createSignedUrl(filePath, 3600); // URL valid for 1 hour

    if (error) throw error;
    return data.signedUrl;
  }
};

export interface DiaryNote {
  id: string;
  user_id: string;
  book_id?: string;
  title: string;
  content: string;
  created_at: string;
  book?: Book;
}

export const DiaryService = {
  // Get all user notes from the 'notes' table
  getUserNotes: async (userId: string) => {
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        book:books(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((n: any) => ({
      ...n,
      book: n.book ? mapDbToBook(n.book) : undefined
    })) as DiaryNote[];
  },

  // Create new note in 'notes' table
  addNote: async (note: Omit<DiaryNote, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('notes')
      .insert([{
        user_id: note.user_id,
        book_id: note.book_id,
        title: note.title,
        content: note.content
      }])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Update note
  updateNote: async (noteId: string, updates: Partial<Pick<DiaryNote, 'title' | 'content' | 'book_id'>>) => {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Remove note
  removeNote: async (noteId: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  }
};
