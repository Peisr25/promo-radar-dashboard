CREATE POLICY "Allow public read for redirection"
ON public.short_links
FOR SELECT
TO anon
USING (is_active = true);