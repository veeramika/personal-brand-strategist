-- User tiers for Veda Verse
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.user_tiers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create a free tier row when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_tiers (user_id, tier) VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: users can read their own tier
ALTER TABLE public.user_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own tier" ON public.user_tiers FOR SELECT USING (auth.uid() = user_id);

-- To upgrade a user to premium (run manually or via payment webhook):
-- UPDATE public.user_tiers SET tier = 'premium', updated_at = now() WHERE user_id = '<user-uuid>';
