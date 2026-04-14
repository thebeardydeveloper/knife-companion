-- Tabla para reportes de publicaciones
CREATE TABLE IF NOT EXISTS public.post_reports (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  -- Evitar reportes duplicados del mismo usuario al mismo post
  CONSTRAINT post_reports_unique UNIQUE (post_id, reporter_id)
);

-- RLS: solo insertar, no leer (privacidad del reporter)
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report posts"
  ON public.post_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);
