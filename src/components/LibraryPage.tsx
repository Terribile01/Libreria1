import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Bookmark, CheckCircle2, RotateCw, Trash2, Edit3, Plus, X, Tag, FileText, Sparkles, BookOpen } from 'lucide-react';
import { Book, PersonalNote } from '../types';

interface LibraryPageProps {
  books: Book[];
  notes: PersonalNote[];
  onUpdateBookStatus: (bookId: string, status: Book['status']) => void;
  onRemoveBook: (bookId: string) => void;
  onAddNote: (note: Omit<PersonalNote, 'id'>) => void;
  onRemoveNote: (noteId: string) => void;
}

export default function LibraryPage({
  books,
  notes,
  onUpdateBookStatus,
  onRemoveBook,
  onAddNote,
  onRemoveNote
}: LibraryPageProps) {
  const [activeTab, setActiveTab] = useState<Book['status']>('Preferiti');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // New Note form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBookTitle, setNoteBookTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTagsInput, setNoteTagsInput] = useState('');

  // Filter books by status tab
  const tabBooks = books.filter(b => b.status === activeTab && !b.id.startsWith('dc-') && b.id !== 'hero-1');

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    const tagsArray = noteTagsInput
      .split(',')
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length > 0);

    onAddNote({
      bookTitle: noteBookTitle || 'Pensieri Sparsi',
      title: noteTitle,
      content: noteContent,
      date: 'Oggi',
      tags: tagsArray.length > 0 ? tagsArray : ['APPUNTO']
    });

    // Reset Form
    setNoteTitle('');
    setNoteBookTitle('');
    setNoteContent('');
    setNoteTagsInput('');
    setIsAddingNote(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 md:px-16 space-y-16"
    >
      {/* Page Title */}
      <div className="space-y-2 text-center md:text-left">
        <h1 className="font-serif text-3xl md:text-4xl text-on-surface font-semibold">
          La Mia Libreria
        </h1>
        <p className="font-sans text-sm text-on-surface-variant/70">
          Il tuo santuario di lettura personale. Riorganizza i tuoi scaffali, tieni traccia dei progressi o fissa le tue riflessioni nel diario.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Scaffali / Shelves (Left Column, 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Tab buttons */}
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
                  className={`flex items-center gap-2 pb-3 font-sans font-semibold text-xs md:text-sm tracking-widest uppercase transition-all duration-300 relative cursor-pointer ${
                    isActive ? 'text-primary' : 'text-on-surface-variant/60 hover:text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <motion.span 
                      layoutId="activeLibraryTab"
                      className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full" 
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Book List container */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {tabBooks.length > 0 ? (
                tabBooks.map((book) => (
                  <motion.div
                    layout
                    key={book.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35 }}
                    className="bg-white rounded-2xl p-5 border border-surface-container-high/40 shadow-sm flex flex-col md:flex-row gap-5 items-center justify-between"
                  >
                    <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left flex-1">
                      {/* Cover */}
                      <img 
                        src={book.coverUrl} 
                        alt={book.title} 
                        className="w-20 rounded-md shadow-sm aspect-[2/3] object-cover"
                      />
                      
                      {/* Titles & tag */}
                      <div className="space-y-1.5 max-w-sm">
                        <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start">
                          <span className="px-2 py-0.5 bg-surface-container font-sans text-[10px] font-semibold text-on-surface-variant uppercase rounded-full">
                            {book.category}
                          </span>
                          {book.extraLabel && (
                            <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container font-sans text-[9px] font-bold tracking-widest rounded uppercase">
                              {book.extraLabel}
                            </span>
                          )}
                        </div>
                        <h3 className="font-serif text-lg text-on-surface font-semibold">{book.title}</h3>
                        <p className="font-sans text-xs text-on-surface-variant/80 italic">di {book.author}</p>
                        <p className="font-sans text-xs text-on-surface-variant/70 line-clamp-1 leading-normal pt-1">
                          {book.description}
                        </p>
                      </div>
                    </div>

                    {/* Actions and move toggles */}
                    <div className="flex md:flex-col items-center gap-2 pt-3 md:pt-0">
                      <div className="flex gap-1">
                        <button
                          title="Sposta in Preferiti"
                          onClick={() => onUpdateBookStatus(book.id, 'Preferiti')}
                          className={`p-2 rounded-full cursor-pointer transition-colors ${
                            activeTab === 'Preferiti' ? 'text-primary bg-primary/5' : 'text-on-surface-variant/40 hover:text-primary'
                          }`}
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                        <button
                          title="Sposta in Da Leggere"
                          onClick={() => onUpdateBookStatus(book.id, 'Da Leggere')}
                          className={`p-2 rounded-full cursor-pointer transition-colors ${
                            activeTab === 'Da Leggere' ? 'text-primary bg-primary/5' : 'text-on-surface-variant/40 hover:text-primary'
                          }`}
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                        <button
                          title="Sposta in Letti"
                          onClick={() => onUpdateBookStatus(book.id, 'Letti')}
                          className={`p-2 rounded-full cursor-pointer transition-colors ${
                            activeTab === 'Letti' ? 'text-primary bg-primary/5' : 'text-on-surface-variant/40 hover:text-primary'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          title="Rimuovi"
                          onClick={() => onRemoveBook(book.id)}
                          className="p-2 text-on-surface-variant/40 hover:text-rose-500 rounded-full cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="bg-white rounded-2xl py-12 px-6 border border-dashed border-surface-container-highest text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-on-surface-variant/30 mx-auto" />
                  <p className="font-serif text-lg text-on-surface">Questo scaffale è vuoto</p>
                  <p className="font-sans text-xs text-on-surface-variant/60 max-w-xs mx-auto leading-relaxed">
                    Non hai ancora aggiunto alcun libro a questa sezione. Clicca su Ricerca o Home per iniziare ad arricchire il tuo santuario.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Cozy Diary Notebook "Appunti Personali" (Right Column, 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex justify-between items-center px-1">
            <span className="font-serif text-xl font-medium text-on-surface flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Appunti Personali
            </span>
            <button
              onClick={() => setIsAddingNote(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full font-sans font-bold text-xs tracking-wider uppercase transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuovo
            </button>
          </div>

          {/* Diary entries */}
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#fcfaf2] rounded-xl p-6 shadow-md border-l-[6px] border-secondary border border-surface-container-high/60 relative overflow-hidden book-shadow"
                >
                  {/* Decorative Binder Rings */}
                  <div className="absolute top-0 left-0 right-0 h-4 flex justify-around px-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="w-1.5 h-4 bg-outline-variant/35 rounded-full -translate-y-2 shadow-inner" />
                    ))}
                  </div>

                  <button
                    onClick={() => onRemoveNote(note.id)}
                    className="absolute top-4 right-4 text-on-surface-variant/40 hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="pt-2 space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-sans font-semibold text-secondary tracking-widest uppercase">
                        <span className="italic">Libro: {note.bookTitle}</span>
                        <span>{note.date}</span>
                      </div>
                      <h4 className="font-serif text-lg text-on-surface font-semibold italic">{note.title}</h4>
                    </div>

                    {/* Lined Handwriting Paper feel */}
                    <div className="notebook-line text-sm text-on-surface-variant/90 font-serif leading-[2.3rem] italic pl-2 border-l border-red-200/50">
                      {note.content}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {note.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-[#f3f0e2] text-secondary font-sans font-bold text-[9px] tracking-widest uppercase rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Cozy Write Note Dialogue Box */}
      <AnimatePresence>
        {isAddingNote && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[#fbf9f6] max-w-lg w-full rounded-2xl p-6 md:p-8 border border-surface-container-high relative shadow-2xl"
            >
              {/* Notebook binding accent on the Left inside modal for luxury feel */}
              <div className="absolute top-0 bottom-0 left-0 w-3 bg-secondary/10 rounded-l-2xl border-r border-secondary/10 flex flex-col justify-around py-6">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-secondary/30 rounded-full" />
                ))}
              </div>

              <button
                onClick={() => setIsAddingNote(false)}
                className="absolute top-4 right-4 p-1 bg-surface-container/40 hover:bg-surface-container rounded-full text-on-surface-variant/80 hover:text-on-surface transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="pl-4">
                <div className="space-y-1 mb-6">
                  <h3 className="font-serif text-2xl text-on-surface font-semibold flex items-center gap-1.5">
                    <Edit3 className="w-5 h-5 text-secondary" />
                    Sottoscrivi Appunto
                  </h3>
                  <p className="font-sans text-xs text-on-surface-variant/75">
                    Affida i tuoi pensieri e riflessioni al tuo diario di lettura.
                  </p>
                </div>

                <form onSubmit={handleSaveNote} className="space-y-4 font-sans">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Titolo Nota</label>
                    <input
                      type="text"
                      required
                      placeholder="Es. 'Un passo incantevole', 'Contemplazioni'..."
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-surface-container-high rounded-xl focus:border-secondary outline-none transition-all text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Libro di Riferimento</label>
                    <input
                      type="text"
                      placeholder="Es. 'Memorie di Adriano', 'Siddharta'..."
                      value={noteBookTitle}
                      onChange={(e) => setNoteBookTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-surface-container-high rounded-xl focus:border-secondary outline-none transition-all text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Contenuto Appunto</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Scrivi qui i tuoi pensieri..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="w-full px-3.5 py-3 bg-white border border-surface-container-high rounded-xl focus:border-secondary outline-none transition-all font-serif text-xs leading-relaxed italic"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Tags (separati da virgola)</label>
                    <input
                      type="text"
                      placeholder="Es. 'CLASSICI, FILOSOFIA, CITAZIONE'"
                      value={noteTagsInput}
                      onChange={(e) => setNoteTagsInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-surface-container-high rounded-xl focus:border-secondary outline-none transition-all text-xs uppercase"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setIsAddingNote(false)}
                      className="px-4 py-2 border border-surface-container-high text-on-surface-variant rounded-lg font-semibold hover:bg-surface-container transition-all cursor-pointer"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-secondary text-white rounded-lg font-semibold hover:opacity-95 transition-all shadow-sm cursor-pointer"
                    >
                      Salva Nota
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
