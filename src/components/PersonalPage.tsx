import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Lock, Shield, Key, Eye, EyeOff,
  CheckCircle2, AlertCircle, LogOut, Sparkles, Check,
  Bookmark, Database, Copy, Heart, X, Clock, ExternalLink, BookOpen, Headphones, RotateCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiKeyManager, ApiKeyStructure } from '../utils/apiKeys';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookService, DiaryService, BookmarkService } from '../utils/database';

interface PersonalPageProps {
  onNavigateToHome: () => void;
  onNavigateToListen: (bookId: string) => void;
  onNavigateToLibrary: () => void;
  onNavigateToDiary: () => void;
}

export default function PersonalPage({ onNavigateToHome, onNavigateToListen, onNavigateToLibrary, onNavigateToDiary }: PersonalPageProps) {
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([]);

  React.useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, []);

  const { 
    user: currentUser,
    profile,
    isAuthenticated, 
    login, 
    register, 
    logout, 
    updateProfile,
  } = useAuth();

  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'api' | 'database'>('dashboard');

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authIsLoading, setAuthIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerCategory, setDrawerCategory] = useState<string | null>(null);

  // Modal Detail State
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);
  const [detailType, setDetailType] = useState<'book' | 'note' | 'bookmark' | null>(null);

  const [editUsername, setEditUsername] = useState('');
  const [profileMessage, setProfileMessage] = useState({ text: '', type: 'success' });

  // Sincronizza editUsername quando il profilo viene caricato
  React.useEffect(() => {
    if (profile?.username) {
      setEditUsername(profile.username);
    }
  }, [profile]);

  // Fetch Stats dynamically
  const { data: readings = [] } = useQuery({
    queryKey: ['readings', currentUser?.id],
    queryFn: () => BookService.getUserReadings(currentUser!.id),
    enabled: !!currentUser,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', currentUser?.id],
    queryFn: () => DiaryService.getUserNotes(currentUser!.id),
    enabled: !!currentUser,
  });

  const { data: dbBookmarks = [] } = useQuery({
    queryKey: ['bookmarks', currentUser?.id],
    queryFn: () => BookmarkService.getUserBookmarks(currentUser!.id),
    enabled: !!currentUser,
  });

  const stats = {
    total: readings.length,
    favorites: readings.filter(r => r.status === 'Preferiti').length,
    completed: readings.filter(r => r.status === 'Letti').length,
    toRead: readings.filter(r => r.status === 'Da Leggere').length,
    notes: notes.length,
    bookmarks: dbBookmarks.length
  };

  // Find "In Lettura" (most recent book added that's not marked as Letti)
  const inReading = [...readings]
    .filter(r => r.status !== 'Letti')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  // Activities
  const activities = [
    ...readings.map(r => ({ type: 'reading', date: r.created_at, data: r })),
    ...notes.map(n => ({ type: 'note', date: n.created_at, data: n }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 4);

  const [apiKeys, setApiKeys] = useState<ApiKeyStructure[]>(ApiKeyManager.listKeys());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [keyValueInput, setKeyValueInput] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    if (!email || !password) {
      setAuthError('Compila tutti i campi richiesti.');
      return;
    }
    setAuthIsLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        setAuthSuccess('Accesso effettuato con successo!');
      } else {
        setAuthError(res.error || "Errore sconosciuto di login.");
      }
    } catch {
      setAuthError('Errore di connessione al sistema di autenticazione.');
    } finally {
      setAuthIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    
    if (!username || !email || !password || !confirmPassword) {
      setAuthError('Compila tutti i campi richiesti.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Le password inserite non coincidono.');
      return;
    }

    setAuthIsLoading(true);
    try {
      const res = await register(username, email, password);
      if (res.success) {
        setAuthSuccess('Registrazione completata! Benvenuto nel Santuario.');
      } else {
        setAuthError(res.error || "Errore di registrazione.");
      }
    } catch {
      setAuthError('Impossibile completare la registrazione.');
    } finally {
      setAuthIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage({ text: '', type: 'success' });
    if (!editUsername) {
      setProfileMessage({ text: 'Il nome utente non può essere vuoto.', type: 'error' });
      return;
    }
    const res = await updateProfile(editUsername);
    if (res.success) {
      setProfileMessage({ text: 'Profilo salvato correttamente!', type: 'success' });
      // Invalida le query per rinfrescare i dati ovunque
      queryClient.invalidateQueries({ queryKey: ['profile', currentUser?.id] });
    } else {
      setProfileMessage({ text: res.error || 'Errore salvataggio.', type: 'error' });
    }
  };

  const handleSaveLocalKey = (envVar: string) => {
    ApiKeyManager.setLocal(envVar, keyValueInput);
    setApiKeys(ApiKeyManager.listKeys());
    setEditingKey(null);
    setKeyValueInput('');
  };

  const handleRemoveLocalKey = (envVar: string) => {
    ApiKeyManager.setLocal(envVar, '');
    setApiKeys(ApiKeyManager.listKeys());
  };

  const renderDrawerContent = () => {
    if (!drawerCategory) return null;

    let items: any[] = [];
    if (drawerCategory === 'Note') {
      items = notes;
    } else if (drawerCategory === 'Segnalibri') {
      items = dbBookmarks;
    } else {
      items = readings.filter(r => {
        if (drawerCategory === 'Libri') return true;
        return r.status === drawerCategory;
      });
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="font-serif text-2xl font-semibold flex items-center gap-2">
            {drawerCategory === 'Libri' && <Bookmark className="w-6 h-6 text-primary" />}
            {drawerCategory === 'Preferiti' && <Heart className="w-6 h-6 text-rose-500" />}
            {drawerCategory === 'Letti' && <CheckCircle2 className="w-6 h-6 text-green-600" />}
            {drawerCategory === 'Da Leggere' && <Sparkles className="w-6 h-6 text-amber-500" />}
            {drawerCategory === 'Note' && <Database className="w-6 h-6 text-blue-500" />}
            {drawerCategory === 'Segnalibri' && <Bookmark className="w-6 h-6 text-amber-600" />}
            {drawerCategory}
          </h2>
          <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4 max-h-[calc(100vh-var(--header-height)-40px)] overflow-y-auto pr-2 custom-scrollbar">
          {items.length === 0 ? (
            <p className="text-center py-10 text-on-surface-variant italic">Nessun elemento in questa categoria.</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedDetailItem(item);
                  setDetailType(drawerCategory === 'Note' ? 'note' : (drawerCategory === 'Segnalibri' ? 'bookmark' : 'book'));
                }}
                className="bg-surface-container-lowest border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              >
                {drawerCategory === 'Note' ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm text-primary">{item.title}</h4>
                      <span className="text-[10px] text-on-surface-variant flex items-center gap-1 whitespace-nowrap">
                        <Clock className="w-3 h-3" /> {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">{item.content}</p>
                    {item.book && (
                      <div className="pt-2 border-t mt-2 flex items-center gap-2">
                        <img src={item.book.coverUrl} className="w-6 h-8 object-cover rounded shadow-sm" alt="" />
                        <span className="text-[10px] font-semibold italic text-secondary">Rif: {item.book.title}</span>
                      </div>
                    )}
                  </div>
                ) : drawerCategory === 'Segnalibri' ? (
                   <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-xs font-bold text-amber-800 line-clamp-2">{item.text}</p>
                        <span className="text-[10px] text-on-surface-variant flex items-center gap-1 whitespace-nowrap">
                          <Clock className="w-3 h-3" /> {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                         <img src={item.book?.coverUrl} className="w-6 h-8 object-cover rounded shadow-sm" alt="" />
                         <span className="text-[9px] font-semibold italic text-secondary">{item.book?.title}</span>
                         <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold ml-auto">{Math.floor(item.time / 60)}:{(item.time % 60).toString().padStart(2, '0')}</span>
                      </div>
                   </div>
                ) : (
                  <div className="flex gap-4">
                    <img src={item.book?.coverUrl} className="w-12 h-18 object-cover rounded shadow-sm flex-shrink-0" alt="" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm truncate">{item.book?.title}</h4>
                        <span className="text-[10px] text-on-surface-variant flex items-center gap-1 whitespace-nowrap">
                          <Clock className="w-3 h-3" /> {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-secondary italic">di {item.book?.author}</p>
                      <div className="pt-1 flex flex-wrap gap-2">
                        <span className="text-[9px] px-1.5 py-0.5 bg-surface-container-high rounded-full font-mono text-on-surface-variant">ID: {item.book?.id.slice(0, 8)}...</span>
                        {item.note && <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-semibold">Ha riflessioni</span>}
                        {item.status && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                          item.status === 'Letti' ? 'bg-green-100 text-green-700' :
                          item.status === 'Preferiti' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>{item.status}</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!selectedDetailItem || !detailType) return null;

    const item = selectedDetailItem;
    const book = detailType === 'book' ? item.book : (detailType === 'bookmark' ? item.book : item.book);

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-surface max-w-xl w-full rounded-2xl overflow-hidden shadow-2xl border"
        >
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                {book && <img src={book.coverUrl} className="w-20 h-28 object-cover rounded-lg shadow-md" alt="" />}
                <div className="space-y-1">
                  <h3 className="font-serif text-xl font-bold">{detailType === 'note' ? item.title : (detailType === 'bookmark' ? 'Segnalibro' : book?.title)}</h3>
                  <p className="text-sm text-secondary italic">
                    {detailType === 'note' ? (book ? `Rif: ${book.title}` : 'Nota Generale') : (detailType === 'bookmark' ? `Rif: ${book?.title}` : `di ${book?.author}`)}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] px-2 py-0.5 bg-surface-container rounded-full font-bold uppercase tracking-widest text-on-surface-variant">
                      {detailType === 'book' ? item.status : detailType}
                    </span>
                    <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => { setSelectedDetailItem(null); setDetailType(null); }} className="p-2 hover:bg-surface-container rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-surface-container-low/40 p-5 rounded-xl border-l-4 border-primary">
                <p className="text-sm leading-relaxed text-on-surface whitespace-pre-wrap italic">
                  {detailType === 'note' ? item.content : (detailType === 'bookmark' ? `«${item.text}»` : book?.description)}
                </p>
              </div>

              {detailType === 'bookmark' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg border border-amber-100">
                  <Bookmark className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-800">Punto di sintonizzazione: {Math.floor(item.time / 60)}:{(item.time % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
            </div>

            <div className="pt-6 border-t flex flex-wrap gap-3">
              {detailType === 'book' && (
                <>
                  <button onClick={() => { onNavigateToLibrary(); setSelectedDetailItem(null); }} className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2">
                    <Bookmark className="w-4 h-4" /> Leggi
                  </button>
                  <button onClick={() => { onNavigateToListen(book.id); setSelectedDetailItem(null); }} className="flex-1 px-4 py-2.5 border border-secondary text-secondary rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2">
                    <Headphones className="w-4 h-4" /> Ascolta
                  </button>
                </>
              )}
              {detailType === 'note' && (
                <>
                  <button
                    onClick={() => {
                      window.speechSynthesis.cancel();
                      setTimeout(() => {
                        const bookRef = item.book ? `Riferimento libro: ${item.book.title}. ` : "Pensiero libero. ";
                        const dateRef = `Data della nota: ${new Date(item.created_at).toLocaleDateString()}. `;
                        const fullSpeech = `${bookRef} ${dateRef} Titolo: ${item.title}. Riflessione: ${item.content}`;

                        const utterance = new SpeechSynthesisUtterance(fullSpeech);
                        utteranceRef.current = utterance;
                        utterance.rate = 1.2;
                        utterance.lang = 'it-IT';

                        const preferred = voices.find(v =>
                          v.lang.startsWith('it') &&
                          (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural')) &&
                          (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('alice'))
                        ) || voices.find(v => v.lang.startsWith('it')) || voices[0];

                        if (preferred) utterance.voice = preferred;

                        window.speechSynthesis.speak(utterance);
                      }, 50);
                    }}
                    className="flex-1 px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2"
                  >
                    <Headphones className="w-4 h-4" /> Ascolta Nota
                  </button>
                  <button onClick={() => { onNavigateToDiary(); setSelectedDetailItem(null); }} className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2">
                    <Database className="w-4 h-4" /> Gestisci in Note
                  </button>
                </>
              )}
              {detailType === 'bookmark' && (
                <button onClick={() => { onNavigateToListen(book.id); setSelectedDetailItem(null); }} className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2">
                  <RotateCw className="w-4 h-4" /> Riprendi
                </button>
              )}
              <button onClick={() => { setSelectedDetailItem(null); setDetailType(null); }} className="px-6 py-2.5 border rounded-xl text-xs font-bold uppercase">Chiudi</button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-surface-container/30 pb-6">
        <div>
          <span className="text-primary font-sans font-semibold tracking-widest text-xs uppercase flex items-center gap-1.5 justify-center md:justify-start">
            <Shield className="w-3.5 h-3.5" /> Area Personale Cloud
          </span>
          <h1 className="font-serif text-3xl md:text-4xl text-on-surface font-semibold tracking-tight text-center md:text-left mt-1">
            La Tua Scrivania
          </h1>
        </div>
        <button onClick={onNavigateToHome} className="px-4 py-2 border rounded-xl text-xs uppercase font-bold cursor-pointer transition-all">← Torna alla Home</button>
      </div>

      {!isAuthenticated || !currentUser ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 bg-surface-container/40 p-6 rounded-2xl">
             <h3 className="font-serif text-2xl font-semibold text-primary mb-4">Autenticazione Supabase Cloud</h3>
             <p className="text-sm text-on-surface-variant leading-relaxed">Il Santuario è ora migrato nel cloud. I tuoi dati sono protetti e sincronizzati su tutti i dispositivi.</p>
          </div>

          <div className="lg:col-span-7 bg-surface-container-lowest border p-6 md:p-8 rounded-2xl">
            <div className="flex border-b mb-6">
              <button onClick={() => setIsRegisterMode(false)} className={`flex-1 pb-3 text-center text-sm uppercase font-bold transition-all ${!isRegisterMode ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant/50'}`}>Accedi</button>
              <button onClick={() => setIsRegisterMode(true)} className={`flex-1 pb-3 text-center text-sm uppercase font-bold transition-all ${isRegisterMode ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant/50'}`}>Crea Account</button>
            </div>

            <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4">
              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5">Nome Utente</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2.5 bg-surface border rounded-xl text-xs" required />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-surface border rounded-xl text-xs" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-surface border rounded-xl text-xs" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5">Conferma Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 bg-surface border rounded-xl text-xs" required />
                </div>
              )}

              {!isRegisterMode && (
                <div className="flex items-center gap-2 px-1">
                   <input
                     type="checkbox"
                     id="rememberMe"
                     checked={rememberMe}
                     onChange={(e) => setRememberMe(e.target.checked)}
                     className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                   />
                   <label htmlFor="rememberMe" className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 cursor-pointer">Ricordami</label>
                </div>
              )}

              {authError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">{authError}</div>}
              {authSuccess && <div className="p-3 bg-green-50 text-green-700 text-xs rounded-xl">{authSuccess}</div>}
              <button type="submit" disabled={authIsLoading} className="w-full bg-primary text-white py-3 rounded-xl font-bold text-xs uppercase shadow-md disabled:opacity-50">
                {authIsLoading ? 'Elaborazione...' : (isRegisterMode ? 'Registrati' : 'Accedi')}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-surface-container-low border p-5 rounded-2xl text-center space-y-3">
              <div className="w-16 h-16 rounded-full mx-auto border-2 border-primary/20 overflow-hidden">
                <img src={profile?.avatar_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330"} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold">@{profile?.username || 'Ospite'}</h3>
                <p className="text-[11px] text-on-surface-variant break-all">{currentUser.email}</p>
                <div className="mt-1 px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold uppercase rounded-full inline-block">{profile?.role || 'Lettore'}</div>
              </div>
              <button onClick={logout} className="w-full py-2 bg-red-50 text-red-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"><LogOut className="w-3.5 h-3.5" /> Esci</button>
            </div>
            <div className="bg-surface-container-lowest border rounded-2xl p-2.5 flex flex-col gap-1">
              <button onClick={() => setActiveTab('dashboard')} className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 ${activeTab === 'dashboard' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}><User className="w-4 h-4" /> Pannello</button>
              {profile?.role === 'Amministratore' && (
                <>
                  <button onClick={() => setActiveTab('api')} className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 ${activeTab === 'api' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}><Key className="w-4 h-4" /> Chiavi API</button>
                  <button onClick={() => setActiveTab('database')} className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 ${activeTab === 'database' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}><Database className="w-4 h-4" /> Database</button>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-9 bg-surface-container-lowest border p-6 md:p-8 rounded-2xl min-h-[480px]">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <h2 className="font-serif text-2xl font-semibold">Profilo Lettore Cloud</h2>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <button
                    onClick={() => { setDrawerCategory('Libri'); setIsDrawerOpen(true); }}
                    className="bg-surface-container/40 p-4 border rounded-xl text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                  >
                    <Bookmark className="w-5 h-5 text-primary mx-auto mb-1.5 group-hover:scale-110 transition-transform"/>
                    <strong className="text-xl block">{stats.total}</strong>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant/70">Libri</span>
                  </button>
                  <button
                    onClick={() => { setDrawerCategory('Preferiti'); setIsDrawerOpen(true); }}
                    className="bg-surface-container/40 p-4 border rounded-xl text-center hover:border-rose-500/50 hover:bg-rose-500/5 transition-all cursor-pointer group"
                  >
                    <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1.5 group-hover:scale-110 transition-transform"/>
                    <strong className="text-xl block">{stats.favorites}</strong>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant/70">Preferiti</span>
                  </button>
                  <button
                    onClick={() => { setDrawerCategory('Letti'); setIsDrawerOpen(true); }}
                    className="bg-surface-container/40 p-4 border rounded-xl text-center hover:border-green-600/50 hover:bg-green-600/5 transition-all cursor-pointer group"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform"/>
                    <strong className="text-xl block">{stats.completed}</strong>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant/70">Letti</span>
                  </button>
                  <button
                    onClick={() => { setDrawerCategory('Da Leggere'); setIsDrawerOpen(true); }}
                    className="bg-surface-container/40 p-4 border rounded-xl text-center hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer group"
                  >
                    <Sparkles className="w-5 h-5 text-amber-500 mx-auto mb-1.5 group-hover:scale-110 transition-transform"/>
                    <strong className="text-xl block">{stats.toRead}</strong>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant/70">Da Leggere</span>
                  </button>
                  <button
                    onClick={() => { setDrawerCategory('Note'); setIsDrawerOpen(true); }}
                    className="bg-surface-container/40 p-4 border rounded-xl text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
                  >
                    <Database className="w-5 h-5 text-blue-500 mx-auto mb-1.5 group-hover:scale-110 transition-transform"/>
                    <strong className="text-xl block">{stats.notes}</strong>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant/70">Note</span>
                  </button>
                  <button
                    onClick={() => { setDrawerCategory('Segnalibri'); setIsDrawerOpen(true); }}
                    className="bg-surface-container/40 p-4 border rounded-xl text-center hover:border-amber-600/50 hover:bg-amber-600/5 transition-all cursor-pointer group"
                  >
                    <Bookmark className="w-5 h-5 text-amber-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform"/>
                    <strong className="text-xl block">{stats.bookmarks}</strong>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant/70">Segnalibri</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Widget In Lettura */}
                  <div className="bg-surface-container/20 border rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> In Lettura
                    </h3>
                    {inReading ? (
                      <div className="flex gap-4 items-center">
                        <img src={inReading.book?.coverUrl} className="w-16 h-24 object-cover rounded-lg shadow-md" alt="" />
                        <div className="space-y-1">
                          <h4 className="font-serif text-lg font-bold leading-tight">{inReading.book?.title}</h4>
                          <p className="text-xs text-secondary italic">di {inReading.book?.author}</p>
                          <div className="pt-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase">{inReading.status}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs italic text-on-surface-variant py-4">Nessun libro attualmente in lettura. Scegline uno dalla libreria!</p>
                    )}
                  </div>

                  {/* Attività Recente */}
                  <div className="bg-surface-container/20 border rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Attività Recente
                    </h3>
                    <div className="space-y-3">
                      {activities.length > 0 ? activities.map((act, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <div className={`p-1.5 rounded-full mt-0.5 ${act.type === 'note' ? 'bg-blue-100 text-blue-600' : 'bg-primary/10 text-primary'}`}>
                            {act.type === 'note' ? <Database className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] leading-tight text-on-surface">
                              {act.type === 'note' ? (
                                <>Aggiunta nota <strong>{(act.data as any).title}</strong></>
                              ) : (
                                <>Aggiunto <strong>{(act.data as any).book?.title}</strong> a {(act.data as any).status}</>
                              )}
                            </p>
                            <span className="text-[9px] text-on-surface-variant">{new Date(act.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )) : (
                        <p className="text-xs italic text-on-surface-variant py-2">Ancora nessuna attività registrata.</p>
                      )}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="bg-surface p-5 border rounded-xl space-y-4">
                  <h3 className="font-serif text-lg font-semibold border-b pb-2">Impostazioni Profilo</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <label className="text-xs font-bold uppercase">Nome Utente</label>
                    <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full px-3.5 py-2 border rounded-lg text-xs" />
                  </div>
                  {profileMessage.text && <div className={`p-2 text-xs rounded-lg ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{profileMessage.text}</div>}
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-xs font-bold uppercase rounded-xl">Aggiorna</button>
                </form>
              </div>
            )}

            {activeTab === 'database' && profile?.role === 'Amministratore' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="font-serif text-2xl font-semibold">Gestione Database & Cloud</h2>
                </div>

                <div className="bg-red-50 border border-red-100 p-4 rounded-xl space-y-3">
                  <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> PATCH DI EMERGENZA (DIARIO & LIBRI)
                  </h3>
                  <p className="text-xs text-red-700 leading-relaxed font-bold">
                    Esegui questo script per risolvere l'errore 23503 (Foreign Key) e il 400 (Join failed) su Notes.
                  </p>
                  <div className="relative group">
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-[10px] overflow-x-auto leading-relaxed">
{`-- 1. RENDERE book_id OPZIONALE IN NOTES
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_book_id_fkey;
ALTER TABLE notes ALTER COLUMN book_id DROP NOT NULL;
ALTER TABLE notes ADD CONSTRAINT notes_book_id_fkey FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL;

-- 2. ABILITA LETTURA PUBBLICA SU BOOKS (Necessaria per il JOIN)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Libri leggibili da tutti" ON books;
CREATE POLICY "Libri leggibili da tutti" ON books FOR SELECT USING (true);

-- 3. PERMESSI DI SCHEMA
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE books TO anon, authenticated;
GRANT ALL ON TABLE notes TO authenticated;`}
                    </pre>
                    <button
                      onClick={() => {
                        const sql = `ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_book_id_fkey;\nALTER TABLE notes ALTER COLUMN book_id DROP NOT NULL;\nALTER TABLE notes ADD CONSTRAINT notes_book_id_fkey FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL;\nALTER TABLE books ENABLE ROW LEVEL SECURITY;\nDROP POLICY IF EXISTS "Libri leggibili da tutti" ON books; CREATE POLICY "Libri leggibili da tutti" ON books FOR SELECT USING (true);\nGRANT USAGE ON SCHEMA public TO anon, authenticated;\nGRANT SELECT ON TABLE books TO anon, authenticated;\nGRANT ALL ON TABLE notes TO authenticated;`;
                        navigator.clipboard.writeText(sql);
                        alert('Patch di emergenza copiata!');
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-white text-[10px]"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copia Patch
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-3">
                  <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                    <Database className="w-4 h-4" /> Script di Configurazione Completo
                  </h3>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Configurazione per Diario e Sistema Ibrido (Readings).
                  </p>
                  <div className="relative group">
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-[10px] overflow-x-auto leading-relaxed">
{`-- 1. AGGIORNAMENTO TABELLA READINGS
ALTER TABLE readings
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'external' CHECK (source_type IN ('internal', 'external')),
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS external_url TEXT,
ADD COLUMN IF NOT EXISTS note TEXT;

-- 2. TABELLA NOTES PER DIARIO
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREAZIONE BUCKET PER FILE PDF/EPUB
INSERT INTO storage.buckets (id, name, public)
VALUES ('library-files', 'library-files', false)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS PER STORAGE (ACCESSO PRIVATO)
-- Permetti lettura dei propri file
CREATE POLICY "Lettura file personali" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'library-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Permetti caricamento nella propria cartella
CREATE POLICY "Caricamento file personali" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'library-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Permetti eliminazione dei propri file
CREATE POLICY "Cancellazione file personali" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'library-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. TABELLA BOOKMARKS (SEGNALIBRI)
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books ON DELETE CASCADE NOT NULL,
  time FLOAT NOT NULL,
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Utente gestisce i propri segnalibri" ON bookmarks FOR ALL USING (auth.uid() = user_id);
GRANT ALL ON TABLE bookmarks TO authenticated;`}
                    </pre>
                    <button
                      onClick={() => {
                        const sql = `-- RISOLUZIONE PERMISSION DENIED\nGRANT ALL ON TABLE books TO authenticated, anon, service_role;\nDROP POLICY IF EXISTS "Chiunque può inserire libri" ON books; CREATE POLICY "Chiunque può inserire libri" ON books FOR INSERT WITH CHECK (true);\n\n-- AGGIORNAMENTO SCHEMA\nALTER TABLE books ADD COLUMN IF NOT EXISTS file_url TEXT, ADD COLUMN IF NOT EXISTS external_url TEXT;\n\nALTER TABLE readings ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'external' CHECK (source_type IN ('internal', 'external')), ADD COLUMN IF NOT EXISTS file_path TEXT, ADD COLUMN IF NOT EXISTS external_url TEXT, ADD COLUMN IF NOT EXISTS note TEXT;\n\nCREATE TABLE IF NOT EXISTS notes (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL, book_id UUID REFERENCES books ON DELETE SET NULL, title TEXT NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());\n\n-- BUCKET\nINSERT INTO storage.buckets (id, name, public) VALUES ('library-files', 'library-files', false) ON CONFLICT (id) DO NOTHING;\n\n-- POLICIES STORAGE\nCREATE POLICY "Lettura file personali" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'library-files' AND (storage.foldername(name))[1] = auth.uid()::text);\nCREATE POLICY "Caricamento file personali" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'library-files' AND (storage.foldername(name))[1] = auth.uid()::text);\nCREATE POLICY "Cancellazione file personali" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'library-files' AND (storage.foldername(name))[1] = auth.uid()::text);`;
                        navigator.clipboard.writeText(sql);
                        alert('Script SQL completo copiato!');
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-white text-[10px]"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copia Tutto
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl space-y-3">
                   <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                     <AlertCircle className="w-4 h-4" /> Note Importanti
                   </h3>
                   <ul className="text-xs text-amber-700 space-y-2 list-disc pl-4 leading-relaxed">
                     <li>Se ricevi errore "policy already exists", significa che le policy sono già attive.</li>
                     <li>La cartella nello storage verrà creata automaticamente come <code>ID_UTENTE/nome-file.pdf</code>.</li>
                     <li>Il limite di caricamento predefinito di Supabase è 50MB.</li>
                   </ul>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6">
                 <h2 className="font-serif text-2xl font-semibold">Chiavi API</h2>
                 <div className="space-y-4">
                   {apiKeys.map(key => (
                     <div key={key.envVar} className="border p-4 rounded-xl space-y-2">
                        <div className="flex justify-between border-b pb-2"><span className="text-xs font-bold">{key.name}</span><span className="text-[10px]">{key.isConfigured ? '✓ Attiva' : 'Mancante'}</span></div>
                        <div className="flex justify-between items-center gap-4">
                           <p className="text-[10px] text-on-surface-variant flex-1">{key.description}</p>
                           {editingKey === key.envVar ? (
                             <div className="flex gap-1.5">
                               <input type="text" value={keyValueInput} onChange={(e) => setKeyValueInput(e.target.value)} className="px-2 py-1 border rounded text-xs w-32" />
                               <button onClick={() => handleSaveLocalKey(key.envVar)} className="p-1 bg-green-600 text-white rounded"><Check className="w-4 h-4"/></button>
                             </div>
                           ) : (
                             <button onClick={() => setEditingKey(key.envVar)} className="px-3 py-1 border rounded-xl text-[10px] font-bold">Imposta</button>
                           )}
                        </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedDetailItem && renderDetailModal()}
      </AnimatePresence>

      {/* Side Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface shadow-2xl z-[70] p-6 border-l"
            >
              {renderDrawerContent()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
