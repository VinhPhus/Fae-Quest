-- =========================================================================
-- FAEQUEST RPG TODO - SUPABASE UPDATE SYSTEM TITLES & ICONS TO PIXEL ART 64x64
-- =========================================================================
-- Đồng bộ hóa bộ icon Pixel Art 64x64 mới cho toàn bộ 8 Thành Tựu & Danh Hiệu
-- 1. Tân Binh Gai Đỏ: /assets/titles/title-tan-binh.png
-- 2. Chiến Binh Bất Khuất: /assets/titles/title-chien-binh.png
-- 3. Kẻ Chế Ngự Thời Gian: /assets/titles/title-che-ngu.png
-- 4. Thể Phách Kim Cương: /assets/titles/title-the-phach.png
-- 5. Học Giả Huyền Bí: /assets/titles/title-hoc-gia.png
-- 6. Thợ Săn Nhiệm Vụ: /assets/titles/title-tho-san.png
-- 7. Hiền Nhân Tập Trung: /assets/titles/title-hien-nhan.png
-- 8. Độc Cô Cầu Bại: /assets/titles/title-doc-co.png
-- =========================================================================

-- 1. Cập nhật bảng public.system_achievements với đường dẫn chuẩn
UPDATE public.system_achievements
SET icon_url = '/assets/titles/title-tan-binh.png'
WHERE title ILIKE '%Tân Binh%' OR granted_title_name ILIKE '%Tân Binh%';

UPDATE public.system_achievements
SET icon_url = '/assets/titles/title-chien-binh.png'
WHERE title ILIKE '%Chiến Binh%' OR title ILIKE '%Thần Kỷ Luật%' OR granted_title_name ILIKE '%Chiến Binh%' OR granted_title_name ILIKE '%Kỷ Luật Chi Thần%';

UPDATE public.system_achievements
SET icon_url = '/assets/titles/title-che-ngu.png'
WHERE title ILIKE '%Chế Ngự%' OR title ILIKE '%Thời Gian%' OR granted_title_name ILIKE '%Chế Ngự%';

UPDATE public.system_achievements
SET icon_url = '/assets/titles/title-the-phach.png'
WHERE title ILIKE '%Thể Phách%' OR title ILIKE '%Kim Cương%' OR granted_title_name ILIKE '%Thể Phách%';

UPDATE public.system_achievements
SET icon_url = '/assets/titles/title-hoc-gia.png'
WHERE title ILIKE '%Học Giả%' OR title ILIKE '%Huyền Bí%' OR granted_title_name ILIKE '%Học Giả%';

UPDATE public.system_achievements
SET icon_url = '/assets/titles/title-tho-san.png'
WHERE title ILIKE '%Thợ Săn%' OR title ILIKE '%Đại Kiện Tướng%' OR granted_title_name ILIKE '%Thợ Săn%' OR granted_title_name ILIKE '%Đại Kiện Tướng%';

UPDATE public.system_achievements
SET icon_url = '/assets/titles/title-hien-nhan.png'
WHERE title ILIKE '%Hiền Nhân%' OR title ILIKE '%Tập Trung%' OR title ILIKE '%Tĩnh Lặng%' OR granted_title_name ILIKE '%Hiền Nhân%';

UPDATE public.system_achievements
SET icon_url = '/assets/titles/title-doc-co.png'
WHERE title ILIKE '%Độc Cô%' OR title ILIKE '%Cầu Bại%' OR granted_title_name ILIKE '%Độc Cô%';

-- 2. Thêm hoặc cập nhật 8 Danh Hiệu Pixel Art vào Kho Tài Nguyên Admin (public.admin_assets)
INSERT INTO public.admin_assets (name, url, category)
VALUES
  ('Danh Hiệu: Tân Binh Gai Đỏ', '/assets/titles/title-tan-binh.png', 'achievement'),
  ('Danh Hiệu: Chiến Binh Bất Khuất', '/assets/titles/title-chien-binh.png', 'achievement'),
  ('Danh Hiệu: Kẻ Chế Ngự Thời Gian', '/assets/titles/title-che-ngu.png', 'achievement'),
  ('Danh Hiệu: Thể Phách Kim Cương', '/assets/titles/title-the-phach.png', 'achievement'),
  ('Danh Hiệu: Học Giả Huyền Bí', '/assets/titles/title-hoc-gia.png', 'achievement'),
  ('Danh Hiệu: Thợ Săn Nhiệm Vụ', '/assets/titles/title-tho-san.png', 'achievement'),
  ('Danh Hiệu: Hiền Nhân Tập Trung', '/assets/titles/title-hien-nhan.png', 'achievement'),
  ('Danh Hiệu: Độc Cô Cầu Bại', '/assets/titles/title-doc-co.png', 'achievement'),
  ('Xu Vàng Pixel', '/assets/coin.png', 'all')
ON CONFLICT DO NOTHING;
