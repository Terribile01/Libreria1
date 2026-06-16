import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, ListMusic, Headphones, Square, Settings, Loader2, Bookmark as BookmarkIcon, Trash2, Clock, Sparkles } from 'lucide-react';
import { AudioTrack } from '../types';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { BookService, Reading } from '../utils/database';
import { PdfService } from '../utils/pdfService';

interface ListenPageProps {
  tracks: AudioTrack[];
  activeTrackId: string;
  setActiveTrackId: (id: string) => void;
}

export default function ListenPage({ tracks, activeTrackId, setActiveTrackId }: ListenPageProps) {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1.2);
  const [isMuted, setIsMuted] = useState(false);

  // Web Speech API state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  // Fetch library to support dynamic tracks
  const { data: readings = [], isLoading: isLoadingLibrary } = useQuery({
    queryKey: ['readings', user?.id],
    queryFn: () => BookService.getUserReadings(user!.id),
    enabled: !!user,
  });

  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<Record<string, { time: number, text: string, date: string }[]>>(() => {
    const saved = localStorage.getItem('ru_bookmarks');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('ru_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const addBookmark = () => {
    if (!activeTrack) return;
    const currentTranscriptLine = activeTrack.transcript[activeTranscriptIndex]?.text || "";
    const newBookmark = {
      time: currentTime,
      text: currentTranscriptLine.substring(0, 60) + "...",
      date: new Date().toLocaleString()
    };

    setBookmarks(prev => ({
      ...prev,
      [activeTrackId]: [newBookmark, ...(prev[activeTrackId] || [])].slice(0, 10) // Keep last 10
    }));
  };

  const removeBookmark = (idx: number) => {
    setBookmarks(prev => ({
      ...prev,
      [activeTrackId]: prev[activeTrackId].filter((_, i) => i !== idx)
    }));
  };

  // Find currently active reading (from Supabase)
  const currentReading = readings.find(r => r.book_id === activeTrackId || r.id === activeTrackId);

  // Find currently active track (static or virtual)
  const activeTrack = useMemo(() => {
    // 1. Try static tracks first
    const staticTrack = tracks.find(t => t.id === activeTrackId);
    if (staticTrack) return staticTrack;

    // 2. If it's a library book, create a virtual track
    if (currentReading && currentReading.book) {
      return {
        id: currentReading.book.id,
        title: currentReading.book.title,
        author: currentReading.book.author,
        coverUrl: currentReading.book.coverUrl,
        chapter: currentReading.source_type === 'internal' ? 'Lettura PDF Intelligente' : 'Sintonizzazione Integrale',
        durationSeconds: 1800,
        transcript: [{ time: 0, text: extractedText || currentReading.book.description }]
      } as AudioTrack;
    }

    // 3. Fallback
    return tracks[0] || {
      id: 'fallback',
      title: 'Seleziona un libro',
      author: 'Rù',
      coverUrl: 'https://images.unsplash.com/photo-1543004218-ee14110497f8',
      chapter: 'Nessuna traccia attiva',
      chapterIndex: 0,
      durationSeconds: 0,
      transcript: []
    };
  }, [activeTrackId, tracks, currentReading, extractedText]);

  // Logic to process PDF if active reading has one
  useEffect(() => {
    const processPdf = async () => {
      if (currentReading?.source_type === 'internal' && currentReading.file_path) {
        setIsProcessingPdf(true);
        setExtractedText(null);
        try {
          // 1. Get Signed URL from Supabase
          const url = await BookService.getFileUrl(currentReading.file_path);
          if (!url) throw new Error("File non trovato o URL non valido.");

          // 2. Extract Raw Text
          const rawText = await PdfService.extractRawText(url);
          // 3. Clean and narrate with Groq PDF Key
          const cleanText = await BookService.extractTextWithGroq(rawText.substring(0, 15000)); // Limit to first 15k chars for safety
          setExtractedText(cleanText);
        } catch (err) {
          console.error("PDF Processing error:", err);
          setExtractedText("Errore nella sintonizzazione del PDF. Riprovo con la descrizione base.");
        } finally {
          setIsProcessingPdf(false);
        }
      } else {
        setExtractedText(null);
      }
    };

    processPdf();
  }, [currentReading]);

  // The full text to be read
  const fullText = activeTrack?.transcript.map(line => line.text).join(' ') || "";

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Default to a good Italian female voice if available, otherwise just the first one
      const preferred = availableVoices.find(v =>
        v.lang.startsWith('it') &&
        (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural')) &&
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('alice'))
      ) || availableVoices.find(v => v.lang.startsWith('it')) || availableVoices[0];

      if (preferred) setSelectedVoice(preferred.name);
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
    if (voice) utterance.lang = voice.lang;

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

  const activeTranscriptIndex = [...activeTrack.transcript]
    .reverse()
    .find((item) => currentTime >= item.time)
    ? activeTrack.transcript.indexOf(
        [...activeTrack.transcript].reverse().find((item) => currentTime >= item.time)!
      )
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 md:px-16 space-y-16"
    >
      <div className="space-y-2 text-center md:text-left">
        <h1 className="font-serif text-3xl md:text-4xl text-on-surface font-semibold flex items-center justify-center md:justify-start gap-2">
          <Headphones className="w-8 h-8 text-primary" />
          Aura di Ascolto
        </h1>
        <p className="font-sans text-sm text-on-surface-variant/70">
          Player sintonico nativo: leggero, gratuito e integrato.
        </p>
      </div>

      {/* Guida all'ascolto */}
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="p-3 bg-white rounded-xl shadow-sm"><Sparkles className="w-6 h-6 text-primary" /></div>
        <div className="flex-1 space-y-2">
          <h4 className="font-serif text-lg font-bold text-primary">Guida alla Sintonizzazione</h4>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Per un'esperienza ottimale, puoi personalizzare ogni dettaglio: usa il menu **Lingua** per adattare la voce al testo (es. seleziona voci Inglesi per testi originali), regola la **Velocità** (consigliato 1.2x per un ritmo fluido) e scegli il **Sesso della Voce** tra quelle installate sul tuo sistema. Usa i **Segnalibri** per custodire i passaggi che più ti colpiscono.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">

        {/* Core Player Area */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-white rounded-3xl p-6 md:p-10 border border-surface-container-high/45 shadow-sm player-shadow relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-[90px] pointer-events-none" />

          {isLoadingLibrary || isProcessingPdf ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-primary">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="font-serif italic">
                {isProcessingPdf ? 'Rù sta sintonizzando il tuo PDF...' : 'Preparando l\'aura di ascolto...'}
              </p>
            </div>
          ) : (
            <div className="space-y-8 flex-1">
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                <div className="w-32 h-44 rounded-xl bg-surface-container overflow-hidden flex-shrink-0 book-shadow relative group">
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
                    <span className="px-2 py-0.5 bg-primary/10 text-primary font-sans font-bold text-[9px] tracking-widest uppercase rounded">
                      {currentReading?.source_type === 'internal' ? 'Lettura Documento' : 'Sintonizzazione Attiva'}
                    </span>
                    <h3 className="font-serif text-2xl text-on-surface font-semibold">{activeTrack.title}</h3>
                    <p className="font-sans text-sm text-on-surface-variant/70 italic">di {activeTrack.author}</p>
                  </div>

                  <div className="flex flex-wrap justify-center sm:justify-start gap-3 pt-1">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                      <Settings className="w-3 h-3" />
                      <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="bg-transparent border-none outline-none max-w-[120px]">
                        {voices.map(v => (
                          <option key={v.name} value={v.name}>
                            [{v.lang.split('-')[0].toUpperCase()}] {v.name}
                          </option>
                        ))}
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

              {/* Seek bar */}
              <div className="space-y-2">
                <div className="w-full h-[5px] bg-surface-container-high rounded-lg relative overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentTime / activeTrack.durationSeconds) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex justify-between font-sans text-xs text-on-surface-variant/60 font-semibold px-0.5">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(activeTrack.durationSeconds)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-surface-container/40">
                <div className="flex items-center gap-4">
                  <button onClick={handleStop} title="Stop" className="p-2.5 text-on-surface-variant/40 hover:text-rose-500 transition-all cursor-pointer">
                    <Square className="w-6 h-6 fill-current" />
                  </button>
                  <button
                    onClick={isPlaying ? handlePause : handlePlay}
                    title={isPlaying ? "Pausa" : "Riproduci"}
                    className="p-4 bg-primary text-white rounded-full shadow-md flex items-center justify-center transform active:scale-95 transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-[1.5px]" />}
                  </button>
                  <button
                    onClick={addBookmark}
                    title="Aggiungi Segnalibro"
                    className="p-2.5 text-on-surface-variant/40 hover:text-amber-500 transition-all cursor-pointer"
                  >
                    <BookmarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto max-w-[160px]">
                  <button onClick={() => setIsMuted(!isMuted)} className="text-on-surface-variant hover:text-primary cursor-pointer">
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }} className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-secondary" />
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-surface-container/50 bg-[#fbf9f6]/40 p-4 rounded-xl border border-surface-container/30">
            <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-secondary block pb-2">Riflessione Corrente</span>
            <p className="font-serif italic text-sm text-on-surface leading-relaxed min-h-[40px]">
              {activeTrack.transcript[activeTranscriptIndex]?.text || "In attesa della sintonizzazione..."}
            </p>
          </div>
        </div>

        {/* Transcript & Queue */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-surface-container-high/45 shadow-sm flex-1 flex flex-col">
            <h4 className="font-serif text-base text-on-surface font-semibold pb-4 border-b border-surface-container/50">Trascrizione Sintonica</h4>
            <div className="space-y-4 overflow-y-auto max-h-60 flex-1 pr-1 pt-3">
              {activeTrack.transcript.map((line, idx) => {
                const isActive = idx === activeTranscriptIndex;
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg text-xs leading-relaxed transition-all duration-300 ${isActive ? 'bg-secondary/5 font-serif text-secondary italic border-l-4 border-secondary pl-3' : 'font-sans text-on-surface-variant/75'}`}
                  >
                    <p>{line.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-surface-container-high/45 shadow-sm">
            <h4 className="font-serif text-base text-on-surface font-semibold pb-4 border-b border-surface-container/50 flex items-center gap-2 text-amber-600">
              <BookmarkIcon className="w-4 h-4" /> Segnalibri
            </h4>
            <div className="space-y-2 pt-3 max-h-40 overflow-y-auto no-scrollbar">
              {bookmarks[activeTrackId]?.length > 0 ? (
                bookmarks[activeTrackId].map((bm, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-50/50 border border-amber-100 group">
                    <button
                      onClick={() => { handleStop(); setCurrentTime(bm.time); handlePlay(); }}
                      className="flex-1 text-left"
                    >
                      <p className="text-[10px] font-bold text-amber-800 truncate">{bm.text}</p>
                      <div className="flex items-center gap-2 text-[8px] text-amber-600/70">
                        <Clock className="w-2.5 h-2.5" /> {formatTime(bm.time)} • {bm.date.split(',')[0]}
                      </div>
                    </button>
                    <button onClick={() => removeBookmark(i)} className="p-1 text-amber-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-on-surface-variant/40 italic px-2 py-4 text-center">Nessun segnalibro per questo volume.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-surface-container-high/45 shadow-sm">
            <h4 className="font-serif text-base text-on-surface font-semibold pb-4 border-b border-surface-container/50 flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-on-surface-variant" /> Coda di Ascolto
            </h4>
            <div className="space-y-6 pt-3 overflow-y-auto max-h-[400px] pr-1">
              {/* Static Archive */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest block px-2">Archivio Storico</span>
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => { handleStop(); setActiveTrackId(track.id); }}
                    className={`flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all ${track.id === activeTrackId ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-surface-container'}`}
                  >
                    <img src={track.coverUrl} className="w-10 h-10 rounded object-cover shadow-sm flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-sans font-semibold text-[11px] truncate">{track.title}</h5>
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
