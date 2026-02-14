
-- Add missing columns to short_links
ALTER TABLE public.short_links
ADD COLUMN IF NOT EXISTS product_title TEXT,
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_short_links_is_active ON public.short_links(is_active);
CREATE INDEX IF NOT EXISTS idx_short_links_source ON public.short_links(source);

-- Create trigger function to increment click count and update last_clicked_at
CREATE OR REPLACE FUNCTION public.increment_click_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.short_links
  SET click_count = click_count + 1,
      last_clicked_at = NOW()
  WHERE id = NEW.short_link_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger on click_logs
DROP TRIGGER IF EXISTS trigger_increment_click_count ON public.click_logs;
CREATE TRIGGER trigger_increment_click_count
AFTER INSERT ON public.click_logs
FOR EACH ROW
EXECUTE FUNCTION public.increment_click_count();
