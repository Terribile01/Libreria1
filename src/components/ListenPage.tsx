import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Square, Volume2, VolumeX, ListMusic, Headphones, Settings, Loader2 } from 'lucide-react';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  const { data: readings = [], isLoading: isLoadingLibrary } = useQuery({
    queryKey: ['readings', user?.id],
    queryFn: () => BookService.getUserReadings(user!.id),
    enabled: !!user,
  });

  const activeTrack = useMemo(() => {
    const staticTrack = tracks.find(t => t.id === activeTrackId);
    if (staticTrack) return staticTrack;
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
    return tracks[0] || { id: '', title: '', author: '', coverUrl: '', durationSeconds: 0, transcript: [] };
  }, [activeTrackId, tracks, readings]);

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
    return () => window.speechSynthesis.cancel();
  }, []);

  const activeTranscriptIndex = useMemo(() => {
    if (!activeTrack?.transcript) return 0;
    const index = [...activeTrack.transcript].reverse().findIndex((item) => currentTime >= item.time);
    return index !== -1 ? activeTrack.transcript.length - 1 - index : 0;
  }, [currentTime, activeTrack]);

  const handlePlay = () => {
    if (isPaused) { window.speechSynthesis.resume(); setIsPlaying(true); setIsPaused(false); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(fullText);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.volume = isMuted ? 0 : volume;
    utterance.rate = rate;
    utterance.onboundary = (e) => { if (e.name === 'word') setCurrentTime(Math.floor((e.charIndex / fullText.length) * (activeTrack.durationSeconds || 1))); };
    utterance.onend = () => { setIsPlaying(false); setIsPaused(false); setCurrentTime(0); };
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleStop = () => { window.speechSynthesis.cancel(); setIsPlaying(false); setIsPaused(false); setCurrentTime(0); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 md:px-16 space-y-16">
      <div className="text-center md:text-left">
        <h1 className="font-serif text-3xl font-semibold flex items-center justify-center md:justify-start gap-2">
          <Headphones className="w-8 h-8 text-primary" /> Aura di Ascolto
        </h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-10 border shadow-sm">
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <div className="w-32 h-32 rounded-2xl bg-surface-container overflow-hidden relative">
              <img src={activeTrack.coverUrl} className="w-full h-full object-cover" />
            </div>
            <div className="text-center sm:text-left space-y-2">
              <h3 className="font-serif text-2xl">{activeTrack.title}</h3>
              <p className="italic text-sm text-on-surface-variant/70">di {activeTrack.author}</p>
              <div className="flex gap-3 pt-1">
                <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="bg-transparent text-[9px] font-bold uppercase tracking-widest">
                  {voices.filter(v => v.lang.startsWith('it')).map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t">
            <p className="font-serif italic text-sm">{activeTrack.transcript[activeTranscriptIndex]?.text || "In attesa..."}</p>
          </div>
        </div>
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <h4 className="font-serif text-base pb-4 border-b">Trascrizione Sintonica</h4>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {activeTrack.transcript.map((line, idx) => (
                <div key={idx} className={`p-2.5 rounded-lg text-xs ${idx === activeTranscriptIndex ? 'bg-secondary/5 font-serif italic' : ''}`}>
                  <p>{line.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

