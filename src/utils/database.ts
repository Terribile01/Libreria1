import { supabase } from './supabaseClient';
import { Book } from '../types';

export interface DatabaseBook extends Book {
  // same fields
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

export const BookService = {
  // Get all books in the database
  getAllBooks: async () => {
    const { data, error } = await supabase.from('books').select('*');
    if (error) throw error;
    return data as DatabaseBook[];
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
    return data as Reading[];
  },

  // Find book by title/author to check existence
  findBook: async (title: string, author: string) => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('title', title)
      .eq('author', author)
      .maybeSingle();

    if (error) throw error;
    return data as DatabaseBook | null;
  },

  // Add book to catalog
  addBookToCatalog: async (book: Omit<Book, 'id'>) => {
    const { data, error } = await supabase
      .from('books')
      .insert([book])
      .select()
      .single();

    if (error) throw error;
    return data as DatabaseBook;
  },

  // Add reading (connect user to book)
  addReading: async (userId: string, bookId: string, status: string = 'Da Leggere', note: string = '') => {
    const { data, error } = await supabase
      .from('readings')
      .insert([{ user_id: userId, book_id: bookId, status, note }])
      .select()
      .single();

    if (error) throw error;
    return data as Reading;
  },

  // Update reading status or note
  updateReading: async (readingId: string, updates: Partial<Pick<Reading, 'status' | 'note'>>) => {
    const { data, error } = await supabase
      .from('readings')
      .update(updates)
      .eq('id', readingId)
      .select()
      .single();

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
  book?: DatabaseBook;
}

export const DiaryService = {
  // Get all user notes
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
    return data as DiaryNote[];
  },

  // Create new note
  addNote: async (note: Omit<DiaryNote, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('notes')
      .insert([note])
      .select()
      .single();

    if (error) throw error;
    return data as DiaryNote;
  },

  // Update note
  updateNote: async (noteId: string, updates: Partial<Pick<DiaryNote, 'title' | 'content' | 'book_id'>>) => {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;
    return data as DiaryNote;
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
