-- PATCH DI EMERGENZA: ALLINEAMENTO DIARIO E LIBRI
-- Esegui questo script nel SQL Editor di Supabase

-- 1. RENDERE book_id OPZIONALE E CORREGGERE VINCOLO FOREIGN KEY
-- Rimuoviamo il vecchio vincolo se esistente
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_book_id_fkey;

-- Assicuriamoci che la colonna possa essere NULL
ALTER TABLE notes ALTER COLUMN book_id DROP NOT NULL;

-- Aggiungiamo il vincolo con ON DELETE SET NULL
ALTER TABLE notes
ADD CONSTRAINT notes_book_id_fkey
FOREIGN KEY (book_id)
REFERENCES books(id)
ON DELETE SET NULL;

-- 2. POLICY DI LETTURA PER LA TABELLA BOOKS
-- Indispensabile per permettere il JOIN nel frontend
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Libri leggibili da tutti" ON books;
CREATE POLICY "Libri leggibili da tutti" ON books
FOR SELECT
USING (true);

-- 3. ASSICURIAMO PERMESSI BASE SULLO SCHEMA
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE books TO anon, authenticated;
GRANT ALL ON TABLE notes TO authenticated;
