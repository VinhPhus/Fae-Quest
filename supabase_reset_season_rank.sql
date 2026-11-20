-- =========================================================================
-- FAEQUEST RPG TODO - SUPABASE RPC: RESET RANK MÙA GIẢI (SEASON RANK RESET)
-- =========================================================================
-- Hướng dẫn: Mở Supabase Dashboard -> SQL Editor -> Dán toàn bộ nội dung và bấm RUN.
-- 
-- Chức năng:
-- 1. Giảm 2 bậc Rank cho toàn bộ Thợ Săn trên Đấu Trường (ngoại trừ tài khoản mang role 'admin').
-- 2. Tự động quy đổi điểm EXP về mốc tối thiểu của bậc Rank mới:
--    - Thách Đấu (>= 5001)       -> Lùi 2 bậc thành Cao Thủ (1801 EXP, 'cao-thu')
--    - Đại Cao Thủ (3001 - 5000)  -> Lùi 2 bậc thành Lục Bảo (1001 EXP, 'luc-bao')
--    - Cao Thủ (1801 - 3000)      -> Lùi 2 bậc thành Vàng (501 EXP, 'vang')
--    - Lục Bảo (1001 - 1800)      -> Lùi 2 bậc thành Bạc (201 EXP, 'bac')
--    - Vàng (501 - 1000)         -> Lùi 2 bậc thành Đồng (0 EXP, 'dong')
--    - Bạc (201 - 500)           -> Lùi về Đồng (0 EXP, 'dong')
--    - Đồng (0 - 200)            -> Về mốc Đồng (0 EXP, 'dong')
-- 3. Đồng bộ cập nhật đồng thời cả 2 bảng public.profiles và public.user_states.
-- 4. Tự động đăng thông báo Mùa Giải Mới vào bảng public.season_announcements.
-- 5. Thực thi với quyền SECURITY DEFINER để vượt qua rào cản RLS khi cập nhật chéo giữa các người chơi.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.rpc_admin_reset_season_rank(
  p_season_title TEXT DEFAULT 'Mùa Mới',
  p_custom_notice TEXT DEFAULT NULL,
  p_admin_id TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id TEXT := auth.uid()::text;
  v_is_caller_admin BOOLEAN := FALSE;
  v_profile RECORD;
  v_current_exp BIGINT;
  v_new_exp INT;
  v_new_rank_id TEXT;
  v_affected_count INT := 0;
  v_notice_content TEXT;
BEGIN
  -- 1. Kiểm tra quyền Quản Trị Viên (Admin)
  IF v_caller_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = v_caller_id AND role = 'admin'
    ) INTO v_is_caller_admin;
  END IF;

  -- Nếu auth.uid() không có hoặc chưa gắn role admin, kiểm tra p_admin_id
  IF NOT v_is_caller_admin AND p_admin_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = p_admin_id AND role = 'admin'
    ) INTO v_is_caller_admin;
  END IF;

  -- Kiểm tra helper function fn_is_admin() nếu có
  IF NOT v_is_caller_admin THEN
    BEGIN
      v_is_caller_admin := public.fn_is_admin();
    EXCEPTION WHEN OTHERS THEN
      v_is_caller_admin := FALSE;
    END;
  END IF;

  -- Nếu hệ thống chưa thiết lập bất kỳ tài khoản admin nào trong DB, tạm thời cho phép người gọi thực thi
  IF NOT v_is_caller_admin THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
      v_is_caller_admin := TRUE;
    END IF;
  END IF;

  IF NOT v_is_caller_admin THEN
    RAISE EXCEPTION 'Forbidden: Chỉ Quản Trị Viên (Admin) mới có quyền thực hiện Reset Rank Mùa Giải.';
  END IF;

  -- 2. Duyệt qua tất cả người chơi bình thường (loại trừ tài khoản admin)
  -- Sử dụng COALESCE để đảm bảo không bỏ sót các tài khoản có role IS NULL
  FOR v_profile IN 
    SELECT id, username, exp, role 
    FROM public.profiles 
    WHERE role IS NULL OR role <> 'admin'
  LOOP
    v_current_exp := COALESCE(v_profile.exp, 0);

    -- Quy tắc lùi 2 bậc Rank theo mốc EXP chuẩn của FaeQuest:
    IF v_current_exp >= 5001 THEN
      v_new_exp := 1801;
      v_new_rank_id := 'cao-thu';
    ELSIF v_current_exp >= 3001 THEN
      v_new_exp := 1001;
      v_new_rank_id := 'luc-bao';
    ELSIF v_current_exp >= 1801 THEN
      v_new_exp := 501;
      v_new_rank_id := 'vang';
    ELSIF v_current_exp >= 1001 THEN
      v_new_exp := 201;
      v_new_rank_id := 'bac';
    ELSE
      v_new_exp := 0;
      v_new_rank_id := 'dong';
    END IF;

    -- A. Cập nhật bảng public.profiles
    UPDATE public.profiles
    SET exp = v_new_exp,
        rank_id = v_new_rank_id,
        updated_at = NOW()
    WHERE id = v_profile.id;

    -- B. Cập nhật bảng public.user_states nếu có snapshot JSON
    UPDATE public.user_states
    SET state_json = jsonb_set(state_json, '{exp}', to_jsonb(v_new_exp)),
        updated_at = NOW()
    WHERE user_id = v_profile.id
      AND state_json IS NOT NULL;

    v_affected_count := v_affected_count + 1;
  END LOOP;

  -- 3. Tạo thông báo Mùa Giải mới vào bảng public.season_announcements
  v_notice_content := COALESCE(
    p_custom_notice,
    '⚔️ Mùa giải "' || p_season_title || '" đã chính thức khởi tranh!\nToàn bộ Thợ Săn trên Đấu Trường đã được giảm 2 bậc Rank để sẵn sàng cho cuộc đua vinh quang mới.\n\nHãy hoàn thành nhiệm vụ mỗi ngày, thắp sáng ngọn lửa kỷ luật và khắc tên bạn lên Bục Vinh Quang!'
  );

  BEGIN
    INSERT INTO public.season_announcements (
      season_tag, title, content, is_pinned, image_url, created_at
    ) VALUES (
      p_season_title,
      '⚔️ Khởi Tranh Mùa Giải: ' || p_season_title,
      v_notice_content,
      true,
      null,
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Nếu bảng chưa có, bỏ qua không làm gián đoạn transaction reset rank
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'affected_count', v_affected_count,
    'season_title', p_season_title
  );
END;
$$;

-- Cấp quyền thực thi cho client qua Supabase RPC
GRANT EXECUTE ON FUNCTION public.rpc_admin_reset_season_rank(TEXT, TEXT, TEXT) TO authenticated, anon;
