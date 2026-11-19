import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { SeasonAnnouncement } from '../../types';
import { playSound } from '../../utils/soundEngine';
import {
  X,
  Megaphone,
  Pin,
  Calendar,
  Sparkles,
  ShieldCheck,
  Maximize2,
  ZoomIn,
} from 'lucide-react';

export const SeasonAnnouncementsModal: React.FC = () => {
  const {
    isSeasonAnnouncementsModalOpen,
    setSeasonAnnouncementsModalOpen,
    seasonAnnouncements,
    fetchSeasonAnnouncements,
    markAnnouncementsAsRead,
    soundEnabled,
  } = useFaeQuestStore();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isSeasonAnnouncementsModalOpen) {
      fetchSeasonAnnouncements();
      markAnnouncementsAsRead();
    }
  }, [isSeasonAnnouncementsModalOpen]);

  if (!isSeasonAnnouncementsModalOpen) return null;

  const handleClose = () => {
    playSound('ui_click', soundEnabled);
    setSeasonAnnouncementsModalOpen(false);
  };

  const formatAnnouncementDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ngày ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-[#11212D] border border-[#4A5C6A] rounded-3xl p-5 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.85)] my-auto max-h-[90vh] flex flex-col text-[#CCD0CF] overflow-hidden"
          >
            {/* Top Accent Strip */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-amber-400 to-cyan-500" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-[#253745] shrink-0">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>BẢNG TIN ĐẤU TRƯỜNG</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white font-rpg tracking-wide flex items-center gap-2">
                  <span>📢 Thông Báo Mùa Giải & Sự Kiện</span>
                </h2>
                <p className="text-xs text-[#9BA8AB]">
                  Cập nhật tin tức chính thức, sự kiện đua Top và điều lệ Mùa Giải từ Ban Quản Trị FaeQuest.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-xl text-[#9BA8AB] hover:text-white hover:bg-[#253745] transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Announcements List Container */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar">
              {seasonAnnouncements.length === 0 ? (
                <div className="py-16 text-center space-y-3 bg-[#06141B]/60 border border-[#253745] rounded-2xl p-6">
                  <div className="w-12 h-12 rounded-full bg-[#11212D] border border-[#253745] flex items-center justify-center text-[#4A5C6A] mx-auto">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#CCD0CF]">
                    Chưa có thông báo nào được đăng
                  </h3>
                  <p className="text-xs text-[#9BA8AB] max-w-sm mx-auto">
                    Ban Quản Trị sẽ sớm cập nhật thông tin về các Mùa Giải mới và sự kiện hấp dẫn tại đây.
                  </p>
                </div>
              ) : (
                seasonAnnouncements.map((a) => (
                  <div
                    key={a.id}
                    className={`relative rounded-2xl p-4 sm:p-5 transition-all ${
                      a.is_pinned
                        ? 'bg-gradient-to-br from-[#162938] via-[#11212D] to-[#0d1c26] border-2 border-amber-400/60 shadow-[0_4px_20px_rgba(245,158,11,0.1)]'
                        : 'bg-[#06141B]/90 border border-[#253745] hover:border-[#4A5C6A]'
                    }`}
                  >
                    {/* Header Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Pinned Badge */}
                        {a.is_pinned && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-[#06141B] text-[10px] font-black uppercase tracking-wider shadow">
                            <Pin className="w-3 h-3 fill-current" />
                            ĐÃ GHIM
                          </span>
                        )}

                        {/* Season Tag Badge */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#253745] text-cyan-300 border border-cyan-500/30 text-[11px] font-bold">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          {a.season_tag}
                        </span>

                        {/* Author Badge */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3 text-amber-400" />
                          {a.created_by || 'Quản Trị Viên'}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1 text-[11px] text-[#9BA8AB]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatAnnouncementDate(a.created_at)}</span>
                      </div>
                    </div>

                    {/* Announcement Title */}
                    <h3 className="text-base sm:text-lg font-black text-white font-rpg mb-2 leading-snug">
                      {a.title}
                    </h3>

                    {/* Announcement Content */}
                    <p className="text-xs sm:text-sm text-[#CCD0CF] leading-relaxed whitespace-pre-line mb-3">
                      {a.content}
                    </p>

                    {/* Attached Image (if any) */}
                    {a.image_url && (
                      <div className="mt-3 relative rounded-xl overflow-hidden border border-[#253745] bg-[#06141B] group">
                        <img
                          src={a.image_url}
                          alt={a.title}
                          className="w-full max-h-80 object-cover object-center cursor-pointer group-hover:scale-[1.02] transition-transform duration-300"
                          onClick={() => setSelectedImage(a.image_url!)}
                          loading="lazy"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedImage(a.image_url!)}
                          className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 text-white text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition cursor-pointer"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>Xem Ảnh Lớn</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-[#253745] flex items-center justify-between text-xs text-[#9BA8AB] shrink-0">
              <span>FaeQuest Season Announcement Engine</span>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Full-Screen Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/90 backdrop-blur-lg cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black border border-white/20 transition cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={selectedImage}
                alt="Enlarged announcement banner"
                className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
