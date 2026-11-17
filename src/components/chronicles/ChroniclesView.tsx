import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { JournalEntry, JournalMood } from '../../types';
import { JournalDetailModal } from './JournalDetailModal';
import { WriteJournalModal } from './WriteJournalModal';
import { playSound } from '../../utils/soundEngine';
import {
  BookOpen,
  Plus,
  Calendar,
  Image as ImageIcon,
  Feather,
} from 'lucide-react';

const MOOD_STYLES: Record<JournalMood, { dot: string; label: string; text: string; bg: string }> = {
  'Tuyệt vời': {
    dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]',
    label: 'Tuyệt vời',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/15 border-emerald-500/30',
  },
  'Tốt': {
    dot: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]',
    label: 'Tốt',
    text: 'text-cyan-300',
    bg: 'bg-cyan-500/15 border-cyan-500/30',
  },
  'Bình thường': {
    dot: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.7)]',
    label: 'Bình thường',
    text: 'text-blue-300',
    bg: 'bg-blue-500/15 border-blue-500/30',
  },
  'Căng thẳng': {
    dot: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.7)]',
    label: 'Căng thẳng',
    text: 'text-purple-300',
    bg: 'bg-purple-500/15 border-purple-500/30',
  },
  'Tệ': {
    dot: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)]',
    label: 'Tệ',
    text: 'text-rose-300',
    bg: 'bg-rose-500/15 border-rose-500/30',
  },
};

const formatCardDate = (dateStr: string): string => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayOfWeek = dayNames[d.getDay()];
    return `${dayOfWeek}, ${day} Thg ${month}`;
  } catch {
    return dateStr;
  }
};

const stripHtmlToText = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

/**
 * Top Sticky Header for Hunter Chronicles
 */
export const ChroniclesHeader: React.FC = () => {
  const { setWriteJournalOpen, journals } = useFaeQuestStore();

  return (
    <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-[#11212D] border border-[#253745] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06141B] border border-[#4A5C6A] text-xs font-bold text-[#CCD0CF]">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cuốn sổ tay của Thợ Săn</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#253745] text-[11px] font-semibold text-[#CCD0CF]">
            {journals.length} Bài Ghi
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#CCD0CF] font-rpg tracking-wide">
          📓 Nhật Ký Thợ Săn
        </h2>
        <p className="text-xs text-[#9BA8AB] max-w-2xl leading-relaxed hidden sm:block">
          Ghi lại hành trình rèn luyện mỗi ngày của bạn. Đúc kết bài học kỷ luật và theo dõi biến chuyển tâm lý qua từng giai đoạn thăng hạng.
        </p>
      </div>

      <div className="flex items-center gap-2.5 w-full md:w-auto">
        <button
          onClick={() => {
            playSound('ui_click');
            setWriteJournalOpen(true, null);
          }}
          className="w-full md:w-auto px-5 py-2.5 rounded-2xl bg-[#CCD0CF] text-[#06141B] hover:bg-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(204,208,207,0.3)] hover:shadow-[0_4px_28px_rgba(204,208,207,0.45)] transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 text-[#06141B]" />
          <span>Viết Nhật Ký</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Main Chronicles View: Artful Magazine / Portfolio Masonry Grid Layout
 */
export const ChroniclesView: React.FC = () => {
  const { journals, setWriteJournalOpen } = useFaeQuestStore();
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);

  return (
    <div className="space-y-6">
      {/* 1. Masonry Grid List */}
      {journals.length === 0 ? (
        <div className="rounded-[32px] p-8 sm:p-12 bg-[#11212D]/80 border border-[#253745] text-center space-y-4 max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-[#06141B] border border-[#253745] flex items-center justify-center mx-auto text-[#CCD0CF] shadow-inner">
            <Feather className="w-8 h-8 text-cyan-400" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-[#CCD0CF] font-rpg">Chưa có trang nhật ký nào</h3>
            <p className="text-xs text-[#9BA8AB] leading-relaxed">
              Trang giấy da vẫn còn tinh khôi. Hãy ghi lại cảm xúc, thành quả và bài học rút ra từ các nhiệm vụ trong ngày hôm nay!
            </p>
          </div>
          <button
            onClick={() => {
              playSound('ui_click');
              setWriteJournalOpen(true, null);
            }}
            className="px-5 py-2.5 rounded-2xl bg-[#CCD0CF] text-[#06141B] hover:bg-white text-xs font-bold inline-flex items-center gap-2 shadow-[0_4px_16px_rgba(204,208,207,0.25)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Bắt Đầu Viết Nhật Ký</span>
          </button>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 xl:columns-3 gap-4 space-y-4">
          {journals.map((entry) => {
            const moodStyle = MOOD_STYLES[entry.mood] || MOOD_STYLES['Bình thường'];
            const plainText = stripHtmlToText(entry.content);
            const hasImages = Array.isArray(entry.images) && entry.images.length > 0;

            if (hasImages) {
              /* ================= 1. THẺ CÓ ẢNH (HERO IMAGE MAGAZINE LAYOUT) ================= */
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => {
                    playSound('ui_click');
                    setSelectedJournal(entry);
                  }}
                  className="break-inside-avoid mb-4 rounded-[24px] bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] hover:-translate-y-1 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_12px_32px_rgba(0,0,0,0.75)] group relative overflow-hidden flex flex-col"
                >
                  {/* Phần 1: Hero Image (Chiếm 40-50% chiều cao thẻ) */}
                  <div className="relative w-full h-44 sm:h-48 overflow-hidden rounded-t-[24px] bg-[#06141B]">
                    <img
                      src={entry.images[0]}
                      alt="Hero Journal"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    {/* Gradient chuyển mờ xuống phần thân thẻ */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#11212D] via-[#11212D]/40 to-transparent pointer-events-none" />

                    {/* Badge đếm số lượng ảnh nếu có nhiều hơn 1 ảnh */}
                    {entry.images.length > 1 && (
                      <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-[#06141B]/80 backdrop-blur-md text-[11px] font-extrabold text-[#CCD0CF] border border-white/10 flex items-center gap-1.5 shadow-lg">
                        <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>+{entry.images.length - 1} ảnh</span>
                      </div>
                    )}
                  </div>

                  {/* Phần 2: Nội dung văn bản (Chiếm 50-60% còn lại) */}
                  <div className="p-4 sm:p-5 bg-[#11212D] rounded-b-[24px] space-y-2.5">
                    {/* Hàng 1 (Ngày & Tâm Trạng) */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#CCD0CF]">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{formatCardDate(entry.date)}</span>
                      </div>

                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${moodStyle.bg} ${moodStyle.text}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${moodStyle.dot}`} />
                        <span>{moodStyle.label}</span>
                      </div>
                    </div>

                    {/* Hàng 2 (Trích đoạn) */}
                    <p className="text-xs sm:text-sm text-[#9BA8AB] group-hover:text-[#CCD0CF] transition-colors leading-relaxed line-clamp-3">
                      {plainText || '*(Ảnh đính kèm)*'}
                    </p>
                  </div>
                </motion.div>
              );
            }

            /* ================= 2. THẺ KHÔNG CÓ ẢNH (TEXT-ONLY CARD) ================= */
            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => {
                  playSound('ui_click');
                  setSelectedJournal(entry);
                }}
                className="break-inside-avoid mb-4 rounded-[24px] p-5 bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] hover:-translate-y-1 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_12px_32px_rgba(0,0,0,0.75)] group relative overflow-hidden flex flex-col justify-between"
              >
                {/* Hàng 1 (Ngày & Tâm Trạng) */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#253745]/60 relative z-10">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#CCD0CF]">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{formatCardDate(entry.date)}</span>
                  </div>

                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${moodStyle.bg} ${moodStyle.text}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${moodStyle.dot}`} />
                    <span>{moodStyle.label}</span>
                  </div>
                </div>

                {/* Nội dung trích dẫn dài hơn */}
                <div className="py-3.5 relative z-10">
                  <p className="text-xs sm:text-sm text-[#9BA8AB] group-hover:text-[#CCD0CF] transition-colors leading-relaxed line-clamp-5">
                    {plainText || '*(Không có nội dung)*'}
                  </p>
                </div>

                {/* Icon bút lông mờ nhạt ở góc phải dưới cùng để trang trí */}
                <div className="absolute -bottom-2 -right-2 text-[#253745]/30 group-hover:text-[#4A5C6A]/40 transition-colors pointer-events-none select-none">
                  <Feather className="w-16 h-16 transform -rotate-12" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal Xem Chi Tiết Nhật Ký */}
      <JournalDetailModal
        journal={selectedJournal}
        onClose={() => setSelectedJournal(null)}
        onEdit={(journalToEdit) => setWriteJournalOpen(true, journalToEdit)}
      />

      {/* Modal Viết / Chỉnh Sửa Nhật Ký */}
      <WriteJournalModal />
    </div>
  );
};
