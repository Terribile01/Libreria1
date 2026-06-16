-- Refinement for Reader environment
-- Run this in the Supabase SQL Editor

-- 1. Add reading progress and timestamp to readings table
ALTER TABLE readings ADD COLUMN IF NOT EXISTS last_page_read INTEGER DEFAULT 1;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Update bookmarks table to support both audio and reader
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS page_number INTEGER;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS position_seconds INTEGER;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS note TEXT;

-- 3. Trigger to auto-update 'updated_at' on readings
CREATE OR REPLACE FUNCTION update_reading_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_reading_timestamp ON readings;
CREATE TRIGGER tr_update_reading_timestamp
BEFORE UPDATE ON readings
FOR EACH ROW
EXECUTE FUNCTION update_reading_timestamp();
