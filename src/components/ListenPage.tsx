import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Square, Volume2, VolumeX, ListMusic, Headphones, Settings, Loader2, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { BookService, Reading } from '../utils/database';

interface ListenPageProps {
  activeTrackId: string;
  setActiveTrackId: (id: string) => void;
}

export default function ListenPage({ activeTrackId, setActiveTrackId }: ListenPageProps) {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(1); // 0 to 1
  const [rate, setRate] = useState(1); // 0.1 to 10
  const [isMuted, setIsMuted] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  // Real-time highlighting
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);

  // Fetch user readings for the queue
  const { data: readings = [], isLoading: isLoadingReadings } = useQuery({
    queryKey: ['readings', user?.id],
    queryFn: () => BookService.getUserReadings(user!.id),
    enabled: !!user,
  });

  // Find currently active reading
  const activeReading = readings.find(r => r.id === activeTrackId) || readings[0];

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Extract text from the active reading (Simulated text extraction)
  const bookText = activeReading?.book?.description || "Iniziamo la lettura di questa opera sintonica. Ogni parola è un passo verso la quiete del Santuario.";
  // Split text into sentences for highlighting
  const sentences = bookText.match(/[^\.!\?]+[\.!\?]+/g) || [bookText];

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Default to an Italian voice if available
      const itaVoice = availableVoices.find(v => v.lang.startsWith('it'));
      if (itaVoice) setSelectedVoice(itaVoice.name);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(bookText);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.volume = isMuted ? 0 : volume;
    utterance.rate = rate;
    utterance.lang = 'it-IT';

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        // Find which sentence we are in
        let cumulativeLength = 0;
        for (let i = 0; i < sentences.length; i++) {
          cumulativeLength += sentences[i].length;
          if (charIndex < cumulativeLength) {
            setCurrentSentenceIndex(i);
            break;
          }
        }
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIndex(0);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSentenceIndex(0);
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <Headphones className="w-16 h-16 text-primary/20 mx-auto" />
        <h2 className="font-serif text-2xl text-on-surface">Accedi per ascoltare la tua libreria</h2>
        <p className="text-on-surface-variant/70 italic">L'Aura di Ascolto è un'esperienza riservata agli abitanti del Santuario.</p>
      </div>
    );
  }

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
        <h1 className="font-serif text-3xl md:text-4xl text-on-surface font-semibold flex items-center justify-center md:justify-start gap-2">
          <Headphones className="w-8 h-8 text-primary" />
          Aura di Ascolto
        </h1>
        <p className="font-sans text-sm text-on-surface-variant/70">
          Esperienza di ascolto nativa: gratuita, immediata e sintonizzata con il tuo browser.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        
        {/* Core Player Area */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-white rounded-3xl p-6 md:p-10 border border-surface-container-high/45 shadow-sm player-shadow relative overflow-hidden">
          
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-[90px] pointer-events-none" />

          {isLoadingReadings ? (
             <div className="flex-1 flex flex-col items-center justify-center py-20 text-primary">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-serif italic">Preparando l'aura di ascolto...</p>
             </div>
          ) : activeReading ? (
            <div className="space-y-8 flex-1">
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                <div className="w-32 h-44 rounded-xl bg-surface-container overflow-hidden flex-shrink-0 book-shadow relative">
                  <img src={activeReading.book?.coverUrl} className="w-full h-full object-cover" />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center gap-1">
                      {[1, 2, 3].map(i => <div key={i} className="w-1 bg-white rounded-full animate-bounce" style={{ height: '20px', animationDelay: `${i*0.1}s` }} />)}
                    </div>
                  )}
                </div>

                <div className="text-center sm:text-left space-y-3">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary font-sans font-bold text-[9px] tracking-widest uppercase rounded">Sintonizzazione Attiva</span>
                    <h3 className="font-serif text-2xl text-on-surface font-semibold">{activeReading.book?.title}</h3>
                    <p className="font-sans text-sm text-on-surface-variant/70 italic">di {activeReading.book?.author}</p>
                  </div>

                  {/* Settings / Voice Selection */}
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                      <Settings className="w-3.5 h-3.5" />
                      Voce:
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="bg-surface-container/50 border-none rounded px-2 py-1 outline-none text-[10px]"
                      >
                        {voices.filter(v => v.lang.startsWith('it')).map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                       Velocità:
                       <select value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} className="bg-surface-container/50 border-none rounded px-2 py-1 outline-none text-[10px]">
                          {[0.8, 0.9, 1, 1.1, 1.2, 1.5].map(r => <option key={r} value={r}>{r}x</option>)}
                       </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-8 pt-8 border-t border-surface-container/40">
                <button onClick={handleStop} className="p-3 text-on-surface-variant/40 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all cursor-pointer">
                  <Square className="w-6 h-6 fill-current" />
                </button>
                <button 
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current translate-x-1" />}
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsMuted(!isMuted)} className="text-on-surface-variant/60">
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-20 h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary" />
                </div>
              </div>

              {/* Current Reflection */}
              <div className="mt-8 p-6 bg-primary/5 rounded-2xl border border-primary/10 min-h-[120px] flex flex-col justify-center text-center">
                 <span className="text-[10px] uppercase font-bold text-primary/40 tracking-[0.2em] mb-3">Riflessione Corrente</span>
                 <p className="font-serif italic text-lg text-on-surface leading-relaxed">
                   {sentences[currentSentenceIndex]}
                 </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-on-surface-variant/40">
              <BookOpen className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-serif italic">Seleziona un'opera dalla coda per iniziare l'ascolto.</p>
            </div>
          )}
        </div>

        {/* Coda & Transcript (Right Column) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-surface-container-high/45 shadow-sm flex-1 flex flex-col">
            <h4 className="font-serif text-base text-on-surface font-semibold pb-4 border-b border-surface-container/50">Trascrizione Sintonica</h4>
            <div className="space-y-4 overflow-y-auto max-h-80 flex-1 pr-1 pt-3">
              {sentences.map((s, idx) => (
                <p
                  key={idx}
                  className={`text-sm leading-relaxed transition-all duration-500 p-2 rounded-lg ${idx === currentSentenceIndex ? 'bg-primary/5 text-primary font-medium border-l-4 border-primary pl-3' : 'text-on-surface-variant/60'}`}
                >
                  {s}
                </p>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-surface-container-high/45 shadow-sm">
            <h4 className="font-serif text-base text-on-surface font-semibold pb-4 border-b border-surface-container/50 flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-on-surface-variant" />
              La Tua Libreria
            </h4>
            <div className="space-y-3 pt-3 overflow-y-auto max-h-60">
              {readings.map((r) => (
                <div
                  key={r.id}
                  onClick={() => { setActiveTrackId(r.id); handleStop(); }}
                  className={`flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all ${activeTrackId === r.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-surface-container'}`}
                >
                  <img src={r.book?.coverUrl} className="w-10 h-14 rounded object-cover shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-sans font-semibold text-xs truncate">{r.book?.title}</h5>
                    <p className="font-sans text-[10px] text-on-surface-variant/70 italic truncate">{r.book?.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
