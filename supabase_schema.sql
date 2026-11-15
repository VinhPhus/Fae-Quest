-- ========================================================
-- FAEQUEST RPG TODO - SUPABASE DATABASE SCHEMA
-- ========================================================

-- 1. Bảng public.profiles (Lưu thông tin thợ săn & hiển thị BXH Cộng Đồng)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  avatar_url TEXT,
  exp INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 0,
  rank_id TEXT DEFAULT 'dong',
  equipped_title TEXT DEFAULT 'tan-binh',
  streak INTEGER DEFAULT 0,
  completed_tasks_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index hỗ trợ truy vấn Top EXP siêu nhanh trên BXH
CREATE INDEX IF NOT EXISTS idx_profiles_exp ON public.profiles (exp DESC);

-- 2. Bảng public.user_states (Lưu trữ toàn bộ snapshot dữ liệu nhiệm vụ, shop, inventory)
CREATE TABLE IF NOT EXISTS public.user_states (
  user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  state_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Cấu hình Row Level Security (RLS) để Anon Client có thể đọc & ghi (Upsert)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_states ENABLE ROW LEVEL SECURITY;

-- Policy cho profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow public access to profiles'
  ) THEN
    CREATE POLICY "Allow public access to profiles"
    ON public.profiles
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Policy cho user_states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_states' AND policyname = 'Allow public access to user_states'
  ) THEN
    CREATE POLICY "Allow public access to user_states"
    ON public.user_states
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;
