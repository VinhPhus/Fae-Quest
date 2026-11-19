-- =========================================================================
-- FAEQUEST RPG TODO - SUPABASE ADMIN ASSET VAULT ENGINE
-- =========================================================================
-- Kho Hình Tài Nguyên Quản Trị Hệ Thống (Admin Asset Vault)
-- Lưu trữ và tái sử dụng hình ảnh cho Thành Tựu, Danh Hiệu & Cửa Hàng Hệ Thống
-- Bảng màu & Phong cách: Obsidian & Steel (#06141B, #11212D, #253745, #4A5C6A, #9BA8AB, #CCD0CF)
-- =========================================================================

-- 1. Tạo bảng public.admin_assets (nếu chưa có)
CREATE TABLE IF NOT EXISTS public.admin_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'all' CHECK (category IN ('all', 'achievement', 'shop')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index hỗ trợ tìm kiếm và lọc theo danh mục, sắp xếp mới nhất lên đầu
CREATE INDEX IF NOT EXISTS idx_admin_assets_category_created ON public.admin_assets (category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_assets_created ON public.admin_assets (created_at DESC);

-- 2. Cấu hình Row Level Security (RLS)
ALTER TABLE public.admin_assets ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả người dùng (hoặc admin) đọc tài nguyên để render UI
DROP POLICY IF EXISTS "Public can view admin assets" ON public.admin_assets;
CREATE POLICY "Public can view admin assets"
ON public.admin_assets
FOR SELECT
TO anon, authenticated
USING (true);

-- Cho phép Quản trị viên (hoặc anon khi test) thêm, sửa, xóa tài nguyên
DROP POLICY IF EXISTS "Admins can manage admin assets" ON public.admin_assets;
CREATE POLICY "Admins can manage admin assets"
ON public.admin_assets
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3. Kích hoạt Supabase Realtime cho bảng admin_assets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'admin_assets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_assets;
  END IF;
END $$;
