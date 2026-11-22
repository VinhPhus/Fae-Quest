import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import {
  getAllUnifiedTitles,
  isTitleUnlocked,
  isTitleEquipped,
  resolveTitleObject,
} from '../../constants/systemQuests';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { CoinIcon } from '../ui/CoinIcon';
import { EASING_SPRING } from '../../constants/motion';
import {
  Scroll,
  Flame,
  CheckCircle2,
  Lock,
  Sparkles,
  Trophy,
  Award,
  Calendar,
  Gift,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const SystemQuestsHeader: React.FC = () => {
  const { systemAchievements, unlockedTitleIds, equippedTitleId, exp } = useFaeQuestStore();
  const currentRankIdx = getRankIndexByExp(exp);
  const currentTier = RANK_TIERS[currentRankIdx];
  const allTitles = getAllUnifiedTitles(systemAchievements);
  const unlockedCount = allTitles.filter((t) => isTitleUnlocked(t.id, unlockedTitleIds)).length;
  const equippedTitle = resolveTitleObject(equippedTitleId);

  return (
    <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-[#11212D] border border-[#253745] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
      <div className="space-y-1 z-10 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#06141B] border border-[#253745] text-xs font-bold text-[#CCD0CF]">
            <Scroll className="w-3.5 h-3.5 text-cyan-400" />
            <span>Đại Sảnh Vinh Dự FaeQuest</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#253745] border border-[#4A5C6A] text-[11px] font-extrabold text-[#CCD0CF]">
            <img src={currentTier.iconUrl} alt={currentTier.name} className="w-3.5 h-3.5 object-contain [image-rendering:pixelated]" />
            <span>{currentTier.name.toUpperCase()}</span>
          </span>
          <span className="text-[11px] text-[#9BA8AB] font-mono">
            {exp} EXP
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#CCD0CF] font-rpg tracking-wide">
          Thành Tựu & Kho Danh Hiệu
        </h2>
        <p className="text-xs text-[#9BA8AB] max-w-2xl leading-relaxed hidden sm:block">
          Thử thách giới hạn bản thân với các chuỗi bộ đếm kỷ luật và hoàn thành các cột mốc danh giá để thu thập những danh hiệu uy dũng nhất.
        </p>
      </div>

      {/* Current Equipped Title Highlight Card */}
      <div className="shrink-0 z-10 w-full md:w-auto bg-[#06141B] px-3.5 py-2.5 rounded-2xl border border-[#253745] shadow-inner flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#11212D] border border-[#4A5C6A] flex items-center justify-center p-1 shadow-inner shrink-0 relative overflow-hidden group">
          <img
            src={equippedTitle.iconUrl}
            alt={equippedTitle.name}
            className="w-full h-full object-contain [image-rendering:pixelated] drop-shadow-[0_0_14px_rgba(204,208,207,0.5)] animate-pulse"
          />
        </div>
        <div>
          <span className="text-[9px] text-[#9BA8AB] uppercase tracking-widest block font-semibold">
            Danh Hiệu Đang Trang Bị
          </span>
          <span className={`text-sm font-extrabold ${equippedTitle.color} flex items-center gap-1.5`}>
            <span>{equippedTitle.name}</span>
          </span>
          <span className="text-[10px] text-[#9BA8AB]">
            Đã mở: <strong className="text-cyan-400 font-bold">{unlockedCount}</strong>/{allTitles.length} danh hiệu
          </span>
        </div>
      </div>
    </div>
  );
};

export const SystemQuestsView: React.FC = () => {
  const {
    systemQuests,
    systemAchievements,
    unlockedTitleIds,
    equippedTitleId,
    completedTotal,
    focusSessionsCompleted,
    exp,
    checkInStreakQuest,
    claimSystemQuestReward,
    equipTitle,
  } = useFaeQuestStore();

  const titleCarouselRef = useRef<HTMLDivElement | null>(null);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'streak' | 'milestone'>('all');

  const getClientTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [todayStr, setTodayStr] = useState<string>(getClientTodayStr);

  useEffect(() => {
    const updateToday = () => {
      setTodayStr(getClientTodayStr());
    };
    updateToday();
    const interval = setInterval(updateToday, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentRankIdx = getRankIndexByExp(exp);
  const currentTier = RANK_TIERS[currentRankIdx];

  const allTitles = getAllUnifiedTitles(systemAchievements);
  const unlockedCount = allTitles.filter((t) => isTitleUnlocked(t.id, unlockedTitleIds)).length;
  const equippedTitle = resolveTitleObject(equippedTitleId);

  const scrollTitleCarousel = (direction: 'left' | 'right') => {
    if (titleCarouselRef.current) {
      const scrollAmount = titleCarouselRef.current.clientWidth * 0.75;
      titleCarouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const streakQuests = systemQuests.filter((q) => q.type === 'streak_counter');
  const milestoneQuests = systemQuests.filter((q) => q.type === 'milestone');

  const displayedQuests =
    activeTabFilter === 'streak'
      ? streakQuests
      : activeTabFilter === 'milestone'
        ? milestoneQuests
        : systemQuests;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 2. Kho Danh Hiệu (Horizontal Carousel Slider) */}
      <div className="bg-[#11212D] rounded-3xl p-5 sm:p-6 space-y-4 border border-[#253745] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#253745]">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-rpg font-bold text-lg sm:text-xl text-white tracking-wide">
                Bộ Sưu Tập Danh Hiệu Cá Nhân
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#06141B] border border-[#253745] text-cyan-400">
                Đã mở khóa: {unlockedCount} / {allTitles.length}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs text-[#9BA8AB] hidden lg:inline">
              Chọn 1 danh hiệu yêu thích để hiển thị trên Hồ sơ và Bảng Xếp Hạng
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => scrollTitleCarousel('left')}
                className="w-8 h-8 rounded-full bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] hover:text-white flex items-center justify-center transition active:scale-95 shadow cursor-pointer"
                title="Cuộn sang trái"
                aria-label="Cuộn sang trái"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollTitleCarousel('right')}
                className="w-8 h-8 rounded-full bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] hover:text-white flex items-center justify-center transition active:scale-95 shadow cursor-pointer"
                title="Cuộn sang phải"
                aria-label="Cuộn sang phải"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Track: 4 cards on desktop, 2 on tablet, 1 on mobile */}
        <div
          ref={titleCarouselRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {allTitles.map((title) => {
            const isUnlocked = isTitleUnlocked(title.id, unlockedTitleIds);
            const isEquipped = isTitleEquipped(title.id, equippedTitleId);

            return (
              <div
                key={title.id}
                className={`w-full sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)] shrink-0 snap-start rounded-2xl p-4 border transition-all duration-300 flex flex-col justify-between gap-3 relative group ${
                  isEquipped
                    ? 'bg-gradient-to-b from-[#253745] via-[#11212D] to-[#06141B] border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_24px_rgba(34,211,238,0.2)]'
                    : isUnlocked
                      ? 'bg-[#06141B] hover:bg-[#253745]/50 border-[#253745] hover:border-[#4A5C6A] shadow-md'
                      : 'bg-[#06141B]/80 hover:bg-[#11212D]/60 border-[#253745]/80 shadow-inner'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0 rounded-xl bg-[#11212D]/60 p-1.5 border border-[#253745]/60 overflow-hidden">
                      <img
                        src={title.iconUrl}
                        alt={title.name}
                        className={`w-full h-full object-contain [image-rendering:pixelated] transition-all duration-300 drop-shadow-md ${
                          isUnlocked
                            ? 'group-hover:scale-110 group-hover:drop-shadow-[0_0_14px_rgba(204,208,207,0.6)]'
                            : 'grayscale opacity-65 contrast-90 group-hover:opacity-90 group-hover:grayscale-0'
                        }`}
                        loading="lazy"
                      />
                      {!isUnlocked && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#06141B]/90 border border-[#4A5C6A] flex items-center justify-center shadow-md">
                          <Lock className="w-2.5 h-2.5 text-[#CCD0CF]" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${
                          title.rarity === 'LEGENDARY'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                            : title.rarity === 'EPIC'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-400/50'
                              : title.rarity === 'RARE'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                                : 'bg-[#253745] text-[#CCD0CF] border-[#4A5C6A]'
                        }`}
                      >
                        {title.rarity}
                      </span>
                      {title.isCustom && (
                        <span className="text-[8px] font-bold text-amber-300/80 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                          ✨ Admin
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className={`text-sm font-extrabold ${title.color || 'text-white'}`}>
                      {title.name}
                    </h4>
                    <p className="text-[11px] text-[#9BA8AB] mt-1 leading-relaxed line-clamp-2 min-h-[32px]">
                      {title.description}
                    </p>
                  </div>

                  <p className="text-[10px] text-[#9BA8AB]/70 italic border-t border-[#253745] pt-1.5 line-clamp-1" title={title.sourceText}>
                    {title.sourceText}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-1">
                  {isEquipped ? (
                    <motion.span
                      layout
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      className="w-full py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-xs font-bold text-cyan-300 flex items-center justify-center gap-1.5 shadow"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đang Trang Bị</span>
                    </motion.span>
                  ) : isUnlocked ? (
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      whileHover={{ scale: 1.02 }}
                      type="button"
                      onClick={() => equipTitle(title.id)}
                      className="w-full py-1.5 rounded-xl bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs transition-colors shadow cursor-pointer"
                    >
                      Trang Bị Ngay
                    </motion.button>
                  ) : (
                    <span className="w-full py-1.5 rounded-xl bg-[#06141B] border border-[#253745] text-xs font-semibold text-[#9BA8AB]/50 flex items-center justify-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Chưa Mở Khóa</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Filter tabs for System Quests */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#06141B] border border-[#253745] relative">
          {(
            [
              { id: 'all', label: `Tất Cả Thử Thách (${systemQuests.length})` },
              { id: 'streak', label: `Bộ Đếm Ngày (${streakQuests.length})` },
              { id: 'milestone', label: `Cột Mốc Thành Tựu (${milestoneQuests.length})` },
            ] as const
          ).map((tab) => {
            const isSelected = activeTabFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors relative z-10 cursor-pointer ${
                  isSelected
                    ? 'text-[#CCD0CF]'
                    : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="systemQuestFilterPill"
                    className="absolute inset-0 rounded-xl bg-[#253745] border border-[#4A5C6A] shadow-md z-[-1]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Danh Sách Thử Thách & Thành Tựu */}
      <div className="space-y-4">
        {displayedQuests.map((quest) => {
          if (quest.type === 'streak_counter') {
            // STREAK COUNTER CARD
            const targetDays = quest.targetDays || 30;
            const currentStreak = quest.currentStreak || 0;
            const pct = Math.min(100, Math.round((currentStreak / targetDays) * 100));
            const isCheckedInToday = quest.lastCheckInDate === todayStr;
            const canClaim = quest.isCompleted && !quest.isRewardClaimed;

            return (
              <div
                key={quest.id}
                className={`rpg-card rounded-3xl p-5 sm:p-6 border transition-all duration-300 space-y-4 ${canClaim
                  ? 'border-amber-400/80 shadow-amber-500/20 shadow-xl bg-gradient-to-r from-bargain-dark via-thorn-dark to-thorn'
                  : quest.isRewardClaimed
                    ? 'border-emerald-500/30 opacity-80'
                    : 'border-opal/40 hover:border-fae/50'
                  }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>Thử Thách Chuỗi Ngày</span>
                      </span>
                      {quest.isRewardClaimed && (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                          ✓ Đã Hoàn Thành
                        </span>
                      )}
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-parchment">
                      {quest.title}
                    </h4>
                    <p className="text-xs text-parchment/70 leading-relaxed max-w-2xl">
                      {quest.description}
                    </p>
                  </div>

                  {/* Reward Badge */}
                  <div className="shrink-0 flex items-center gap-2 bg-thorn-dark/90 px-3.5 py-2 rounded-xl border border-fae/30 text-xs">
                    <span className="font-extrabold text-fae">+{quest.expReward} EXP</span>
                    <span>•</span>
                    <span className="font-bold text-fae flex items-center gap-1">
                      <span>+{quest.coinReward}</span>
                      <CoinIcon size="xs" />
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-amber-300">
                      🏷️ {quest.rewardTitleName}
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Day Tracker */}
                <div className="space-y-2 bg-thorn-dark/70 p-4 rounded-2xl border border-opal/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-parchment/80 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-fae" />
                      <span>Tiến Độ Kỷ Luật:</span>
                      <strong className="text-fae font-bold text-sm">
                        Ngày {currentStreak} / {targetDays}
                      </strong>
                    </span>
                    <span className="font-bold text-amber-300">{pct}%</span>
                  </div>

                  <div className="w-full bg-thorn h-3 rounded-full overflow-hidden border border-opal/30 p-0.5">
                    <div
                      className="bg-gradient-to-r from-fae to-bargain h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Visual Day Dots / Grid (up to 30) */}
                  <div className="pt-2 flex flex-wrap items-center gap-1.5">
                    {Array.from({ length: targetDays }).map((_, i) => {
                      const dayNumber = i + 1;
                      const isPast = dayNumber <= currentStreak;
                      const isCurrent = dayNumber === currentStreak;

                      return (
                        <div
                          key={dayNumber}
                          className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center transition border ${isCurrent
                            ? 'bg-fae text-thorn-dark border-fae scale-110 shadow'
                            : isPast
                              ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/40'
                              : 'bg-thorn-dark/60 text-parchment/40 border-parchment/10'
                            }`}
                          title={`Ngày ${dayNumber}`}
                        >
                          {dayNumber}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 w-full">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    {/* Check-In Button */}
                    {!quest.isCompleted && (
                      <motion.button
                        whileTap={!isCheckedInToday ? { scale: 0.94 } : undefined}
                        onClick={() => checkInStreakQuest(quest.id)}
                        disabled={isCheckedInToday}
                        className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${isCheckedInToday
                            ? 'bg-thorn-dark text-parchment/40 border border-parchment/15 cursor-not-allowed'
                            : 'rpg-btn-primary text-parchment shadow-lg hover:scale-105'
                          }`}
                      >
                        {isCheckedInToday ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>✓ Đã Điểm Danh Hôm Nay (Quay lại ngày mai)</span>
                          </>
                        ) : (
                          <>
                            <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
                            <span>
                              {currentStreak === 0
                                ? '🔥 Bắt Đầu Điểm Danh (Ngày 1)'
                                : '🔥 Điểm Danh Hôm Nay (+1 Ngày)'}
                            </span>
                          </>
                        )}
                      </motion.button>
                    )}

                    {/* Claim Button */}
                    {canClaim && (
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => claimSystemQuestReward(quest.id)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-parchment font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl animate-bounce cursor-pointer"
                      >
                        <Gift className="w-4 h-4 text-amber-200" />
                        <span>🎁 Nhận Danh Hiệu & Phần Thưởng</span>
                      </motion.button>
                    )}

                    {quest.isRewardClaimed && (
                      <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã Nhận Thưởng</span>
                      </span>
                    )}
                  </div>

                  {/* Auto-reset Rule Note */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#9BA8AB] italic bg-[#06141B]/60 px-3 py-1.5 rounded-xl border border-white/5">
                    <span className="text-amber-400 font-bold">⚡</span>
                    <span>Hôm nào không bấm điểm danh, ngày mai sẽ tự động tính lại từ đầu.</span>
                  </div>
                </div>
              </div>
            );
          } else {
            // MILESTONE CARD
            let currentVal = 0;
            let targetVal = quest.targetMilestone || 1;
            let metricName = '';

            if (quest.milestoneKey === 'completedTasks') {
              currentVal = completedTotal;
              metricName = 'nhiệm vụ';
            } else if (quest.milestoneKey === 'focusSessions') {
              currentVal = focusSessionsCompleted;
              metricName = 'phiên tập trung';
            } else if (quest.milestoneKey === 'rankIdx') {
              currentVal = currentRankIdx;
              metricName = `Rank: ${currentTier.name}`;
            } else {
              currentVal = exp;
              metricName = 'EXP';
            }

            const isDone = quest.isCompleted;
            const pct =
              quest.milestoneKey === 'rankIdx'
                ? Math.min(100, Math.round((currentRankIdx / targetVal) * 100))
                : Math.min(100, Math.round((currentVal / targetVal) * 100));

            const canClaim = isDone && !quest.isRewardClaimed;

            return (
              <div
                key={quest.id}
                className={`rpg-card rounded-3xl p-5 sm:p-6 border transition-all duration-300 space-y-4 ${canClaim
                  ? 'border-fae shadow-fae/20 shadow-xl bg-gradient-to-r from-bargain-dark via-thorn-dark to-thorn'
                  : quest.isRewardClaimed
                    ? 'border-emerald-500/30 opacity-80'
                    : 'border-opal/40 hover:border-fae/50'
                  }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-400/40 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-purple-300" />
                        <span>Cột Mốc Thành Tựu</span>
                      </span>
                      {quest.isRewardClaimed && (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                          ✓ Đã Đạt
                        </span>
                      )}
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-parchment">
                      {quest.title}
                    </h4>
                    <p className="text-xs text-parchment/70 leading-relaxed max-w-2xl">
                      {quest.description}
                    </p>
                  </div>

                  {/* Reward Badge */}
                  <div className="shrink-0 flex items-center gap-2 bg-thorn-dark/90 px-3.5 py-2 rounded-xl border border-fae/30 text-xs">
                    {quest.expReward > 0 && (
                      <>
                        <span className="font-extrabold text-fae">+{quest.expReward} EXP</span>
                        <span>•</span>
                      </>
                    )}
                    <span className="font-bold text-fae flex items-center gap-1">
                      <span>+{quest.coinReward}</span>
                      <CoinIcon size="xs" />
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-purple-300">
                      🏷️ {quest.rewardTitleName}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2 bg-thorn-dark/70 p-4 rounded-2xl border border-opal/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-parchment/80">
                      Tiến Độ: {currentVal} / {targetVal} {metricName}
                    </span>
                    <span className="font-bold text-fae">{pct}%</span>
                  </div>

                  <div className="w-full bg-thorn h-3 rounded-full overflow-hidden border border-opal/30 p-0.5">
                    <div
                      className="bg-gradient-to-r from-opal to-fae h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Claim Button */}
                <div className="pt-1 flex items-center justify-between">
                  <div>
                    {canClaim ? (
                      <button
                        onClick={() => claimSystemQuestReward(quest.id)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fae to-bargain hover:from-fae-light hover:to-bargain-light text-parchment font-extrabold text-xs flex items-center gap-2 shadow-xl animate-pulse"
                      >
                        <Gift className="w-4 h-4 text-parchment" />
                        <span>🎁 Nhận Thưởng & Mở Khóa Danh Hiệu</span>
                      </button>
                    ) : quest.isRewardClaimed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã Nhận Thưởng</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-parchment/50">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Chưa đủ điều kiện hoàn thành</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};
