-- Tabla de seguidores entre artesanos
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- Índice para consultas "quién me sigue" (following_id lookup)
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows (following_id);

-- RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver los follows (para mostrar contadores)
CREATE POLICY "Anyone can view follows"
  ON public.follows FOR SELECT
  USING (true);

-- Solo el propio usuario puede seguir
CREATE POLICY "Users can follow"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Solo el propio usuario puede dejar de seguir
CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);
