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
}

export interface Reading {
  id: string;
  user_id: string;
  book_id: string;
  status: 'Da Leggere' | 'Letti' | 'Preferiti';
  note: string;
  created_at: string;
  book?: DatabaseBook;
}

// Helper to map UI Book to Database Book
const mapBookToDb = (book: Partial<Book>) => {
  const mapped: any = {};
  if (book.title !== undefined) mapped.title = book.title;
  if (book.author !== undefined) mapped.author = book.author;
  if (book.coverUrl !== undefined) mapped.cover_url = book.coverUrl;
  if (book.category !== undefined) mapped.category = book.category;
  if (book.description !== undefined) mapped.description = book.description;
  return mapped;
};

// Helper to map DB Book to UI Book
const mapDbToBook = (dbBook: any): Book => {
  return {
    id: dbBook.id,
    title: dbBook.title,
    author: dbBook.author,
    coverUrl: dbBook.cover_url,
    category: dbBook.category,
    description: dbBook.description,
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
  addBookToCatalog: async (book: Omit<Book, 'id'>) => {
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
  addReading: async (userId: string, bookId: string, status: string = 'Da Leggere', note: string = '') => {
    const { data, error } = await supabase
      .from('readings')
      .insert([{ user_id: userId, book_id: bookId, status, note }])
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Errore durante l\'aggiunta alla libreria');
    return data as Reading;
  },

  // Update reading status or note
  updateReading: async (readingId: string, updates: Partial<Pick<Reading, 'status' | 'note'>>) => {
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
  // Get all user notes (mapped to readings table per user request)
  getUserNotes: async (userId: string) => {
    const { data, error } = await supabase
      .from('readings') // Changed from 'notes' to 'readings'
      .select(`
        *,
        book:books(*)
      `)
      .eq('user_id', userId)
      .not('note', 'is', null) // Filter for records that have notes
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map reading.note to the DiaryNote structure if needed, or just return them
    // For now, aligning with the existing UI expectations by mapping note to content
    return (data || []).map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      book_id: r.book_id,
      title: r.book?.title ? `Riflessione su ${r.book.title}` : 'Appunto Personale',
      content: r.note || '',
      created_at: r.created_at,
      book: r.book ? mapDbToBook(r.book) : undefined
    })) as DiaryNote[];
  },

  // Create new note (mapped to update or insert in readings table)
  addNote: async (note: Omit<DiaryNote, 'id' | 'created_at'>) => {
    // Check if a reading already exists for this user and book
    if (note.book_id) {
      const { data: existing } = await supabase
        .from('readings')
        .select('id')
        .eq('user_id', note.user_id)
        .eq('book_id', note.book_id)
        .maybeSingle();

      if (existing) {
        // Update existing reading with the note
        const { data, error } = await supabase
          .from('readings')
          .update({ note: note.content })
          .eq('id', existing.id)
          .select()
          .maybeSingle();

        if (error) throw error;
        return data;
      }
    }

    // If no book_id or no existing reading, we might need to create one
    // But readings requires a book_id. This is a logic constraint of using 'readings' for 'notes'.
    // We'll assume the user wants notes tied to readings.
    const { data, error } = await supabase
      .from('readings')
      .insert([{
        user_id: note.user_id,
        book_id: note.book_id,
        note: note.content,
        status: 'Da Leggere'
      }])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Update note
  updateNote: async (noteId: string, updates: Partial<Pick<DiaryNote, 'title' | 'content' | 'book_id'>>) => {
    const dbUpdates: any = {};
    if (updates.content !== undefined) dbUpdates.note = updates.content;
    if (updates.book_id !== undefined) dbUpdates.book_id = updates.book_id;

    const { data, error } = await supabase
      .from('readings')
      .update(dbUpdates)
      .eq('id', noteId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Remove note (actually clears the note field in readings)
  removeNote: async (noteId: string) => {
    const { error } = await supabase
      .from('readings')
      .update({ note: null })
      .eq('id', noteId);

    if (error) throw error;
  }
};
