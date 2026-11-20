import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { TaskCategory, TaskDifficulty } from '../../types';
import { CATEGORIES, DIFFICULTIES } from '../../constants/categories';
import { CoinIcon } from '../ui/CoinIcon';
import { X, Plus, Timer, Sparkles } from 'lucide-react';
import { MODAL_BACKDROP_VARIANTS, EASING_SPRING } from '../../constants/motion';
import { getTodayString, getTomorrowString } from '../../utils/dateUtils';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

const DIFFICULTY_OPTIONS: { key: TaskDifficulty; label: string; color: string }[] = [
  { key: 'easy', label: 'Dễ', color: 'text-emerald-400' },
  { key: 'medium', label: 'Vừa', color: 'text-cyan-400' },
  { key: 'hard', label: 'Khó', color: 'text-amber-400' },
  { key: 'boss', label: 'Trùm', color: 'text-rose-400' },
];

export const CreateQuestDrawer: React.FC = () => {
  const { isCreateQuestOpen, setCreateQuestOpen, addTask } = useFaeQuestStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDateType, setTargetDateType] = useState<'today' | 'tomorrow'>('today');
  const [category, setCategory] = useState<TaskCategory>('hoc-tap');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('medium');
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
      false, // Không dùng lặp lại hằng ngày
      focusDuration,
      description,
      assignedDate
    );

    // Reset form
    setTitle('');
    setDescription('');
    setTargetDateType('today');
    setFocusDuration(null);
    setCreateQuestOpen(false);
  };

  const handleClose = () => {
    setCreateQuestOpen(false);
  };

  const selectedDiff = DIFFICULTIES[difficulty] || DIFFICULTIES.medium;

  useBodyScrollLock(isCreateQuestOpen);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isCreateQuestOpen && (
        <motion.div
          variants={MODAL_BACKDROP_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="exit"
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          className="fixed inset-0 w-screen h-[100dvh] z-[100] bg-[#06141B]/80 backdrop-blur-md touch-none overscroll-none flex items-end md:items-center justify-center p-0 md:p-4"
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
                    Thiết lập mục tiêu rèn luyện & tích lũy EXP
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
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto overscroll-contain touch-pan-y space-y-3.5 flex-1">
              {/* Dòng 1 — Tên nhiệm vụ (text-base chống Safari iOS auto-zoom) */}
              <div className="space-y-1">
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

              {/* Dòng 2 — Thời điểm thực hiện: Hôm nay vs Ngày mai (Icon đã lược bỏ, không trùng lặp) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#9BA8AB]">
                  Thời điểm thực hiện
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#11212D] border border-[#253745]">
                  <button
                    type="button"
                    onClick={() => setTargetDateType('today')}
                    className={`relative py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
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
                    <span className="relative z-10 font-bold">Hôm nay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetDateType('tomorrow')}
                    className={`relative py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
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
                    <span className="relative z-10 font-bold">Ngày mai</span>
                  </button>
                </div>
              </div>

              {/* Dòng 2.5 — Mô tả nhiệm vụ (Tùy chọn) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#9BA8AB]">
                    Mô tả nhiệm vụ (Tùy chọn)
                  </label>
                  <span className="text-[10px] text-[#9BA8AB]">
                    {description.length}/220
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={220}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Thêm mô tả hoặc ghi chú cụ thể cho nhiệm vụ..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#11212D] border border-[#253745] text-xs text-[#CCD0CF] placeholder-[#9BA8AB]/50 focus:outline-none focus:border-[#4A5C6A] transition shadow-inner resize-none leading-relaxed"
                />
              </div>

              {/* Dòng 3 — Phân loại: 5 cột xếp gọn gàng trên 1 hàng ngang */}
              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#9BA8AB]">
                  Phân loại
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(Object.keys(CATEGORIES) as TaskCategory[]).map((catKey) => {
                    const cat = CATEGORIES[catKey];
                    const isSelected = category === catKey;
                    return (
                      <button
                        type="button"
                        key={catKey}
                        onClick={() => setCategory(catKey)}
                        className={`py-1.5 px-0.5 rounded-lg text-[11px] sm:text-xs font-bold transition cursor-pointer text-center truncate ${
                          isSelected
                            ? 'bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] shadow-sm font-black'
                            : 'bg-[#11212D] text-[#9BA8AB] hover:text-[#CCD0CF] border border-[#253745]'
                        }`}
                        title={cat.label}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dòng 4 — Độ khó: 4 nút gọn gàng, bỏ chữ EXP trùng lặp */}
              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#9BA8AB]">
                  Độ khó & Thử thách
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {DIFFICULTY_OPTIONS.map((item) => {
                    const isSelected = difficulty === item.key;
                    return (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() => setDifficulty(item.key)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition text-center cursor-pointer border ${
                          isSelected
                            ? 'bg-[#253745] border-[#CCD0CF] shadow-sm font-black'
                            : 'bg-[#11212D] border-[#253745] hover:border-[#4A5C6A]'
                        }`}
                      >
                        <span className={isSelected ? 'text-[#CCD0CF]' : item.color}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dòng 5 — Đồng hồ Focus: Ô nhập số phút trực tiếp */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#9BA8AB] flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-amber-300" />
                    <span>Thời gian Focus (phút)</span>
                  </label>
                  {focusDuration ? (
                    <button
                      type="button"
                      onClick={() => setFocusDuration(null)}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition cursor-pointer"
                    >
                      Tắt Focus
                    </button>
                  ) : (
                    <span className="text-[10px] text-[#9BA8AB]/50">Tùy chọn</span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={focusDuration ?? ''}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      if (!val || Number(val) <= 0) {
                        setFocusDuration(null);
                      } else {
                        setFocusDuration(Math.min(360, Math.max(1, Math.round(Number(val)))));
                      }
                    }}
                    placeholder="Điền số phút muốn tập trung (VD: 25, 45...)"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#11212D] border border-[#253745] focus:border-[#4A5C6A] text-base text-[#CCD0CF] placeholder:text-[#9BA8AB]/40 outline-none transition font-medium pr-12"
                  />
                  <span className="absolute right-3.5 text-xs font-bold text-[#9BA8AB] pointer-events-none select-none">
                    phút
                  </span>
                </div>
              </div>

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

              {/* Nút Xác Nhận Dưới Cùng (h-11, gọn gàng, đổi nhãn theo ngày) */}
              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-[0_4px_20px_rgba(204,208,207,0.25)] hover:shadow-[0_4px_25px_rgba(255,255,255,0.35)] active:scale-[0.98] transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>{targetDateType === 'today' ? 'Khắc Lệnh Hôm Nay' : 'Lên Lịch Ngày Mai'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
