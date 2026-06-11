import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Bookmark, CheckCircle2, Trash2, Edit3, Plus, X, FileText, BookOpen, Loader2 } from 'lucide-react';
import { Book } from '../types';
import { BookService, Reading } from '../utils/database';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function LibraryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Book['status']>('Preferiti');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // New Note form state (simplified, now tied to a reading/book)
  const [noteTitle, setNoteTitle] = useState('');
  const [selectedReadingId, setSelectedReadingId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');

  // Fetch readings using TanStack Query
  const { data: readings = [], isLoading } = useQuery({
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['readings'] }),
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ readingId, note }: { readingId: string, note: string }) =>
      BookService.updateReading(readingId, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      setIsAddingNote(false);
      setNoteContent('');
      setSelectedReadingId(null);
    },
  });

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReadingId || !noteContent.trim()) return;
    updateNoteMutation.mutate({ readingId: selectedReadingId, note: noteContent });
  };

  const tabReadings = readings.filter(r => r.status === activeTab);

  if (isLoading) {
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
                    className="bg-white rounded-2xl p-5 border border-surface-container-high/40 shadow-sm flex flex-col md:flex-row gap-5 items-center justify-between"
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
                           <button key={s} onClick={() => updateStatusMutation.mutate({ readingId: reading.id, status: s })} className={`p-2 rounded-full cursor-pointer transition-colors ${reading.status === s ? 'text-primary bg-primary/5' : 'text-on-surface-variant/40 hover:text-primary'}`}>
                             {s === 'Preferiti' && <Heart className="w-4 h-4" />}
                             {s === 'Da Leggere' && <Bookmark className="w-4 h-4" />}
                             {s === 'Letti' && <CheckCircle2 className="w-4 h-4" />}
                           </button>
                        ))}
                        <button onClick={() => removeReadingMutation.mutate(reading.id)} className="p-2 text-on-surface-variant/40 hover:text-rose-500 rounded-full cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <button onClick={() => { setSelectedReadingId(reading.id); setNoteContent(reading.note || ''); setIsAddingNote(true); }} className="text-[10px] font-sans font-bold uppercase tracking-widest text-secondary hover:underline cursor-pointer flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> Note
                      </button>
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

        <div className="lg:col-span-5 space-y-6">
          <span className="font-serif text-xl font-medium text-on-surface flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Diario di Lettura</span>
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {readings.filter(r => r.note).map((reading) => (
                <motion.div key={reading.id} className="bg-[#fcfaf2] rounded-xl p-6 shadow-md border-l-[6px] border-secondary border border-surface-container-high/60 relative overflow-hidden book-shadow">
                  <div className="pt-2 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-sans font-semibold text-secondary tracking-widest uppercase">
                      <span className="italic">Libro: {reading.book?.title}</span>
                      <span>{new Date(reading.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="notebook-line text-sm text-on-surface-variant/90 font-serif leading-[2.3rem] italic pl-2 border-l border-red-200/50">
                      {reading.note}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAddingNote && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="bg-[#fbf9f6] max-w-lg w-full rounded-2xl p-6 md:p-8 border border-surface-container-high relative shadow-2xl">
              <button onClick={() => setIsAddingNote(false)} className="absolute top-4 right-4"><X className="w-4 h-4" /></button>
              <form onSubmit={handleSaveNote} className="space-y-4">
                <h3 className="font-serif text-2xl font-semibold flex items-center gap-1.5"><Edit3 className="w-5 h-5 text-secondary" /> Modifica Appunto</h3>
                <textarea required rows={5} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} className="w-full px-3.5 py-3 bg-white border rounded-xl outline-none font-serif text-xs leading-relaxed italic" />
                <div className="pt-4 flex justify-end gap-2 text-xs">
                   <button type="submit" disabled={updateNoteMutation.isPending} className="px-6 py-2 bg-secondary text-white rounded-lg font-semibold hover:opacity-95 disabled:opacity-50">
                     {updateNoteMutation.isPending ? 'Salvataggio...' : 'Salva Nota'}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
