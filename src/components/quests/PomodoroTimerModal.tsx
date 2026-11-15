import React, { useState, useEffect } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { DIFFICULTIES } from '../../constants/categories';
import { CoinIcon } from '../ui/CoinIcon';
import { Timer, Play, Pause, RotateCcw, X, Check, Lock, Sparkles } from 'lucide-react';

const FOCUS_PRESETS = [10, 15, 25, 45, 60];

export const PomodoroTimerModal: React.FC = () => {
  const {
    activePomodoroTaskId,
    setActivePomodoroTaskId,
    tasks,
    streakDays,
    completePomodoro,
    updateTaskFocusDuration,
  } = useFaeQuestStore();

  const task = tasks.find((t) => t.id === activePomodoroTaskId);

  const initialDuration = task?.focusDuration || 25;
  const [targetMinutes, setTargetMinutes] = useState(initialDuration);
  const [timeLeft, setTimeLeft] = useState(initialDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [customInput, setCustomInput] = useState(String(initialDuration));

  // Sync with task when activePomodoroTaskId or task.focusDuration changes
  useEffect(() => {
    if (task) {
      const dur = task.focusDuration || 25;
      setTargetMinutes(dur);
      setTimeLeft(dur * 60);
      setCustomInput(String(dur));
      setIsRunning(false);
    }
  }, [activePomodoroTaskId, task?.id]);

  // Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      if (task) {
        completePomodoro(task.id, targetMinutes, targetMinutes);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, task, targetMinutes, completePomodoro]);

  if (!activePomodoroTaskId || !task) return null;

  const totalSeconds = targetMinutes * 60;
  const elapsedSeconds = totalSeconds - timeLeft;
  const elapsedMinutes = elapsedSeconds / 60;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
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
  const isPristine = !isRunning && timeLeft === totalSeconds;
  const canFinishEarly = !isPristine && elapsedSeconds >= totalSeconds * 0.5;

  const handleSelectDuration = (min: number) => {
    if (!isPristine) return;
    const cleanMin = Math.min(180, Math.max(5, min));
    setTargetMinutes(cleanMin);
    setTimeLeft(cleanMin * 60);
    setCustomInput(String(cleanMin));
    updateTaskFocusDuration(task.id, cleanMin);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-thorn-dark/85 backdrop-blur-md">
      <div className="rpg-card rounded-3xl max-w-md w-full p-6 sm:p-7 text-center relative border border-fae/50 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Ambient Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-fae/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={() => setActivePomodoroTaskId(null)}
          className="absolute top-4 right-4 text-parchment/40 hover:text-parchment p-1 transition z-10"
          title="Đóng đồng hồ"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="relative z-10 space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fae to-bargain mx-auto flex items-center justify-center text-parchment shadow-lg border border-fae/40 mb-1">
            <Timer className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-thorn-dark border border-opal/40 text-[11px] font-semibold text-opal-light">
            <Sparkles className="w-3 h-3 text-fae" />
            <span>Đồng Hồ Rèn Luyện Fae Focus</span>
          </div>

          <h3 className="font-rpg font-bold text-xl text-parchment truncate px-4">
            {task.title}
          </h3>
        </div>

        {/* Duration Selection (Available only before starting) */}
        <div className="relative z-10 my-4 p-3 rounded-2xl bg-thorn-dark/80 border border-opal/30 space-y-2">
          <div className="flex items-center justify-between text-xs text-parchment/80">
            <span className="font-semibold flex items-center gap-1">
              <span>Mục tiêu thời gian:</span>
              <strong className="text-fae font-bold">{targetMinutes} phút</strong>
            </span>
            {!isPristine && (
              <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-400/30">
                <Lock className="w-3 h-3" />
                <span>Đang khóa đổi giờ</span>
              </span>
            )}
          </div>

          {isPristine ? (
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {FOCUS_PRESETS.map((min) => {
                const isSelected = targetMinutes === min;
                return (
                  <button
                    key={min}
                    type="button"
                    onClick={() => handleSelectDuration(min)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
                      isSelected
                        ? 'bg-fae text-thorn-dark border-fae shadow-sm'
                        : 'bg-thorn text-parchment/70 hover:text-parchment border-opal/30 hover:border-opal/50'
                    }`}
                  >
                    {min === 25 ? '25p (Chuẩn)' : `${min}p`}
                  </button>
                );
              })}

              <div className="flex items-center gap-1 ml-1">
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onBlur={handleCustomBlur}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomBlur()}
                  className="w-14 px-2 py-1 rounded-xl bg-thorn border border-opal/40 text-xs font-bold text-fae text-center focus:outline-none focus:border-fae [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="5-180"
                />
                <span className="text-[11px] text-parchment/60">p</span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-parchment/60 text-left">
              Đang trong phiên tập trung. Hãy giữ sự kiên định để nhận trọn vẹn phần thưởng!
            </p>
          )}
        </div>

        {/* Circular / Big Digital Countdown Display */}
        <div className="relative z-10 my-4 space-y-3">
          <div className="text-5xl sm:text-6xl font-extrabold font-mono tracking-wider text-fae drop-shadow-[0_2px_12px_rgba(217,119,82,0.5)]">
            {formattedTime}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-thorn-dark h-2.5 rounded-full overflow-hidden border border-opal/30 p-0.5">
            <div
              className="bg-gradient-to-r from-opal via-bargain to-fae h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Combined Reward Preview Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#2D1036]/90 via-thorn-dark to-[#6B0733]/50 border border-amber-400/40 shadow-lg text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Xem Trước Tổng Phần Thưởng</span>
              </span>
              <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/30">
                ⚡ Tự Động Xong Nhiệm Vụ
              </span>
            </div>

            <p className="text-[11px] text-parchment/85 leading-relaxed">
              Hoàn thành phiên này sẽ <strong className="text-emerald-300 font-bold">tự động hoàn thành nhiệm vụ</strong> • Tổng nhận:{' '}
              <strong className="text-fae font-bold">+{totalCombinedExp} EXP</strong>{' '}
              <span className="text-parchment/60 font-medium">
                (+{taskExp} Nhiệm vụ + {maxFocusExp} Focus)
              </span>{' '}
              & <strong className="text-fae font-bold">+{totalCombinedCoins} Xu</strong>{' '}
              <span className="text-parchment/60 font-medium">
                (+{taskCoins} Nhiệm vụ + {maxFocusCoins} Focus)
              </span>
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <div className="px-3 py-1.5 rounded-xl bg-thorn-dark/95 border border-fae/40 flex items-center gap-1.5 shadow-sm">
                <span className="text-xs sm:text-sm font-extrabold text-fae">
                  +{totalCombinedExp} EXP
                </span>
                <span className="text-[10px] text-parchment/60 font-medium">
                  (+{taskExp} Task + {maxFocusExp} Focus)
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-thorn-dark/95 border border-fae/40 flex items-center gap-1.5 shadow-sm">
                <span className="text-xs sm:text-sm font-extrabold text-fae flex items-center gap-1">
                  <span>+{totalCombinedCoins}</span>
                  <CoinIcon size="xs" />
                </span>
                <span className="text-[10px] text-parchment/60 font-medium">
                  (+{taskCoins} Task + {maxFocusCoins} Focus)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="relative z-10 pt-2 space-y-3">
          <div className="flex items-center justify-center gap-3">
            {/* Play / Pause */}
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="px-6 py-3 rounded-xl rpg-btn-primary font-bold text-xs uppercase tracking-wider text-parchment flex items-center gap-2 shadow-lg hover:scale-105 transition"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Tạm Dừng' : 'Bắt Đầu'}</span>
            </button>

            {/* Reset */}
            <button
              onClick={() => {
                setIsRunning(false);
                setTimeLeft(targetMinutes * 60);
              }}
              className="p-3 rounded-xl bg-thorn-dark/90 hover:bg-thorn border border-opal/40 text-parchment/70 hover:text-parchment transition shadow"
              title={`Đặt lại ${targetMinutes} phút`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Finished Early Button with Anti-Cheat 50% Rule */}
            <button
              onClick={() => {
                if (canFinishEarly) {
                  completePomodoro(task.id, elapsedMinutes, targetMinutes);
                }
              }}
              disabled={!canFinishEarly}
              className={`px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                canFinishEarly
                  ? 'bg-emerald-600/40 hover:bg-emerald-600 border border-emerald-400 text-emerald-200 shadow-md cursor-pointer hover:scale-105'
                  : 'bg-thorn-dark/60 border border-parchment/10 text-parchment/30 cursor-not-allowed'
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
            <p className="text-[11px] text-parchment/50 italic">
              🔒 Cần tập trung ít nhất 50% thời gian (còn {Math.max(0, Math.ceil(totalSeconds * 0.5 - elapsedSeconds))}s) để mở khóa "Xong Sớm".
            </p>
          )}

          {canFinishEarly && (
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
              <span>✓ Đã mở khóa Xong Sớm: Tự động xong task & nhận tổng +${earlyTotalExp} EXP & +${earlyTotalCoins} Xu</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
