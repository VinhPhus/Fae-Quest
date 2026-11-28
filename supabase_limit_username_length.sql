-- =========================================================================
-- FAEQUEST RPG TODO - GIỚI HẠN SỐ KÝ TỰ TÊN NGƯỜI DÙNG (2 - 20 KÝ TỰ)
-- =========================================================================
-- Đặt lại về tên mặc định 'Thợ Săn Fae' cho toàn bộ tài khoản có tên
-- vượt quá 20 ký tự hoặc dưới 2 ký tự (sau khi rút gọn khoảng trắng).
-- =========================================================================

BEGIN;

-- 1. Chuẩn hóa cột username trong public.profiles
UPDATE public.profiles
SET
  username = 'Thợ Săn Fae',
  updated_at = NOW()
WHERE
  username IS NULL
  OR char_length(btrim(regexp_replace(username, '\s+', ' ', 'g'))) < 2
  OR char_length(btrim(regexp_replace(username, '\s+', ' ', 'g'))) > 20;

-- 2. Đồng bộ tên mặc định vào snapshot JSONB state_json->'playerName' trong public.user_states
UPDATE public.user_states
SET
  state_json = jsonb_set(state_json, '{playerName}', '"Thợ Săn Fae"'::jsonb, true),
  updated_at = NOW()
WHERE
  state_json IS NOT NULL
  AND (
    NOT (state_json ? 'playerName')
    OR state_json->>'playerName' IS NULL
    OR char_length(btrim(regexp_replace(state_json->>'playerName', '\s+', ' ', 'g'))) < 2
    OR char_length(btrim(regexp_replace(state_json->>'playerName', '\s+', ' ', 'g'))) > 20
  );

-- 3. Đồng bộ hiển thị trong public.activity_logs cho các bản ghi vượt giới hạn
UPDATE public.activity_logs
SET username = 'Thợ Săn Fae'
WHERE
  username IS NULL
  OR char_length(btrim(regexp_replace(username, '\s+', ' ', 'g'))) < 2
  OR char_length(btrim(regexp_replace(username, '\s+', ' ', 'g'))) > 20;

-- 4. Gắn ràng buộc kiểm tra độ dài tên trực tiếp trên public.profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_profiles_username_length;
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_username_length
  CHECK (char_length(btrim(regexp_replace(username, '\s+', ' ', 'g'))) BETWEEN 2 AND 20);

NOTIFY pgrst, 'reload schema';
COMMIT;
