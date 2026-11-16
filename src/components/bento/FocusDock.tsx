import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { DIFFICULTIES } from '../../constants/categories';
import { CoinIcon } from '../ui/CoinIcon';
import { Timer, Play, Zap } from 'lucide-react';

export const FocusDock: React.FC = () => {
  const { tasks, setActivePomodoroTaskId, updateTaskFocusDuration, setCreateQuestOpen } = useFaeQuestStore();

  // Find next pending task that has a focus duration set, or fallback to first pending task
  const focusTask = tasks.find((t) => !t.completed && Boolean(t.focusDuration));
  const fallbackTask = !focusTask ? tasks.find((t) => !t.completed) : null;
  const targetTask = focusTask || fallbackTask;

  if (!targetTask) {
    return (
      <div className="rounded-[22px] p-4 bg-[#11212D] shadow-[0_10px_30px_rgba(0,0,0,0.6)] border border-[#253745] flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#06141B] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shrink-0">
            <Timer className="w-5 h-5 text-[#CCD0CF]" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#CCD0CF] block">
              PHIÊN TẬP TRUNG TIÊU ĐIỂM
            </span>
            <p className="text-xs text-[#9BA8AB]">
              Tất cả nhiệm vụ đã hoàn thành! Khắc thêm nhiệm vụ mới để duy trì chuỗi kỷ luật.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCreateQuestOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs shadow-[0_4px_14px_rgba(204,208,207,0.2)] active:scale-95 transition cursor-pointer whitespace-nowrap"
        >
          + Khắc Lệnh Mới
        </button>
      </div>
    );
  }

  const duration = targetTask.focusDuration || 25;
  const diff = DIFFICULTIES[targetTask.difficulty] || DIFFICULTIES.medium;

  // Calculate estimated combined rewards
  const focusExp = Math.round(duration * 2.5);
  const focusCoins = Math.round(duration * 0.4);
  const totalExp = diff.exp + focusExp;
  const totalCoins = diff.coins + focusCoins;

  const handleStartFocus = () => {
    if (!targetTask.focusDuration) {
      updateTaskFocusDuration(targetTask.id, 25);
    }
    setActivePomodoroTaskId(targetTask.id);
  };

  return (
    <div className="rounded-[22px] p-4 sm:p-4.5 bg-[#11212D] shadow-[0_12px_32px_rgba(0,0,0,0.6)] border border-[#253745] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-left relative overflow-hidden group">
      {/* Ambient background beam */}
      <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-[#CCD0CF]/10 to-transparent pointer-events-none" />

      {/* Left Info: Icon & Task Title */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-[#06141B] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shadow-inner shrink-0 group-hover:scale-105 transition">
          <Timer className="w-5 h-5 text-[#CCD0CF] animate-pulse" />
        </div>

        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#CCD0CF] flex items-center gap-1">
              <Zap className="w-3 h-3 fill-[#CCD0CF]" />
              <span>PHIÊN TẬP TRUNG TIÊU ĐIỂM</span>
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF]">
              {duration} phút
            </span>
          </div>

          <p className="text-xs sm:text-sm font-bold text-[#CCD0CF] truncate leading-tight">
            {targetTask.title}
          </p>

          <div className="text-[11px] text-[#9BA8AB] flex items-center gap-1">
            <span>Tổng gộp:</span>
            <strong className="text-[#CCD0CF] font-bold">+{totalExp} EXP</strong>
            <span>•</span>
            <strong className="text-amber-300 font-bold flex items-center gap-0.5">
              <span>+{totalCoins}</span>
              <CoinIcon size="xs" />
            </strong>
          </div>
        </div>
      </div>

      {/* Right Action: Primary CTA Button */}
      <div className="shrink-0 flex items-center justify-end">
        <button
          type="button"
          onClick={handleStartFocus}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#CCD0CF] hover:bg-white active:scale-95 text-[#06141B] font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_4px_18px_rgba(204,208,207,0.25)] transition cursor-pointer"
          title={`Bắt đầu tập trung ${duration} phút cho nhiệm vụ này`}
        >
          <Play className="w-4 h-4 fill-[#06141B]" />
          <span>Bắt Đầu Focus</span>
        </button>
      </div>
    </div>
  );
};
