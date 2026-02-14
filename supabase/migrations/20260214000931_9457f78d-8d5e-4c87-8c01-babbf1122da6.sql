
-- Drop FK from promotions referencing raw_scrapes
ALTER TABLE public.promotions DROP CONSTRAINT IF EXISTS promotions_raw_scrape_id_fkey;

-- Drop old raw_scrapes table
DROP TABLE IF EXISTS public.raw_scrapes;

-- Create new raw_scrapes table with user's schema
CREATE TABLE public.raw_scrapes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  product_title text,
  original_url text,
  price float8,
  image_url text,
  source text,
  status text NOT NULL DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.raw_scrapes ENABLE ROW LEVEL SECURITY;

-- Public insert policy (for external scraper via API key)
CREATE POLICY "Allow public insert" ON public.raw_scrapes FOR INSERT WITH CHECK (true);

-- Authenticated users can read all
CREATE POLICY "Authenticated users can read" ON public.raw_scrapes FOR SELECT TO authenticated USING (true);

-- Authenticated users can update
CREATE POLICY "Authenticated users can update" ON public.raw_scrapes FOR UPDATE TO authenticated USING (true);

-- Authenticated users can delete
CREATE POLICY "Authenticated users can delete" ON public.raw_scrapes FOR DELETE TO authenticated USING (true);
