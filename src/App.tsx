import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import SearchPage from './components/SearchPage';
import LibraryPage from './components/LibraryPage';
import NotesPage from './components/NotesPage';
import ListenPage from './components/ListenPage';
import ReaderPage from './components/ReaderPage';
import PersonalPage from './components/PersonalPage';
import RuChat from './components/RuChat';

import { INITIAL_BOOKS, INITIAL_AUDIO_TRACKS } from './data';
import { Book } from './types';
import { BookService } from './utils/database';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<'home' | 'search' | 'library' | 'diary' | 'listen' | 'profile' | 'reader'>('home');
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [activeTrackId, setActiveTrackId] = useState<string>('at-1');
  const [activeReaderBookId, setActiveReaderBookId] = useState<string | null>(null);

  // Play track navigation shortcut
  const handlePlayTrackByTitle = (bookTitle: string) => {
    const matchedTrack = INITIAL_AUDIO_TRACKS.find(
      t => t.title.toLowerCase() === bookTitle.toLowerCase()
    );
    if (matchedTrack) {
      setActiveTrackId(matchedTrack.id);
    } else {
      // If no track exists, we fallback to the first one for now
      setActiveTrackId('at-1');
    }
    setCurrentPage('listen');
  };

  // Play a specific book (from Library or Search)
  const handlePlayBook = (book: Book) => {
    // Check if we have a predefined audio track for this book
    const matchedTrack = INITIAL_AUDIO_TRACKS.find(
      t => t.title.toLowerCase() === book.title.toLowerCase()
    );

    if (matchedTrack) {
      setActiveTrackId(matchedTrack.id);
    } else {
      // We are using the book's ID directly. ListenPage will handle
      // generating the virtual track from reading data if needed.
      setActiveTrackId(book.id);
    }
    setCurrentPage('listen');
  };

  // Read a specific book
  const handleReadBook = (bookId: string) => {
    setActiveReaderBookId(bookId);
    setCurrentPage('reader');
  };

  // Logic for opening Reader from Menu
  const handleOpenReaderFromMenu = async () => {
    if (!isAuthenticated || !user) {
      setCurrentPage('reader');
      return;
    }

    try {
      const readings = await BookService.getUserReadings(user.id);
      if (readings.length > 0) {
        // Find most recently updated (last read) or first one
        const lastRead = [...readings].sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at).getTime();
          const dateB = new Date(b.updated_at || b.created_at).getTime();
          return dateB - dateA;
        })[0];
        setActiveReaderBookId(lastRead.book_id);
      }
    } catch (err) {
      console.error("Error fetching readings for reader:", err);
    }
    setCurrentPage('reader');
  };

  const renderActivePage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage 
            books={books}
            onPlayTrack={handlePlayBook}
            onNavigateToLibrary={() => setCurrentPage('library')}
          />
        );
      case 'search':
        return (
          <SearchPage 
            books={books}
            onPlayTrack={handlePlayBook}
          />
        );
      case 'library':
        return (
          <LibraryPage
            onPlayTrack={handlePlayBook}
            onReadBook={handleReadBook}
          />
        );
      case 'diary':
        return (
          <NotesPage />
        );
      case 'listen':
        return (
          <ListenPage 
            tracks={INITIAL_AUDIO_TRACKS}
            activeTrackId={activeTrackId}
            setActiveTrackId={setActiveTrackId}
          />
        );
      case 'reader':
        return (
          <ReaderPage
            bookId={activeReaderBookId}
            onNavigateToLibrary={() => setCurrentPage('library')}
          />
        );
      case 'profile':
        return (
          <PersonalPage 
            onNavigateToHome={() => setCurrentPage('home')}
            onNavigateToListen={(bookId) => {
              setActiveTrackId(bookId);
              setCurrentPage('listen');
            }}
            onNavigateToLibrary={() => setCurrentPage('library')}
            onNavigateToDiary={() => setCurrentPage('diary')}
          />
        );
      default:
        return <HomePage books={books} onPlayTrack={handlePlayBook} onNavigateToLibrary={() => setCurrentPage('library')} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface selection:bg-primary-fixed/60 selection:text-primary">
      <Navbar 
        currentPage={currentPage}
        setCurrentPage={(page) => {
          if (page === 'reader') {
            handleOpenReaderFromMenu();
          } else {
            setCurrentPage(page);
          }
        }}
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
