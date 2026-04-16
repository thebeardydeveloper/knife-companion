-- ── Tabla de noticias (artículos editoriales del admin) ──────────────────────

CREATE TABLE IF NOT EXISTS public.news_articles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  body_html    text NOT NULL DEFAULT '',
  cover_url    text,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_articles_published_at_idx
  ON public.news_articles (published_at DESC)
  WHERE published_at IS NOT NULL;

ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published news"
  ON public.news_articles FOR SELECT
  USING (published_at IS NOT NULL AND published_at <= now());

CREATE POLICY "Admins can manage news"
  ON public.news_articles FOR ALL
  USING   (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ── Agregar news_id a announcements ──────────────────────────────────────────

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS news_id uuid REFERENCES public.news_articles(id) ON DELETE SET NULL;

-- ── Storage bucket para portadas de noticias ─────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
  VALUES ('news-covers', 'news-covers', true)
  ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can read news covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'news-covers');

CREATE POLICY "Admins can upload news covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'news-covers'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete news covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'news-covers'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
