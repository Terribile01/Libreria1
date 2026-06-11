# Configurazione Supabase per LEGGO

Per completare la migrazione al backend reale, segui questi passaggi nella tua dashboard di Supabase.

## 1. Variabili d'Ambiente
Assicurati di configurare le seguenti variabili su Vercel (o nel tuo file `.env.local`):
- `VITE_SUPABASE_URL`: L'URL del tuo progetto Supabase.
- `VITE_SUPABASE_ANON_KEY`: La chiave Anon pubblica.

## 2. Schema del Database
Esegui il seguente SQL nel **SQL Editor** di Supabase per creare le tabelle necessarie:

```sql
-- Tabella Profili (collegata a auth.users)
CREATE TABLE profiles (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'Lettore Silente',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella Libri (Catalogo Globale)
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

-- Tabella Readings (Relazione Utente-Libro + Note)
CREATE TABLE readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'Da Leggere' CHECK (status IN ('Da Leggere', 'Letti', 'Preferiti')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Tabella Notes (Diario Libero)
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 3. Row Level Security (RLS)
Abilita RLS per proteggere i dati:

```sql
-- Profili: visibili a tutti gli autenticati, modificabili solo dal proprietario
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profili visibili a tutti" ON profiles FOR SELECT USING (true);
CREATE POLICY "Proprietario può modificare profilo" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Libri: leggibili da tutti, inseribili da chiunque (per importazione)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Libri leggibili da tutti" ON books FOR SELECT USING (true);
CREATE POLICY "Chiunque può inserire libri" ON books FOR INSERT WITH CHECK (true);

-- Readings: visibili e gestibili solo dal proprietario
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Utente gestisce le proprie letture" ON readings FOR ALL USING (auth.uid() = user_id);

-- Notes: visibili e gestibili solo dal proprietario
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Utente gestisce le proprie note" ON notes FOR ALL USING (auth.uid() = user_id);
```

## 4. Trigger per Profilo Automatico (Opzionale ma consigliato)
Per creare automaticamente un record in `profiles` quando un utente si registra:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username',
    CASE WHEN NEW.email = 'mariateresarogani@gmail.com' THEN 'Amministratore' ELSE 'Lettore Silente' END);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```
