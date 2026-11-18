import React, { useState, useEffect } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { DIFFICULTIES } from '../../constants/categories';
import { CoinIcon } from '../ui/CoinIcon';
import { Timer, Play, Pause, RotateCcw, X, Check, Sparkles, Info, Minimize2 } from 'lucide-react';
import { AmbientType } from '../../utils/soundEngine';

const FOCUS_PRESETS = [10, 15, 25, 45, 60];

export const PomodoroTimerModal: React.FC = () => {
  const {
    activeFocusTaskId,
    isFocusModalOpen,
    setFocusModalOpen,
    isFocusRunning,
    toggleFocusRunning,
    focusTimeLeft,
    focusTargetMinutes,
    setFocusTargetMinutes,
    cancelFocus,
    tasks,
    streakDays,
    completePomodoro,
    focusAmbient = 'rain',
    setFocusAmbient,
  } = useFaeQuestStore();

  const task = tasks.find((t) => t.id === activeFocusTaskId);

  const [customInput, setCustomInput] = useState(String(focusTargetMinutes || 25));
  const [showRewardInfo, setShowRewardInfo] = useState(false);

  useEffect(() => {
    if (focusTargetMinutes) {
      setCustomInput(String(focusTargetMinutes));
    }
  }, [focusTargetMinutes]);

  const handleClose = () => {
    // Minimize to floating bar instead of canceling
    setFocusModalOpen(false);
  };

  // Keyboard shortcut: Escape to minimize
  useEffect(() => {
    if (!isFocusModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusModalOpen]);

  if (!isFocusModalOpen || !activeFocusTaskId || !task) return null;

  const targetMinutes = focusTargetMinutes || 25;
  const totalSeconds = targetMinutes * 60;
  const elapsedSeconds = totalSeconds - focusTimeLeft;
  const elapsedMinutes = elapsedSeconds / 60;

  const minutes = Math.floor(focusTimeLeft / 60);
  const seconds = focusTimeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress = Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100));

  // Reward Calculations (Combining Task + Focus)
  const diff = DIFFICULTIES[task.difficulty] || DIFFICULTIES.medium;
  const streakBonusMultiplier = streakDays >= 3 ? 1.2 : 1.0;
  const isTaskAlreadyCompleted = Boolean(task.completed);
  const taskExp = !isTaskAlreadyCompleted ? Math.round(diff.exp * streakBonusMultiplier) : 0;
  const taskCoins = !isTaskAlreadyCompleted ? diff.coins : 0;

  const maxFocusExp = Math.round(targetMinutes * 1);
  const maxFocusCoins = Math.max(1, Math.floor(targetMinutes * 0.4));

  const totalCombinedExp = taskExp + (task.focusRewardClaimed ? 0 : maxFocusExp);
  const totalCombinedCoins = taskCoins + (task.focusRewardClaimed ? 0 : maxFocusCoins);

  // Proportional Early Finish Rewards
  const earlyFocusExp = Math.max(1, Math.floor(maxFocusExp * (elapsedMinutes / targetMinutes)));
  const earlyFocusCoins = Math.max(1, Math.floor(maxFocusCoins * (elapsedMinutes / targetMinutes)));
  const earlyTotalExp = taskExp + (task.focusRewardClaimed ? 0 : earlyFocusExp);
  const earlyTotalCoins = taskCoins + (task.focusRewardClaimed ? 0 : earlyFocusCoins);

  // Soft Anti-Cheat: Need at least 50% elapsed time
  const isPristine = !isFocusRunning && focusTimeLeft === totalSeconds;
  const canFinishEarly = !isPristine && elapsedSeconds >= totalSeconds * 0.5;

  const handleSelectDuration = (min: number) => {
    if (!isPristine) return;
    const cleanMin = Math.min(180, Math.max(5, min));
    setFocusTargetMinutes(cleanMin);
    setCustomInput(String(cleanMin));
  };

  const handleCustomBlur = () => {
    if (!isPristine) return;
    const parsed = parseInt(customInput, 10);
    if (!isNaN(parsed) && parsed >= 5 && parsed <= 180) {
      handleSelectDuration(parsed);
    } else {
      setCustomInput(String(targetMinutes));
    }
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#06141B]/85 backdrop-blur-sm cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-3xl max-w-md w-[94vw] sm:w-full max-h-[88vh] overflow-y-auto p-4 sm:p-7 text-center relative border border-[#4A5C6A] bg-[#11212D] shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar cursor-default"
      >
        {/* Ambient Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#CCD0CF]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Right Buttons: Minimize & Close */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full bg-[#06141B] border border-[#253745] hover:border-[#4A5C6A] text-[#9BA8AB] hover:text-[#CCD0CF] transition"
            title="Thu nhỏ về thanh nổi góc màn hình"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={cancelFocus}
            className="p-1.5 rounded-full bg-[#06141B] border border-[#253745] hover:border-rose-500/50 text-[#9BA8AB] hover:text-rose-300 transition"
            title="Hủy toàn bộ phiên tập trung"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Header */}
        <div className="relative z-10 space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#06141B] border border-[#4A5C6A] mx-auto flex items-center justify-center text-[#CCD0CF] shadow-inner mb-1">
            <Timer className={`w-7 h-7 text-[#CCD0CF] ${isFocusRunning ? 'animate-pulse' : ''}`} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#06141B] border border-[#253745] text-[11px] font-bold text-[#CCD0CF]">
            <Sparkles className="w-3 h-3 text-[#CCD0CF]" />
            <span>Đồng Hồ Rèn Luyện Fae Focus</span>
          </div>

          <h3 className="font-bold text-lg sm:text-xl text-[#CCD0CF] truncate px-6">
            {task.title}
          </h3>
        </div>

        {/* Duration Selection (Available only before starting) */}
        <div className="relative z-10 my-4 p-3 rounded-2xl bg-[#06141B]/70 border border-[#253745] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9BA8AB]">
            <span className="font-semibold flex items-center gap-1">
              <span>Mục tiêu thời gian:</span>
              <strong className="text-[#CCD0CF]">{targetMinutes} phút</strong>
            </span>
            {!isPristine && (
              <span className="text-[10px] text-[#9BA8AB]/60 italic">
                (Đang chạy - không thể đổi)
              </span>
            )}
          </div>

          {/* Quick Presets */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
            {FOCUS_PRESETS.map((min) => {
              const isSelected = targetMinutes === min;
              return (
                <button
                  key={min}
                  type="button"
                  disabled={!isPristine}
                  onClick={() => handleSelectDuration(min)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                    isSelected
                      ? 'bg-[#CCD0CF] text-[#06141B] shadow-sm'
                      : isPristine
                        ? 'bg-[#11212D] text-[#9BA8AB] hover:text-[#CCD0CF] border border-[#253745]'
                        : 'bg-[#11212D]/40 text-[#9BA8AB]/40 border border-[#253745]/30 cursor-not-allowed'
                  }`}
                >
                  {min}p {min === 25 ? '(Chuẩn)' : ''}
                </button>
              );
            })}
          </div>

          {/* Custom Duration Input */}
          <div className="flex items-center justify-center gap-2 pt-1 text-xs text-[#9BA8AB]">
            <input
              type="number"
              min={5}
              max={180}
              disabled={!isPristine}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onBlur={handleCustomBlur}
              className={`w-16 px-2 py-1 text-center font-bold rounded-lg border focus:outline-none transition ${
                isPristine
                  ? 'bg-[#11212D] border-[#253745] text-[#CCD0CF] focus:border-[#4A5C6A]'
                  : 'bg-[#11212D]/30 border-transparent text-[#9BA8AB]/40 cursor-not-allowed'
              }`}
            />
            <span className="text-xs">phút (5 - 180)</span>
          </div>
        </div>

        {/* Big Countdown Timer */}
        <div className="relative z-10 my-4 py-2">
          <div className="text-5xl sm:text-6xl font-black font-mono tracking-widest text-[#CCD0CF] drop-shadow-md">
            {formattedTime}
          </div>

          {/* Linear Progress Bar */}
          <div className="w-full h-2 rounded-full bg-[#06141B] border border-[#253745] mt-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#9BA8AB] to-[#CCD0CF] rounded-full transition-all duration-1000 ease-linear shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Combined Rewards Card */}
        <div className="relative z-10 mb-4 p-3 rounded-2xl bg-[#06141B]/70 border border-[#253745] text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-[#CCD0CF] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#CCD0CF]" />
              <span>Tổng Phần Thưởng</span>
            </span>
            <button
              type="button"
              onClick={() => setShowRewardInfo(!showRewardInfo)}
              className="text-[#9BA8AB] hover:text-[#CCD0CF] transition p-0.5"
              title="Xem chi tiết cách tính phần thưởng"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {showRewardInfo && (
            <div className="text-[11px] text-[#9BA8AB] p-2 rounded-xl bg-[#11212D] border border-[#253745] space-y-1 animate-in fade-in duration-150">
              <p>• Thưởng Nhiệm Vụ: +{taskExp} EXP & +{taskCoins} Xu</p>
              <p>• Thưởng Focus ({targetMinutes}p): +{maxFocusExp} EXP & +{maxFocusCoins} Xu</p>
              <p className="text-[#CCD0CF] italic">✓ Hoàn thành phiên tập trung sẽ tự động đánh dấu xong nhiệm vụ!</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-xl bg-[#11212D] border border-[#253745]">
              <span className="text-[10px] text-[#9BA8AB] block">Kinh Nghiệm</span>
              <span className="text-sm font-black text-[#CCD0CF]">+{totalCombinedExp} EXP</span>
            </div>
            <div className="p-2 rounded-xl bg-[#11212D] border border-[#253745]">
              <span className="text-[10px] text-[#9BA8AB] block">Xu Vàng</span>
              <span className="text-sm font-black text-amber-300 flex items-center justify-center gap-1">
                <span>+{totalCombinedCoins}</span>
                <CoinIcon size="xs" />
              </span>
            </div>
          </div>
        </div>

        {/* Ambient Sound Selection */}
        <div className="relative z-10 mb-4 p-3 rounded-2xl bg-[#06141B]/70 border border-[#253745] space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#CCD0CF] flex items-center gap-1.5">
              <span>🎧 Âm Nền Tập Trung Sâu:</span>
            </span>
            {isFocusRunning && focusAmbient !== 'off' && (
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Đang phát</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'off', label: 'Tắt', icon: '🔇' },
              { id: 'rain', label: 'Mưa Cổ', icon: '🌧️' },
              { id: 'hearth', label: 'Lửa Trại', icon: '🔥' },
              { id: 'abyss', label: 'Hư Không', icon: '🌌' },
            ].map((amb) => {
              const isSelected = focusAmbient === amb.id;
              return (
                <button
                  key={amb.id}
                  type="button"
                  onClick={() => setFocusAmbient(amb.id as AmbientType)}
                  className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 border cursor-pointer ${
                    isSelected
                      ? 'bg-[#CCD0CF] text-[#06141B] border-[#CCD0CF] shadow-sm'
                      : 'bg-[#11212D] text-[#9BA8AB] hover:text-[#CCD0CF] border-[#253745]'
                  }`}
                >
                  <span className="text-xs">{amb.icon}</span>
                  <span className="truncate">{amb.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timer Controls */}
        <div className="relative z-10 pt-2 space-y-3">
          <div className="flex items-center justify-center gap-3">
            {/* Play / Pause */}
            <button
              onClick={toggleFocusRunning}
              className="px-6 py-3 rounded-xl bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              {isFocusRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              <span>{isFocusRunning ? 'Tạm Dừng' : 'Bắt Đầu'}</span>
            </button>

            {/* Reset */}
            <button
              onClick={() => {
                setFocusTargetMinutes(targetMinutes);
              }}
              className="p-3 rounded-xl bg-[#06141B] hover:bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] text-[#9BA8AB] hover:text-[#CCD0CF] transition shadow cursor-pointer"
              title={`Đặt lại ${targetMinutes} phút`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Finished Early Button with Anti-Cheat 50% Rule */}
            <button
              onClick={() => {
                if (canFinishEarly && task) {
                  completePomodoro(task.id, elapsedMinutes, targetMinutes);
                  cancelFocus();
                }
              }}
              disabled={!canFinishEarly}
              className={`px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                canFinishEarly
                  ? 'bg-emerald-600/40 hover:bg-emerald-600 border border-emerald-400 text-emerald-200 shadow-md cursor-pointer hover:scale-105'
                  : 'bg-[#06141B]/60 border border-[#253745] text-[#9BA8AB]/30 cursor-not-allowed'
              }`}
              title={
                canFinishEarly
                  ? `Nhận tổng gộp: +${earlyTotalExp} EXP (+${taskExp} Task + ${earlyFocusExp} Focus) & +${earlyTotalCoins} Xu`
                  : 'Cần tập trung ít nhất 50% thời gian để mở khóa Xong Sớm'
              }
            >
              <Check className="w-4 h-4" />
              <span>Xong Sớm</span>
            </button>
          </div>

          {/* Early finish qualification status hint */}
          {!canFinishEarly && !isPristine && (
            <p className="text-[11px] text-[#9BA8AB]/70 italic">
              🔒 Cần tập trung ít nhất 50% thời gian (còn {Math.max(0, Math.ceil(totalSeconds * 0.5 - elapsedSeconds))}s) để mở khóa "Xong Sớm".
            </p>
          )}

          {canFinishEarly && (
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
              <span>✓ Đã mở khóa Xong Sớm: Tự động xong task & nhận tổng +{earlyTotalExp} EXP & +{earlyTotalCoins} Xu</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
