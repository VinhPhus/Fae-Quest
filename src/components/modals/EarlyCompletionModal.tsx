import React from 'react';
import { createPortal } from 'react-dom';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { DIFFICULTIES } from '../../constants/categories';
import { Clock, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export const EarlyCompletionModal: React.FC = () => {
  const {
    confirmEarlyTask,
    confirmEarlyTaskCompletion,
    cancelEarlyTaskConfirmation,
  } = useFaeQuestStore();

  const isOpen = Boolean(confirmEarlyTask);
  useBodyScrollLock(isOpen);

  if (!isOpen || !confirmEarlyTask || typeof document === 'undefined') return null;

  const { task } = confirmEarlyTask;
  const diff = DIFFICULTIES[task.difficulty] || DIFFICULTIES.medium;
  const elapsedSeconds = Math.max(
    1,
    Math.floor((Date.now() - (task.createdAt || Date.now())) / 1000)
  );

  return createPortal(
    <div
      onClick={cancelEarlyTaskConfirmation}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      className="fixed inset-0 w-screen h-[100dvh] z-[100] bg-[#06141B]/80 backdrop-blur-md touch-none overscroll-none flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rpg-card rounded-3xl max-w-md w-full max-h-[90dvh] overflow-y-auto overscroll-contain touch-pan-y p-6 sm:p-7 relative overflow-hidden border-2 border-amber-500/60 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4"
      >
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-amber-300 mx-auto shadow-lg">
            <Clock className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cơ Chế Kỷ Luật Thợ Săn</span>
            </span>
            <h3 className="font-rpg font-bold text-xl text-parchment">
              Xác Nhận Nghiệm Thu Sớm
            </h3>
          </div>

          {/* Task Info Box */}
          <div className="p-3.5 rounded-2xl bg-thorn-dark/90 border border-opal/30 text-left space-y-1.5 shadow-inner">
            <p className="text-sm font-bold text-parchment truncate">{task.title}</p>
            <div className="flex items-center justify-between text-xs text-parchment/65">
              <span className={`font-semibold ${diff.tagClass}`}>{diff.label}</span>
              <span className="text-amber-300 font-medium">Vừa tạo {elapsedSeconds} giây trước</span>
            </div>
          </div>

          <p className="text-xs text-parchment/80 leading-relaxed px-1">
            Nhiệm vụ này vừa được tạo chưa đầy 30 giây. Bạn thực sự đã hoàn thành nó ngoài đời thực chứ?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 space-y-2 pt-2">
          <button
            onClick={confirmEarlyTaskCompletion}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-fae to-bargain hover:from-fae-light hover:to-bargain-light text-parchment font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Đã Hoàn Thành Thật</span>
          </button>

          <button
            onClick={cancelEarlyTaskConfirmation}
            className="w-full py-3 rounded-xl bg-thorn-dark/80 hover:bg-thorn border border-opal/40 text-parchment/70 hover:text-parchment font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Để Tôi Làm Tiếp</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
