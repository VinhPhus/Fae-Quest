import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { SYSTEM_TITLES, resolveTitleObject } from '../../constants/systemQuests';
import { DEFAULT_COVER_URL } from './ChangeCoverModal';
import { EASING_SPRING } from '../../constants/motion';
import {
  X,
  Trophy,
  Flame,
  Swords,
  Sparkles,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Equal,
} from 'lucide-react';

export const RivalProfileModal: React.FC = () => {
  const {
    isRivalModalOpen,
    selectedRivalForModal: rival,
    closeRivalModal,
    playerName,
    avatarUrl,
    coverUrl,
    exp: myExp,
    streakDays: myStreak,
    completedTotal: myTasks,
    equippedTitleId,
    communityProfiles,
  } = useFaeQuestStore();

  const [isComparing, setIsComparing] = useState(false);

  if (!isRivalModalOpen || !rival) return null;

  const rivalRankIdx = getRankIndexByExp(rival.exp);
  const rivalTier = RANK_TIERS[rivalRankIdx];

  const myRankIdx = getRankIndexByExp(myExp);
  const myTier = RANK_TIERS[myRankIdx];

  // Resolve matching title
  const matchingTitle =
    Object.values(SYSTEM_TITLES).find(
      (t) => t.name === rival.equippedTitle || t.id === rival.equippedTitle
    ) || resolveTitleObject(rival.equippedTitle);

  // Tìm profile mới nhất trong danh sách communityProfiles nếu có
  const liveProfile = (communityProfiles || []).find((p) => p.id === rival.id);

  // Kiểm tra đồng thời cả player.coverUrl || player.cover_url || liveProfile.cover_url
  const candidateCover = rival.isPlayer
    ? (coverUrl && coverUrl.trim() ? coverUrl : (liveProfile?.cover_url || rival.coverUrl || rival.cover_url))
    : (liveProfile?.cover_url || rival.coverUrl || rival.cover_url);

  const coverImage =
    candidateCover && typeof candidateCover === 'string' && candidateCover.trim() !== ''
      ? candidateCover.trim()
      : DEFAULT_COVER_URL;

  // Comparison deltas
  const expDiff = myExp - rival.exp;
  const streakDiff = myStreak - rival.streak;
  const tasksDiff = myTasks - rival.completedTasks;

  const renderAvatar = (name: string, url: string | null | undefined) => {
    const isUrl = url && (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:'));
    if (isUrl) {
      return (
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    const initial = name ? name.trim().charAt(0).toUpperCase() : '?';
    return (
      <div className="w-full h-full rounded-full bg-[#253745] flex items-center justify-center text-xl font-black text-[#CCD0CF]">
        {url && url.length <= 4 ? url : initial}
      </div>
    );
  };

  const renderDeltaPill = (diff: number, unit = '') => {
    if (diff > 0) {
      return (
        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          <span>+{diff.toLocaleString()} {unit} (Dẫn trước)</span>
        </span>
      );
    }
    if (diff < 0) {
      return (
        <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-400/30 flex items-center gap-1">
          <TrendingDown className="w-3 h-3" />
          <span>{diff.toLocaleString()} {unit} (Bám đuổi)</span>
        </span>
      );
    }
    return (
      <span className="text-[11px] font-bold text-[#CCD0CF] bg-[#253745] px-2 py-0.5 rounded-full border border-[#4A5C6A] flex items-center gap-1">
        <Equal className="w-3 h-3" />
        <span>Bằng nhau</span>
      </span>
    );
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
        onClick={closeRivalModal}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.28, ease: EASING_SPRING }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-[400px] w-full bg-[#11212D] border border-[#253745] rounded-[32px] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.85)] relative flex flex-col overflow-hidden max-h-[92vh] overflow-y-auto no-scrollbar"
        >
          {/* Phần 1 — Ảnh Bìa Lọt Lòng & Nút Đóng (Inset Cover Banner) */}
          <div className="h-36 w-full rounded-[22px] overflow-hidden relative bg-[#06141B] shrink-0 border border-[#253745]">
            <img
              src={coverImage}
              alt={`${rival.name} Cover`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                // Tự động fallback về ảnh mặc định nếu link ảnh bị hỏng
                (e.currentTarget as HTMLImageElement).src = DEFAULT_COVER_URL;
              }}
            />
            {/* Gradient Mask Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#11212D] via-transparent to-black/40" />

            {/* Top-Left: Thứ Hạng BXH hoặc Badge Quản Trị */}
            <div className="absolute top-3 left-3 z-10">
              {rival.isPlayer ? (
                <div className="px-2.5 py-1 rounded-full bg-[#06141B]/80 backdrop-blur-md border border-[#4A5C6A] text-xs font-black text-[#CCD0CF] flex items-center gap-1.5 shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>HỒ SƠ CỦA BẠN</span>
                </div>
              ) : rival.rankPos ? (
                <div className="px-2.5 py-1 rounded-full bg-[#06141B]/80 backdrop-blur-md border border-amber-400/50 text-xs font-black text-amber-300 flex items-center gap-1.5 shadow-md">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hạng #{rival.rankPos}</span>
                </div>
              ) : (
                <div className="px-2.5 py-1 rounded-full bg-[#06141B]/80 backdrop-blur-md border border-[#4A5C6A] text-xs font-bold text-[#CCD0CF] flex items-center gap-1.5 shadow-md">
                  <Swords className="w-3.5 h-3.5 text-[#CCD0CF]" />
                  <span>Thợ Săn Fae</span>
                </div>
              )}
            </div>

            {/* Top-Right: Nút Đóng Tròn Kính Mờ */}
            <button
              type="button"
              onClick={closeRivalModal}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-[#06141B]/70 hover:bg-[#06141B] backdrop-blur-md text-[#CCD0CF] hover:text-white border border-[#4A5C6A] flex items-center justify-center transition cursor-pointer shadow-md"
              title="Đóng thẻ hồ sơ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Phần 2 — Avatar Chồng Biên (Overlapping Avatar) */}
          <div className="flex items-end justify-between -mt-10 px-2 relative z-10">
            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#253745] via-[#4A5C6A] to-[#CCD0CF] ring-4 ring-[#11212D] shadow-xl relative group">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#06141B]">
                {renderAvatar(rival.name, (rival.isPlayer ? avatarUrl : rival.avatarUrl) || (rival as any).avatar)}
              </div>
              {/* Rank Icon Badge on Avatar */}
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#06141B] border border-[#4A5C6A] flex items-center justify-center shadow"
                title={`Bậc ${rivalTier.name}`}
              >
                <img
                  src={rivalTier.iconUrl}
                  alt={rivalTier.name}
                  className="w-4 h-4 object-contain"
                />
              </div>
            </div>

            {/* Badge Bậc Rank */}
            <div className="mb-1 flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#06141B] border border-[#4A5C6A] text-[#CCD0CF] shadow-inner flex items-center gap-1">
                <img src={rivalTier.iconUrl} alt={rivalTier.name} className="w-3.5 h-3.5 object-contain" />
                <span>{rivalTier.name}</span>
              </span>
            </div>
          </div>

          {/* Phần 3 — Tên Thợ Săn & Danh Hiệu (Identity & Equipped Title Row) */}
          <div className="flex items-start justify-between gap-3 mt-3 px-2">
            {/* Bên trái: Tên Thợ Săn & Định Danh Phụ */}
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-[#CCD0CF] font-rpg truncate tracking-wide leading-tight">
                {rival.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-[#9BA8AB]">
                <span>⚔️ Bậc {rivalTier.name}</span>
                {Boolean(rival.stars && rival.stars > 0) && (
                  <>
                    <span>•</span>
                    <span className="text-amber-300 font-bold">⭐ {rival.stars} Sao</span>
                  </>
                )}
              </div>
            </div>

            {/* Bên phải: Huy Hiệu Danh Hiệu Đang Trang Bị */}
            <div
              className="bg-[#253745]/80 border border-[#4A5C6A] rounded-full px-3 py-1.5 flex items-center gap-1.5 shrink-0 shadow-sm max-w-[170px]"
              title={`Danh hiệu: ${matchingTitle.name}`}
            >
              {matchingTitle.iconUrl ? (
                <img
                  src={matchingTitle.iconUrl}
                  alt={matchingTitle.name}
                  className="w-4 h-4 object-contain shrink-0 drop-shadow"
                />
              ) : (
                <span className="text-xs shrink-0">{matchingTitle.icon || '🏷️'}</span>
              )}
              <span className="text-xs font-semibold text-[#CCD0CF] truncate">
                {matchingTitle.name}
              </span>
            </div>
          </div>

          {/* Phần 4 — Hàng 3 Chỉ Số Cốt Lõi (3-Column Stats Divider) */}
          <div className="border-y border-[#253745]/80 my-4 py-3.5 px-2 grid grid-cols-3 text-center divide-x divide-[#253745]/60 bg-[#06141B]/40 rounded-2xl">
            {/* Cột 1: Chuỗi Kỷ Luật */}
            <div className="px-1 flex flex-col items-center">
              <div className="flex items-center gap-1 text-base sm:text-lg font-bold text-[#CCD0CF]">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                <span>{rival.streak}N</span>
              </div>
              <span className="text-[11px] text-[#9BA8AB] mt-0.5 font-medium">Chuỗi Kỷ Luật</span>
            </div>

            {/* Cột 2: Nhiệm Vụ Hoàn Thành */}
            <div className="px-1 flex flex-col items-center">
              <div className="flex items-center gap-1 text-base sm:text-lg font-bold text-[#CCD0CF]">
                <Swords className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{rival.completedTasks}</span>
              </div>
              <span className="text-[11px] text-[#9BA8AB] mt-0.5 font-medium">Task Đã Xong</span>
            </div>

            {/* Cột 3: Tổng Kinh Nghiệm */}
            <div className="px-1 flex flex-col items-center">
              <div className="flex items-center gap-1 text-base sm:text-lg font-bold text-[#CCD0CF]">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{rival.exp.toLocaleString()}</span>
              </div>
              <span className="text-[11px] text-[#9BA8AB] mt-0.5 font-medium">Tổng EXP</span>
            </div>
          </div>

          {/* Khung So Sánh Chỉ Số Mở Rộng Khi Kích Hoạt */}
          <AnimatePresence>
            {isComparing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: EASING_SPRING }}
                className="overflow-hidden mb-4"
              >
                <div className="rounded-2xl p-3.5 bg-[#06141B] border border-[#253745] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#253745] text-xs">
                    <span className="text-[#9BA8AB] font-bold">Chỉ số đối chiếu</span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#CCD0CF]">Bạn</span>
                      <span className="text-[#4A5C6A]">vs</span>
                      <span className="font-extrabold text-amber-300">{rival.name}</span>
                    </div>
                  </div>

                  {/* So sánh EXP */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9BA8AB] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Kinh Nghiệm:</span>
                      </span>
                      {renderDeltaPill(expDiff, 'EXP')}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#9BA8AB] font-mono px-1">
                      <span>Bạn: {myExp.toLocaleString()}</span>
                      <span>Đối thủ: {rival.exp.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* So sánh Chuỗi */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9BA8AB] flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>Chuỗi Ngày:</span>
                      </span>
                      {renderDeltaPill(streakDiff, 'ngày')}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#9BA8AB] font-mono px-1">
                      <span>Bạn: {myStreak} ngày</span>
                      <span>Đối thủ: {rival.streak} ngày</span>
                    </div>
                  </div>

                  {/* So sánh Tasks */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9BA8AB] flex items-center gap-1">
                        <Swords className="w-3 h-3 text-cyan-400" />
                        <span>Nhiệm Vụ Đã Xong:</span>
                      </span>
                      {renderDeltaPill(tasksDiff, 'task')}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#9BA8AB] font-mono px-1">
                      <span>Bạn: {myTasks} task</span>
                      <span>Đối thủ: {rival.completedTasks} task</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phần 5 — Nút Hành Động Pill Lớn Ở Đáy (Bottom Pill CTA) */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setIsComparing((prev) => !prev)}
            className="w-full rounded-full bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] p-2 flex items-center justify-between transition-all group cursor-pointer shadow-lg"
          >
            {/* Vòng tròn bạc bên trái */}
            <div className="w-9 h-9 rounded-full bg-[#CCD0CF] group-hover:bg-white text-[#06141B] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
              <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
            </div>

            {/* Chữ ở giữa */}
            <span className="text-xs font-extrabold text-[#CCD0CF] group-hover:text-white tracking-wide px-2">
              {isComparing ? 'Ẩn So Sánh Chỉ Số' : '⚔️ So Sánh Chỉ Số Với Bạn'}
            </span>

            {/* Mũi tên bên phải */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#9BA8AB] group-hover:text-[#CCD0CF]">
              {isComparing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
