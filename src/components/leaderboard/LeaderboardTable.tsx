import React, { useState, useEffect, useMemo } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { SYSTEM_TITLES, resolveTitleObject } from '../../constants/systemQuests';
import { playSound } from '../../utils/soundEngine';
import {
  RefreshCw,
  Swords,
  ShieldCheck,
  Crown,
  Sparkles,
  ChevronUp,
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

export const LeaderboardHeader: React.FC = () => {
  const { userRole, syncToCloud, communityProfiles, fetchCommunityProfiles, hunterId } =
    useFaeQuestStore();
  const [isLoading, setIsLoading] = useState(false);

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
      <div className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 bg-[#11212D] border border-[#253745] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-[#06141B] border border-[#4A5C6A] text-[11px] sm:text-xs font-bold text-[#CCD0CF]">
              <Swords className="w-3.5 h-3.5 text-cyan-400" />
              <span>Đấu Trường Danh Vọng • Supabase Realtime</span>
            </div>
            {userRole === 'admin' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] sm:text-[11px] font-extrabold text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>CHẾ ĐỘ QUẢN TRỊ VIÊN (ẨN KHỎI BXH)</span>
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-[#CCD0CF] font-rpg tracking-wide">
            Bảng Xếp Hạng Thợ Săn
          </h2>
          <p className="text-xs text-[#9BA8AB] max-w-2xl leading-relaxed hidden sm:block">
            {userRole === 'admin'
              ? 'Tài khoản Quản Trị Viên được tự động ẩn khỏi BXH để bảo toàn tính minh bạch và công bằng cho Đấu Trường.'
              : 'Vinh danh 50 Thợ Săn kỷ luật nhất Đấu Trường. Hoàn thành nhiệm vụ mỗi ngày để khắc tên lên Bục Vinh Quang.'}
          </p>
        </div>

        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          {/* Thẻ đếm số lượng người chơi thật */}
          <div className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#06141B] border border-[#253745] text-[11px] sm:text-xs font-bold text-[#CCD0CF] flex items-center gap-2 shadow-inner">
            <Swords className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              <strong className="text-white font-extrabold">{totalRealHunters}</strong> Thợ Săn Đang Thi Đấu
            </span>
          </div>

          {/* Nút Làm Mới */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#CCD0CF] hover:bg-white text-[#06141B] text-xs font-extrabold flex items-center gap-1.5 shadow active:scale-95 transition cursor-pointer disabled:opacity-50 shrink-0"
            title="Tải lại BXH người chơi thật từ Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Đang tải...' : 'Làm Mới'}</span>
          </button>
        </div>
      </div>
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
  const [highlightMyCard, setHighlightMyCard] = useState(false);

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

  // Bậc Rank hiện tại của người dùng
  const myRankIdx = getRankIndexByExp(typeof exp === 'number' ? exp : 0);
  const myTier = RANK_TIERS[myRankIdx];

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
      setHighlightMyCard(true);
      setTimeout(() => setHighlightMyCard(false), 1500);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Helper render thẻ bục vinh quang (Rank 1, 2, 3)
  // Mobile (< 768px): Hạng #1 (col-span-2 hàng trên), Hạng #2 + #3 (col-span-1 2 cột song song hàng dưới)
  // Desktop (>= 768px): [Hạng #2] - [Hạng #1] - [Hạng #3] (3 cột)
  const renderPodiumCard = (c: Combatant | undefined, rankPos: 1 | 2 | 3) => {
    if (!c) {
      // Empty slot placeholder
      return (
        <div
          key={`podium-empty-${rankPos}`}
          className={`rounded-3xl p-4 sm:p-5 border-2 border-dashed border-[#253745] bg-[#11212D]/40 flex flex-col items-center justify-center text-center text-[#4A5C6A] ${rankPos === 1
            ? 'col-span-2 md:col-span-1 md:min-h-[260px] order-1 md:order-2'
            : rankPos === 2
              ? 'col-span-1 md:col-span-1 md:min-h-[235px] order-2 md:order-1'
              : 'col-span-1 md:col-span-1 md:min-h-[220px] order-3 md:order-3'
            }`}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-[#253745] flex items-center justify-center text-sm font-bold mb-2">
            #{rankPos}
          </div>
          <span className="text-xs">Đang chờ Thợ Săn chiếm cứ</span>
        </div>
      );
    }

    const rankIdx = getRankIndexByExp(c.exp);
    const tier = RANK_TIERS[rankIdx];
    const isPlayer = c.isPlayer;
    const coverImage = '/assets/leaderboard/top1_podium_bg.jpg';

    if (rankPos === 1) {
      return (
        <div
          key={c.id}
          id={isPlayer ? 'my-rank-card' : undefined}
          onClick={() => handleSelectHunter(c, 1)}
          className={`relative rounded-3xl p-4 sm:p-5 md:p-6 border-2 border-red-500/80 bg-[#0c1822] shadow-[0_0_35px_rgba(239,68,68,0.28)] flex flex-col items-center justify-between min-h-[220px] md:min-h-[260px] cursor-pointer hover:border-red-400 hover:scale-[1.01] transition-all duration-300 col-span-2 md:col-span-1 order-1 md:order-2 overflow-hidden group ${isPlayer && highlightMyCard ? 'ring-2 ring-red-300 scale-[1.02]' : ''
            }`}
        >
          {/* Card Background Artwork (Top 1: Glowing Red Cybernetic Core) */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <img
              src="/assets/leaderboard/top1_podium_bg.jpg"
              alt="Quán Quân Top 1 Background"
              className="w-full h-full object-cover object-center opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 select-none"
            />
            {/* Vignette gradients to guarantee top crown and bottom text/EXP pop with razor-sharp contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#06141B]/40 via-transparent to-[#0c1822] opacity-90" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/25 via-transparent to-transparent" />
          </div>

          {/* Ảnh Bìa Cá Nhân Phủ Toàn Thẻ */}
          <img
            src={coverImage}
            alt={c.name}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40 group-hover:scale-[1.02] transition-transform duration-500 pointer-events-none select-none"
            loading="lazy"
          />

          {/* Avatar with Badges & Crimson Aura Backlight */}
          <div className="relative mb-2.5 sm:mb-3 shrink-0">
            <div className="absolute inset-0 rounded-full bg-red-500/40 blur-md scale-110 pointer-events-none" />

    if (!c) {
      return (
        <div className={`relative overflow-hidden rounded-2xl bg-[#11212D]/60 border border-[#253745] ${borderTrimClass} p-4 flex items-center justify-center text-center text-[#4A5C6A] min-h-[96px]`}>
          <span className="text-xs">Đang chờ Hạng #{rankPos}</span>
        </div>
      );
    }

    const rankIdx = getRankIndexByExp(c.exp);
    const tier = RANK_TIERS[rankIdx];
    const isPlayer = c.isPlayer;
    const coverImage = defaultCover;

    return (
      <div
        id={isPlayer ? 'my-rank-card' : undefined}
        onClick={() => handleSelectHunter(c, rankPos)}
        className={`relative overflow-hidden rounded-2xl bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] ${borderTrimClass} ${bgGradientClass} p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer transition-all group ${
          isPlayer && highlightMyCard ? 'ring-2 ring-[#CCD0CF] scale-[1.01]' : ''
        }`}
      >
        {/* 4 Đinh Tán Kim Loại 4 Góc Trong Thẻ */}
        <div className={`absolute top-2 left-2 w-1.5 h-1.5 rounded-full ${isRank2 ? 'bg-slate-300/40' : 'bg-amber-600/40'} pointer-events-none`} />
        <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${isRank2 ? 'bg-slate-300/40' : 'bg-amber-600/40'} pointer-events-none`} />
        <div className={`absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full ${isRank2 ? 'bg-slate-300/40' : 'bg-amber-600/40'} pointer-events-none`} />
        <div className={`absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full ${isRank2 ? 'bg-slate-300/40' : 'bg-amber-600/40'} pointer-events-none`} />

        {/* Ảnh Nền Phủ Toàn Thẻ (Full Bleed) Giống Top 1 */}
        <img
          src={coverImage}
          alt={c.name}
          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-[1.02] transition-transform duration-500 pointer-events-none select-none"
          loading="lazy"
        />

        {/* Lớp Gradient Chuyển Sắc Từ Tối Sâu Sang Tông Ám Của Hạng */}
        <div
          className={`absolute inset-0 ${
            isRank2
              ? 'bg-gradient-to-r from-[#06141B] via-[#06141B]/85 to-slate-300/10'
              : 'bg-gradient-to-r from-[#06141B] via-[#06141B]/85 to-amber-700/15'
          } pointer-events-none`}
        />

        {/* Dải Ánh Sáng Mảnh Lướt Chậm Chu Kỳ 5s */}
        <motion.div
          animate={{ x: ['-100%', '250%'] }}
          transition={{ duration: isRank2 ? 5.5 : 5.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: isRank2 ? 1.5 : 2 }}
          className={`absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent ${
            isRank2 ? 'via-slate-100/10' : 'via-amber-500/10'
          } to-transparent -skew-x-12 pointer-events-none`}
        />

        {/* Trái: Avatar & Huy hiệu + Thông tin người chơi */}
        <div className="relative z-10 flex items-center gap-3 min-w-0 flex-1">
          {/* Avatar with Badges */}
          <div className="relative shrink-0">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden ${ringClass} bg-[#06141B] flex items-center justify-center shrink-0 aspect-square`}>
              {isAvatarUrl(c.avatar) ? (
                <img
                  src={c.avatar}
                  alt={c.name}
                  className="w-full h-full object-cover rounded-full aspect-square"
                  loading="lazy"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-black text-red-200">
                  {(c.name || 'T').charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Rank tier icon badge top-left */}
            <div className="absolute -top-1 -left-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#06141B] border border-red-500/90 p-0.5 flex items-center justify-center shadow-md z-10 shrink-0">
              <img
                src={tier.iconUrl}
                alt={tier.name}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Diamond badge 1 at bottom */}
            <div className="absolute -bottom-2 sm:-bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 rotate-45 bg-gradient-to-br from-red-400 via-rose-500 to-red-700 border border-red-200 flex items-center justify-center shadow-lg z-10 shrink-0">
              <span className="-rotate-45 font-black text-[11px] sm:text-xs text-white">1</span>
            </div>
          </div>

          {/* Name & Title */}
          <div className="text-center w-full px-2 mt-1">
            <h3 className="text-sm sm:text-base md:text-lg font-extrabold text-white truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] group-hover:text-red-200 transition">
              {c.name}
              {isPlayer && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white shadow">
                  BẠN
                </span>
              )}
            </h3>
            <div className="mt-1 flex justify-center">{renderTitlePill(c.title)}</div>
          </div>
        </div>

          {/* EXP Frame */ }
      <div className="relative z-10 mt-3 sm:mt-4 w-full py-1.5 px-3 rounded-xl bg-[#06141B]/95 border border-red-500/50 text-center shadow-inner backdrop-blur-sm">
        <span className="text-xs sm:text-sm text-red-300 font-black font-mono">
          ✨ {c.exp.toLocaleString('vi-VN')}{' '}
          <span className="text-[10px] text-red-200/70 font-semibold">EXP</span>
        </span>
      </div>
        </div >
      );
    }

if (rankPos === 2) {
  return (
    <div
      key={c.id}
      id={isPlayer ? 'my-rank-card' : undefined}
      onClick={() => handleSelectHunter(c, 2)}
      className={`relative rounded-3xl p-3 sm:p-5 border border-[#d48b93]/80 bg-[#0c1822] shadow-[0_0_25px_rgba(212,139,147,0.22)] flex flex-col items-center justify-between h-full min-h-[190px] sm:min-h-[220px] md:min-h-[235px] cursor-pointer hover:border-[#f3aeb5] hover:scale-[1.01] transition-all duration-300 col-span-1 md:col-span-1 order-2 md:order-1 overflow-hidden group ${isPlayer && highlightMyCard ? 'ring-2 ring-rose-300 scale-[1.02]' : ''
        }`}
    >
      {/* Card Background Artwork (Top 2: Sword Battlefield Pink/Orange Sky) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/assets/leaderboard/top2_podium_bg.jpg"
          alt="Á Quân Top 2 Background"
          className="w-full h-full object-cover object-center opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#06141B]/40 via-transparent to-[#0c1822] opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#11212D] via-[#11212D]/40 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#d48b93]/15 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full">
        {/* Avatar with Badges & Rose Backlight */}
        <div className="relative mb-2 mt-1 shrink-0">
          <div className="absolute inset-0 rounded-full bg-[#d48b93]/35 blur-md scale-110 pointer-events-none" />

          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full ring-2 ring-[#e29fa6] shadow-[0_0_15px_rgba(212,139,147,0.45)] overflow-hidden bg-[#06141B] flex items-center justify-center shrink-0 aspect-square">
            {isAvatarUrl(c.avatar) ? (
              <img
                src={c.avatar}
                alt={c.name}
                className="w-full h-full object-cover rounded-full aspect-square"
                loading="lazy"
              />
            ) : (
              <span className="text-xl sm:text-2xl font-black text-[#f8cfd3]">
                {(c.name || 'T').charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Rank tier icon badge top-left */}
          <div className="absolute -top-1 -left-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#06141B] border border-[#d48b93] p-0.5 flex items-center justify-center shadow z-10 shrink-0">
            <img
              src={tier.iconUrl}
              alt={tier.name}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Diamond badge 2 at bottom */}
          <div className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2 w-4.5 h-4.5 sm:w-5 sm:h-5 rotate-45 bg-gradient-to-br from-[#f8cfd3] via-[#e29fa6] to-[#b3636c] border border-white flex items-center justify-center shadow z-10 shrink-0">
            <span className="-rotate-45 font-black text-[10px] sm:text-[11px] text-[#06141B]">2</span>
          </div>
        </div>

        {/* Name & Title */}
        <div className="text-center w-full px-1 mt-0.5">
          <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-[#CCD0CF] truncate max-w-[120px] sm:max-w-full mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] group-hover:text-white transition">
            {c.name}
            {isPlayer && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black bg-[#d48b93] text-white shadow">
                BẠN
              </span>
            )}
          </h3>
          <div className="mt-1 flex justify-center max-w-[110px] sm:max-w-full mx-auto">{renderTitlePill(c.title)}</div>
        </div>
      </div>

      {/* EXP Frame */}
      <div className="relative z-10 mt-2.5 w-full py-1 sm:py-1.5 px-1.5 sm:px-3 rounded-xl bg-[#06141B]/95 border border-[#d48b93]/50 text-center shadow-inner backdrop-blur-sm">
        <span className="text-[10px] sm:text-xs text-[#fcd6da] font-extrabold font-mono">
          ✨ {c.exp.toLocaleString('vi-VN')}{' '}
          <span className="text-[8px] sm:text-[10px] text-[#d48b93]/80 font-normal">EXP</span>
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
    className={`relative rounded-3xl p-3 sm:p-5 border-2 border-teal-400/80 bg-[#0c1822] shadow-[0_0_30px_rgba(45,212,191,0.28)] flex flex-col items-center justify-between h-full min-h-[190px] sm:min-h-[220px] md:min-h-[220px] cursor-pointer hover:border-teal-300 hover:scale-[1.01] transition-all duration-300 col-span-1 md:col-span-1 order-3 md:order-3 overflow-hidden group ${isPlayer && highlightMyCard ? 'ring-2 ring-teal-300 scale-[1.02]' : ''
      }`}
  >
    {/* 4 Đinh Tán Kim Loại 4 Góc Trong Thẻ */}
    <div className={`absolute top-2 left-2 w-1.5 h-1.5 rounded-full ${isRank2 ? 'bg-slate-300/40' : 'bg-amber-600/40'} pointer-events-none`} />
    <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${isRank2 ? 'bg-slate-300/40' : 'bg-amber-600/40'} pointer-events-none`} />
    <div className={`absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full ${isRank2 ? 'bg-slate-300/40' : 'bg-amber-600/40'} pointer-events-none`} />
    <div className={`absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full ${isRank2 ? 'bg-slate-300/40' : 'bg-amber-600/40'} pointer-events-none`} />

    {/* Ảnh Nền Phủ Toàn Thẻ Giống Top 1 */}
    <img
      src={coverImage}
      alt={c.name}
      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-[1.02] transition-transform duration-500 pointer-events-none select-none"
      loading="lazy"
    />

    {/* Lớp Gradient Chuyển Sắc Từ Tối Sâu Sang Tông Ám Của Hạng */}
    <div
      className={`absolute inset-0 ${isRank2
        ? 'bg-gradient-to-r from-[#06141B] via-[#06141B]/85 to-slate-300/10'
        : 'bg-gradient-to-r from-[#06141B] via-[#06141B]/85 to-amber-700/15'
        } pointer-events-none`}
    />

    {/* Dải Ánh Sáng Mảnh Lướt Chậm Chu Kỳ 5s */}
    <motion.div
      animate={{ x: ['-100%', '250%'] }}
      transition={{ duration: isRank2 ? 5.5 : 5.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: isRank2 ? 1.5 : 2 }}
      className={`absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent ${isRank2 ? 'via-slate-100/10' : 'via-amber-500/10'
        } to-transparent -skew-x-12 pointer-events-none`}
    />

    <div className="relative z-10 flex flex-col items-center w-full">
      {/* Avatar with Badges & Teal/Jade Backlight */}
      <div className="relative mb-2 mt-1 shrink-0">
        <div className="absolute inset-0 rounded-full bg-teal-400/35 blur-md scale-110 pointer-events-none" />

        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full ring-2 ring-teal-400 shadow-[0_0_18px_rgba(45,212,191,0.5)] overflow-hidden bg-[#06141B] flex items-center justify-center shrink-0 aspect-square">
          {isAvatarUrl(c.avatar) ? (
            <img
              src={c.avatar}
              alt={c.name}
              className="w-full h-full object-cover rounded-full aspect-square"
              loading="lazy"
            />
          ) : (
            <span className="text-xl sm:text-2xl font-black text-teal-300">
              {(c.name || 'T').charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Rank tier icon badge top-left */}
        <div className="absolute -top-1 -left-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#06141B] border border-teal-400/90 p-0.5 flex items-center justify-center shadow z-10 shrink-0">
          <img
            src={tier.iconUrl}
            alt={tier.name}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Diamond badge 3 at bottom */}
        <div className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2 w-4.5 h-4.5 sm:w-5 sm:h-5 rotate-45 bg-gradient-to-br from-teal-300 via-teal-500 to-emerald-700 border border-teal-200 flex items-center justify-center shadow z-10 shrink-0">
          <span className="-rotate-45 font-black text-[10px] sm:text-[11px] text-[#06141B]">3</span>
        </div>
      </div>

      {/* Name & Title */}
      <div className="text-center w-full px-1 mt-0.5">
        <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-[#CCD0CF] truncate max-w-[120px] sm:max-w-full mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] group-hover:text-white transition">
          {c.name}
          {isPlayer && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black bg-teal-400 text-[#06141B] shadow">
              BẠN
            </span>
          )}
        </h3>
        <div className="mt-1 flex justify-center max-w-[110px] sm:max-w-full mx-auto">{renderTitlePill(c.title)}</div>
      </div>
    </div>

    {/* EXP Frame */}
    <div className="relative z-10 mt-2.5 w-full py-1 sm:py-1.5 px-1.5 sm:px-3 rounded-xl bg-[#06141B]/95 border border-teal-400/50 text-center shadow-inner backdrop-blur-sm">
      <span className="text-[10px] sm:text-xs text-teal-200 font-extrabold font-mono">
        ✨ {c.exp.toLocaleString('vi-VN')}{' '}
        <span className="text-[8px] sm:text-[10px] text-teal-300/80 font-normal">EXP</span>
      </span>
    </div>
  </div>
);
  };

return (
  <div className="space-y-4">
    {/* Helper Banner */}
    <div className="flex items-center justify-between text-xs text-[#9BA8AB] px-1 gap-2">
      <span className="flex items-center gap-1.5 min-w-0">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className="text-[11px] sm:text-xs truncate">Bấm vào Thợ Săn để xem hồ sơ & so sánh</span>
      </span>
      {lastRefreshed && (
        <span className="text-[10px] sm:text-[11px] font-mono text-[#4A5C6A] shrink-0 hidden xs:inline">
          Cập nhật: {lastRefreshed}
        </span>
      )}
    </div>

    {/* 3-Card Podium Showcase (Top 1 - 3) */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 items-stretch md:items-end mt-2 mb-6">
      {renderPodiumCard(podiumPlayers[1], 2)}
      {renderPodiumCard(podiumPlayers[0], 1)}
      {renderPodiumCard(podiumPlayers[2], 3)}
    </div>

    {/* Danh Sách Thợ Săn Hạng #4 Trở Đi (RPG Rank Cards) */}
    <div className="space-y-2.5 pb-28 md:pb-6">
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
              className={`bg-[#11212D]/90 hover:bg-[#253745]/50 border rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-2.5 sm:gap-3 transition-all cursor-pointer group ${isUser
                ? `border-[#9BA8AB]/70 bg-[#253745]/60 shadow-[0_0_15px_rgba(155,168,171,0.2)] ring-1 ring-[#9BA8AB]/40 ${highlightMyCard ? 'ring-2 ring-[#CCD0CF] scale-[1.01]' : ''
                }`
                : 'border-[#253745] hover:border-[#4A5C6A]'
                }`}
            >
              {/* Left: Rank pos + Avatar + Name + Title */}
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="w-7 sm:w-10 text-center text-sm sm:text-lg font-extrabold text-[#9BA8AB] shrink-0 font-mono">
                  #{rankPos}
                </div>

                <div className="relative shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-[#4A5C6A] bg-[#06141B] flex items-center justify-center">
                    {isAvatarUrl(c.avatar) ? (
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-base sm:text-xl font-black text-[#CCD0CF]">
                        {(c.name || 'T').charAt(0).toUpperCase()}
                      </span>
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

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-[#CCD0CF] truncate max-w-[130px] sm:max-w-none group-hover:text-white transition">
                      {c.name}
                    </span>
                    {isUser && (
                      <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full text-[8px] sm:text-[9px] font-black bg-cyan-400 text-[#06141B]">
                        BẠN
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5">{renderTitlePill(c.title)}</div>
                </div>
              </div>

              {/* Right: Tier Badge (Desktop only) + EXP frame */}
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-[#253745] bg-[#06141B]/70 text-xs font-semibold text-[#CCD0CF]">
                  <img
                    src={tier.iconUrl}
                    alt={tier.name}
                    className="w-4 h-4 object-contain"
                  />
                  <span>{tier.name}</span>
                </div>

                <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-[#06141B] border border-[#253745] text-right">
                  <span className="text-xs sm:text-sm font-extrabold text-[#CCD0CF] font-mono">
                    ✨ {c.exp.toLocaleString('vi-VN')}
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

    {/* Thanh "HẠNG CỦA BẠN" Ghim Cố Định Ở Đáy (Sticky My Rank Bar) */}
    <div
      onClick={handleScrollToMyRank}
      title="Bấm để cuộn đến vị trí của bạn trên BXH"
      className="fixed bottom-16 inset-x-2.5 sm:inset-x-4 md:sticky md:bottom-3 md:inset-x-auto md:w-full z-30 bg-gradient-to-r from-[#132533] via-[#11212D] to-[#0D1B24] border-2 border-[#4A5C6A] hover:border-[#CCD0CF] rounded-2xl px-3 sm:px-5 py-2 sm:py-2.5 shadow-[0_-14px_34px_rgba(6,20,27,0.98)] flex items-center justify-between gap-2.5 sm:gap-3 transition-all cursor-pointer group select-none max-w-7xl mx-auto"
    >
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
        {/* Cụm 1: Ô Hạng vuông bo góc + Avatar thật */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="min-w-[50px] md:min-w-[58px] h-10 md:h-12 rounded-xl bg-[#06141B] border border-[#253745] flex flex-col items-center justify-center shrink-0 shadow-inner px-1">
            <span className="text-[8px] md:text-[9px] font-extrabold text-[#9BA8AB] uppercase tracking-wider leading-tight">
              HẠNG
            </span>
            <span className="text-xs md:text-base font-black text-white font-mono leading-tight">
              {myRankStats.currentRank ? `#${myRankStats.currentRank}` : '#--'}
            </span>
          </div>

          <div className="relative shrink-0">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-full ring-2 ring-[#4A5C6A] group-hover:ring-[#CCD0CF] transition overflow-hidden shrink-0 bg-[#253745] flex items-center justify-center aspect-square">
              {isAvatarUrl(avatarUrl) ? (
                <img
                  src={avatarUrl!}
                  alt={playerName}
                  className="w-full h-full object-cover rounded-full aspect-square"
                />
              ) : (
                <span className="text-xs sm:text-base font-black text-[#CCD0CF]">
                  {(playerName || 'T').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* Badge icon bậc Rank nhỏ ở góc trên bên trái avatar */}
            <div className="absolute -top-1 -left-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#06141B] border border-[#4A5C6A] p-0.5 flex items-center justify-center z-10 shadow">
              <img
                src={myTier.iconUrl}
                alt={myTier.name}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Cụm 2: Tên & Thanh Tiến Độ Vượt Cấp */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="truncate max-w-[110px] sm:max-w-[220px] font-bold text-[#CCD0CF] text-xs sm:text-sm">
              {playerName}
            </span>
            <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A] shrink-0">
              Bạn
            </span>
          </div>

          <div className="text-[10px] sm:text-[11px] truncate mt-0.5">
            {userRole === 'admin' ? (
              <span className="text-amber-300 font-semibold">
                🛡️ Quản Trị Viên (Ẩn khỏi BXH)
              </span>
            ) : myRankStats.isTop1 ? (
              <span className="text-amber-300 font-extrabold flex items-center gap-1">
                👑 Đang giữ ngôi vương Đấu Trường (#1)
              </span>
            ) : myRankStats.targetRival ? (
              <div className="min-w-0">
                <div className="text-[#9BA8AB] truncate">
                  ⚔️ Thiếu <strong className="text-cyan-400 font-extrabold">+{myRankStats.diffExp.toLocaleString('vi-VN')} EXP</strong> vượt{' '}
                  <strong className="text-white font-bold">{myRankStats.targetRival.name}</strong>{' '}
                  (#{myRankStats.currentRank! - 1})
                </div>
                {/* Thanh tiến độ siêu mảnh */}
                <div className="h-1 w-24 sm:w-44 bg-[#06141B] rounded-full overflow-hidden mt-1 border border-[#253745]/60">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          5,
                          Math.round(
                            ((typeof exp === 'number' ? exp : 0) /
                              (myRankStats.targetRival.exp || 1)) *
                            100
                          )
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <span className="text-[#9BA8AB]">
                Đấu trường đang chờ đón thử thách mới
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cụm 3: Tổng EXP & Nút Cuộn Nhanh */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <div className="text-[8px] sm:text-[9px] font-extrabold text-[#9BA8AB] uppercase tracking-wider">
            TỔNG EXP
          </div>
          <div className="text-xs sm:text-sm font-black font-mono text-cyan-300">
            ✨ {(typeof exp === 'number' ? exp : 0).toLocaleString('vi-VN')}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleScrollToMyRank();
          }}
          title="Cuộn tới vị trí của bạn"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#253745] group-hover:bg-[#CCD0CF] group-hover:text-[#06141B] text-[#CCD0CF] flex items-center justify-center transition shadow-sm cursor-pointer shrink-0"
        >
          <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  </div>
);
};
