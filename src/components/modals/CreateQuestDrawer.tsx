import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { TaskCategory, TaskDifficulty } from '../../types';
import { CATEGORIES, DIFFICULTIES } from '../../constants/categories';
import { CoinIcon } from '../ui/CoinIcon';
import { X, Plus, Swords, Sunrise, Repeat, Timer, Sparkles } from 'lucide-react';
import { MODAL_BACKDROP_VARIANTS, EASING_SPRING } from '../../constants/motion';
import { getTodayString, getTomorrowString } from '../../utils/dateUtils';

export const CreateQuestDrawer: React.FC = () => {
  const { isCreateQuestOpen, setCreateQuestOpen, addTask } = useFaeQuestStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDateType, setTargetDateType] = useState<'today' | 'tomorrow'>('today');
  const [category, setCategory] = useState<TaskCategory>('hoc-tap');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('medium');
  const [isDailyRecurring, setIsDailyRecurring] = useState(false);
  const [focusDuration, setFocusDuration] = useState<number | null>(null);

  // Responsive state for Bottom Sheet vs Centered Modal
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedDate = targetDateType === 'today' ? getTodayString() : getTomorrowString();

    addTask(
      title,
      category,
      difficulty,
      targetDateType === 'today' ? isDailyRecurring : false,
      focusDuration,
      description,
      assignedDate
    );

    // Reset form
    setTitle('');
    setDescription('');
    setTargetDateType('today');
    setFocusDuration(null);
    setIsDailyRecurring(false);
    setCreateQuestOpen(false);
  };

  const handleClose = () => {
    setCreateQuestOpen(false);
  };

  const selectedDiff = DIFFICULTIES[difficulty] || DIFFICULTIES.medium;

  return (
    <AnimatePresence>
      {isCreateQuestOpen && (
        <motion.div
          variants={MODAL_BACKDROP_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0, y: 15 }}
            animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
            exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0, y: 15 }}
            transition={{ duration: 0.3, ease: EASING_SPRING }}
            className={`w-full ${
              isMobile
                ? 'rounded-t-3xl max-h-[90dvh] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-white/10'
                : 'max-w-md rounded-3xl max-h-[88vh] border border-white/10'
            } bg-[#06141B] shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle on Mobile */}
            {isMobile && (
              <div className="pt-2.5 pb-1 shrink-0 flex justify-center">
                <div className="w-12 h-1.5 rounded-full bg-[#4A5C6A]/60" />
              </div>
            )}

            {/* Header */}
            <div className="px-5 py-3.5 border-b border-[#253745] flex items-center justify-between shrink-0 bg-[#06141B]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#11212D] border border-[#253745] flex items-center justify-center text-[#CCD0CF] shadow">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h3 className="font-rpg font-extrabold text-base text-[#CCD0CF] tracking-wide">
                    Khắc Lệnh Nhiệm Vụ
                  </h3>
                  <p className="text-[11px] text-[#9BA8AB]">
                    Thiết lập mục tiêu để rèn luyện kỷ luật & tích lũy EXP
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-7 h-7 rounded-full bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] text-[#9BA8AB] hover:text-[#CCD0CF] flex items-center justify-center transition cursor-pointer"
                title="Đóng"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Dòng 1 — Tên nhiệm vụ (text-base chống iOS Safari auto-zoom) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#9BA8AB]">
                  Nhiệm vụ cần chinh phục *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Đọc 20 trang sách, Giải 3 bài LeetCode..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#11212D] border border-[#253745] text-base text-[#CCD0CF] placeholder-[#9BA8AB]/50 focus:outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition shadow-inner"
                />
              </div>

              {/* Dòng 2 — Thời điểm thực hiện (Segmented Control 2 lựa chọn: Hôm nay vs Ngày mai) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#9BA8AB]">
                  Thời điểm thực hiện
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#11212D] border border-[#253745]">
                  <button
                    type="button"
                    onClick={() => setTargetDateType('today')}
                    className={`relative py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      targetDateType === 'today'
                        ? 'text-[#CCD0CF]'
                        : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
                    }`}
                  >
                    {targetDateType === 'today' && (
                      <motion.div
                        layoutId="createQuestDateSegment"
                        className="absolute inset-0 rounded-lg bg-[#253745] border border-[#4A5C6A] shadow-sm z-0"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Swords className="w-3.5 h-3.5 relative z-10 text-cyan-300" />
                    <span className="relative z-10">⚔️ Hôm nay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetDateType('tomorrow')}
                    className={`relative py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      targetDateType === 'tomorrow'
                        ? 'text-[#CCD0CF]'
                        : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
                    }`}
                  >
                    {targetDateType === 'tomorrow' && (
                      <motion.div
                        layoutId="createQuestDateSegment"
                        className="absolute inset-0 rounded-lg bg-[#253745] border border-[#4A5C6A] shadow-sm z-0"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Sunrise className="w-3.5 h-3.5 relative z-10 text-amber-300" />
                    <span className="relative z-10">🌅 Ngày mai</span>
                  </button>
                </div>
              </div>

              {/* Dòng 3 — Danh mục (Category Chip Selector) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#9BA8AB]">
                  Phân loại
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(CATEGORIES) as TaskCategory[]).map((catKey) => {
                    const cat = CATEGORIES[catKey];
                    const isSelected = category === catKey;
                    return (
                      <button
                        type="button"
                        key={catKey}
                        onClick={() => setCategory(catKey)}
                        className={`py-1.5 px-3 rounded-full text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] shadow-sm scale-105'
                            : 'bg-[#11212D] text-[#9BA8AB] hover:text-[#CCD0CF] border border-[#253745]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dòng 4 — Độ khó (Dễ / Vừa / Khó / Trùm) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#9BA8AB]">
                  Độ khó & Thử thách
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(Object.keys(DIFFICULTIES) as TaskDifficulty[]).map((diffKey) => {
                    const diff = DIFFICULTIES[diffKey];
                    const isSelected = difficulty === diffKey;
                    return (
                      <button
                        type="button"
                        key={diffKey}
                        onClick={() => setDifficulty(diffKey)}
                        className={`p-2 rounded-xl text-center border transition cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-[#253745] border-[#CCD0CF] shadow ring-1 ring-[#CCD0CF]/40'
                            : 'bg-[#11212D] border-[#253745] hover:border-[#4A5C6A]'
                        }`}
                      >
                        <span className={`text-[11px] font-black ${diff.tagClass}`}>
                          {diff.label}
                        </span>
                        <span className="text-[10px] text-[#9BA8AB] mt-0.5">
                          +{diff.exp} EXP
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tùy chọn Fae Focus (Thời gian tập trung) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#9BA8AB] flex items-center gap-1">
                    <Timer className="w-3 h-3 text-[#CCD0CF]" />
                    <span>Đồng hồ Focus</span>
                  </label>
                  <span className="text-[10px] text-[#9BA8AB]">
                    {focusDuration ? `${focusDuration} phút` : 'Tắt'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { val: null, label: 'Tắt' },
                    { val: 15, label: '15p' },
                    { val: 25, label: '25p' },
                    { val: 45, label: '45p' },
                    { val: 60, label: '60p' },
                  ].map((item) => {
                    const isSelected = focusDuration === item.val;
                    return (
                      <button
                        key={String(item.val)}
                        type="button"
                        onClick={() => setFocusDuration(item.val)}
                        className={`py-1 px-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#CCD0CF] text-[#06141B] font-extrabold shadow-sm'
                            : 'bg-[#11212D] text-[#9BA8AB] hover:text-[#CCD0CF] border border-[#253745]'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lặp lại hằng ngày (Chỉ kích hoạt khi chọn Hôm nay) */}
              {targetDateType === 'today' && (
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#CCD0CF]">
                    <input
                      type="checkbox"
                      checked={isDailyRecurring}
                      onChange={(e) => setIsDailyRecurring(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-[#4A5C6A] focus:ring-0 accent-[#4A5C6A] bg-[#11212D]"
                    />
                    <span className="flex items-center gap-1 text-[11px] text-[#9BA8AB] hover:text-[#CCD0CF]">
                      <Repeat className="w-3 h-3 text-[#CCD0CF]" />
                      <span>Lặp lại hằng ngày (Tự làm mới mỗi sáng)</span>
                    </span>
                  </label>
                </div>
              )}

              {/* Phần Thưởng Dự Kiến Preview */}
              <div className="p-2.5 rounded-xl bg-[#11212D]/80 border border-[#253745] flex items-center justify-between text-xs">
                <span className="text-[#9BA8AB] text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Phần thưởng nghiệm thu:</span>
                </span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-cyan-300">+{selectedDiff.exp} EXP</span>
                  <span className="text-[#9BA8AB]">•</span>
                  <span className="text-amber-300 flex items-center gap-0.5">
                    +{selectedDiff.coins}
                    <CoinIcon size="xs" />
                  </span>
                </div>
              </div>

              {/* Nút Hành Động Dưới Cùng (w-full h-11, nhãn đổi theo mốc ngày) */}
              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(204,208,207,0.25)] hover:shadow-[0_4px_25px_rgba(255,255,255,0.35)] active:scale-[0.98] transition cursor-pointer"
                >
                  {targetDateType === 'today' ? (
                    <>
                      <Swords className="w-4 h-4 text-[#06141B] stroke-[2.5]" />
                      <span>Khắc Lệnh Hôm Nay</span>
                    </>
                  ) : (
                    <>
                      <Sunrise className="w-4 h-4 text-[#06141B] stroke-[2.5]" />
                      <span>Lên Lịch Ngày Mai</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
