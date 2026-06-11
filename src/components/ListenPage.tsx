import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, ListMusic, CheckCircle2, Bookmark, Heart, Headphones } from 'lucide-react';
import { AudioTrack } from '../types';

interface ListenPageProps {
  tracks: AudioTrack[];
  activeTrackId: string;
  setActiveTrackId: (id: string) => void;
}

export default function ListenPage({ tracks, activeTrackId, setActiveTrackId }: ListenPageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1); // 0 to 1
  const [isMuted, setIsMuted] = useState(false);

  // Find currently active track
  const activeTrack = tracks.find(t => t.id === activeTrackId) || tracks[0];

  // Simulated player timer trigger
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= activeTrack.durationSeconds) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, activeTrack]);

  // Handle active track change resetting search timer
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [activeTrackId]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkipForward = () => {
    setCurrentTime((prev) => Math.min(prev + 15, activeTrack.durationSeconds));
  };

  const handleSkipBackward = () => {
    setCurrentTime((prev) => Math.max(prev - 15, 0));
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseInt(e.target.value));
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Locate currently highlighted transcript index
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
      {/* Page Title */}
      <div className="space-y-2 text-center md:text-left">
        <h1 className="font-serif text-3xl md:text-4xl text-on-surface font-semibold flex items-center justify-center md:justify-start gap-2">
          <Headphones className="w-8 h-8 text-primary" />
          Aura di Ascolto
        </h1>
        <p className="font-sans text-sm text-on-surface-variant/70">
          Un player audio rilassante con indicazione chiara del capitolo corrente, trascrizioni sintoniche in tempo reale e una coda ordinata.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        
        {/* Core Player Area (Left Column, 7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-white rounded-3xl p-6 md:p-10 border border-surface-container-high/45 shadow-sm player-shadow relative overflow-hidden">
          
          {/* Decorative wave background accents */}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-[90px] pointer-events-none" />

          <div className="space-y-8 flex-1">
            {/* Header Audio Info */}
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="w-32 h-32 rounded-2xl bg-surface-container overflow-hidden flex-shrink-0 book-shadow relative group">
                <img 
                  src={activeTrack.coverUrl} 
                  alt={activeTrack.title} 
                  className="w-full h-full object-cover"
                />
                {/* Playing Sound Wave Overlay */}
                {isPlaying && (
                  <div className="absolute inset-0 bg-primary/25 backdrop-blur-[2px] flex items-center justify-center gap-[3px]">
                    {[1, 2, 3, 4].map((i) => (
                      <div 
                        key={i} 
                        className="w-[3px] bg-white rounded-full animate-bounce" 
                        style={{ 
                          height: '24px', 
                          animationDelay: `${i * 0.15}s`,
                          animationDuration: '0.8s'
                        }} 
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="text-center sm:text-left space-y-2">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed-variant font-sans font-bold text-[9px] tracking-widest uppercase rounded">
                    Sintonizzazione Attiva
                  </span>
                  <h3 className="font-serif text-2xl text-on-surface font-semibold">{activeTrack.title}</h3>
                  <p className="font-sans text-sm text-on-surface-variant/70 italic">di {activeTrack.author}</p>
                </div>
                <p className="font-sans font-bold text-xs text-primary bg-primary/5 px-2.5 py-1 rounded inline-block">
                  {activeTrack.chapter}
                </p>
              </div>
            </div>

            {/* Simulated seek bar progress */}
            <div className="space-y-2">
              <input 
                type="range"
                min="0"
                max={activeTrack.durationSeconds}
                value={currentTime}
                onChange={handleProgressChange}
                className="w-full h-[5px] bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between font-sans text-xs text-on-surface-variant/60 font-semibold px-0.5">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(activeTrack.durationSeconds)}</span>
              </div>
            </div>

            {/* Main Controlling Deck */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-surface-container/40">
              
              {/* Play Pause Skip Commands */}
              <div className="flex items-center gap-6">
                <button 
                  onClick={handleSkipBackward}
                  className="p-2.5 text-on-surface-variant/75 hover:text-primary hover:bg-surface-container rounded-full transition-all cursor-pointer"
                  title="Indietro 15s"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button 
                  onClick={togglePlay}
                  className="p-4 bg-primary hover:opacity-90 active:scale-95 text-white rounded-full transition-all cursor-pointer shadow-md flex items-center justify-center transform"
                  title={isPlaying ? "Pausa" : "Riproduci"}
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-[1.5px]" />}
                </button>

                <button 
                  onClick={handleSkipForward}
                  className="p-2.5 text-on-surface-variant/75 hover:text-primary hover:bg-surface-container rounded-full transition-all cursor-pointer"
                  title="Avanti 15s"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              </div>

              {/* Volume sliders */}
              <div className="flex items-center gap-3 w-full sm:w-auto max-w-[160px]">
                <button 
                  onClick={() => setIsMuted(!isMuted)} 
                  className="text-on-surface-variant hover:text-primary cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-secondary"
                />
              </div>

            </div>

          </div>

          {/* Interactive seek highlights segment */}
          <div className="mt-8 pt-6 border-t border-surface-container/50 bg-[#fbf9f6]/40 p-4 rounded-xl border border-surface-container/30">
            <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-secondary block pb-2">Riflessione Corrente</span>
            <p className="font-serif italic text-sm text-on-surface leading-relaxed animate-fade">
              {activeTrack.transcript[activeTranscriptIndex]?.text || "Attesa della sintonizzazione..."}
            </p>
          </div>

        </div>

        {/* Coda & Transcript details (Right Column, 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Transcript Scroll Area */}
          <div className="bg-white rounded-2xl p-6 border border-surface-container-high/45 shadow-sm flex-1 flex flex-col">
            <h4 className="font-serif text-base text-on-surface font-semibold pb-4 border-b border-surface-container/50">
              Trascrizione Sintonica
            </h4>
            <div className="space-y-4 overflow-y-auto max-h-60 flex-1 pr-1 pt-3">
              {activeTrack.transcript.map((line, idx) => {
                const isActive = idx === activeTranscriptIndex;
                return (
                  <div
                    key={idx}
                    onClick={() => setCurrentTime(line.time)}
                    className={`p-2.5 rounded-lg text-xs leading-relaxed cursor-pointer transition-all duration-300 ${
                      isActive 
                        ? 'bg-secondary/5 font-serif text-secondary italic border-l-4 border-secondary pl-3' 
                        : 'hover:bg-surface-container font-sans text-on-surface-variant/75'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[9px] font-sans font-bold text-on-surface-variant/40 pb-0.5">
                      <span>{line.speaker || 'Voce Narrante'}</span>
                      <span>{formatTime(line.time)}</span>
                    </div>
                    <p>{line.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coda di Ascolto Queue */}
          <div className="bg-white rounded-2xl p-6 border border-surface-container-high/45 shadow-sm">
            <h4 className="font-serif text-base text-on-surface font-semibold pb-4 border-b border-surface-container/50 flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-on-surface-variant" />
              Coda di Ascolto
            </h4>
            
            <div className="space-y-3 pt-3">
              {tracks.map((track) => {
                const isSelected = track.id === activeTrackId;
                return (
                  <div
                    key={track.id}
                    onClick={() => setActiveTrackId(track.id)}
                    className={`flex items-center gap-3.5 p-2 rounded-xl border cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-transparent hover:bg-surface-container'
                    }`}
                  >
                    <img 
                      src={track.coverUrl} 
                      alt={track.title} 
                      className="w-12 h-12 rounded object-cover shadow-sm flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-sans font-semibold text-xs text-on-surface truncate">
                        {track.title}
                      </h5>
                      <p className="font-sans text-[10px] text-on-surface-variant/70 truncate italic">
                        {track.author}
                      </p>
                      <p className="font-sans text-[9px] text-primary font-bold pt-0.5">
                        {track.chapter}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
