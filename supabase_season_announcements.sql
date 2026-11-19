-- =========================================================================
-- FAEQUEST RPG TODO - SUPABASE SEASON ANNOUNCEMENTS & SEASON RESET ENGINE
-- =========================================================================
-- Bảng Thông Báo Mùa Giải & Quản Lý Sự Kiện Đua Top
-- Bảng màu & Phong cách: Obsidian & Steel (#06141B, #11212D, #253745, #4A5C6A, #9BA8AB, #CCD0CF)
-- =========================================================================

-- 1. Tạo bảng public.season_announcements (nếu chưa có)
CREATE TABLE IF NOT EXISTS public.season_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_tag TEXT NOT NULL DEFAULT 'Mùa 1',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT DEFAULT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_by TEXT DEFAULT 'Quản Trị Viên',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index hỗ trợ hiển thị bài ghim trước, sau đó sắp xếp theo thời gian mới nhất
CREATE INDEX IF NOT EXISTS idx_season_announcements_pinned ON public.season_announcements (is_pinned DESC, created_at DESC);

-- 2. Cấu hình Row Level Security (RLS)
ALTER TABLE public.season_announcements ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả người dùng (kể cả khách / anon) xem thông báo mùa giải
DROP POLICY IF EXISTS "Public can view season announcements" ON public.season_announcements;
CREATE POLICY "Public can view season announcements"
ON public.season_announcements
FOR SELECT
TO anon, authenticated
USING (true);

-- Cho phép Quản trị viên (hoặc anon khi test) thêm, sửa, xóa thông báo mùa giải
DROP POLICY IF EXISTS "Admins can manage season announcements" ON public.season_announcements;
CREATE POLICY "Admins can manage season announcements"
ON public.season_announcements
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3. Kích hoạt Supabase Realtime cho bảng thông báo mùa giải
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'season_announcements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.season_announcements;
  END IF;
END $$;
