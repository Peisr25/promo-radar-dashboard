
-- Scraper sources
CREATE TABLE public.scraper_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  scrape_interval_minutes INT NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('running', 'pending', 'error')),
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Raw scrapes
CREATE TABLE public.raw_scrapes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.scraper_sources(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image_url TEXT,
  original_price NUMERIC(10,2),
  promo_price NUMERIC(10,2),
  product_url TEXT,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Promotions
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_scrape_id UUID REFERENCES public.raw_scrapes(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image_url TEXT,
  original_price NUMERIC(10,2),
  promo_price NUMERIC(10,2),
  product_url TEXT,
  ai_message TEXT,
  system_prompt TEXT,
  short_link_code TEXT,
  status TEXT NOT NULL DEFAULT 'review' CHECK (status IN ('review', 'queued', 'sent', 'error')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Short links
CREATE TABLE public.short_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  short_code TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  promotion_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL,
  click_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Click logs
CREATE TABLE public.click_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_link_id UUID NOT NULL REFERENCES public.short_links(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT
);

-- Settings
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  gemini_api_key TEXT,
  default_system_prompt TEXT DEFAULT 'Sê criativo e engraçado. Cria uma mensagem promocional curta e divertida para WhatsApp.',
  affiliate_tags JSONB DEFAULT '{}',
  whatsapp_groups JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper function to check short_link ownership
CREATE OR REPLACE FUNCTION public.owns_short_link(link_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.short_links WHERE id = link_id AND user_id = auth.uid()
  );
$$;

-- Enable RLS on all tables
ALTER TABLE public.scraper_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_scrapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS: scraper_sources
CREATE POLICY "Users manage own sources" ON public.scraper_sources FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS: raw_scrapes
CREATE POLICY "Users manage own scrapes" ON public.raw_scrapes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS: promotions
CREATE POLICY "Users manage own promotions" ON public.promotions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS: short_links
CREATE POLICY "Users manage own links" ON public.short_links FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS: click_logs (tied to short_link ownership)
CREATE POLICY "Users view own click logs" ON public.click_logs FOR SELECT USING (public.owns_short_link(short_link_id));
CREATE POLICY "Anyone can insert click logs" ON public.click_logs FOR INSERT WITH CHECK (true);

-- RLS: settings
CREATE POLICY "Users manage own settings" ON public.settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_scraper_sources_updated_at BEFORE UPDATE ON public.scraper_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
