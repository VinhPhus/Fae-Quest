import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
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

  // Cấu hình Hình Dáng Cờ (Pennant Shape) & Hiệu Ứng Sảnh Cờ Vinh Quang
  const PENNANT_CLIP_PATH = 'polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)';

  const BANNER_CONFIG = {
    1: {
      heightClass: 'min-h-[300px] sm:min-h-[340px] md:min-h-[360px]',
      dropShadowClass: 'drop-shadow-[0_10px_25px_rgba(245,158,11,0.35)]',
      borderGradientClass: 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600',
      tintClass: 'bg-gradient-to-b from-amber-500/15 via-transparent to-[#06141B]/80',
      auraClass: 'bg-amber-400/35',
      avatarSizeClass: 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20',
      avatarRingClass: 'ring-2 sm:ring-[2.5px] ring-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.5)]',
      avatarTextClass: 'text-amber-300',
      tierBadgeBorderClass: 'border-amber-400/90',
      diamondBadgeClass: 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border border-amber-200',
      diamondTextClass: 'text-[#06141B]',
      playerPillClass: 'bg-amber-400 text-[#06141B]',
      expTextClass: 'text-amber-300',
      defaultCover: '/assets/leaderboard/top1_podium_bg.jpg',
      sway: {
        rotate: [-1.1, 1.1, -1.1],
        skewX: [-0.6, 0.6, -0.6],
        duration: 4.6,
        delay: 0,
      },
    },
    2: {
      heightClass: 'min-h-[265px] sm:min-h-[305px] md:min-h-[325px]',
      dropShadowClass: 'drop-shadow-[0_8px_20px_rgba(204,208,207,0.22)]',
      borderGradientClass: 'bg-gradient-to-b from-slate-200 via-[#CCD0CF] to-[#4A5C6A]',
      tintClass: 'bg-gradient-to-b from-slate-300/12 via-transparent to-[#06141B]/80',
      auraClass: 'bg-slate-300/30',
      avatarSizeClass: 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16',
      avatarRingClass: 'ring-2 sm:ring-[2.5px] ring-slate-300 shadow-[0_0_14px_rgba(204,208,207,0.4)]',
      avatarTextClass: 'text-slate-300',
      tierBadgeBorderClass: 'border-slate-300',
      diamondBadgeClass: 'bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 border border-white',
      diamondTextClass: 'text-[#06141B]',
      playerPillClass: 'bg-slate-300 text-[#06141B]',
      expTextClass: 'text-slate-200',
      defaultCover: '/assets/leaderboard/top2_podium_bg.jpg',
      sway: {
        rotate: [1.2, -1.2, 1.2],
        skewX: [0.7, -0.7, 0.7],
        duration: 5.3,
        delay: 0.5,
      },
    },
    3: {
      heightClass: 'min-h-[250px] sm:min-h-[290px] md:min-h-[310px]',
      dropShadowClass: 'drop-shadow-[0_8px_20px_rgba(217,119,6,0.25)]',
      borderGradientClass: 'bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900',
      tintClass: 'bg-gradient-to-b from-amber-700/15 via-transparent to-[#06141B]/80',
      auraClass: 'bg-amber-700/35',
      avatarSizeClass: 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16',
      avatarRingClass: 'ring-2 sm:ring-[2.5px] ring-amber-700 shadow-[0_0_14px_rgba(217,119,6,0.4)]',
      avatarTextClass: 'text-amber-400',
      tierBadgeBorderClass: 'border-amber-700',
      diamondBadgeClass: 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 border border-amber-400',
      diamondTextClass: 'text-white',
      playerPillClass: 'bg-amber-700 text-white',
      expTextClass: 'text-amber-400',
      defaultCover: '/assets/leaderboard/top3_podium_bg.jpg',
      sway: {
        rotate: [-1.3, 1.3, -1.3],
        skewX: [-0.5, 0.5, -0.5],
        duration: 4.9,
        delay: 1.1,
      },
    },
  } as const;

  // Helper render Lá Cờ Chiến Trận Treo Dọc (Hanging War Banner)
  const renderHangingBanner = (c: Combatant | undefined, rankPos: 1 | 2 | 3) => {
    const config = BANNER_CONFIG[rankPos];

    if (!c) {
      // Ô cờ trống khi chưa có người chiếm giữ
      return (
        <div key={`banner-empty-${rankPos}`} className="flex flex-col items-center w-full">
          {/* Móc treo giả lập */}
          <div className="flex justify-center items-center gap-3 sm:gap-6 -mb-1 relative z-30 pointer-events-none">
            <div className="w-2 h-3 sm:w-2.5 sm:h-3.5 rounded-sm bg-[#253745] border border-[#4A5C6A]" />
            <div className="w-2 h-3 sm:w-2.5 sm:h-3.5 rounded-sm bg-[#253745] border border-[#4A5C6A]" />
          </div>

          <div
            style={{ clipPath: PENNANT_CLIP_PATH }}
            className={`w-full ${config.heightClass} border-2 border-dashed border-[#253745] bg-[#11212D]/40 flex flex-col items-center justify-center text-center text-[#4A5C6A] p-2`}
          >
            <div className="w-8 h-8 rounded-full border border-[#253745] flex items-center justify-center text-xs font-bold mb-1">
              #{rankPos}
            </div>
            <span className="text-[10px] sm:text-xs text-[#4A5C6A]">Đang chờ Thợ Săn</span>
          </div>
        </div>
      );
    }

    const rankIdx = getRankIndexByExp(c.exp);
    const tier = RANK_TIERS[rankIdx];
    const isPlayer = c.isPlayer;
    const coverImage = c.cover_url || c.coverUrl || config.defaultCover;

    return (
      <motion.div
        key={c.id}
        id={isPlayer ? 'my-rank-card' : undefined}
        style={{ transformOrigin: 'top center' }}
        animate={{
          rotate: [...config.sway.rotate],
          skewX: [...config.sway.skewX],
        }}
        transition={{
          duration: config.sway.duration,
          delay: config.sway.delay,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        onClick={() => handleSelectHunter(c, rankPos)}
        className={`flex flex-col items-center w-full cursor-pointer group relative ${
          isPlayer && highlightMyCard ? 'ring-2 ring-[#CCD0CF] rounded-t-xl scale-[1.03] transition-transform' : ''
        }`}
      >
        {/* Móc treo kim loại kết nối với thanh xà ngang */}
        <div className="flex justify-center items-center gap-3 sm:gap-6 -mb-1 relative z-30 pointer-events-none">
          <div className="w-2 h-3 sm:w-2.5 sm:h-3.5 rounded-sm bg-gradient-to-b from-[#64748B] via-[#334155] to-[#1E293B] border border-[#9BA8AB]/40 shadow-sm" />
          <div className="w-2 h-3 sm:w-2.5 sm:h-3.5 rounded-sm bg-gradient-to-b from-[#64748B] via-[#334155] to-[#1E293B] border border-[#9BA8AB]/40 shadow-sm" />
        </div>

        {/* Wrapper có drop-shadow bao quanh toàn bộ hình cờ nhọn chữ V */}
        <div className={`w-full ${config.dropShadowClass} transition-transform duration-300 group-hover:scale-[1.02]`}>
          {/* Lớp Viền Cờ Ngoài Cùng (Clipped Pennant Border) */}
          <div
            style={{ clipPath: PENNANT_CLIP_PATH }}
            className={`w-full ${config.heightClass} p-[1.5px] sm:p-[2px] ${config.borderGradientClass}`}
          >
            {/* Lòng Lá Cờ (Thân cờ chính chứa ảnh bìa, avatar và thông tin) */}
            <div
              style={{ clipPath: PENNANT_CLIP_PATH }}
              className="w-full h-full relative overflow-hidden bg-[#0c1822] flex flex-col justify-between items-center pt-2.5 sm:pt-3.5 pb-8 sm:pb-10 px-1.5 sm:px-2.5 text-center select-none"
            >
              {/* 1. Ảnh Bìa Cá Nhân / Dark Fantasy Wallpaper Phủ Kín Cờ */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <img
                  src={coverImage}
                  alt={c.name}
                  className="w-full h-full object-cover object-center select-none group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                {/* Lớp Gradient Tông Trầm & Ám Sắc Theo Hạng */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#06141B]/45 via-[#06141B]/35 to-[#06141B]/90" />
                <div className={`absolute inset-0 ${config.tintClass}`} />
              </div>

              {/* 2. Sóng Ánh Sáng Lướt Mặt Vải (Cloth Wave Light Ripple) */}
              <motion.div
                animate={{
                  opacity: [0.1, 0.35, 0.1],
                  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                }}
                transition={{
                  duration: config.sway.duration * 0.85,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent pointer-events-none z-10"
              />

              {/* 3. Đỉnh Lá Cờ: Vương miện vàng nhỏ (Dành riêng cho Hạng #1) */}
              <div className="relative z-20 flex flex-col items-center w-full h-4 sm:h-5">
                {rankPos === 1 && (
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 drop-shadow-[0_2px_8px_rgba(245,158,11,0.7)] animate-bounce" />
                )}
              </div>

              {/* 4. Avatar Tròn Nằm Chính Giữa Thân Cờ (Center Avatar) */}
              <div className="relative z-20 my-auto shrink-0 flex flex-col items-center">
                {/* Ánh Hào Quang Tỏa Ra Phía Sau Avatar */}
                <div className={`absolute inset-0 rounded-full ${config.auraClass} blur-md scale-110 pointer-events-none`} />

                <div
                  className={`relative ${config.avatarSizeClass} rounded-full ${config.avatarRingClass} overflow-hidden bg-[#06141B] flex items-center justify-center shrink-0 aspect-square shadow-lg`}
                >
                  {isAvatarUrl(c.avatar) ? (
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="w-full h-full object-cover rounded-full aspect-square"
                      loading="lazy"
                    />
                  ) : (
                    <span className={`text-base sm:text-2xl font-black ${config.avatarTextClass}`}>
                      {(c.name || 'T').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Huy hiệu Bậc Rank góc trên bên trái */}
                <div
                  className={`absolute -top-1 -left-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#06141B] border ${config.tierBadgeBorderClass} p-0.5 flex items-center justify-center shadow-md z-30 shrink-0`}
                >
                  <img
                    src={tier.iconUrl}
                    alt={tier.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Huy hiệu Kim Cương số thứ hạng ngay mép dưới Avatar */}
                <div
                  className={`absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 sm:w-5 sm:h-5 rotate-45 ${config.diamondBadgeClass} flex items-center justify-center shadow-lg z-30 shrink-0`}
                >
                  <span className={`-rotate-45 font-black text-[10px] sm:text-xs ${config.diamondTextClass}`}>
                    {rankPos}
                  </span>
                </div>
              </div>

              {/* 5. Cụm Thông Tin Đáy Cờ (Bảng Tên & EXP nằm gọn trên mũi chữ V) */}
              <div className="relative z-20 flex flex-col items-center w-full px-0.5">
                <h3 className="text-[11px] sm:text-sm md:text-base font-extrabold text-[#CCD0CF] truncate max-w-[95%] text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] group-hover:text-white transition">
                  {c.name}
                  {isPlayer && (
                    <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black ${config.playerPillClass} shadow`}>
                      BẠN
                    </span>
                  )}
                </h3>

                {/* Danh hiệu đang trang bị */}
                <div className="mt-0.5 flex justify-center max-w-[90%] truncate">
                  {renderTitlePill(c.title)}
                </div>

                {/* Khung Điểm EXP (Pill viền mảnh sang trọng) */}
                <div className="mt-1 sm:mt-1.5 w-full max-w-[96%] py-0.5 sm:py-1 px-1 sm:px-2 rounded-full bg-[#06141B]/90 border border-[#4A5C6A]/60 text-center shadow-inner backdrop-blur-sm">
                  <span className={`text-[9px] sm:text-xs font-mono font-bold truncate block ${config.expTextClass}`}>
                    ✨ {c.exp.toLocaleString('vi-VN')} <span className="text-[8px] sm:text-[9px] opacity-75 font-normal">EXP</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
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

      {/* Sảnh Cờ Vinh Quang: Thanh Treo Kim Loại & 3 Lá Cờ Chiến Trận ([#2] - [#1] - [#3]) */}
      <div className="pt-2 pb-6">
        {/* Thanh xà treo cờ kim loại phía trên */}
        <div className="relative w-full flex items-center justify-center mb-0">
          <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-[#4A5C6A] to-transparent rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#9BA8AB]/40 to-transparent" />
        </div>

        {/* Cụm 3 Lá Cờ Chiến Trận Treo Dọc (Hanging War Banners) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 items-start">
          {renderHangingBanner(podiumPlayers[1], 2)}
          {renderHangingBanner(podiumPlayers[0], 1)}
          {renderHangingBanner(podiumPlayers[2], 3)}
        </div>
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
                className={`bg-[#11212D]/90 hover:bg-[#253745]/50 border rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-2.5 sm:gap-3 transition-all cursor-pointer group ${
                  isUser
                    ? `border-[#9BA8AB]/70 bg-[#253745]/60 shadow-[0_0_15px_rgba(155,168,171,0.2)] ring-1 ring-[#9BA8AB]/40 ${
                        highlightMyCard ? 'ring-2 ring-[#CCD0CF] scale-[1.01]' : ''
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
