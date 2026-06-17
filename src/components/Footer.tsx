interface FooterProps {
  onNavigate: (page: 'home' | 'search' | 'library' | 'listen' | 'profile') => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="relative w-full mt-48 bg-[#4C6632] text-white">
      {/* Transizione Silhouette */}
      <div
        className="absolute top-0 left-0 w-full h-48 -translate-y-[99%] pointer-events-none bg-bottom bg-no-repeat bg-[length:100%_auto]"
        style={{ backgroundImage: 'url("/footer-bg.webp")' }}
      />

      <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1.2fr_auto_1fr] items-center gap-0">

          {/* Colonna 1: Brand */}
          <div className="flex flex-col items-center md:items-start gap-6 py-8 md:pr-12">
            <div
              onClick={() => onNavigate('home')}
              className="cursor-pointer hover:scale-105 transition-all duration-500"
            >
              <img
                src="/logo.webp"
                alt="Rù Logo"
                className="h-32 md:h-36 w-auto object-contain brightness-0 invert"
              />
            </div>
            <p className="text-sm font-medium tracking-loose max-w-[280px] text-center md:text-left leading-relaxed opacity-90">
              Un rifugio silenzioso e curato per lettori liberi, sognatori e appassionati di storie.
            </p>
          </div>

          {/* Divisore 1 */}
          <div className="hidden md:block w-px bg-white/20 h-48 self-center" />

          {/* Colonna 2: CTA Registrazione */}
          <div className="flex flex-col items-center gap-8 py-12 md:px-12">
            <div className="text-center space-y-3">
              <h3 className="font-sans font-black text-2xl tracking-tighter uppercase italic">
                Entra nel Rifugio
              </h3>
              <p className="text-sm opacity-80 max-w-[300px] leading-relaxed">
                Registrati per salvare i tuoi progressi, gestire la tua libreria e dialogare con Rù.
              </p>
            </div>
            <button
              onClick={() => onNavigate('profile')}
              className="group relative px-8 py-4 bg-white text-[#5B6854] font-sans font-black text-xs tracking-[0.2em] uppercase rounded-full hover:bg-stone-100 transition-all shadow-xl hover:shadow-2xl active:scale-95 overflow-hidden"
            >
              <span className="relative z-10">Inizia Ora</span>
              <div className="absolute inset-0 bg-stone-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </div>

          {/* Divisore 2 */}
          <div className="hidden md:block w-px bg-white/20 h-48 self-center" />

          {/* Colonna 3: Link & Legale */}
          <div className="flex flex-col items-center md:items-end gap-10 py-8 md:pl-12">
            <div className="flex flex-col items-center md:items-end gap-4">
              <h4 className="font-sans font-black text-[10px] tracking-[0.3em] uppercase opacity-50">Esplora</h4>
              <nav className="flex flex-col items-center md:items-end gap-3 text-xs font-bold tracking-widest uppercase">
                <button onClick={() => onNavigate('home')} className="hover:text-stone-300 transition-colors cursor-pointer">Home</button>
                <button onClick={() => onNavigate('library')} className="hover:text-stone-300 transition-colors cursor-pointer">Libreria</button>
                <button onClick={() => onNavigate('profile')} className="hover:text-stone-300 transition-colors cursor-pointer">Profilo</button>
              </nav>
            </div>

            <div className="flex flex-col items-center md:items-end gap-4">
              <h4 className="font-sans font-black text-[10px] tracking-[0.3em] uppercase opacity-50">Supporto</h4>
              <div className="flex flex-col items-center md:items-end gap-3 text-xs font-bold tracking-widest uppercase">
                <a href="#privacy" className="hover:text-stone-300 transition-colors">Privacy</a>
                <a href="https://wa.me/393791038253" target="_blank" rel="noopener noreferrer" className="hover:text-stone-300 transition-colors italic">Assistenza Vale</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 opacity-40 text-[9px] font-bold tracking-[0.4em] uppercase">
          <p>© 2026 Rù Libreria — Tutti i diritti riservati</p>
          <p>Created with passion for Vale</p>
        </div>
      </div>

      {/* Grain Overlay opzionale per texture premium */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
    </footer>
  );
}
