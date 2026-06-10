import { User, BookOpen, Search, Library, Headset } from 'lucide-react';

interface NavbarProps {
  currentPage: 'home' | 'search' | 'library' | 'listen';
  setCurrentPage: (page: 'home' | 'search' | 'library' | 'listen') => void;
  onProfileClick: () => void;
}

export default function Navbar({ currentPage, setCurrentPage, onProfileClick }: NavbarProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: BookOpen },
    { id: 'search', label: 'Ricerca', icon: Search },
    { id: 'library', label: 'La Mia Libreria', icon: Library },
    { id: 'listen', label: 'Ascolta', icon: Headset },
  ] as const;

  return (
    <header className="bg-surface/85 backdrop-blur-md sticky top-0 z-50 shadow-[0_15px_35px_rgba(83,98,79,0.03)] border-b border-surface-container/30 transition-all duration-300">
      <nav className="flex justify-between items-center px-4 md:px-16 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <div 
          onClick={() => setCurrentPage('home')}
          className="font-serif text-3xl text-primary font-semibold tracking-tight cursor-pointer hover:opacity-90 select-none transition-all duration-300"
        >
          Vale
        </div>

        {/* Center Links (Desktop) */}
        <div className="hidden md:flex items-center gap-10">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`font-sans font-semibold text-sm tracking-widest uppercase transition-all duration-300 relative pb-1 cursor-pointer hover:text-primary ${
                  isActive ? 'text-primary' : 'text-on-surface-variant/70'
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

        {/* Right Action */}
        <div className="flex items-center gap-2">
          <button 
            onClick={onProfileClick}
            className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full transition-all duration-300 cursor-pointer"
            aria-label="User Profile"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md px-6 py-3 flex justify-around items-center border-t border-surface-container/50 shadow-[0_-10px_30px_rgba(83,98,79,0.04)] z-50">
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
              <span className="text-[10px] font-semibold tracking-wider uppercase">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
