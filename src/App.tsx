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

  const renderActivePage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage 
            books={books}
            onPlayTrack={handlePlayTrackByTitle}
            onNavigateToLibrary={() => setCurrentPage('library')}
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
            activeTrackId={activeTrackId}
            setActiveTrackId={setActiveTrackId}
          />
        );
      case 'profile':
        return (
          <PersonalPage 
            onNavigateToHome={() => setCurrentPage('home')}
          />
        );
      default:
        return <HomePage books={books} onPlayTrack={handlePlayTrackByTitle} onNavigateToLibrary={() => setCurrentPage('library')} />;
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
