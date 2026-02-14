
DROP POLICY "Allow public insert" ON public.raw_scrapes;

CREATE POLICY "Allow public insert"
ON public.raw_scrapes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
