import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CoinIcon } from '../ui/CoinIcon';
import { InstallAppButton } from '../ui/InstallAppButton';
import { EASING_SPRING } from '../../constants/motion';
import { Lock, Mail, User, Sparkles, ArrowRight } from 'lucide-react';
import {
  MAX_HUNTER_NAME_LENGTH,
  MIN_HUNTER_NAME_LENGTH,
  validateHunterName,
} from '../../utils/hunterName';
import './AuthForm403.css';

type FieldKey = 'name' | 'email' | 'password';
type BtnState = 'idle' | 'busy' | 'ok';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STRENGTH_LABELS: Record<number, string> = {
  0: 'Chưa nhập mật khẩu',
  1: 'Yếu',
  2: 'Trung bình',
  3: 'Mạnh',
  4: 'Rất mạnh',
};

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, authLoading } = useFaeQuestStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form values
  const [hunterName, setHunterName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Focus, error & button states (#403 & #404)
  const [focusedField, setFocusedField] = useState<FieldKey | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [shakeField, setShakeField] = useState<FieldKey | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);
  const [btnState, setBtnState] = useState<BtnState>('idle');
  const [srStatus, setSrStatus] = useState<string>('');

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const shakeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) {
        window.clearTimeout(shakeTimerRef.current);
      }
    };
  }, []);

  // Đánh giá 3 tiêu chí & thang đo độ mạnh 0..4 (#404)
  const passwordChecks = useMemo(() => {
    const hasMinLen = password.length >= 8;
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9\s]/.test(password);
    const hasBonus =
      password.length >= 12 || (/[a-z]/.test(password) && /[A-Z]/.test(password));
    const level =
      password.length === 0
        ? 0
        : Math.max(
            1,
            (hasMinLen ? 1 : 0) +
              (hasDigit ? 1 : 0) +
              (hasSpecial ? 1 : 0) +
              (hasBonus ? 1 : 0)
          );

    return {
      hasMinLen,
      hasDigit,
      hasSpecial,
      allMet: hasMinLen && hasDigit && hasSpecial,
      level,
      label: STRENGTH_LABELS[level],
    };
  }, [password]);

  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const nameValidation = validateHunterName(hunterName);
  const isNameValid = nameValidation.valid;
  const isRegisterReady =
    mode === 'register' && isNameValid && isEmailValid && passwordChecks.allMet;

  const triggerFieldError = (field: FieldKey, message: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
    setShakeField(null);
    requestAnimationFrame(() => {
      setShakeField(field);
    });
    setSrStatus(message);

    if (shakeTimerRef.current) {
      window.clearTimeout(shakeTimerRef.current);
    }
    shakeTimerRef.current = window.setTimeout(() => {
      setShakeField(null);
    }, 480);

    const targetInput =
      field === 'name'
        ? nameInputRef.current
        : field === 'email'
        ? emailInputRef.current
        : passwordInputRef.current;
    targetInput?.focus();
  };

  const clearFieldError = (field: FieldKey) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (formError) setFormError(null);
  };

  // Chuyển qua lại Đăng nhập <-> Đăng ký: reset sạch lỗi và mật khẩu cũ
  const switchMode = (nextMode: 'login' | 'register') => {
    if (btnState !== 'idle') return;
    setMode(nextMode);
    setPassword('');
    setFieldErrors({});
    setShakeField(null);
    setFormError(null);
    setConfirmationNotice(null);
    setShowPassword(false);
    setSrStatus(
      nextMode === 'register'
        ? 'Đã chuyển sang biểu mẫu Khởi tạo hồ sơ Thợ Săn'
        : 'Đã chuyển sang biểu mẫu Đăng nhập'
    );
  };

  const mapServerErrorToField = (rawMsg: string) => {
    const lower = rawMsg.toLowerCase();

    if (
      lower.includes('invalid login credentials') ||
      lower.includes('không chính xác') ||
      lower.includes('sai mật khẩu')
    ) {
      triggerFieldError('password', 'Email hoặc mật khẩu chưa chính xác');
      return;
    }

    if (
      lower.includes('already registered') ||
      lower.includes('already exists') ||
      lower.includes('tồn tại') ||
      lower.includes('đã thuộc về') ||
      lower.includes('đã được đăng ký')
    ) {
      triggerFieldError('email', 'Email này đã thuộc về một Thợ Săn khác');
      return;
    }

    if (
      lower.includes('valid email') ||
      lower.includes('định dạng email') ||
      lower.includes('invalid email')
    ) {
      triggerFieldError('email', 'Vui lòng nhập đúng địa chỉ Email');
      return;
    }

    if (lower.includes('tên thợ săn')) {
      triggerFieldError('name', rawMsg);
      return;
    }

    if (lower.includes('password') || lower.includes('mật khẩu')) {
      triggerFieldError('password', rawMsg);
      return;
    }

    setFormError(rawMsg);
    setSrStatus(rawMsg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (btnState !== 'idle' || authLoading) return;

    setFieldErrors({});
    setFormError(null);
    setConfirmationNotice(null);

    const cleanEmail = email.trim();
    const cleanName = nameValidation.cleanName;

    if (mode === 'login') {
      // Tab Đăng Nhập (#403): giữ tương thích tài khoản cũ >= 6 ký tự
      if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
        triggerFieldError('email', 'Vui lòng nhập đúng địa chỉ Email');
        return;
      }
      if (password.length < 6) {
        triggerFieldError('password', 'Mật khẩu bí mật cần tối thiểu 6 ký tự');
        return;
      }

      setBtnState('busy');
      const holdOnSuccess = () =>
        new Promise<void>((resolve) => {
          setBtnState('ok');
          setSrStatus('Đăng nhập thành công, đang mở Đấu Trường');
          window.setTimeout(resolve, 650);
        });

      const res = await signIn(cleanEmail, password, holdOnSuccess);
      if (!res.success) {
        setBtnState('idle');
        mapServerErrorToField(res.error || 'Email hoặc mật khẩu chưa chính xác');
      }
      return;
    }

    // Tab Đăng Ký (#404): kiểm tra Tên 2-20 ký tự, Email chuẩn & đủ 3 tiêu chí mật khẩu
    if (!nameValidation.valid) {
      triggerFieldError(
        'name',
        nameValidation.error || `Tên Thợ Săn cần từ ${MIN_HUNTER_NAME_LENGTH} đến ${MAX_HUNTER_NAME_LENGTH} ký tự`
      );
      return;
    }
    if (!isEmailValid) {
      triggerFieldError('email', 'Vui lòng nhập đúng địa chỉ Email');
      return;
    }
    if (!passwordChecks.allMet) {
      triggerFieldError('password', 'Hãy hoàn thành đủ 3 tiêu chí mật khẩu bên dưới');
      return;
    }

    setBtnState('busy');
    const holdOnSuccess = () =>
      new Promise<void>((resolve) => {
        setBtnState('ok');
        window.setTimeout(resolve, 650);
      });

    const res = await signUp(cleanName, cleanEmail, password, holdOnSuccess);
    if (!res.success) {
      setBtnState('idle');
      mapServerErrorToField(res.error || 'Đăng ký không thành công, vui lòng thử lại');
    } else if (res.needsEmailConfirmation) {
      // Kịch bản 2: Cần xác nhận Email -> giữ dấu tích xong, hiện thông báo trong form & nút quay về Đăng Nhập
      const msg =
        res.error ||
        `Đã gửi thư kích hoạt tới ${cleanEmail}. Hãy kiểm tra hộp thư để xác nhận tài khoản!`;
      setConfirmationNotice(msg);
      setSrStatus(msg);
      setBtnState('idle');
    }
  };

  const isBusyOrOk = btnState !== 'idle' || authLoading;
  const isSubmitDisabled = isBusyOrOk;
  const isRegisterSleeping = mode === 'register' && !isRegisterReady && btnState === 'idle';

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-3 sm:p-6 overflow-x-hidden overflow-y-auto bg-[#06141B] thorn-pattern">
      {/* Nút Cài Đặt PWA Nhanh Ở Góc Màn Hình (Desktop) */}
      <div className="hidden sm:block fixed top-5 right-6 z-30">
        <InstallAppButton variant="auth" />
      </div>

      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#253745]/30 via-[#4A5C6A]/20 to-transparent rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-gradient-to-bl from-[#11212D]/60 via-[#253745]/30 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-1/3 w-80 h-80 bg-[#253745]/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container Card — Split Screen Dark Fantasy */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASING_SPRING }}
        className="relative z-10 w-full max-w-[980px] md:min-h-[600px] rounded-[24px] sm:rounded-[32px] bg-[#11212D] border border-[#253745] shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-xl overflow-hidden my-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 p-3 sm:p-5 gap-3 sm:gap-6 items-center">
          {/* Cột Trái — Khung Artwork Hiệp Sĩ & Branding */}
          <div className="md:col-span-6 w-full">
            <div className="relative h-28 sm:h-44 md:h-[540px] w-full rounded-[18px] sm:rounded-[24px] overflow-hidden shadow-inner group border border-[#253745]">
              <motion.img
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.2, ease: EASING_SPRING }}
                src="/assets/auth-knight-bg.jpg"
                alt="Hiệp sĩ FaeQuest trên cánh đồng hoa hoàng hôn"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#11212D] via-[#11212D]/45 to-transparent pointer-events-none" />

              <div className="absolute bottom-2.5 sm:bottom-5 left-3 sm:left-6 right-3 sm:right-6 z-10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-[#06141B] overflow-hidden border border-[#4A5C6A] flex items-center justify-center shadow-lg shrink-0 p-0.5">
                    <img
                      src="/assets/logo.png"
                      alt="FaeQuest Logo"
                      className="w-full h-full object-contain [image-rendering:pixelated]"
                    />
                  </div>
                  <span className="font-rpg font-extrabold text-lg sm:text-2xl text-[#CCD0CF] tracking-wider drop-shadow-md">
                    Fae<span className="text-white">Quest</span>
                  </span>
                  <span className="border border-[#4A5C6A] bg-[#06141B]/70 backdrop-blur-md text-[9.5px] sm:text-[11px] font-semibold text-[#CCD0CF] px-1.5 sm:px-2 py-0.5 rounded-md">
                    RPG V2.0
                  </span>
                </div>
                <p className="text-[#9BA8AB] text-[10.5px] sm:text-xs md:text-sm mt-1 leading-relaxed drop-shadow line-clamp-1 sm:line-clamp-none">
                  Biến mục tiêu mỗi ngày thành hành trình chinh phục đỉnh Thách Đấu.
                </p>
              </div>
            </div>
          </div>

          {/* Cột Phải — Form Đăng Nhập (#403) / Đăng Ký (#404) */}
          <div className="md:col-span-6 w-full flex flex-col justify-center items-center py-1.5 sm:py-4">
            <div className="w-full max-w-[380px] mx-auto px-1 sm:px-2 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: mode === 'login' ? -14 : 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === 'login' ? 14 : -14 }}
                  transition={{ duration: 0.22, ease: EASING_SPRING }}
                  className="w-full"
                >
                  {/* Tiêu đề & phụ đề */}
                  <h2 className="text-xl sm:text-3xl font-bold tracking-tight mb-1 sm:mb-2 text-center text-[#CCD0CF]">
                    {mode === 'login' ? 'Chào mừng trở lại' : 'Khởi tạo hồ sơ Thợ Săn'}
                  </h2>

                  <div className="text-center mb-4 sm:mb-5 min-h-[24px] flex items-center justify-center">
                    {mode === 'register' ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#253745] border border-[#4A5C6A] text-amber-300 text-[11px] sm:text-xs font-medium shadow-sm">
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

                  {/* Thông báo chung */}
                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3.5 p-2.5 rounded-xl bg-rose-950/70 border border-[#FB7185]/45 text-xs text-rose-200 leading-relaxed text-center"
                    >
                      ⚠️ {formError}
                    </motion.div>
                  )}

                  {confirmationNotice && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3.5 p-3 rounded-2xl bg-emerald-950/70 border border-[#34D399]/50 text-xs text-emerald-100 leading-relaxed space-y-2.5 text-center"
                    >
                      <p>✨ {confirmationNotice}</p>
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#34D399] hover:bg-[#6EE7B7] text-[#06141B] font-extrabold text-[11px] transition cursor-pointer"
                      >
                        <span>Quay về Đăng Nhập</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}

                  {/* Form Floating Label */}
                  <form noValidate onSubmit={handleSubmit} className="space-y-3">
                    {/* Tên Thợ Săn (chỉ khi Đăng Ký) */}
                    {mode === 'register' && (
                      <div className="u403-fw">
                        <div
                          className={[
                            'u403-f',
                            focusedField === 'name' ? 'is-f' : '',
                            focusedField === 'name' || hunterName.length > 0 ? 'is-up' : '',
                            fieldErrors.name ? 'is-err' : '',
                            shakeField === 'name' ? 'is-shake' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <span className="u403-ic" aria-hidden="true">
                            <User className="w-4 h-4" />
                          </span>
                          <input
                            ref={nameInputRef}
                            id="auth-hunter-name"
                            type="text"
                            autoComplete="nickname"
                            minLength={MIN_HUNTER_NAME_LENGTH}
                            maxLength={MAX_HUNTER_NAME_LENGTH}
                            value={hunterName}
                            onFocus={() => setFocusedField('name')}
                            onBlur={() => setFocusedField((prev) => (prev === 'name' ? null : prev))}
                            onChange={(e) => {
                              setHunterName(e.target.value);
                              clearFieldError('name');
                            }}
                            disabled={isBusyOrOk}
                            className="u403-in"
                          />
                          <label htmlFor="auth-hunter-name" className="u403-lbl">
                            Tên Thợ Săn ({MIN_HUNTER_NAME_LENGTH}–{MAX_HUNTER_NAME_LENGTH} ký tự)
                          </label>
                        </div>
                        <p className={`u403-msg ${fieldErrors.name ? 'is-on' : ''}`} role="alert">
                          {fieldErrors.name || ''}
                        </p>
                      </div>
                    )}

                    {/* Email */}
                    <div className="u403-fw">
                      <div
                        className={[
                          'u403-f',
                          focusedField === 'email' ? 'is-f' : '',
                          focusedField === 'email' || email.length > 0 ? 'is-up' : '',
                          fieldErrors.email ? 'is-err' : '',
                          shakeField === 'email' ? 'is-shake' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <span className="u403-ic" aria-hidden="true">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          ref={emailInputRef}
                          id="auth-email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          value={email}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField((prev) => (prev === 'email' ? null : prev))}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            clearFieldError('email');
                          }}
                          disabled={isBusyOrOk}
                          className="u403-in"
                        />
                        <label htmlFor="auth-email" className="u403-lbl">
                          Email của bạn
                        </label>
                      </div>
                      <p className={`u403-msg ${fieldErrors.email ? 'is-on' : ''}`} role="alert">
                        {fieldErrors.email || ''}
                      </p>
                    </div>

                    {/* Mật khẩu + SVG chớp mí 2 lớp */}
                    <div className="u403-fw">
                      <div
                        className={[
                          'u403-f',
                          focusedField === 'password' ? 'is-f' : '',
                          focusedField === 'password' || password.length > 0 ? 'is-up' : '',
                          fieldErrors.password ? 'is-err' : '',
                          shakeField === 'password' ? 'is-shake' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <span className="u403-ic" aria-hidden="true">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input
                          ref={passwordInputRef}
                          id="auth-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                          value={password}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() =>
                            setFocusedField((prev) => (prev === 'password' ? null : prev))
                          }
                          onChange={(e) => {
                            setPassword(e.target.value);
                            clearFieldError('password');
                          }}
                          disabled={isBusyOrOk}
                          className="u403-in has-eye"
                        />
                        <label htmlFor="auth-password" className="u403-lbl">
                          {mode === 'login'
                            ? 'Mật khẩu bí mật (tối thiểu 6 ký tự)'
                            : 'Mật khẩu bí mật'}
                        </label>

                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-pressed={showPassword}
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          className="u403-eye"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <g className="lid">
                              <path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z" />
                              <circle cx="12" cy="12" r="2.8" fill="currentColor" stroke="none" />
                            </g>
                            <g className="lash">
                              <path d="M3 10.5c2.4 3 5.5 4.5 9 4.5s6.6-1.5 9-4.5" />
                              <path d="M6.5 14l-1.3 2.3" />
                              <path d="M12 15v2.6" />
                              <path d="M17.5 14l1.3 2.3" />
                            </g>
                          </svg>
                        </button>
                      </div>
                      <p className={`u403-msg ${fieldErrors.password ? 'is-on' : ''}`} role="alert">
                        {fieldErrors.password || ''}
                      </p>
                    </div>

                    {/* Khối đo độ mạnh mật khẩu & 3 tiêu chí động (#404 - chỉ khi Đăng Ký) */}
                    {mode === 'register' && (
                      <div
                        className="u404-st"
                        data-lv={passwordChecks.level}
                        role="meter"
                        aria-label="Độ mạnh mật khẩu"
                        aria-valuemin={0}
                        aria-valuemax={4}
                        aria-valuenow={passwordChecks.level}
                        aria-valuetext={passwordChecks.label}
                      >
                        <div className="u404-st-head">
                          <span className="u404-st-cap">Độ mạnh mật khẩu</span>
                          <span className="u404-st-lv">{passwordChecks.label}</span>
                        </div>

                        <div className="u404-bars" aria-hidden="true">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`u404-bar ${
                                passwordChecks.level >= step ? 'is-on' : ''
                              }`}
                            >
                              <div className="u404-bar-fill" />
                            </div>
                          ))}
                        </div>

                        <div className="u404-rules" aria-label="Tiêu chí bảo mật mật khẩu">
                          {[
                            { met: passwordChecks.hasMinLen, text: 'Từ 8 ký tự trở lên' },
                            { met: passwordChecks.hasDigit, text: 'Có ít nhất 1 chữ số' },
                            {
                              met: passwordChecks.hasSpecial,
                              text: 'Có ít nhất 1 ký tự đặc biệt',
                            },
                          ].map((rule) => (
                            <div
                              key={rule.text}
                              className={`u404-rule ${rule.met ? 'is-met' : ''}`}
                            >
                              <span className="u404-rchk" aria-hidden="true">
                                <svg viewBox="0 0 12 12">
                                  <path d="M2.2 6.2l2.6 2.6L9.8 3.4" />
                                </svg>
                              </span>
                              <span>{rule.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nút Submit biến hình 3 trạng thái + Thức tỉnh (.is-awake) */}
                    <div className="u403-go-wrap">
                      <button
                        type="submit"
                        disabled={isSubmitDisabled}
                        aria-disabled={isRegisterSleeping}
                        className={[
                          'u403-go',
                          isRegisterSleeping ? 'is-sleep' : '',
                          isRegisterReady && btnState === 'idle' ? 'is-awake' : '',
                          btnState === 'busy' || (authLoading && btnState !== 'ok') ? 'is-busy' : '',
                          btnState === 'ok' ? 'is-ok' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <span className="u403-go-lbl">
                          {mode === 'login'
                            ? 'Tiếp tục vào Đấu Trường'
                            : 'Khởi Tạo Hồ Sơ Thợ Săn'}
                        </span>
                        <span className="u403-spin" aria-hidden="true" />
                        <svg viewBox="0 0 24 24" className="u403-ok-ic" aria-hidden="true">
                          <path d="M5 12.5l4.6 4.6L19 7.8" />
                        </svg>
                      </button>
                    </div>
                  </form>

                  {/* Vùng đọc màn hình ẩn chuẩn accessibility */}
                  <p role="status" className="sr-only">
                    {srStatus}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Dòng chuyển đổi Đăng Nhập <-> Đăng Ký */}
              <div className="mt-5 sm:mt-6 text-xs text-[#9BA8AB] text-center">
                {mode === 'login' ? (
                  <p>
                    Chưa có hồ sơ Thợ Săn?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      disabled={isBusyOrOk}
                      className="text-[#F4F0E8] font-semibold hover:text-[#F5B942] hover:underline ml-1 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      Đăng ký ngay
                    </button>
                  </p>
                ) : (
                  <p>
                    Đã có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      disabled={isBusyOrOk}
                      className="text-[#F4F0E8] font-semibold hover:text-[#F5B942] hover:underline ml-1 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      Đăng nhập ngay
                    </button>
                  </p>
                )}
              </div>

              {/* Lối Tắt Cài Đặt Ứng Dụng Trên Mobile */}
              <div className="mt-3.5 pt-3.5 border-t border-[#253745]/70 flex flex-col items-center gap-1.5 sm:hidden">
                <span className="text-[10px] text-[#9BA8AB]">
                  Muốn mở nhanh như ứng dụng điện thoại?
                </span>
                <InstallAppButton variant="auth" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
