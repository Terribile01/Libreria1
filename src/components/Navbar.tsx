import { useState, useRef } from 'react';
import { User, BookOpen, Search, Library, Headset, ShieldAlert, FileText, Menu, X, Home, Info, Volume2, Square } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  currentPage: 'home' | 'search' | 'library' | 'diary' | 'listen' | 'profile' | 'reader';
  setCurrentPage: (page: 'home' | 'search' | 'library' | 'diary' | 'listen' | 'profile' | 'reader') => void;
}

export default function Navbar({ currentPage, setCurrentPage }: NavbarProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const navItems = [
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'search', label: 'RICERCA', icon: Search },
    { id: 'library', label: 'LIBRERIA', icon: Library },
    { id: 'reader', label: 'LEGGI', icon: BookOpen },
    { id: 'listen', label: 'ASCOLTA', icon: Headset },
    { id: 'diary', label: 'NOTE', icon: FileText },
  ] as const;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const infoContent = {
    title: "GUIDA ALL'USO DI RÙ",
    sections: [
      {
        title: "HOME",
        content: "La tua scrivania digitale. Qui trovi un riepilogo delle tue attività recenti, i libri che stai leggendo e le ultime note inserite. È il punto di partenza per ogni tua sessione su Rù."
      },
      {
        title: "RICERCA",
        content: "Esplora il catalogo globale. Puoi cercare libri per titolo, autore o tramite Liber Liber. Una volta trovato un libro di tuo interesse, puoi aggiungerlo alla tua libreria personale."
      },
      {
        title: "LIBRERIA",
        content: "Il tuo santuario personale. Qui sono custoditi tutti i libri che hai aggiunto. Puoi gestire lo stato di lettura (Da leggere, In lettura, Completato) e accedere rapidamente ai testi."
      },
      {
        title: "LEGGI",
        content: "L'ambiente di lettura dedicato. Carica i tuoi file PDF o ePub o leggi i testi digitali. Il sistema ricorda automaticamente l'ultima pagina letta per permetterti di riprendere da dove avevi interrotto."
      },
      {
        title: "ASCOLTA",
        content: "Trasforma la lettura in ascolto. Utilizza la sintesi vocale avanzata per ascoltare i testi dei tuoi libri. Puoi regolare velocità, tono e scegliere la voce che preferisci per un'esperienza personalizzata."
      },
      {
        title: "NOTE",
        content: "Il tuo diario letterario. Raccogli riflessioni, citazioni e appunti sparsi. Ogni nota può essere collegata a un libro specifico o rimanere un pensiero libero nella tua collezione."
      },
      {
        title: "AREA PERSONALE",
        content: "Gestione del profilo e impostazioni. Qui puoi personalizzare i tuoi dati, monitorare le statistiche di lettura e gestire le chiavi API per le funzionalità avanzate di intelligenza artificiale."
      }
    ]
  };

  const speakInfo = () => {
    window.speechSynthesis.cancel();

    const fullText = `${infoContent.title}. ${infoContent.sections.map(s => `${s.title}: ${s.content}`).join(' ')}`;
    const utterance = new SpeechSynthesisUtterance(fullText);
    utteranceRef.current = utterance;
    utterance.lang = 'it-IT';
    utterance.rate = 1.15;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => { setIsSpeaking(false); utteranceRef.current = null; };
    utterance.onerror = () => { setIsSpeaking(false); utteranceRef.current = null; };

    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v =>
      v.lang.startsWith('it') &&
      (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('female'))
    ) || voices.find(v => v.lang.startsWith('it'));

    if (femaleVoice) utterance.voice = femaleVoice;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <header className="bg-surface/85 backdrop-blur-md sticky top-0 z-50 shadow-[0_15px_35px_rgba(83,98,79,0.03)] border-b border-surface-container/30 transition-all duration-300">
      <nav className="flex justify-between items-center px-4 md:px-16 py-4 max-w-7xl mx-auto">
        {/* Logo - Rù */}
        <div 
          onClick={() => setCurrentPage('home')}
          className="font-serif text-3xl text-primary font-bold tracking-wider cursor-pointer hover:opacity-90 select-none transition-all duration-300 flex items-center gap-1.5"
        >
          Rù
        </div>

        {/* Center Links (Desktop) */}
        <div className="hidden md:flex items-center gap-10">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`font-sans font-semibold text-sm tracking-widest uppercase transition-all duration-300 relative pb-1 cursor-pointer hover:text-primary ${
                  isActive ? 'text-primary font-bold' : 'text-on-surface-variant/70'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Info Button */}
          <button
            onClick={() => setIsInfoOpen(true)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-all cursor-pointer"
            aria-label="Informazioni"
          >
            <Info className="w-6 h-6" />
          </button>

          {/* Mobile Quick Actions (Home & Profile) */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setCurrentPage('home')}
              className={`p-2 rounded-full transition-all ${currentPage === 'home' ? 'text-primary bg-primary/5' : 'text-on-surface-variant'}`}
            >
              <Home className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentPage('profile')}
              className={`p-1 rounded-full transition-all border-2 ${currentPage === 'profile' ? 'border-primary' : 'border-transparent'}`}
            >
              {isAuthenticated && currentUser ? (
                <img
                  src={currentUser.avatarUrl}
                  alt="avatar"
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-on-surface-variant" />
              )}
            </button>
          </div>

          {/* Desktop Profile */}
          <button 
            onClick={() => setCurrentPage('profile')}
            className={`hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer ${
              currentPage === 'profile'
                ? 'bg-primary/10 border-primary/20 text-primary' 
                : 'bg-surface-container/40 border-surface-container-high/40 hover:bg-surface-container text-on-surface-variant hover:text-primary'
            }`}
            aria-label="Area Personale"
          >
            {isAuthenticated && currentUser ? (
              <>
                <div className="relative flex items-center justify-center">
                  <img 
                    src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330"} 
                    alt="user avatar" 
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover border border-primary/10"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-surface" />
                </div>
                <span className="hidden sm:inline font-sans font-bold text-xs">
                  {currentUser.username}
                </span>
              </>
            ) : (
              <>
                <User className="w-4 h-4" />
                <span className="font-sans font-bold text-xs uppercase tracking-wider">
                  Accedi
                </span>
              </>
            )}
          </button>

          {/* Hamburger Menu (Mobile Only) */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-primary hover:bg-primary/5 rounded-xl transition-all"
            aria-label="Menu"
          >
            <Menu className="w-8 h-8" />
          </button>
        </div>
      </nav>

      {/* Info Popup */}
      <AnimatePresence>
        {isInfoOpen && (
          <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 pt-20 sm:pt-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsInfoOpen(false);
                stopSpeaking();
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80dvh] sm:max-h-[90vh]"
            >
              {/* Popup Header */}
              <div className="p-6 bg-primary text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-xl tracking-tight">{infoContent.title}</h3>
                    <p className="text-[10px] text-white/80 uppercase font-bold tracking-widest">Supporto Tecnico</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isSpeaking ? (
                    <button
                      onClick={speakInfo}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all cursor-pointer flex items-center gap-2 px-4"
                    >
                      <Volume2 className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-wider">Ascolta</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopSpeaking}
                      className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full transition-all cursor-pointer flex items-center gap-2 px-4"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span className="text-xs font-bold uppercase tracking-wider">Stop</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsInfoOpen(false);
                      stopSpeaking();
                    }}
                    className="p-2 hover:bg-white/20 rounded-full transition-all cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Popup Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-surface-container-low/30 custom-scrollbar">
                {infoContent.sections.map((section, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="font-sans font-black text-primary text-sm tracking-[0.15em] uppercase flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {section.title}
                    </h4>
                    <p className="font-sans text-on-surface-variant/80 text-[15px] leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Popup Footer */}
              <div className="p-6 border-t border-surface-container-high bg-white flex justify-end shrink-0">
                <button
                  onClick={() => {
                    setIsInfoOpen(false);
                    stopSpeaking();
                  }}
                  className="px-8 py-3 bg-primary text-white rounded-xl font-sans font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
                >
                  Ho capito
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Side Drawer (Mobile) */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              className="fixed inset-0 bg-black/50 z-[60] md:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white z-[70] shadow-[-20px_0_50px_rgba(0,0,0,0.2)] flex flex-col md:hidden"
              style={{ height: '100dvh' }}
            >
              <div className="p-5 flex justify-between items-center border-b border-surface-container/50 bg-white shrink-0">
                <span className="font-serif text-xl text-primary font-bold tracking-wider uppercase">Rù Menu</span>
                <button
                  onClick={toggleMenu}
                  className="p-1.5 text-primary hover:bg-primary/5 rounded-full transition-all"
                  aria-label="Chiudi menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 py-6 px-5 space-y-3 overflow-y-auto bg-[#fdfcfb] custom-scrollbar">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentPage(item.id);
                        toggleMenu();
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${
                        isActive
                          ? 'bg-primary text-white shadow-lg scale-[1.01]'
                          : 'text-on-surface-variant bg-white border border-surface-container/30 hover:border-primary/30 hover:bg-primary/5'
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-white/20' : 'bg-primary/10 text-primary group-hover:bg-primary/20'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`font-sans text-[11px] uppercase tracking-[0.12em] text-left flex-1 ${isActive ? 'font-black' : 'font-bold'}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Drawer Footer - Area Personale */}
              <div
                onClick={() => {
                  setCurrentPage('profile');
                  toggleMenu();
                }}
                className="p-6 border-t border-surface-container/30 bg-white shrink-0 cursor-pointer hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-all">
                    <img
                      src={isAuthenticated && currentUser ? currentUser.avatarUrl : "https://images.unsplash.com/photo-1494790108377-be9c29b29330"}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-[0.2em] font-sans font-black mb-0.5">
                      AREA PERSONALE
                    </p>
                    <h4 className="font-serif font-bold text-on-surface group-hover:text-primary transition-colors leading-tight">
                      {isAuthenticated && currentUser ? currentUser.username : "Nuovo Lettore"}
                    </h4>
                    <p className="text-[11px] text-primary uppercase tracking-widest font-sans font-bold mt-0.5">
                      PROFILO
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
