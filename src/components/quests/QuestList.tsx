import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CATEGORIES, DIFFICULTIES } from '../../constants/categories';
import { CoinIcon } from '../ui/CoinIcon';
import { Check, Trash2, Scroll, Timer, Repeat } from 'lucide-react';

export const QuestList: React.FC = () => {
  const {
    tasks,
    activeCategoryFilter,
    activeStatusFilter,
    toggleTask,
    deleteTask,
    setActivePomodoroTaskId,
  } = useFaeQuestStore();

  const filtered = tasks.filter((task) => {
    const matchCat =
      activeCategoryFilter === 'all' || task.category === activeCategoryFilter;
    const matchStatus =
      activeStatusFilter === 'all' ||
      (activeStatusFilter === 'pending' && !task.completed) ||
      (activeStatusFilter === 'completed' && task.completed);
    return matchCat && matchStatus;
  });

  if (filtered.length === 0) {
    return (
      <div className="rpg-card rounded-3xl p-10 text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-thorn-dark/80 border border-opal/40 mx-auto flex items-center justify-center text-fae">
          <Scroll className="w-8 h-8" />
        </div>
        <h4 className="text-base font-bold text-parchment">Chưa có nhiệm vụ nào trong mục này</h4>
        <p className="text-xs text-parchment/65 max-w-md mx-auto">
          Hãy khắc nhiệm vụ mới ở khung bên cạnh để bắt đầu hành trình tích lũy EXP và thăng cấp Rank!
        </p>
      </div>
    );
  }

  // Sort pending first, then newest
  const sorted = [...filtered].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="space-y-3">
      {sorted.map((task) => {
        const diff = DIFFICULTIES[task.difficulty] || DIFFICULTIES.medium;
        const cat = CATEGORIES[task.category] || CATEGORIES['ca-nhan'];

        return (
          <div
            key={task.id}
            className={`rpg-card rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:border-fae/60 ${
              task.completed ? 'opacity-65 bg-thorn-dark/50' : ''
            }`}
          >
            <div className="flex items-start sm:items-center justify-between gap-3.5">
              {/* Custom RPG Checkbox + Task Info */}
              <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                <button
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    toggleTask(task.id, { x: rect.right + 10, y: rect.top });
                  }}
                  className={`mt-0.5 sm:mt-0 w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${
                    task.completed
                      ? 'bg-fae border-fae text-thorn-dark shadow-md'
                      : 'bg-thorn-dark/90 border-fae/60 hover:border-fae hover:scale-110 text-transparent'
                  }`}
                  title={task.completed ? 'Nhấn để hoàn tác' : 'Nhấn để hoàn thành & nhận EXP'}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <p
                    className={`text-sm sm:text-base font-bold leading-snug break-words ${
                      task.completed ? 'line-through text-parchment/50' : 'text-parchment'
                    }`}
                  >
                    {task.title}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category Pill */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-xs font-medium ${cat.badgeBg}`}
                    >
                      <span>{cat.label}</span>
                    </span>

                    {/* Difficulty Pill */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-xs font-bold ${diff.badgeClass}`}
                    >
                      <span>{diff.label}</span>
                    </span>

                    {/* Daily Recurring badge */}
                    {task.isDailyRecurring && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-thorn-dark/80 text-[10px] text-parchment/60 border border-parchment/10">
                        <Repeat className="w-3 h-3 text-fae" />
                        <span>Lặp lại mỗi ngày</span>
                      </span>
                    )}

                    {/* Focus Duration badge (Chỉ hiển thị khi có Fae Focus) */}
                    {Boolean(task.focusDuration) && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!task.completed) setActivePomodoroTaskId(task.id);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-thorn-dark/80 text-[10px] text-fae-light border border-fae/20 hover:border-fae/50 cursor-pointer transition"
                        title={`Bật Đồng Hồ Fae Focus (${task.focusDuration} phút)`}
                      >
                        <Timer className="w-3 h-3 text-fae" />
                        <span>{task.focusDuration}p</span>
                        {task.focusRewardClaimed && (
                          <span className="text-[9px] text-emerald-400 font-bold ml-0.5">✓</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: EXP/Coin Reward + Pomodoro + Delete */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="text-right px-3 py-1.5 rounded-xl bg-thorn-dark/85 border border-fae/30">
                  <span className="block text-xs sm:text-sm font-extrabold text-fae">
                    +{diff.exp} EXP
                  </span>
                  <span className="flex items-center justify-end gap-1 text-[11px] font-semibold text-parchment/75">
                    <span>+{diff.coins}</span>
                    <CoinIcon size="xs" />
                  </span>
                </div>

                {!task.completed && Boolean(task.focusDuration) && (
                  <button
                    onClick={() => setActivePomodoroTaskId(task.id)}
                    className="p-2 rounded-xl bg-thorn-dark/80 hover:bg-opal/50 border border-opal/30 text-opal-light hover:text-parchment transition"
                    title="Bật Đồng Hồ Tập Trung (Pomodoro)"
                  >
                    <Timer className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-2 rounded-xl bg-thorn-dark/60 hover:bg-rose-950/60 border border-rose-500/20 text-parchment/40 hover:text-rose-300 transition"
                  title="Xóa nhiệm vụ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
