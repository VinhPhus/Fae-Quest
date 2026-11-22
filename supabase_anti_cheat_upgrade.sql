-- ==============================================================================
-- NÂNG CẤP ANTI-CHEAT & NGƯỠNG THỂ LỰC NGÀY (DAILY REWARD CAP) CHO FAEQUEST
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.rpc_complete_task(
  p_difficulty text,
  p_focus_minutes int DEFAULT 0,
  p_is_focus_completed boolean DEFAULT false,
  p_category text DEFAULT 'Khác'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text;
  v_profile public.profiles%ROWTYPE;
  v_base_exp int := 40;
  v_base_coins int := 10;
  v_clean_minutes int := 0;
  v_focus_exp int := 0;
  v_focus_coins int := 0;
  v_streak_multiplier numeric := 1.0;
  v_awarded_exp int := 0;
  v_awarded_coins int := 0;
  v_daily_tasks int := 0;
  v_daily_boss int := 0;
  v_new_exp int := 0;
  v_new_coins int := 0;
  v_new_rank text;
  v_rank_bonus_coins int := 0;
  v_final_coins int := 0;
  v_updated public.profiles%ROWTYPE;
  v_action_type text;
  v_daily_cap_reached boolean := false;
BEGIN
  -- 1. Xác thực người dùng
  v_user_id := auth.uid()::text;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Vui lòng đăng nhập để nghiệm thu nhiệm vụ.';
  END IF;

  -- 2. Kiểm tra trạng thái Ban (Tự động tạo hồ sơ an toàn nếu chưa tồn tại)
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.profiles (
      id, username, avatar_url, exp, coins, rank_id, equipped_title, streak, completed_tasks_count, role, stars, updated_at
    ) VALUES (
      v_user_id, 'Thợ Săn Fae', NULL, 0, 25, 'dong', 'title_tan_binh_gai_do', 0, 0, 'user', 0, NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  END IF;

  IF v_profile.banned_until IS NOT NULL AND v_profile.banned_until > NOW() THEN
    RAISE EXCEPTION 'AccountBanned: Tài khoản đang bị tạm khóa cho đến %! Lý do: %', v_profile.banned_until, COALESCE(v_profile.ban_reason, 'Vi phạm quy tắc');
  END IF;

  -- 3. Kiểm tra nhật ký theo ngày máy chủ (múi giờ Việt Nam Asia/Ho_Chi_Minh)
  IF v_profile.last_task_date IS NULL OR v_profile.last_task_date < (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date THEN
    v_daily_tasks := 0;
    v_daily_boss := 0;
  ELSE
    v_daily_tasks := COALESCE(v_profile.daily_tasks_count, 0);
    v_daily_boss := COALESCE(v_profile.daily_boss_count, 0);
  END IF;

  -- 4. Ngưỡng Thể Lực Ngày (Daily Reward Cap: 20 nhiệm vụ nhận thưởng tối đa)
  IF v_daily_tasks >= 20 THEN
    v_daily_cap_reached := true;
  END IF;

  IF LOWER(p_difficulty) = 'boss' AND v_daily_boss >= 2 THEN
    RAISE EXCEPTION 'DailyBossLimit: Đã đạt giới hạn 2 nhiệm vụ Trùm Cuối hôm nay!';
  END IF;

  -- Nếu đã đạt ngưỡng 20 nhiệm vụ thì ghi nhận hoàn thành nhưng không cộng thêm EXP và Xu
  IF v_daily_cap_reached THEN
    v_awarded_exp := 0;
    v_awarded_coins := 0;
    v_new_exp := v_profile.exp;
    v_final_coins := v_profile.coins;
  ELSE
    -- 5. Tính toán thưởng EXP & Xu
    CASE LOWER(COALESCE(p_difficulty, 'medium'))
      WHEN 'easy' THEN
        v_base_exp := 20;
        v_base_coins := 5;
      WHEN 'hard' THEN
        v_base_exp := 80;
        v_base_coins := 20;
      WHEN 'boss' THEN
        v_base_exp := 150;
        v_base_coins := 40;
      ELSE
        v_base_exp := 40;
        v_base_coins := 10;
    END CASE;

    IF COALESCE(v_profile.streak, 0) >= 3 THEN
      v_streak_multiplier := 1.2;
    END IF;

    v_awarded_exp := ROUND(v_base_exp * v_streak_multiplier);
    v_awarded_coins := v_base_coins;

    -- Thưởng Focus
    IF p_is_focus_completed AND p_focus_minutes > 0 THEN
      v_clean_minutes := LEAST(180, GREATEST(5, p_focus_minutes));
      v_focus_exp := ROUND(v_clean_minutes * 1.0);
      v_focus_coins := GREATEST(1, FLOOR(v_clean_minutes * 0.4));
      v_awarded_exp := v_awarded_exp + v_focus_exp;
      v_awarded_coins := v_awarded_coins + v_focus_coins;
    END IF;

    v_new_exp := v_profile.exp + v_awarded_exp;
    v_new_coins := v_profile.coins + v_awarded_coins;

    -- Kiểm tra thăng cấp Rank
    SELECT new_rank_id, coin_bonus INTO v_new_rank, v_rank_bonus_coins
    FROM public.fn_calculate_rank_tier(v_new_exp, v_profile.exp);

    IF v_new_rank IS NULL THEN
      v_new_rank := v_profile.rank_id;
      v_rank_bonus_coins := 0;
    END IF;

    v_final_coins := v_new_coins + v_rank_bonus_coins;
  END IF;

  -- 6. Cập nhật Profiles
  UPDATE public.profiles
  SET
    exp = v_new_exp,
    coins = v_final_coins,
    rank_id = COALESCE(v_new_rank, rank_id),
    completed_tasks_count = COALESCE(completed_tasks_count, 0) + 1,
    daily_tasks_count = v_daily_tasks + 1,
    daily_boss_count = CASE WHEN LOWER(p_difficulty) = 'boss' THEN v_daily_boss + 1 ELSE v_daily_boss END,
    last_task_date = (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
    updated_at = NOW()
  WHERE id = v_user_id
  RETURNING * INTO v_updated;

  -- 7. Ghi Activity Log
  v_action_type := CASE WHEN p_is_focus_completed THEN 'focus_complete' ELSE 'task_complete' END;
  INSERT INTO public.activity_logs (
    user_id, action_type, description, exp_earned, coins_earned, metadata
  ) VALUES (
    v_user_id,
    v_action_type,
    CASE 
      WHEN v_daily_cap_reached THEN 'Nghiệm thu nhiệm vụ (Đã chạm ngưỡng thể lực ngày)'
      WHEN p_is_focus_completed THEN 'Hoàn thành nhiệm vụ cùng Focus Timer (' || p_focus_minutes || ' phút)'
      ELSE 'Hoàn thành nhiệm vụ độ khó ' || p_difficulty
    END,
    v_awarded_exp,
    v_awarded_coins,
    jsonb_build_object(
      'difficulty', p_difficulty,
      'category', p_category,
      'focus_minutes', p_focus_minutes,
      'streak_bonus', v_streak_multiplier > 1.0,
      'daily_tasks_count', v_daily_tasks + 1,
      'daily_cap_reached', v_daily_cap_reached
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'awarded_exp', v_awarded_exp,
    'awarded_coins', v_awarded_coins,
    'new_exp', v_new_exp,
    'new_coins', v_final_coins,
    'new_rank', v_updated.rank_id,
    'rank_up_occurred', (v_updated.rank_id IS DISTINCT FROM v_profile.rank_id),
    'rank_bonus_coins', v_rank_bonus_coins,
    'daily_tasks_count', v_daily_tasks + 1,
    'daily_cap_reached', v_daily_cap_reached
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_complete_task(text, int, boolean, text) TO authenticated, anon;
