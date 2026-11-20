import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { JournalEntry, JournalMood } from '../../types';
import { playSound } from '../../utils/soundEngine';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  X,
  Calendar,
  Trash2,
  Edit3,
} from 'lucide-react';

interface JournalDetailModalProps {
  journal: JournalEntry | null;
  onClose: () => void;
  onEdit: (journal: JournalEntry) => void;
}

const MOOD_MAP: Record<JournalMood, { emoji: string; label: string; badgeClass: string; dotClass: string }> = {
  'Tuyệt vời': {
    emoji: '🤩',
    label: 'Tuyệt vời',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    dotClass: 'bg-emerald-400',
  },
  'Tốt': {
    emoji: '😊',
    label: 'Tốt',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
    dotClass: 'bg-cyan-400',
  },
  'Bình thường': {
    emoji: '😐',
    label: 'Bình thường',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
    dotClass: 'bg-blue-400',
  },
  'Căng thẳng': {
    emoji: '😫',
    label: 'Căng thẳng',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
    dotClass: 'bg-purple-400',
  },
  'Tệ': {
    emoji: '😞',
    label: 'Tệ',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
    dotClass: 'bg-rose-400',
  },
};

const formatDetailDate = (dateStr: string) => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayOfWeek = dayNames[d.getDay()];
    return `${dayOfWeek}, ${day} Tháng ${month}, ${year}`;
  } catch {
    return dateStr;
  }
};

export const JournalDetailModal: React.FC<JournalDetailModalProps> = ({
  journal,
  onClose,
  onEdit,
}) => {
  const { deleteJournal } = useFaeQuestStore();
  const isOpen = Boolean(journal);

  useBodyScrollLock(isOpen);

  if (!isOpen || !journal || typeof document === 'undefined') return null;

  const moodConfig = MOOD_MAP[journal.mood] || MOOD_MAP['Bình thường'];

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài nhật ký này?')) {
      await deleteJournal(journal.id);
      onClose();
    }
  };

  return createPortal(
    <AnimatePresence>
      <div
        onClick={onClose}
        onTouchMove={(e) => {
          if (e.target === e.currentTarget) e.preventDefault();
        }}
        className="fixed inset-0 w-screen h-[100dvh] z-[100] bg-[#06141B]/80 backdrop-blur-md touch-none overscroll-none flex items-center justify-center p-3 sm:p-4"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="max-w-[650px] w-full max-h-[90dvh] overflow-y-auto overscroll-contain touch-pan-y bg-[#11212D] border border-[#253745] rounded-[32px] p-5 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.95)] relative space-y-5 no-scrollbar"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#253745]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${moodConfig.badgeClass}`}>
                  <span className={`w-2 h-2 rounded-full ${moodConfig.dotClass}`} />
                  <span>{moodConfig.emoji} {moodConfig.label}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#CCD0CF] font-semibold">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>{formatDetailDate(journal.date)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playSound('ui_click');
                  onEdit(journal);
                  onClose();
                }}
                className="p-2 rounded-full bg-[#06141B] border border-[#253745] text-[#9BA8AB] hover:text-[#CCD0CF] hover:border-[#4A5C6A] transition cursor-pointer"
                title="Chỉnh sửa nhật ký"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="p-2 rounded-full bg-[#06141B] border border-[#253745] text-rose-400 hover:text-rose-300 hover:border-rose-500/50 transition cursor-pointer"
                title="Xóa nhật ký"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound('ui_click');
                  onClose();
                }}
                className="p-2 rounded-full bg-[#06141B] border border-[#253745] text-[#9BA8AB] hover:text-white hover:border-[#4A5C6A] transition cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nội dung Rich Text */}
          <div
            className="text-sm text-[#CCD0CF] leading-relaxed max-h-[350px] overflow-y-auto overscroll-contain touch-pan-y pr-2 space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_p]:mb-2"
            dangerouslySetInnerHTML={{ __html: journal.content }}
          />

          {/* Danh sách ảnh đính kèm */}
          {journal.images && journal.images.length > 0 && (
            <div className="pt-3 border-t border-[#253745]/60 space-y-2">
              <div className="text-xs font-bold text-[#9BA8AB] uppercase tracking-wider">
                Ảnh đính kèm ({journal.images.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[250px] overflow-y-auto overscroll-contain touch-pan-y pr-1">
                {journal.images.map((imgUrl, idx) => (
                  <a
                    key={idx}
                    href={imgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl overflow-hidden border border-[#253745] aspect-video bg-[#06141B] block hover:border-[#4A5C6A] transition group"
                  >
                    <img
                      src={imgUrl}
                      alt={`Ảnh đính kèm ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                playSound('ui_click');
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-[#06141B] border border-[#253745] text-[#CCD0CF] hover:text-white hover:border-[#4A5C6A] text-xs font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
