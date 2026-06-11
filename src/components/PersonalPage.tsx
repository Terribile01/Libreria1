import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Lock, Shield, Key, Database, RefreshCw, Eye, EyeOff, 
  CheckCircle2, AlertCircle, LogOut, Terminal, Sparkles, BookOpen, 
  Clock, Heart, HelpCircle, FileText, Check, Copy
} from 'lucide-react';
import { useAuth, hashPasswordSHA256 } from '../context/AuthContext';
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
    currentUser, 
    allUsers, 
    isAuthenticated, 
    login, 
    register, 
    logout, 
    changePassword, 
    updateProfile,
    securityLog 
  } = useAuth();

  // Navigation tabs within Personal Area
  const [activeTab, setActiveTab] = useState<'dashboard' | 'security' | 'api' | 'db'>('dashboard');

  // Auth Forms State
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authIsLoading, setAuthIsLoading] = useState(false);

  // Profile Edit State
  const [editUsername, setEditUsername] = useState(currentUser?.username || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [profileMessage, setProfileMessage] = useState({ text: '', type: 'success' });

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  // Local API Key states
  const [apiKeys, setApiKeys] = useState<ApiKeyStructure[]>(ApiKeyManager.listKeys());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [keyValueInput, setKeyValueInput] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Interactive password hash simulator state for the login/register card
  const [simPassword, setSimPassword] = useState('');
  const [simSalt, setSimSalt] = useState('S4lt_L3gg0_2026!');
  const [simHash, setSimHash] = useState('');

  // Update live simulation when password changes
  React.useEffect(() => {
    const updateSim = async () => {
      if (!simPassword) {
        setSimHash('');
        return;
      }
      const h = await hashPasswordSHA256(simPassword, simSalt);
      setSimHash(h);
    };
    updateSim();
  }, [simPassword, simSalt]);

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
        // Update edit fields
        setEditUsername(email); 
        setTimeout(() => {
          // Re-trigger states
          window.location.reload();
        }, 800);
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
    if (password.length < 6) {
      setAuthError('La password deve contenere almeno 6 caratteri.');
      return;
    }

    setAuthIsLoading(true);
    try {
      const res = await register(username, email, password);
      if (res.success) {
        setAuthSuccess('Registrazione completata! Accesso in corso...');
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        setAuthError(res.error || "Errore di registrazione.");
      }
    } catch {
      setAuthError('Impossibile completare la registrazione.');
    } finally {
      setAuthIsLoading(false);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage({ text: '', type: 'success' });
    if (!editUsername || !editEmail) {
      setProfileMessage({ text: 'Compila tutti i campi del profilo.', type: 'error' });
      return;
    }
    const res = updateProfile(editUsername, editEmail);
    if (res.success) {
      setProfileMessage({ text: 'Profilo salvato correttamente!', type: 'success' });
    } else {
      setProfileMessage({ text: res.error || 'Errore salvataggio.', type: 'error' });
    }
  };

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setPwdError('Compila tutti i campi di sicurezza.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwdError('Le nuove password inserite non sono identiche.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('La nuova password deve contenere almeno 6 caratteri.');
      return;
    }

    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setPwdSuccess('Password aggiornata con successo! Il sale crittografico è stato rigenerato.');
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPwdError(res.error || 'Errore cambio password.');
      }
    } catch {
      setPwdError('Errore tecnico di rete.');
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

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 pb-20">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-surface-container/30 pb-6">
        <div>
          <span className="text-primary font-sans font-semibold tracking-widest text-xs uppercase flex items-center gap-1.5 justify-center md:justify-start">
            <Shield className="w-3.5 h-3.5" /> Area Personale di Sicurezza
          </span>
          <h1 className="font-serif text-3xl md:text-4xl text-on-surface font-semibold tracking-tight text-center md:text-left mt-1">
            Il Tuo Refettorio Digitale
          </h1>
        </div>
        <button
          onClick={onNavigateToHome}
          className="px-4 py-2 border border-surface-container-high/60 hover:bg-surface-container/60 text-on-surface-variant font-semibold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer whitespace-nowrap self-center"
        >
          ← Torna alla Home
        </button>
      </div>

      {!isAuthenticated ? (
        /* ================= UNAUTHENTICATED: LOGIN / REGISTER ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Design info about security, salt, hashing */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface-container/40 border border-surface-container/60 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
              
              <h3 className="font-serif text-xl font-semibold text-primary flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-secondary" />
                Sicurezza & Privacy su LEGGO
              </h3>
              
              <p className="font-sans text-sm text-on-surface-variant/80 leading-relaxed mb-4">
                La conservazione delle identità nel santuario <strong>LEGGO</strong> rispetta standard di cifratura moderni delle credenziali. Non memorizziamo mai la tua password reale nel database del browser.
              </p>

              <div className="space-y-4 font-sans text-xs">
                <div className="flex gap-3 items-start">
                  <div className="p-1.5 bg-primary/10 rounded-lg text-primary mt-0.5">
                    <Key className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface">Cifrario Salato (Salting)</h4>
                    <p className="text-on-surface-variant/70 mt-0.5">Viene generato un valore casuale univoco (Salt) per rimescolare la password prima di processarla.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="p-1.5 bg-primary/10 rounded-lg text-primary mt-0.5">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface">Hash Unidirezionale SHA-256</h4>
                    <p className="text-on-surface-variant/70 mt-0.5">Utilizziamo la suite nativa <code>window.crypto</code> per computare l&apos;impronta digest del testo cifrato. È matematicamente impossibile invertire l&apos;hash per risalire alla password.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Interactive Hashing Play Area */}
            <div className="bg-surface-container-low border border-surface-container/30 p-5 rounded-2xl">
              <h4 className="font-sans font-bold text-xs tracking-widest uppercase text-on-surface-variant flex items-center gap-1.5 mb-3">
                <Terminal className="w-3.5 h-3.5 text-secondary" /> Ispettore Hash in Tempo Reale
              </h4>
              <p className="text-xs text-on-surface-variant/70 mb-4 font-sans">
                Digita una password demo qui sotto per osservare lo SHA-256 generato all&apos;istante con il rispettivo sale crittografico:
              </p>
              
              <div className="space-y-3 font-sans text-xs">
                <div>
                  <label className="block text-on-surface-variant mb-1 font-semibold">Test Password:</label>
                  <input
                    type="text"
                    value={simPassword}
                    onChange={(e) => setSimPassword(e.target.value)}
                    placeholder="Esempio: password123"
                    className="w-full px-3 py-1.5 bg-surface rounded-lg border border-surface-container-high/60 focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-on-surface-variant mb-0.5 font-semibold">Sale casuale (Salt):</span>
                    <span className="font-mono text-[10px] break-all bg-surface-container p-1 rounded block text-primary font-bold">
                      {simSalt}
                    </span>
                  </div>
                  <div>
                    <span className="block text-on-surface-variant mb-0.5 font-semibold">Funzione Digest:</span>
                    <span className="font-mono text-[10px] bg-surface-container p-1 rounded block text-secondary font-bold uppercase">
                      SHA-256 (Native)
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-on-surface-variant mb-1 font-semibold">Impronta finale nel DB (Hash Cifrato):</span>
                  <div className="bg-black/95 text-green-400 p-2.5 rounded-lg font-mono text-[10px] break-all border border-lime-900/30">
                    {simHash ? simHash : 'In attesa di caratteri... lo SHA-256 digest calcola 64 stringhe esadecimali'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Actuall Login / Register Box */}
          <div className="lg:col-span-7 bg-surface-container-lowest border border-surface-container p-6 md:p-8 rounded-2xl shadow-[0_20px_40px_rgba(83,98,79,0.04)]">
            <div className="flex border-b border-surface-container mb-6">
              <button
                onClick={() => {
                  setIsRegisterMode(false);
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className={`flex-1 pb-3 text-center font-sans text-sm tracking-wider uppercase font-bold cursor-pointer transition-all duration-300 ${
                  !isRegisterMode ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant/50 hover:text-on-surface'
                }`}
              >
                Accedi
              </button>
              <button
                onClick={() => {
                  setIsRegisterMode(true);
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className={`flex-1 pb-3 text-center font-sans text-sm tracking-wider uppercase font-bold cursor-pointer transition-all duration-300 ${
                  isRegisterMode ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant/50 hover:text-on-surface'
                }`}
              >
                Crea Account
              </button>
            </div>

            <h3 className="font-serif text-xl text-on-surface font-semibold mb-1 text-center">
              {isRegisterMode ? 'Inizia la tua esperienza letteraria' : 'Bentornato nella stanza silente'}
            </h3>
            <p className="text-xs text-on-surface-variant/70 text-center mb-6 font-sans">
              I dati forniti verranno criptati e archiviati nella sessione protetta della tua libreria.
            </p>

            <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4">
              
              {isRegisterMode && (
                <div>
                  <label className="block font-sans text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                    Nome Utente
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 w-4 h-4" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Identificatore nel Santuario"
                      className="w-full pl-10 pr-4 py-2.5 bg-surface border border-surface-container-high/60 focus:outline-none focus:ring-1 focus:ring-primary rounded-xl font-sans text-xs text-on-surface"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-sans text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                  Indirizzo Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled={authIsLoading}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email di accesso o mariateresarogani@gmail.com"
                  className="w-full px-4 py-2.5 bg-surface border border-surface-container-high/60 focus:outline-none focus:ring-1 focus:ring-primary rounded-xl font-sans text-xs text-on-surface"
                  required
                />
                {!isRegisterMode && (
                  <p className="text-[10px] text-on-surface-variant/60 italic mt-1 font-sans">
                    Puoi utilizzare le credenziali predefinite: <strong>mariateresarogani@gmail.com</strong> con password <strong>vale123</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-sans text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                  Password di Sicurezza
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    disabled={authIsLoading}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isRegisterMode ? "Minimo 6 caratteri" : "Password segreta"}
                    className="w-full pl-4 pr-10 py-2.5 bg-surface border border-surface-container-high/60 focus:outline-none focus:ring-1 focus:ring-primary rounded-xl font-sans text-xs text-on-surface"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-primary p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isRegisterMode && (
                <div>
                  <label className="block font-sans text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                    Conferma Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Inserisci nuovamente la password"
                      className="w-full px-4 py-2.5 bg-surface border border-surface-container-high/60 focus:outline-none focus:ring-1 focus:ring-primary rounded-xl font-sans text-xs text-on-surface"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Feedbacks Alerts */}
              <AnimatePresence mode="wait">
                {authError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-700 p-3 rounded-xl text-xs font-sans"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>{authError}</span>
                  </motion.div>
                )}

                {authSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-2.5 bg-green-500/10 border border-green-500/20 text-green-700 p-3 rounded-xl text-xs font-sans"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>{authSuccess}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={authIsLoading}
                className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-sans font-bold text-xs tracking-wider uppercase shadow-md hover:translate-y-[-1px] active:translate-y-[1px] transition-all duration-200 cursor-pointer flex justify-center items-center gap-2"
              >
                {authIsLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {isRegisterMode ? 'Invia Richiesta e Crea Account' : 'Autenticazione Sicura'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* ================= AUTHENTICATED: AREA PERSONALE PANELS ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Side Menu Bar */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* User Badge Profile */}
            <div className="bg-surface-container-low border border-surface-container/60 p-5 rounded-2xl text-center space-y-3">
              <div className="flex justify-center relative">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 bg-surface flex items-center justify-center p-0.5 shadow-sm">
                  <img 
                    src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330"} 
                    alt="avatar" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="absolute bottom-0 right-1/2 translate-x-8 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  {currentUser.role.split(' ')[0]}
                </div>
              </div>
              
              <div>
                <h3 className="font-serif text-lg text-on-surface font-semibold">@{currentUser.username}</h3>
                <p className="font-sans text-[11px] text-on-surface-variant/70 break-all">{currentUser.email}</p>
              </div>

              <div className="border-t border-surface-container/40 pt-3">
                <button
                  onClick={logout}
                  className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-700 hover:text-red-800 text-xs font-sans font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" /> Disconnetti
                </button>
              </div>
            </div>

            {/* Sub navigation items */}
            <div className="bg-surface-container-lowest border border-surface-container/50 rounded-2xl p-2.5 flex flex-col gap-1 shadow-sm">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full px-4 py-2.5 rounded-xl font-sans font-semibold text-xs tracking-wide text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <User className="w-4 h-4" /> Cruscotto Personale
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full px-4 py-2.5 rounded-xl font-sans font-semibold text-xs tracking-wide text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'security' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <Shield className="w-4 h-4" /> Sicurezza & Password
              </button>

              <button
                onClick={() => setActiveTab('api')}
                className={`w-full px-4 py-2.5 rounded-xl font-sans font-semibold text-xs tracking-wide text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'api' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <Key className="w-4 h-4" /> Chiavi API esterne
              </button>

              <button
                onClick={() => setActiveTab('db')}
                className={`w-full px-4 py-2.5 rounded-xl font-sans font-semibold text-xs tracking-wide text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'db' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <Database className="w-4 h-4" /> Archivio Utenti (DB)
              </button>
            </div>
            
          </div>

          {/* Tab View Container */}
          <div className="lg:col-span-9 bg-surface-container-lowest border border-surface-container/60 p-6 md:p-8 rounded-2xl shadow-[0_15px_30px_rgba(83,98,79,0.03)] min-h-[480px]">
            
            {/* =============== TAB: OVERVIEW =============== */}
            {activeTab === 'dashboard' && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-on-surface">Pannello Lettore</h2>
                  <p className="text-xs text-on-surface-variant/70 font-sans mt-0.5">La tua situazione di lettura, traguardi personali e dettagli account.</p>
                </div>

                {/* Counter Statistics cards in Area Personale */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-surface-container/40 p-4 border border-surface-container rounded-xl text-center">
                    <BookOpen className="w-5 h-5 text-primary mx-auto mb-1.5" />
                    <span className="block text-[10px] text-on-surface-variant/70 font-sans uppercase font-bold tracking-widest">Totale Opere</span>
                    <strong className="text-xl text-on-surface font-serif block mt-1">{booksCount.total}</strong>
                  </div>

                  <div className="bg-surface-container/40 p-4 border border-surface-container rounded-xl text-center">
                    <Heart className="w-5 h-5 text-red-400 mx-auto mb-1.5" />
                    <span className="block text-[10px] text-on-surface-variant/70 font-sans uppercase font-bold tracking-widest">Preferiti</span>
                    <strong className="text-xl text-on-surface font-serif block mt-1">{booksCount.favorites}</strong>
                  </div>

                  <div className="bg-surface-container/40 p-4 border border-surface-container rounded-xl text-center">
                    <CheckCircle2 className="w-5 h-5 text-secondary mx-auto mb-1.5" />
                    <span className="block text-[10px] text-on-surface-variant/70 font-sans uppercase font-bold tracking-widest">Letti</span>
                    <strong className="text-xl text-on-surface font-serif block mt-1">{booksCount.completed}</strong>
                  </div>

                  <div className="bg-surface-container/40 p-4 border border-surface-container rounded-xl text-center">
                    <FileText className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                    <span className="block text-[10px] text-on-surface-variant/70 font-sans uppercase font-bold tracking-widest">Riflessioni</span>
                    <strong className="text-xl text-on-surface font-serif block mt-1">{notesCount}</strong>
                  </div>
                </div>

                {/* Edit Profile Form */}
                <div className="bg-surface p-5 border border-surface-container/60 rounded-xl space-y-4">
                  <h3 className="font-serif text-lg font-semibold text-on-surface flex items-center gap-1.5 border-b border-surface-container/40 pb-2">
                    <User className="w-4 h-4 text-primary" /> Modifica Informazioni Generali
                  </h3>
                  
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-sans font-bold text-on-surface-variant uppercase mb-1.5">Nome Utente LEGGO</label>
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          className="w-full px-3.5 py-2 bg-surface-container/35 border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary rounded-lg text-xs font-sans"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-sans font-bold text-on-surface-variant uppercase mb-1.5">Email Autenticazione</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-3.5 py-2 bg-surface-container/35 border border-surface-container focus:outline-none focus:ring-1 focus:ring-primary rounded-lg text-xs font-sans"
                        />
                      </div>
                    </div>

                    {profileMessage.text && (
                      <div className={`p-2.5 rounded-lg text-xs font-sans ${profileMessage.type === 'success' ? 'bg-green-500/15 text-green-700' : 'bg-red-500/15 text-red-700'}`}>
                        {profileMessage.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-sans font-bold uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Salva Profilo
                    </button>
                  </form>
                </div>

                {/* Welcome Quote sanctuary */}
                <div className="bg-[#fcfaf2] p-5 border border-dashed border-secondary/20 rounded-xl italic text-serif text-on-surface-variant text-sm relative">
                  <span className="font-serif text-4xl text-primary/10 absolute top-2 left-3 leading-none select-none">“</span>
                  <div className="pl-6 space-y-2">
                    <p>
                      «In questo spazio silenzioso dedicato alla lettura profonda, ogni libro aperto rappresenta un portale che attraversa epoche e silenzi. Qui non sei un consumatore di dati, ma un esploratore dell&apos;animo umano. Prenditi il tuo tempo per leggere, per fare tesoro dei tuoi appunti, e per riflettere con calma.»
                    </p>
                    <p className="text-xs font-sans text-right font-bold text-primary not-italic">
                      — Carta Fondativa di LEGGO, Anno MMXVI.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* =============== TAB: SECURITY =============== */}
            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 animate-fade">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-on-surface">Sicurezza e Rigenerazione Password</h2>
                  <p className="text-xs text-on-surface-variant/70 font-sans mt-0.5">
                    Modifica la chiave segreta dell&apos;account ed esamina l&apos;architettura di memorizzazione dei tuoi hash cifrati.
                  </p>
                </div>

                {/* Technical credential view */}
                <div className="bg-surface-container/30 border border-surface-container/70 rounded-xl p-4 space-y-3 font-sans text-xs">
                  <h3 className="font-bold text-on-surface flex items-center gap-1.5 text-xs tracking-wider uppercase text-on-surface-variant mb-1">
                    <Key className="w-4 h-4 text-primary" /> Credenziali Memorizzate in Session Sandbox
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-2 border-b border-surface-container/40">
                    <div className="md:col-span-3 text-on-surface-variant font-semibold">User ID univoco:</div>
                    <div className="md:col-span-9 font-mono text-primary font-bold bg-surface px-2 py-1 rounded select-all w-fit">
                      {currentUser.id}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-2 border-b border-surface-container/40 items-start">
                    <div className="md:col-span-3 text-on-surface-variant font-semibold">Password Salt unito (128-bit):</div>
                    <div className="md:col-span-9 font-mono text-secondary break-all bg-surface px-2 py-1 rounded w-full">
                      {currentUser.passwordSalt}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    <div className="md:col-span-3 text-on-surface-variant font-semibold">Hash Stored (SHA-256 Digest):</div>
                    <div className="md:col-span-9 font-mono text-on-surface-variant break-all bg-surface px-2 py-1 rounded w-full text-[10px]">
                      {currentUser.passwordHash}
                    </div>
                  </div>
                </div>

                {/* Change Password Form */}
                <form onSubmit={handleChangePwd} className="bg-surface border border-surface-container p-5 rounded-xl space-y-4">
                  <h3 className="font-serif text-lg font-semibold text-on-surface flex items-center gap-1.5 border-b border-surface-container/40 pb-2">
                    <Lock className="w-4 h-4 text-primary" /> Cambia Password Segreta
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-sans font-bold text-on-surface-variant uppercase mb-1.5">Password Attuale</label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-surface focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-bold text-on-surface-variant uppercase mb-1.5">Nuova Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nuova"
                        className="w-full px-3 py-2 bg-surface focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-bold text-on-surface-variant uppercase mb-1.5">Conferma Nuova</label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Ripeti"
                        className="w-full px-3 py-2 bg-surface focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {pwdError && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-700 p-2.5 rounded-lg text-xs font-sans">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                      <span>{pwdError}</span>
                    </div>
                  )}

                  {pwdSuccess && (
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-700 p-2.5 rounded-lg text-xs font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      <span>{pwdSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-sans font-bold uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Aggiorna e Ruota Sali Crittografici
                  </button>
                </form>

                {/* Live Terminal Log of Security Operations */}
                <div className="space-y-2">
                  <h4 className="font-sans font-bold text-xs tracking-widest text-on-surface-variant uppercase flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-secondary" /> Registro delle Operazioni di Sicurezza (Auditing)
                  </h4>
                  <div className="bg-black/95 text-green-400 p-4 rounded-xl border border-lime-900/30 font-mono text-[11px] h-36 overflow-y-auto space-y-1 select-text scrollbar-thin">
                    {securityLog.map((log, i) => (
                      <div key={i} className="leading-relaxed hover:bg-white/5 px-1 rounded transition-colors">
                        <span className="text-stone-500 select-none mr-2 font-sans">&gt;</span>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* =============== TAB: API KEYS =============== */}
            {activeTab === 'api' && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-on-surface">Piattaforma Chiavi API Integrative</h2>
                  <p className="text-xs text-on-surface-variant/70 font-sans mt-0.5">
                    Esamina e inserisci le chiavi per i servizi intelligenti di sintesi vocale, assistente IA ed elaborazione linguistica de <code>LEGGO</code>.
                  </p>
                </div>

                <div className="bg-surface p-5 border border-surface-container/60 rounded-xl space-y-4">
                  <h3 className="font-serif text-lg font-semibold text-on-surface flex items-center gap-1.5 border-b border-surface-container/40 pb-2">
                    <Key className="w-4 h-4 text-primary" /> Configurazione Chiavi e Ambito di Caricamento
                  </h3>

                  <p className="font-sans text-xs text-on-surface-variant/80 leading-relaxed">
                    Come documentato nel file di configurazione <code>.env.example</code> presente nei file di build, il sistema LEGGO carica automaticamente le chiavi sensibili e le custodisce al sicuro nel server per non esporle al browser dell&apos;end-user. Inoltre, in questa area, puoi configurare una chiave di sessione sul tuo borwser per bypassare o testare l&apos;integrazione locale temporaneamente.
                  </p>

                  <div className="space-y-4 pt-2">
                    {apiKeys.map((key) => (
                      <div key={key.envVar} className="border border-surface-container/60 p-4 rounded-xl space-y-2 bg-surface-container-lowest/50 hover:bg-surface-container-lowest/90 transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-surface-container/35 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-sans font-bold text-on-surface bg-surface-container px-2 py-1 rounded">
                              {key.name}
                            </span>
                            <span className="text-[10px] font-mono text-secondary px-1.5 py-0.5 border border-secondary/25 rounded-md">
                              {key.envVar}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {key.isConfigured ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-500/10 px-2.5 py-0.5 rounded-full font-sans">
                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                                {key.source === 'environment' ? 'Pre-Caricata da Server (.env)' : 'Override Locale Attivo'}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-750 bg-amber-500/10 px-2.5 py-0.5 rounded-full font-sans">
                                Non Configurato (.env)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                          <div className="space-y-1 max-w-xl">
                            <p className="font-serif italic text-xs text-on-surface-variant">{key.purpose}</p>
                            <p className="font-sans text-[11px] text-on-surface-variant/65 leading-relaxed">{key.description}</p>
                            {key.isConfigured && (
                              <p className="text-[10px] font-mono text-on-surface/60 pt-1">
                                Chiave Attiva: <span className="p-0.5 px-1 bg-surface-container/80 rounded select-all font-sans text-on-surface font-bold">{key.maskedValue}</span>
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end">
                            {editingKey === key.envVar ? (
                              <div className="flex items-center gap-1.5 font-sans">
                                <input
                                  type="text"
                                  value={keyValueInput}
                                  onChange={(e) => setKeyValueInput(e.target.value)}
                                  placeholder="Inserisci valore chiave"
                                  className="px-2.5 py-1.5 bg-surface border border-surface-container rounded-lg text-xs text-on-surface w-40"
                                />
                                <button
                                  onClick={() => handleSaveLocalKey(key.envVar)}
                                  className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer"
                                  title="Conferma"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingKey(null)}
                                  className="p-1.5 bg-surface-container text-on-surface hover:bg-surface-container-high rounded-lg cursor-pointer text-xs font-bold"
                                >
                                  Annulla
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingKey(key.envVar);
                                    setKeyValueInput('');
                                  }}
                                  className="px-3 py-1.5 border border-surface-container hover:bg-surface-container-high rounded-xl text-[11px] font-sans font-semibold text-on-surface transition-all cursor-pointer"
                                >
                                  {key.isConfigured ? 'Cambia/Override' : 'Sostituisci'}
                                </button>
                                {key.source === 'local' && (
                                  <button
                                    onClick={() => handleRemoveLocalKey(key.envVar)}
                                    className="px-2.5 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-[11px] font-sans font-semibold transition-all cursor-pointer"
                                  >
                                    Cancella Override
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* =============== TAB: DB ACCOUNTS INSPECTOR =============== */}
            {activeTab === 'db' && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-on-surface">Visualizzazione Database Crittografico</h2>
                  <p className="text-xs text-on-surface-variant/70 font-sans mt-0.5">
                    Demonstrazione didattica per studiare l&apos;archiviazione degli account con conservazione cifrata delle password.
                  </p>
                </div>

                <div className="bg-surface border border-surface-container/60 rounded-xl p-5 space-y-4">
                  <h3 className="font-serif text-lg font-semibold text-on-surface flex items-center gap-1.5 border-b border-surface-container/40 pb-2">
                    <Database className="w-4 h-4 text-primary" /> Tabelle Utenti (<code>leggo_users</code>)
                  </h3>

                  <p className="font-sans text-xs text-on-surface-variant/80 leading-relaxed">
                    Di seguito è visibile il recordset completo archiviato localmente nel sandbox. Per fini dimostrativi di sicurezza, sono state celate le password reali in chiaro mostrando solo l&apos;impostazione strutturale e i relativi digest di ciascun utente.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-surface-container-high/70 bg-surface-container/40 text-on-surface-variant font-bold uppercase tracking-widest text-[10px]">
                          <th className="px-4 py-3">Avatar & Nome</th>
                          <th className="px-4 py-3">Indirizzo Email</th>
                          <th className="px-4 py-3 text-center">Data Registrazione</th>
                          <th className="px-4 py-3 text-center">Permessi / Ruolo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container/40">
                        {allUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-surface-container/15 transition-all">
                            <td className="px-4 py-3 flex items-center gap-3">
                              <img 
                                src={user.avatarUrl} 
                                alt={user.username} 
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-full object-cover border border-primary/20"
                              />
                              <div>
                                <span className="font-semibold text-on-surface block">@{user.username}</span>
                                <span className="text-[10px] text-on-surface-variant/50 font-mono">ID: {user.id}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-on-surface-variant align-middle">{user.email}</td>
                            <td className="px-4 py-3 text-center text-on-surface-variant align-middle font-mono text-[11px]">{user.createdAt}</td>
                            <td className="px-4 py-3 text-center text-on-surface-variant align-middle">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                user.role === 'Amministratore' 
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                  : 'bg-primary/15 text-primary border border-primary/10'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
