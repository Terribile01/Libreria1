import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Heart, BookOpen, Coffee, Star, X, Sparkles, User, HelpCircle } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import SearchPage from './components/SearchPage';
import LibraryPage from './components/LibraryPage';
import ListenPage from './components/ListenPage';
import PersonalPage from './components/PersonalPage';
import AlfonsaChat from './components/AlfonsaChat';

import { INITIAL_BOOKS, INITIAL_AUDIO_TRACKS, INITIAL_NOTES } from './data';
import { Book, PersonalNote } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'search' | 'library' | 'listen' | 'profile'>('home');
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [notes, setNotes] = useState<PersonalNote[]>(INITIAL_NOTES);
  const [activeTrackId, setActiveTrackId] = useState<string>('at-1');

  // Play track navigation shortcut
  const handlePlayTrackByTitle = (bookTitle: string) => {
    const matchedTrack = INITIAL_AUDIO_TRACKS.find(
      t => t.title.toLowerCase() === bookTitle.toLowerCase()
    );
    if (matchedTrack) {
      setActiveTrackId(matchedTrack.id);
    } else {
      setActiveTrackId('at-1');
    }
    setCurrentPage('listen');
  };

  // Add Book
  const handleAddBook = (newBook: Omit<Book, 'id'>) => {
    const id = `custom-${Date.now()}`;
    const bookWithId: Book = { ...newBook, id };
    setBooks(prev => [bookWithId, ...prev]);
  };

  // Remove Book
  const handleRemoveBook = (bookId: string) => {
    setBooks(prev => prev.filter(b => b.id !== bookId));
  };

  // Update Book status
  const handleUpdateBookStatus = (bookId: string, status: Book['status']) => {
    setBooks(prev => {
      const exists = prev.some(b => b.id === bookId);
      if (!exists) {
        // If it's a dynamic recommendation, push it in!
        const matchedRec = INITIAL_BOOKS.find(b => b.id === bookId);
        
        // Find in Suggerimenti if not in primary books
        const recCoverPattern = bookId.toLowerCase();
        const fallbackCover = "https://lh3.googleusercontent.com/aida-public/AB6AXuCgGMy2sillD5zq2-3a-nZV7mxdkPpVrLQAFba2wxE9cQ_Hh3IgAJkC1aQat6CYwtkI66SC-lxHhA_BcbhAiJq_w06tnWsdmOB03ieJCC1PpVrLQAFba2wxE9cQ_Hh3IgAJkC1aQat6CYwtkI66SC-lxHhA_BcbhAiJq_w06tnWsdmOB03ieJCC1PfNFJXI0sDBb9sz6ajkNeSyQpePWx_IZgpqKFZELfwck5ciEhDP7Q32ZPaNShEogqJ_pGuotW4-msDkS2aW6mv3vvfUYuuIlpqzSplY-TTKmSxyWfDBOGuobEqwN-RfVdqN3FOkiUFcZc91LL87YVIHjyQmLdxqlqSFCO";
        
        const newBook: Book = {
          id: `rec-${Date.now()}`,
          title: bookId, // standard name passed
          author: "Curatore del Santuario",
          coverUrl: fallbackCover,
          category: 'Romanzi',
          description: "Opera consigliata per armonia di spirito.",
          status: status
        };
        return [newBook, ...prev];
      }

      return prev.map(book => {
        if (book.id === bookId) {
          return { ...book, status };
        }
        return book;
      });
    });
  };

  // Add diary note
  const handleAddNote = (newNote: Omit<PersonalNote, 'id'>) => {
    const id = `note-${Date.now()}`;
    setNotes(prev => [{ ...newNote, id }, ...prev]);
  };

  // Remove diary note
  const handleRemoveNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const renderActivePage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage 
            books={books}
            onPlayTrack={handlePlayTrackByTitle}
            onUpdateBookStatus={handleUpdateBookStatus}
            onAddBook={handleAddBook}
          />
        );
      case 'search':
        return (
          <SearchPage 
            books={books}
            onPlayTrack={handlePlayTrackByTitle}
            onUpdateBookStatus={handleUpdateBookStatus}
          />
        );
      case 'library':
        return (
          <LibraryPage 
            books={books}
            notes={notes}
            onUpdateBookStatus={handleUpdateBookStatus}
            onRemoveBook={handleRemoveBook}
            onAddNote={handleAddNote}
            onRemoveNote={handleRemoveNote}
          />
        );
      case 'listen':
        return (
          <ListenPage 
            tracks={INITIAL_AUDIO_TRACKS}
            activeTrackId={activeTrackId}
            setActiveTrackId={setActiveTrackId}
          />
        );
      case 'profile':
        return (
          <PersonalPage 
            onNavigateToHome={() => setCurrentPage('home')}
            booksCount={{
              total: books.length,
              favorites: books.filter(b => b.status === 'Preferiti').length,
              completed: books.filter(b => b.status === 'Letti').length,
              toRead: books.filter(b => b.status === 'Da Leggere').length,
            }}
            notesCount={notes.length}
          />
        );
      default:
        return <HomePage books={books} onPlayTrack={handlePlayTrackByTitle} onUpdateBookStatus={handleUpdateBookStatus} onAddBook={handleAddBook} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface selection:bg-primary-fixed/60 selection:text-primary">
      {/* Navbar header */}
      <Navbar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      {/* Primary viewport content */}
      <main className="flex-grow pt-8 pb-20 md:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {renderActivePage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer component */}
      <Footer onNavigate={setCurrentPage} />

      {/* Rù Chat Assistant */}
      <AlfonsaChat />
    </div>
  );

}
