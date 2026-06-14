import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, User, Sparkles, Loader2, Mic, MicOff, Volume2 } from 'lucide-react';
import { AIProvider } from '../utils/aiProvider';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Simple markdown-ish formatter for bold and images
const FormattedMessage = ({ content }: { content: string }) => {
  // Regex for images: ![desc](url)
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;

  // Split content by images
  const parts = content.split(imageRegex);
  const elements = [];

  let contentIndex = 0;
  const matches = Array.from(content.matchAll(imageRegex));

  // This is a bit simplified, let's just handle basic bolding and paragraphs
  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // If there are images, we need to interleave them
  if (matches.length > 0) {
    let lastIndex = 0;
    content.replace(imageRegex, (match, alt, url, offset) => {
      // Add text before image
      elements.push(<div key={`text-${offset}`}>{renderText(content.substring(lastIndex, offset))}</div>);
      // Add image
      elements.push(
        <div key={`img-${offset}`} className="my-3 rounded-lg overflow-hidden border border-surface-container-high shadow-sm">
          <img src={url} alt={alt} className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500" />
          <div className="p-2 bg-surface-container-low flex justify-between items-center">
            <span className="text-[10px] text-on-surface-variant italic truncate mr-2">{alt}</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary font-bold hover:underline shrink-0"
              download
            >
              SCARICA
            </a>
          </div>
        </div>
      );
      lastIndex = offset + match.length;
      return match;
    });
    // Add remaining text
    if (lastIndex < content.length) {
      elements.push(<div key="text-end">{renderText(content.substring(lastIndex))}</div>);
    }
    return <div className="space-y-1">{elements}</div>;
  }

  return <div className="whitespace-pre-wrap">{renderText(content)}</div>;
};

export default function RuChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Benvenuta Vale :). Sono Rù, la tua assistente letteraria. \n\nSono qui per accompagnarti in un viaggio tra i libri, la cucina, la natura e ogni bellezza del mondo. \n\n✦ Puoi scrivermi o usare il **microfono** per parlarmi.\n\n✦ Posso anche **leggere le mie risposte** per te: basta cliccare sull\'icona dell\'altoparlante.\n\n✦ Se lo desideri, posso creare delle **immagini poetiche** per illustrare i nostri pensieri.\n\nCome posso rendere speciale la tua giornata oggi?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
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
        // Automatically send after voice input
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

    // Pre-load voices
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

  const speak = (text: string) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean text from markdown for better reading
    const cleanText = text.replace(/!\[.*?\]\(.*?\)/g, '').replace(/\*\*/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'it-IT';

    // Voice selection: Try to find a nice female Italian voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v =>
      v.lang.startsWith('it') &&
      (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('elsa') || v.name.toLowerCase().includes('alice'))
    ) || voices.find(v => v.lang.startsWith('it'));

    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.pitch = 1.1; // Slightly higher/rounder
    utterance.rate = 1.15;  // Slightly faster as requested

    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-all cursor-pointer z-40"
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
            className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-96 h-[500px] bg-surface border border-surface-container-high rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 mx-auto"
          >
            {/* Header */}
            <div className="p-4 bg-primary text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm">Rù</h3>
                  <p className="text-[10px] text-white/70 uppercase font-bold tracking-tighter">TUA ASSISTENTE LETTERARIO</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 font-sans text-sm">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[88%] p-4 rounded-2xl shadow-sm relative group ${
                    m.role === 'user'
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-white text-on-surface rounded-tl-none border border-surface-container-high'
                  }`}>
                    <FormattedMessage content={m.content} />

                    {m.role === 'assistant' && (
                      <div className="flex justify-end mt-2 pt-2 border-t border-surface-container/30">
                        <button
                          onClick={() => speak(m.content)}
                          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary-hover transition-colors cursor-pointer"
                          title="Ascolta la risposta"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          Ascolta
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface-container p-3 rounded-2xl rounded-tl-none border border-surface-container-high flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs italic text-on-surface-variant">Rù sta riflettendo...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={(e) => handleSend(e)} className="p-4 border-t border-surface-container-high bg-surface-container-low">
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Ti ascolto..." : "Scrivi un pensiero..."}
                    className={`w-full pl-4 pr-10 py-2 bg-surface border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-sm font-sans transition-all ${
                      isListening ? 'border-primary ring-1 ring-primary' : 'border-surface-container-high'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary hover:text-primary-hover disabled:opacity-30 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isListening
                      ? 'bg-primary text-white border-primary animate-pulse'
                      : 'bg-surface border-surface-container-high text-on-surface-variant hover:text-primary'
                  }`}
                  title={isListening ? "Interrompi ascolto" : "Parla con Rù"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
