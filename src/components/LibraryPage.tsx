import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Bookmark, CheckCircle2, Trash2, Edit3, Plus, X, FileText, BookOpen, Loader2, Sparkles } from 'lucide-react';
import { Book } from '../types';
import { BookService, Reading, DiaryService, DiaryNote } from '../utils/database';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AIProvider } from '../utils/aiProvider';

export default function LibraryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Book['status']>('Preferiti');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [selectedBookDetail, setSelectedBookDetail] = useState<Reading | null>(null);
  const [poeticIntro, setPoeticIntro] = useState<string | null>(null);
  const [isGeneratingIntro, setIsGeneratingIntro] = useState(false);

  // New Note form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteBookId, setNoteBookId] = useState<string>('');

  // Fetch data
  const { data: readings = [], isLoading: isLoadingReadings } = useQuery({
    queryKey: ['readings', user?.id],
    queryFn: () => BookService.getUserReadings(user!.id),
    enabled: !!user,
  });

  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ['notes', user?.id],
    queryFn: () => DiaryService.getUserNotes(user!.id),
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

  const addNoteMutation = useMutation({
    mutationFn: (newNote: Omit<DiaryNote, 'id' | 'created_at'>) =>
      DiaryService.addNote(newNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsAddingNote(false);
      setNoteTitle('');
      setNoteContent('');
      setNoteBookId('');
    },
  });

  const removeNoteMutation = useMutation({
    mutationFn: (noteId: string) => DiaryService.removeNote(noteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !noteTitle.trim() || !noteContent.trim()) return;
    addNoteMutation.mutate({
      user_id: user.id,
      title: noteTitle,
      content: noteContent,
      book_id: noteBookId || undefined
    });
  };

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

  const tabReadings = readings.filter(r => r.status === activeTab);

  if (isLoadingReadings || isLoadingNotes) {
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Scaffali */}
        <div className="lg:col-span-7 space-y-6">
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
                    <div className="flex md:flex-col items-center gap-2">
                      <div className="flex gap-1">
                        {(['Preferiti', 'Da Leggere', 'Letti'] as const).map(s => (
                           <button key={s} onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ readingId: reading.id, status: s }); }} className={`p-2 rounded-full cursor-pointer transition-colors ${reading.status === s ? 'text-primary bg-primary/5' : 'text-on-surface-variant/40 hover:text-primary'}`}>
                             {s === 'Preferiti' && <Heart className="w-4 h-4" />}
                             {s === 'Da Leggere' && <Bookmark className="w-4 h-4" />}
                             {s === 'Letti' && <CheckCircle2 className="w-4 h-4" />}
                           </button>
                        ))}
                        <button onClick={(e) => { e.stopPropagation(); if (confirm('Rimuovere dall\'archivio?')) removeReadingMutation.mutate(reading.id); }} className="p-2 text-on-surface-variant/40 hover:text-rose-500 rounded-full cursor-pointer"><Trash2 className="w-4 h-4" /></button>
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

        {/* Diario Fluido */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex justify-between items-center px-1">
            <span className="font-serif text-xl font-medium text-on-surface flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Diario del Santuario
            </span>
            <button onClick={() => setIsAddingNote(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full font-sans font-bold text-xs uppercase transition-all cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Nuovo
            </button>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {notes.map((note) => (
                <motion.div key={note.id} className="bg-[#fcfaf2] rounded-xl p-6 shadow-md border-l-[6px] border-secondary border border-surface-container-high/60 relative overflow-hidden book-shadow">
                  <button onClick={() => { if (confirm('Eliminare questo appunto?')) removeNoteMutation.mutate(note.id); }} className="absolute top-4 right-4 text-on-surface-variant/40 hover:text-rose-500 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="pt-2 space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-sans font-semibold text-secondary tracking-widest uppercase">
                        <span className="italic">{note.book ? `Libro: ${note.book.title}` : 'Pensiero Libero'}</span>
                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-serif text-lg text-on-surface font-semibold italic">{note.title}</h4>
                    </div>
                    <div className="notebook-line text-sm text-on-surface-variant/90 font-serif leading-[2.3rem] italic pl-2 border-l border-red-200/50">
                      {note.content}
                    </div>
                  </div>
                </motion.div>
              ))}
              {notes.length === 0 && (
                <div className="text-center py-10 opacity-40 italic text-sm">Nessun appunto nel diario...</div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Write Note Modal */}
      <AnimatePresence>
        {isAddingNote && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="bg-[#fbf9f6] max-w-lg w-full rounded-2xl p-6 md:p-8 border border-surface-container-high relative shadow-2xl">
              <button onClick={() => setIsAddingNote(false)} className="absolute top-4 right-4 p-1"><X className="w-4 h-4" /></button>
              <div className="space-y-6">
                <h3 className="font-serif text-2xl text-on-surface font-semibold flex items-center gap-1.5"><Edit3 className="w-5 h-5 text-secondary" /> Sottoscrivi Appunto</h3>
                <form onSubmit={handleSaveNote} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase block">Titolo</label>
                    <input type="text" required value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border rounded-xl outline-none text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase block">Collega Libro (Opzionale)</label>
                    <select value={noteBookId} onChange={(e) => setNoteBookId(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border rounded-xl outline-none text-xs">
                      <option value="">Nessun collegamento</option>
                      {readings.map(r => (
                        <option key={r.id} value={r.book?.id}>{r.book?.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase block">Riflessione</label>
                    <textarea required rows={5} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} className="w-full px-3.5 py-3 bg-white border rounded-xl outline-none font-serif text-xs italic" />
                  </div>
                  <div className="pt-4 flex justify-end gap-2">
                    <button type="submit" disabled={addNoteMutation.isPending} className="px-6 py-2 bg-secondary text-white rounded-lg font-bold text-xs uppercase disabled:opacity-50">
                      {addNoteMutation.isPending ? 'Salvataggio...' : 'Salva Appunto'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                <div className="border-t pt-5 flex justify-end">
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
