import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { TaskCategory, TaskDifficulty } from '../../types';
import { CATEGORIES, DIFFICULTIES } from '../../constants/categories';
import { CoinIcon } from '../ui/CoinIcon';
import { X, PlusCircle, Repeat, Timer } from 'lucide-react';
import { MODAL_BACKDROP_VARIANTS, MODAL_PANEL_VARIANTS } from '../../constants/motion';

export const CreateQuestDrawer: React.FC = () => {
  const { isCreateQuestOpen, setCreateQuestOpen, addTask } = useFaeQuestStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('hoc-tap');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('medium');
  const [isDailyRecurring, setIsDailyRecurring] = useState(false);
  const [focusDuration, setFocusDuration] = useState<number | null>(null);
  const [customFocus, setCustomFocus] = useState<string>('25');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask(title, category, difficulty, isDailyRecurring, focusDuration, description);
    setTitle('');
    setDescription('');
    setFocusDuration(null);
    setCustomFocus('25');
    setIsDailyRecurring(false);
    setCreateQuestOpen(false);
  };

  const handleClose = () => {
    setCreateQuestOpen(false);
  };

  return (
    <AnimatePresence>
      {isCreateQuestOpen && (
        <motion.div
          variants={MODAL_BACKDROP_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            variants={MODAL_PANEL_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-[94vw] max-w-lg rounded-[28px] bg-gradient-to-b from-[#11212D] via-[#11212D] to-[#06141B] shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-[#253745] overflow-hidden flex flex-col max-h-[86vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#253745] flex items-center justify-between bg-[#06141B]/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center shadow-lg shadow-black/40">
              <PlusCircle className="w-5 h-5 text-[#CCD0CF]" />
            </div>
            <div>
              <h3 className="font-rpg font-extrabold text-base sm:text-lg text-[#CCD0CF] tracking-wide">
                Khắc Lệnh Nhiệm Vụ Mới
              </h3>
              <p className="text-xs text-[#9BA8AB]">
                Thiết lập mục tiêu để nhận EXP & thăng hạng Thợ Săn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#06141B] border border-[#253745] hover:border-[#4A5C6A] text-[#9BA8AB] hover:text-[#CCD0CF] flex items-center justify-center transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* 1. Title Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#CCD0CF]">
              Tên Nhiệm Vụ Cần Chinh Phục *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đọc 20 trang sách, Giải 3 bài LeetCode, Chạy bộ 3km..."
              className="w-full px-4 py-3 rounded-2xl bg-[#06141B] border border-[#253745] text-sm text-[#CCD0CF] placeholder-[#9BA8AB]/50 focus:outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition shadow-inner"
            />
          </div>

          {/* 1.5 Description Textarea (Tùy chọn) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#CCD0CF]">
                Mô Tả Chi Tiết / Ghi Chú (Tùy chọn)
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
              placeholder="VD: Chuẩn bị tài liệu trước 15p, hoàn thành xong chương 3..."
              className="w-full px-4 py-2.5 rounded-2xl bg-[#06141B] border border-[#253745] text-sm text-[#CCD0CF] placeholder-[#9BA8AB]/50 focus:outline-none focus:border-[#9BA8AB] focus:ring-1 focus:ring-[#9BA8AB] transition shadow-inner resize-none"
            />
          </div>

          {/* 2. Category Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#CCD0CF]">
              Phân Loại Nhiệm Vụ
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(CATEGORIES) as TaskCategory[]).map((catKey) => {
                const cat = CATEGORIES[catKey];
                const isSelected = category === catKey;

                return (
                  <button
                    type="button"
                    key={catKey}
                    onClick={() => setCategory(catKey)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] shadow-md scale-[1.02]'
                        : 'bg-[#06141B] border border-[#253745] text-[#9BA8AB] hover:text-[#CCD0CF] hover:border-[#4A5C6A]'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Difficulty Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#CCD0CF]">
              Độ Khó & Phần Thưởng EXP / Xu
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(DIFFICULTIES) as TaskDifficulty[]).map((diffKey) => {
                const diff = DIFFICULTIES[diffKey];
                const isSelected = difficulty === diffKey;

                return (
                  <button
                    type="button"
                    key={diffKey}
                    onClick={() => setDifficulty(diffKey)}
                    className={`p-3 rounded-2xl text-left border transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#253745] border-[#CCD0CF] shadow-md ring-1 ring-[#CCD0CF]/40'
                        : 'bg-[#06141B] border-[#253745] hover:border-[#4A5C6A]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black ${diff.tagClass}`}>
                        {diff.label}
                      </span>
                      <span className="text-[11px] font-black text-[#CCD0CF]">
                        +{diff.exp} EXP
                      </span>
                    </div>
                    <div className="text-[11px] text-[#9BA8AB] mt-1 flex items-center gap-1">
                      <span>Thưởng: +{diff.coins}</span>
                      <CoinIcon size="xs" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Focus Duration (Fae Focus) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#CCD0CF] flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-[#9BA8AB]" />
                <span>Thời Gian Tập Trung (Fae Focus)</span>
              </label>
              {focusDuration === null || focusDuration === 0 ? (
                <span className="text-[11px] font-bold text-[#9BA8AB] bg-[#06141B] px-2 py-0.5 rounded-md border border-[#253745]">
                  Tắt
                </span>
              ) : (
                <span className="text-[11px] font-bold text-[#06141B] bg-[#CCD0CF] px-2.5 py-0.5 rounded-md shadow-sm">
                  {focusDuration} phút
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFocusDuration(null)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  focusDuration === null || focusDuration === 0
                    ? 'bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] shadow-sm'
                    : 'bg-[#06141B] text-[#9BA8AB] hover:text-[#CCD0CF] border border-[#253745]'
                }`}
              >
                Không dùng
              </button>

              {[10, 15, 25, 45, 60].map((min) => {
                const isSelected = focusDuration === min;
                return (
                  <button
                    key={min}
                    type="button"
                    onClick={() => {
                      setFocusDuration(min);
                      setCustomFocus(String(min));
                    }}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#CCD0CF] text-[#06141B] shadow-sm font-extrabold'
                        : 'bg-[#06141B] text-[#9BA8AB] hover:text-[#CCD0CF] border border-[#253745]'
                    }`}
                  >
                    {min === 25 ? '25p (Chuẩn)' : `${min}p`}
                  </button>
                );
              })}

              <div
                className={`flex items-center gap-1.5 ml-auto pt-1 sm:pt-0 transition-opacity ${
                  focusDuration === null || focusDuration === 0
                    ? 'opacity-30 pointer-events-none'
                    : 'opacity-100'
                }`}
              >
                <span className="text-[11px] text-[#9BA8AB]">Tùy ý:</span>
                <input
                  type="number"
                  min="5"
                  max="180"
                  disabled={focusDuration === null || focusDuration === 0}
                  value={customFocus}
                  onChange={(e) => {
                    setCustomFocus(e.target.value);
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 5 && val <= 180) {
                      setFocusDuration(val);
                    }
                  }}
                  onBlur={() => {
                    const val = parseInt(customFocus, 10);
                    if (isNaN(val) || val < 5) {
                      setFocusDuration(5);
                      setCustomFocus('5');
                    } else if (val > 180) {
                      setFocusDuration(180);
                      setCustomFocus('180');
                    }
                  }}
                  className="w-14 px-2 py-1 rounded-xl bg-[#06141B] border border-[#253745] text-xs font-bold text-[#CCD0CF] text-center focus:outline-none focus:border-[#4A5C6A]"
                  placeholder="Phút"
                />
                <span className="text-[11px] text-[#9BA8AB]">phút</span>
              </div>
            </div>
          </div>

          {/* 5. Daily Recurring Toggle */}
          <div className="p-3 rounded-2xl bg-[#06141B] border border-[#253745]">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#CCD0CF] hover:text-white">
              <input
                type="checkbox"
                checked={isDailyRecurring}
                onChange={(e) => setIsDailyRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-[#4A5C6A] focus:ring-0 accent-[#4A5C6A] bg-[#06141B]"
              />
              <span className="flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-[#9BA8AB]" />
                <span className="font-semibold">Nhiệm vụ lặp lại hằng ngày (Tự làm mới mỗi sáng)</span>
              </span>
            </label>
          </div>

          {/* Primary CTA Submit Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#CCD0CF] hover:bg-white font-extrabold text-sm text-[#06141B] flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(204,208,207,0.25)] transition cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-[#06141B]" />
            <span>Ghi Vào Bảng Nhiệm Vụ</span>
          </motion.button>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
