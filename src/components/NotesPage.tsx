import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Plus, X, Edit3, Loader2, Volume2, Square, Mic, MicOff, Trash2, Sparkles, BookOpen, Clock } from 'lucide-react';
import { DiaryService, DiaryNote, BookService } from '../utils/database';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function NotesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteBookId, setNoteBookId] = useState<string>('');

  // Audio/Voice state
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = React.useRef<any>(null);

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

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  React.useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, []);

  // Mutations
  const addNoteMutation = useMutation({
    mutationFn: (newNote: Omit<DiaryNote, 'id' | 'created_at'>) =>
      DiaryService.addNote(newNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      closeModal();
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<DiaryNote> }) =>
      DiaryService.updateNote(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      closeModal();
    },
  });

  const removeNoteMutation = useMutation({
    mutationFn: (noteId: string) => DiaryService.removeNote(noteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !noteTitle.trim() || !noteContent.trim()) return;

    if (editingNoteId) {
      updateNoteMutation.mutate({
        id: editingNoteId,
        updates: {
          title: noteTitle,
          content: noteContent,
          book_id: noteBookId && noteBookId.trim() !== '' ? noteBookId : undefined
        }
      });
    } else {
      addNoteMutation.mutate({
        user_id: user.id,
        title: noteTitle,
        content: noteContent,
        book_id: noteBookId && noteBookId.trim() !== '' ? noteBookId : undefined
      });
    }
  };

  const openEditModal = (note: DiaryNote) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteBookId(note.book_id || '');
    setIsAddingNote(true);
  };

  const closeModal = () => {
    setIsAddingNote(false);
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteBookId('');
    if (isListening) stopListening();
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl text-on-surface">Accedi per visualizzare le tue note</h2>
      </div>
    );
  }

  // Speech Synthesis
  const speak = (note: DiaryNote) => {
    window.speechSynthesis.cancel();

    setTimeout(() => {
      const introText = note.book
        ? `Nota associata al libro ${note.book.title}. `
        : "Pensiero libero. ";

      const fullSpeech = `${introText} Titolo: ${note.title}. Contenuto: ${note.content}`;

      const utterance = new SpeechSynthesisUtterance(fullSpeech);
      utteranceRef.current = utterance;
      utterance.rate = 1.2;
      utterance.lang = 'it-IT';

      const preferred = voices.find(v =>
        v.lang.startsWith('it') &&
        (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural')) &&
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('alice'))
      ) || voices.find(v => v.lang.startsWith('it')) || voices[0];

      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setIsSpeaking(note.id);
      utterance.onend = () => { setIsSpeaking(null); utteranceRef.current = null; };
      utterance.onerror = (err) => { console.error("TTS Note Error:", err); setIsSpeaking(null); utteranceRef.current = null; };

      window.speechSynthesis.speak(utterance);
    }, 50);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(null);
  };

  // Speech Recognition
  React.useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'it-IT';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setNoteContent(prev => prev + (prev.length > 0 ? ' ' : '') + transcript);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error("STT Error", err);
      }
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  if (isLoadingNotes) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-primary">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-serif italic">Sfogliando le tue note...</p>
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
            <FileText className="w-8 h-8 text-primary" /> Le Tue Note
          </h1>
          <p className="font-sans text-sm text-on-surface-variant/70">Il luogo dove i tuoi pensieri prendono forma tra le pagine.</p>
        </div>
        <button
          onClick={() => setIsAddingNote(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-xl font-sans font-bold text-xs uppercase shadow-md transition-all cursor-pointer hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Nuova Nota
        </button>
      </div>

      {/* Guida alle Note */}
      <div className="bg-secondary/5 border border-secondary/10 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="p-3 bg-white rounded-xl shadow-sm"><Sparkles className="w-6 h-6 text-secondary" /></div>
        <div className="flex-1 space-y-3">
          <h4 className="font-serif text-lg font-bold text-secondary">Guida alle Note del Santuario</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="flex gap-2 items-start">
                <div className="mt-1 w-1.5 h-1.5 bg-secondary rounded-full flex-shrink-0" />
                <p className="text-[11px] text-on-surface-variant leading-relaxed">**Custodire Intuizioni:** Usa le note per fissare pensieri, citazioni o riflessioni nate durante la lettura o la meditazione.</p>
             </div>
             <div className="flex gap-2 items-start">
                <div className="mt-1 w-1.5 h-1.5 bg-secondary rounded-full flex-shrink-0" />
                <p className="text-[11px] text-on-surface-variant leading-relaxed">**Connessione Libri:** Puoi legare ogni nota a un'opera specifica della tua libreria per creare un filo diretto tra te e l'autore.</p>
             </div>
             <div className="flex gap-2 items-start">
                <div className="mt-1 w-1.5 h-1.5 bg-secondary rounded-full flex-shrink-0" />
                <p className="text-[11px] text-on-surface-variant leading-relaxed">**Voce alla Mente:** Sfrutta la dettatura vocale per scrivere senza tastiera e l'ascolto sintetico per riascoltare i tuoi passi.</p>
             </div>
             <div className="flex gap-2 items-start">
                <div className="mt-1 w-1.5 h-1.5 bg-secondary rounded-full flex-shrink-0" />
                <p className="text-[11px] text-on-surface-variant leading-relaxed">**Sincronizzazione Cloud:** Ogni nota è salvata al sicuro nel tuo profilo e accessibile da qualsiasi tuo dispositivo.</p>
             </div>
          </div>
        </div>
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
              className="bg-[#fcfaf2] rounded-3xl p-6 md:p-10 shadow-lg border-l-[12px] border-secondary border border-surface-container-high/60 relative overflow-hidden book-shadow flex flex-col gap-6"
            >
              {/* Header con MetaDati */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-secondary/10 pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 text-secondary rounded-full font-sans font-bold text-[10px] uppercase tracking-widest">
                    <BookOpen className="w-3.5 h-3.5" />
                    {note.book ? note.book.title : 'Pensiero Libero'}
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant/50 font-sans font-bold text-[9px] uppercase tracking-widest px-1">
                    <Clock className="w-3 h-3" />
                    {new Date(note.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                {/* Actions distinte dai metadati */}
                <div className="flex items-center gap-1 bg-white/50 p-1 rounded-2xl border shadow-sm self-end md:self-auto">
                  <button
                    onClick={() => speak(note)}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer ${isSpeaking === note.id ? 'text-primary bg-primary/10' : 'text-on-surface-variant/60 hover:text-primary hover:bg-primary/5'}`}
                    title="Ascolta"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                  {isSpeaking === note.id && (
                    <button onClick={stopSpeaking} className="p-2.5 text-rose-500 hover:bg-rose-50 cursor-pointer rounded-xl" title="Stop"><Square className="w-5 h-5 fill-current" /></button>
                  )}
                  <button
                    onClick={() => openEditModal(note)}
                    className="p-2.5 text-on-surface-variant/60 hover:text-secondary hover:bg-secondary/5 cursor-pointer rounded-xl transition-all"
                    title="Modifica"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => { if (confirm('Eliminare questa nota?')) removeNoteMutation.mutate(note.id); }}
                    className="p-2.5 text-on-surface-variant/60 hover:text-rose-500 hover:bg-rose-50 cursor-pointer rounded-xl transition-all"
                    title="Elimina"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-serif text-2xl md:text-3xl text-on-surface font-semibold italic">{note.title}</h4>
                <div className="notebook-line text-lg md:text-xl text-on-surface-variant/90 font-serif leading-[2.8rem] md:leading-[3.2rem] italic pl-4 md:pl-6 border-l-2 border-red-200/50">
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-0 md:p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-[#fbf9f6] w-full h-full md:h-auto md:max-w-xl md:rounded-3xl p-6 md:p-10 border-t md:border border-surface-container-high relative shadow-2xl flex flex-col overflow-y-auto"
            >
              <button onClick={closeModal} className="absolute top-6 right-6 p-2 text-on-surface-variant/50 hover:text-on-surface"><X className="w-6 h-6" /></button>
              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className="font-serif text-3xl text-on-surface font-semibold flex items-center gap-2">
                    <Edit3 className="w-7 h-7 text-secondary" /> {editingNoteId ? 'Aggiorna Nota' : 'Sottoscrivi Nota'}
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

                  <div className="space-y-2 relative">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-secondary block ml-1">Riflessione</label>
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-secondary/10 text-secondary hover:bg-secondary/20'}`}
                      >
                        {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                        {isListening ? 'Ti ascolto...' : 'Dettatura Vocale'}
                      </button>
                    </div>
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
                      onClick={closeModal}
                      className="px-6 py-3 border border-surface-container-high rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-surface transition-all"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      disabled={addNoteMutation.isPending || updateNoteMutation.isPending}
                      className="px-10 py-3 bg-secondary text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-secondary/90 disabled:opacity-50 transition-all"
                    >
                      {addNoteMutation.isPending || updateNoteMutation.isPending ? 'Salvataggio...' : (editingNoteId ? 'Aggiorna' : 'Custodisci Nota')}
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
