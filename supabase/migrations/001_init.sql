-- Supabase schema for personal-brand-strategist onboarding & strategy

-- users table (demo / future-auth mapping)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- profiles (one per user)
CREATE TABLE IF NOT EXISTS profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  profession TEXT,
  industry TEXT,
  years_experience INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- business model details
CREATE TABLE IF NOT EXISTS business_models (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
  business_type TEXT,
  target_audience TEXT,
  offers TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- niche / positioning and generated summary
CREATE TABLE IF NOT EXISTS niche_positioning (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
  primary_goal TEXT,
  why_build TEXT,
  known_for TEXT,
  generated_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- platforms the user wants to grow on
CREATE TABLE IF NOT EXISTS user_platforms (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
  platforms TEXT[],
  posting_frequency TEXT,
  time_per_week INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- content preferences
CREATE TABLE IF NOT EXISTS content_preferences (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
  content_formats TEXT[],
  camera_comfort_level TEXT,
  content_strengths TEXT,
  editing_skill_level TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- posting plan and weekly schedule
CREATE TABLE IF NOT EXISTS posting_plan (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
  recommended_frequency TEXT,
  weekly_schedule JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- generated content ideas
CREATE TABLE IF NOT EXISTS content_ideas (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT REFERENCES profiles(id) ON DELETE CASCADE,
  idea TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- insert a demo user (optional)
INSERT INTO users (email)
  VALUES ('demo@example.com')
  ON CONFLICT (email) DO NOTHING;
