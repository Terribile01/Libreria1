import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Moon, Sun, Coffee, BookOpen, Loader2, MessageSquare
} from 'lucide-react';
import { Book } from '../types';
import { BookService } from '../utils/database';
import * as pdfjs from 'pdfjs-dist';

interface ReaderPageProps {
  book: Book;
  onClose: () => void;
}

type Theme = 'light' | 'sepia' | 'dark';

export default function ReaderPage({ book, onClose }: ReaderPageProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setZoom] = useState<number>(1.2);
  const [theme, setTheme] = useState<Theme>('sepia');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTxt, setIsTxt] = useState(false);
  const [txtContent, setTxtContent] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<pdfjs.PDFDocumentProxy | null>(null);

  useEffect(() => {
    const loadFile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let url = '';
        if (book.sourceType === 'internal' && book.filePath) {
          url = await BookService.getFileUrl(book.filePath);
        } else if (book.externalUrl) {
          url = book.externalUrl;
        } else {
          throw new Error("Nessuna sorgente disponibile per la lettura.");
        }

        const isTxtFile = url.toLowerCase().endsWith('.txt') || book.filePath?.toLowerCase().endsWith('.txt');

        if (isTxtFile) {
          setIsTxt(true);
          const response = await fetch(url);
          const text = await response.text();
          setTxtContent(text);
          setIsLoading(false);
        } else {
          // PDF Logic
          const loadingTask = pdfjs.getDocument({ url });
          const pdf = await loadingTask.promise;
          pdfRef.current = pdf;
          setNumPages(pdf.numPages);
          setIsLoading(false);
          renderPage(1, pdf, scale);
        }
      } catch (err: any) {
        console.error("Reader Error:", err);
        setError("Impossibile caricare il file. Potrebbe trattarsi di un link protetto o di un formato non supportato per la lettura interna.");
        setIsLoading(false);
      }
    };

    loadFile();
  }, [book]);

  const renderPage = async (pageNum: number, pdf: pdfjs.PDFDocumentProxy, currentScale: number) => {
    if (!canvasRef.current) return;

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: currentScale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext: any = {
          canvasContext: context,
          viewport: viewport
        };
        await page.render(renderContext).promise;
      }
    } catch (err) {
      console.error("Page render error:", err);
    }
  };

  const changePage = (offset: number) => {
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
      if (pdfRef.current) renderPage(newPage, pdfRef.current, scale);
    }
  };

  const changeZoom = (delta: number) => {
    const newScale = Math.max(0.5, Math.min(3, scale + delta));
    setZoom(newScale);
    if (pdfRef.current) renderPage(pageNumber, pdfRef.current, newScale);
  };

  const themeClasses = {
    light: 'bg-[#ffffff] text-slate-900',
    sepia: 'bg-[#f4ecd8] text-[#5b4636]',
    dark: 'bg-[#1a1a1a] text-slate-300'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[100] flex flex-col ${themeClasses[theme]} transition-colors duration-300`}
    >
      {/* Header Toolbar */}
      <header className="h-16 border-b border-black/10 flex items-center justify-between px-4 md:px-8 bg-inherit/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors"><X className="w-6 h-6" /></button>
          <div className="hidden md:block">
            <h1 className="font-serif font-bold text-lg line-clamp-1">{book.title}</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">LEGGENDO NEL SANTUARIO</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {!isTxt && (
            <div className="flex items-center bg-black/5 rounded-xl p-1">
              <button onClick={() => changeZoom(-0.2)} className="p-2 hover:bg-black/5 rounded-lg transition-colors"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-[10px] font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={() => changeZoom(0.2)} className="p-2 hover:bg-black/5 rounded-lg transition-colors"><ZoomIn className="w-4 h-4" /></button>
            </div>
          )}

          <div className="flex items-center bg-black/5 rounded-xl p-1">
            <button onClick={() => setTheme('light')} className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'bg-white shadow-sm' : 'hover:bg-black/5'}`}><Sun className="w-4 h-4" /></button>
            <button onClick={() => setTheme('sepia')} className={`p-2 rounded-lg transition-colors ${theme === 'sepia' ? 'bg-[#f4ecd8] shadow-sm' : 'hover:bg-black/5'}`}><Coffee className="w-4 h-4" /></button>
            <button onClick={() => setTheme('dark')} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-[#333] text-white shadow-sm' : 'hover:bg-black/5'}`}><Moon className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main ref={containerRef} className="flex-1 overflow-auto p-4 md:p-8 flex justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <Loader2 className="w-12 h-12 animate-spin text-primary" />
             <p className="font-serif italic text-lg">Srotolando la pergamena...</p>
          </div>
        ) : error ? (
          <div className="max-w-md text-center space-y-6 py-20">
             <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-sm leading-relaxed">
                {error}
             </div>
             <button onClick={onClose} className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase shadow-md">Torna alla Libreria</button>
          </div>
        ) : isTxt ? (
          <div className="max-w-2xl w-full">
            <div className="font-serif text-lg md:text-xl leading-[2.5rem] md:leading-[3rem] whitespace-pre-wrap px-4">
              {txtContent}
            </div>
          </div>
        ) : (
          <div className="relative shadow-2xl bg-white border border-black/10">
            <canvas ref={canvasRef} />
          </div>
        )}
      </main>

      {/* Footer Controls (Pages) */}
      {!isTxt && !isLoading && !error && (
        <footer className="h-16 border-t border-black/10 flex items-center justify-center gap-8 bg-inherit/90 backdrop-blur-md sticky bottom-0 z-10">
          <button
            disabled={pageNumber <= 1}
            onClick={() => changePage(-1)}
            className="flex items-center gap-2 px-4 py-2 hover:bg-black/5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" /> <span className="text-xs font-bold uppercase tracking-widest">Precedente</span>
          </button>
          <div className="font-serif text-sm font-bold">
            Pagina <span className="text-primary text-lg">{pageNumber}</span> di {numPages}
          </div>
          <button
            disabled={pageNumber >= numPages}
            onClick={() => changePage(1)}
            className="flex items-center gap-2 px-4 py-2 hover:bg-black/5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="text-xs font-bold uppercase tracking-widest">Successiva</span> <ChevronRight className="w-5 h-5" />
          </button>
        </footer>
      )}

      {/* Floating Ru Toggle */}
      <button
        className="fixed bottom-24 right-8 p-4 bg-primary text-white rounded-full shadow-2xl hover:scale-110 transition-all z-20 border-2 border-white/20"
        onClick={() => {
           // We trigger a global event or just explain to the user
           alert("Rù è sempre al tuo fianco. Clicca sulla bolla in basso a destra per parlarle mentre leggi!");
        }}
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </motion.div>
  );
}
