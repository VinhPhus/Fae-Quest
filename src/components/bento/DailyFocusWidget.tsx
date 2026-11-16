import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CATEGORIES, DIFFICULTIES } from '../../constants/categories';
import { CoinIcon } from '../ui/CoinIcon';
import { Flame, Check } from 'lucide-react';

export const DailyFocusWidget: React.FC = () => {
  const { tasks, toggleTask } = useFaeQuestStore();

  // Pick daily recurring tasks first; if fewer than 3, fill with top pending tasks
  const dailyTasks = tasks.filter((t) => t.isDailyRecurring);
  const displayTasks =
    dailyTasks.length > 0
      ? dailyTasks.slice(0, 4)
      : tasks.filter((t) => !t.completed).slice(0, 3);

  const completedDailyCount = dailyTasks.filter((t) => t.completed).length;

  return (
    <div className="rounded-[28px] p-5 bg-[#11212D] border border-[#253745] shadow-[0_12px_32px_rgba(0,0,0,0.6)] space-y-3.5 text-left">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Flame className="w-4 h-4 fill-amber-300" />
          </div>
          <h4 className="font-rpg font-bold text-sm text-[#CCD0CF] tracking-wide">
            {dailyTasks.length > 0 ? 'Nhiệm Vụ Hằng Ngày' : 'Tiêu Điểm Nhanh'}
          </h4>
        </div>

        {dailyTasks.length > 0 ? (
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF]">
            {completedDailyCount}/{dailyTasks.length} xong
          </span>
        ) : (
          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF]">
            {displayTasks.length > 0 ? `${displayTasks.length} việc cần làm` : 'Ưu tiên'}
          </span>
        )}
      </div>

      {/* Task Stack */}
      {displayTasks.length === 0 ? (
        <div className="p-4 rounded-2xl bg-[#06141B] border border-[#253745] text-center space-y-1">
          <p className="text-xs text-[#9BA8AB]">
            Hiện không có nhiệm vụ ưu tiên nào chưa xong.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayTasks.map((task) => {
            const diff = DIFFICULTIES[task.difficulty] || DIFFICULTIES.medium;
            const cat = CATEGORIES[task.category] || CATEGORIES['ca-nhan'];

            return (
              <div
                key={task.id}
                className={`p-3 rounded-2xl bg-[#06141B] hover:bg-[#253745]/60 border border-[#253745] transition-all flex items-center justify-between gap-2.5 shadow-sm group ${
                  task.completed ? 'opacity-60 bg-[#06141B]/60' : ''
                }`}
              >
                {/* Left: Category Icon & Title */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-xs shrink-0 text-[#CCD0CF]">
                    <span>{cat.label.slice(0, 2)}</span>
                  </div>

                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p
                      className={`text-xs font-bold truncate leading-tight ${
                        task.completed ? 'line-through text-[#9BA8AB]' : 'text-[#CCD0CF]'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-[#CCD0CF] font-bold">+{diff.exp} EXP</span>
                      <span className="text-[#9BA8AB]">•</span>
                      <span className="text-amber-300 font-bold flex items-center gap-0.5">
                        <span>+{diff.coins}</span>
                        <CoinIcon size="xs" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Check Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    toggleTask(task.id, { x: rect.right, y: rect.top });
                  }}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition cursor-pointer ${
                    task.completed
                      ? 'bg-[#CCD0CF] border-[#CCD0CF] text-[#06141B] shadow-sm'
                      : 'bg-[#06141B] border-[#4A5C6A] hover:border-[#CCD0CF] text-transparent hover:scale-105'
                  }`}
                  title={task.completed ? 'Hoàn tác' : 'Hoàn thành ngay'}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
