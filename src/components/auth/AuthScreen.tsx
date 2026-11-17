import React, { useState } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CoinIcon } from '../ui/CoinIcon';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, authLoading } = useFaeQuestStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form states
  const [hunterName, setHunterName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu.');
        return;
      }
      setIsSubmitting(true);
      const res = await signIn(email, password);
      setIsSubmitting(false);

      if (!res.success) {
        setErrorMessage(res.error || 'Đăng nhập không thành công');
      }
    } else {
      // Register
      if (!hunterName.trim()) {
        setErrorMessage('Vui lòng nhập Tên Thợ Săn của bạn.');
        return;
      }
      if (!email.trim()) {
        setErrorMessage('Vui lòng nhập địa chỉ Email hợp lệ.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Mật khẩu bí mật phải chứa tối thiểu 6 ký tự.');
        return;
      }

      setIsSubmitting(true);
      const res = await signUp(hunterName, email, password);
      setIsSubmitting(false);

      if (!res.success) {
        setErrorMessage(res.error || 'Đăng ký không thành công');
      } else if (res.error) {
        // Successful registration but confirmation needed
        setInfoMessage(res.error);
        setMode('login');
      }
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-3 sm:p-6 overflow-hidden bg-[#06141B] thorn-pattern">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#253745]/30 via-[#4A5C6A]/20 to-transparent rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-gradient-to-bl from-[#11212D]/60 via-[#253745]/30 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-1/3 w-80 h-80 bg-[#253745]/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container Card - Obsidian & Steel */}
      <div className="relative z-10 w-full max-w-[980px] min-h-[560px] md:min-h-[600px] rounded-[28px] sm:rounded-[32px] bg-[#11212D] border border-[#253745] shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-12 p-3 sm:p-5 gap-4 sm:gap-6 items-center">
          
          {/* Cột Trái — Khung Artwork Hiệp Sĩ & Branding (6/12 cols) */}
          <div className="md:col-span-6 w-full">
            <div className="relative h-44 sm:h-56 md:h-[540px] w-full rounded-[20px] sm:rounded-[24px] overflow-hidden shadow-inner group border border-[#253745]">
              <img
                src="/assets/auth-knight-bg.jpg"
                alt="Hiệp sĩ FaeQuest trên cánh đồng hoa hoàng hôn"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              
              {/* Dark steel gradient overlay towards bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#11212D] via-[#11212D]/40 to-transparent pointer-events-none" />

              {/* Bottom Branding & Slogan Overlay */}
              <div className="absolute bottom-3 sm:bottom-6 left-3.5 sm:left-6 right-3.5 sm:right-6 z-10">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#06141B] overflow-hidden border border-[#4A5C6A] flex items-center justify-center shadow-lg shrink-0">
                    <img
                      src="/assets/logo.png"
                      alt="FaeQuest Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-rpg font-extrabold text-xl sm:text-2xl text-[#CCD0CF] tracking-wider drop-shadow-md">
                    Fae<span className="text-white">Quest</span>
                  </span>
                  <span className="border border-[#4A5C6A] bg-[#06141B]/70 backdrop-blur-md text-[10px] sm:text-[11px] font-semibold text-[#CCD0CF] px-1.5 sm:px-2 py-0.5 rounded-md">
                    RPG V2.0
                  </span>
                </div>
                <p className="text-[#9BA8AB] text-[11px] sm:text-xs md:text-sm mt-1 sm:mt-1.5 leading-relaxed drop-shadow line-clamp-2 sm:line-clamp-none">
                  Biến mục tiêu mỗi ngày thành hành trình chinh phục đỉnh Thách Đấu.
                </p>
              </div>
            </div>
          </div>

          {/* Cột Phải — Khu vực Form Đăng Nhập / Đăng Ký Tối Giản (6/12 cols) */}
          <div className="md:col-span-6 w-full flex flex-col justify-center items-center py-2 sm:py-4">
            <div className="w-full max-w-[360px] mx-auto px-1 sm:px-2 flex flex-col justify-center">
              
              {/* Tiêu đề chính */}
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight mb-1.5 sm:mb-2 text-center text-[#CCD0CF]">
                {mode === 'login' ? 'Chào mừng trở lại' : 'Khởi tạo Hồ sơ Thợ Săn'}
              </h2>

              {/* Phụ đề / Quà tân thủ */}
              <div className="text-center mb-4 sm:mb-6 min-h-[24px] flex items-center justify-center">
                {mode === 'register' ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#253745] border border-[#4A5C6A] text-amber-300 text-[11px] sm:text-xs font-medium shadow-sm animate-in fade-in duration-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>🎁 Khởi đầu bậc ĐỒNG • Tặng 25 Xu Vàng</span>
                    <CoinIcon size="xs" />
                  </div>
                ) : (
                  <p className="text-xs text-[#9BA8AB]">
                    Nhập thông tin tài khoản của bạn để tiếp tục
                  </p>
                )}
              </div>

              {/* Thông báo lỗi / trạng thái */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-xs text-rose-200 leading-relaxed text-center animate-in fade-in">
                  ⚠️ {errorMessage}
                </div>
              )}
              {infoMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-400/50 text-xs text-emerald-200 leading-relaxed text-center animate-in fade-in">
                  ✨ {infoMessage}
                </div>
              )}

              {/* Form nhập liệu */}
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
                {/* Tên Thợ Săn (chỉ khi Register) */}
                {mode === 'register' && (
                  <div className="relative animate-in fade-in duration-200">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9BA8AB]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={hunterName}
                      onChange={(e) => setHunterName(e.target.value)}
                      placeholder="Tên Thợ Săn (hiển thị trên BXH)"
                      className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl bg-[#06141B] border border-[#253745] text-[#CCD0CF] placeholder-[#9BA8AB]/50 text-sm focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] outline-none transition"
                    />
                  </div>
                )}

                {/* Email */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9BA8AB]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email của bạn"
                    className="w-full h-11 sm:h-12 pl-10 pr-4 rounded-xl bg-[#06141B] border border-[#253745] text-[#CCD0CF] placeholder-[#9BA8AB]/50 text-sm focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] outline-none transition"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9BA8AB]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu bí mật (tối thiểu 6 ký tự)"
                    className="w-full h-11 sm:h-12 pl-10 pr-11 rounded-xl bg-[#06141B] border border-[#253745] text-[#CCD0CF] placeholder-[#9BA8AB]/50 text-sm focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9BA8AB] hover:text-[#CCD0CF] transition cursor-pointer"
                    tabIndex={-1}
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Primary CTA Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || authLoading}
                  className="w-full h-11 sm:h-12 rounded-full font-bold text-[#06141B] bg-[#CCD0CF] hover:bg-white shadow-[0_8px_25px_rgba(204,208,207,0.25)] active:scale-[0.99] transition-all mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#06141B] border-t-transparent rounded-full animate-spin" />
                      <span>Đang kết nối Cổng Thợ Săn...</span>
                    </div>
                  ) : mode === 'login' ? (
                    'Tiếp tục vào Đấu Trường'
                  ) : (
                    'Khắc Tên & Bắt Đầu'
                  )}
                </button>
              </form>

              {/* Dòng chuyển đổi Đăng Nhập <-> Đăng Ký */}
              <div className="mt-6 sm:mt-8 text-xs text-[#9BA8AB] text-center">
                {mode === 'login' ? (
                  <p>
                    Chưa có hồ sơ Thợ Săn?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMessage(null);
                        setInfoMessage(null);
                      }}
                      className="text-[#CCD0CF] font-semibold hover:underline ml-1 cursor-pointer"
                    >
                      Đăng ký ngay
                    </button>
                  </p>
                ) : (
                  <p>
                    Đã có hồ sơ Thợ Săn?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage(null);
                        setInfoMessage(null);
                      }}
                      className="text-[#CCD0CF] font-semibold hover:underline ml-1 cursor-pointer"
                    >
                      Đăng nhập
                    </button>
                  </p>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
