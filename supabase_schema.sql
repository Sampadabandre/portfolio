-- ==========================================================
-- SAMPADA BANDRE PORTFOLIO — VISITOR TRACKING DATABASE SCHEMA
-- ==========================================================
-- Instructions:
-- 1. Log in to your free Supabase account (https://supabase.com).
-- 2. Open your project -> click "SQL Editor" on the left menu.
-- 3. Click "+ New query", paste this entire script, and click "Run".
-- ==========================================================

-- 1. Create table for portfolio visitor logs
CREATE TABLE IF NOT EXISTS public.portfolio_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  ip TEXT,
  city TEXT DEFAULT 'Unknown',
  region TEXT DEFAULT 'Unknown',
  country TEXT DEFAULT 'Unknown',
  country_code TEXT DEFAULT 'XX',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  device TEXT DEFAULT 'Desktop',
  browser TEXT DEFAULT 'Unknown',
  os TEXT DEFAULT 'Unknown',
  screen TEXT DEFAULT 'Unknown',
  page TEXT DEFAULT '/',
  referrer TEXT DEFAULT 'Direct',
  user_agent TEXT
);

-- 2. Create indices for instant querying and sorting
CREATE INDEX IF NOT EXISTS idx_portfolio_visits_created_at ON public.portfolio_visits (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_visits_ip ON public.portfolio_visits (ip);
CREATE INDEX IF NOT EXISTS idx_portfolio_visits_country ON public.portfolio_visits (country_code);

-- 3. Enable Row Level Security (RLS) to enforce owner-only privacy
ALTER TABLE public.portfolio_visits ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anonymous visitors to INSERT records (so tracking logs page views)
DROP POLICY IF EXISTS "Allow anonymous insert visits" ON public.portfolio_visits;
CREATE POLICY "Allow anonymous insert visits"
  ON public.portfolio_visits
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

-- Policy 2: Strictly restrict SELECT (viewing visitors) to service_role (Admin API only)
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
-- DONE! Your secure tracking table is ready.
-- ==========================================================
