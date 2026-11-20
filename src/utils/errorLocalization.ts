/**
 * Chuyển đổi mã lỗi kỹ thuật hoặc thông báo hệ thống thô sang tiếng Việt thân thiện, dễ hiểu.
 * Giữ vững phong cách RPG FaeQuest và bảo mật thông tin hạ tầng nội bộ.
 */
export function localizeError(
  err: unknown,
  fallback = 'Đã có sự cố kết nối, vui lòng thử lại sau!'
): string {
  if (!err) return fallback;

  let raw = '';
  if (typeof err === 'string') {
    raw = err;
  } else if (typeof err === 'object' && err !== null) {
    raw = (err as any).message || (err as any).error_description || (err as any).details || String(err);
  } else {
    raw = String(err);
  }

  if (!raw || typeof raw !== 'string') return fallback;

  const lower = raw.toLowerCase();

  // 1. Xác thực tài khoản & Đăng nhập
  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
    return 'Email hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra lại!';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'Email này đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc dùng email khác!';
  }
  if (lower.includes('password should be at least') || lower.includes('password is too short')) {
    return 'Mật khẩu phải chứa ít nhất 6 ký tự để bảo vệ tài khoản!';
  }
  if (lower.includes('email not confirmed')) {
    return 'Tài khoản chưa được kích hoạt qua email. Vui lòng kiểm tra hộp thư của bạn!';
  }
  if (lower.includes('jwt expired') || lower.includes('token expired') || lower.includes('session expired')) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('over_email_send_rate_limit')) {
    return 'Bạn thao tác quá nhanh. Vui lòng đợi trong giây lát rồi thử lại nhé!';
  }

  // 1.5. Lỗi nghiệp vụ game / RPC
  if (lower.includes('insufficient') || lower.includes('not enough coins') || lower.includes('insufficientfunds')) {
    return 'Số dư Xu Vàng không đủ để thực hiện giao dịch này!';
  }
  if (lower.includes('already completed') || lower.includes('taskalreadycompleted')) {
    return 'Nhiệm vụ này đã được hoàn thành trước đó!';
  }
  if (lower.includes('already checked in') || lower.includes('resetcooldown') || lower.includes('cooldown')) {
    return 'Bạn đã thực hiện hành động này hôm nay. Vui lòng quay lại sau!';
  }

  // 2. Lỗi mạng & kết nối (Fetch / Network / DNS)
  if (
    lower.includes('failed to fetch') ||
    lower.includes('network error') ||
    lower.includes('networkerror') ||
    lower.includes('timeout') ||
    lower.includes('econnrefused') ||
    lower.includes('econnreset') ||
    lower.includes('getaddrinfo')
  ) {
    return 'Kết nối máy chủ bị gián đoạn. Vui lòng kiểm tra lại đường truyền mạng!';
  }

  // 3. Lỗi mã HTTP / Database / Supabase / Cloudinary
  if (
    lower.includes('pgrst') ||
    lower.includes('relation') ||
    lower.includes('schema') ||
    lower.includes('database error') ||
    lower.includes('violates foreign key')
  ) {
    return 'Hệ thống dữ liệu máy chủ đang đồng bộ, vui lòng thử lại sau ít phút!';
  }
  if (
    lower.includes('cloudinary') ||
    lower.includes('upload failed') ||
    lower.includes('upload_preset') ||
    lower.includes('image upload')
  ) {
    return 'Không thể tải ảnh lên kho lưu trữ. Vui lòng thử lại với ảnh khác!';
  }
  if (lower.includes('404') || lower.includes('not found')) {
    return 'Dữ liệu yêu cầu không tồn tại hoặc đã được dọn dẹp.';
  }
  if (lower.includes('500') || lower.includes('internal server error')) {
    return 'Máy chủ gặp sự cố xử lý tạm thời. Vui lòng thử lại sau ít phút!';
  }

  // Nếu chuỗi đã là tiếng Việt có dấu, thay thế các danh từ công nghệ còn sót
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(raw)) {
    return raw
      .replace(/supabase\s*sql\s*editor/gi, 'hệ thống máy chủ')
      .replace(/supabase/gi, 'máy chủ')
      .replace(/cloudinary/gi, 'kho lưu trữ')
      .replace(/database/gi, 'hệ thống')
      .replace(/server/gi, 'máy chủ')
      .replace(/api/gi, 'kết nối')
      .replace(/backend/gi, 'máy chủ');
  }

  return fallback;
}
