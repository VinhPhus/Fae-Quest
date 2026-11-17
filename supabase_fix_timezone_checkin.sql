-- ==============================================================================
-- BẢN VÁ LỖI MÚI GIỜ ĐIỂM DANH THÀNH TỰU SAU 12:00 ĐÊM (FaeQuest Timezone Fix)
-- ==============================================================================
-- VẤN ĐỀ:
-- Supabase chạy múi giờ mặc định UTC (chậm hơn giờ Việt Nam 7 tiếng, UTC+7).
-- Khi qua 12h đêm tại Việt Nam (00:00 - 07:00 sáng), ngày của người dùng đã là Ngày D+1,
-- nhưng máy chủ UTC vẫn tính là Ngày D (CURRENT_DATE = D).
-- Do đó hàm rpc_checkin_streak so sánh p_last_checkin_date (đã điểm danh hôm qua D)
-- với CURRENT_DATE của máy chủ (vẫn là D) -> Báo lỗi "AlreadyCheckedIn" cho đến 07:00 sáng!
--
-- GIẢI PHÁP:
-- Sử dụng múi giờ chuẩn Việt Nam (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')
-- trong các hàm tính toán ngày của máy chủ (rpc_checkin_streak và rpc_complete_task).
-- ==============================================================================

-- 1. Xóa hàm cũ để tránh trùng lặp chữ ký (Function Signature Overload)
DROP FUNCTION IF EXISTS public.rpc_checkin_streak(text, text, int, int, int, int);

-- 2. Tạo hàm rpc_checkin_streak chuẩn hóa theo múi giờ 'Asia/Ho_Chi_Minh'
CREATE OR REPLACE FUNCTION public.rpc_checkin_streak(
  p_last_checkin_date text,
  p_last_reset_date text,
  p_target_days int,
  p_current_streak int,
  p_bonus_exp int,
  p_bonus_coins int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text;
  v_today_date date;
  v_today_str text;
  v_new_streak int;
  v_is_target_reached boolean := false;
  v_awarded_exp int := 0;
  v_awarded_coins int := 0;
  v_updated public.profiles%ROWTYPE;
BEGIN
  -- 1. Xác thực người dùng
  v_user_id := auth.uid()::text;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Vui lòng đăng nhập để điểm danh.';
  END IF;

  -- 2. Ngày thực tế theo múi giờ Việt Nam (Asia/Ho_Chi_Minh - UTC+7)
  -- Đảm bảo ngay sau 00:00 đêm tại Việt Nam, máy chủ chuyển ngay sang ngày mới
  v_today_date := (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  v_today_str := TO_CHAR(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD');

  -- Chặn nếu hôm nay (theo giờ VN) đã điểm danh
  IF p_last_checkin_date = v_today_str THEN
    RAISE EXCEPTION 'AlreadyCheckedIn: Hôm nay bạn đã điểm danh rồi! Hãy quay lại vào ngày mai.';
  END IF;

  -- Chặn nếu hôm nay (theo giờ VN) đã reset bộ đếm
  IF p_last_reset_date = v_today_str THEN
    RAISE EXCEPTION 'ResetCooldown: Hôm nay bạn đã Reset bộ đếm này. Hãy quay lại điểm danh sau 00:00 đêm nay nhé!';
  END IF;

  -- 3. Tăng chuỗi Streak
  v_new_streak := GREATEST(0, COALESCE(p_current_streak, 0)) + 1;

  -- Kiểm tra mốc hoàn thành
  IF v_new_streak >= GREATEST(1, COALESCE(p_target_days, 1)) THEN
    v_is_target_reached := true;
    v_awarded_exp := GREATEST(0, COALESCE(p_bonus_exp, 0));
    v_awarded_coins := GREATEST(0, COALESCE(p_bonus_coins, 0));
  END IF;

  -- 4. Cập nhật hồ sơ trên máy chủ (lưu đúng ngày theo giờ Việt Nam)
  UPDATE public.profiles
  SET streak = GREATEST(COALESCE(streak, 0), v_new_streak),
      exp = exp + v_awarded_exp,
      coins = coins + v_awarded_coins,
      last_checkin_date = v_today_date,
      updated_at = NOW()
  WHERE id = v_user_id
  RETURNING * INTO v_updated;

  RETURN jsonb_build_object(
    'success', true,
    'new_streak', v_new_streak,
    'today_server', v_today_str,
    'target_reached', v_is_target_reached,
    'awarded_exp', v_awarded_exp,
    'awarded_coins', v_awarded_coins,
    'new_exp', v_updated.exp,
    'new_coins', v_updated.coins
  );
END;
$$;

-- 3. Cập nhật rpc_complete_task để giới hạn 15 nhiệm vụ/ngày cũng tự reset đúng 00:00 đêm Việt Nam
CREATE OR REPLACE FUNCTION public.rpc_complete_task(
  p_difficulty text,
  p_focus_minutes int,
  p_is_focus_completed boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text;
  v_profile public.profiles%ROWTYPE;
  v_today_date date;
  v_daily_tasks int;
  v_daily_boss int;
  v_base_exp int := 0;
  v_base_coins int := 0;
  v_focus_exp int := 0;
  v_focus_coins int := 0;
  v_streak_bonus_exp int := 0;
  v_awarded_exp int := 0;
  v_awarded_coins int := 0;
  v_rank_bonus_coins int := 0;
  v_new_exp int;
  v_new_rank text;
  v_final_coins int;
  v_clean_minutes int;
  v_updated public.profiles%ROWTYPE;
BEGIN
  -- 1. Xác thực người dùng
  v_user_id := auth.uid()::text;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Vui lòng đăng nhập để hoàn thành nhiệm vụ.';
  END IF;

  -- 2. Lấy hồ sơ người dùng kèm khóa hàng (Row Lock)
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ProfileNotFound: Không tìm thấy hồ sơ Thợ Săn trên máy chủ.';
  END IF;

  -- 3. Kiểm tra ngày máy chủ theo múi giờ Việt Nam
  v_today_date := (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  IF v_profile.last_task_date IS NULL OR v_profile.last_task_date < v_today_date THEN
    v_daily_tasks := 0;
    v_daily_boss := 0;
  ELSE
    v_daily_tasks := COALESCE(v_profile.daily_tasks_count, 0);
    v_daily_boss := COALESCE(v_profile.daily_boss_count, 0);
  END IF;

  -- Chặn giới hạn 15 nhiệm vụ/ngày
  IF v_daily_tasks >= 15 THEN
    RAISE EXCEPTION 'DailyTaskLimit: Đã đạt giới hạn 15 nhiệm vụ nhận thưởng hôm nay! Hãy nghỉ ngơi để bảo toàn thể lực.';
  END IF;

  -- Chặn giới hạn 2 nhiệm vụ Trùm Cuối (Boss)/ngày
  IF LOWER(p_difficulty) = 'boss' AND v_daily_boss >= 2 THEN
    RAISE EXCEPTION 'DailyBossLimit: Đã đạt giới hạn 2 nhiệm vụ Trùm Cuối hôm nay! Danh dự Thách Đấu không cho phép vắt kiệt sức.';
  END IF;

  -- 4. Máy chủ tự tính toán phần thưởng EXP & Xu
  CASE LOWER(COALESCE(p_difficulty, 'medium'))
    WHEN 'easy' THEN
      v_base_exp := 20;
      v_base_coins := 5;
    WHEN 'hard' THEN
      v_base_exp := 80;
      v_base_coins := 20;
    WHEN 'boss' THEN
      v_base_exp := 160;
      v_base_coins := 50;
    ELSE -- 'medium'
      v_base_exp := 40;
      v_base_coins := 10;
  END CASE;

  -- Phần thưởng tập trung Fae Focus (nếu có hoàn thành)
  IF p_is_focus_completed AND p_focus_minutes > 0 THEN
    v_clean_minutes := LEAST(180, GREATEST(5, p_focus_minutes));
    v_focus_exp := v_clean_minutes * 1;
    v_focus_coins := GREATEST(1, FLOOR(v_clean_minutes * 0.4)::int);
  END IF;

  -- Thưởng chuỗi kỷ luật (Streak >= 3 ngày tăng thêm +20% EXP)
  IF COALESCE(v_profile.streak, 0) >= 3 THEN
    v_streak_bonus_exp := FLOOR(v_base_exp * 0.2)::int;
  END IF;

  v_awarded_exp := v_base_exp + v_focus_exp + v_streak_bonus_exp;
  v_awarded_coins := v_base_coins + v_focus_coins;

  -- 5. Tính toán thăng hạng
  v_new_exp := COALESCE(v_profile.exp, 0) + v_awarded_exp;
  v_new_rank := public.fn_calc_rank_id(v_new_exp);

  IF v_new_rank <> COALESCE(v_profile.rank_id, 'rank_f') THEN
    v_rank_bonus_coins := 50;
  END IF;

  v_final_coins := COALESCE(v_profile.coins, 0) + v_awarded_coins + v_rank_bonus_coins;
  v_daily_tasks := v_daily_tasks + 1;
  IF LOWER(p_difficulty) = 'boss' THEN
    v_daily_boss := v_daily_boss + 1;
  END IF;

  -- 6. Ghi trực tiếp vào cơ sở dữ liệu trên máy chủ
  UPDATE public.profiles
  SET exp = v_new_exp,
      coins = v_final_coins,
      rank_id = v_new_rank,
      completed_tasks_count = COALESCE(completed_tasks_count, 0) + 1,
      daily_tasks_count = v_daily_tasks,
      daily_boss_count = v_daily_boss,
      last_task_date = v_today_date,
      updated_at = NOW()
  WHERE id = v_user_id
  RETURNING * INTO v_updated;

  -- 7. Trả về kết quả xác thực từ máy chủ
  RETURN jsonb_build_object(
    'success', true,
    'awarded_exp', v_awarded_exp,
    'awarded_coins', v_awarded_coins,
    'rank_bonus_coins', v_rank_bonus_coins,
    'new_exp', v_updated.exp,
    'new_coins', v_updated.coins,
    'new_rank_id', v_updated.rank_id,
    'completed_tasks_count', v_updated.completed_tasks_count,
    'daily_tasks_count', v_updated.daily_tasks_count,
    'daily_boss_count', v_updated.daily_boss_count,
    'is_rank_up', (v_rank_bonus_coins > 0)
  );
END;
$$;

-- 4. Cấp quyền thực thi cho người dùng
GRANT EXECUTE ON FUNCTION public.rpc_checkin_streak(text, text, int, int, int, int) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_complete_task(text, int, boolean) TO authenticated, anon;
