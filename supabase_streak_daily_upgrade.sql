-- ==============================================================================
-- FAEQUEST: NÂNG CẤP HỆ THỐNG CHUỖI KỶ LUẬT (DAILY LOGIN STREAK)
-- CƠ CHẾ: MỞ APP / ĐĂNG NHẬP SAU 00:00 ĐỊA PHƯƠNG TỰ ĐỘNG +1 NGÀY CHUỖI
-- ==============================================================================

-- 1. Bổ sung cột last_streak_date (lưu ngày điểm danh YYYY-MM-DD theo giờ địa phương)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_streak_date text;

-- 2. Đảm bảo cột streak có kiểu số nguyên và mặc định là 0
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak integer DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN streak SET DEFAULT 0;

-- 3. Cấp quyền UPDATE cột streak và last_streak_date cho authenticated users
GRANT UPDATE (streak, last_streak_date) ON public.profiles TO authenticated;

-- 4. Đảm bảo RLS Policy cho phép user tự cập nhật dòng hồ sơ của chính mình
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'Allow users to update own profile display'
  ) THEN
    CREATE POLICY "Allow users to update own profile display"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = id)
    WITH CHECK (auth.uid()::text = id);
  END IF;
END $$;

-- 5. Cấp quyền SELECT trên bảng profiles
GRANT SELECT ON public.profiles TO authenticated, anon;
