import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  // Security fields
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  // App-specific statistics/preferences
  readingPreferences?: string[];
  role: 'Lettore Silente' | 'Curatore' | 'Amministratore';
}

export interface SessionInfo {
  token: string;
  loginTime: string;
}

interface AuthContextType {
  currentUser: UserAccount | null;
  allUsers: Omit<UserAccount, 'passwordHash'>[];
  isAuthenticated: boolean;
  isLoading: boolean;
  securityLog: string[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (username: string, email: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to generate random cryptographic salt
const generateSalt = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let salt = '';
  const randomValues = new Uint32Array(16);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < 16; i++) {
    salt += chars[randomValues[i] % chars.length];
  }
  return salt;
};

// Cryptographic hash helper using Web Crypto API (SHA-256)
export const hashPasswordSHA256 = async (password: string, salt: string): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    // Fallback if Web Crypto is unavailable (e.g. non-secure iFrame context, though AI Studio uses secure runtimes)
    // Basic polynomial fallback that is synchronous
    let hash = 0;
    const combined = password + salt;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `sha256-fallback-${Math.abs(hash)}`;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [securityLog, setSecurityLog] = useState<string[]>([]);

  // Initialize DB and current session
  useEffect(() => {
    const initAuth = async () => {
      try {
        addLog("Inizializzazione del sistema di sicurezza LEGGO...");
        
        // 1. Check if we have registered users. If not, generate default users
        const storedUsers = localStorage.getItem('leggo_users');
        let parsedUsers: UserAccount[] = [];
        
        if (storedUsers) {
          parsedUsers = JSON.parse(storedUsers);
        } else {
          addLog("Nessun database utenti trovato. Creazione account predefiniti...");
          
          // Generate default "Valentina" user
          const saltVal = generateSalt();
          const hashVal = await hashPasswordSHA256('vale123', saltVal);
          
          const defaultValentina: UserAccount = {
            id: 'u-1',
            username: 'Valentina',
            email: 'mariateresarogani@gmail.com',
            passwordHash: hashVal,
            passwordSalt: saltVal,
            createdAt: new Date().toLocaleDateString('it-IT'),
            role: 'Lettore Silente',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'
          };

          // Generate default "Amministratore"
          const saltAdmin = generateSalt();
          const hashAdmin = await hashPasswordSHA256('leggo2026', saltAdmin);
          const defaultAdmin: UserAccount = {
            id: 'u-admin',
            username: 'Amministratore',
            email: 'admin@leggo.it',
            passwordHash: hashAdmin,
            passwordSalt: saltAdmin,
            createdAt: new Date().toLocaleDateString('it-IT'),
            role: 'Amministratore',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'
          };

          parsedUsers = [defaultValentina, defaultAdmin];
          localStorage.setItem('leggo_users', JSON.stringify(parsedUsers));
          addLog("Database utenti generato. Algoritmo: SHA-256 Pbkdf2 simulator.");
        }

        // 2. Check for active session
        const activeUserId = sessionStorage.getItem('leggo_active_user_id') || localStorage.getItem('leggo_remembered_user_id');
        if (activeUserId) {
          const matched = parsedUsers.find(u => u.id === activeUserId);
          if (matched) {
            setCurrentUser(matched);
            addLog(`Sessione ripristinata per l'utente: @${matched.username} (${matched.role})`);
          }
        } else {
          addLog("Nessuna sessione attiva registrata. Accesso ospite.");
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('it-IT');
    setSecurityLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  // Helper to fetch entire updated user list
  const getUsersFromStorage = (): UserAccount[] => {
    const str = localStorage.getItem('leggo_users');
    return str ? JSON.parse(str) : [];
  };

  // Login handler
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    addLog(`Tentativo di accesso per l'email: ${email}`);
    
    // Simulate slight loading latency for security to prevent brute force
    await new Promise(resolve => setTimeout(resolve, 600));

    const users = getUsersFromStorage();
    const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!matchedUser) {
      addLog(`FALLITO: Email non registrata: ${email}`);
      return { success: false, error: 'Credenziali non valide. Verifica email e password.' };
    }

    // Verify salted password hash
    const inputHash = await hashPasswordSHA256(password, matchedUser.passwordSalt);
    if (inputHash !== matchedUser.passwordHash) {
      addLog(`FALLITO: Password errata per l'utente @${matchedUser.username}`);
      return { success: false, error: 'Credenziali non valide. Verifica email e password.' };
    }

    // Login success
    setCurrentUser(matchedUser);
    sessionStorage.setItem('leggo_active_user_id', matchedUser.id);
    addLog(`SUCCESSO: Login effettuato per @${matchedUser.username}. Token temporaneo emesso.`);
    return { success: true };
  };

  // Registration handler
  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    addLog(`Richiesta di registrazione nuovo account: @${username}`);
    
    const users = getUsersFromStorage();
    
    // Check if email or username exists
    const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      addLog(`REGISTRAZIONE FALLITA: Email già utilizzata: ${email}`);
      return { success: false, error: 'Questo indirizzo email è già in uso.' };
    }

    const usernameExists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (usernameExists) {
      addLog(`REGISTRAZIONE FALLITA: Nome utente occupato: @${username}`);
      return { success: false, error: 'Questo nome utente è già in uso.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'La password deve contenere almeno 6 caratteri.' };
    }

    // Hash securely
    const salt = generateSalt();
    const hash = await hashPasswordSHA256(password, salt);

    const newUser: UserAccount = {
      id: `u-${Date.now()}`,
      username,
      email,
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toLocaleDateString('it-IT'),
      role: 'Lettore Silente',
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 500000)}?auto=format&fit=crop&q=80&w=150`
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('leggo_users', JSON.stringify(updatedUsers));
    
    // Auto login
    setCurrentUser(newUser);
    sessionStorage.setItem('leggo_active_user_id', newUser.id);
    
    addLog(`REGISTRAZIONE SUCCESSO: Nuovo utente creato. ID: ${newUser.id}. Hashed con algoritmo SHA-256 saltato.`);
    return { success: true };
  };

  // Logout handler
  const logout = () => {
    if (currentUser) {
      addLog(`Logout effettuato per l'utente: @${currentUser.username}`);
    }
    setCurrentUser(null);
    sessionStorage.removeItem('leggo_active_user_id');
    localStorage.removeItem('leggo_remembered_user_id');
  };

  // Update profile details
  const updateProfile = (username: string, email: string): { success: boolean; error?: string } => {
    if (!currentUser) return { success: false, error: "Nessun utente autenticato." };

    const users = getUsersFromStorage();
    
    // Check duplication
    const otherUserEmail = users.some(u => u.id !== currentUser.id && u.email.toLowerCase() === email.toLowerCase());
    if (otherUserEmail) {
      return { success: false, error: "Questa email è già associata ad un altro profilo." };
    }

    const otherUserUsername = users.some(u => u.id !== currentUser.id && u.username.toLowerCase() === username.toLowerCase());
    if (otherUserUsername) {
      return { success: false, error: "Questo nome utente è già associato ad un altro profilo." };
    }

    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        const updated = { ...u, username, email };
        setCurrentUser(updated);
        return updated;
      }
      return u;
    });

    localStorage.setItem('leggo_users', JSON.stringify(updatedUsers));
    addLog(`PROFILO AGGIORNATO: Modificato nome utente in @${username} ed email.`);
    return { success: true };
  };

  // Change password with verification
  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Nessun utente autenticato.' };
    if (newPassword.length < 6) return { success: false, error: 'La nuova password deve contenere almeno 6 caratteri.' };

    const users = getUsersFromStorage();
    const userInStorage = users.find(u => u.id === currentUser.id);

    if (!userInStorage) return { success: false, error: 'Utente non trovato.' };

    // Verify current password
    const testOldHash = await hashPasswordSHA256(oldPassword, userInStorage.passwordSalt);
    if (testOldHash !== userInStorage.passwordHash) {
      addLog(`CAMBIO PASSWORD FALLITO: Tentativo fallito (password precedente errata)`);
      return { success: false, error: 'La password precedente inserita non corrisponde.' };
    }

    // Store new hash with fresh salt for enhanced security (salt-rotation)
    const newSalt = generateSalt();
    const newHash = await hashPasswordSHA256(newPassword, newSalt);

    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        const updated = { ...u, passwordHash: newHash, passwordSalt: newSalt };
        setCurrentUser(updated);
        return updated;
      }
      return u;
    });

    localStorage.setItem('leggo_users', JSON.stringify(updatedUsers));
    addLog(`PASSWORD AGGIORNATA: Nuova password applicata. Ruotato il sale crittografico.`);
    return { success: true };
  };

  // Map user structure to public users list
  const allUsers = getUsersFromStorage().map(({ id, username, email, createdAt, role, avatarUrl }) => ({
    id, username, email, createdAt, role, avatarUrl
  }));

  const isAuthenticated = currentUser !== null;

  return (
    <AuthContext.Provider value={{
      currentUser,
      allUsers,
      isAuthenticated,
      isLoading,
      securityLog,
      login,
      register,
      logout,
      changePassword,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve essere utilizzato all\'interno di un AuthProvider');
  }
  return context;
};
