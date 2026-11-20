import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { AlertTriangle, X, Loader2, RotateCcw } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export const ResetModal: React.FC = () => {
  const { isResetOpen, setResetOpen, resetAllData } = useFaeQuestStore();
  const [isResetting, setIsResetting] = useState(false);

  useBodyScrollLock(isResetOpen);

  if (!isResetOpen || typeof document === 'undefined') return null;

  const handleResetAllData = async () => {
    if (isResetting) return;
    setIsResetting(true);

    try {
      const success = await resetAllData();
      if (success) {
        // Chờ 600ms để hiệu ứng âm thanh và toast hoàn tất trước khi reload xác nhận dữ liệu Cloud
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }, 600);
      } else {
        setIsResetting(false);
      }
    } catch (err) {
      console.error('Lỗi khi thực hiện reset hành trình:', err);
      setIsResetting(false);
    }
  };

  const handleClose = () => {
    if (isResetting) return; // Khóa đóng modal khi đang đồng bộ ghi đè lên Supabase
    setResetOpen(false);
  };

  return createPortal(
    <div
      onClick={handleClose}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      className="fixed inset-0 w-screen h-[100dvh] z-[100] bg-[#06141B]/80 backdrop-blur-md touch-none overscroll-none flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl sm:rounded-3xl max-w-sm w-[94vw] sm:w-full max-h-[90dvh] overflow-y-auto overscroll-contain touch-pan-y p-5 sm:p-6 space-y-4 bg-[#11212D] border border-rose-500/30 text-center shadow-[0_12px_40px_rgba(0,0,0,0.7)] relative animate-in fade-in zoom-in-95 duration-200"
      >
        {!isResetting && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-[#9BA8AB] hover:text-[#CCD0CF] p-1 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="w-14 h-14 rounded-2xl bg-rose-950/60 mx-auto flex items-center justify-center text-rose-400 border border-rose-500/40 shadow-lg">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="font-bold text-lg text-[#CCD0CF] tracking-wide">
            Khởi Tạo Lại Toàn Bộ Hành Trình?
          </h3>
          <p className="text-xs text-[#9BA8AB] leading-relaxed">
            Hành động này sẽ ghi đè trực tiếp lên máy chủ Supabase: đưa EXP về 0, đặt lại Rank Đồng, xóa toàn bộ nhiệm vụ và túi đồ để bắt đầu lại từ đầu như tài khoản mới.
          </p>
        </div>

        {isResetting && (
          <div className="py-2.5 px-3 rounded-xl bg-[#06141B]/80 border border-[#253745] flex items-center justify-center gap-2.5 text-xs text-rose-300 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
            <span>Đang ghi đè dữ liệu gốc lên Supabase...</span>
          </div>
        )}

        <div className="flex justify-center gap-2.5 pt-2">
          <button
            disabled={isResetting}
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-[#CCD0CF] transition cursor-pointer"
          >
            Giữ lại
          </button>
          <button
            disabled={isResetting}
            onClick={handleResetAllData}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-bold text-white transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            {isResetting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang khởi tạo lại...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại tất cả</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
