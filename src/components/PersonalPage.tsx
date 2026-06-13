import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Lock, Shield, Key, Eye, EyeOff,
  CheckCircle2, AlertCircle, LogOut, Sparkles, Check,
  Bookmark, Database, Copy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiKeyManager, ApiKeyStructure } from '../utils/apiKeys';

interface PersonalPageProps {
  onNavigateToHome: () => void;
  booksCount: {
    total: number;
    favorites: number;
    completed: number;
    toRead: number;
  };
  notesCount: number;
}

export default function PersonalPage({ onNavigateToHome, booksCount, notesCount }: PersonalPageProps) {
  const { 
    user: currentUser,
    profile,
    isAuthenticated, 
    login, 
    register, 
    logout, 
    updateProfile,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'api' | 'database'>('dashboard');

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authIsLoading, setAuthIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [editUsername, setEditUsername] = useState(profile?.username || '');
  const [profileMessage, setProfileMessage] = useState({ text: '', type: 'success' });

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

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-surface-container/30 pb-6">
        <div>
          <span className="text-primary font-sans font-semibold tracking-widest text-xs uppercase flex items-center gap-1.5 justify-center md:justify-start">
            <Shield className="w-3.5 h-3.5" /> Area Personale Cloud
          </span>
          <h1 className="font-serif text-3xl md:text-4xl text-on-surface font-semibold tracking-tight text-center md:text-left mt-1">
            Il Tuo Refettorio Digitale
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-surface-container/40 p-4 border rounded-xl text-center"><Bookmark className="w-5 h-5 text-primary mx-auto mb-1.5"/><strong className="text-xl block">{booksCount.total}</strong> Libri</div>
                  {/* ... stats ... */}
                </div>
                <form onSubmit={handleUpdateProfile} className="bg-surface p-5 border rounded-xl space-y-4">
                  <h3 className="font-serif text-lg font-semibold border-b pb-2">Modifica Profilo</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <label className="text-xs font-bold uppercase">Nome Utente</label>
                    <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full px-3.5 py-2 border rounded-lg text-xs" />
                  </div>
                  {profileMessage.text && <div className={`p-2 text-xs rounded-lg ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{profileMessage.text}</div>}
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-xs font-bold uppercase rounded-xl">Salva</button>
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
                    <Shield className="w-4 h-4" /> RISOLUZIONE PERMISSION DENIED (TABELLA BOOKS)
                  </h3>
                  <p className="text-xs text-red-700 leading-relaxed font-bold">
                    Esegui questo script nel SQL Editor di Supabase per sbloccare definitivamente l'inserimento dei libri.
                  </p>
                  <div className="relative group">
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-[10px] overflow-x-auto leading-relaxed">
{`-- 1. SBLOCCO PERMESSI SCHEMA E TABELLE
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- 2. DISABILITA O REIMPOSTA RLS SU BOOKS (SCELTA AGGRESSIVA PER RISOLVERE)
-- Se vuoi risolvere subito, puoi anche disabilitare RLS per la tabella books:
-- ALTER TABLE books DISABLE ROW LEVEL SECURITY;

-- OPPURE esegui queste policy ultra-permissive:
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Libri leggibili da tutti" ON books;
CREATE POLICY "Libri leggibili da tutti" ON books FOR SELECT USING (true);

DROP POLICY IF EXISTS "Chiunque può inserire libri" ON books;
CREATE POLICY "Chiunque può inserire libri" ON books FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Chiunque può aggiornare libri" ON books;
CREATE POLICY "Chiunque può aggiornare libri" ON books FOR UPDATE USING (true);

-- 3. AGGIORNAMENTO COLONNE (Assicurati che esistano)
ALTER TABLE books ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS external_url TEXT;`}
                    </pre>
                    <button
                      onClick={() => {
                        const sql = `GRANT USAGE ON SCHEMA public TO anon, authenticated;\nGRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;\nGRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;\nALTER TABLE books ENABLE ROW LEVEL SECURITY;\nDROP POLICY IF EXISTS "Libri leggibili da tutti" ON books; CREATE POLICY "Libri leggibili da tutti" ON books FOR SELECT USING (true);\nDROP POLICY IF EXISTS "Chiunque può inserire libri" ON books; CREATE POLICY "Chiunque può inserire libri" ON books FOR INSERT WITH CHECK (true);\nDROP POLICY IF EXISTS "Chiunque può aggiornare libri" ON books; CREATE POLICY "Chiunque può aggiornare libri" ON books FOR UPDATE USING (true);\nALTER TABLE books ADD COLUMN IF NOT EXISTS file_url TEXT;\nALTER TABLE books ADD COLUMN IF NOT EXISTS external_url TEXT;`;
                        navigator.clipboard.writeText(sql);
                        alert('Script di sblocco copiato!');
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-white text-[10px]"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copia Sblocco
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
USING (bucket_id = 'library-files' AND (storage.foldername(name))[1] = auth.uid()::text);`}
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
    </div>
  );
}
