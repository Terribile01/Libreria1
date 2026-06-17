interface FooterProps {
  onNavigate: (page: 'home' | 'search' | 'library' | 'listen' | 'profile') => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-surface-container/40 border-t border-surface-container/50 w-full mt-20 pb-24 md:pb-12 text-center">
      <div className="flex flex-col items-center gap-6 py-16 px-4 max-w-7xl mx-auto">
        <div 
          onClick={() => onNavigate('home')}
          className="w-72 h-72 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 shadow-md border border-stone-200"
        >
          <img src="/logo.webp" alt="Rù Logo" className="w-full h-full object-cover" />
        </div>

        <nav className="flex flex-wrap justify-center gap-8 md:gap-12 text-sm font-semibold tracking-widest uppercase text-on-surface-variant/70">
          <button 
            onClick={() => onNavigate('home')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Home
          </button>
          <button 
            onClick={() => onNavigate('profile')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Area Personale
          </button>
          <a href="#contatti" className="hover:text-primary transition-colors">
            Contatti
          </a>
          <a href="#privacy" className="hover:text-primary transition-colors">
            Privacy Policy
          </a>
          <a href="#termini" className="hover:text-primary transition-colors">
            Termini
          </a>
          <a
            href="https://wa.me/393791038253"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors flex items-center gap-1.5"
          >
            Supporto Tecnico
          </a>
        </nav>

        <p className="font-sans text-xs tracking-wide text-on-surface-variant/50 mt-4 italic">
          © {new Date().getFullYear()} Rù. Un rifugio silenzioso per lettori liberi e appassionati.
        </p>
      </div>
    </footer>
  );
}
