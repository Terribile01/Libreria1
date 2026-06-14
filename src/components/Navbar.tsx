import { User, BookOpen, Search, Library, Headset, ShieldAlert, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentPage: 'home' | 'search' | 'library' | 'diary' | 'listen' | 'profile';
  setCurrentPage: (page: 'home' | 'search' | 'library' | 'diary' | 'listen' | 'profile') => void;
}

export default function Navbar({ currentPage, setCurrentPage }: NavbarProps) {
  const { currentUser, isAuthenticated } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home', icon: BookOpen },
    { id: 'search', label: 'Ricerca', icon: Search },
    { id: 'library', label: 'La Mia Libreria', icon: Library },
    { id: 'diary', label: 'Diario', icon: FileText },
    { id: 'listen', label: 'Ascolta', icon: Headset },
  ] as const;

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

        {/* Right Action: Profile / Credentials State */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPage('profile')}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer ${
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
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md px-4 py-3 flex justify-around items-center border-t border-surface-container/50 shadow-[0_-10px_30px_rgba(83,98,79,0.04)] z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer ${
                isActive ? 'text-primary scale-105' : 'text-on-surface-variant/60'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-semibold tracking-wider uppercase">{item.label}</span>
            </button>
          );
        })}
        
        {/* Profile Mobile Item */}
        <button
          onClick={() => setCurrentPage('profile')}
          className={`flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer ${
            currentPage === 'profile' ? 'text-primary scale-105' : 'text-on-surface-variant/60'
          }`}
        >
          {isAuthenticated && currentUser ? (
            <img 
              src={currentUser.avatarUrl} 
              alt="avatar" 
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-full object-cover border border-primary/20"
            />
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="text-[9px] font-semibold tracking-wider uppercase">Profilo</span>
        </button>
      </nav>
    </header>
  );
}
