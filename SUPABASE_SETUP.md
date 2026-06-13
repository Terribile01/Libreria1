# Configurazione Supabase per LEGGO

Questo progetto richiede una configurazione specifica su Supabase per gestire il catalogo dei libri, i file (PDF/ePub) e le interazioni degli utenti.

## 1. Variabili d'Ambiente
Configura queste chiavi su Vercel o nel tuo file `.env.local`:
- `VITE_SUPABASE_URL`: (L'URL del tuo progetto)
- `VITE_SUPABASE_ANON_KEY`: (La tua chiave anonima pubblica)

## 2. Schema del Database
Esegui questo script completo nell'**SQL Editor** di Supabase per inizializzare il backend con supporto per file locali e link esterni.

```sql
-- 1. Pulizia drastica
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS readings;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS profiles;

-- 2. Creazione Tabelle
CREATE TABLE profiles (  
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,  
  username TEXT UNIQUE NOT NULL,  
  role TEXT DEFAULT 'Lettore Silente',  
  avatar_url TEXT,  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE books (  
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,  
  title TEXT NOT NULL,  
  author TEXT NOT NULL,  
  cover_url TEXT,  
  file_url TEXT,
  external_url TEXT,
  category TEXT DEFAULT 'Romanzi',  
  description TEXT,  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
  UNIQUE(title, author)
);

CREATE TABLE readings (  
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,  
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,  
  book_id UUID REFERENCES books ON DELETE CASCADE NOT NULL,  
  status TEXT DEFAULT 'Da Leggere' CHECK (status IN ('Da Leggere', 'Letti', 'Preferiti')),  
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
  UNIQUE(user_id, book_id)
);

CREATE TABLE notes (  
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,  
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,  
  book_id UUID REFERENCES books ON DELETE SET NULL,  
  title TEXT NOT NULL,  
  content TEXT NOT NULL,  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 4. Policy
CREATE POLICY "Profili visibili a tutti" ON profiles FOR SELECT USING (true);
CREATE POLICY "Proprietario può modificare profilo" ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Libri leggibili da tutti" ON books FOR SELECT USING (true);
CREATE POLICY "Inserimento libero per tutti" ON books FOR INSERT WITH CHECK (true);

CREATE POLICY "Utente gestisce le proprie letture" ON readings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Utente gestisce le proprie note" ON notes FOR ALL USING (auth.uid() = user_id);

-- 5. Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN  
  INSERT INTO public.profiles (user_id, username, role)  
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'Nuovo Lettore'),
    CASE WHEN NEW.email = 'mariateresarogani@gmail.com' THEN 'Amministratore' ELSE 'Lettore Silente' END);  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Grant Permissions (Sblocco totale su public)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.books TO anon, authenticated;
GRANT ALL ON TABLE public.profiles TO anon, authenticated;
GRANT ALL ON TABLE public.readings TO anon, authenticated;
GRANT ALL ON TABLE public.notes TO anon, authenticated;
