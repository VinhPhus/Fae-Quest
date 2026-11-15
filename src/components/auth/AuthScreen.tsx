import React, { useState } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CoinIcon } from '../ui/CoinIcon';
import {
  Sword,
  Shield,
  Sparkles,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Scroll,
  ArrowRight,
  Flame,
  Award,
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
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 overflow-hidden thorn-pattern">
      {/* Background Ambience & Radial Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#6B0733]/40 via-[#D97352]/20 to-[#6850AD]/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#6850AD]/25 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-80 h-80 bg-[#6B0733]/30 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        <div className="rpg-card rounded-3xl p-6 sm:p-8 border-2 border-fae/40 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Top Brand & Realm Header */}
          <div className="text-center space-y-3 mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D97352] to-[#6B0733] border-2 border-[#D97352]/80 shadow-[0_0_24px_rgba(217,119,82,0.6)] rank-pulse-fx">
              <Sword className="w-8 h-8 text-parchment" />
            </div>

            <div>
              <h1 className="font-rpg font-extrabold text-2xl sm:text-3xl tracking-wider text-parchment drop-shadow-md">
                FAE<span className="text-fae">QUEST</span>
              </h1>
              <p className="text-[11px] uppercase tracking-widest text-parchment/60 font-semibold mt-0.5">
                Cổng Thợ Săn • RPG Todo v2.0
              </p>
            </div>

            <p className="text-xs text-parchment/75 leading-relaxed max-w-xs mx-auto">
              Đấu trường biến thói quen & mục tiêu hằng ngày thành hành trình thăng hạng Thách Đấu.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-thorn-dark/90 border border-opal/30 mb-6 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-bargain to-thorn-light text-parchment border border-fae/60 shadow-md ring-1 ring-fae/40'
                  : 'text-parchment/60 hover:text-parchment'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-fae" />
              <span>Đăng Nhập</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-bargain to-thorn-light text-parchment border border-fae/60 shadow-md ring-1 ring-fae/40'
                  : 'text-parchment/60 hover:text-parchment'
              }`}
            >
              <Scroll className="w-3.5 h-3.5 text-fae" />
              <span>Đăng Ký Tân Binh</span>
            </button>
          </div>

          {/* Newbie Gift Badge (Always visible on Register mode) */}
          {mode === 'register' && (
            <div className="mb-5 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-thorn-dark to-fae/20 border border-amber-400/50 shadow-md animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/30 border border-amber-400/60 flex items-center justify-center text-amber-300 shrink-0">
                  <Award className="w-4 h-4 text-amber-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-xs font-extrabold text-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Quà Tân Binh Khởi Nghiệp</span>
                  </div>
                  <div className="text-[11px] text-parchment/90 font-medium flex items-center gap-1 mt-0.5">
                    <span>Khởi đầu bậc <strong>ĐỒNG</strong> • Tặng ngay</span>
                    <strong className="text-amber-300 font-extrabold">25 Xu Vàng</strong>
                    <CoinIcon size="xs" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alerts / Error Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-950/70 border border-rose-500/60 text-xs text-rose-200 leading-relaxed animate-in fade-in">
              ⚠️ {errorMessage}
            </div>
          )}
          {infoMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-950/70 border border-emerald-400/60 text-xs text-emerald-200 leading-relaxed animate-in fade-in">
              ✨ {infoMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Register: Hunter Display Name */}
            {mode === 'register' && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-parchment/80">
                  Tên Thợ Săn (Hiển thị trên BXH) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-parchment/40">
                    <User className="w-4 h-4 text-fae" />
                  </div>
                  <input
                    type="text"
                    required
                    value={hunterName}
                    onChange={(e) => setHunterName(e.target.value)}
                    placeholder="VD: ShadowBlade, Hiệp Sĩ Fae, Linh..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-thorn-dark/90 border border-opal/40 text-xs sm:text-sm text-parchment placeholder-parchment/35 focus:outline-none focus:border-fae focus:ring-1 focus:ring-fae transition shadow-inner"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-parchment/80">
                Địa Chỉ Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-parchment/40">
                  <Mail className="w-4 h-4 text-fae" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="thosan@faequest.realm"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-thorn-dark/90 border border-opal/40 text-xs sm:text-sm text-parchment placeholder-parchment/35 focus:outline-none focus:border-fae focus:ring-1 focus:ring-fae transition shadow-inner"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-parchment/80">
                  Mật Khẩu Bí Mật *
                </label>
                {mode === 'register' && (
                  <span className="text-[10px] text-parchment/50">Tối thiểu 6 ký tự</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-parchment/40">
                  <Lock className="w-4 h-4 text-fae" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-thorn-dark/90 border border-opal/40 text-xs sm:text-sm text-parchment placeholder-parchment/35 focus:outline-none focus:border-fae focus:ring-1 focus:ring-fae transition shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-parchment/40 hover:text-parchment transition"
                  tabIndex={-1}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || authLoading}
                className="w-full py-3.5 rounded-2xl rpg-btn-primary font-bold text-sm text-parchment flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 hover:scale-[1.02] active:scale-[0.99] transition duration-200"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-parchment border-t-transparent rounded-full animate-spin" />
                    <span>Đang kết nối Cổng Thợ Săn...</span>
                  </div>
                ) : mode === 'login' ? (
                  <>
                    <Flame className="w-4 h-4 text-parchment" />
                    <span>⚔️ Bước Vào Đấu Trường</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <Scroll className="w-4 h-4 text-parchment" />
                    <span>📜 Khắc Tên & Khởi Tạo Hồ Sơ</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer toggle prompt */}
          <div className="mt-6 pt-4 border-t border-parchment/10 text-center text-xs text-parchment/60">
            {mode === 'login' ? (
              <p>
                Chưa từng bước vào cõi Fae?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                    setInfoMessage(null);
                  }}
                  className="font-bold text-fae hover:underline ml-1"
                >
                  Đăng ký nhận quà Tân Binh
                </button>
              </p>
            ) : (
              <p>
                Đã có dấu ấn Thợ Săn?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setInfoMessage(null);
                  }}
                  className="font-bold text-fae hover:underline ml-1"
                >
                  Đăng nhập vào Đấu Trường
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Small Realm Tagline */}
        <p className="text-center text-[11px] text-parchment/40 mt-4 tracking-wider">
          FaeQuest RPG Realm • Rèn luyện mỗi ngày • Không lùi bước
        </p>
      </div>
    </div>
  );
};
