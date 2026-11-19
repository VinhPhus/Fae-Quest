import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, Share, PlusSquare, X, Check, Laptop } from 'lucide-react';
import { playSound } from '../../utils/soundEngine';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface InstallAppButtonProps {
  variant?: 'sidebar' | 'auth' | 'mobile-header' | 'compact' | 'settings';
  isCollapsed?: boolean;
  className?: string;
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  variant = 'sidebar',
  isCollapsed = false,
  className = '',
}) => {
  const { soundEnabled, deferredInstallPrompt, isAppStandalone } = useFaeQuestStore();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  useEffect(() => {
    // 1. Kiểm tra nếu app đã chạy ở chế độ standalone (đã cài đặt)
    const checkStandalone = () => {
      try {
        const isStandaloneMode =
          Boolean(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
          (window.navigator as any).standalone === true;
        setIsStandalone(isStandaloneMode);
      } catch {
        setIsStandalone(false);
      }
    };

    checkStandalone();

    // 2. Kiểm tra thiết bị iOS (iPhone / iPad / iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    setIsIos(isIosDevice);

    // 3. Khôi phục deferredPrompt nếu đã được bắt trước đó ở store hoặc window
    if (deferredInstallPrompt) {
      setDeferredPrompt(deferredInstallPrompt);
    } else if ((window as any).__faequest_install_prompt) {
      setDeferredPrompt((window as any).__faequest_install_prompt);
    }

    // 4. Lắng nghe sự kiện beforeinstallprompt của trình duyệt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as any).__faequest_install_prompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    // 5. Lắng nghe khi app được cài đặt thành công
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setInstallSuccess(true);
      setDeferredPrompt(null);
      (window as any).__faequest_install_prompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredInstallPrompt]);

  const effectiveStandalone = isStandalone || isAppStandalone;

  // Nếu đã chạy ở chế độ Standalone (đã cài đặt) và không phải ở mục Cài Đặt Settings, tự động ẩn nút đi
  if (effectiveStandalone && variant !== 'settings') {
    return null;
  }

  const handleInstall = async () => {
    playSound('ui_click', soundEnabled);

    // A. Nếu là iOS (Safari không hỗ trợ beforeinstallprompt)
    if (isIos) {
      setShowIosModal(true);
      return;
    }

    // B. Nếu đã bắt được sự kiện prompt từ trình duyệt (Android Chrome, Edge, Chromium)
    const promptToUse = deferredPrompt || (window as any).__faequest_install_prompt;
    if (promptToUse && promptToUse.prompt) {
      try {
        await promptToUse.prompt();
        const choice = await promptToUse.userChoice;
        if (choice.outcome === 'accepted') {
          setInstallSuccess(true);
          setDeferredPrompt(null);
          (window as any).__faequest_install_prompt = null;
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
        setShowManualModal(true);
      }
      return;
    }

    // C. Trường hợp trình duyệt chưa kịp bắn sự kiện hoặc desktop browser
    setShowManualModal(true);
  };

  return (
    <>
      {/* 1. NÚT DÀNH CHO THANH SIDEBAR (VỊ TRÍ DUY NHẤT TRONG GIAO DIỆN CHÍNH) */}
      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={handleInstall}
          title={isCollapsed ? 'Cài Đặt Ứng Dụng FaeQuest' : undefined}
          className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-cyan-300 hover:text-white bg-gradient-to-r from-cyan-950/40 via-[#11212D] to-transparent hover:from-cyan-900/40 border border-cyan-500/30 hover:border-cyan-400/70 transition shadow-[0_0_15px_rgba(34,211,238,0.08)] group cursor-pointer ${className}`}
        >
          <div className="w-6 h-6 shrink-0 flex items-center justify-center">
            {installSuccess ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Download className="w-4 h-4 text-cyan-400 group-hover:scale-110 group-hover:-translate-y-0.5 transition-transform" />
            )}
          </div>
          <div
            className={`flex items-center justify-between flex-1 whitespace-nowrap overflow-hidden transition-all duration-200 ease-out text-xs font-semibold ${
              isCollapsed
                ? 'opacity-0 max-w-0 -translate-x-2 ml-0 pointer-events-none'
                : 'opacity-100 max-w-[180px] translate-x-0 ml-3'
            }`}
          >
            <span>{installSuccess ? 'Đã Cài Đặt' : 'Cài Đặt App'}</span>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 tracking-wider">
              1-chạm
            </span>
          </div>
        </button>
      )}

      {/* 2. NÚT DÀNH CHO MÀN HÌNH ĐĂNG NHẬP / AUTH */}
      {variant === 'auth' && (
        <button
          type="button"
          onClick={handleInstall}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#11212D] via-[#253745] to-[#11212D] border border-cyan-500/40 hover:border-cyan-300 text-xs font-bold text-cyan-300 hover:text-white shadow-[0_0_16px_rgba(34,211,238,0.15)] hover:shadow-[0_0_22px_rgba(34,211,238,0.3)] transition-all cursor-pointer group ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform animate-pulse" />
          <span>Cài Đặt App 1-Chạm</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-400/20 text-cyan-300 uppercase font-black tracking-wider">
            PWA
          </span>
        </button>
      )}

      {/* 3. NÚT DÀNH CHO MOBILE TOP HEADER */}
      {variant === 'mobile-header' && (
        <button
          type="button"
          onClick={handleInstall}
          className={`px-2 py-1 rounded-lg bg-[#06141B] border border-cyan-500/40 hover:border-cyan-300 text-cyan-300 flex items-center gap-1.5 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer ${className}`}
          title="Cài đặt App FaeQuest lên điện thoại"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-[11px]">Cài App</span>
        </button>
      )}

      {/* 4. MỤC HIỂN THỊ DÀNH CHO BẢNG CÀI ĐẶT (SETTINGS MODAL) */}
      {variant === 'settings' && effectiveStandalone && (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-rpg font-bold text-sm text-[#CCD0CF]">Trạng Thái Ứng Dụng</h4>
              <p className="text-xs text-[#9BA8AB]">FaeQuest đang chạy trong môi trường ứng dụng độc lập</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-xs font-extrabold text-emerald-400 shadow-sm shrink-0 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Đã cài đặt phiên bản ứng dụng
          </span>
        </div>
      )}

      {variant === 'settings' && !effectiveStandalone && (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${className}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm">
              <Laptop className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h4 className="font-rpg font-bold text-sm text-[#CCD0CF]">Ứng Dụng & Thiết Bị (Cài Đặt App)</h4>
              <p className="text-xs text-[#9BA8AB] leading-relaxed">
                Cài đặt FaeQuest về máy để sử dụng mượt mà trong cửa sổ riêng biệt
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstall}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-[#06141B] font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] active:scale-95 transition cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Cài đặt FaeQuest về máy</span>
          </button>
        </div>
      )}

      {/* ================= MODALS ĐƯỢC RENDER TRỰC TIẾP LÊN BODY BẰNG CREATEPORTAL ĐỂ KHÔNG BỊ LỖI LỆCH/CẮT XÉN ================= */}
      {typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* MODAL HƯỚNG DẪN DÀNH CHO IPHONE / IPAD (iOS SAFARI) */}
            <AnimatePresence>
              {showIosModal && (
                <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.2 }}
                    className="bg-[#11212D] border border-[#4A5C6A] rounded-3xl max-w-sm w-full p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.95)] relative overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setShowIosModal(false)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#06141B] border border-[#253745] hover:border-[#4A5C6A] text-[#9BA8AB] hover:text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="w-16 h-16 rounded-2xl bg-[#06141B] border-2 border-cyan-400/60 p-1 mx-auto flex items-center justify-center shadow-[0_0_24px_rgba(34,211,238,0.3)] mb-4">
                      <img
                        src="/logo.png"
                        alt="FaeQuest Logo"
                        className="w-full h-full object-contain [image-rendering:pixelated]"
                      />
                    </div>

                    <h3 className="font-rpg font-bold text-lg text-[#CCD0CF] mb-1">
                      Cài Đặt FaeQuest Trên iOS
                    </h3>
                    <p className="text-xs text-[#9BA8AB] mb-5">
                      Cài đặt ứng dụng trực tiếp từ trình duyệt Safari không cần thông qua App Store:
                    </p>

                    <div className="space-y-3 text-left mb-6">
                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#06141B] border border-[#253745]">
                        <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5">
                          <Share className="w-4 h-4 text-cyan-300" />
                        </div>
                        <div>
                          <span className="text-[11px] font-black uppercase text-cyan-400 tracking-wider block">
                            BƯỚC 1
                          </span>
                          <p className="text-xs text-[#CCD0CF] font-medium leading-relaxed">
                            Bấm biểu tượng <strong>Chia sẻ</strong> (ô vuông có mũi tên lên) ở thanh dưới cùng Safari.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#06141B] border border-[#253745]">
                        <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                          <PlusSquare className="w-4 h-4 text-amber-300" />
                        </div>
                        <div>
                          <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider block">
                            BƯỚC 2
                          </span>
                          <p className="text-xs text-[#CCD0CF] font-medium leading-relaxed">
                            Cuộn xuống danh sách tùy chọn và nhấn <strong>"Thêm vào MH chính"</strong> (Add to Home Screen).
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowIosModal(false)}
                      className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#06141B] font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/25 cursor-pointer"
                    >
                      Đã Hiểu & Cài Đặt
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* MODAL HƯỚNG DẪN DÀNH CHO MÁY TÍNH & ANDROID (KHI BROWSER CHƯA TỰ HIỆN PROMPT) */}
            <AnimatePresence>
              {showManualModal && (
                <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.2 }}
                    className="bg-[#11212D] border border-[#4A5C6A] rounded-3xl max-w-sm w-full p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.95)] relative overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setShowManualModal(false)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#06141B] border border-[#253745] hover:border-[#4A5C6A] text-[#9BA8AB] hover:text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="w-16 h-16 rounded-2xl bg-[#06141B] border-2 border-cyan-400/60 p-1 mx-auto flex items-center justify-center shadow-[0_0_24px_rgba(34,211,238,0.3)] mb-4">
                      <img
                        src="/logo.png"
                        alt="FaeQuest Logo"
                        className="w-full h-full object-contain [image-rendering:pixelated]"
                      />
                    </div>

                    <h3 className="font-rpg font-bold text-lg text-[#CCD0CF] mb-1">
                      Cài Đặt Ứng Dụng FaeQuest
                    </h3>
                    <p className="text-xs text-[#9BA8AB] mb-5">
                      Chạy FaeQuest mượt mà ở chế độ cửa sổ riêng biệt như ứng dụng máy tính / điện thoại:
                    </p>

                    <div className="space-y-3 text-left mb-6">
                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#06141B] border border-[#253745]">
                        <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5">
                          <Laptop className="w-4 h-4 text-cyan-300" />
                        </div>
                        <div>
                          <span className="text-[11px] font-black uppercase text-cyan-400 tracking-wider block">
                            TRÊN MÁY TÍNH (CHROME / EDGE / BRAVE)
                          </span>
                          <p className="text-xs text-[#CCD0CF] leading-relaxed">
                            Bấm Menu <strong>3 chấm (⋮)</strong> góc trên cùng bên phải trình duyệt ➔ Chọn <strong>"Cài đặt FaeQuest"</strong> (hoặc "Thêm vào ứng dụng").
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#06141B] border border-[#253745]">
                        <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                          <Smartphone className="w-4 h-4 text-amber-300" />
                        </div>
                        <div>
                          <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider block">
                            TRÊN ANDROID (CHROME / CỐC CỐC)
                          </span>
                          <p className="text-xs text-[#CCD0CF] leading-relaxed">
                            Bấm Menu <strong>3 chấm (⋮)</strong> góc trên bên phải ➔ Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào MH chính"</strong>.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowManualModal(false)}
                      className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#06141B] font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/25 cursor-pointer"
                    >
                      Đã Hiểu
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </>,
          document.body
        )}
    </>
  );
};
