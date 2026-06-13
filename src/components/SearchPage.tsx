import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Compass, Heart, ArrowRight, Sparkles, Filter, Leaf, BookOpen,
  Coffee, HelpCircle, X, CheckSquare, Globe, Plus, Loader2, ExternalLink
} from 'lucide-react';
import { Book } from '../types';
import { BookSearchService, ExternalBook } from '../utils/bookSearch';
import { BookService, DiaryService } from '../utils/database';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AIProvider } from '../utils/aiProvider';

interface SearchPageProps {
  books: Book[];
  onPlayTrack: (bookTitle: string) => void;
}

export default function SearchPage({ books, onPlayTrack }: SearchPageProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Tutti' | 'Classici' | 'Poesia' | 'Romanzi' | 'Filosofia'>('Tutti');
  const [selectedBookDetail, setSelectedBookDetail] = useState<ExternalBook | null>(null);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [searchMode, setSearchMode] = useState<'all' | 'liberliber'>('all');

  // Manual form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualCategory, setManualCategory] = useState('Romanzi');
  const [manualDescription, setManualDescription] = useState('');
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // External Search State
  const [externalResults, setExternalResults] = useState<ExternalBook[]>([]);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [poeticIntro, setPoeticIntro] = useState<string | null>(null);
  const [isGeneratingIntro, setIsGeneratingIntro] = useState(false);

  // "Prossimo Viaggio" Soul Vibe generator
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [generatedRecommendation, setGeneratedRecommendation] = useState<any | null>(null);
  const [customVibeInput, setCustomVibeInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter existing library books (passed as props for now, but should ideally come from TanStack Query)
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchSearch = 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory = selectedCategory === 'Tutti' || book.category === selectedCategory;
      return matchSearch && matchCategory;
    }).map(b => ({ ...b, source: 'Local' as const }));
  }, [books, searchQuery, selectedCategory]);

  // Handle External Search Trigger
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsSearchingExternal(true);
        try {
          let results;
          if (searchMode === 'liberliber') {
            results = await BookSearchService.searchLiberLiber(searchQuery);
          } else {
            results = await BookSearchService.unifiedSearch(searchQuery);
          }
          setExternalResults(results);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearchingExternal(false);
        }
      } else {
        setExternalResults([]);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [searchQuery, searchMode]);

  const allResults = useMemo(() => {
    // Prioritize external results when searching
    if (searchQuery.length >= 3) {
      return [...externalResults, ...filteredBooks];
    }
    return filteredBooks;
  }, [filteredBooks, externalResults, searchQuery]);

  // Fetch readings for duplication check
  const { data: readings = [] } = useQuery({
    queryKey: ['readings', user?.id],
    queryFn: () => user ? BookService.getUserReadings(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  const isBookInLibrary = (title: string, author: string) => {
    return readings.some(r =>
      r.book?.title.toLowerCase() === title.toLowerCase() &&
      r.book?.author.toLowerCase() === author.toLowerCase()
    );
  };

  const importMutation = useMutation({
    mutationFn: async (externalBook: any) => {
      if (!user) throw new Error('Devi essere autenticato per importare libri.');

      let book = await BookService.findBook(externalBook.title, externalBook.author);

      if (!book) {
        book = await BookService.addBookToCatalog({
          title: externalBook.title,
          author: externalBook.author,
          coverUrl: externalBook.coverUrl,
          category: externalBook.category || 'Romanzi',
          description: externalBook.description || externalBook.quote || 'Nessuna descrizione disponibile.',
          external_url: externalBook.externalUrl
        });
      }

      return await BookService.addReading(user.id, book.id, 'Da Leggere', '', {
        source_type: 'external',
        external_url: externalBook.externalUrl
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      alert('Libro importato con successo nel tuo Santuario!');
    },
    onError: (error: any) => {
      alert(`Errore durante l'importazione: ${error.message}`);
    }
  });

  const handleAddToLibrary = (recBook: any) => {
    importMutation.mutate(recBook);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualAuthor || !user) return;

    setIsUploading(true);
    try {
      let filePath = '';
      let sourceType: 'internal' | 'external' = 'external';

      if (manualFile) {
        const uploadRes = await BookService.uploadLibraryFile(user.id, manualFile);
        filePath = uploadRes.filePath;
        sourceType = 'internal';
      }

      // Add to catalog and library
      const book = await BookService.addBookToCatalog({
        title: manualTitle,
        author: manualAuthor,
        category: manualCategory as any,
        description: manualDescription || 'Caricamento manuale nel Santuario.',
        coverUrl: 'https://images.unsplash.com/photo-1543004218-ee14110497f8?auto=format&fit=crop&q=80&w=300',
        file_url: filePath // Passing file path to catalog as file_url
      });

      await BookService.addReading(user.id, book.id, 'Da Leggere', '', {
        source_type: sourceType,
        file_path: filePath
      });

      queryClient.invalidateQueries({ queryKey: ['readings'] });
      setIsAddingManual(false);
      setManualTitle('');
      setManualAuthor('');
      setManualDescription('');
      setManualFile(null);
      alert('Libro aggiunto con successo al Santuario!');
    } catch (err: any) {
      alert("Errore durante il salvataggio: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAskRu = async (book: ExternalBook) => {
    setIsGeneratingIntro(true);
    setPoeticIntro(null);
    try {
      const intro = await AIProvider.generatePoeticIntro(book.title, book.author);
      setPoeticIntro(intro);
    } catch (error: any) {
      setPoeticIntro(`Rù sta meditando profondamente in questo momento (${error.message}). Riprova più tardi.`);
    } finally {
      setIsGeneratingIntro(false);
    }
  };

  const handleOpenDetail = (book: ExternalBook) => {
    setPoeticIntro(null);
    setSelectedBookDetail(book);
  };

  // VIBES remain the same...
  const VIBES = [
    { 
      id: 'v-silence', 
      label: 'Silenzio Rigenerante', 
      icon: Leaf,
      vibeText: "Cerchi rifugio dal rumore quotidiano, desideri uno spazio di raccoglimento puro.",
      presents: {
        title: "L'Arte del Silenzio",
        author: "S. Moretti",
        coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgGMy2sillD5zq2-3a-nZV7mxdkPpVrLQAFba2wxE9cQ_Hh3IgAJkC1aQat6CYwtkI66SC-lxHhA_BcbhAiJq_w06tnWsdmOB03ieJCC1PfNFJXI0sDBb9sz6ajkNeSyQpePWx_IZgpqKFZELfwck5ciEhDP7Q32ZPaNShEogqJ_pGuotW4-msDkS2aW6mv3vvfUYuuIlpqzSplY-TTKmSxyWfDBOGuobEqwN-RfVdqN3FOkiUFcZc91LL87YVIHjyQmLdxqlqSFCO",
        quote: "«Il silenzio non è vuoto; è colmo di risposte che attendono soltanto che la mente deponga le sue vecchie armature.»",
        travelDest: "Un cammino solitario tra i boschi infiniti del nord.",
        duration: "Consigliato per un weekend contemplativo."
      }
    },
    { 
      id: 'v-nostalgia', 
      label: 'Dolce Nostalgia', 
      icon: Heart,
      vibeText: "Hai voglia di perderti in ricordi caldi, atmosfere sfumate e legami indissolubili del passato.",
      presents: {
        title: "Sussurri d'Inverno",
        author: "Marco Polo",
        coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB60Icjjz_kD5Z9E_whxbtzBIh3NC6FBcxqA0bm5ym1Uugq8hVBpWBha5FenVBDim4YFpRHT3Gl1wQvQGXuNTZaO12iH4hB_26MNxgjpHESk-I_itCk6GJHNBPJE7EmAa8IlVuWCRva_6i1yTdJUvqUTIFa5a_DJtq4p3LrfpDa_4N8QxUOt0LH6BdSH6KMsphsVIBRJoE_JDCjoJ8ft5_gvY362_XeXnfTdhHsN8vtQgbIZ7-4pv0yPDUCyWky-eqGutydIB-N0NC0",
        quote: "«Scrivere è sempre ricordare dove abbiamo lasciato il calore quando abbiamo cominciato a camminare da soli...»",
        travelDest: "Una tazza di tè fumante accanto a un camino acceso mentre la neve imbianca le strade.",
        duration: "Perfetto per i pomeriggi piovosi di quiete."
      }
    },
    { 
      id: 'v-wisdom', 
      label: 'Fame di Saggezza', 
      icon: Compass,
      vibeText: "Desideri esplorare le grandi domande esistenziali, comprendere la natura dell'essere e dell'estetica.",
      presents: {
        title: "L'Orizzonte Invisibile",
        author: "Elena Valeri",
        coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdkuYQqwE42bhMaCrxQEGJO21qPLDamQODobpWZXIu_KKp93jMDC-bfl89o1nVK0c87FzbQhlqxjvj-J0skZHBTmEni0qgiQy-aqXCdeXVHqB4iYS6PT9tY9YoEE-kqV2eQGHijewqyh38kVie-tEPMJhluTOCn6KWmp9E8ISCbUY8LbatJtYQa4qhEcaEYysjSvOgsOSqx6JROtNGl-AqT9SuAknMVNe8xf9YrtqvMBd1gjVyaYsryhCP0OIW8iwj9tvOeRH4-U5u",
        quote: "«L'essenziale si nasconde negli interstizi della nostra fretta; solo fermandosi si impara di nuovo a vedere oltre la superficie.»",
        travelDest: "Un viaggio filosofico nel profondo Oriente, ascoltando la voce dei fiumi.",
        duration: "Un classico intramontabile che richiede mente calma."
      }
    },
    { 
      id: 'v-creative', 
      label: 'Inquietudine Creativa', 
      icon: Coffee,
      vibeText: "Sentimento di fervore intellettuale, desiderio di stravolgere schemi ordinari e nutrire l'immaginazione.",
      presents: {
        title: "Frammenti di Luce",
        author: "Luisa D'Amico",
        coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC2JqOxCiFEDTVvUa202BQ9lplqmq2G8tThJ5ZYdoqZ3rLHr77yjdrgmPzUUeEArBATYugRSJdzTfNCHPrat17ZGkXv4GPDOpFMotQBDEq6pQIvKxcRb9IMly7Bgj1eU-aa_6za_AFI-62HCVjvDF_1rDc1F9dRl20S_kjoRpoZ2N0NLivuA9FOLA-TViWqwAwHaC_KtbKlrBPEnPsHp2kfPCOqrqS4wpJZsD4tOkD2meru2pfocBNP4HuG9qrUv9iG7xSQi6gDevwU",
        quote: "«Le crepe nella tazza sono canali da cui fluisce la vera illuminazione; non nascondere le tue ferite, sono l'unica sorgente di poesia.»",
        travelDest: "Un soggiorno artistico nei quartieri storici di Kyoto o Parigi.",
        duration: "Incintezza che ispira, ideale per prendere appunti personali."
      }
    }
  ];

  const handleSelectVibe = (vibeId: string) => {
    setSelectedVibe(vibeId);
    setIsGenerating(true);
    setGeneratedRecommendation(null);
    setTimeout(() => {
      const match = VIBES.find(v => v.id === vibeId);
      if (match) setGeneratedRecommendation(match.presents);
      setIsGenerating(false);
    }, 1200);
  };

  const handleCustomVibeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customVibeInput.trim()) return;
    setIsGenerating(true);
    setGeneratedRecommendation(null);
    setSelectedVibe('custom');
    setTimeout(() => {
      const index = Math.abs(customVibeInput.length % VIBES.length);
      const match = VIBES[index];
      setGeneratedRecommendation({
        title: match.presents.title,
        author: match.presents.author,
        coverUrl: match.presents.coverUrl,
        quote: `«Nel profondo di "${customVibeInput}", l'universo svela la sua risposta più dolce. Ogni cammino di lettura è un viaggio per ritrovarsi.»`,
        travelDest: "Un santuario sconosciuto nascosto nel cuore di un antico borgo di collina.",
        duration: "Un'esperienza letteraria magica creata unicamente per la tua giornata."
      });
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 md:px-16 space-y-16"
    >
      <div className="space-y-2 text-center md:text-left">
        <h1 className="font-serif text-3xl md:text-4xl text-on-surface font-semibold">Esplora la Galleria</h1>
        <p className="font-sans text-sm text-on-surface-variant/70">Cerca tra i tuoi libri, naviga per categoria o scopri un suggerimento personalizzato.</p>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-surface-container/40 p-6 rounded-2xl border border-surface-container-high/60 space-y-6 shadow-sm">
            <div className="space-y-2">
              <label className="font-sans font-semibold text-xs tracking-wider uppercase text-on-surface-variant">Ricerca Libera</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Titolo, autore..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-sans text-xs"
                />
                <Search className="w-4 h-4 text-on-surface-variant/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div className="space-y-3">
              <span className="font-sans font-semibold text-xs tracking-wider uppercase text-on-surface-variant flex items-center gap-1.5 pb-1 border-b border-surface-container-high">
                <Globe className="w-3.5 h-3.5 text-primary" /> Sorgente
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setSearchMode('all')}
                  className={`px-3 py-2 rounded-lg font-sans text-[10px] font-bold uppercase transition-all ${searchMode === 'all' ? 'bg-primary text-white' : 'bg-surface border text-on-surface-variant'}`}
                >
                  Tutti i Cataloghi
                </button>
                <button
                  onClick={() => setSearchMode('liberliber')}
                  className={`px-3 py-2 rounded-lg font-sans text-[10px] font-bold uppercase transition-all ${searchMode === 'liberliber' ? 'bg-primary text-white' : 'bg-surface border text-on-surface-variant'}`}
                >
                  Solo Liber Liber
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <span className="font-sans font-semibold text-xs tracking-wider uppercase text-on-surface-variant flex items-center gap-1.5 pb-1 border-b border-surface-container-high">
                <Filter className="w-3.5 h-3.5 text-primary" /> Categorie
              </span>
              <div className="flex flex-col gap-1.5">
                {(['Tutti', 'Classici', 'Poesia', 'Romanzi', 'Filosofia'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3.5 py-2 rounded-lg font-sans text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                      selectedCategory === cat ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 space-y-4">
          <div className="flex justify-between items-center px-2">
            <span className="font-sans font-semibold text-xs text-on-surface-variant/70 tracking-widest uppercase">Risultati ({allResults.length})</span>
            <button
              onClick={() => setIsAddingManual(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg font-sans font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-secondary/20"
            >
              <Plus className="w-3.5 h-3.5" /> Aggiungi Manualmente
            </button>
          </div>

          {isSearchingExternal && (
            <div className="flex items-center gap-2 text-xs font-sans text-primary mb-4 animate-pulse">
               <Loader2 className="w-3.5 h-3.5 animate-spin" /> Consultazione cataloghi mondiali in corso...
            </div>
          )}

          {allResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allResults.map((book) => (
                <motion.div 
                  layout
                  key={book.id}
                  onClick={() => handleOpenDetail(book as ExternalBook)}
                  className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border cursor-pointer group flex flex-col h-full transform transition-transform hover:-translate-y-1 duration-300 ${
                    isBookInLibrary(book.title, book.author) ? 'border-primary/30 ring-1 ring-primary/10' : 'border-surface-container-high/40'
                  }`}
                >
                  <div className="aspect-[4/5] bg-surface overflow-hidden relative">
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <span className="px-2.5 py-0.5 bg-surface/90 text-primary font-sans font-semibold text-[9px] tracking-wider uppercase rounded-full shadow-sm">{book.category}</span>
                      {book.source !== 'Local' && (
                        <span className="px-2 py-0.5 bg-secondary text-white font-sans font-bold text-[8px] tracking-widest uppercase rounded-full shadow-sm flex items-center gap-1">
                          <Globe className="w-2 h-2" /> {book.source}
                        </span>
                      )}
                      {(book as any).extraLabel && (
                        <span className="px-2 py-0.5 bg-primary text-white font-sans font-bold text-[8px] tracking-widest uppercase rounded-full shadow-sm flex items-center gap-1">
                          <Sparkles className="w-2 h-2" /> {(book as any).extraLabel}
                        </span>
                      )}
                      {isBookInLibrary(book.title, book.author) && (
                        <span className="px-2 py-0.5 bg-green-500 text-white font-sans font-bold text-[8px] tracking-widest uppercase rounded-full shadow-sm flex items-center gap-1">
                          <CheckSquare className="w-2 h-2" /> NEL SANTUARIO
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-sans font-semibold text-sm text-on-surface group-hover:text-primary transition-colors line-clamp-1">{book.title}</h3>
                      <p className="font-sans text-xs text-on-surface-variant/80 italic">di {book.author}</p>
                    </div>
                    <p className="font-sans text-xs text-on-surface-variant/70 line-clamp-2 leading-relaxed">{book.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl py-12 px-6 border border-surface-container-high/45 text-center space-y-3">
              <HelpCircle className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
              <p className="font-serif text-lg text-on-surface">Nessun libro trovato</p>
            </div>
          )}
        </div>
      </section>

      {/* Suggestioni section remains mostly same... */}
      <section className="bg-surface-container-low rounded-3xl p-8 md:p-12 border border-surface-container/50 space-y-10 player-shadow relative overflow-hidden max-w-6xl mx-auto">
        {/* ... (rest of the Vibe section) ... */}
        <div className="text-center md:text-left space-y-3">
          <span className="flex items-center justify-center md:justify-start gap-1.5 font-sans font-semibold text-xs tracking-widest text-secondary uppercase">
            <Compass className="w-4 h-4" /> Il Tuo Prossimo Viaggio
          </span>
          <h2 className="font-serif text-2xl md:text-3xl text-on-surface font-medium">Sintonizza la Lettura</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VIBES.map((v) => {
                const Icon = v.icon;
                return (
                  <button key={v.id} onClick={() => handleSelectVibe(v.id)} className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 flex flex-col gap-2 h-32 justify-between ${selectedVibe === v.id ? 'bg-secondary text-white border-secondary' : 'bg-white hover:bg-surface-container border-surface-container-high text-on-surface'}`}>
                    <Icon className="w-5 h-5" />
                    <div><h4 className="font-sans font-semibold text-xs uppercase">{v.label}</h4></div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="lg:col-span-7">
            {generatedRecommendation && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border-2 border-dashed border-secondary/20 p-6 flex flex-col sm:flex-row gap-6">
                <div className="w-32 flex-shrink-0"><img src={generatedRecommendation.coverUrl} className="w-full rounded-lg shadow-md" /></div>
                <div className="flex-1 space-y-4">
                  <h3 className="font-serif text-xl font-semibold">{generatedRecommendation.title}</h3>
                  <button onClick={() => handleAddToLibrary(generatedRecommendation)} className="w-full py-2.5 bg-secondary text-white rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1">
                    {importMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Plus className="w-3 h-3" /> Metti in Da Leggere</>}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isAddingManual && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-surface max-w-md w-full rounded-2xl p-8 shadow-2xl border border-surface-container-high relative">
              <button onClick={() => setIsAddingManual(false)} className="absolute top-4 right-4 p-2"><X className="w-4 h-4" /></button>
              <h3 className="font-serif text-2xl font-semibold mb-6">Aggiungi al Santuario</h3>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5">Titolo</label>
                  <input type="text" required value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5">Autore</label>
                  <input type="text" required value={manualAuthor} onChange={(e) => setManualAuthor(e.target.value)} className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5">Categoria</label>
                  <select value={manualCategory} onChange={(e) => setManualCategory(e.target.value)} className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm">
                    {['Romanzi', 'Classici', 'Poesia', 'Filosofia'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5">Descrizione (Opzionale)</label>
                  <textarea rows={2} value={manualDescription} onChange={(e) => setManualDescription(e.target.value)} className="w-full px-4 py-2.5 bg-white border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5">Carica File (PDF/ePub)</label>
                  <input
                    type="file"
                    accept=".pdf,.epub"
                    onChange={(e) => setManualFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2.5 bg-white border rounded-xl text-[10px] file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-md mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                   {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvataggio...</> : 'Custodisci nel Santuario'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {selectedBookDetail && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-surface max-w-2xl w-full rounded-2xl overflow-hidden player-shadow border border-surface-container-high relative max-h-[90vh] flex flex-col">
              <button onClick={() => { setSelectedBookDetail(null); setPoeticIntro(null); }} className="absolute top-4 right-4 p-2 z-10"><X className="w-4 h-4" /></button>
              <div className="overflow-y-auto p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-32 sm:w-40 flex-shrink-0"><img src={selectedBookDetail.coverUrl} className="w-full rounded-lg shadow-md" /></div>
                  <div className="flex-1 space-y-3">
                    <h3 className="font-serif text-2xl font-medium">{selectedBookDetail.title}</h3>
                    <p className="font-sans text-sm text-secondary italic">di {selectedBookDetail.author}</p>
                    {selectedBookDetail.source !== 'Local' && (
                      <span className="px-2 py-0.5 bg-secondary text-white text-[8px] font-bold uppercase rounded flex items-center gap-1 w-fit"><Globe className="w-2.5 h-2.5" /> {selectedBookDetail.source}</span>
                    )}
                  </div>
                </div>
                <div className="border-t pt-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-serif text-base font-semibold flex items-center gap-2">
                       Introduzione di Rù
                       {isGeneratingIntro && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                    </h4>
                    <div className="flex items-center gap-3">
                      {!poeticIntro && !isGeneratingIntro && (
                        <button
                          onClick={() => handleAskRu(selectedBookDetail)}
                          className="text-[10px] font-sans font-bold text-secondary hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-widest cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" /> Chiedi a Rù
                        </button>
                      )}
                      {selectedBookDetail.externalUrl && <a href={selectedBookDetail.externalUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1 uppercase tracking-widest font-bold">Leggi Opera <ExternalLink className="w-2.5 h-2.5" /></a>}
                    </div>
                  </div>

                  <div className="bg-surface-container-low/40 p-4 rounded-lg border-l-4 border-primary italic text-sm text-on-surface-variant/90 min-h-[60px] flex items-center">
                    {isGeneratingIntro ? (
                      <span className="text-xs opacity-50 animate-pulse">Rù sta consultando le stelle per te...</span>
                    ) : (
                      poeticIntro || (selectedBookDetail.source !== 'Local' ? `«Nel cuore di questo volume esterno, Rù intravede un cammino prezioso. ${selectedBookDetail.description}»` : selectedBookDetail.description)
                    )}
                  </div>
                </div>
                <div className="border-t pt-5 flex justify-between items-center">
                  {selectedBookDetail.source === 'Local' || isBookInLibrary(selectedBookDetail.title, selectedBookDetail.author) ? (
                    <div className="flex items-center gap-2 text-green-600 font-sans font-bold text-[10px] uppercase tracking-widest">
                      <CheckSquare className="w-4 h-4" /> Già nel tuo Santuario
                    </div>
                  ) : (
                    <button disabled={importMutation.isPending} onClick={() => handleAddToLibrary(selectedBookDetail)} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase flex items-center gap-2 disabled:opacity-50">
                      {importMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Importa nel Santuario
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
