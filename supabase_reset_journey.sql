-- =========================================================================
-- FAEQUEST RPG TODO - RESET TOÀN BỘ HÀNH TRÌNH (DATABASE-FIRST)
-- Khởi tạo lại EXP = 0, Xu = 25, Rank Đồng, xóa Nhật ký & Tiến độ
-- =========================================================================

-- 1. Hàm RPC rpc_reset_user_journey (Bảo mật tuyệt đối qua SECURITY DEFINER)
-- Cho phép Thợ Săn đặt lại tài khoản của chính mình về mốc khởi điểm
CREATE OR REPLACE FUNCTION public.rpc_reset_user_journey()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id text;
BEGIN
  -- Xác thực người dùng hiện tại qua phiên Auth
  v_user_id := auth.uid()::text;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Vui lòng đăng nhập để thực hiện.';
  END IF;

  -- A. Đặt lại toàn bộ chỉ số trong bảng profiles về giá trị gốc của Tân Binh
  UPDATE public.profiles
  SET
    exp = 0,
    coins = 25,
    stars = 0,
    rank_id = 'dong',
    equipped_title = 'title_tan_binh_gai_do',
    streak = 0,
    completed_tasks_count = 0,
    updated_at = NOW()
  WHERE id = v_user_id;

  -- B. Dọn sạch toàn bộ bài viết Nhật Ký Thợ Săn của người dùng
  DELETE FROM public.journals WHERE user_id = v_user_id;

  -- C. Dọn sạch lịch sử hoạt động cũ nếu có
  DELETE FROM public.activity_logs WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Đã đặt lại toàn bộ hành trình trên máy chủ thành công!'
  );
END;
$$;

-- 2. Cấp quyền thực thi RPC cho người dùng đã đăng nhập (authenticated) và khách (anon)
GRANT EXECUTE ON FUNCTION public.rpc_reset_user_journey() TO authenticated, anon;

-- 3. Cấp thêm quyền UPDATE trực tiếp trên các cột chỉ số của profiles
-- Giúp mọi truy vấn UPDATE từ client (hoặc Admin/Service) luôn chạy mượt mà không gặp lỗi permission denied
GRANT UPDATE (exp, coins, stars, rank_id, streak, completed_tasks_count, has_seen_tutorial) ON public.profiles TO authenticated;

-- 4. Tự động làm mới Schema Cache của PostgREST ngay lập tức
NOTIFY pgrst, 'reload schema';
