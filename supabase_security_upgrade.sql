-- =========================================================================
-- FAEQUEST RPG TODO - SUPABASE SECURITY UPGRADE & SERVER-SIDE RPC ENGINE
-- =========================================================================
-- Ngăn chặn tuyệt đối hành vi gian lận thông qua DevTools/AI chỉnh sửa localStorage
-- Bật Row Level Security (RLS) & Server-Side Security Definer RPC Functions
-- =========================================================================

-- 1. Bổ sung các cột theo dõi giới hạn nhiệm vụ theo ngày máy chủ (Server Time)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_task_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_tasks_count INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_boss_count INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_checkin_date DATE DEFAULT NULL;

-- 2. Cấu hình Row Level Security (RLS) bảo vệ dữ liệu nhạy cảm
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_states ENABLE ROW LEVEL SECURITY;

-- Xóa các policy mở tự do cũ (nếu có)
DROP POLICY IF EXISTS "Allow public access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public access to user_states" ON public.user_states;
DROP POLICY IF EXISTS "Allow public read for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile display" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read own user_state" ON public.user_states;
DROP POLICY IF EXISTS "Allow users to upsert own user_state" ON public.user_states;

-- Policy 2.1: Cho phép tất cả mọi người đọc profiles để hiển thị BXH Đấu Trường (Leaderboard)
CREATE POLICY "Allow public read for profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy 2.2: Cho phép người dùng đã xác thực tạo hồ sơ ban đầu của chính mình
CREATE POLICY "Allow users to insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id);

-- Policy 2.3: Chỉ cho phép người dùng sửa hồ sơ của chính họ (kết hợp phân quyền cột bên dưới)
CREATE POLICY "Allow users to update own profile display"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- KHÓA QUYỀN UPDATE TRỰC TIẾP LÊN CÁC CỘT NHẠY CẢM:
-- Thu hồi quyền UPDATE chung trên bảng profiles từ anon và authenticated
REVOKE UPDATE ON public.profiles FROM anon, authenticated;

-- CHỈ cấp quyền UPDATE cho client trên 3 cột hiển thị: username, avatar_url, equipped_title, updated_at
-- Tuyệt đối KHÔNG cấp quyền UPDATE client trên: exp, coins, rank_id, streak, completed_tasks_count
GRANT UPDATE (username, avatar_url, equipped_title, updated_at) ON public.profiles TO authenticated;

-- Policy 2.4: Bảo vệ bảng user_states (chỉ chủ tài khoản mới được đọc và ghi snapshot)
CREATE POLICY "Allow users to read own user_state"
ON public.user_states
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Allow users to upsert own user_state"
ON public.user_states
FOR ALL
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- 3. Hàm nội bộ: Tính toán Rank ID từ tổng EXP trên Máy Chủ
CREATE OR REPLACE FUNCTION public.fn_calc_rank_id(p_exp int)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_exp >= 6000 THEN 'thach-dau'
    WHEN p_exp >= 3800 THEN 'dai-cao-thu'
    WHEN p_exp >= 2200 THEN 'cao-thu'
    WHEN p_exp >= 1200 THEN 'luc-bao'
    WHEN p_exp >= 600  THEN 'vang'
    WHEN p_exp >= 250  THEN 'bac'
    ELSE 'dong'
  END;
$$;

-- 4. RPC FUNCTION 1: Hoàn thành nhiệm vụ trên Server (Chống Hack EXP & Xu)
-- Máy chủ tự tính thưởng và kiểm tra giới hạn 15 nhiệm vụ/ngày, 2 boss/ngày theo CURRENT_DATE
CREATE OR REPLACE FUNCTION public.rpc_complete_task(
  p_difficulty text,
  p_focus_minutes int DEFAULT 0,
  p_is_focus_completed boolean DEFAULT false
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
BEGIN
  -- 1. Xác thực người dùng qua auth.uid()
  v_user_id := auth.uid()::text;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Vui lòng đăng nhập để nghiệm thu nhiệm vụ.';
  END IF;

  -- 2. Lấy hồ sơ người dùng kèm khóa hàng (Row Lock) để đảm bảo tính nguyên tử (Atomic)
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ProfileNotFound: Không tìm thấy hồ sơ Thợ Săn trên máy chủ.';
  END IF;

  -- 3. Kiểm tra nhật ký theo ngày thực tế của máy chủ (múi giờ Việt Nam Asia/Ho_Chi_Minh)
  IF v_profile.last_task_date IS NULL OR v_profile.last_task_date < (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date THEN
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

  -- 4. Máy chủ tự tính toán phần thưởng EXP & Xu (Tuyệt đối không nhận từ Client)
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
    v_streak_multiplier := 1.2;
  END IF;

  v_awarded_exp := ROUND((v_base_exp + v_focus_exp) * v_streak_multiplier)::int;
  v_awarded_coins := v_base_coins + v_focus_coins;

  -- 5. Cập nhật chỉ số mới
  v_new_exp := COALESCE(v_profile.exp, 0) + v_awarded_exp;
  v_new_coins := COALESCE(v_profile.coins, 0) + v_awarded_coins;
  v_new_rank := public.fn_calc_rank_id(v_new_exp);

  -- Thưởng Xu khi thăng hạng Rank mới
  IF v_new_rank != COALESCE(v_profile.rank_id, 'dong') THEN
    CASE v_new_rank
      WHEN 'bac' THEN v_rank_bonus_coins := 30;
      WHEN 'vang' THEN v_rank_bonus_coins := 60;
      WHEN 'luc-bao' THEN v_rank_bonus_coins := 100;
      WHEN 'cao-thu' THEN v_rank_bonus_coins := 160;
      WHEN 'dai-cao-thu' THEN v_rank_bonus_coins := 250;
      WHEN 'thach-dau' THEN v_rank_bonus_coins := 500;
      ELSE v_rank_bonus_coins := 0;
    END CASE;
  END IF;

  v_final_coins := v_new_coins + v_rank_bonus_coins;
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
      last_task_date = (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
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
    'rank_up_occurred', (v_new_rank != COALESCE(v_profile.rank_id, 'dong'))
  );
END;
$$;

-- 5. RPC FUNCTION 2: Mua vật phẩm tự thưởng trên Server (Chống Hack Xu & Túi Đồ)
CREATE OR REPLACE FUNCTION public.rpc_purchase_item(
  p_item_cost int,
  p_current_inventory_count int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text;
  v_current_coins int;
  v_new_coins int;
BEGIN
  -- 1. Xác thực người dùng
  v_user_id := auth.uid()::text;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Vui lòng đăng nhập để đổi quà.';
  END IF;

  -- 2. Kiểm tra giá hợp lệ
  IF p_item_cost IS NULL OR p_item_cost <= 0 THEN
    RAISE EXCEPTION 'InvalidCost: Giá vật phẩm phải lớn hơn 0 Xu.';
  END IF;

  -- 3. Kiểm tra giới hạn 50 ô chứa của Túi Đồ
  IF p_current_inventory_count >= 50 THEN
    RAISE EXCEPTION 'InventoryFull: Túi Đồ đã đầy (50/50)! Hãy sử dụng bớt vật phẩm trước khi đổi thêm.';
  END IF;

  -- 4. Kiểm tra số dư Xu hiện tại trên máy chủ (Row Lock)
  SELECT coins INTO v_current_coins FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ProfileNotFound: Không tìm thấy hồ sơ Thợ Săn.';
  END IF;

  IF COALESCE(v_current_coins, 0) < p_item_cost THEN
    RAISE EXCEPTION 'InsufficientCoins: Không đủ Xu Vàng (cần % Xu, hiện chỉ có % Xu).', p_item_cost, COALESCE(v_current_coins, 0);
  END IF;

  -- 5. Trừ Xu nguyên tử (Atomic Update)
  v_new_coins := v_current_coins - p_item_cost;

  UPDATE public.profiles
  SET coins = v_new_coins,
      updated_at = NOW()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'deducted_coins', p_item_cost,
    'new_coins', v_new_coins
  );
END;
$$;

-- 6. RPC FUNCTION 3: Điểm danh thử thách Streak (Chống Hack Đổi Giờ Thiết Bị)
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
  v_today_date := (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  v_today_str := TO_CHAR(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD');

  -- Chặn nếu hôm nay đã điểm danh
  IF p_last_checkin_date = v_today_str THEN
    RAISE EXCEPTION 'AlreadyCheckedIn: Hôm nay bạn đã điểm danh rồi! Hãy quay lại vào ngày mai.';
  END IF;

  -- Chặn nếu hôm nay đã reset bộ đếm
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

  -- 4. Cập nhật hồ sơ trên máy chủ
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

-- 7. Cấp quyền thực thi các RPC Functions cho người dùng đã đăng nhập (Authenticated)
GRANT EXECUTE ON FUNCTION public.fn_calc_rank_id(int) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_complete_task(text, int, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_purchase_item(int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_checkin_streak(text, text, int, int, int, int) TO authenticated;

-- Hoàn tất nâng cấp bảo mật FaeQuest Server
