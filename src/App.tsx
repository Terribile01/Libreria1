import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import SearchPage from './components/SearchPage';
import LibraryPage from './components/LibraryPage';
import DiaryPage from './components/DiaryPage';
import ListenPage from './components/ListenPage';
import PersonalPage from './components/PersonalPage';
import RuChat from './components/RuChat';

import { INITIAL_BOOKS, INITIAL_AUDIO_TRACKS } from './data';
import { Book } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'search' | 'library' | 'diary' | 'listen' | 'profile'>('home');
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
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

  // Add Book (Still used for Home recommendations for now, but will eventually be Supabase-only)
  const handleAddBook = (newBook: Omit<Book, 'id'>) => {
    const id = `custom-${Date.now()}`;
    const bookWithId: Book = { ...newBook, id };
    setBooks(prev => [bookWithId, ...prev]);
  };

  // Update Book status
  const handleUpdateBookStatus = (bookId: string, status: Book['status']) => {
    setBooks(prev => {
      const exists = prev.some(b => b.id === bookId);
      if (!exists) {
        const fallbackCover = "https://images.unsplash.com/photo-1543004218-ee14110497f8?auto=format&fit=crop&q=80&w=300";
        const newBook: Book = {
          id: `rec-${Date.now()}`,
          title: bookId,
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
          />
        );
      case 'library':
        return (
          <LibraryPage />
        );
      case 'diary':
        return (
          <DiaryPage />
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
            notesCount={0}
          />
        );
      default:
        return <HomePage books={books} onPlayTrack={handlePlayTrackByTitle} onUpdateBookStatus={handleUpdateBookStatus} onAddBook={handleAddBook} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface selection:bg-primary-fixed/60 selection:text-primary">
      <Navbar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

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

      <Footer onNavigate={setCurrentPage} />
      <RuChat />
    </div>
  );
}
