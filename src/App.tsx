import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Heart, BookOpen, Coffee, Star, X, Sparkles, User, HelpCircle } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import SearchPage from './components/SearchPage';
import LibraryPage from './components/LibraryPage';
import ListenPage from './components/ListenPage';

import { INITIAL_BOOKS, INITIAL_AUDIO_TRACKS, INITIAL_NOTES } from './data';
import { Book, PersonalNote } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'search' | 'library' | 'listen'>('home');
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [notes, setNotes] = useState<PersonalNote[]>(INITIAL_NOTES);
  const [activeTrackId, setActiveTrackId] = useState<string>('at-1');
  const [showProfileModal, setShowProfileModal] = useState(false);

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
            onAddBook={handleAddBook}
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
        onProfileClick={() => setShowProfileModal(true)}
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

      {/* Profile/About Cozy Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#fbf9f6] max-w-md w-full rounded-2xl p-6 border border-surface-container-high/60 shadow-2xl relative"
            >
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 p-1.5 bg-surface-container/50 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-4 pt-2">
                <div className="flex justify-center">
                  <div className="p-3 bg-primary/10 text-primary rounded-full relative">
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#e08282] rounded-full" />
                    <User className="w-8 h-8" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif text-2xl text-on-surface font-semibold flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-secondary" />
                    Il Profilo di Valentina
                  </h3>
                  <p className="font-sans text-xs text-on-surface-variant/80 tracking-widest uppercase font-semibold">
                    Lettrice del Santuario
                  </p>
                </div>

                <div className="bg-[#fcfaf2] p-4 rounded-xl border border-dashed border-secondary/20 space-y-3 font-serif italic text-sm text-on-surface-variant/80 leading-relaxed text-left">
                  <p>
                    «Benvenuta nel tuo rifugio silenzioso, Vale. Qui il tempo scivola indulgente, le parole si fanno musica e i tuoi appunti personali trovano dimora su profumati fogli di carta digitale.»
                  </p>
                  <p className="text-xs font-sans text-right font-bold text-primary not-italic">
                    — Con Ammirazione, Il Curatore.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2 text-xs">
                  <div className="flex justify-between items-center bg-surface-container/40 p-2.5 rounded text-left">
                    <span className="font-sans font-semibold text-on-surface-variant">Preferiti in libreria</span>
                    <strong className="text-primary font-bold">{books.filter(b => b.status === 'Preferiti' && !b.id.startsWith('dc-')).length} opere</strong>
                  </div>
                  <div className="flex justify-between items-center bg-surface-container/40 p-2.5 rounded text-left">
                    <span className="font-sans font-semibold text-on-surface-variant">Appunti scritti nel diario</span>
                    <strong className="text-secondary font-bold">{notes.length} riflessioni</strong>
                  </div>
                </div>

                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-full mt-4 py-2.5 bg-primary text-white rounded-xl font-sans font-semibold text-xs tracking-wider uppercase hover:opacity-90 transition-all cursor-pointer shadow-sm"
                >
                  Ritorna alla Lettura
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
