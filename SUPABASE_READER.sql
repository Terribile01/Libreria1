-- SQL Migration for Reader environment
-- Run this in the Supabase SQL Editor

-- 1. Add reading progress to readings table
ALTER TABLE readings ADD COLUMN IF NOT EXISTS last_page_read INTEGER DEFAULT 1;

-- 2. Create bookmarks table if it doesn't exist (with support for both audio and reader)
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books ON DELETE CASCADE NOT NULL,
  page_number INTEGER, -- For Reader
  position_seconds INTEGER, -- For Audio (previously 'time')
  note TEXT, -- Optional description for the bookmark
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add Row Level Security for bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utente gestisce i propri segnalibri" ON bookmarks;
CREATE POLICY "Utente gestisce i propri segnalibri" ON bookmarks
FOR ALL USING (auth.uid() = user_id);

-- 4. Grant Permissions
GRANT ALL ON TABLE public.bookmarks TO authenticated;
