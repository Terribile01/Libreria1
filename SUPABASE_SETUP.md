# Configurazione Supabase per LEGGO

Per completare la migrazione al backend reale, segui questi passaggi nella tua dashboard di Supabase.

## 1. Variabili d'Ambiente
Assicurati di configurare le seguenti variabili su Vercel (o nel tuo file `.env.local`):
- `VITE_SUPABASE_URL`: L'URL del tuo progetto Supabase.
- `VITE_SUPABASE_ANON_KEY`: La chiave Anon pubblica.

## 2. Schema del Database
Esegui il seguente SQL nel **SQL Editor** di Supabase per creare (o resettare) le tabelle necessarie.

**ATTENZIONE:** Questo script elimina le tabelle esistenti e le ricrea da zero. Usa questo se vuoi un'installazione pulita.

```sql
-- 0. Pulizia (Rimuovi se vuoi mantenere i dati esistenti)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS readings;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS profiles;

-- 1. Tabella Profili
CREATE TABLE profiles (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'Lettore Silente',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabella Libri (Catalogo Globale)
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,
  category TEXT DEFAULT 'Romanzi',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title, author)
);

-- 3. Tabella Readings (Relazione Utente-Libro)
CREATE TABLE readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'Da Leggere' CHECK (status IN ('Da Leggere', 'Letti', 'Preferiti')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- 4. Tabella Notes (Il "Diario Fluido" di Vale)
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profili visibili a tutti" ON profiles FOR SELECT USING (true);
CREATE POLICY "Proprietario può modificare profilo" ON profiles FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Libri leggibili da tutti" ON books FOR SELECT USING (true);
CREATE POLICY "Chiunque può inserire libri" ON books FOR INSERT WITH CHECK (true);

ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Utente gestisce le proprie letture" ON readings FOR ALL USING (auth.uid() = user_id);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Utente gestisce le proprie note" ON notes FOR ALL USING (auth.uid() = user_id);

-- 6. Trigger per Creazione Profilo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'Nuovo Lettore'),
    CASE WHEN NEW.email = 'mariateresarogani@gmail.com' THEN 'Amministratore' ELSE 'Lettore Silente' END);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```
