import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { ApiKeyManager } from '../utils/apiKeys';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function RuChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Benvenuto nel Santuario. Sono Rù, la tua guida letteraria. Come posso aiutarti nella tua ricerca di bellezza e conoscenza oggi?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Per ora simuliamo una risposta, dato che non abbiamo un backend reale qui
      // ma il codice è pronto per integrare le chiavi API configurate.
      const geminiKey = ApiKeyManager.get('GEMINI_API_KEY');
      const groqKey = ApiKeyManager.get('GROQ_API_KEY');

      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Ho ricevuto il tuo pensiero: "${userMessage}". Come Rù, sto ancora imparando a connettermi pienamente con le chiavi API configurate (Gemini: ${geminiKey ? 'Presente' : 'Mancante'}, Groq: ${groqKey ? 'Presente' : 'Mancante'}). Presto sarò in grado di offrirti analisi letterarie profonde.`
        }]);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Mi scuso, ho avuto un sussulto nella mia connessione spirituale. Riprova più tardi.' }]);
      setIsLoading(false);
    }
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
            className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-surface border border-surface-container-high rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 bg-primary text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm">Rù</h3>
                  <p className="text-[10px] text-white/70">Assistente del Santuario</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    m.role === 'user'
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-surface-container text-on-surface rounded-tl-none border border-surface-container-high'
                  }`}>
                    {m.content}
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
            <form onSubmit={handleSend} className="p-4 border-t border-surface-container-high bg-surface-container-low">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Scrivi un pensiero..."
                  className="w-full pl-4 pr-10 py-2 bg-surface border border-surface-container-high rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-sm font-sans"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary hover:text-primary-hover cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
