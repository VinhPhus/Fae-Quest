import React, { useState, useEffect } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { SYSTEM_TITLES } from '../../constants/systemQuests';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { CoinIcon } from '../ui/CoinIcon';
import {
  Scroll,
  Flame,
  RotateCcw,
  CheckCircle2,
  Lock,
  Sparkles,
  Trophy,
  Award,
  Calendar,
  AlertTriangle,
  Gift,
} from 'lucide-react';

export const SystemQuestsView: React.FC = () => {
  const {
    systemQuests,
    unlockedTitleIds,
    equippedTitleId,
    completedTotal,
    focusSessionsCompleted,
    exp,
    checkInStreakQuest,
    resetStreakQuest,
    claimSystemQuestReward,
    equipTitle,
  } = useFaeQuestStore();

  const [confirmResetQuestId, setConfirmResetQuestId] = useState<string | null>(null);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'streak' | 'milestone'>('all');

  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Countdown to 00:00 midnight (lock reset period)
  const [countdownString, setCountdownString] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diffMs = Math.max(0, midnight.getTime() - now.getTime());
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setCountdownString(`${String(hours).padStart(2, '0')}g ${String(minutes).padStart(2, '0')}p`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 10000);
    return () => clearInterval(interval);
  }, []);
  const currentRankIdx = getRankIndexByExp(exp);
  const currentTier = RANK_TIERS[currentRankIdx];

  const equippedTitle = SYSTEM_TITLES[equippedTitleId] || SYSTEM_TITLES.title_tan_binh_gai_do;
  const distinctTitles = Object.values(SYSTEM_TITLES).filter(
    (t, i, arr) => arr.findIndex((x) => x.id === t.id) === i
  );

  const streakQuests = systemQuests.filter((q) => q.type === 'streak_counter');
  const milestoneQuests = systemQuests.filter((q) => q.type === 'milestone');

  const displayedQuests =
    activeTabFilter === 'streak'
      ? streakQuests
      : activeTabFilter === 'milestone'
      ? milestoneQuests
      : systemQuests;

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="rpg-card-opal rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden shadow-2xl border border-fae/40">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fae/20 border border-fae/40 text-xs font-bold text-fae-light">
            <Scroll className="w-3.5 h-3.5 text-fae" />
            <span>Đại Sảnh Vinh Dự FaeQuest</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-parchment font-rpg tracking-wide">
            Thành Tựu & Kho Danh Hiệu
          </h2>
          <p className="text-xs sm:text-sm text-parchment/75 max-w-2xl leading-relaxed">
            Thử thách giới hạn bản thân với các chuỗi bộ đếm kỷ luật và hoàn thành các cột mốc danh giá để thu thập những danh hiệu uy dũng nhất.
          </p>
        </div>

        {/* Current Equipped Title Highlight Card */}
        <div className="shrink-0 z-10 w-full md:w-auto bg-thorn-dark/90 p-4 rounded-2xl border border-fae/50 shadow-xl flex items-center gap-3.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-fae/20 border border-fae/40 flex items-center justify-center p-1 shadow-inner shrink-0 relative overflow-hidden group">
            <img
              src={equippedTitle.iconUrl}
              alt={equippedTitle.name}
              className="w-full h-full object-contain drop-shadow-[0_0_16px_rgba(217,119,82,0.7)] animate-pulse"
            />
          </div>
          <div>
            <span className="text-[10px] text-parchment/60 uppercase tracking-widest block font-semibold">
              Danh Hiệu Đang Trang Bị
            </span>
            <span className={`text-base font-extrabold ${equippedTitle.color} flex items-center gap-1.5`}>
              <span>{equippedTitle.name}</span>
            </span>
            <span className="text-[10px] text-parchment/50">
              Đã mở: {unlockedTitleIds.length}/{distinctTitles.length} danh hiệu
            </span>
          </div>
        </div>
      </div>

      {/* 2. Kho Danh Hiệu (Title Manager) */}
      <div className="rpg-card rounded-3xl p-5 sm:p-6 space-y-4 border border-opal/30 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-parchment/10">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-fae" />
            <h3 className="font-rpg font-bold text-lg text-parchment">
              Bộ Sưu Tập Danh Hiệu Cá Nhân
            </h3>
          </div>
          <span className="text-xs text-parchment/60 font-medium">
            Chọn 1 danh hiệu yêu thích để hiển thị trên Hồ sơ và Bảng Xếp Hạng
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {distinctTitles.map((title) => {
            const isUnlocked = unlockedTitleIds.includes(title.id);
            const isEquipped = equippedTitleId === title.id;

            return (
              <div
                key={title.id}
                className={`rounded-2xl p-4 border transition-all duration-300 flex flex-col justify-between gap-3 relative group ${
                  isEquipped
                    ? 'bg-gradient-to-b from-[#6B0733]/50 via-thorn-dark to-[#2D1036] border-fae ring-2 ring-fae/50 shadow-lg scale-[1.02]'
                    : isUnlocked
                    ? 'bg-thorn-dark/80 hover:bg-thorn border-opal/40 hover:border-fae/50 hover:scale-105 shadow-md'
                    : 'bg-thorn-dark/40 border-parchment/10 opacity-60'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
                      <img
                        src={title.iconUrl}
                        alt={title.name}
                        className={`w-full h-full object-contain transition-all duration-300 drop-shadow-md ${
                          isUnlocked
                            ? 'group-hover:scale-110 group-hover:drop-shadow-[0_0_14px_rgba(217,119,82,0.85)]'
                            : 'grayscale opacity-40 contrast-75'
                        }`}
                        loading="lazy"
                      />
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl backdrop-blur-[1px] border border-parchment/10">
                          <Lock className="w-5 h-5 text-parchment/80 drop-shadow" />
                        </div>
                      )}
                    </div>

                    <span
                      className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${
                        title.rarity === 'legendary'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                          : title.rarity === 'epic'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-400/50'
                          : title.rarity === 'rare'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                          : 'bg-rose-500/20 text-rose-300 border-rose-400/50'
                      }`}
                    >
                      {title.rarity.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h4 className={`text-sm font-extrabold ${title.color}`}>
                      {title.name}
                    </h4>
                    <p className="text-[11px] text-parchment/70 mt-1 leading-relaxed line-clamp-2">
                      {title.description}
                    </p>
                  </div>

                  <p className="text-[10px] text-parchment/50 italic border-t border-parchment/10 pt-1.5">
                    Nguồn: {title.sourceQuestTitle}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-1">
                  {isEquipped ? (
                    <span className="w-full py-1.5 rounded-xl bg-fae/20 border border-fae text-xs font-bold text-fae flex items-center justify-center gap-1.5 shadow">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đang Trang Bị</span>
                    </span>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => equipTitle(title.id)}
                      className="w-full py-1.5 rounded-xl rpg-btn-primary font-bold text-xs text-parchment hover:scale-[1.02] transition shadow"
                    >
                      Trang Bị Ngay
                    </button>
                  ) : (
                    <span className="w-full py-1.5 rounded-xl bg-thorn-dark border border-parchment/10 text-xs font-semibold text-parchment/40 flex items-center justify-center gap-1.5">
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTabFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              activeTabFilter === 'all'
                ? 'bg-fae text-thorn-dark border-fae shadow-md'
                : 'bg-thorn-dark text-parchment/70 border-opal/30 hover:text-parchment'
            }`}
          >
            Tất Cả Thử Thách ({systemQuests.length})
          </button>
          <button
            onClick={() => setActiveTabFilter('streak')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              activeTabFilter === 'streak'
                ? 'bg-fae text-thorn-dark border-fae shadow-md'
                : 'bg-thorn-dark text-parchment/70 border-opal/30 hover:text-parchment'
            }`}
          >
            Bộ Đếm Ngày ({streakQuests.length})
          </button>
          <button
            onClick={() => setActiveTabFilter('milestone')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              activeTabFilter === 'milestone'
                ? 'bg-fae text-thorn-dark border-fae shadow-md'
                : 'bg-thorn-dark text-parchment/70 border-opal/30 hover:text-parchment'
            }`}
          >
            Cột Mốc Thành Tựu ({milestoneQuests.length})
          </button>
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
            const isResetToday = quest.lastResetDate === todayStr;
            const isAtDayZero = (quest.currentStreak || 0) === 0;
            const canClaim = quest.isCompleted && !quest.isRewardClaimed;

            return (
              <div
                key={quest.id}
                className={`rpg-card rounded-3xl p-5 sm:p-6 border transition-all duration-300 space-y-4 ${
                  canClaim
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
                          className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center transition border ${
                            isCurrent
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
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1 w-full">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    {/* Check-In Button */}
                    {!quest.isCompleted && (
                      <button
                        onClick={() => checkInStreakQuest(quest.id)}
                        disabled={isCheckedInToday || isResetToday}
                        className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                          isResetToday
                            ? 'bg-[#2D1036]/80 border border-[#6B0733]/60 text-gray-400 cursor-not-allowed shadow-inner'
                            : isCheckedInToday
                            ? 'bg-thorn-dark text-parchment/40 border border-parchment/15 cursor-not-allowed'
                            : 'rpg-btn-primary text-parchment shadow-lg hover:scale-105'
                        }`}
                      >
                        {isResetToday ? (
                          <>
                            <span className="text-sm">⏳</span>
                            <span>Đã Reset • Mở điểm danh lại sau 00:00 (còn {countdownString})</span>
                          </>
                        ) : isCheckedInToday ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>✓ Đã Điểm Danh Hôm Nay (Quay lại ngày mai)</span>
                          </>
                        ) : (
                          <>
                            <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
                            <span>🔥 Điểm Danh Hôm Nay (+1 Ngày)</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Claim Button */}
                    {canClaim && (
                      <button
                        onClick={() => claimSystemQuestReward(quest.id)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-parchment font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl animate-bounce"
                      >
                        <Gift className="w-4 h-4 text-amber-200" />
                        <span>🎁 Nhận Danh Hiệu & Phần Thưởng</span>
                      </button>
                    )}

                    {quest.isRewardClaimed && (
                      <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã Nhận Thưởng</span>
                      </span>
                    )}
                  </div>

                  {/* Reset Button with Dialog */}
                  <div className="w-full sm:w-auto">
                    {confirmResetQuestId === quest.id ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 bg-[#2D1036] p-3 rounded-2xl border border-rose-500/50 shadow-xl animate-in fade-in w-full max-w-lg">
                        <div className="flex items-start gap-2 text-xs text-rose-200">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">
                            ⚠️ Nếu Reset bây giờ, toàn bộ tiến độ hiện tại sẽ về Ngày 0 và bạn phải đợi qua 12h đêm nay (00:00 ngày mai) mới có thể điểm danh lại Ngày 1. Bạn chắc chắn muốn Reset chứ?
                          </span>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
                          <button
                            onClick={() => {
                              resetStreakQuest(quest.id);
                              setConfirmResetQuestId(null);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow transition whitespace-nowrap"
                          >
                            Đồng Ý
                          </button>
                          <button
                            onClick={() => setConfirmResetQuestId(null)}
                            className="px-3 py-1.5 rounded-xl bg-thorn-dark text-xs text-parchment/70 hover:text-parchment transition border border-parchment/15 whitespace-nowrap"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : isAtDayZero ? (
                      <button
                        disabled
                        className="w-full sm:w-auto p-2 px-3 rounded-xl bg-thorn-dark/40 border border-parchment/10 text-parchment/30 text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-50"
                        title="Bộ đếm đang ở Ngày 0, không cần Reset"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Reset Bộ Đếm</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmResetQuestId(quest.id)}
                        className="w-full sm:w-auto p-2 px-3 rounded-xl bg-thorn-dark/70 hover:bg-rose-950/40 border border-parchment/15 hover:border-rose-400/40 text-parchment/50 hover:text-rose-300 text-xs flex items-center justify-center gap-1.5 transition"
                        title="Reset chuỗi về ngày 0 để bắt đầu lại thử thách"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Reset Bộ Đếm</span>
                      </button>
                    )}
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
                className={`rpg-card rounded-3xl p-5 sm:p-6 border transition-all duration-300 space-y-4 ${
                  canClaim
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
