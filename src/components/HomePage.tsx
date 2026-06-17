import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles, Mail, CheckCircle2, Bookmark, Heart, Headset, X, ArrowRight, Loader2 } from 'lucide-react';
import { Book } from '../types';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookService } from '../utils/database';

interface HomePageProps {
  books: Book[];
  onPlayTrack: (book: Book) => void;
  onNavigateToLibrary: () => void;
}

export default function HomePage({ books, onPlayTrack, onNavigateToLibrary }: HomePageProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Hero Book
  const heroBook: Book = {
    id: 'hero-1',
    title: 'Le Sottili Trame del Silenzio',
    author: 'Elena Marini',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSjp5S7cd6dh-SWWfR2_guQ_Zt2OAMk1xFeV9CS9TQbRiRt6RlqxjIga_JK96kC7N4M-9fAX9n4Sg_gOCHa-XAEAqaJuF82ps5ekmi9vu9jfd8JuaH_OGBa12rMHjsAiHFyYi7FzBHTKUI9lUvB4PYbiVsRH9740N487MV-PdOl6Pd0Miu6PQa1m0n7rnio2z7Ij7mlE41K1NiCs5UgoCV6WcF6bXFXh_KkLqyZ2BzcpHwmazF-coLjHleaw6wkMUPyoSJW2lQsXAt',
    category: 'Romanzi',
    description: 'Un\'esplorazione delicata e profonda degli spazi non detti tra le persone. Ambientato in un villaggio remoto delle Alpi, Marini dipinge un ritratto commovente della solitudine scelta come rifugio e della bellezza che si trova nell\'osservazione quieta del mondo.',
    status: 'Da Leggere'
  };

  // Curated list "Dolci Consigli"
  const curatedBooks = books.filter(b => b.id.startsWith('dc-'));

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
      }, 3000);
    }
  };

  const openBookDetails = (book: Book) => {
    setSelectedBook(book);
  };

  const closeBookDetails = () => {
    setSelectedBook(null);
  };

  // Fetch user readings for "Bentornata" section
  const { data: readings = [], isLoading: isLoadingReadings } = useQuery({
    queryKey: ['readings', user?.id],
    queryFn: () => BookService.getUserReadings(user!.id),
    enabled: !!user,
  });

  // Mutation for quick status updates from modal
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookId, status }: { bookId: string, status: Book['status'] }) => {
      // Find if already in readings
      const existing = readings.find(r => r.book_id === bookId);
      if (existing) {
        return BookService.updateReading(existing.id, { status });
      } else {
        return BookService.addReading(user!.id, bookId, status);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
    },
  });

  const handleAction = (status: Book['status']) => {
    if (selectedBook && user) {
      updateStatusMutation.mutate({ bookId: selectedBook.id, status });
      setSelectedBook(prev => prev ? { ...prev, status } : null);
    } else if (!user) {
      alert("Accedi per salvare i libri nella tua libreria.");
    }
  };

  const currentReadings = readings.filter(r => r.status === 'Da Leggere').slice(0, 3);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="space-y-16 px-4 md:px-16"
    >
      {/* Bentornata Section (Only for Auth Users) */}
      {user && (
        <section className="max-w-7xl mx-auto pt-8">
          <div className="bg-primary/5 rounded-3xl p-6 md:p-10 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="font-serif text-3xl text-on-surface">Bentornata, <span className="text-primary font-semibold">{profile?.username || 'Lettore'}</span></h2>
              <p className="font-sans text-sm text-on-surface-variant/70 italic">Cosa sussurra la tua anima oggi tra queste pagine?</p>
            </div>

            <div className="flex-1 flex gap-4 overflow-x-auto pb-2 justify-center md:justify-end w-full">
              {isLoadingReadings ? (
                <div className="flex items-center gap-2 text-primary/50 py-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">Caricamento...</span>
                </div>
              ) : currentReadings.length > 0 ? (
                currentReadings.map(r => (
                  <motion.div
                    key={r.id}
                    whileHover={{ y: -5 }}
                    className="flex-shrink-0 w-24 cursor-pointer"
                    onClick={() => r.book && openBookDetails(r.book)}
                  >
                    <img src={r.book?.coverUrl} className="w-full aspect-[2/3] object-cover rounded-lg shadow-sm mb-2" />
                    <p className="text-[10px] font-bold text-center truncate px-1 uppercase tracking-tighter text-on-surface-variant">{r.book?.title}</p>
                  </motion.div>
                ))
              ) : (
                <div className="text-xs text-on-surface-variant/40 italic flex items-center gap-2 border border-dashed border-primary/20 px-6 py-4 rounded-2xl">
                   Inizia la tua prossima avventura nella sezione ricerca.
                </div>
              )}
              {readings.length > 0 && (
                <button
                  onClick={onNavigateToLibrary}
                  className="flex-shrink-0 w-24 aspect-[2/3] bg-white rounded-lg border border-primary/20 flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary hover:text-white transition-all cursor-pointer group"
                >
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Libreria</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Hero: Libro del Giorno */}
      <section className="py-8 md:py-16 max-w-7xl mx-auto overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Animated Cover art column */}
          <div className="w-full lg:w-1/2 flex justify-center relative">
            <motion.div 
              initial={{ rotate: -5, scale: 0.95 }}
              animate={{ rotate: -2, scale: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              whileHover={{ rotate: 0, scale: 1.03 }}
              className="relative z-10 cursor-pointer"
              onClick={() => openBookDetails(heroBook)}
            >
              <img 
                src={heroBook.coverUrl} 
                alt="Libro del Giorno" 
                className="w-full max-w-[340px] md:max-w-[380px] rounded-lg book-shadow object-cover transition-transform duration-500"
              />
            </motion.div>
            {/* Soft Ambient shadow-blur background item */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-primary-fixed/40 rounded-full blur-[90px] -z-10" />
          </div>

          {/* Core metadata text column */}
          <div className="w-full lg:w-1/2 space-y-6">
            <div className="space-y-2">
              <span className="flex items-center gap-2 font-sans font-semibold text-xs tracking-widest text-primary-container uppercase">
                <Sparkles className="w-3.5 h-3.5 text-primary-container" />
                Libro del Giorno
              </span>
              <h1 className="font-serif text-4xl md:text-5xl text-on-surface leading-tight font-medium">
                {heroBook.title}
              </h1>
              <p className="font-sans font-semibold text-sm text-secondary italic tracking-wider">
                di {heroBook.author}
              </p>
            </div>

            <p className="font-sans text-base md:text-lg text-on-surface-variant/80 leading-relaxed max-w-xl">
              {heroBook.description}
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button 
                onClick={() => {
                  onPlayTrack(heroBook);
                }}
                className="px-8 py-3.5 bg-primary text-white rounded-full font-sans font-semibold text-sm tracking-wider uppercase hover:opacity-90 shadow-md transform active:scale-98 transition-all cursor-pointer flex items-center gap-2"
              >
                <Headset className="w-4 h-4" />
                Ascolta Audio
              </button>
              <button 
                onClick={() => openBookDetails(heroBook)}
                className="px-8 py-3.5 border border-secondary text-secondary rounded-full font-sans font-semibold text-sm tracking-wider uppercase hover:bg-secondary/5 transition-all duration-300 cursor-pointer"
              >
                Apri Estratto
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Dolci Consigli (Curated Grid) */}
      <section className="bg-surface-container-low/60 rounded-3xl py-12 md:py-20 px-6 md:px-12 max-w-7xl mx-auto player-shadow border border-surface-container/20">
        <div className="text-center mb-12 md:mb-16 space-y-2">
          <h2 className="font-serif text-3xl md:text-4xl text-on-surface font-medium">
            Dolci Consigli
          </h2>
          <p className="font-sans text-sm md:text-base text-on-surface-variant/80 max-w-2xl mx-auto leading-relaxed">
            Una selezione accurata di opere che nutrono l'anima, scelte per la loro capacità di trasportare il lettore in mondi di calma e riflessione.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {curatedBooks.map((book, index) => (
            <motion.div 
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              onClick={() => openBookDetails(book)}
              className="group cursor-pointer flex flex-col items-center"
            >
              <div className="w-full aspect-[3/4] overflow-hidden rounded-xl bg-white mb-4 shadow-sm group-hover:shadow-lg transition-all duration-500 transform group-hover:-translate-y-2">
                <img 
                  src={book.coverUrl} 
                  alt={book.title} 
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-sans font-semibold text-base text-on-surface group-hover:text-primary transition-colors duration-300 line-clamp-1 px-1">
                  {book.title}
                </h3>
                <p className="font-sans text-sm text-on-surface-variant/70 italic">
                  {book.author}
                </p>
                <div className="pt-1">
                  <span className="inline-block px-3 py-0.5 bg-surface-container text-tertiary font-sans font-semibold text-[10px] tracking-widest uppercase rounded-full">
                    {book.category}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Newsletter / Invitation */}
      <section className="py-12 max-w-4xl mx-auto text-center">
        <div className="bg-surface-container-high/45 rounded-3xl p-8 md:p-12 space-y-6 shadow-sm border border-outline-variant/15 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/5 rounded-full blur-2xl flex items-center justify-center" />
          
          <div className="flex justify-center">
            <span className="p-3 bg-surface rounded-full text-primary shadow-sm">
              <BookOpen className="w-7 h-7" />
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl md:text-3xl text-on-surface font-medium">
              Unisciti al Santuario
            </h2>
            <p className="font-sans text-sm text-on-surface-variant/80 max-w-md mx-auto leading-relaxed">
              Iscriviti per ricevere una lettera settimanale con consigli di lettura, pensieri sulla vita contemplativa e aggiornamenti sul nostro rifugio silenzioso.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!subscribed ? (
              <motion.form 
                onSubmit={handleSubscribe}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-4"
              >
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="La tua email..."
                  required
                  className="flex-1 px-5 py-3 rounded-full bg-surface-bright border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40 placeholder:italic font-sans text-sm"
                />
                <button 
                  type="submit"
                  className="px-8 py-3 bg-primary text-white rounded-full font-sans font-semibold text-sm tracking-wider uppercase hover:opacity-90 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Sottoscrivi
                </button>
              </motion.form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2 text-primary pt-6"
              >
                <CheckCircle2 className="w-10 h-10 stroke-[2.5px]" />
                <p className="font-sans font-semibold text-base">Benvenuta nel Santuario!</p>
                <p className="font-sans text-xs text-on-surface-variant/70">Ti invieremo presto la nostra prima lettera poetica.</p>
                <button 
                  onClick={() => setSubscribed(false)}
                  className="text-xs text-secondary hover:underline font-semibold mt-2 cursor-pointer"
                >
                  Iscrivi un'altra email
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Book Detailed Excerpt Modal */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface max-w-2xl w-full rounded-2xl overflow-hidden player-shadow border border-surface-container-high relative max-h-[90vh] flex flex-col"
            >
              <button 
                onClick={closeBookDetails}
                className="absolute top-4 right-4 p-2 bg-surface-container/50 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-on-surface transition-all cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="overflow-y-auto p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Image */}
                  <div className="w-32 sm:w-40 flex-shrink-0 mx-auto sm:mx-0">
                    <img 
                      src={selectedBook.coverUrl} 
                      alt={selectedBook.title} 
                      className="w-full rounded-lg shadow-md object-cover aspect-[2/3]"
                    />
                  </div>
                  {/* Metadata */}
                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 bg-primary-fixed text-on-primary-fixed-variant font-sans font-semibold text-[10px] tracking-widest uppercase rounded">
                        {selectedBook.category}
                      </span>
                      <h3 className="font-serif text-2xl text-on-surface font-medium">
                        {selectedBook.title}
                      </h3>
                      <p className="font-sans text-sm text-secondary italic">
                        {selectedBook.author}
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1 text-xs">
                      <span className="px-2 py-1 bg-surface-container rounded text-on-surface-variant/80">
                        Status: <strong className="text-primary">{selectedBook.status || 'Da Leggere'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-surface-container-high pt-5 space-y-4">
                  <h4 className="font-serif text-base text-on-surface font-semibold">Trama & Estratto</h4>
                  <p className="font-sans text-sm text-on-surface-variant/80 leading-relaxed italic">
                    {selectedBook.description}
                  </p>
                  
                  {/* Beautiful Simulated Excerpt for deeper literary magic! */}
                  <div className="bg-surface-container-low/40 p-4 rounded-lg border border-surface-container/30 font-sans text-sm text-on-surface-variant/90 leading-relaxed italic border-l-4 border-primary">
                    «...la stanza conservava il silenzio delle prime ore del mattino. Tra le scaffalature in legno di larice, i piccoli respiri del chiaroscuro tracciavano un cammino trasparente. Lei guardò fuori dalla finestra: le cime stavano svelando il loro segreto d'argento alla notte appena trascorsa...»
                  </div>
                </div>

                {/* Status Toggle & Library controls */}
                <div className="border-t border-surface-container-high pt-5 flex flex-wrap gap-2 justify-between items-center text-sm">
                  <span className="text-xs text-on-surface-variant/60 font-semibold">Gestisci nella Tua Libreria:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleAction('Preferiti')}
                      className={`px-3 py-1.5 rounded-full flex items-center gap-1 cursor-pointer transition-all ${
                        selectedBook.status === 'Preferiti' 
                          ? 'bg-secondary text-white font-semibold' 
                          : 'bg-white hover:bg-surface-container text-on-surface-variant border border-surface-container-high'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      Preferiti
                    </button>
                    <button
                      onClick={() => handleAction('Da Leggere')}
                      className={`px-3 py-1.5 rounded-full flex items-center gap-1 cursor-pointer transition-all ${
                        selectedBook.status === 'Da Leggere' 
                          ? 'bg-primary text-white font-semibold' 
                          : 'bg-white hover:bg-surface-container text-on-surface-variant border border-surface-container-high'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      Da Leggere
                    </button>
                    <button
                      onClick={() => handleAction('Letti')}
                      className={`px-3 py-1.5 rounded-full flex items-center gap-1 cursor-pointer transition-all ${
                        selectedBook.status === 'Letti' 
                          ? 'bg-on-primary-fixed-variant text-white font-semibold' 
                          : 'bg-white hover:bg-surface-container text-on-surface-variant border border-surface-container-high'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Letti
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
