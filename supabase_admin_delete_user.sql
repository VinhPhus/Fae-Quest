-- =========================================================================
-- FAEQUEST RPG TODO - ADMIN XÓA VĨNH VIỄN TÀI KHOẢN (REALTIME & AUTH REVOKE)
-- =========================================================================

-- 1. Hàm RPC admin_delete_user với tham số target_user_id (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Kiểm tra quyền Quản Trị Viên
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Chỉ Quản Trị Viên (Admin) mới có quyền xóa tài khoản.';
  END IF;

  IF target_user_id IS NULL OR TRIM(target_user_id) = '' THEN
    RAISE EXCEPTION 'InvalidUser: ID Thợ Săn không hợp lệ.';
  END IF;

  -- 1. Xóa dữ liệu các bảng nghiệp vụ trong public schema
  DELETE FROM public.activity_logs WHERE user_id = target_user_id;
  DELETE FROM public.user_messages WHERE receiver_id = target_user_id;
  DELETE FROM public.journals WHERE user_id = target_user_id;
  DELETE FROM public.user_states WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- 2. Xóa tài khoản khỏi auth.users để vô hiệu hóa hoàn toàn session và mật khẩu
  BEGIN
    DELETE FROM auth.users WHERE id = target_user_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_user_id', target_user_id
  );
END;
$$;

-- 2. Alias rpc_admin_delete_user để tương thích hoàn toàn cả 2 quy chuẩn đặt tên
CREATE OR REPLACE FUNCTION public.rpc_admin_delete_user(p_target_user_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN public.admin_delete_user(p_target_user_id);
END;
$$;

-- Cấp quyền gọi RPC cho Quản Trị Viên
GRANT EXECUTE ON FUNCTION public.admin_delete_user(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_delete_user(text) TO authenticated;

-- Làm mới schema cache
NOTIFY pgrst, 'reload schema';
