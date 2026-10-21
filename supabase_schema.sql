-- ==========================================================
-- SAMPADA BANDRE PORTFOLIO — VISITOR TRACKING DATABASE SCHEMA
-- ==========================================================
-- Instructions:
-- 1. Log in to your Supabase project (https://supabase.com).
-- 2. Click "SQL Editor" on the left sidebar.
-- 3. Click "+ New query", paste this entire script, and click "Run".
-- Safe to re-run: It uses IF NOT EXISTS and ALTER TABLE statements.
-- ==========================================================

-- 1. Create table for portfolio visitor logs (if not already existing)
CREATE TABLE IF NOT EXISTS public.portfolio_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  ip TEXT NOT NULL DEFAULT 'Unknown',
  city TEXT DEFAULT 'Unknown',
  region TEXT DEFAULT 'Unknown',
  country TEXT DEFAULT 'Unknown',
  country_code TEXT DEFAULT 'XX',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  device TEXT DEFAULT 'Desktop',
  device_model TEXT DEFAULT 'Unknown',
  browser TEXT DEFAULT 'Unknown',
  browser_version TEXT DEFAULT 'Unknown',
  os TEXT DEFAULT 'Unknown',
  screen TEXT DEFAULT 'Unknown',
  page TEXT DEFAULT '/',
  referrer TEXT DEFAULT 'Direct',
  session_id TEXT,
  visitor_id TEXT,
  is_new_visitor BOOLEAN DEFAULT true,
  user_agent TEXT
);

-- 2. Upgrade existing tables safely if already created previously
ALTER TABLE public.portfolio_visits ADD COLUMN IF NOT EXISTS device_model TEXT DEFAULT 'Unknown';
ALTER TABLE public.portfolio_visits ADD COLUMN IF NOT EXISTS browser_version TEXT DEFAULT 'Unknown';
ALTER TABLE public.portfolio_visits ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE public.portfolio_visits ADD COLUMN IF NOT EXISTS visitor_id TEXT;
ALTER TABLE public.portfolio_visits ADD COLUMN IF NOT EXISTS is_new_visitor BOOLEAN DEFAULT true;
ALTER TABLE public.portfolio_visits ADD COLUMN IF NOT EXISTS page TEXT DEFAULT '/';

-- 3. Create indices for instant querying, search, and aggregations
CREATE INDEX IF NOT EXISTS idx_portfolio_visits_created_at ON public.portfolio_visits (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_visits_ip ON public.portfolio_visits (ip);
CREATE INDEX IF NOT EXISTS idx_portfolio_visits_country ON public.portfolio_visits (country_code);
CREATE INDEX IF NOT EXISTS idx_portfolio_visits_visitor_id ON public.portfolio_visits (visitor_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_visits_session_id ON public.portfolio_visits (session_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_visits_page ON public.portfolio_visits (page);

-- 4. Enable Row Level Security (RLS) to enforce strict owner-only privacy
ALTER TABLE public.portfolio_visits ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anonymous visitors to INSERT records (so frontend tracking logs visits)
DROP POLICY IF EXISTS "Allow anonymous insert visits" ON public.portfolio_visits;
CREATE POLICY "Allow anonymous insert visits"
  ON public.portfolio_visits
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

-- Policy 2: Strictly restrict SELECT (viewing visitor records) to service_role (Admin API only)
-- Public visitors CANNOT read any IP addresses, locations, or visit counts from this table!
DROP POLICY IF EXISTS "Allow select for service_role only" ON public.portfolio_visits;
CREATE POLICY "Allow select for service_role only"
  ON public.portfolio_visits
  FOR SELECT
  TO service_role
  USING (true);

-- Policy 3: Allow service_role to delete/clean old test records if requested
DROP POLICY IF EXISTS "Allow delete for service_role only" ON public.portfolio_visits;
CREATE POLICY "Allow delete for service_role only"
  ON public.portfolio_visits
  FOR DELETE
  TO service_role
  USING (true);

-- ==========================================================
-- DONE! Your secure visitor tracking database is ready.
-- ==========================================================
