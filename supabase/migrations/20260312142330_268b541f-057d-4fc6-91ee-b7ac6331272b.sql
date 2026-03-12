-- Table 1: events (single event system)
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  entry_open boolean DEFAULT false,
  exit_open boolean DEFAULT false,
  exit_closes_at timestamptz NULL,
  created_at timestamptz DEFAULT now()
);

-- Table 2: registrations
CREATE TABLE public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  usn text NOT NULL UNIQUE,
  registered_at timestamptz DEFAULT now()
);

-- Table 3: attendance
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usn text NOT NULL UNIQUE,
  ip text,
  fingerprint text,
  submitted_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Public read access for events (students need to check event state)
CREATE POLICY "Anyone can read events" ON public.events FOR SELECT USING (true);

-- Public read access for registrations (needed for dashboard and live feed)
CREATE POLICY "Anyone can read registrations" ON public.registrations FOR SELECT USING (true);

-- Public read access for attendance (needed for dashboard and live feed)
CREATE POLICY "Anyone can read attendance" ON public.attendance FOR SELECT USING (true);

-- Allow service role to insert registrations
CREATE POLICY "Service role can insert registrations" ON public.registrations FOR INSERT WITH CHECK (true);

-- Allow service role to insert attendance
CREATE POLICY "Service role can insert attendance" ON public.attendance FOR INSERT WITH CHECK (true);

-- Seed one default event row
INSERT INTO public.events (name, entry_open, exit_open) VALUES ('Tech Event 2026', false, false);