-- AI Music KAZ Database Schema

-- 1. Create the music table
CREATE TABLE IF NOT EXISTS music (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cover_url TEXT,
  audio_url TEXT,
  text TEXT,
  views BIGINT DEFAULT 0,
  plays BIGINT DEFAULT 0,
  downloads BIGINT DEFAULT 0,
  online_listeners INT4 DEFAULT 0,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indices for performance
CREATE INDEX IF NOT EXISTS idx_music_slug ON music(slug);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE music ENABLE ROW LEVEL SECURITY;

-- 4. Public Read Policy
CREATE POLICY "Public Read" ON music FOR SELECT USING (true);

-- 5. Admin Full Access Policy
-- Replace 'admin@aimusic.kz' with your actual admin email
CREATE POLICY "Admin Full Access" ON music
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@aimusic.kz');

-- 6. RPC Functions for Statistics (to avoid race conditions)

-- Increment View
CREATE OR REPLACE FUNCTION increment_view(music_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE music SET views = views + 1 WHERE id = music_id;
END;
$$ LANGUAGE plpgsql;

-- Increment Play
CREATE OR REPLACE FUNCTION increment_play(music_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE music SET plays = plays + 1 WHERE id = music_id;
END;
$$ LANGUAGE plpgsql;

-- Increment Download
CREATE OR REPLACE FUNCTION increment_download(music_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE music SET downloads = downloads + 1 WHERE id = music_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Storage Bucket Setup
-- These must be created manually in the Supabase Dashboard:
-- - Bucket: 'music-covers' (Public)
-- - Bucket: 'music-audio' (Public)
