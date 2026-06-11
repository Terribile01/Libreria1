import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Plus, X, Edit3, Loader2 } from 'lucide-react';
import { DiaryService, DiaryNote, BookService } from '../utils/database';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function DiaryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddingNote, setIsAddingNote] = useState(false);

  // New Note form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteBookId, setNoteBookId] = useState<string>('');

  // Fetch data
  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ['notes', user?.id],
    queryFn: () => DiaryService.getUserNotes(user!.id),
    enabled: !!user,
  });

  const { data: readings = [] } = useQuery({
    queryKey: ['readings', user?.id],
    queryFn: () => BookService.getUserReadings(user!.id),
    enabled: !!user,
  });

  // Mutations
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

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl text-on-surface">Accedi per visualizzare il tuo diario</h2>
      </div>
    );
  }

  if (isLoadingNotes) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-primary">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-serif italic">Sfogliando le pagine del tuo diario...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-4 md:px-16 space-y-8"
    >
      <div className="flex justify-between items-center px-1">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl md:text-4xl text-on-surface font-semibold flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" /> Diario del Santuario
          </h1>
          <p className="font-sans text-sm text-on-surface-variant/70">Il luogo dove i tuoi pensieri prendono forma tra le pagine.</p>
        </div>
        <button
          onClick={() => setIsAddingNote(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-xl font-sans font-bold text-xs uppercase shadow-md transition-all cursor-pointer hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Nuovo Appunto
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 pb-20">
        <AnimatePresence mode="popLayout">
          {notes.map((note) => (
            <motion.div
              key={note.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#fcfaf2] rounded-2xl p-8 shadow-lg border-l-[8px] border-secondary border border-surface-container-high/60 relative overflow-hidden book-shadow"
            >
              <button
                onClick={() => { if (confirm('Eliminare questo appunto?')) removeNoteMutation.mutate(note.id); }}
                className="absolute top-6 right-6 text-on-surface-variant/40 hover:text-rose-500 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="pt-2 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-sans font-bold text-secondary tracking-widest uppercase">
                    <span className="italic bg-secondary/5 px-2 py-0.5 rounded">{note.book ? `Libro: ${note.book.title}` : 'Pensiero Libero'}</span>
                    <span>{new Date(note.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <h4 className="font-serif text-2xl text-on-surface font-semibold italic">{note.title}</h4>
                </div>
                <div className="notebook-line text-lg text-on-surface-variant/90 font-serif leading-[2.8rem] italic pl-4 border-l-2 border-red-200/50">
                  {note.content}
                </div>
              </div>
            </motion.div>
          ))}
          {notes.length === 0 && (
            <div className="bg-white/50 rounded-3xl py-20 px-6 border-2 border-dashed border-surface-container-high text-center space-y-4">
              <FileText className="w-12 h-12 text-on-surface-variant/20 mx-auto" />
              <div className="space-y-1">
                <p className="font-serif text-xl text-on-surface-variant/60">Ancora nessuna riflessione...</p>
                <p className="text-sm text-on-surface-variant/40">Inizia a scrivere il tuo primo appunto cliccando sul tasto in alto.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Write Note Modal */}
      <AnimatePresence>
        {isAddingNote && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[#fbf9f6] max-w-2xl w-full rounded-2xl p-6 md:p-10 border border-surface-container-high relative shadow-2xl"
            >
              <button onClick={() => setIsAddingNote(false)} className="absolute top-6 right-6 p-2 text-on-surface-variant/50 hover:text-on-surface"><X className="w-6 h-6" /></button>
              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className="font-serif text-3xl text-on-surface font-semibold flex items-center gap-2">
                    <Edit3 className="w-7 h-7 text-secondary" /> Sottoscrivi Appunto
                  </h3>
                  <p className="text-sm text-on-surface-variant/70 italic">Lascia che la penna del cuore scorra sulla carta digitale del Santuario.</p>
                </div>

                <form onSubmit={handleSaveNote} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block ml-1">Titolo del Pensiero</label>
                    <input
                      type="text"
                      required
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-surface-container-high rounded-xl outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-serif text-lg"
                      placeholder="Un momento di quiete..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block ml-1">Collega ad un Libro (Opzionale)</label>
                    <select
                      value={noteBookId}
                      onChange={(e) => setNoteBookId(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-surface-container-high rounded-xl outline-none focus:ring-2 focus:ring-secondary/20 transition-all text-sm"
                    >
                      <option value="">Nessun collegamento</option>
                      {readings.map(r => (
                        <option key={r.id} value={r.book?.id}>{r.book?.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block ml-1">Riflessione</label>
                    <textarea
                      required
                      rows={8}
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="w-full px-4 py-4 bg-white border border-surface-container-high rounded-xl outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-serif text-base italic leading-relaxed"
                      placeholder="Cosa sussurra la tua anima oggi?"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAddingNote(false)}
                      className="px-6 py-3 border border-surface-container-high rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-surface transition-all"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      disabled={addNoteMutation.isPending}
                      className="px-10 py-3 bg-secondary text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-secondary/90 disabled:opacity-50 transition-all"
                    >
                      {addNoteMutation.isPending ? 'Salvataggio...' : 'Custodisci Appunto'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
