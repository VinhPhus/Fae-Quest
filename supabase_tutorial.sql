-- ==============================================================================
-- FAEQUEST RPG TODO - ONBOARDING TUTORIAL MIGRATION
-- Thêm cột has_seen_tutorial vào bảng public.profiles để quản lý trạng thái tour
-- ==============================================================================

-- 1. Thêm cột has_seen_tutorial nếu chưa tồn tại (mặc định là false cho tài khoản mới)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_seen_tutorial BOOLEAN DEFAULT FALSE;

-- 2. Đánh dấu các tài khoản cũ (đã có EXP hoặc đã từng hoàn thành nhiệm vụ) là TRUE
-- để không làm phiền người chơi cũ khi đăng nhập lại trên thiết bị mới
UPDATE public.profiles
SET has_seen_tutorial = TRUE
WHERE exp > 0 OR completed_tasks_count > 0;

-- 3. Cấp quyền truy cập cho authenticated users cập nhật trường has_seen_tutorial của chính họ
DO $$
BEGIN
    -- Đảm bảo RLS cho phép UPDATE trường has_seen_tutorial
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile"
        ON public.profiles
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;
