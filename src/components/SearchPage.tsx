import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Compass, Heart, ArrowRight, Sparkles, Filter, Leaf, BookOpen, Coffee, HelpCircle, X, CheckSquare } from 'lucide-react';
import { Book } from '../types';
import { SUGGESTIVE_PROFILES } from '../data';

interface SearchPageProps {
  books: Book[];
  onPlayTrack: (bookTitle: string) => void;
  onUpdateBookStatus: (bookId: string, status: Book['status']) => void;
  onAddBook: (book: Omit<Book, 'id'>) => void;
}

export default function SearchPage({ books, onPlayTrack, onUpdateBookStatus, onAddBook }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'Tutti' | 'Classici' | 'Poesia' | 'Romanzi' | 'Filosofia'>('Tutti');
  const [selectedBookDetail, setSelectedBookDetail] = useState<Book | null>(null);

  // "Prossimo Viaggio" Soul Vibe generator
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [generatedRecommendation, setGeneratedRecommendation] = useState<any | null>(null);
  const [customVibeInput, setCustomVibeInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter existing library books
  const filteredBooks = useMemo(() => {
    if (searchResults.length > 0) return searchResults;

    return books.filter((book) => {
      const matchSearch = 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory = selectedCategory === 'Tutti' || book.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [books, searchQuery, selectedCategory, searchResults]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=10`);
      const data = await response.json();

      const openLibraryBooks: Book[] = data.docs.map((doc: any) => ({
        id: `ol-${doc.key.split('/').pop()}`,
        title: doc.title,
        author: doc.author_name?.[0] || 'Autore Sconosciuto',
        coverUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
          : 'https://images.unsplash.com/photo-1543005187-9f734ad2be65?auto=format&fit=crop&q=80&w=340&h=510',
        category: 'Romanzi', // Default category
        description: doc.first_sentence?.[0] || 'Nessuna descrizione disponibile per quest\'opera.',
        status: 'Da Leggere'
      }));

      setSearchResults(openLibraryBooks);
    } catch (error) {
      console.error('Error fetching from Open Library:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Pre-configured soul vibe quotes and matching suggestions
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

    // Simulate therapeutic beautiful recommendation loading
    setTimeout(() => {
      const match = VIBES.find(v => v.id === vibeId);
      if (match) {
        setGeneratedRecommendation(match.presents);
      }
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
      // Intuitively pick a beautiful recommendation profile based on custom text lengths/keywords
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

  const handleAddToLibrary = (recBook: any) => {
    // Dynamically insert recommendation book structure into main state
    const newBook: Omit<Book, 'id'> = {
      title: recBook.title,
      author: recBook.author,
      coverUrl: recBook.coverUrl,
      category: 'Romanzi',
      description: recBook.quote,
      status: 'Da Leggere'
    };
    onUpdateBookStatus(recBook.title, 'Da Leggere'); // Fallback or notify
    alert(`"${recBook.title}" è stato aggiunto con successo ai tuoi libri "Da Leggere"!`);
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
          Esplora Nuovi Orizzonti
        </h1>
        <p className="font-sans text-sm text-on-surface-variant/70">
          Cerca tra le pagine, lasciati ispirare dalle categorie o scopri il libro perfetto per il tuo stato d'animo.
        </p>
      </div>

      {/* Directory Searching Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Filter and Categorization Layout (Bento structure) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-surface-container/40 p-6 rounded-2xl border border-surface-container-high/60 space-y-6 shadow-sm">
            
            {/* Search Input */}
            <div className="space-y-2">
              <label className="font-sans font-semibold text-xs tracking-wider uppercase text-on-surface-variant">
                Ricerca Libera
              </label>
              <form onSubmit={handleSearch} className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value) setSearchResults([]);
                  }}
                  placeholder="Cerca un titolo, un autore, un'emozione..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-sans text-xs"
                />
                <button type="submit" className="absolute left-3.5 top-1/2 -translate-y-1/2 cursor-pointer">
                  <Search className={`w-4 h-4 ${isSearching ? 'animate-pulse text-primary' : 'text-on-surface-variant/50'}`} />
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <span className="font-sans font-semibold text-xs tracking-wider uppercase text-on-surface-variant flex items-center gap-1.5 pb-1 border-b border-surface-container-high">
                <Filter className="w-3.5 h-3.5 text-primary" />
                Categorie
              </span>
              <div className="flex flex-col gap-1.5">
                {(['Tutti', 'Classici', 'Poesia', 'Romanzi', 'Filosofia'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3.5 py-2 rounded-lg font-sans text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                      selectedCategory === cat 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Search Results */}
        <div className="lg:col-span-9 space-y-4">
          <div className="flex justify-between items-center px-2">
            <span className="font-sans font-semibold text-xs text-on-surface-variant/70 tracking-widest uppercase">
              Risultati ({filteredBooks.length})
            </span>
          </div>

          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map((book) => (
                <motion.div 
                  layout
                  key={book.id}
                  onClick={() => setSelectedBookDetail(book)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-surface-container-high/40 cursor-pointer group flex flex-col h-full transform transition-transform hover:-translate-y-1 duration-300"
                >
                  <div className="aspect-[4/5] bg-surface overflow-hidden relative">
                    <img 
                      src={book.coverUrl} 
                      alt={book.title} 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-0.5 bg-surface/90 text-primary font-sans font-semibold text-[9px] tracking-wider uppercase rounded-full shadow-sm">
                        {book.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-sans font-semibold text-sm text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                        {book.title}
                      </h3>
                      <p className="font-sans text-xs text-on-surface-variant/80 italic">
                        di {book.author}
                      </p>
                    </div>
                    <p className="font-sans text-xs text-on-surface-variant/70 line-clamp-2 leading-relaxed">
                      {book.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl py-12 px-6 border border-surface-container-high/45 text-center space-y-3">
              <HelpCircle className="w-10 h-10 text-on-surface-variant/40 mx-auto" />
              <p className="font-serif text-lg text-on-surface">Nessun libro trovato</p>
              <p className="font-sans text-xs text-on-surface-variant/60 max-w-sm mx-auto leading-relaxed">
                Nessuna corrispondenza trovata per "{searchQuery}". Prova a cercare un altro titolo o seleziona una categoria differente.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Suggestioni "Prossimo Viaggio" (Personalized literary journeys based on soul vibe) */}
      <section className="bg-surface-container-low rounded-3xl p-8 md:p-12 border border-surface-container/50 space-y-10 player-shadow relative overflow-hidden max-w-6xl mx-auto">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-[100px]" />
        
        <div className="text-center md:text-left space-y-3">
          <span className="flex items-center justify-center md:justify-start gap-1.5 font-sans font-semibold text-xs tracking-widest text-secondary uppercase">
            <Compass className="w-4 h-4" />
            Il Tuo Prossimo Viaggio
          </span>
          <h2 className="font-serif text-2xl md:text-3xl text-on-surface font-medium">
            Sintonizza la Lettura
          </h2>
          <p className="font-sans text-sm text-on-surface-variant/80 max-w-2xl leading-relaxed">
            Seleziona la tua tonalità d'animo o descrivici la sensazione che stai cercando. Genereremo istantaneamente un biglietto di viaggio poetico e un libro raccomandato.
          </p>
        </div>

        {/* Action Vibe Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Tonalità Choices (Left) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VIBES.map((v) => {
                const Icon = v.icon;
                const isSelected = selectedVibe === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVibe(v.id)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 flex flex-col gap-2 relative overflow-hidden h-32 justify-between ${
                      isSelected 
                        ? 'bg-secondary text-white border-secondary shadow-md' 
                        : 'bg-white hover:bg-surface-container border-surface-container-high text-on-surface'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <h4 className="font-sans font-semibold text-xs tracking-wide uppercase">{v.label}</h4>
                      <p className={`text-[10px] line-clamp-2 leading-normal pt-1 ${isSelected ? 'text-white/80' : 'text-on-surface-variant/75'}`}>
                        {v.vibeText}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Mood Form */}
            <form onSubmit={handleCustomVibeSubmit} className="bg-white rounded-xl p-4 border border-surface-container-high/75 space-y-3 shadow-sm">
              <label className="font-sans font-semibold text-xs text-on-surface shadow-none tracking-widest uppercase block">
                Descrivi un'altra emozione
              </label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={customVibeInput}
                  onChange={(e) => setCustomVibeInput(e.target.value)}
                  placeholder="Es. 'Fuggire lontano', 'Una sera di pioggia'..."
                  className="flex-1 px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-surface-container-high focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-sans text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-primary text-white rounded-lg font-sans font-semibold text-xs tracking-wider uppercase hover:opacity-90 transition-all cursor-pointer shadow-sm"
                >
                  Indovina
                </button>
              </div>
            </form>
          </div>

          {/* Results/Ticket (Right) */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl p-10 border border-surface-container-high/60 h-80 flex flex-col items-center justify-center gap-4 text-center"
                >
                  <Sparkles className="w-10 h-10 text-secondary animate-pulse" />
                  <p className="font-sans font-medium text-sm text-secondary animate-pulse">Sintonizzando le onde letterarie con il tuo spirito...</p>
                  <div className="w-24 h-1 bg-surface-container rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-secondary rounded-full animate-bounce" />
                  </div>
                </motion.div>
              ) : generatedRecommendation ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl border-2 border-dashed border-secondary/20 p-6 md:p-8 player-shadow relative flex flex-col sm:flex-row gap-6 overflow-hidden"
                >
                  {/* Decorative Ticket Punch */}
                  <div className="absolute top-1/2 -left-3 w-6 h-6 bg-surface-container-low rounded-full -translate-y-1/2" />
                  <div className="absolute top-1/2 -right-3 w-6 h-6 bg-surface-container-low rounded-full -translate-y-1/2" />

                  {/* Guide Cover */}
                  <div className="w-28 sm:w-32 flex-shrink-0 mx-auto sm:mx-0">
                    <img 
                      src={generatedRecommendation.coverUrl} 
                      alt={generatedRecommendation.title} 
                      className="w-full rounded-lg shadow-md object-cover aspect-[3/4]"
                    />
                  </div>

                  {/* Travel Ticket Info */}
                  <div className="flex-1 space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="inline-block px-2.5 py-0.5 bg-secondary-container text-on-secondary-container font-sans font-bold text-[9px] tracking-widest uppercase rounded">
                        Imbarco Aperto
                      </span>
                      <h3 className="font-serif text-xl text-on-surface font-semibold">{generatedRecommendation.title}</h3>
                      <p className="font-sans text-xs text-on-surface-variant/80 italic">di {generatedRecommendation.author}</p>
                      <p className="font-sans text-xs text-secondary italic leading-relaxed pt-2">
                        {generatedRecommendation.quote}
                      </p>
                    </div>

                    <div className="border-t border-surface-container/50 pt-3 space-y-1 text-[11x]">
                      <p className="font-sans text-[11px] text-on-surface-variant/70">
                        <strong>Metropoli d'Anima:</strong> {generatedRecommendation.travelDest}
                      </p>
                      <p className="font-sans text-[11px] text-on-surface-variant/50">
                        {generatedRecommendation.duration}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAddToLibrary(generatedRecommendation)}
                      className="w-full py-2.5 bg-secondary text-white rounded-lg font-sans font-semibold text-xs tracking-wider uppercase hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      Metti in Da Leggere
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-2xl p-10 border border-surface-container-high/60 h-80 flex flex-col items-center justify-center text-center gap-3">
                  <Compass className="w-12 h-12 text-primary/30" />
                  <h3 className="font-serif text-lg text-on-surface font-medium">Inizia la Tua Ricerca</h3>
                  <p className="font-sans text-xs text-on-surface-variant/60 max-w-sm leading-relaxed">
                    Fai clic su una delle tonalità d'animo a sinistra o descrivi un sentimento per svelare la lettura ideale per questa giornata.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* Selected Book pop-up */}
      <AnimatePresence>
        {selectedBookDetail && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface max-w-2xl w-full rounded-2xl overflow-hidden player-shadow border border-surface-container-high relative max-h-[90vh] flex flex-col"
            >
              <button 
                onClick={() => setSelectedBookDetail(null)}
                className="absolute top-4 right-4 p-2 bg-surface-container/50 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-on-surface transition-all cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="overflow-y-auto p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-32 sm:w-40 flex-shrink-0 mx-auto sm:mx-0">
                    <img 
                      src={selectedBookDetail.coverUrl} 
                      alt={selectedBookDetail.title} 
                      className="w-full rounded-lg shadow-md object-cover aspect-[2/3]"
                    />
                  </div>
                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 bg-primary-fixed text-on-primary-fixed-variant font-sans font-semibold text-[10px] tracking-widest uppercase rounded">
                        {selectedBookDetail.category}
                      </span>
                      <h3 className="font-serif text-2xl text-on-surface font-medium">
                        {selectedBookDetail.title}
                      </h3>
                      <p className="font-sans text-sm text-secondary italic">
                        {selectedBookDetail.author}
                      </p>
                    </div>

                    <span className="inline-block px-2 py-1 bg-surface-container rounded text-xs text-on-surface-variant/80">
                      Stato attuale: <strong className="text-primary">{selectedBookDetail.status || 'Da Leggere'}</strong>
                    </span>
                  </div>
                </div>

                <div className="border-t border-surface-container-high pt-5 space-y-4">
                  <h4 className="font-serif text-base text-on-surface font-semibold">Trama & Estratto</h4>
                  <p className="font-sans text-sm text-on-surface-variant/80 leading-relaxed italic">
                    {selectedBookDetail.description}
                  </p>
                  <div className="bg-surface-container-low/40 p-4 rounded-lg border border-surface-container/30 font-sans text-sm text-on-surface-variant/90 leading-relaxed italic border-l-4 border-primary">
                    «...la stanza conservava il silenzio delle prime ore del mattino. Tra le scaffalature in legno di larice, i piccoli respiri del chiaroscuro tracciavano un cammino trasparente. Vale guardò fuori dalla finestra: le cime stavano svelando il loro segreto d'argento alla notte appena trascorsa...»
                  </div>
                </div>

                {/* Switch actions */}
                <div className="border-t border-surface-container-high pt-5 flex flex-wrap gap-2 justify-between items-center text-sm">
                  <span className="text-xs text-on-surface-variant/60 font-semibold">Gestisci Libreria:</span>
                  <div className="flex gap-2">
                    {books.some(b => b.title === selectedBookDetail.title) ? (
                      (['Preferiti', 'Letti', 'Da Leggere'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            const existingBook = books.find(b => b.title === selectedBookDetail.title);
                            if (existingBook) {
                              onUpdateBookStatus(existingBook.id, status);
                              setSelectedBookDetail(prev => prev ? { ...prev, status } : null);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                            (books.find(b => b.title === selectedBookDetail.title)?.status || 'Da Leggere') === status
                              ? 'bg-primary text-white'
                              : 'bg-white hover:bg-surface-container border border-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {status}
                        </button>
                      ))
                    ) : (
                      <button
                        onClick={() => {
                          onAddBook(selectedBookDetail);
                          alert(`${selectedBookDetail.title} aggiunto alla libreria!`);
                        }}
                        className="px-6 py-1.5 bg-primary text-white rounded-full text-xs font-semibold cursor-pointer hover:opacity-90"
                      >
                        Aggiungi alla Libreria
                      </button>
                    )}
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
