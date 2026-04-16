-- Tabla de anuncios (administrada por el admin desde el Supabase Dashboard)
DO $$ BEGIN
  CREATE TYPE announcement_type AS ENUM ('update', 'event', 'feature', 'news');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.announcements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  body         text NOT NULL,
  type         announcement_type NOT NULL DEFAULT 'news',
  post_id      uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  published_at timestamptz,          -- null = borrador; setear para publicar
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS announcements_published_at_idx
  ON public.announcements (published_at DESC)
  WHERE published_at IS NOT NULL;

-- RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer los anuncios publicados
CREATE POLICY "Anyone can read published announcements"
  ON public.announcements FOR SELECT
  USING (published_at IS NOT NULL AND published_at <= now());

-- Admins pueden leer todos (incluyendo borradores)
CREATE POLICY "Admins can read all announcements"
  ON public.announcements FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins pueden crear, editar y eliminar
CREATE POLICY "Admins can insert announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update announcements"
  ON public.announcements FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete announcements"
  ON public.announcements FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
