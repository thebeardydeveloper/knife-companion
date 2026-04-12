-- ─── Profiles ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_public_read"  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_insert"   ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_own_update"   ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ─── Posts ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url   text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at  timestamptz DEFAULT now(),
  fb_post_id  text,
  ig_media_id text
);

-- Index for feed query (newest first)
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts (created_at DESC);

-- RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_public_read"  ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_own_insert"   ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_own_update"   ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_own_delete"   ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- ─── Social connections ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_connections (
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform     text NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  access_token text NOT NULL,
  account_id   text NOT NULL,
  auto_publish boolean DEFAULT false,
  PRIMARY KEY (user_id, platform)
);

ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_own_read"   ON public.social_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "social_own_write"  ON public.social_connections FOR ALL  USING (auth.uid() = user_id);

-- ─── Storage bucket ───────────────────────────────────────────────────────────
-- Run in Supabase Dashboard → Storage → New bucket: name="posts", Public=true
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "posts_bucket_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'posts');

CREATE POLICY "posts_bucket_auth_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'posts' AND auth.uid() IS NOT NULL);

CREATE POLICY "posts_bucket_own_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);
