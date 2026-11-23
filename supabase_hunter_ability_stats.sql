-- ========================================================
-- FAEQUEST RPG TODO - RPC GET HUNTER ABILITY STATS (SECURE)
-- ========================================================
-- Cho phép truy vấn an toàn thống kê chỉ số năng lực của
-- bất kỳ Thợ Săn nào trên Đấu Trường để vẽ Sơ Đồ Lục Giác.
-- BẢO MẬT TUYỆT ĐỐI: Chỉ trả về số lượng nhiệm vụ và EXP tích lũy
-- theo từng danh mục, KHÔNG trả về tiêu đề hay nội dung nhiệm vụ cá nhân.
-- ========================================================

CREATE OR REPLACE FUNCTION public.rpc_get_hunter_ability_stats(p_hunter_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_state jsonb;
  v_profile public.profiles%ROWTYPE;
  v_cat_stats jsonb;
  v_diff_stats jsonb;
  v_focus_count int := 0;
  v_streak int := 0;
  v_completed_total int := 0;
  v_exp int := 0;
BEGIN
  -- 1. Đọc thông tin công khai từ public.profiles
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_hunter_id;
  IF FOUND THEN
    v_streak := COALESCE(v_profile.streak, 0);
    v_completed_total := COALESCE(v_profile.completed_tasks_count, 0);
    v_exp := COALESCE(v_profile.exp, 0);
  END IF;

  -- 2. Đọc snapshot dữ liệu từ public.user_states
  SELECT state_json INTO v_state FROM public.user_states WHERE user_id = p_hunter_id;

  IF v_state IS NOT NULL THEN
    v_cat_stats := v_state->'cumulativeCategoryStats';
    v_diff_stats := v_state->'cumulativeDifficultyStats';
    v_focus_count := COALESCE((v_state->>'focusSessionsCompleted')::int, 0);
    
    IF v_streak = 0 THEN
      v_streak := COALESCE((v_state->>'streakDays')::int, 0);
    END IF;
    IF v_completed_total = 0 THEN
      v_completed_total := COALESCE((v_state->>'completedTotal')::int, 0);
    END IF;
    IF v_exp = 0 THEN
      v_exp := COALESCE((v_state->>'exp')::int, 0);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'hunter_id', p_hunter_id,
    'cumulativeCategoryStats', v_cat_stats,
    'cumulativeDifficultyStats', v_diff_stats,
    'focusSessionsCompleted', v_focus_count,
    'streak', v_streak,
    'completedTotal', v_completed_total,
    'exp', v_exp
  );
END;
$$;

-- Cấp quyền thực thi an toàn cho cả khách (anon) và người dùng đã đăng nhập (authenticated)
GRANT EXECUTE ON FUNCTION public.rpc_get_hunter_ability_stats(text) TO anon, authenticated;
