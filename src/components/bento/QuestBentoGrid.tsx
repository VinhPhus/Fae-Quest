import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CATEGORIES, DIFFICULTIES } from '../../constants/categories';
import { CoinIcon } from '../ui/CoinIcon';
import { EASING_SPRING } from '../../constants/motion';
import {
  Check,
  Trash2,
  Play,
  Repeat,
  Sparkles,
  LayoutGrid,
  List,
  Plus,
  Swords,
  Timer,
} from 'lucide-react';
import { TaskCategory } from '../../types';

export const QuestBentoGrid: React.FC = () => {
  const {
    tasks,
    activeCategoryFilter,
    activeStatusFilter,
    searchQuery,
    questViewMode,
    setCategoryFilter,
    setStatusFilter,
    setQuestViewMode,
    toggleTask,
    deleteTask,
    setActivePomodoroTaskId,
    setCreateQuestOpen,
  } = useFaeQuestStore();

  // Filter tasks based on Category, Status, and Search Query
  const filtered = tasks.filter((task) => {
    const matchCat =
      activeCategoryFilter === 'all' || task.category === activeCategoryFilter;
    const matchStatus =
      activeStatusFilter === 'all' ||
      (activeStatusFilter === 'pending' && !task.completed) ||
      (activeStatusFilter === 'completed' && task.completed);
    const matchSearch =
      !searchQuery.trim() ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase().trim());

    return matchCat && matchStatus && matchSearch;
  });

  // Sort: Pending first, then newest
  const sorted = [...filtered].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div id="tour-task-grid" className="space-y-4">
      {/* 1. Header Toolbar: Title, Category Pills, Status & View Toggle */}
      <div className="flex flex-col gap-3">
        {/* Top Row: Title & Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shadow-md">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-rpg font-extrabold text-lg sm:text-xl text-[#CCD0CF] tracking-wide flex items-center gap-2">
                <span>Nhiệm Vụ Chinh Phục</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF]">
                  {completedCount}/{totalCount}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filters: Chưa xong / Đã xong / Tất cả */}
            <div className="flex items-center p-1 rounded-full bg-[#06141B] border border-[#253745] text-xs relative">
              {(
                [
                  { id: 'pending', label: 'Chưa xong' },
                  { id: 'completed', label: 'Đã xong' },
                  { id: 'all', label: 'Tất cả' },
                ] as const
              ).map((status) => {
                const isSelected = activeStatusFilter === status.id;
                return (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => setStatusFilter(status.id)}
                    className={`px-3 py-1 rounded-full font-bold transition-colors cursor-pointer relative z-10 ${
                      isSelected
                        ? 'text-[#CCD0CF]'
                        : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="taskStatusPill"
                        className="absolute inset-0 rounded-full bg-[#253745] border border-[#4A5C6A] shadow-sm z-[-1]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span>{status.label}</span>
                  </button>
                );
              })}
            </div>

            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center p-1 rounded-full bg-[#06141B] border border-[#253745] text-xs relative">
              <button
                type="button"
                onClick={() => setQuestViewMode('bento')}
                className={`p-1.5 rounded-full transition-colors cursor-pointer relative z-10 ${
                  questViewMode === 'bento'
                    ? 'text-[#CCD0CF]'
                    : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
                }`}
                title="Dạng Bento Grid"
              >
                {questViewMode === 'bento' && (
                  <motion.div
                    layoutId="taskViewModePill"
                    className="absolute inset-0 rounded-full bg-[#253745] border border-[#4A5C6A] shadow-sm z-[-1]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setQuestViewMode('list')}
                className={`p-1.5 rounded-full transition-colors cursor-pointer relative z-10 ${
                  questViewMode === 'list'
                    ? 'text-[#CCD0CF]'
                    : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
                }`}
                title="Dạng danh sách"
              >
                {questViewMode === 'list' && (
                  <motion.div
                    layoutId="taskViewModePill"
                    className="absolute inset-0 rounded-full bg-[#253745] border border-[#4A5C6A] shadow-sm z-[-1]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row: Category Horizontal Scrolling Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar relative">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer relative z-10 ${
              activeCategoryFilter === 'all'
                ? 'text-[#CCD0CF]'
                : 'bg-[#06141B] text-[#9BA8AB] hover:text-[#CCD0CF] border border-[#253745]'
            }`}
          >
            {activeCategoryFilter === 'all' && (
              <motion.div
                layoutId="taskCategoryPill"
                className="absolute inset-0 rounded-full bg-[#253745] border border-[#4A5C6A] shadow-sm z-[-1]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span>Tất cả</span>
          </button>
          {(Object.keys(CATEGORIES) as TaskCategory[]).map((catKey) => {
            const cat = CATEGORIES[catKey];
            const isSelected = activeCategoryFilter === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setCategoryFilter(catKey)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer relative z-10 ${
                  isSelected
                    ? 'text-[#CCD0CF]'
                    : 'bg-[#06141B] text-[#9BA8AB] hover:text-[#CCD0CF] border border-[#253745]'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="taskCategoryPill"
                    className="absolute inset-0 rounded-full bg-[#253745] border border-[#4A5C6A] shadow-sm z-[-1]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Quest Cards Display (Bento Grid 2 Columns OR List Mode) */}
      {sorted.length === 0 ? (
        <div className="rounded-[28px] p-8 sm:p-10 bg-[#11212D] border border-[#253745] text-center space-y-3.5 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#06141B] border border-[#253745] mx-auto flex items-center justify-center text-[#CCD0CF]">
            <Sparkles className="w-7 h-7" />
          </div>
          <h4 className="text-base font-extrabold text-[#CCD0CF]">
            {searchQuery
              ? `Không tìm thấy nhiệm vụ phù hợp với "${searchQuery}"`
              : 'Chưa có nhiệm vụ nào trong mục này'}
          </h4>
          <p className="text-xs text-[#9BA8AB] max-w-sm mx-auto">
            Hãy bắt đầu khắc lệnh nhiệm vụ mới để tích lũy EXP và thăng hạng Thợ Săn ngay hôm nay!
          </p>
          <button
            type="button"
            onClick={() => setCreateQuestOpen(true)}
            className="px-5 py-2.5 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs inline-flex items-center gap-1.5 shadow-lg shadow-black/40 hover:brightness-105 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Khắc Lệnh Đầu Tiên</span>
          </button>
        </div>
      ) : questViewMode === 'bento' ? (
        /* Bento Grid 2 to 3 Columns (Desktop & Ultrawide) */
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {sorted.map((task) => {
              const diff = DIFFICULTIES[task.difficulty] || DIFFICULTIES.medium;
              const cat = CATEGORIES[task.category] || CATEGORIES['ca-nhan'];

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: EASING_SPRING }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  key={task.id}
                  className={`rounded-[24px] p-4 sm:p-5 bg-[#11212D] hover:bg-[#253745]/60 transition-colors duration-200 shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_32px_rgba(204,208,207,0.15)] border border-[#253745] hover:border-[#4A5C6A] flex flex-col justify-between min-h-[168px] relative overflow-hidden group ${
                    task.completed ? 'opacity-60 bg-[#06141B]/80' : ''
                  }`}
                >
                  {/* Phần trên thẻ: Category + Difficulty + Focus Duration + Reward Badges */}
                  <div className="flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${cat.badgeBg}`}
                      >
                        {cat.label}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${diff.badgeClass}`}
                      >
                        {diff.label}
                      </span>
                      {task.isDailyRecurring && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#06141B] text-[#9BA8AB] border border-[#253745] flex items-center gap-0.5">
                          <Repeat className="w-2.5 h-2.5 text-[#CCD0CF]" />
                          <span>Hằng ngày</span>
                        </span>
                      )}
                      {Boolean(task.focusDuration) && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#06141B] text-amber-300 border border-amber-400/40 flex items-center gap-1 shadow-sm">
                          <Timer className="w-2.5 h-2.5 text-amber-300" />
                          <span>⏱ {task.focusDuration}p</span>
                        </span>
                      )}
                    </div>

                    {/* Status / Reward Pill */}
                    {task.completed ? (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF] flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3 stroke-[3] text-emerald-400" />
                        <span>Đã chinh phục</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#06141B] border border-[#253745] text-right shrink-0">
                        <span className="text-xs font-black text-[#CCD0CF]">
                          +{diff.exp} EXP
                        </span>
                        <span className="text-[11px] font-bold text-[#9BA8AB] flex items-center gap-0.5">
                          <span>• +{diff.coins}</span>
                          <CoinIcon size="xs" />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Phần giữa thẻ (Nội dung chính): Tiêu đề & Mô tả nhiệm vụ */}
                  <div className="py-2 flex-1 flex flex-col justify-center">
                    <h4
                      className={`text-base md:text-lg font-bold leading-snug break-words ${
                        task.completed
                          ? 'line-through text-[#9BA8AB]'
                          : 'text-[#CCD0CF] group-hover:text-white transition'
                      }`}
                    >
                      {task.title}
                    </h4>

                    {task.description ? (
                      <p className="text-sm text-[#9BA8AB] leading-relaxed line-clamp-2 mt-1.5">
                        {task.description}
                      </p>
                    ) : (
                      <p className="text-xs text-[#9BA8AB]/60 italic mt-1 line-clamp-1">
                        {task.difficulty === 'boss'
                          ? 'Chiến dịch đại thử thách đòi hỏi sự tập trung cao độ'
                          : task.difficulty === 'hard'
                          ? 'Thử thách nâng cao rèn luyện ý chí thép'
                          : task.difficulty === 'easy'
                          ? 'Mục tiêu khởi động nhẹ nhàng xây dựng thói quen'
                          : 'Mục tiêu rèn luyện kỷ luật cá nhân'}
                      </p>
                    )}
                  </div>

                  {/* Phần đáy thẻ: Phân cách & Thao tác */}
                  <div className="flex items-center justify-between border-t border-[#253745]/70 pt-3 mt-3 gap-2 shrink-0">
                    {task.completed ? (
                      <span className="text-[11px] text-[#9BA8AB] italic select-none">
                        Nhiệm vụ đã hoàn tất
                      </span>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        type="button"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          toggleTask(task.id, { x: rect.right + 10, y: rect.top });
                        }}
                        className="h-8 px-3 rounded-full bg-[#06141B] border border-[#4A5C6A] hover:border-[#CCD0CF] text-[#9BA8AB] hover:text-[#CCD0CF] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm hover:scale-105"
                        title="Nhấn để hoàn thành & nhận EXP"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" />
                        <span>Hoàn thành</span>
                      </motion.button>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                      {/* Play Focus Button */}
                      {!task.completed && Boolean(task.focusDuration) && (
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          type="button"
                          onClick={() => setActivePomodoroTaskId(task.id)}
                          className="h-8 px-3 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs flex items-center gap-1.5 shadow-[0_2px_10px_rgba(204,208,207,0.2)] transition cursor-pointer"
                          title={`Bật Đồng Hồ Focus (${task.focusDuration} phút)`}
                        >
                          <Play className="w-3 h-3 fill-[#06141B]" />
                          <span>Focus</span>
                        </motion.button>
                      )}

                      {/* Delete Button */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        className="w-8 h-8 rounded-full bg-[#06141B] hover:bg-rose-950/70 border border-[#253745] hover:border-rose-500/50 text-[#9BA8AB] hover:text-rose-300 flex items-center justify-center transition cursor-pointer"
                        title="Xóa nhiệm vụ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* List View Mode */
        <motion.div layout className="space-y-2.5">
          <AnimatePresence>
            {sorted.map((task) => {
              const diff = DIFFICULTIES[task.difficulty] || DIFFICULTIES.medium;
              const cat = CATEGORIES[task.category] || CATEGORIES['ca-nhan'];

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: EASING_SPRING }}
                  key={task.id}
                  className={`rounded-[20px] p-3.5 sm:p-4 bg-[#11212D] hover:bg-[#253745]/60 border border-[#253745] hover:border-[#4A5C6A] flex items-center justify-between gap-3 transition-colors duration-200 shadow-md ${
                    task.completed ? 'opacity-60 bg-[#06141B]/80' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {task.completed ? (
                      <div className="w-6 h-6 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center shrink-0 text-emerald-400">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          toggleTask(task.id, { x: rect.right + 10, y: rect.top });
                        }}
                        className="w-6 h-6 rounded-lg border-2 bg-[#06141B] border-[#4A5C6A] hover:border-[#CCD0CF] flex items-center justify-center shrink-0 transition-colors cursor-pointer text-transparent"
                        title="Nhấn để hoàn thành & nhận EXP"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </motion.button>
                    )}

                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p
                        className={`text-xs sm:text-sm font-bold truncate ${
                          task.completed ? 'line-through text-[#9BA8AB]' : 'text-[#CCD0CF]'
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-[11px] text-[#9BA8AB] truncate">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-[#CCD0CF] font-semibold">{cat.label}</span>
                        <span className="text-[#9BA8AB]">•</span>
                        <span className="text-amber-300 font-semibold">{diff.label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {task.completed ? (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF] flex items-center gap-1">
                        <Check className="w-2.5 h-2.5 stroke-[3] text-emerald-400" />
                        <span>Đã chinh phục</span>
                      </span>
                    ) : (
                      <div className="text-right px-2.5 py-1 rounded-xl bg-[#06141B] border border-[#253745]">
                        <span className="text-xs font-black text-[#CCD0CF]">+{diff.exp} EXP</span>
                      </div>
                    )}

                    {!task.completed && Boolean(task.focusDuration) && (
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        type="button"
                        onClick={() => setActivePomodoroTaskId(task.id)}
                        className="h-7 px-2.5 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-[11px] flex items-center gap-1 cursor-pointer transition shadow"
                      >
                        <Play className="w-2.5 h-2.5 fill-[#06141B]" />
                        <span>{task.focusDuration}p</span>
                      </motion.button>
                    )}

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded-lg text-[#9BA8AB] hover:text-rose-300 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
