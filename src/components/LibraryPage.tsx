import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Bookmark, CheckCircle2, Trash2, X, BookOpen, Loader2, Sparkles, Book as BookIcon, Headphones } from 'lucide-react';
import { Book } from '../types';
import { BookService, Reading } from '../utils/database';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AIProvider } from '../utils/aiProvider';

interface LibraryPageProps {
  onPlayTrack: (book: Book) => void;
  onReadBook: (book: Book) => void;
}

export default function LibraryPage({ onPlayTrack, onReadBook }: LibraryPageProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Book['status']>('Preferiti');
  const [selectedBookDetail, setSelectedBookDetail] = useState<Reading | null>(null);
  const [poeticIntro, setPoeticIntro] = useState<string | null>(null);
  const [isGeneratingIntro, setIsGeneratingIntro] = useState(false);

  // Fetch data
  const { data: readings = [], isLoading: isLoadingReadings } = useQuery({
    queryKey: ['readings', user?.id],
    queryFn: () => BookService.getUserReadings(user!.id),
    enabled: !!user,
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ readingId, status }: { readingId: string, status: Book['status'] }) =>
      BookService.updateReading(readingId, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['readings'] }),
  });

  const removeReadingMutation = useMutation({
    mutationFn: (readingId: string) => BookService.removeReading(readingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      setSelectedBookDetail(null);
    },
  });

  const handleAskRu = async (reading: Reading) => {
    if (!reading.book) return;
    setIsGeneratingIntro(true);
    setPoeticIntro(null);
    try {
      const intro = await AIProvider.generatePoeticIntro(reading.book.title, reading.book.author);
      setPoeticIntro(intro);
    } catch (error: any) {
      setPoeticIntro(`Rù sta meditando profondamente in questo momento (${error.message}). Riprova più tardi.`);
    } finally {
      setIsGeneratingIntro(false);
    }
  };

  const handleOpenDetail = (reading: Reading) => {
    setPoeticIntro(null);
    setSelectedBookDetail(reading);
  };

  const handleReadInternal = (reading: Reading) => {
    if (!reading.book) return;

    // Prepare a complete book object for the reader
    const bookForReader: Book = {
      ...reading.book,
      sourceType: reading.source_type,
      filePath: reading.file_path,
      externalUrl: reading.external_url || (reading.book as any).external_url
    };

    onReadBook(bookForReader);
  };

  const tabReadings = readings.filter(r => r.status === activeTab);

  if (isLoadingReadings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-primary">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-serif italic">Consultando gli scaffali del Santuario...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 md:px-16 space-y-16"
    >
      <div className="space-y-2 text-center md:text-left">
        <h1 className="font-serif text-3xl md:text-4xl text-on-surface font-semibold">La Mia Libreria</h1>
        <p className="font-sans text-sm text-on-surface-variant/70">Il tuo santuario di lettura personale nel cloud.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-10 items-start">
        {/* Scaffali */}
        <div className="space-y-6">
          <div className="flex border-b border-surface-container pb-px gap-4 md:gap-8 justify-center md:justify-start">
            {([
              { key: 'Preferiti', icon: Heart, label: 'Preferiti' },
              { key: 'Da Leggere', icon: Bookmark, label: 'Da Leggere' },
              { key: 'Letti', icon: CheckCircle2, label: 'Letti' }
            ] as const).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 pb-3 font-sans font-semibold text-xs md:text-sm tracking-widest uppercase relative cursor-pointer ${isActive ? 'text-primary' : 'text-on-surface-variant/60 hover:text-primary'}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && <motion.span layoutId="activeLibraryTab" className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full" />}
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {tabReadings.length > 0 ? (
                tabReadings.map((reading) => (
                  <motion.div
                    layout
                    key={reading.id}
                    className="bg-white rounded-2xl p-5 border border-surface-container-high/40 shadow-sm flex flex-col md:flex-row gap-5 items-center justify-between cursor-pointer hover:shadow-md transition-all"
                    onClick={() => handleOpenDetail(reading)}
                  >
                    <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left flex-1">
                      <img src={reading.book?.coverUrl} alt={reading.book?.title} className="w-20 rounded-md shadow-sm aspect-[2/3] object-cover" />
                      <div className="space-y-1.5 max-w-sm">
                        <h3 className="font-serif text-lg text-on-surface font-semibold">{reading.book?.title}</h3>
                        <p className="font-sans text-xs text-on-surface-variant/80 italic">di {reading.book?.author}</p>
                      </div>
                    </div>
                    <div className="flex md:flex-col items-center gap-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); if (reading.book) onPlayTrack(reading.book); }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary rounded-xl font-sans font-bold text-[10px] uppercase hover:bg-primary hover:text-white transition-all cursor-pointer"
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        Ascolta
                      </button>

                      <div className="flex gap-1">
                        {(['Preferiti', 'Da Leggere', 'Letti'] as const).map(s => (
                           <button key={s} title={s} onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ readingId: reading.id, status: s }); }} className={`p-2 rounded-full cursor-pointer transition-colors ${reading.status === s ? 'text-primary bg-primary/5' : 'text-on-surface-variant/40 hover:text-primary'}`}>
                             {s === 'Preferiti' && <Heart className="w-4 h-4" />}
                             {s === 'Da Leggere' && <Bookmark className="w-4 h-4" />}
                             {s === 'Letti' && <CheckCircle2 className="w-4 h-4" />}
                           </button>
                        ))}
                        <button title="Elimina" onClick={(e) => { e.stopPropagation(); if (confirm('Rimuovere dall\'archivio?')) removeReadingMutation.mutate(reading.id); }} className="p-2 text-on-surface-variant/40 hover:text-rose-500 rounded-full cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="bg-white rounded-2xl py-12 px-6 border border-dashed text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-on-surface-variant/30 mx-auto" />
                  <p className="font-serif text-lg text-on-surface">Questo scaffale è vuoto</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Book Detail Modal */}
      <AnimatePresence>
        {selectedBookDetail && selectedBookDetail.book && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-surface max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl border border-surface-container-high relative max-h-[90vh] flex flex-col">
              <button onClick={() => { setSelectedBookDetail(null); setPoeticIntro(null); }} className="absolute top-4 right-4 p-2 z-10"><X className="w-4 h-4" /></button>
              <div className="overflow-y-auto p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-32 sm:w-40 flex-shrink-0 mx-auto sm:mx-0"><img src={selectedBookDetail.book.coverUrl} className="w-full rounded-lg shadow-md aspect-[2/3] object-cover" /></div>
                  <div className="flex-1 space-y-3">
                    <h3 className="font-serif text-2xl font-medium">{selectedBookDetail.book.title}</h3>
                    <p className="font-sans text-sm text-secondary italic">di {selectedBookDetail.book.author}</p>
                    <span className="inline-block px-2 py-1 bg-surface-container rounded text-xs">Stato: <strong className="text-primary">{selectedBookDetail.status}</strong></span>
                  </div>
                </div>
                <div className="border-t pt-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-serif text-base font-semibold flex items-center gap-2">Introduzione di Rù {isGeneratingIntro && <Loader2 className="w-3 h-3 animate-spin text-primary" />}</h4>
                    {!poeticIntro && !isGeneratingIntro && (
                      <button onClick={() => handleAskRu(selectedBookDetail)} className="text-[10px] font-sans font-bold text-secondary hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-widest cursor-pointer"><Sparkles className="w-3 h-3" /> Chiedi a Rù</button>
                    )}
                  </div>
                  <div className="bg-surface-container-low/40 p-4 rounded-lg border-l-4 border-primary italic text-sm text-on-surface-variant/90 min-h-[60px] flex items-center">
                    {isGeneratingIntro ? <span className="text-xs opacity-50 animate-pulse">Rù sta consultando le stelle per te...</span> : poeticIntro || selectedBookDetail.book.description}
                  </div>
                </div>
                <div className="border-t pt-5 flex flex-wrap gap-3 justify-between items-center">
                   <div className="flex gap-2">
                     <button
                       onClick={() => handleReadInternal(selectedBookDetail)}
                       className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all"
                     >
                       <BookIcon className="w-4 h-4" /> Leggi
                     </button>
                     <button
                       onClick={() => { if (selectedBookDetail.book) onPlayTrack(selectedBookDetail.book); }}
                       className="px-6 py-2.5 border border-secondary text-secondary rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-secondary/5 transition-all"
                     >
                       <Headphones className="w-4 h-4" /> Ascolta
                     </button>
                   </div>
                   <button onClick={() => { setSelectedBookDetail(null); setPoeticIntro(null); }} className="px-4 py-2 border rounded-xl text-xs font-bold uppercase">Esci</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
