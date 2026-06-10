import { MessageCircle } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: 'home' | 'search' | 'library' | 'listen') => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-surface-container/40 border-t border-surface-container/50 w-full mt-20 pb-24 md:pb-12 text-center">
      <div className="flex flex-col items-center gap-6 py-16 px-4 max-w-7xl mx-auto">
        <div 
          onClick={() => onNavigate('home')}
          className="font-serif text-2xl text-primary font-semibold tracking-tight cursor-pointer hover:opacity-80 transition-all duration-300"
        >
          Vale
        </div>

        <nav className="flex flex-wrap justify-center gap-8 md:gap-12 text-sm font-semibold tracking-widest uppercase text-on-surface-variant/70">
          <button 
            onClick={() => onNavigate('home')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={() => {
              const url = window.location.href;
              const text = `Guarda questo spazio di lettura per Vale: ${url}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            }}
            className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            Condividi su WhatsApp
          </button>
        </nav>

        <p className="font-sans text-xs tracking-wide text-on-surface-variant/50 mt-4 italic">
          © {new Date().getFullYear()} Vale. A sanctuary for the silent reader.
        </p>
      </div>
    </footer>
  );
}
