-- ── User role ─────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text
  CHECK (role IN ('artisan', 'collector', 'enthusiast'))
  DEFAULT 'enthusiast';

-- ── Post count (cached, maintained by trigger) ────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS post_count int NOT NULL DEFAULT 0;

-- Backfill from existing posts
UPDATE public.profiles p
SET post_count = (SELECT COUNT(*) FROM public.posts WHERE user_id = p.id);

-- Trigger function
CREATE OR REPLACE FUNCTION public.update_profile_post_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET post_count = post_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET post_count = GREATEST(0, post_count - 1) WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_post_count ON public.posts;
CREATE TRIGGER trg_post_count
AFTER INSERT OR DELETE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.update_profile_post_count();

-- ── Rank tiers (configurable from admin) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rank_tiers (
  id         serial PRIMARY KEY,
  name       text NOT NULL,
  min_posts  int  NOT NULL,
  color      text NOT NULL DEFAULT '#8A837A',
  sort_order int  NOT NULL DEFAULT 0
);

-- Seed defaults (only if table is empty)
INSERT INTO public.rank_tiers (name, min_posts, color, sort_order)
SELECT * FROM (VALUES
  ('Principiante', 0,   '#8A837A', 0),
  ('Intermedio',   10,  '#5BB8F5', 1),
  ('Avanzado',     50,  '#4CAF7D', 2),
  ('Profesional',  100, '#A87FE8', 3),
  ('Maestro',      200, '#E8571A', 4),
  ('Leyenda',      300, '#FFD700', 5)
) AS v(name, min_posts, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.rank_tiers);

-- RLS
ALTER TABLE public.rank_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rank_tiers_select" ON public.rank_tiers;
CREATE POLICY "rank_tiers_select" ON public.rank_tiers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "rank_tiers_admin_all" ON public.rank_tiers;
CREATE POLICY "rank_tiers_admin_all" ON public.rank_tiers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
