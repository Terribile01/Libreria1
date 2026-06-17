import React, { useState, useEffect } from 'react';
import {
  Home,
  Search,
  Library,
  BookOpen,
  Headset,
  NotebookPen,
  Menu,
  X,
  User,
  Info,
  Volume2,
  Square
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/logo.png';

const INFO_SECTIONS = [
  {
    id: 'home',
    title: "HOME",
    icon: <Home className="w-6 h-6" />,
    text: "La tua dashboard personale. Qui trovi un riepilogo delle tue attività, i libri che stai leggendo e gli appunti recenti."
  },
  {
    id: 'search',
    title: "RICERCA",
    icon: <Search className="w-6 h-6" />,
    text: "Esplora nuovi titoli attraverso diversi cataloghi (Liber Liber, Open Library, Google Books). Puoi aggiungere libri al tuo Santuario con un click."
  },
  {
    id: 'library',
    title: "LIBRERIA",
    icon: <Library className="w-6 h-6" />,
    text: "Il tuo archivio personale. Gestisci la tua collezione, organizza le letture e carica i tuoi file PDF o EPUB."
  },
  {
    id: 'reader',
    title: "LEGGI",
    icon: <BookOpen className="w-6 h-6" />,
    text: "L'ambiente di lettura immersivo. Supporta PDF interni e link esterni, con strumenti per prendere appunti e segnalibri automatici."
  },
  {
    id: 'listen',
    title: "ASCOLTA",
    icon: <Headset className="w-6 h-6" />,
    text: "La sezione dedicata agli audiolibri e alla riproduzione vocale. Perfetta per continuare a vivere le tue storie preferite anche in movimento."
  },
  {
    id: 'diary',
    title: "NOTE",
    icon: <NotebookPen className="w-6 h-6" />,
    text: "Il tuo diario letterario. Raccoglie tutti i tuoi pensieri, citazioni e riflessioni sparse tra i vari libri della tua collezione."
  },
  {
    id: 'profile',
    title: "AREA PERSONALE",
    icon: <User className="w-6 h-6" />,
    text: "Gestisci il tuo profilo e le impostazioni. Qui puoi vedere le tue statistiche di lettura e personalizzare la tua esperienza su Rù."
  }
];

interface NavbarProps {
  currentPage: 'home' | 'search' | 'library' | 'diary' | 'listen' | 'profile' | 'reader';
  setCurrentPage: (page: 'home' | 'search' | 'library' | 'diary' | 'listen' | 'profile' | 'reader') => void;
}

export default function Navbar({ currentPage, setCurrentPage }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSpeakingInfo, setIsSpeakingInfo] = useState(false);
  const { user, profile } = useAuth();

  // Reset menu and info on navigation
  useEffect(() => {
    setIsMenuOpen(false);
    setIsInfoOpen(false);
    window.speechSynthesis.cancel();
    setIsSpeakingInfo(false);
  }, [currentPage]);

  const toggleInfoSpeech = () => {
    if (isSpeakingInfo) {
      window.speechSynthesis.cancel();
      setIsSpeakingInfo(false);
    } else {
      const text = INFO_SECTIONS.map(s => `${s.title}. ${s.text}`).join(' ');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'it-IT';
      utterance.rate = 1.1;
      utterance.onend = () => setIsSpeakingInfo(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeakingInfo(true);
    }
  };

  const navLinks: { id: 'home' | 'search' | 'library' | 'reader' | 'listen' | 'diary'; label: string; icon: any }[] = [
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'search', label: 'RICERCA', icon: Search },
    { id: 'library', label: 'LIBRERIA', icon: Library },
    { id: 'reader', label: 'LEGGI', icon: BookOpen },
    { id: 'listen', label: 'ASCOLTA', icon: Headset },
    { id: 'diary', label: 'NOTE', icon: NotebookPen },
  ];

  const displayName = profile?.username || user?.email?.split('@')[0] || 'Utente';

  const handleNavClick = (pageId: 'home' | 'search' | 'library' | 'diary' | 'listen' | 'profile' | 'reader') => {
    setCurrentPage(pageId);
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-[20px] md:px-10 h-[75px] md:h-[85px] flex items-center justify-between gap-[24px] md:gap-[35px]">
          <button onClick={() => handleNavClick('home')} className="flex items-center group cursor-pointer shrink-0">
            <img src="/logo.webp" alt="Rù Logo" className="h-[100px] md:h-[100px] w-auto object-contain transition-transform group-hover:scale-105" />
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all font-sans font-black text-[11px] tracking-[0.15em] uppercase cursor-pointer ${
                    isActive
                      ? 'bg-[#5B6854] text-white shadow-sm'
                      : 'text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                  {link.label}
                </button>
              );
            })}

            <button
              onClick={() => handleNavClick('profile')}
              className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all border cursor-pointer ml-1 ${
                currentPage === 'profile'
                  ? 'bg-stone-50 border-[#5B6854]'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="text-right leading-tight">
                <div className="flex flex-col">
                  <p className="text-[11px] font-black text-stone-900 truncate max-w-[120px] uppercase tracking-wider">
                    {displayName}
                  </p>
                  <p className="text-[9px] font-bold text-[#5B6854] uppercase tracking-[0.2em] mt-0.5">PROFILO</p>
                </div>
              </div>
              <div className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center overflow-hidden border border-stone-200">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-stone-400" />
                )}
              </div>
            </button>

            <div className="h-6 w-[1px] bg-stone-200 mx-1 lg:mx-2" />

            <button
              onClick={() => setIsInfoOpen(true)}
              className="p-2 text-[#8FA883] hover:bg-[#8FA883]/10 rounded-lg transition-colors cursor-pointer"
              title="Guida all'uso"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsInfoOpen(true)}
              className="p-2 text-[#8FA883] cursor-pointer"
            >
              <Info className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[85%] bg-white z-[70] shadow-2xl flex flex-col h-[100dvh]"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <div>
                  <h2 className="font-sans font-black tracking-tighter text-2xl uppercase text-[#5B6854]">
                    Rù Menu
                  </h2>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 bg-white rounded-xl shadow-sm border border-stone-100 cursor-pointer"
                >
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = currentPage === link.id;
                  return (
                    <button
                      key={link.id}
                      onClick={() => handleNavClick(link.id)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-sans font-black text-sm tracking-[0.1em] uppercase cursor-pointer ${
                        isActive
                          ? 'bg-[#5B6854] text-white shadow-lg'
                          : 'text-stone-500 active:bg-stone-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                      {link.label}
                    </button>
                  );
                })}

                <button
                  onClick={() => handleNavClick('profile')}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-sans font-black text-sm tracking-[0.1em] uppercase cursor-pointer ${
                    currentPage === 'profile'
                      ? 'bg-[#5B6854] text-white shadow-lg'
                      : 'text-stone-500 active:bg-stone-50'
                  }`}
                >
                  <User className={`w-5 h-5 ${currentPage === 'profile' ? 'text-white' : 'text-stone-400'}`} />
                  <div className="text-left leading-tight">
                    <p className="truncate max-w-[200px] font-black">{displayName}</p>
                    <p className={`text-[9px] tracking-[0.2em] font-bold mt-0.5 ${currentPage === 'profile' ? 'text-white/70' : 'text-[#5B6854]'}`}>PROFILO</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Info Popup Overlay */}
      <AnimatePresence>
        {isInfoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-white flex flex-col h-screen"
          >
            {/* Header Superiore */}
            <div className="shrink-0 flex items-center justify-between p-4 border-b bg-[#5B6854] text-white shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-sans font-black tracking-tighter text-xl uppercase leading-none">
                    Guida all'uso di Rù
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest opacity-70 mt-1">
                    Supporto Tecnico
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleInfoSpeech}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/30 cursor-pointer"
                >
                  {isSpeakingInfo ? (
                    <>
                      <Square className="w-4 h-4 fill-current" />
                      <span className="text-xs font-bold uppercase tracking-wider">Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Ascolta</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsInfoOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Contenuto della Guida */}
            <div className="flex-1 overflow-y-auto bg-white min-h-0">
              <div className="max-w-3xl mx-auto p-8 md:p-16 space-y-16 pb-32">
                {INFO_SECTIONS.map((section, idx) => (
                  <motion.section
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative pl-16"
                  >
                    <div className="absolute left-0 top-0 p-3.5 bg-stone-50 border border-stone-200 rounded-2xl shadow-sm text-[#5B6854]">
                      {section.icon}
                    </div>
                    <h3 className="font-sans font-black text-2xl mb-4 text-[#5B6854] tracking-tight uppercase">
                      {section.title}
                    </h3>
                    <p className="text-stone-600 leading-relaxed text-lg font-medium">
                      {section.text}
                    </p>
                  </motion.section>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
