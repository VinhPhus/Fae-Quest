import React, { useState } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { TaskCategory, TaskDifficulty } from '../../types';
import { CATEGORIES, DIFFICULTIES } from '../../constants/categories';
import { CoinIcon } from '../ui/CoinIcon';
import { PlusCircle, Sparkles, Repeat, Timer } from 'lucide-react';

export const AddQuestForm: React.FC = () => {
  const addTask = useFaeQuestStore((state) => state.addTask);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
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
    setIsMobileOpen(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rpg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-fae/30 shadow-xl"
    >
      {/* Mobile Toggle Button (< lg) */}
      <div
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-fae/20 border border-fae/40 flex items-center justify-center text-fae shrink-0">
            <PlusCircle className="w-4 h-4" />
          </div>
          <span className="font-rpg font-bold text-sm text-parchment">
            Khắc Lệnh Nhiệm Vụ Mới
          </span>
        </div>
        <button
          type="button"
          className="px-2.5 py-1 rounded-lg bg-thorn-dark/90 text-[11px] font-bold text-fae border border-fae/30 hover:border-fae transition"
        >
          {isMobileOpen ? 'Thu gọn ▲' : '➕ Mở form ▼'}
        </button>
      </div>

      {/* Desktop Header Banner (>= lg) */}
      <div className="hidden lg:flex items-center justify-between pb-3 border-b border-parchment/10">
        <h3 className="font-rpg font-bold text-lg text-parchment flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-fae" />
          <span>Khắc Lệnh Nhiệm Vụ</span>
        </h3>
        <span className="text-[11px] font-semibold text-parchment/60 uppercase tracking-wider">
          Mục tiêu mới
        </span>
      </div>

      {/* Collapsible Form Body on Mobile / Always visible on Desktop */}
      <div className={`${isMobileOpen ? 'block' : 'hidden'} lg:block space-y-4 pt-3 lg:pt-0`}>
        {/* Task Title Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-parchment/80 mb-2">
            Tên Nhiệm Vụ Cần Chinh Phục *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Đọc 20 trang sách, Giải bài tập thuật toán, Chạy bộ..."
            required
            className="w-full px-4 py-3 rounded-2xl bg-thorn-dark/90 border border-opal/40 text-sm text-parchment placeholder-parchment/40 focus:outline-none focus:border-fae focus:ring-1 focus:ring-fae transition shadow-inner"
          />
        </div>

        {/* Task Description Textarea */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-parchment/80">
              Mô Tả Chi Tiết / Ghi Chú (Tùy chọn)
            </label>
            <span className="text-[10px] text-parchment/50">
              {description.length}/220
            </span>
          </div>
          <textarea
            rows={2}
            maxLength={220}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="VD: Chuẩn bị tài liệu trước 15p, hoàn thành xong chương 3..."
            className="w-full px-4 py-2.5 rounded-2xl bg-thorn-dark/90 border border-opal/40 text-sm text-parchment placeholder-parchment/40 focus:outline-none focus:border-fae focus:ring-1 focus:ring-fae transition shadow-inner resize-none"
          />
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-parchment/80 mb-2">
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
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${isSelected
                    ? 'bg-opal border-opal-light text-parchment shadow-md'
                    : 'bg-thorn-dark/70 border-opal/20 text-parchment/70 hover:text-parchment hover:border-opal/40'
                    }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-parchment/80 mb-2">
            Độ Khó & Thưởng EXP / Xu
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
                  className={`p-3 rounded-xl text-left border transition ${isSelected
                    ? 'bg-gradient-to-r from-bargain to-thorn-light border-fae shadow-md ring-1 ring-fae/40'
                    : 'bg-thorn-dark/70 border-opal/20 hover:border-opal/40'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-extrabold ${diff.tagClass}`}>
                      {diff.label}
                    </span>
                    <span className="text-[11px] font-bold text-fae">
                      +{diff.exp} EXP
                    </span>
                  </div>
                  <div className="text-[11px] text-parchment/60 mt-0.5 flex items-center gap-1">
                    <span>Thưởng: +{diff.coins}</span>
                    <CoinIcon size="xs" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Focus Duration Selection (Fae Focus) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-parchment/80 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-fae" />
              <span>Thời Gian Tập Trung (Fae Focus)</span>
            </label>
            {focusDuration === null || focusDuration === 0 ? (
              <span className="text-xs font-bold text-parchment/50 bg-thorn-dark px-2.5 py-0.5 rounded-md border border-parchment/20">
                Tắt
              </span>
            ) : (
              <span className="text-xs font-bold text-fae bg-fae/10 px-2.5 py-0.5 rounded-md border border-fae/30">
                {focusDuration} phút
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Nút "Không dùng" */}
            <button
              type="button"
              onClick={() => setFocusDuration(null)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition border ${focusDuration === null || focusDuration === 0
                ? 'bg-fae text-thorn-dark border-fae shadow-sm'
                : 'bg-thorn-dark/70 text-parchment/70 hover:text-parchment border-opal/30 hover:border-opal/50'
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
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition border ${isSelected
                    ? 'bg-fae text-thorn-dark border-fae shadow-sm'
                    : 'bg-thorn-dark/70 text-parchment/70 hover:text-parchment border-opal/30 hover:border-opal/50'
                    }`}
                >
                  {min === 25 ? '25p (Chuẩn)' : `${min}p`}
                </button>
              );
            })}

            <div
              className={`flex items-center gap-1.5 ml-auto pt-1 sm:pt-0 transition-opacity ${focusDuration === null || focusDuration === 0
                ? 'opacity-30 pointer-events-none'
                : 'opacity-100'
                }`}
            >
              <span className="text-[11px] text-parchment/60">Tùy ý:</span>
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
                className="w-14 px-2 py-1 rounded-xl bg-thorn-dark border border-opal/40 text-xs font-bold text-fae text-center focus:outline-none focus:border-fae disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Phút"
              />
              <span className="text-[11px] text-parchment/60">phút</span>
            </div>
          </div>
        </div>

        {/* Daily Recurring Toggle (Phase 2 feature) */}
        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-parchment/80 hover:text-parchment">
            <input
              type="checkbox"
              checked={isDailyRecurring}
              onChange={(e) => setIsDailyRecurring(e.target.checked)}
              className="w-4 h-4 rounded text-fae focus:ring-0 accent-fae bg-thorn-dark"
            />
            <span className="flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-fae" />
              <span>Nhiệm vụ lặp lại hằng ngày (Tự làm mới mỗi sáng)</span>
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl rpg-btn-primary font-bold text-sm text-parchment flex items-center justify-center gap-2 shadow-xl"
        >
          <PlusCircle className="w-5 h-5 text-parchment" />
          <span>Ghi Vào Bảng Nhiệm Vụ</span>
        </button>
      </div>
    </form>
  );
};
