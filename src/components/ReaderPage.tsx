import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  FileText,
  Maximize2,
  Minimize2,
  Settings,
  X,
  Loader2,
  BookOpen,
  Library,
  Save,
  Trash2,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookService, Reading, BookmarkService, DiaryService } from '../utils/database';
import { PdfService } from '../utils/pdfService';
import * as pdfjs from 'pdfjs-dist';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ReaderPageProps {
  bookId: string | null;
  onNavigateToLibrary: () => void;
}

export default function ReaderPage({ bookId, onNavigateToLibrary }: ReaderPageProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'bookmarks' | 'notes'>('bookmarks');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoom, setZoom] = useState(1.0);

  // Reader State
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [readerMode, setReaderMode] = useState<'pdf' | 'text'>('pdf');
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);

  // Note State
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Fetch current reading data
  const { data: readings = [] } = useQuery({
    queryKey: ['readings', user?.id],
    queryFn: () => BookService.getUserReadings(user!.id),
    enabled: !!user,
  });

  const currentReading = readings.find(r => r.book_id === bookId);

  // Fetch bookmarks
  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks', user?.id, bookId],
    queryFn: () => BookmarkService.getUserBookmarks(user!.id, bookId!),
    enabled: !!user && !!bookId,
  });

  // Fetch notes for this book
  const { data: notes = [] } = useQuery({
    queryKey: ['notes', user?.id, bookId],
    queryFn: () => DiaryService.getUserNotes(user!.id, bookId!),
    enabled: !!user && !!bookId,
  });

  // Mutations
  const updateProgressMutation = useMutation({
    mutationFn: (page: number) =>
      BookService.updateReading(currentReading!.id, { last_page_read: page }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['readings'] }),
  });

  const addBookmarkMutation = useMutation({
    mutationFn: (newBookmark: any) => BookmarkService.addBookmark(newBookmark),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: (id: string) => BookmarkService.removeBookmark(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  const addNoteMutation = useMutation({
    mutationFn: (note: any) => DiaryService.addNote(note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsAddingNote(false);
      setNewNote({ title: '', content: '' });
    },
  });

  // Load content (PDF or Text)
  useEffect(() => {
    const loadContent = async () => {
      if (!currentReading) return;

      setIsLoading(true);
      setPdf(null);
      setExtractedText(null);

      try {
        let url = '';
        if (currentReading.source_type === 'internal' && currentReading.file_path) {
          url = await BookService.getFileUrl(currentReading.file_path);
        } else if (currentReading.external_url) {
          url = currentReading.external_url;
        } else if ((currentReading.book as any)?.file_url) {
          url = (currentReading.book as any).file_url;
        } else if ((currentReading.book as any)?.external_url) {
          url = (currentReading.book as any).external_url;
        }

        if (!url) throw new Error("URL non trovato");

        const isProbablyPdf = url.toLowerCase().includes('.pdf') || currentReading.source_type === 'internal';

        if (isProbablyPdf) {
          try {
            const loadingTask = pdfjs.getDocument({ url });
            const pdfDoc = await loadingTask.promise;
            setPdf(pdfDoc);
            setNumPages(pdfDoc.numPages);
            setReaderMode('pdf');
          } catch (pdfErr) {
            console.error("Failed to load as PDF, falling back to text extraction:", pdfErr);
            const text = await PdfService.extractRawText(url);
            setExtractedText(text);
            setReaderMode('text');
            setNumPages(Math.ceil(text.length / 2000));
          }
        } else {
          const text = await PdfService.extractRawText(url);
          setExtractedText(text);
          setReaderMode('text');
          setNumPages(Math.ceil(text.length / 2000));
        }

        // Restore progress
        if (currentReading.last_page_read) {
          setCurrentPage(currentReading.last_page_read);
        } else {
          setCurrentPage(1);
        }
      } catch (err) {
        console.error("Error loading reader content:", err);
        setExtractedText("Impossibile caricare il contenuto. Si prega di verificare la risorsa.");
        setReaderMode('text');
      } finally {
        setIsLoading(false);
      }
    };

    if (bookId) loadContent();
  }, [bookId, currentReading?.id]);

  // Render PDF Page
  useEffect(() => {
    const renderPage = async () => {
      if (readerMode !== 'pdf' || !pdf || !canvasRef.current) return;

      // Cancel previous render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      try {
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale: zoom * (window.innerWidth < 768 ? 0.8 : 1.5) });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error("Render error:", err);
        }
      }
    };

    renderPage();
  }, [pdf, currentPage, zoom, readerMode]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      updateProgressMutation.mutate(newPage);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      updateProgressMutation.mutate(newPage);
    }
  };

  const handleAddBookmark = () => {
    if (!user || !bookId) return;
    addBookmarkMutation.mutate({
      user_id: user.id,
      book_id: bookId,
      page_number: currentPage,
      text: `Pagina ${currentPage}`
    });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bookId) return;
    addNoteMutation.mutate({
      user_id: user.id,
      book_id: bookId,
      title: newNote.title || `Nota Pag. ${currentPage}`,
      content: newNote.content
    });
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  if (!bookId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <BookOpen className="w-16 h-16 text-primary/20 mb-4" />
        <h2 className="font-serif text-2xl text-on-surface mb-2">Nessun libro in lettura</h2>
        <p className="text-on-surface-variant max-w-md mb-8">
          Scegli un volume dalla tua libreria per iniziare a leggere nel tuo ambiente isolato.
        </p>
        <button
          onClick={onNavigateToLibrary}
          className="px-6 py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md"
        >
          <Library className="w-5 h-5" /> Vai alla Libreria
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-[calc(100vh-120px)] ${isFullScreen ? 'fixed inset-0 z-[100] bg-surface h-screen' : ''}`}>
      {/* Reader Toolbar */}
      <div className="bg-white border-b border-surface-container px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateToLibrary}
            className="p-2 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant"
            title="Torna alla libreria"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="hidden md:block">
            <h2 className="font-serif text-sm font-bold truncate max-w-[200px]">
              {currentReading?.book?.title}
            </h2>
            <p className="text-[10px] text-on-surface-variant italic">
              {currentReading?.book?.author}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-4">
          <div className="flex items-center bg-surface-container/50 rounded-lg p-1">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="p-1.5 hover:bg-white rounded-md disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-xs font-bold font-sans min-w-[80px] text-center">
              {currentPage} / {numPages || '...'}
            </div>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= numPages}
              className="p-1.5 hover:bg-white rounded-md disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-surface-container mx-1 hidden sm:block" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
              className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant hidden sm:block"
              title="Zoom out"
            >
              -
            </button>
            <span className="text-[10px] font-bold w-10 text-center hidden sm:block">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
              className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant hidden sm:block"
              title="Zoom in"
            >
              +
            </button>
          </div>

          <div className="h-6 w-px bg-surface-container mx-1" />

          <button
            onClick={handleAddBookmark}
            className="p-2 hover:bg-amber-50 hover:text-amber-600 rounded-lg text-on-surface-variant transition-colors"
            title="Aggiungi Segnalibro"
          >
            <Bookmark className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setIsSidebarOpen(true); setSidebarTab('notes'); }}
            className="p-2 hover:bg-primary/5 hover:text-primary rounded-lg text-on-surface-variant transition-colors"
            title="Note"
          >
            <FileText className="w-5 h-5" />
          </button>
          <button
            onClick={toggleFullScreen}
            className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors"
            title={isFullScreen ? "Esci Schermo Intero" : "Schermo Intero"}
          >
            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-lg transition-colors ${isSidebarOpen ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container text-on-surface-variant'}`}
            title="Menu laterale"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Reader View */}
      <div className="flex-1 flex overflow-hidden relative bg-surface-container-low">
        <div className="flex-1 overflow-auto flex justify-center p-4 md:p-8 scroll-smooth custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-primary">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="font-serif italic">Caricamento del volume...</p>
            </div>
          ) : (
            <motion.div
              key={`${bookId}-${currentPage}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.x < -50) handleNextPage();
                else if (info.offset.x > 50) handlePrevPage();
              }}
              className="relative shadow-2xl bg-white min-h-full w-full max-w-4xl overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
            >
              {readerMode === 'pdf' ? (
                <canvas ref={canvasRef} className="max-w-full h-auto mx-auto" />
              ) : (
                <div className="p-8 md:p-12 font-serif text-lg leading-relaxed text-on-surface whitespace-pre-wrap flex-1 bg-[#fdfcfb]">
                  {extractedText ? extractedText.substring((currentPage - 1) * 2000, currentPage * 2000) : "Nessun testo disponibile."}
                </div>
              )}

              {/* Invisible touch areas for navigation - Desktop legacy support */}
              <div
                className="absolute inset-y-0 left-0 w-20 cursor-w-resize z-10 hidden md:block"
                onClick={handlePrevPage}
                title="Pagina precedente"
              />
              <div
                className="absolute inset-y-0 right-0 w-20 cursor-e-resize z-10 hidden md:block"
                onClick={handleNextPage}
                title="Pagina successiva"
              />
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 inset-y-0 w-80 bg-white border-l border-surface-container shadow-2xl z-20 flex flex-col"
            >
              <div className="p-4 border-b border-surface-container flex items-center justify-between">
                <h3 className="font-serif font-bold uppercase tracking-widest text-xs text-primary">Strumenti di Lettura</h3>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-surface-container rounded-md">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex border-b border-surface-container">
                <button
                  onClick={() => setSidebarTab('bookmarks')}
                  className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${sidebarTab === 'bookmarks' ? 'text-primary' : 'text-on-surface-variant/50 hover:text-primary'}`}
                >
                  Segnalibri
                  {sidebarTab === 'bookmarks' && <motion.div layoutId="tabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
                <button
                  onClick={() => setSidebarTab('notes')}
                  className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${sidebarTab === 'notes' ? 'text-primary' : 'text-on-surface-variant/50 hover:text-primary'}`}
                >
                  Note
                  {sidebarTab === 'notes' && <motion.div layoutId="tabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {sidebarTab === 'bookmarks' ? (
                  <div className="space-y-3">
                    {bookmarks.length > 0 ? (
                      bookmarks.map((bm) => (
                        <div key={bm.id} className="bg-amber-50/40 border border-amber-100 rounded-xl p-3 group relative">
                          <button
                            onClick={() => { if (bm.page_number) setCurrentPage(bm.page_number); }}
                            className="text-left w-full"
                          >
                            <span className="text-[10px] font-bold text-amber-700 block mb-1">PAGINA {bm.page_number}</span>
                            <span className="text-xs text-on-surface-variant line-clamp-1 italic">"{bm.text}"</span>
                          </button>
                          <button
                            onClick={() => removeBookmarkMutation.mutate(bm.id)}
                            className="absolute top-2 right-2 p-1 text-amber-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 opacity-30 italic text-xs">
                        Nessun segnalibro salvato.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!isAddingNote ? (
                      <button
                        onClick={() => setIsAddingNote(true)}
                        className="w-full py-2 border-2 border-dashed border-primary/20 rounded-xl text-primary text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/5 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Nuova Nota
                      </button>
                    ) : (
                      <form onSubmit={handleAddNote} className="bg-primary/5 rounded-xl p-4 space-y-3 border border-primary/10">
                        <input
                          autoFocus
                          placeholder="Titolo nota..."
                          value={newNote.title}
                          onChange={e => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full bg-transparent border-none outline-none font-serif font-bold text-sm"
                        />
                        <textarea
                          placeholder="Scrivi le tue riflessioni..."
                          rows={4}
                          value={newNote.content}
                          onChange={e => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                          className="w-full bg-transparent border-none outline-none font-sans text-xs resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setIsAddingNote(false)} className="px-3 py-1 text-[10px] font-bold uppercase text-on-surface-variant">Annulla</button>
                          <button type="submit" className="px-3 py-1 bg-primary text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-1"><Save className="w-3 h-3" /> Salva</button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-3">
                      {notes.length > 0 ? (
                        notes.map((note) => (
                          <div key={note.id} className="bg-white border border-surface-container-high rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                            <h4 className="font-serif font-bold text-sm mb-1">{note.title}</h4>
                            <p className="font-sans text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                              {note.content}
                            </p>
                            <div className="mt-2 pt-2 border-t border-surface-container flex justify-between items-center text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-widest">
                              <span>{new Date(note.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 opacity-30 italic text-xs">
                          Nessun appunto per questo libro.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
