import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { SYSTEM_TITLES, resolveTitleObject } from '../../constants/systemQuests';
import { RivalTargetBanner } from './RivalTargetBanner';
import { playSound } from '../../utils/soundEngine';
import {
  Trophy,
  RefreshCw,
  Swords,
  ShieldCheck,
  Crown,
  Award,
  Sparkles,
  X,
  Star,
  Coins,
} from 'lucide-react';

interface Combatant {
  id: string;
  name: string;
  title: string;
  exp: number;
  avatar: string;
  coverUrl: string | null;
  cover_url: string | null;
  streak: number;
  completedTasks: number;
  equippedTitle?: string;
  stars: number;
  isPlayer: boolean;
}

const isAvatarUrl = (avatar?: string | null): boolean => {
  return (
    typeof avatar === 'string' &&
    (avatar.startsWith('http') || avatar.startsWith('/') || avatar.startsWith('data:'))
  );
};

const renderTitlePill = (titleName?: string) => {
  if (!titleName) return null;
  const matchingTitle = Object.values(SYSTEM_TITLES).find((t) => t.name === titleName);
  if (matchingTitle) {
    return (
      <div
        className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold ${matchingTitle.color} truncate max-w-full`}
      >
        {matchingTitle.iconUrl ? (
          <img
            src={matchingTitle.iconUrl}
            alt={matchingTitle.name}
            className="w-3.5 h-3.5 object-contain shrink-0 drop-shadow"
            loading="lazy"
          />
        ) : (
          <span>{matchingTitle.icon}</span>
        )}
        <span className="truncate">{titleName}</span>
      </div>
    );
  }
  return <span className="text-[10px] sm:text-[11px] text-[#9BA8AB] truncate">{titleName}</span>;
};

/**
 * Modal Phần Thưởng Đấu Trường (Rewards Chest)
 */
interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LeaderboardRewardsModal: React.FC<RewardsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md rounded-3xl bg-[#11212D] border-2 border-[#4A5C6A] p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Subtle Background Glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              playSound('ui_click');
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-xl bg-[#06141B] border border-[#253745] text-[#9BA8AB] hover:text-white hover:border-[#4A5C6A] transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#CCD0CF] font-rpg tracking-wide">
                Phần Thưởng Đấu Trường
              </h3>
              <p className="text-xs text-[#9BA8AB]">Quy chế vinh danh Bục Quán Quân & Bảng Xếp Hạng</p>
            </div>
          </div>

          <p className="text-xs text-[#CCD0CF]/80 mb-4 leading-relaxed bg-[#06141B]/60 p-3 rounded-xl border border-[#253745]">
            Vinh danh những Thợ Săn kiên trì và kỷ luật nhất. Hoàn thành nhiệm vụ mỗi ngày để thăng hạng và nhận các phần quà danh giá!
          </p>

          {/* Rewards List */}
          <div className="space-y-2.5">
            {/* Top 1 */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#11212D] to-[#11212D] border border-amber-400/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-[#06141B] font-black text-sm flex items-center justify-center shadow">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-amber-300 uppercase tracking-wide">
                    Hạng #1 • Quán Quân
                  </div>
                  <div className="text-xs font-bold text-white">Danh hiệu: Chí Tôn Thần Khải</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-amber-300 flex items-center gap-1 justify-end">
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> +500 Xu
                </div>
                <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1 justify-end">
                  <Star className="w-3 h-3 text-cyan-400" /> +50 Sao
                </div>
              </div>
            </div>

            {/* Top 2 */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-300/10 via-[#11212D] to-[#11212D] border border-slate-300/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-300 text-[#06141B] font-black text-xs flex items-center justify-center shadow">
                  2
                </div>
                <div>
                  <div className="text-xs font-black text-slate-300 uppercase tracking-wide">
                    Hạng #2 • Á Quân
                  </div>
                  <div className="text-xs font-bold text-white">Danh hiệu: Đại Tướng Quân</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-amber-300 flex items-center gap-1 justify-end">
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> +300 Xu
                </div>
                <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1 justify-end">
                  <Star className="w-3 h-3 text-cyan-400" /> +30 Sao
                </div>
              </div>
            </div>

            {/* Top 3 */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-700/15 via-[#11212D] to-[#11212D] border border-amber-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow">
                  3
                </div>
                <div>
                  <div className="text-xs font-black text-amber-500 uppercase tracking-wide">
                    Hạng #3 • Quý Quân
                  </div>
                  <div className="text-xs font-bold text-white">Danh hiệu: Hộ Pháp Thánh Điện</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-amber-300 flex items-center gap-1 justify-end">
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> +200 Xu
                </div>
                <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1 justify-end">
                  <Star className="w-3 h-3 text-cyan-400" /> +20 Sao
                </div>
              </div>
            </div>

            {/* Top 4-10 */}
            <div className="p-3 rounded-2xl bg-[#06141B]/70 border border-[#253745] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#253745] text-[#9BA8AB] font-black text-xs flex items-center justify-center">
                  4-10
                </div>
                <div>
                  <div className="text-xs font-black text-[#9BA8AB] uppercase tracking-wide">
                    Top 4 – 10 • Tinh Anh
                  </div>
                  <div className="text-xs font-bold text-[#CCD0CF]">Danh hiệu: Bá Tước Kỷ Luật</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-amber-300 flex items-center gap-1 justify-end">
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> +100 Xu
                </div>
                <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1 justify-end">
                  <Star className="w-3 h-3 text-cyan-400" /> +10 Sao
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={() => {
              playSound('ui_click');
              onClose();
            }}
            className="w-full mt-5 py-2.5 rounded-xl bg-[#CCD0CF] hover:bg-white text-[#06141B] text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow active:scale-98"
          >
            Đã Hiểu
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const LeaderboardHeader: React.FC = () => {
  const { userRole, syncToCloud, communityProfiles, fetchCommunityProfiles, hunterId } =
    useFaeQuestStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);

  const handleRefresh = async () => {
    playSound('ui_click');
    setIsLoading(true);
    await syncToCloud(true);
    await fetchCommunityProfiles();
    window.dispatchEvent(new CustomEvent('faequest:reload_leaderboard'));
    setTimeout(() => setIsLoading(false), 800);
  };

  // Tính số lượng người chơi thật đang thi đấu
  const isIncluded = (communityProfiles || []).some((p) => p.id === hunterId);
  const totalRealHunters =
    userRole === 'admin'
      ? (communityProfiles || []).length
      : isIncluded
        ? (communityProfiles || []).length
        : (communityProfiles || []).length + 1;

  return (
    <div className="space-y-3">
      {/* Leaderboard Header Banner */}
      <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-[#11212D] border border-[#253745] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06141B] border border-[#4A5C6A] text-xs font-bold text-[#CCD0CF]">
              <Swords className="w-3.5 h-3.5 text-cyan-400" />
              <span>Đấu Trường Danh Vọng • Supabase Realtime</span>
            </div>
            {userRole === 'admin' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] font-extrabold text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>CHẾ ĐỘ QUẢN TRỊ VIÊN (ẨN KHỎI BXH)</span>
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#CCD0CF] font-rpg tracking-wide">
            Bảng Xếp Hạng Thợ Săn
          </h2>
          <p className="text-xs text-[#9BA8AB] max-w-2xl leading-relaxed hidden sm:block">
            {userRole === 'admin'
              ? 'Tài khoản Quản Trị Viên được tự động ẩn khỏi BXH để bảo toàn tính minh bạch và công bằng cho Đấu Trường.'
              : 'Vinh danh 50 Thợ Săn kỷ luật nhất Đấu Trường. Hoàn thành nhiệm vụ mỗi ngày để khắc tên lên Bục Vinh Quang.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Thẻ đếm số lượng người chơi thật */}
          <div className="px-3.5 py-2 rounded-xl bg-[#06141B] border border-[#253745] text-xs font-bold text-[#CCD0CF] flex items-center gap-2 shadow-inner">
            <Swords className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              <strong className="text-white font-extrabold">{totalRealHunters}</strong> Thợ Săn Đang Thi Đấu
            </span>
          </div>

          {/* Nút Phần Thưởng */}
          <button
            type="button"
            onClick={() => {
              playSound('ui_click');
              setIsRewardsOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#06141B] hover:bg-[#253745] border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition cursor-pointer"
            title="Xem bảng quy chế và phần thưởng đấu trường"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Phần Thưởng</span>
          </button>

          {/* Nút Làm Mới */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-[#CCD0CF] hover:bg-white text-[#06141B] text-xs font-extrabold flex items-center gap-1.5 shadow active:scale-95 transition cursor-pointer disabled:opacity-50"
            title="Tải lại BXH người chơi thật từ Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Đang tải...' : 'Làm Mới'}</span>
          </button>
        </div>
      </div>

      {/* Target Banner */}
      <RivalTargetBanner />

      {/* Rewards Modal */}
      <LeaderboardRewardsModal isOpen={isRewardsOpen} onClose={() => setIsRewardsOpen(false)} />
    </div>
  );
};

export const LeaderboardTable: React.FC = () => {
  const {
    playerName,
    avatarUrl,
    coverUrl,
    exp,
    streakDays,
    completedTotal,
    stars,
    equippedTitleId,
    hunterId,
    syncToCloud,
    communityProfiles,
    fetchCommunityProfiles,
    userRole,
    openRivalModal,
  } = useFaeQuestStore();

  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const playerTitle = resolveTitleObject(equippedTitleId).name;

  const loadLeaderboard = async () => {
    setIsLoading(true);
    await syncToCloud(true);
    await fetchCommunityProfiles();
    setIsLoading(false);
    setLastRefreshed(new Date().toLocaleTimeString('vi-VN'));
  };

  useEffect(() => {
    loadLeaderboard();
    const handleReload = () => loadLeaderboard();
    window.addEventListener('faequest:reload_leaderboard', handleReload);
    return () => window.removeEventListener('faequest:reload_leaderboard', handleReload);
  }, []);

  // 1. Dữ liệu của người dùng hiện tại (useMemo)
  const myCombatant: Combatant = useMemo(
    () => ({
      id: hunterId || 'player_me',
      name: playerName,
      title: playerTitle,
      exp: typeof exp === 'number' ? exp : 0,
      avatar: avatarUrl || '🛡️',
      coverUrl: coverUrl || null,
      cover_url: coverUrl || null,
      streak: streakDays,
      completedTasks: completedTotal,
      equippedTitle: equippedTitleId,
      stars: stars || 0,
      isPlayer: true,
    }),
    [
      hunterId,
      playerName,
      playerTitle,
      exp,
      avatarUrl,
      coverUrl,
      streakDays,
      completedTotal,
      equippedTitleId,
      stars,
    ]
  );

  // 2. Dữ liệu 100% thợ săn thật từ Supabase (loại bỏ chính mình & tài khoản admin) (useMemo)
  const otherCommunityCombatants: Combatant[] = useMemo(() => {
    return (communityProfiles || [])
      .filter((p) => p.id !== hunterId && p.role !== 'admin')
      .map((p) => {
        const matchingTitle = resolveTitleObject(p.equipped_title);
        return {
          id: p.id,
          name: p.username || 'Thợ Săn Ẩn Danh',
          title: matchingTitle.name,
          exp: typeof p.exp === 'number' ? p.exp : 0,
          avatar: p.avatar_url || '⚔️',
          coverUrl: p.cover_url || null,
          cover_url: p.cover_url || null,
          streak: p.streak || 0,
          completedTasks: p.completed_tasks_count || 0,
          equippedTitle: p.equipped_title,
          stars: p.stars || 0,
          isPlayer: false,
        };
      });
  }, [communityProfiles, hunterId]);

  // 3. Toàn bộ danh sách Thợ Săn xếp theo EXP giảm dần
  const allCombatants: Combatant[] = useMemo(() => {
    const list =
      userRole === 'admin'
        ? otherCommunityCombatants
        : [myCombatant, ...otherCommunityCombatants];
    return list.sort((a, b) => b.exp - a.exp);
  }, [userRole, myCombatant, otherCommunityCombatants]);

  // 4. Tách Top 1-3 và Danh sách Hạng 4-50 (useMemo)
  const podiumPlayers: Combatant[] = useMemo(() => {
    return allCombatants.slice(0, 3);
  }, [allCombatants]);

  const listPlayers: Combatant[] = useMemo(() => {
    return allCombatants.slice(3);
  }, [allCombatants]);

  // 5. Thống kê hạng của chính mình & đối thủ liền kề (useMemo)
  const myRankStats = useMemo(() => {
    if (userRole === 'admin') {
      return { currentRank: null, targetRival: null, diffExp: 0, isTop1: false };
    }
    const idx = allCombatants.findIndex((c) => c.isPlayer);
    if (idx === -1) {
      return { currentRank: null, targetRival: null, diffExp: 0, isTop1: false };
    }
    const currentRank = idx + 1;
    const isTop1 = currentRank === 1;
    const targetRival = isTop1 ? null : allCombatants[idx - 1];
    const diffExp = targetRival
      ? Math.max(1, targetRival.exp - (myCombatant.exp || 0) + 1)
      : 0;

    return { currentRank, targetRival, diffExp, isTop1 };
  }, [allCombatants, userRole, myCombatant.exp]);

  const handleSelectHunter = (c: Combatant, rankPos: number) => {
    playSound('ui_click');
    openRivalModal({
      id: c.id,
      name: c.name,
      avatarUrl: isAvatarUrl(c.avatar) ? c.avatar : null,
      coverUrl: c.coverUrl,
      cover_url: c.cover_url || c.coverUrl,
      exp: c.exp,
      streak: c.streak,
      completedTasks: c.completedTasks,
      equippedTitle: c.equippedTitle || c.title,
      stars: c.stars,
      rankPos,
      isPlayer: c.isPlayer,
    });
  };

  const handleScrollToMyRank = () => {
    playSound('ui_click');
    const el = document.getElementById('my-rank-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Helper render thẻ bục vinh quang (Rank 1, 2, 3)
  const renderPodiumCard = (c: Combatant | undefined, rankPos: 1 | 2 | 3) => {
    if (!c) {
      // Empty slot placeholder
      return (
        <div
          key={`podium-empty-${rankPos}`}
          className={`rounded-3xl p-5 border-2 border-dashed border-[#253745] bg-[#11212D]/40 flex flex-col items-center justify-center text-center text-[#4A5C6A] ${
            rankPos === 1
              ? 'md:min-h-[260px] order-1 md:order-2'
              : rankPos === 2
                ? 'md:min-h-[235px] order-2 md:order-1'
                : 'md:min-h-[220px] order-3'
          }`}
        >
          <div className="w-12 h-12 rounded-full border border-[#253745] flex items-center justify-center text-sm font-bold mb-2">
            #{rankPos}
          </div>
          <span className="text-xs">Đang chờ Thợ Săn chiếm cứ</span>
        </div>
      );
    }

    const rankIdx = getRankIndexByExp(c.exp);
    const tier = RANK_TIERS[rankIdx];
    const isPlayer = c.isPlayer;

    if (rankPos === 1) {
      return (
        <div
          key={c.id}
          id={isPlayer ? 'my-rank-card' : undefined}
          onClick={() => handleSelectHunter(c, 1)}
          className="relative rounded-3xl p-5 md:p-6 border-2 border-amber-400/60 bg-gradient-to-b from-amber-500/15 via-[#11212D] to-[#11212D] shadow-[0_0_30px_rgba(251,191,36,0.18)] flex flex-col items-center justify-between md:min-h-[260px] cursor-pointer hover:border-amber-400 hover:scale-[1.02] transition-all duration-300 order-1 md:order-2 overflow-hidden group"
        >
          {/* Subtle Diamond Pattern / Light Beam */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/10 via-transparent to-transparent pointer-events-none" />

          {/* Crown */}
          <div className="flex flex-col items-center">
            <Crown className="w-6 h-6 text-amber-400 mb-1 drop-shadow animate-bounce" />

            {/* Avatar with Badges */}
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-full object-cover ring-2 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.4)] overflow-hidden bg-[#06141B] flex items-center justify-center">
                {isAvatarUrl(c.avatar) ? (
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-3xl">{c.avatar || '👑'}</span>
                )}
              </div>

              {/* Rank tier icon badge top-left */}
              <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-[#06141B] border border-amber-400/80 p-0.5 flex items-center justify-center shadow-md z-10">
                <img
                  src={tier.iconUrl}
                  alt={tier.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Diamond badge 1 at bottom */}
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rotate-45 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 border border-amber-200 flex items-center justify-center shadow-lg z-10">
                <span className="-rotate-45 font-black text-xs text-[#06141B]">1</span>
              </div>
            </div>

            {/* Name & Title */}
            <div className="text-center w-full px-2 mt-1">
              <h3 className="text-base md:text-lg font-extrabold text-white truncate group-hover:text-amber-200 transition">
                {c.name}
                {isPlayer && (
                  <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-[#06141B]">
                    BẠN
                  </span>
                )}
              </h3>
              <div className="mt-1 flex justify-center">{renderTitlePill(c.title)}</div>
            </div>
          </div>

          {/* EXP Frame */}
          <div className="mt-4 w-full py-1.5 px-3 rounded-xl bg-[#06141B]/90 border border-amber-400/40 text-center shadow-inner">
            <span className="text-xs md:text-sm text-amber-300 font-black font-mono">
              ✨ {c.exp.toLocaleString()}{' '}
              <span className="text-[10px] text-amber-200/70 font-semibold">EXP</span>
            </span>
          </div>
        </div>
      );
    }

    if (rankPos === 2) {
      return (
        <div
          key={c.id}
          id={isPlayer ? 'my-rank-card' : undefined}
          onClick={() => handleSelectHunter(c, 2)}
          className="relative rounded-3xl p-5 border border-slate-300/50 bg-gradient-to-b from-slate-300/12 via-[#11212D] to-[#11212D] shadow-[0_0_20px_rgba(203,213,225,0.12)] flex flex-col items-center justify-between md:min-h-[235px] cursor-pointer hover:border-slate-200 hover:scale-[1.01] transition-all duration-300 order-2 md:order-1 overflow-hidden group"
        >
          <div className="flex flex-col items-center">
            {/* Avatar with Badges */}
            <div className="relative mb-2.5 mt-2">
              <div className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-300 shadow-[0_0_12px_rgba(203,213,225,0.25)] overflow-hidden bg-[#06141B] flex items-center justify-center">
                {isAvatarUrl(c.avatar) ? (
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-2xl">{c.avatar || '🥈'}</span>
                )}
              </div>

              {/* Rank tier icon badge top-left */}
              <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-[#06141B] border border-slate-300 p-0.5 flex items-center justify-center shadow z-10">
                <img
                  src={tier.iconUrl}
                  alt={tier.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Diamond badge 2 at bottom */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rotate-45 bg-gradient-to-br from-slate-200 to-slate-400 border border-white flex items-center justify-center shadow z-10">
                <span className="-rotate-45 font-black text-[11px] text-[#06141B]">2</span>
              </div>
            </div>

            {/* Name & Title */}
            <div className="text-center w-full px-2 mt-1">
              <h3 className="text-sm md:text-base font-extrabold text-[#CCD0CF] truncate group-hover:text-white transition">
                {c.name}
                {isPlayer && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-slate-300 text-[#06141B]">
                    BẠN
                  </span>
                )}
              </h3>
              <div className="mt-1 flex justify-center">{renderTitlePill(c.title)}</div>
            </div>
          </div>

          {/* EXP Frame */}
          <div className="mt-3.5 w-full py-1.5 px-3 rounded-xl bg-[#06141B]/90 border border-slate-400/30 text-center shadow-inner">
            <span className="text-xs text-slate-200 font-extrabold font-mono">
              ✨ {c.exp.toLocaleString()}{' '}
              <span className="text-[10px] text-slate-400 font-normal">EXP</span>
            </span>
          </div>
        </div>
      );
    }

    // Rank 3
    return (
      <div
        key={c.id}
        id={isPlayer ? 'my-rank-card' : undefined}
        onClick={() => handleSelectHunter(c, 3)}
        className="relative rounded-3xl p-5 border border-amber-700/60 bg-gradient-to-b from-amber-700/15 via-[#11212D] to-[#11212D] shadow-[0_0_20px_rgba(180,83,9,0.12)] flex flex-col items-center justify-between md:min-h-[220px] cursor-pointer hover:border-amber-600 hover:scale-[1.01] transition-all duration-300 order-3 overflow-hidden group"
      >
        <div className="flex flex-col items-center">
          {/* Avatar with Badges */}
          <div className="relative mb-2.5 mt-2">
            <div className="w-16 h-16 rounded-full object-cover ring-2 ring-amber-700 shadow-[0_0_12px_rgba(180,83,9,0.25)] overflow-hidden bg-[#06141B] flex items-center justify-center">
              {isAvatarUrl(c.avatar) ? (
                <img
                  src={c.avatar}
                  alt={c.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="text-2xl">{c.avatar || '🥉'}</span>
              )}
            </div>

            {/* Rank tier icon badge top-left */}
            <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-[#06141B] border border-amber-700 p-0.5 flex items-center justify-center shadow z-10">
              <img
                src={tier.iconUrl}
                alt={tier.name}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Diamond badge 3 at bottom */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rotate-45 bg-gradient-to-br from-amber-600 to-amber-800 border border-amber-500 flex items-center justify-center shadow z-10">
              <span className="-rotate-45 font-black text-[11px] text-white">3</span>
            </div>
          </div>

          {/* Name & Title */}
          <div className="text-center w-full px-2 mt-1">
            <h3 className="text-sm md:text-base font-extrabold text-[#CCD0CF] truncate group-hover:text-white transition">
              {c.name}
              {isPlayer && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-700 text-white">
                  BẠN
                </span>
              )}
            </h3>
            <div className="mt-1 flex justify-center">{renderTitlePill(c.title)}</div>
          </div>
        </div>

        {/* EXP Frame */}
        <div className="mt-3.5 w-full py-1.5 px-3 rounded-xl bg-[#06141B]/90 border border-amber-700/30 text-center shadow-inner">
          <span className="text-xs text-amber-400 font-extrabold font-mono">
            ✨ {c.exp.toLocaleString()}{' '}
            <span className="text-[10px] text-amber-500/70 font-normal">EXP</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Helper Banner */}
      <div className="flex items-center justify-between text-xs text-[#9BA8AB] px-1">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Bấm vào Thợ Săn để soi thẻ hồ sơ & so sánh chỉ số</span>
        </span>
        {lastRefreshed && (
          <span className="text-[11px] font-mono text-[#4A5C6A]">
            Cập nhật lúc: {lastRefreshed}
          </span>
        )}
      </div>

      {/* 3-Card Podium Showcase (Top 1 - 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mt-2 mb-6">
        {renderPodiumCard(podiumPlayers[1], 2)}
        {renderPodiumCard(podiumPlayers[0], 1)}
        {renderPodiumCard(podiumPlayers[2], 3)}
      </div>

      {/* Danh Sách Thợ Săn Hạng #4 Trở Đi (RPG Rank Cards) */}
      <div className="space-y-2.5">
        <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-[#9BA8AB] flex items-center justify-between">
          <span>Hạng 4 – 50 • Đấu Thủ Trực Tiếp</span>
          <span>Điểm EXP</span>
        </div>

        {listPlayers.length === 0 ? (
          <div className="rounded-2xl p-6 bg-[#11212D]/60 border border-[#253745] text-center text-xs text-[#9BA8AB]">
            Chưa có thêm Thợ Săn nào khác ngoài Bục Top 3. Hãy mời bạn bè tham gia Đấu Trường!
          </div>
        ) : (
          listPlayers.map((c, idx) => {
            const rankPos = idx + 4;
            const rankIdx = getRankIndexByExp(c.exp);
            const tier = RANK_TIERS[rankIdx];
            const isUser = c.isPlayer;

            return (
              <div
                key={c.id}
                id={isUser ? 'my-rank-card' : undefined}
                onClick={() => handleSelectHunter(c, rankPos)}
                className={`bg-[#11212D]/90 hover:bg-[#253745]/50 border rounded-2xl px-3 sm:px-4 py-3 flex items-center justify-between gap-3 transition-all cursor-pointer group ${
                  isUser
                    ? 'border-[#9BA8AB]/70 bg-[#253745]/60 shadow-[0_0_15px_rgba(155,168,171,0.2)] ring-1 ring-[#9BA8AB]/40'
                    : 'border-[#253745] hover:border-[#4A5C6A]'
                }`}
              >
                {/* Left: Rank pos + Avatar + Name + Title */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 sm:w-10 text-center text-base sm:text-lg font-extrabold text-[#9BA8AB] shrink-0 font-mono">
                    #{rankPos}
                  </div>

                  <div className="relative shrink-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-[#4A5C6A] bg-[#06141B] flex items-center justify-center">
                      {isAvatarUrl(c.avatar) ? (
                        <img
                          src={c.avatar}
                          alt={c.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-xl">{c.avatar || '⚔️'}</span>
                      )}
                    </div>
                    {/* Rank tier icon badge on top-left of avatar */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-[#06141B] border border-[#4A5C6A] p-0.5 flex items-center justify-center shadow z-10">
                      <img
                        src={tier.iconUrl}
                        alt={tier.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-[#CCD0CF] truncate group-hover:text-white transition">
                        {c.name}
                      </span>
                      {isUser && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-cyan-400 text-[#06141B]">
                          BẠN
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5">{renderTitlePill(c.title)}</div>
                  </div>
                </div>

                {/* Right: Tier Badge (Desktop) + EXP frame */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-[#253745] bg-[#06141B]/70 text-xs font-semibold text-[#CCD0CF]">
                    <img
                      src={tier.iconUrl}
                      alt={tier.name}
                      className="w-4 h-4 object-contain"
                    />
                    <span>{tier.name}</span>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-[#06141B] border border-[#253745] text-right">
                    <span className="text-xs sm:text-sm font-extrabold text-[#CCD0CF] font-mono">
                      ✨ {c.exp.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#9BA8AB] ml-1 hidden xs:inline">
                      EXP
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Thanh "Hạng Của Bạn" Ghim Cố Định Ở Đáy (Sticky My Rank Bar) */}
      <div
        onClick={handleScrollToMyRank}
        title="Bấm để cuộn đến vị trí của bạn trên BXH"
        className="sticky bottom-3 z-20 mt-4 bg-[#11212D]/95 backdrop-blur-md border-2 border-[#4A5C6A] hover:border-[#9BA8AB] rounded-2xl px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] flex items-center justify-between gap-3 transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 text-left">
            <div className="text-[9px] font-extrabold text-[#9BA8AB] uppercase tracking-wider">
              HẠNG CỦA BẠN
            </div>
            <div className="text-base sm:text-lg font-black text-white font-mono">
              {myRankStats.currentRank ? `#${myRankStats.currentRank}` : '#--'}
            </div>
          </div>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ring-cyan-400 overflow-hidden shrink-0 bg-[#06141B] flex items-center justify-center">
            {isAvatarUrl(avatarUrl) ? (
              <img
                src={avatarUrl!}
                alt={playerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg">{avatarUrl || '🛡️'}</span>
            )}
          </div>

          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-white truncate">
              {playerName}
            </div>
            <div className="text-[11px] truncate">
              {userRole === 'admin' ? (
                <span className="text-amber-300 font-semibold">
                  🛡️ Quản Trị Viên (Ẩn khỏi BXH)
                </span>
              ) : myRankStats.isTop1 ? (
                <span className="text-amber-300 font-extrabold flex items-center gap-1">
                  👑 Đang giữ ngôi vương #1
                </span>
              ) : myRankStats.targetRival ? (
                <>
                  <span className="text-[#9BA8AB] hidden sm:inline">
                    ⚔️ Còn thiếu{' '}
                    <strong className="text-cyan-400 font-extrabold">
                      +{myRankStats.diffExp.toLocaleString()} EXP
                    </strong>{' '}
                    để vượt "
                    <strong className="text-white">
                      {myRankStats.targetRival.name}
                    </strong>
                    "
                  </span>
                  <span className="text-cyan-400 font-bold sm:hidden">
                    ⚔️ +{myRankStats.diffExp.toLocaleString()} EXP để vượt #
                    {myRankStats.currentRank! - 1}
                  </span>
                </>
              ) : (
                <span className="text-[#9BA8AB]">
                  Đấu trường đang chờ đón thử thách mới
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[9px] font-extrabold text-[#9BA8AB] uppercase tracking-wider">
            TỔNG EXP
          </div>
          <div className="text-xs sm:text-sm font-black font-mono text-cyan-300">
            ✨ {typeof exp === 'number' ? exp.toLocaleString() : 0}
          </div>
        </div>
      </div>
    </div>
  );
};
