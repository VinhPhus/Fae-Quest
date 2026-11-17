-- =========================================================================
-- FAEQUEST RPG TODO - FIX COVER_URL COLUMN & PERMISSIONS ON PUBLIC.PROFILES
-- =========================================================================

-- 1. Đảm bảo cột cover_url tồn tại trên bảng public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url TEXT DEFAULT NULL;

-- 2. Cấp quyền UPDATE cột cover_url cho người dùng đã xác thực (authenticated) và khách (anon)
GRANT UPDATE (username, avatar_url, cover_url, equipped_title, updated_at) ON public.profiles TO authenticated;
GRANT UPDATE (username, avatar_url, cover_url, equipped_title, updated_at) ON public.profiles TO anon;

-- 3. Đảm bảo bảng profiles đã bật REPLICA IDENTITY FULL để gửi toàn bộ cột khi có UPDATE Realtime
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- 4. Đảm bảo bảng profiles có trong publication supabase_realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
