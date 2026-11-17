import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, Check, Sparkles } from 'lucide-react';
import { playSound } from '../../utils/soundEngine';

interface WheelDatePickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
}

const ITEM_HEIGHT = 36; // px (h-9)
const CONTAINER_HEIGHT = 144; // px (h-36)
const PADDING_TOP_BOTTOM = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2; // 54px

export const WheelDatePicker: React.FC<WheelDatePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial values
  const [yearStr, monthStr, dayStr] = (value || '').split('-');
  const now = new Date();
  const currentYear = parseInt(yearStr, 10) || now.getFullYear();
  const currentMonth = parseInt(monthStr, 10) || now.getMonth() + 1;
  const currentDay = parseInt(dayStr, 10) || now.getDate();

  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Sync state when external value changes
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      if (y && m && d) {
        setSelectedYear(y);
        setSelectedMonth(m);
        setSelectedDay(d);
      }
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Tính số ngày tối đa của tháng và năm đang chọn
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [2024, 2025, 2026, 2027, 2028];

  // Refs for scrolling
  const dayColRef = useRef<HTMLDivElement>(null);
  const monthColRef = useRef<HTMLDivElement>(null);
  const yearColRef = useRef<HTMLDivElement>(null);

  // Scroll to active position when opening
  useEffect(() => {
    if (isOpen) {
      const scrollCol = (ref: React.RefObject<HTMLDivElement | null>, index: number) => {
        if (ref.current) {
          ref.current.scrollTop = index * ITEM_HEIGHT;
        }
      };
      const dayIdx = days.indexOf(selectedDay);
      const monthIdx = months.indexOf(selectedMonth);
      const yearIdx = years.indexOf(selectedYear);

      setTimeout(() => {
        scrollCol(dayColRef, dayIdx >= 0 ? dayIdx : 0);
        scrollCol(monthColRef, monthIdx >= 0 ? monthIdx : 0);
        scrollCol(yearColRef, yearIdx >= 0 ? yearIdx : 0);
      }, 50);
    }
  }, [isOpen]);

  const commitDate = (d: number, m: number, y: number) => {
    const maxDays = new Date(y, m, 0).getDate();
    const safeDay = Math.min(d, maxDays);
    const dateFormatted = `${y}-${String(m).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
    onChange(dateFormatted);
  };

  const handleSelectDay = (d: number) => {
    setSelectedDay(d);
    commitDate(d, selectedMonth, selectedYear);
  };

  const handleSelectMonth = (m: number) => {
    setSelectedMonth(m);
    commitDate(selectedDay, m, selectedYear);
  };

  const handleSelectYear = (y: number) => {
    setSelectedYear(y);
    commitDate(selectedDay, selectedMonth, y);
  };

  const handleSetToday = () => {
    playSound('ui_click');
    const today = new Date();
    const d = today.getDate();
    const m = today.getMonth() + 1;
    const y = today.getFullYear();
    setSelectedDay(d);
    setSelectedMonth(m);
    setSelectedYear(y);
    commitDate(d, m, y);
    setIsOpen(false);
  };

  // Format label
  const formattedDisplay = `${String(selectedDay).padStart(2, '0')} Tháng ${String(selectedMonth).padStart(2, '0')}, ${selectedYear}`;

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          playSound('ui_click');
          setIsOpen(!isOpen);
        }}
        className={`px-3.5 py-2 rounded-xl bg-[#11212D] border transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
          isOpen ? 'border-cyan-400 text-white' : 'border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF]'
        }`}
      >
        <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
        <span className="text-xs sm:text-sm font-bold tracking-wide">{formattedDisplay}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#9BA8AB] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-cyan-400' : ''
          }`}
        />
      </button>

      {/* iOS Wheel/Drum Picker Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute top-full left-0 mt-2 z-50 w-72 sm:w-80 bg-[#06141B] border border-[#253745] rounded-2xl p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.9)]"
          >
            {/* Header: Action quick buttons */}
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#253745]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BA8AB] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Chọn Ngày Ghi</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSetToday}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#11212D] text-cyan-400 hover:bg-[#253745] border border-[#253745] transition-all cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Hôm nay</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playSound('ui_click');
                    setIsOpen(false);
                  }}
                  className="px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold bg-[#CCD0CF] text-[#06141B] hover:bg-white transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <Check className="w-3 h-3 text-[#06141B]" />
                  <span>Xong</span>
                </button>
              </div>
            </div>

            {/* iOS Drum Wheel Container */}
            <div className="relative h-36 bg-[#11212D]/60 rounded-xl border border-[#253745] overflow-hidden flex items-center">
              {/* Highlight bar in the center */}
              <div
                className="absolute inset-x-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-[#253745]/70 border-y border-[#4A5C6A] pointer-events-none"
                style={{ height: `${ITEM_HEIGHT}px` }}
              />

              {/* CỘT 1: NGÀY */}
              <div
                ref={dayColRef}
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const idx = Math.round(target.scrollTop / ITEM_HEIGHT);
                  if (days[idx] && days[idx] !== selectedDay) {
                    handleSelectDay(days[idx]);
                  }
                }}
                className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar text-center relative z-10"
              >
                <div style={{ height: `${PADDING_TOP_BOTTOM}px` }} />
                {days.map((d) => {
                  const isSelected = d === selectedDay;
                  return (
                    <div
                      key={d}
                      onClick={() => {
                        handleSelectDay(d);
                        if (dayColRef.current) {
                          dayColRef.current.scrollTop = (d - 1) * ITEM_HEIGHT;
                        }
                      }}
                      style={{ height: `${ITEM_HEIGHT}px` }}
                      className={`flex items-center justify-center snap-center cursor-pointer select-none transition-all duration-150 ${
                        isSelected
                          ? 'text-white font-extrabold text-sm scale-110 opacity-100 drop-shadow'
                          : 'text-[#9BA8AB] font-medium text-xs opacity-40 hover:opacity-80'
                      }`}
                    >
                      Ngày {String(d).padStart(2, '0')}
                    </div>
                  );
                })}
                <div style={{ height: `${PADDING_TOP_BOTTOM}px` }} />
              </div>

              {/* Dải phân cách dọc */}
              <div className="w-[1px] h-20 bg-[#253745]" />

              {/* CỘT 2: THÁNG */}
              <div
                ref={monthColRef}
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const idx = Math.round(target.scrollTop / ITEM_HEIGHT);
                  if (months[idx] && months[idx] !== selectedMonth) {
                    handleSelectMonth(months[idx]);
                  }
                }}
                className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar text-center relative z-10"
              >
                <div style={{ height: `${PADDING_TOP_BOTTOM}px` }} />
                {months.map((m) => {
                  const isSelected = m === selectedMonth;
                  return (
                    <div
                      key={m}
                      onClick={() => {
                        handleSelectMonth(m);
                        if (monthColRef.current) {
                          monthColRef.current.scrollTop = (m - 1) * ITEM_HEIGHT;
                        }
                      }}
                      style={{ height: `${ITEM_HEIGHT}px` }}
                      className={`flex items-center justify-center snap-center cursor-pointer select-none transition-all duration-150 ${
                        isSelected
                          ? 'text-white font-extrabold text-sm scale-110 opacity-100 drop-shadow'
                          : 'text-[#9BA8AB] font-medium text-xs opacity-40 hover:opacity-80'
                      }`}
                    >
                      Thg {String(m).padStart(2, '0')}
                    </div>
                  );
                })}
                <div style={{ height: `${PADDING_TOP_BOTTOM}px` }} />
              </div>

              {/* Dải phân cách dọc */}
              <div className="w-[1px] h-20 bg-[#253745]" />

              {/* CỘT 3: NĂM */}
              <div
                ref={yearColRef}
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const idx = Math.round(target.scrollTop / ITEM_HEIGHT);
                  if (years[idx] && years[idx] !== selectedYear) {
                    handleSelectYear(years[idx]);
                  }
                }}
                className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar text-center relative z-10"
              >
                <div style={{ height: `${PADDING_TOP_BOTTOM}px` }} />
                {years.map((y, idx) => {
                  const isSelected = y === selectedYear;
                  return (
                    <div
                      key={y}
                      onClick={() => {
                        handleSelectYear(y);
                        if (yearColRef.current) {
                          yearColRef.current.scrollTop = idx * ITEM_HEIGHT;
                        }
                      }}
                      style={{ height: `${ITEM_HEIGHT}px` }}
                      className={`flex items-center justify-center snap-center cursor-pointer select-none transition-all duration-150 ${
                        isSelected
                          ? 'text-white font-extrabold text-sm scale-110 opacity-100 drop-shadow'
                          : 'text-[#9BA8AB] font-medium text-xs opacity-40 hover:opacity-80'
                      }`}
                    >
                      {y}
                    </div>
                  );
                })}
                <div style={{ height: `${PADDING_TOP_BOTTOM}px` }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
