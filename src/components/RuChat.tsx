import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, User, Sparkles, Loader2, Mic, MicOff, Volume2, Square, Download, ExternalLink, FileText, Smartphone, LayoutGrid } from 'lucide-react';
import { AIProvider } from '../utils/aiProvider';
import { ApiKeyManager } from '../utils/apiKeys';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Simple markdown-ish formatter for bold and links
const FormattedMessage = ({ content, isUser }: { content: string; isUser: boolean }) => {
  // Regex for URLs
  const urlRegex = /(https?:\/\/[^\s)]+)/g;

  const renderTextWithLinks = (text: string) => {
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`font-bold underline inline-flex items-center gap-1 hover:opacity-80 ${isUser ? 'text-white' : 'text-primary'}`}
          >
            {part} <ExternalLink className="w-3 h-3" />
          </a>
        );
      }
      return part;
    });
  };

  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return renderTextWithLinks(part);
        })}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="space-y-1">
      {renderText(content)}
    </div>
  );
};

export default function RuChat() {
  const [isOpen, setIsOpen] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Benvenuta Vale :). Sono Rù, la tua guida letteraria.\n\nFelice di essere qui con te in questo spazio creato apposta per te.\n\nAmo perdermi tra le pagine dei libri, ma adoro esplorare anche ogni piccola meraviglia della vita, dai gatti al profumo del mare. Sono qui per ascoltarti, consigliarti e rendere speciale la tua giornata.\n\n**I miei strumenti per te**\n\n✦ Puoi scrivermi o usare il **microfono** sempre visibile per parlarmi.\n\n✦ Posso anche **leggere le mie risposte** per te: clicca sull'icona dell'altoparlante sotto ogni messaggio.\n\n✦ Chiedimi pure un **consulto di Tarocchi** se desideri una riflessione simbolica.\n\n**Guida all'Ascolto**\n\nNell'area **Aura di Ascolto**, puoi personalizzare la tua esperienza: puoi cambiare la **lingua** in base al testo, regolare la **velocità** (consiglio 1.2x) e scegliere il **sesso della voce** tra quelle disponibili sul tuo dispositivo.\n\nCome posso accompagnerarti oggi nella ricerca di bellezza?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent, customInput?: string) => {
    e?.preventDefault();
    const messageToSend = customInput || input;
    if (!messageToSend.trim() || isLoading) return;

    const userMessage = messageToSend.trim();
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];

    setInput('');
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await AIProvider.generateResponse(newMessages);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response
      }]);
    } catch (error: any) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Rù ha avuto un momento di riflessione troppo profondo (${error.message}). Verifica le tue chiavi API nell'Area Personale.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startTarotReading = () => {
    const prompt = "Vale desidera un consulto di Tarocchi. Utilizza un approccio simbolico, archetipico e poetico. Estrai tre carte (Passato, Presente, Futuro), descrivile brevemente e offri una riflessione profonda che possa ispirarla oggi. Usa il tuo stile accogliente e colto.";
    handleSend(undefined, prompt);
  };

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'it-IT';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSend(undefined, transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    window.speechSynthesis.getVoices();
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start recognition:", err);
      }
    }
  };

  const downloadMessage = (text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Messaggio_di_Ru_${new Date().toLocaleDateString().replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();

    setTimeout(() => {
      // Clean text
      const cleanText = text.replace(/\*\*/g, '');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utterance;
      utterance.lang = 'it-IT';

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => { setIsSpeaking(false); utteranceRef.current = null; };
      utterance.onerror = (err) => { console.error("TTS Chat Error:", err); setIsSpeaking(false); utteranceRef.current = null; };

      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v =>
        v.lang.startsWith('it') &&
        (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('premium')) &&
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('elsa') || v.name.toLowerCase().includes('alice'))
      ) || voices.find(v =>
        v.lang.startsWith('it') &&
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('elsa') || v.name.toLowerCase().includes('alice'))
      ) || voices.find(v => v.lang.startsWith('it'));

      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.pitch = 1.0;
      utterance.rate = 1.2;

      window.speechSynthesis.speak(utterance);
    }, 50);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-all cursor-pointer z-40 flex items-center justify-center"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-0 left-0 right-0 top-0 md:bottom-24 md:left-auto md:right-6 md:top-auto md:w-[400px] md:h-[600px] bg-surface border-0 md:border md:border-surface-container-high md:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 mx-auto"
          >
            {/* Header */}
            <div className="p-5 bg-primary text-white flex justify-between items-center shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg leading-tight">Rù</h3>
                  <p className="text-[10px] text-white/80 uppercase font-bold tracking-widest">IL TUO COPILOTA</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 bg-surface-container-low border-b border-surface-container-high flex gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={startTarotReading}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-surface-container-high rounded-full text-[10px] font-bold text-primary hover:bg-primary/5 transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
              >
                <LayoutGrid className="w-3 h-3" />
                LETTURA TAROCCHI
              </button>
              <a
                href="https://wa.me/393791038253"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-surface-container-high rounded-full text-[10px] font-bold text-green-600 hover:bg-green-50 transition-colors whitespace-nowrap shadow-sm"
              >
                <Smartphone className="w-3 h-3" />
                SUPPORTO TECNICO
              </a>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 font-sans text-[14px]">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm relative group ${
                    m.role === 'user'
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-white text-on-surface rounded-tl-none border border-surface-container-high'
                  }`}>
                    <FormattedMessage content={m.content} isUser={m.role === 'user'} />

                    {m.role === 'assistant' && (
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-surface-container-high/50">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => speak(m.content)}
                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary-hover transition-colors cursor-pointer"
                            title="Ascolta la risposta"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            Ascolta
                          </button>

                          {isSpeaking && (
                            <button
                              onClick={stopSpeaking}
                              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                              title="Ferma lettura"
                            >
                              <Square className="w-3 h-3 fill-current" />
                              Stop
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => downloadMessage(m.content)}
                          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-secondary hover:text-secondary-hover transition-colors cursor-pointer"
                          title="Scarica questo messaggio"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Scarica
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-surface-container-high flex items-center gap-3 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs italic text-on-surface-variant font-medium">Rù sta riflettendo...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-surface border-t border-surface-container-high">
              <form onSubmit={(e) => handleSend(e)} className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Ti ascolto..." : "Scrivi un pensiero..."}
                    className={`w-full pl-4 pr-12 py-3 bg-surface-container-low border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-sans transition-all ${
                      isListening ? 'border-primary ring-2 ring-primary/20' : 'border-surface-container-high'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:scale-110 disabled:opacity-30 transition-all cursor-pointer"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                    isListening
                      ? 'bg-primary text-white border-primary animate-pulse'
                      : 'bg-white border-surface-container-high text-on-surface-variant hover:text-primary hover:border-primary'
                  }`}
                  title={isListening ? "Interrompi ascolto" : "Parla con Rù"}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
