import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Lock, Eye, FileText } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: 'home' | 'search' | 'library' | 'listen' | 'profile') => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

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
                <button
                  onClick={() => setIsPrivacyOpen(true)}
                  className="hover:text-stone-300 transition-colors cursor-pointer"
                >
                  Privacy
                </button>
                <a href="https://wa.me/393791038253" target="_blank" rel="noopener noreferrer" className="hover:text-stone-300 transition-colors italic">Assistenza</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 opacity-40 text-[9px] font-bold tracking-[0.4em] uppercase">
          <p>© 2026 Rù Libreria — Tutti i diritti riservati</p>
          <p>Created with passion</p>
        </div>
      </div>

      {/* Grain Overlay opzionale per texture premium */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {isPrivacyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-stone-900/60 backdrop-blur-md"
            onClick={() => setIsPrivacyOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Modal */}
              <div className="p-6 md:p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#5B6854]/10 rounded-2xl text-[#5B6854]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-sans font-black text-xl md:text-2xl tracking-tighter uppercase text-[#5B6854]">Privacy Policy</h2>
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">Tutela dei tuoi dati</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPrivacyOpen(false)}
                  className="p-2 hover:bg-white rounded-xl shadow-sm border border-stone-100 transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>

              {/* Contenuto Scrollabile */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 custom-scrollbar">
                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-[#5B6854]">
                    <Lock className="w-5 h-5" />
                    <h3 className="font-sans font-black text-xs tracking-widest uppercase">Sicurezza dei Dati</h3>
                  </div>
                  <p className="text-stone-600 text-sm leading-relaxed font-medium">
                    I tuoi dati sono protetti tramite crittografia end-to-end. Utilizziamo Supabase per garantire che solo tu possa accedere alle tue note e alla tua libreria personale.
                  </p>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-[#5B6854]">
                    <Eye className="w-5 h-5" />
                    <h3 className="font-sans font-black text-xs tracking-widest uppercase">Trasparenza</h3>
                  </div>
                  <p className="text-stone-600 text-sm leading-relaxed font-medium">
                    Non vendiamo né condividiamo i tuoi dati con terze parti. Rù raccoglie solo le informazioni necessarie per sincronizzare i tuoi progressi di lettura su diversi dispositivi.
                  </p>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-[#5B6854]">
                    <FileText className="w-5 h-5" />
                    <h3 className="font-sans font-black text-xs tracking-widest uppercase">I Tuoi Diritti</h3>
                  </div>
                  <p className="text-stone-600 text-sm leading-relaxed font-medium">
                    In qualsiasi momento puoi richiedere l'esportazione o la cancellazione definitiva del tuo account e di tutti i dati associati direttamente dall'area personale.
                  </p>
                </section>

                <div className="pt-8 border-t border-stone-100 text-center">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-loose">
                    Ultimo aggiornamento: Ottobre 2023<br />
                    Rù Libreria Digitale
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}
