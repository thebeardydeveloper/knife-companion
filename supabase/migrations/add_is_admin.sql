-- Agrega el flag de admin al perfil de usuario
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Solo los admins pueden leer la columna is_admin de otros perfiles
-- (ya existe RLS en profiles — esta columna hereda las mismas políticas)
