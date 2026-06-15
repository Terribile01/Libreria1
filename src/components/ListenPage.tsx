import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Square, Volume2, VolumeX, ListMusic, Headphones, Settings } from 'lucide-react';
import { AudioTrack } from '../types';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { BookService } from '../utils/database';

interface ListenPageProps {
  tracks: AudioTrack[];
  activeTrackId: string;
  setActiveTrackId: (id: string) => void;
}

export default function ListenPage({ tracks, activeTrackId, setActiveTrackId }: ListenPageProps) {
  const { user } = useAuth();
  // --- STATO DEL PLAYER ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  // --- STATO WEB SPEECH API ---
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  // Web Speech API state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  // Fetch library to support dynamic tracks
  const { data: readings = [], isLoading: isLoadingLibrary } = useQuery({
    queryKey: ['readings', user?.id],
    queryFn: () => BookService.getUserReadings(user!.id),
    enabled: !!user,
  });

  // Find currently active track (static or virtual)
  const activeTrack = useMemo(() => {
    // 1. Try static tracks
    const staticTrack = tracks.find(t => t.id === activeTrackId);
    if (staticTrack) return staticTrack;

    // 2. Try library books
    const reading = readings.find(r => r.book_id === activeTrackId || r.id === activeTrackId);
    if (reading && reading.book) {
      return {
        id: reading.book.id,
        title: reading.book.title,
        author: reading.book.author,
        coverUrl: reading.book.coverUrl,
        chapter: 'Sintonizzazione Integrale',
        durationSeconds: 1800,
        transcript: [{ time: 0, text: reading.book.description }]
      } as AudioTrack;
    }

    // 3. Fallback
    return tracks[0];
  }, [activeTrackId, tracks, readings]);

  // The full text to be read
  const fullText = activeTrack?.transcript.map(line => line.text).join(' ') || "";

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      const itaVoice = availableVoices.find(v => v.lang.startsWith('it'));
      if (itaVoice) setSelectedVoice(itaVoice.name);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Reset when track changes
  useEffect(() => {
    handleStop();
  }, [activeTrackId]);

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(fullText);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.volume = isMuted ? 0 : volume;
    utterance.rate = rate;
    utterance.lang = 'it-IT';

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        // Map character index to the track's duration for the progress bar and highlighting
        const progress = event.charIndex / fullText.length;
        setCurrentTime(Math.floor(progress * activeTrack.durationSeconds));
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentTime(0);
    };

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
    setCurrentTime(0);
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Logica originale di evidenziazione della transcript basata su currentTime
  const activeTranscriptIndex = [...activeTrack.transcript]
    .reverse()
    .find((item) => currentTime >= item.time)
    ? activeTrack.transcript.indexOf(
        [...activeTrack.transcript].reverse().find((item) => currentTime >= item.time)!
      )
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-4 md:px-16 space-y-16"
    >
      <div className="space-y-2 text-center md:text-left">
        <h1 className="font-serif text-3xl md:text-4xl text-on-surface font-semibold flex items-center justify-center md:justify-start gap-2">
          <Headphones className="w-8 h-8 text-primary" /> Aura di Ascolto
        </h1>
        <p className="font-sans text-sm text-on-surface-variant/70">Player sintonico nativo: leggero, gratuito e integrato.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        
        {/* PLAYER PRINCIPALE */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-white rounded-3xl p-6 md:p-10 border border-surface-container-high/45 shadow-sm player-shadow relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-[90px] pointer-events-none" />

          <div className="space-y-8 flex-1">
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="w-32 h-32 rounded-2xl bg-surface-container overflow-hidden flex-shrink-0 book-shadow relative group">
                <img src={activeTrack.coverUrl} className="w-full h-full object-cover" />
                {isPlaying && (
                  <div className="absolute inset-0 bg-primary/25 backdrop-blur-[2px] flex items-center justify-center gap-[3px]">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-[3px] bg-white rounded-full animate-bounce" style={{ height: '24px', animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }} />
                    ))}
                  </div>
                )}
              </div>

              <div className="text-center sm:text-left space-y-2 flex-1">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed-variant font-sans font-bold text-[9px] tracking-widest uppercase rounded">Sintonizzazione Attiva</span>
                  <h3 className="font-serif text-2xl text-on-surface font-semibold">{activeTrack.title}</h3>
                  <p className="font-sans text-sm text-on-surface-variant/70 italic">di {activeTrack.author}</p>
                </div>
                
                {/* SELECTORS: VOCE E VELOCITÀ */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 pt-1">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                    <Settings className="w-3 h-3" />
                    <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="bg-transparent border-none outline-none">
                      {voices.filter(v => v.lang.startsWith('it')).map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                     Velocità:
                     <select value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} className="bg-transparent border-none outline-none">
                        {[0.8, 1, 1.2, 1.5].map(r => <option key={r} value={r}>{r}x</option>)}
                     </select>
                  </div>
                </div>
              </div>
            </div>

            {/* SEEK BAR (Visuale) */}
            <div className="space-y-2">
              <div className="w-full h-[5px] bg-surface-container-high rounded-lg relative overflow-hidden">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-primary" 
                  animate={{ width: `${(currentTime / activeTrack.durationSeconds) * 100}%` }}
                />
              </div>
              <div className="flex justify-between font-sans text-xs text-on-surface-variant/60 font-semibold px-0.5">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(activeTrack.durationSeconds)}</span>
              </div>
            </div>

            {/* CONTROLLI PLAYER */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-surface-container/40">
              <div className="flex items-center gap-6">
                <button onClick={handleStop} className="p-2.5 text-on-surface-variant/40 hover:text-rose-500 transition-all cursor-pointer">
                  <Square className="w-6 h-6 fill-current" />
                </button>
                <button 
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="p-4 bg-primary text-white rounded-full shadow-md flex items-center justify-center transform active:scale-95 transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-1" />}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setIsMuted(!isMuted)} className="text-on-surface-variant hover:text-primary">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }} className="w-20 h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-secondary" />
              </div>
            </div>
          </div>

          {/* RIFLESSIONE CORRENTE (Sincronizzata) */}
          <div className="mt-8 pt-6 border-t border-surface-container/50 bg-[#fbf9f6]/40 p-4 rounded-xl border border-surface-container/30">
            <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-secondary block pb-2">Riflessione Corrente</span>
            <p className="font-serif italic text-sm text-on-surface leading-relaxed min-h-[40px]">
              {activeTrack.transcript[activeTranscriptIndex]?.text || "In attesa della sintonizzazione..."}
            </p>
          </div>
        </div>

        {/* TRASCRIZIONE E CODA (Compatibilità Totale) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-surface-container-high/45 shadow-sm flex-1 flex flex-col">
            <h4 className="font-serif text-base text-on-surface font-semibold pb-4 border-b border-surface-container/50">Trascrizione Sintonica</h4>
            <div className="space-y-4 overflow-y-auto max-h-60 flex-1 pr-1 pt-3">
              {activeTrack.transcript.map((line, idx) => {
                const isActive = idx === activeTranscriptIndex;
                return (
                  <div key={idx} className={`p-2.5 rounded-lg text-xs leading-relaxed transition-all duration-300 ${isActive ? 'bg-secondary/5 font-serif text-secondary italic border-l-4 border-secondary pl-3' : 'font-sans text-on-surface-variant/75'}`}>
                    <p>{line.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-surface-container-high/45 shadow-sm">
            <h4 className="font-serif text-base text-on-surface font-semibold pb-4 border-b border-surface-container/50 flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-on-surface-variant" /> Coda di Ascolto
            </h4>
            <div className="space-y-3 pt-3">
              {tracks.map((track) => {
                const isSelected = track.id === activeTrackId;
                return (
                  <div
                    key={track.id}
                    onClick={() => setActiveTrackId(track.id)}
                    className={`flex items-center gap-3.5 p-2 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-surface-container'}`}
                  >
                    <img src={track.coverUrl} className="w-12 h-12 rounded object-cover shadow-sm flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-sans font-semibold text-xs truncate">{track.title}</h5>
                      <p className="font-sans text-[10px] text-on-surface-variant/70 truncate italic">{track.author}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* User Library */}
              {user && (
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest block px-2">La Tua Libreria</span>
                  {isLoadingLibrary ? (
                    <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-primary/30" /></div>
                  ) : readings.length > 0 ? (
                    readings.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => { handleStop(); if (r.book) setActiveTrackId(r.book.id); }}
                        className={`flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all ${activeTrackId === r.book?.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-surface-container'}`}
                      >
                        <img src={r.book?.coverUrl} className="w-10 h-10 rounded object-cover shadow-sm flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-sans font-semibold text-[11px] truncate">{r.book?.title}</h5>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-on-surface-variant/40 italic px-2">Nessun libro salvato.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
