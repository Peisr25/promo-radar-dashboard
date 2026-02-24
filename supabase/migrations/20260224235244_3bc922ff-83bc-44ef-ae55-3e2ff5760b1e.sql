-- 1. Drop the view that depends on the columns
DROP VIEW IF EXISTS public.vw_raw_scrapes_detailed;

-- 2. Alter the three columns to text
ALTER TABLE public.raw_scrapes
  ALTER COLUMN rating TYPE text,
  ALTER COLUMN discount_percentage TYPE text,
  ALTER COLUMN price_type TYPE text;

-- 3. Recreate the view with original structure
CREATE OR REPLACE VIEW public.vw_raw_scrapes_detailed AS
SELECT
  id,
  created_at,
  product_title,
  original_url,
  price AS current_price,
  old_price,
  discount_percentage,
  rating,
  installments,
  price_type,
  image_url,
  source,
  status,
  metadata,
  CASE
    WHEN old_price IS NOT NULL AND price IS NOT NULL AND old_price > 0
    THEN (old_price::double precision - price) 
    ELSE NULL
  END AS savings_amount,
  CASE
    WHEN old_price IS NOT NULL AND price IS NOT NULL AND old_price > price
    THEN true
    ELSE false
  END AS has_discount,
  CASE
    WHEN discount_percentage IS NOT NULL THEN
      CASE
        WHEN (regexp_replace(discount_percentage, '[^0-9]', '', 'g'))::int >= 70 THEN 'mega'
        WHEN (regexp_replace(discount_percentage, '[^0-9]', '', 'g'))::int >= 50 THEN 'super'
        WHEN (regexp_replace(discount_percentage, '[^0-9]', '', 'g'))::int >= 30 THEN 'bom'
        ELSE 'normal'
      END
    ELSE 'normal'
  END AS discount_category
FROM public.raw_scrapes;