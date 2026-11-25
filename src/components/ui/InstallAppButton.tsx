import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, Check } from 'lucide-react';
import { playSound } from '../../utils/soundEngine';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { InstallAppCard393 } from './InstallAppCard393';

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
  const { soundEnabled, isAppStandalone } = useFaeQuestStore();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [isStandaloneLocal, setIsStandaloneLocal] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return (
        Boolean(window.matchMedia?.('(display-mode: standalone)').matches) ||
        (window.navigator as any).standalone === true
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onInstalled = () => setIsStandaloneLocal(true);
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen]);

  useBodyScrollLock(isModalOpen);

  const effectiveStandalone = isStandaloneLocal || isAppStandalone;

  // Nếu đã chạy độc lập (đã cài) ở các điểm ngoài Settings thì ẩn nút gọn gàng
  if (effectiveStandalone && variant !== 'settings') {
    return null;
  }

  // Trong SettingsModal: render trực tiếp thẻ #393 hoàn chỉnh (không lồng modal)
  if (variant === 'settings') {
    return <InstallAppCard393 embedded />;
  }

  const handleOpenModal = () => {
    playSound('ui_click', soundEnabled);
    setIsModalOpen(true);
  };

  return (
    <>
      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={handleOpenModal}
          title={isCollapsed ? 'Cài Đặt Ứng Dụng FaeQuest' : undefined}
          className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-amber-300 hover:text-white bg-gradient-to-r from-amber-500/15 via-[#11212D] to-transparent hover:from-amber-500/25 border border-amber-400/30 hover:border-amber-300/60 transition shadow-[0_0_15px_rgba(245,185,66,0.08)] group cursor-pointer ${className}`}
        >
          <div className="w-6 h-6 shrink-0 flex items-center justify-center">
            {effectiveStandalone ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Download className="w-4 h-4 text-amber-300 group-hover:scale-110 group-hover:-translate-y-0.5 transition-transform" />
            )}
          </div>
          <div
            className={`flex items-center justify-between flex-1 whitespace-nowrap overflow-hidden transition-all duration-200 ease-out text-xs font-semibold ${
              isCollapsed
                ? 'opacity-0 max-w-0 -translate-x-2 ml-0 pointer-events-none'
                : 'opacity-100 max-w-[180px] translate-x-0 ml-3'
            }`}
          >
            <span>Cài Đặt App</span>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 tracking-wider">
              App
            </span>
          </div>
        </button>
      )}

      {variant === 'auth' && (
        <button
          type="button"
          onClick={handleOpenModal}
          className={`inline-flex items-center gap-2 min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#0D1821]/95 border border-amber-400/35 hover:border-amber-300/75 text-xs font-bold text-[#F4F0E8] hover:text-white shadow-[0_6px_18px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(245,185,66,0.22)] transition-all cursor-pointer group ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
          <span>Tải App FaeQuest</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 uppercase font-black tracking-wider">
            App
          </span>
        </button>
      )}

      {variant === 'mobile-header' && (
        <button
          type="button"
          onClick={handleOpenModal}
          className={`px-2.5 py-1 rounded-lg bg-[#0D1821] border border-amber-400/35 hover:border-amber-300 text-amber-300 flex items-center gap-1.5 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer ${className}`}
          title="Cài đặt App FaeQuest lên điện thoại"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[11px]">Tải App</span>
        </button>
      )}

      {variant === 'compact' && (
        <button
          type="button"
          onClick={handleOpenModal}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1821] border border-white/15 hover:border-amber-300/60 text-xs font-bold text-[#CCD0CF] hover:text-white transition cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-amber-300" />
          <span>Cài App</span>
        </button>
      )}

      {/* Modal Desktop căn giữa / Bottom Sheet Mobile */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isModalOpen && (
              <div
                onClick={() => setIsModalOpen(false)}
                className="fixed inset-0 z-[125] bg-[#06141B]/82 backdrop-blur-md flex items-end sm:items-center justify-center p-2.5 sm:p-5 overflow-y-auto"
                role="dialog"
                aria-modal="true"
                aria-label="Cài đặt ứng dụng FaeQuest"
              >
                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 330, damping: 26 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-[94vw] sm:max-w-[460px] max-h-[88dvh] overflow-y-auto overscroll-contain rounded-[28px] pb-[calc(4px+env(safe-area-inset-bottom,0px))] sm:pb-0"
                >
                  <InstallAppCard393 onClose={() => setIsModalOpen(false)} />
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};
