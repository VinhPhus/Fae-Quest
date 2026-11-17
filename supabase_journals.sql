-- =========================================================================
-- FAEQUEST RPG TODO - HUNTER CHRONICLES (NHẬT KÝ THỢ SĂN)
-- Bảng public.journals, Cấp quyền RLS & Kích hoạt Realtime
-- =========================================================================

-- 1. Tạo bảng public.journals
CREATE TABLE IF NOT EXISTS public.journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT NOT NULL DEFAULT 'Bình thường' CHECK (mood IN ('Tốt', 'Bình thường', 'Tệ', 'Tuyệt vời', 'Căng thẳng')),
  content TEXT NOT NULL DEFAULT '',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Chỉ mục tối ưu truy vấn theo ngày & người dùng
CREATE INDEX IF NOT EXISTS idx_journals_user_date ON public.journals (user_id, date DESC);

-- 3. Kích hoạt Row Level Security (RLS)
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

-- Thu hồi policy cũ nếu có
DROP POLICY IF EXISTS "Users can manage own journals" ON public.journals;
DROP POLICY IF EXISTS "Allow user to select own journals" ON public.journals;
DROP POLICY IF EXISTS "Allow user to insert own journals" ON public.journals;
DROP POLICY IF EXISTS "Allow user to update own journals" ON public.journals;
DROP POLICY IF EXISTS "Allow user to delete own journals" ON public.journals;

-- Tạo các policy RLS: Người dùng chỉ được SELECT, INSERT, UPDATE, DELETE bản ghi của chính mình
CREATE POLICY "Allow user to select own journals"
ON public.journals
FOR SELECT
TO authenticated, anon
USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "Allow user to insert own journals"
ON public.journals
FOR INSERT
TO authenticated, anon
WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "Allow user to update own journals"
ON public.journals
FOR UPDATE
TO authenticated, anon
USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true))
WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "Allow user to delete own journals"
ON public.journals
FOR DELETE
TO authenticated, anon
USING (auth.uid()::text = user_id OR user_id = current_setting('request.jwt.claim.sub', true));

-- Cấp quyền truy cập bảng
GRANT ALL ON public.journals TO authenticated, anon;

-- 4. Bật REPLICA IDENTITY FULL để Supabase Realtime gửi toàn bộ dữ liệu khi thay đổi
ALTER TABLE public.journals REPLICA IDENTITY FULL;

-- 5. Đăng ký bảng vào kênh realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'journals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.journals;
  END IF;
END $$;
