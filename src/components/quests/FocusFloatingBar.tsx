import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { Timer, Play, Pause, X, Maximize2, Zap, RotateCcw, Loader2 } from 'lucide-react';
import { formatFocusTime } from '../../utils/focusSession';

export const FocusFloatingBar: React.FC = () => {
  const {
    tasks,
    activeFocusTaskId,
    isFocusRunning,
    focusTimeLeft,
    focusTargetMinutes,
    toggleFocusRunning,
    cancelFocus,
    setFocusModalOpen,
    focusSession,
    isFocusCompleting,
    completeQuest,
  } = useFaeQuestStore();

  const task = tasks.find((t) => t.id === activeFocusTaskId);
  const pending = Boolean(focusSession?.finishRequested);

  const totalSeconds = (focusTargetMinutes || 25) * 60;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((totalSeconds - focusTimeLeft) / totalSeconds) * 100)
  );

  const formattedTime = formatFocusTime(focusTimeLeft);

  return (
    <AnimatePresence>
      {focusSession && (
        <motion.div
          key="focus-floating-bar"
          initial={{ opacity: 0, y: 28, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 28, scale: 0.94 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-[138px] right-3 left-3 md:left-auto md:bottom-6 md:right-6 z-50 sm:max-w-md w-auto bg-[#11212D]/95 backdrop-blur-md rounded-[24px] border border-[#4A5C6A] shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-3 sm:p-3.5 overflow-hidden group select-none"
        >
          {/* Subtle timer progress bar at top edge */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#253745]">
            <div
              className="h-full bg-gradient-to-r from-[#9BA8AB] to-[#CCD0CF] transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 text-left">
            {/* Left: Timer Icon & Task Title (Clickable to open detailed modal) */}
            <div
              onClick={() => setFocusModalOpen(true)}
              className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 cursor-pointer"
              title="Bấm để mở chi tiết & chỉnh âm nền"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#06141B] border border-[#253745] group-hover:border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shadow-inner shrink-0 relative transition">
                <Timer className={`w-4 h-4 sm:w-5 sm:h-5 text-[#CCD0CF] ${isFocusRunning ? 'animate-pulse' : ''}`} />
                {isFocusRunning && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#06141B] animate-ping" />
                )}
              </div>

              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#9BA8AB] flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 fill-[#CCD0CF] text-[#CCD0CF]" />
                    <span>Focus</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#253745] text-[#CCD0CF] font-bold">
                    {focusTargetMinutes}p
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#CCD0CF] truncate group-hover:text-white transition leading-tight">
                  {task?.title ?? focusSession.questTitle}
                </p>
              </div>
            </div>

            {/* Middle: Countdown Timer */}
            <div
              onClick={() => setFocusModalOpen(true)}
              className="px-1.5 text-center shrink-0 cursor-pointer"
              title="Bấm để xem chi tiết thời gian"
            >
              <span className="text-lg sm:text-xl font-bold font-mono tracking-wider text-[#CCD0CF]">
                {formattedTime}
              </span>
            </div>

            {/* Right: Controls (Play/Pause, Expand, Cancel) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Play / Pause Button */}
              <button
                type="button"
                onClick={() => {
                  if (pending) void completeQuest(focusSession.questId, { completedViaFocus: true });
                  else toggleFocusRunning();
                }}
                disabled={isFocusCompleting}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#CCD0CF] hover:bg-white active:scale-95 text-[#06141B] flex items-center justify-center font-bold shadow-[0_2px_10px_rgba(204,208,207,0.2)] transition cursor-pointer"
                title={isFocusCompleting ? 'Đang nghiệm thu' : pending ? 'Thử nghiệm thu lại' : isFocusRunning ? 'Tạm dừng đếm giờ' : 'Tiếp tục đếm giờ'}
              >
                {isFocusCompleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : pending ? (
                  <RotateCcw className="w-3.5 h-3.5" />
                ) : isFocusRunning ? (
                  <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#06141B]" />
                ) : (
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#06141B] ml-0.5" />
                )}
              </button>

              {/* Expand to Full Modal Button */}
              <button
                type="button"
                onClick={() => setFocusModalOpen(true)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#9BA8AB] hover:text-[#CCD0CF] flex items-center justify-center transition active:scale-95 cursor-pointer"
                title="Mở rộng chi tiết & cài đặt âm thanh"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={cancelFocus}
                disabled={isFocusCompleting}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#06141B] hover:bg-rose-950/70 border border-[#253745] hover:border-rose-500/50 text-[#9BA8AB] hover:text-rose-300 flex items-center justify-center transition active:scale-95 cursor-pointer"
                title="Hủy phiên tập trung"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
