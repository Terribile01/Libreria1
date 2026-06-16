import { useState } from 'react';
import { User, BookOpen, Search, Library, Headset, ShieldAlert, FileText, Menu, X, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  currentPage: 'home' | 'search' | 'library' | 'diary' | 'listen' | 'profile' | 'reader';
  setCurrentPage: (page: 'home' | 'search' | 'library' | 'diary' | 'listen' | 'profile' | 'reader') => void;
}

export default function Navbar({ currentPage, setCurrentPage }: NavbarProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Ricerca', icon: Search },
    { id: 'library', label: 'La Mia Libreria', icon: Library },
    { id: 'reader', label: 'Leggi', icon: BookOpen },
    { id: 'diary', label: 'Note', icon: FileText },
    { id: 'listen', label: 'Ascolta', icon: Headset },
  ] as const;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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
                <span className="font-serif text-xl text-primary font-bold tracking-wider">Menu</span>
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

              {/* Drawer Footer */}
              <div className="p-6 border-t border-surface-container/30 bg-white shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                    <img
                      src={isAuthenticated && currentUser ? currentUser.avatarUrl : "https://images.unsplash.com/photo-1494790108377-be9c29b29330"}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-on-surface">
                      {isAuthenticated && currentUser ? currentUser.username : "Nuovo Lettore"}
                    </h4>
                    <p className="text-xs text-on-surface-variant/60 uppercase tracking-widest font-sans font-bold">
                      {isAuthenticated && currentUser ? currentUser.role : "Santuario Digitale"}
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
