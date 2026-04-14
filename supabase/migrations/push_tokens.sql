-- Tabla para almacenar los Expo Push Tokens por dispositivo/usuario
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  token       text NOT NULL,
  platform    text NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at  timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT push_tokens_token_key UNIQUE (token)
);

-- RLS: cada usuario solo puede ver y gestionar sus propios tokens
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tokens"
  ON public.push_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
