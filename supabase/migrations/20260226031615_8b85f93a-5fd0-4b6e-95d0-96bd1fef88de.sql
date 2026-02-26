
-- Step 1: Add new bigint column
ALTER TABLE public.promotions ADD COLUMN raw_scrape_id_new bigint;

-- Step 2: Backfill from existing data where possible (by matching product_url to raw_scrapes.original_url)
UPDATE public.promotions p
SET raw_scrape_id_new = sub.scrape_id
FROM (
  SELECT DISTINCT ON (rs.original_url) rs.original_url, rs.id AS scrape_id
  FROM public.raw_scrapes rs
  WHERE rs.original_url IS NOT NULL
  ORDER BY rs.original_url, rs.id DESC
) sub
WHERE p.product_url = sub.original_url
  AND p.raw_scrape_id_new IS NULL;

-- Step 3: Drop old uuid column
ALTER TABLE public.promotions DROP COLUMN raw_scrape_id;

-- Step 4: Rename new column
ALTER TABLE public.promotions RENAME COLUMN raw_scrape_id_new TO raw_scrape_id;

-- Step 5: Add FK constraint
ALTER TABLE public.promotions
  ADD CONSTRAINT promotions_raw_scrape_id_fkey
  FOREIGN KEY (raw_scrape_id) REFERENCES public.raw_scrapes(id) ON DELETE SET NULL;

-- Step 6: Add index for performance
CREATE INDEX idx_promotions_raw_scrape_id ON public.promotions(raw_scrape_id);
