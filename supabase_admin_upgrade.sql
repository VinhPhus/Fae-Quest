-- =========================================================================
-- FAEQUEST RPG TODO - SUPABASE ADMIN UPGRADE & LIVE-OPS PORTAL ENGINE
-- =========================================================================
-- Bổ sung phân quyền Admin, Radar phát hiện bất thường, Hộp thư Thợ Săn,
-- Quản lý Cửa Hàng Hệ Thống & Thành Tựu Động trên Supabase
-- Bảng màu & Phong cách: Obsidian & Steel (#06141B, #11212D, #253745, #4A5C6A, #9BA8AB, #CCD0CF)
-- =========================================================================

-- 1. Bổ sung các cột phân quyền & khóa tài khoản vào public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stars INT DEFAULT 0;

-- Index hỗ trợ tìm kiếm nhanh theo role và trạng thái ban
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_banned_until ON public.profiles(banned_until);

-- 2. Tạo bảng public.activity_logs (Bảo vệ quyền riêng tư tuyệt đối)
-- TUYỆT ĐỐI KHÔNG LƯU task.title, chỉ lưu category và difficulty
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  username TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('TASK_COMPLETE', 'FOCUS_COMPLETE', 'SHOP_PURCHASE', 'STREAK_CHECKIN')),
  category TEXT,
  difficulty TEXT,
  exp_delta INT DEFAULT 0,
  coins_delta INT DEFAULT 0,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_is_flagged ON public.activity_logs(is_flagged);

-- 3. Tạo bảng public.user_messages (Hộp thư Admin -> Thợ Săn kèm Thưởng)
CREATE TABLE IF NOT EXISTS public.user_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receiver_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'notice' CHECK (message_type IN ('warning', 'notice', 'gift')),
  is_read BOOLEAN DEFAULT FALSE,
  reward_exp INT DEFAULT 0,
  reward_coins INT DEFAULT 0,
  reward_stars INT DEFAULT 0,
  reward_items JSONB DEFAULT '[]'::jsonb,
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cập nhật cột nếu bảng đã tồn tại từ trước
ALTER TABLE public.user_messages ADD COLUMN IF NOT EXISTS reward_exp INT DEFAULT 0;
ALTER TABLE public.user_messages ADD COLUMN IF NOT EXISTS reward_coins INT DEFAULT 0;
ALTER TABLE public.user_messages ADD COLUMN IF NOT EXISTS reward_stars INT DEFAULT 0;
ALTER TABLE public.user_messages ADD COLUMN IF NOT EXISTS reward_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.user_messages ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.user_messages ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_user_messages_receiver ON public.user_messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_messages_created ON public.user_messages(created_at DESC);

-- 4. Tạo bảng public.system_shop_items (Vật phẩm hệ thống do Admin quản lý)
CREATE TABLE IF NOT EXISTS public.system_shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cost INT NOT NULL CHECK (cost > 0),
  icon TEXT NOT NULL,
  is_system BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_shop_items_created ON public.system_shop_items(created_at ASC);

-- 5. Tạo bảng public.system_achievements (Thành tựu động do Admin thêm)
CREATE TABLE IF NOT EXISTS public.system_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon_url TEXT NOT NULL,
  category TEXT DEFAULT 'Chung',
  rarity TEXT NOT NULL DEFAULT 'COMMON' CHECK (rarity IN ('COMMON', 'RARE', 'EPIC', 'LEGENDARY')),
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('streak_counter', 'milestone_tasks', 'milestone_exp', 'milestone_focus')),
  target_value INT NOT NULL CHECK (target_value > 0),
  reward_exp INT DEFAULT 0,
  reward_coins INT DEFAULT 0,
  granted_title_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_achievements_created ON public.system_achievements(created_at ASC);

-- 6. Helper Function: Kiểm tra người dùng hiện tại có quyền Admin hay không
CREATE OR REPLACE FUNCTION public.fn_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text AND role = 'admin'
  );
$$;

-- 7. Logic Tự động Gắn Cờ Bất Thường (Auto-Anomaly Flagging Engine)
CREATE OR REPLACE FUNCTION public.fn_record_activity_log(
  p_user_id TEXT,
  p_username TEXT,
  p_action_type TEXT,
  p_category TEXT,
  p_difficulty TEXT,
  p_exp_delta INT,
  p_coins_delta INT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID := gen_random_uuid();
  v_is_flagged BOOLEAN := FALSE;
  v_flag_reason TEXT := NULL;
  v_recent_tasks_count INT := 0;
  v_recent_exp_sum INT := 0;
BEGIN
  -- Logic 1: Hoàn thành >= 3 nhiệm vụ trong vòng 3 phút
  IF p_action_type IN ('TASK_COMPLETE', 'FOCUS_COMPLETE') THEN
    SELECT COUNT(*)
    INTO v_recent_tasks_count
    FROM public.activity_logs
    WHERE user_id = p_user_id
      AND action_type IN ('TASK_COMPLETE', 'FOCUS_COMPLETE')
      AND created_at >= (NOW() - INTERVAL '3 minutes');

    IF v_recent_tasks_count >= 2 THEN
      v_is_flagged := TRUE;
      v_flag_reason := 'Tốc độ hoàn thành nhiệm vụ nhanh bất thường (Nghi vấn spam: >= 3 nhiệm vụ trong 3 phút)';
    END IF;
  END IF;

  -- Logic 2: Kiếm > 600 EXP trong 30 phút
  SELECT COALESCE(SUM(exp_delta), 0)
  INTO v_recent_exp_sum
  FROM public.activity_logs
  WHERE user_id = p_user_id
    AND created_at >= (NOW() - INTERVAL '30 minutes');

  IF (v_recent_exp_sum + COALESCE(p_exp_delta, 0)) > 600 THEN
    v_is_flagged := TRUE;
    IF v_flag_reason IS NOT NULL THEN
      v_flag_reason := v_flag_reason || ' & Kiếm > 600 EXP trong 30 phút';
    ELSE
      v_flag_reason := 'Tốc độ hoàn thành nhiệm vụ nhanh bất thường (Nghi vấn spam: Kiếm > 600 EXP trong 30 phút)';
    END IF;
  END IF;

  -- Ghi log đảm bảo quy tắc riêng tư: KHÔNG LƯU task.title
  INSERT INTO public.activity_logs (
    id, user_id, username, action_type, category, difficulty, exp_delta, coins_delta, is_flagged, flag_reason, created_at
  ) VALUES (
    v_log_id, p_user_id, p_username, p_action_type, p_category, p_difficulty, p_exp_delta, p_coins_delta, v_is_flagged, v_flag_reason, NOW()
  );

  RETURN v_log_id;
END;
$$;

-- 8. Cấu hình Row Level Security (RLS) cho các bảng mới

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_achievements ENABLE ROW LEVEL SECURITY;

-- 8.1. RLS cho activity_logs
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can view own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can insert own activity log" ON public.activity_logs;

CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (public.fn_is_admin());

CREATE POLICY "Users can view own activity logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own activity log"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- 8.2. RLS cho user_messages
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.user_messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.user_messages;
DROP POLICY IF EXISTS "Users can update own message read status" ON public.user_messages;

CREATE POLICY "Admins can manage all messages"
ON public.user_messages
FOR ALL
TO authenticated
USING (public.fn_is_admin())
WITH CHECK (public.fn_is_admin());

CREATE POLICY "Users can view own messages"
ON public.user_messages
FOR SELECT
TO authenticated
USING (auth.uid()::text = receiver_id);

CREATE POLICY "Users can update own message read status"
ON public.user_messages
FOR UPDATE
TO authenticated
USING (auth.uid()::text = receiver_id)
WITH CHECK (auth.uid()::text = receiver_id);

DROP POLICY IF EXISTS "Users can delete own messages" ON public.user_messages;
CREATE POLICY "Users can delete own messages"
ON public.user_messages
FOR DELETE
TO authenticated
USING (
  auth.uid()::text = receiver_id
  AND (
    is_claimed = TRUE
    OR (
      COALESCE(reward_exp, 0) = 0
      AND COALESCE(reward_coins, 0) = 0
      AND COALESCE(reward_stars, 0) = 0
      AND (reward_items IS NULL OR jsonb_array_length(reward_items) = 0)
    )
  )
);

-- 8.3. RLS cho system_shop_items
DROP POLICY IF EXISTS "Public can view system shop items" ON public.system_shop_items;
DROP POLICY IF EXISTS "Admins can manage system shop items" ON public.system_shop_items;

CREATE POLICY "Public can view system shop items"
ON public.system_shop_items
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage system shop items"
ON public.system_shop_items
FOR ALL
TO authenticated
USING (public.fn_is_admin())
WITH CHECK (public.fn_is_admin());

-- 8.4. RLS cho system_achievements
DROP POLICY IF EXISTS "Public can view system achievements" ON public.system_achievements;
DROP POLICY IF EXISTS "Admins can manage system achievements" ON public.system_achievements;

CREATE POLICY "Public can view system achievements"
ON public.system_achievements
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage system achievements"
ON public.system_achievements
FOR ALL
TO authenticated
USING (public.fn_is_admin())
WITH CHECK (public.fn_is_admin());

-- 9. RPC FUNCTION CHO CLIENT GHI NHẬT KÝ HOẠT ĐỘNG
CREATE OR REPLACE FUNCTION public.rpc_log_activity(
  p_action_type TEXT,
  p_category TEXT,
  p_difficulty TEXT,
  p_exp_delta INT,
  p_coins_delta INT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT;
  v_username TEXT;
  v_log_id UUID;
BEGIN
  v_user_id := auth.uid()::text;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Vui lòng đăng nhập để ghi log hoạt động.';
  END IF;

  SELECT username INTO v_username FROM public.profiles WHERE id = v_user_id;

  v_log_id := public.fn_record_activity_log(
    v_user_id,
    COALESCE(v_username, 'Thợ Săn Fae'),
    p_action_type,
    p_category,
    p_difficulty,
    COALESCE(p_exp_delta, 0),
    COALESCE(p_coins_delta, 0)
  );

  RETURN jsonb_build_object(
    'success', true,
    'log_id', v_log_id
  );
END;
$$;

-- 10. RPC FUNCTIONS DÀNH RIÊNG CHO QUẢN TRỊ VIÊN (ADMIN)

-- 10.1. Gửi thư / cảnh báo / quà tặng từ Admin tới Thợ Săn
CREATE OR REPLACE FUNCTION public.rpc_admin_send_mail(
  p_receiver_id TEXT,
  p_subject TEXT,
  p_content TEXT,
  p_type TEXT DEFAULT 'notice',
  p_reward_exp INT DEFAULT 0,
  p_reward_coins INT DEFAULT 0,
  p_reward_stars INT DEFAULT 0,
  p_reward_items JSONB DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msg_id UUID;
BEGIN
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Chỉ Quản Trị Viên (Admin) mới có quyền gửi thư hệ thống.';
  END IF;

  IF p_receiver_id IS NULL OR TRIM(p_receiver_id) = '' THEN
    RAISE EXCEPTION 'InvalidReceiver: ID người nhận không được để trống.';
  END IF;

  IF p_subject IS NULL OR TRIM(p_subject) = '' THEN
    RAISE EXCEPTION 'InvalidSubject: Tiêu đề thư không được để trống.';
  END IF;

  IF p_type NOT IN ('warning', 'notice', 'gift') THEN
    p_type := 'notice';
  END IF;

  INSERT INTO public.user_messages (
    receiver_id, subject, content, message_type, is_read,
    reward_exp, reward_coins, reward_stars, reward_items, is_claimed, created_at
  ) VALUES (
    p_receiver_id, p_subject, p_content, p_type, false,
    GREATEST(0, COALESCE(p_reward_exp, 0)),
    GREATEST(0, COALESCE(p_reward_coins, 0)),
    GREATEST(0, COALESCE(p_reward_stars, 0)),
    COALESCE(p_reward_items, '[]'::jsonb),
    false,
    NOW()
  )
  RETURNING id INTO v_msg_id;

  RETURN jsonb_build_object(
    'success', true,
    'message_id', v_msg_id
  );
END;
$$;

-- 10.1b. Nhận phần thưởng đính kèm trong thư của Thợ Săn
CREATE OR REPLACE FUNCTION public.rpc_claim_mail_reward(
  p_message_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT;
  v_msg RECORD;
  v_profile RECORD;
  v_new_exp INT;
  v_new_coins INT;
  v_new_stars INT;
  v_new_rank TEXT;
BEGIN
  v_user_id := auth.uid()::text;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Vui lòng đăng nhập để nhận thưởng.';
  END IF;

  -- 1. Tìm thư và khóa dòng
  SELECT * INTO v_msg
  FROM public.user_messages
  WHERE id = p_message_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NotFound: Không tìm thấy thư này.';
  END IF;

  IF v_msg.receiver_id != v_user_id THEN
    RAISE EXCEPTION 'Forbidden: Bạn không có quyền nhận phần thưởng của thư này.';
  END IF;

  IF v_msg.is_claimed THEN
    RAISE EXCEPTION 'AlreadyClaimed: Bạn đã nhận phần thưởng của thư này rồi.';
  END IF;

  -- 2. Đánh dấu đã nhận
  UPDATE public.user_messages
  SET is_claimed = TRUE,
      claimed_at = NOW(),
      is_read = TRUE
  WHERE id = p_message_id;

  -- 3. Cập nhật hồ sơ profiles (Tự động tạo hồ sơ an toàn nếu chưa tồn tại)
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

  v_new_exp := COALESCE(v_profile.exp, 0) + COALESCE(v_msg.reward_exp, 0);
  v_new_coins := COALESCE(v_profile.coins, 0) + COALESCE(v_msg.reward_coins, 0);
  v_new_stars := COALESCE(v_profile.stars, 0) + COALESCE(v_msg.reward_stars, 0);
  v_new_rank := public.fn_calc_rank_id(v_new_exp);

  UPDATE public.profiles
  SET exp = v_new_exp,
      coins = v_new_coins,
      stars = v_new_stars,
      rank_id = v_new_rank,
      updated_at = NOW()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message_id', p_message_id,
    'new_exp', v_new_exp,
    'new_coins', v_new_coins,
    'new_stars', v_new_stars,
    'new_rank_id', v_new_rank,
    'reward_exp', COALESCE(v_msg.reward_exp, 0),
    'reward_coins', COALESCE(v_msg.reward_coins, 0),
    'reward_stars', COALESCE(v_msg.reward_stars, 0),
    'reward_items', COALESCE(v_msg.reward_items, '[]'::jsonb)
  );
END;
$$;

-- 10.1c. Xóa thư của người dùng (Bảo vệ: không xóa thư có quà chưa nhận)
CREATE OR REPLACE FUNCTION public.rpc_delete_user_message(
  p_message_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT;
  v_msg RECORD;
BEGIN
  v_user_id := auth.uid()::text;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Vui lòng đăng nhập để xóa thư.';
  END IF;

  SELECT * INTO v_msg
  FROM public.user_messages
  WHERE id = p_message_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NotFound');
  END IF;

  IF v_msg.receiver_id != v_user_id AND NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Bạn không có quyền xóa thư này.';
  END IF;

  IF NOT v_msg.is_claimed AND (
    COALESCE(v_msg.reward_exp, 0) > 0 OR
    COALESCE(v_msg.reward_coins, 0) > 0 OR
    COALESCE(v_msg.reward_stars, 0) > 0 OR
    (v_msg.reward_items IS NOT NULL AND jsonb_array_length(v_msg.reward_items) > 0)
  ) THEN
    RAISE EXCEPTION 'UnclaimedReward: Thư có phần thưởng chưa nhận, không thể xóa!';
  END IF;

  DELETE FROM public.user_messages WHERE id = p_message_id;

  RETURN jsonb_build_object('success', true, 'deleted_id', p_message_id);
END;
$$;

-- 10.1d. Dọn dẹp nhanh các thư đã nhận quà hoặc đã đọc không có quà
CREATE OR REPLACE FUNCTION public.rpc_clear_claimed_user_messages()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT;
  v_deleted_count INT;
BEGIN
  v_user_id := auth.uid()::text;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Vui lòng đăng nhập.';
  END IF;

  WITH deleted AS (
    DELETE FROM public.user_messages
    WHERE receiver_id = v_user_id
    AND (
      is_claimed = TRUE
      OR (
        is_read = TRUE
        AND COALESCE(reward_exp, 0) = 0
        AND COALESCE(reward_coins, 0) = 0
        AND COALESCE(reward_stars, 0) = 0
        AND (reward_items IS NULL OR jsonb_array_length(reward_items) = 0)
      )
    )
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_count FROM deleted;

  RETURN jsonb_build_object('success', true, 'deleted_count', v_deleted_count);
END;
$$;

-- 10.2. Khóa tài khoản có thời hạn / Mở khóa tài khoản
CREATE OR REPLACE FUNCTION public.rpc_admin_ban_user(
  p_target_user_id TEXT,
  p_hours INT,
  p_reason TEXT DEFAULT 'Vi phạm quy tắc Đấu Trường FaeQuest'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_banned_until TIMESTAMPTZ := NULL;
BEGIN
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Chỉ Quản Trị Viên (Admin) mới có quyền khóa tài khoản.';
  END IF;

  IF p_target_user_id IS NULL OR TRIM(p_target_user_id) = '' THEN
    RAISE EXCEPTION 'InvalidUser: ID Thợ Săn cần xử lý không được để trống.';
  END IF;

  IF p_hours <= 0 THEN
    -- Mở khóa tài khoản
    UPDATE public.profiles
    SET banned_until = NULL,
        ban_reason = NULL,
        updated_at = NOW()
    WHERE id = p_target_user_id;

    -- Tự động gửi thư thông báo mở khóa
    INSERT INTO public.user_messages (receiver_id, subject, content, message_type, is_read, created_at)
    VALUES (
      p_target_user_id,
      '🛡️ Tài khoản Thợ Săn của bạn đã được MỞ KHÓA',
      'Lệnh hạn chế tài khoản đã được Quản Trị Viên gỡ bỏ. Chúc bạn tiếp tục hành trình kỷ luật rạng rỡ tại FaeQuest!',
      'notice',
      false,
      NOW()
    );

    RETURN jsonb_build_object(
      'success', true,
      'status', 'UNBANNED'
    );
  ELSE
    -- Khóa có thời hạn
    v_banned_until := NOW() + (p_hours || ' hours')::interval;

    UPDATE public.profiles
    SET banned_until = v_banned_until,
        ban_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_target_user_id;

    -- Tự động gửi thư cảnh báo ghi nhận trong hộp thư
    INSERT INTO public.user_messages (receiver_id, subject, content, message_type, is_read, created_at)
    VALUES (
      p_target_user_id,
      '⛔ CẢNH BÁO: Tài khoản của bạn đã bị TẠM KHÓA',
      'Tài khoản bị tạm khóa ' || p_hours || ' giờ. Lý do: ' || COALESCE(p_reason, 'Vi phạm quy tắc Đấu Trường FaeQuest') || '. Hạn chế sẽ tự động kết thúc lúc: ' || TO_CHAR(v_banned_until, 'HH24:MI:SS DD/MM/YYYY'),
      'warning',
      false,
      NOW()
    );

    RETURN jsonb_build_object(
      'success', true,
      'status', 'BANNED',
      'banned_until', v_banned_until,
      'hours', p_hours,
      'reason', p_reason
    );
  END IF;
END;
$$;

-- 10.3. Xóa vĩnh viễn tài khoản Thợ Săn vi phạm
CREATE OR REPLACE FUNCTION public.rpc_admin_delete_user(
  p_target_user_id TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Chỉ Quản Trị Viên (Admin) mới có quyền xóa tài khoản.';
  END IF;

  IF p_target_user_id IS NULL OR TRIM(p_target_user_id) = '' THEN
    RAISE EXCEPTION 'InvalidUser: ID Thợ Săn không hợp lệ.';
  END IF;

  -- Xóa sạch dữ liệu trong các bảng liên kết
  DELETE FROM public.activity_logs WHERE user_id = p_target_user_id;
  DELETE FROM public.user_messages WHERE receiver_id = p_target_user_id;
  DELETE FROM public.user_states WHERE user_id = p_target_user_id;
  DELETE FROM public.profiles WHERE id = p_target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_user_id', p_target_user_id
  );
END;
$$;

-- 10.4. Tối ưu Radar Bất Thường: Lấy danh sách tổng quan người dùng cho Admin Portal
CREATE OR REPLACE FUNCTION public.rpc_admin_get_users_overview()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Chỉ Quản Trị Viên mới có quyền truy cập dữ liệu Radar.';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'username', p.username,
      'avatar_url', p.avatar_url,
      'exp', p.exp,
      'coins', p.coins,
      'rank_id', p.rank_id,
      'equipped_title', p.equipped_title,
      'role', p.role,
      'banned_until', p.banned_until,
      'ban_reason', p.ban_reason,
      'updated_at', p.updated_at,
      'flagged_count_24h', (
        SELECT COUNT(*)
        FROM public.activity_logs l
        WHERE l.user_id = p.id
          AND l.is_flagged = true
          AND l.created_at >= (NOW() - INTERVAL '24 hours')
      ),
      'exp_gained_24h', (
        SELECT COALESCE(SUM(exp_delta), 0)
        FROM public.activity_logs l
        WHERE l.user_id = p.id
          AND l.created_at >= (NOW() - INTERVAL '24 hours')
      ),
      'latest_flag_reason', (
        SELECT flag_reason
        FROM public.activity_logs l
        WHERE l.user_id = p.id
          AND l.is_flagged = true
        ORDER BY created_at DESC
        LIMIT 1
      )
    )
  )
  INTO v_result
  FROM public.profiles p
  ORDER BY p.exp DESC;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 11. CẬP NHẬT CÁC HÀM HOÀN THÀNH NHIỆM VỤ ĐỂ TỰ ĐỘNG GHI VÀO ACTIVITY_LOGS
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

  IF v_daily_tasks >= 15 THEN
    RAISE EXCEPTION 'DailyTaskLimit: Đã đạt giới hạn 15 nhiệm vụ nhận thưởng hôm nay! Hãy nghỉ ngơi để bảo toàn thể lực.';
  END IF;

  IF LOWER(p_difficulty) = 'boss' AND v_daily_boss >= 2 THEN
    RAISE EXCEPTION 'DailyBossLimit: Đã đạt giới hạn 2 nhiệm vụ Trùm Cuối hôm nay!';
  END IF;

  -- 4. Tính toán thưởng EXP & Xu
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
    ELSE
      v_base_exp := 40;
      v_base_coins := 10;
  END CASE;

  IF p_is_focus_completed AND p_focus_minutes > 0 THEN
    v_clean_minutes := LEAST(180, GREATEST(5, p_focus_minutes));
    v_focus_exp := v_clean_minutes * 1;
    v_focus_coins := GREATEST(1, FLOOR(v_clean_minutes * 0.4)::int);
    v_action_type := 'FOCUS_COMPLETE';
  ELSE
    v_action_type := 'TASK_COMPLETE';
  END IF;

  IF COALESCE(v_profile.streak, 0) >= 3 THEN
    v_streak_multiplier := 1.2;
  END IF;

  v_awarded_exp := ROUND((v_base_exp + v_focus_exp) * v_streak_multiplier)::int;
  v_awarded_coins := v_base_coins + v_focus_coins;

  v_new_exp := COALESCE(v_profile.exp, 0) + v_awarded_exp;
  v_new_coins := COALESCE(v_profile.coins, 0) + v_awarded_coins;
  v_new_rank := public.fn_calc_rank_id(v_new_exp);

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

  -- 5. Cập nhật profiles
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

  -- 6. Tự động ghi activity_log (Bảo vệ quyền riêng tư: Tuyệt đối KHÔNG LƯU task.title)
  PERFORM public.fn_record_activity_log(
    v_user_id,
    v_profile.username,
    v_action_type,
    p_category,
    p_difficulty,
    v_awarded_exp,
    v_awarded_coins
  );

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

-- 10.5. Bổ nhiệm / Hạ quyền Quản Trị Viên (Admin / User Role Switcher)
CREATE OR REPLACE FUNCTION public.rpc_admin_set_user_role(
  p_target_user_id TEXT,
  p_new_role TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Chỉ Quản Trị Viên mới có quyền thay đổi role.';
  END IF;

  IF p_new_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'InvalidRole: Role chỉ có thể là user hoặc admin.';
  END IF;

  UPDATE public.profiles
  SET role = p_new_role,
      updated_at = NOW()
  WHERE id = p_target_user_id;

  INSERT INTO public.user_messages (
    receiver_id, subject, content, message_type, is_read, created_at
  ) VALUES (
    p_target_user_id,
    CASE WHEN p_new_role = 'admin' THEN '👑 ĐẶC QUYỀN: Bạn đã được cấp quyền QUẢN TRỊ VIÊN' ELSE '🛡️ THÔNG BÁO: Cập nhật quyền hạn tài khoản' END,
    CASE WHEN p_new_role = 'admin' 
      THEN 'Chúc mừng bạn đã được bổ nhiệm quyền Quản Trị Viên (Admin Portal) của FaeQuest. Hãy sử dụng đặc quyền có trách nhiệm!' 
      ELSE 'Quyền hạn Quản Trị Viên của bạn đã được chuyển về cấp bậc Thợ Săn thông thường.' 
    END,
    'notice',
    false,
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'target_user_id', p_target_user_id,
    'new_role', p_new_role
  );
END;
$$;

-- 12. Cấp quyền thực thi RPC Functions
GRANT EXECUTE ON FUNCTION public.fn_is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.fn_record_activity_log(TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_log_activity(TEXT, TEXT, TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_send_mail(TEXT, TEXT, TEXT, TEXT, INT, INT, INT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_claim_mail_reward(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_delete_user_message(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_clear_claimed_user_messages() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_ban_user(TEXT, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_delete_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_get_users_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_set_user_role(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_complete_task(TEXT, INT, BOOLEAN, TEXT) TO authenticated;

-- 13. Khởi tạo một số vật phẩm mẫu cho Cửa Hàng Hệ Thống (Nếu chưa có)
INSERT INTO public.system_shop_items (name, description, cost, icon, is_system)
SELECT 'Vé Nghỉ Ngơi Hoàng Gia', 'Một buổi tối thảnh thơi trọn vẹn, không bận tâm công việc hay deadline.', 150, '👑', true
WHERE NOT EXISTS (SELECT 1 FROM public.system_shop_items WHERE name = 'Vé Nghỉ Ngơi Hoàng Gia');

INSERT INTO public.system_shop_items (name, description, cost, icon, is_system)
SELECT 'Ly Trà Sữa Thần Tốc', 'Thưởng thức hương vị ngọt ngào nạp lại 100% năng lượng chiến đấu.', 80, '🧋', true
WHERE NOT EXISTS (SELECT 1 FROM public.system_shop_items WHERE name = 'Ly Trà Sữa Thần Tốc');

INSERT INTO public.system_shop_items (name, description, cost, icon, is_system)
SELECT 'Vé Xem Phim Rạp Chiếu Fae', 'Tự thưởng một suất chiếu bom tấn cuối tuần cùng người thương.', 200, '🎬', true
WHERE NOT EXISTS (SELECT 1 FROM public.system_shop_items WHERE name = 'Vé Xem Phim Rạp Chiếu Fae');

-- 14. Khởi tạo một số Thành Tựu Mẫu Hệ Thống (Nếu chưa có)
INSERT INTO public.system_achievements (title, description, icon_url, category, rarity, achievement_type, target_value, reward_exp, reward_coins, granted_title_name)
SELECT 'Thần Kỷ Luật 30 Ngày', 'Điểm danh chuỗi liên tục 30 ngày để minh chứng ý chí thép không thể lay chuyển.', '/assets/titles/title-chien-binh.png', 'Kỷ Luật', 'LEGENDARY', 'streak_counter', 30, 500, 200, 'Kỷ Luật Chi Thần'
WHERE NOT EXISTS (SELECT 1 FROM public.system_achievements WHERE title = 'Thần Kỷ Luật 30 Ngày');

INSERT INTO public.system_achievements (title, description, icon_url, category, rarity, achievement_type, target_value, reward_exp, reward_coins, granted_title_name)
SELECT 'Đại Kiện Tướng Thực Thi', 'Hoàn thành tổng cộng 100 nhiệm vụ lớn nhỏ trong hành trình.', '/assets/titles/title-tho-san.png', 'Thực Thi', 'EPIC', 'milestone_tasks', 100, 350, 150, 'Đại Kiện Tướng'
WHERE NOT EXISTS (SELECT 1 FROM public.system_achievements WHERE title = 'Đại Kiện Tướng Thực Thi');

INSERT INTO public.system_achievements (title, description, icon_url, category, rarity, achievement_type, target_value, reward_exp, reward_coins, granted_title_name)
SELECT 'Bậc Thầy Tĩnh Lặng 50 Phiên', 'Hoàn thành 50 phiên tập trung Fae Focus không xao nhãng.', '/assets/titles/title-hien-nhan.png', 'Tập Trung', 'EPIC', 'milestone_focus', 50, 300, 120, 'Hiền Nhân Tĩnh Lặng'
WHERE NOT EXISTS (SELECT 1 FROM public.system_achievements WHERE title = 'Bậc Thầy Tĩnh Lặng 50 Phiên');

-- 15. TỰ ĐỘNG KHỞI TẠO HỒ SƠ THỢ SĂN & CẬP NHẬT ROLE ADMIN CHUẨN XÁC
-- 15.1. Trigger tự động tạo hồ sơ trong public.profiles ngay khi tài khoản đăng ký trên Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, username, avatar_url, exp, coins, rank_id, equipped_title, streak, completed_tasks_count, role, stars, updated_at
  ) VALUES (
    new.id::text,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Thợ Săn Fae'),
    new.raw_user_meta_data->>'avatar_url',
    0,
    25,
    'dong',
    'title_tan_binh_gai_do',
    0,
    0,
    CASE WHEN new.email = 'admin@faequest.com' THEN 'admin' ELSE 'user' END,
    0,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE WHEN new.email = 'admin@faequest.com' THEN 'admin' ELSE public.profiles.role END;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 15.2. Đồng bộ ngược toàn bộ tài khoản hiện có trong auth.users vào public.profiles (tránh lỗi ProfileNotFound)
INSERT INTO public.profiles (
  id, username, avatar_url, exp, coins, rank_id, equipped_title, streak, completed_tasks_count, role, stars, updated_at
)
SELECT 
  u.id::text,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1), 'Thợ Săn Fae'),
  u.raw_user_meta_data->>'avatar_url',
  0,
  25,
  'dong',
  'title_tan_binh_gai_do',
  0,
  0,
  CASE WHEN u.email = 'admin@faequest.com' THEN 'admin' ELSE 'user' END,
  0,
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id::text
);

-- 15.3. Chỉ định tài khoản admin@faequest.com làm Quản Trị Viên (Admin Portal) duy nhất
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id::text FROM auth.users WHERE email = 'admin@faequest.com'
)
OR username ILIKE '%quản trị%';

-- Hạ quyền các tài khoản khác về user thông thường
UPDATE public.profiles
SET role = 'user'
WHERE id NOT IN (
  SELECT id::text FROM auth.users WHERE email = 'admin@faequest.com'
)
AND username NOT ILIKE '%quản trị%';

-- 15.4. Helper RPC: Đảm bảo hồ sơ người dùng hiện tại luôn tồn tại khi mở ứng dụng
CREATE OR REPLACE FUNCTION public.rpc_ensure_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid TEXT;
  v_email TEXT;
  v_name TEXT;
  v_role TEXT;
BEGIN
  v_uid := auth.uid()::text;
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chưa đăng nhập');
  END IF;

  SELECT email, COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1), 'Thợ Săn Fae')
  INTO v_email, v_name
  FROM auth.users
  WHERE id = auth.uid();

  v_role := CASE WHEN v_email = 'admin@faequest.com' THEN 'admin' ELSE 'user' END;

  INSERT INTO public.profiles (
    id, username, avatar_url, exp, coins, rank_id, equipped_title, streak, completed_tasks_count, role, stars, updated_at
  ) VALUES (
    v_uid, v_name, NULL, 0, 25, 'dong', 'title_tan_binh_gai_do', 0, 0, v_role, 0, NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE WHEN v_email = 'admin@faequest.com' THEN 'admin' ELSE public.profiles.role END;

  RETURN jsonb_build_object('success', true, 'user_id', v_uid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_ensure_profile() TO authenticated;

-- Hoàn tất nâng cấp FaeQuest Admin Portal & Live-Ops Database
