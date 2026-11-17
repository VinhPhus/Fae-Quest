import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { fetchCommunityLeaderboard, HunterProfileCloud } from '../../utils/syncManager';
import { Trophy, ChevronRight } from 'lucide-react';
import { EASING_SPRING } from '../../constants/motion';

export const RightMiniLeaderboardStrip: React.FC = () => {
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
    communityProfiles: storeProfiles,
    fetchCommunityProfiles,
    setActiveTab,
    userRole,
    openRivalModal,
  } = useFaeQuestStore();
  const [communityProfiles, setCommunityProfiles] = useState<HunterProfileCloud[]>([]);

  // Tải dữ liệu BXH thật từ Supabase & Lắng nghe sự kiện Realtime
  useEffect(() => {
    let isMounted = true;
    const loadLeaderboardData = async () => {
      try {
        const res = await fetchCommunityLeaderboard(50);
        if (isMounted && res.profiles) {
          setCommunityProfiles(res.profiles);
        }
      } catch (err) {
        console.error('Error fetching mini leaderboard:', err);
      }
    };
    loadLeaderboardData();

    const handleReload = () => {
      if (isMounted) loadLeaderboardData();
    };
    window.addEventListener('faequest:reload_leaderboard', handleReload);

    return () => {
      isMounted = false;
      window.removeEventListener('faequest:reload_leaderboard', handleReload);
    };
  }, [exp]);

  const activeProfiles = communityProfiles.length > 0 ? communityProfiles : storeProfiles;

  // 1. Hồ sơ trực tiếp (live state) của người dùng hiện tại
  const myCombatant = {
    id: hunterId || 'player_me',
    name: playerName,
    exp: typeof exp === 'number' ? exp : 0,
    avatar: avatarUrl || null,
    coverUrl: coverUrl || null,
    cover_url: coverUrl || null,
    streak: streakDays,
    completedTasks: completedTotal,
    equippedTitle: equippedTitleId,
    stars: stars || 0,
    isPlayer: true,
  };

  // 2. Thợ săn thật từ bảng profiles Supabase (loại trừ tài khoản hiện tại để tránh trùng/lẫn lộn)
  const myIdentifier = hunterId;
  const otherCommunity = (activeProfiles || [])
    .filter((p) => p.id !== myIdentifier && p.role !== 'admin')
    .map((p) => ({
      id: p.id,
      name: p.username || 'Thợ Săn Ẩn Danh',
      exp: typeof p.exp === 'number' ? p.exp : 0,
      avatar: p.avatar_url || null,
      coverUrl: p.cover_url || null,
      cover_url: p.cover_url || null,
      streak: p.streak || 0,
      completedTasks: p.completed_tasks_count || 0,
      equippedTitle: p.equipped_title,
      stars: p.stars || 0,
      isPlayer: false,
    }));

  // Hợp nhất và sắp xếp giảm dần theo EXP (100% người chơi thật, Tài khoản Admin không tham gia đua top)
  const allCombatants = (userRole === 'admin'
    ? otherCommunity
    : [myCombatant, ...otherCommunity]
  ).sort((a, b) => b.exp - a.exp);

  // Vị trí thứ hạng chính xác 100% của người dùng trên BXH tổng
  const userRankIndex = allCombatants.findIndex((c) => c.isPlayer);
  const myRank = userRankIndex !== -1 ? userRankIndex + 1 : 1;
  const myRankTier = RANK_TIERS[getRankIndexByExp(exp)];

  // Top 5 Thợ Săn dẫn đầu (chỉ lấy tối đa 5 người chơi thật)
  const top5 = allCombatants.slice(0, 5);

  // Hàm render Avatar thật hoặc chữ cái đầu tiên (không dùng emoji giả)
  const renderAvatar = (name: string, url: string | null | undefined, sizeClass = 'w-full h-full') => {
    const hasValidImage =
      url && (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:'));

    if (hasValidImage) {
      return (
        <img
          src={url}
          alt={name}
          className={`${sizeClass} rounded-full object-cover`}
          onError={(e) => {
            // Fallback khi ảnh lỗi
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }

    const initial = name ? name.trim().charAt(0).toUpperCase() : '?';
    return (
      <div
        className={`${sizeClass} rounded-full bg-[#253745] flex items-center justify-center text-xs font-black text-[#CCD0CF]`}
      >
        {initial}
      </div>
    );
  };

  return (
    <motion.aside
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.35, delay: 0.15, ease: EASING_SPRING }}
      className="hidden xl:flex flex-col items-center py-5 px-2 w-16 shrink-0 h-screen sticky top-0 bg-[#06141B] border-l border-[#253745] shadow-2xl z-20 justify-between select-none"
    >
      {/* Top: User's Own Avatar with Real Live Rank */}
      <div
        onClick={() => {
          openRivalModal({
            id: myCombatant.id,
            name: myCombatant.name,
            avatarUrl: myCombatant.avatar,
            coverUrl: myCombatant.coverUrl,
            cover_url: myCombatant.cover_url || myCombatant.coverUrl,
            exp: myCombatant.exp,
            streak: myCombatant.streak,
            completedTasks: myCombatant.completedTasks,
            equippedTitle: myCombatant.equippedTitle,
            stars: myCombatant.stars,
            rankPos: userRole === 'admin' ? 0 : myRank,
            isPlayer: true,
          });
        }}
        className="relative group/user flex flex-col items-center cursor-pointer"
        title="Nhấn để xem thẻ hồ sơ của bạn"
      >
        {/* Tooltip for User */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-xl bg-[#06141B] border border-[#4A5C6A] shadow-[0_8px_24px_rgba(0,0,0,0.85)] opacity-0 group-hover/user:opacity-100 scale-95 group-hover/user:scale-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap flex items-center gap-2">
          {userRole === 'admin' ? (
            <>
              <span className="font-extrabold text-xs text-amber-300">🛡️ QUẢN TRỊ</span>
              <span className="text-xs font-bold text-[#CCD0CF]">{playerName}</span>
              <span className="text-[10px] text-[#9BA8AB]">•</span>
              <span className="text-[11px] text-amber-400 font-semibold">(Ẩn khỏi BXH Đua Top)</span>
            </>
          ) : (
            <>
              <span className="font-extrabold text-xs text-amber-400">#{myRank}</span>
              <span className="text-xs font-bold text-[#CCD0CF]">{playerName} (Bạn)</span>
              <span className="text-[10px] text-[#9BA8AB]">•</span>
              <span className="text-[11px] font-semibold text-[#CCD0CF]">{myRankTier.name}</span>
              <span className="text-[10px] text-[#9BA8AB]">•</span>
              <span className="text-[11px] font-mono text-[#CCD0CF]">{exp.toLocaleString()} EXP</span>
            </>
          )}
          <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#06141B] border-t border-r border-[#4A5C6A] rotate-45" />
        </div>

        <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#CCD0CF] via-[#4A5C6A] to-[#253745] shadow-lg shadow-black/40 group-hover/user:scale-105 transition relative">
          {renderAvatar(playerName, avatarUrl)}
          {/* Live Rank Badge on Avatar or Admin Badge */}
          {userRole === 'admin' ? (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500/30 border border-amber-400 text-[9px] font-black text-amber-300 flex items-center justify-center shadow">
              🛡️
            </span>
          ) : (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#06141B] border border-[#4A5C6A] text-[9px] font-black text-[#CCD0CF] flex items-center justify-center shadow">
              #{myRank}
            </span>
          )}
        </div>

        <span className={`text-[9px] font-black tracking-widest uppercase mt-1 ${userRole === 'admin' ? 'text-amber-300' : 'text-[#CCD0CF]'}`}>
          {userRole === 'admin' ? 'ADMIN' : 'BẠN'}
        </span>
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-[#253745] my-3" />

      {/* Header Mini Label */}
      <div className="flex flex-col items-center text-[#9BA8AB] transition mb-2">
        <Trophy className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[8px] font-bold uppercase tracking-tighter mt-0.5">TOP 5</span>
      </div>

      {/* Top 5 Combatants Vertical Stack */}
      <div className="space-y-3 flex-1 flex flex-col items-center">
        {top5.map((c, index) => {
          const cRankIdx = getRankIndexByExp(c.exp);
          const cTier = RANK_TIERS[cRankIdx];

          return (
            <div
              key={c.id}
              onClick={() => {
                openRivalModal({
                  id: c.id,
                  name: c.name,
                  avatarUrl: c.avatar,
                  coverUrl: c.coverUrl,
                  cover_url: c.cover_url || c.coverUrl,
                  exp: c.exp,
                  streak: c.streak,
                  completedTasks: c.completedTasks,
                  equippedTitle: c.equippedTitle,
                  stars: c.stars,
                  rankPos: index + 1,
                  isPlayer: c.isPlayer,
                });
              }}
              className="relative group/item flex flex-col items-center cursor-pointer"
              title={`Bấm để soi thẻ hồ sơ: ${c.name}`}
            >
              {/* Sleek Tooltip on Hover */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-xl bg-[#06141B] border border-[#4A5C6A] shadow-[0_8px_24px_rgba(0,0,0,0.85)] opacity-0 group-hover/item:opacity-100 scale-95 group-hover/item:scale-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap flex items-center gap-2">
                <span className="font-extrabold text-xs text-amber-400">#{index + 1}</span>
                <span className="text-xs font-bold text-[#CCD0CF]">{c.name}</span>
                <span className="text-[10px] text-[#9BA8AB]">•</span>
                <span className="text-[11px] font-semibold text-[#CCD0CF]">{cTier.name}</span>
                <span className="text-[10px] text-[#9BA8AB]">•</span>
                <span className="text-[11px] font-mono text-[#CCD0CF]">{c.exp.toLocaleString()} EXP</span>
                <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#06141B] border-t border-r border-[#4A5C6A] rotate-45" />
              </div>

              <div
                className={`w-9 h-9 rounded-full p-0.5 transition-transform hover:scale-110 flex items-center justify-center relative ${
                  index === 0
                    ? 'bg-gradient-to-tr from-amber-400 to-amber-600 shadow-md shadow-amber-400/30'
                    : index === 1
                    ? 'bg-gradient-to-tr from-slate-300 to-slate-500'
                    : index === 2
                    ? 'bg-gradient-to-tr from-amber-700 to-yellow-800'
                    : 'bg-[#06141B] border border-[#253745]'
                }`}
              >
                {renderAvatar(c.name, c.avatar)}

                {/* Rank Pos Badge */}
                <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-[#11212D] border border-[#253745] text-[9px] font-extrabold text-[#CCD0CF] flex items-center justify-center shadow">
                  {index + 1}
                </span>
              </div>

              {/* Status Dot Colored by Rank */}
              <span
                className="w-2 h-2 rounded-full mt-1 border border-[#11212D]"
                style={{ backgroundColor: cTier.accentColor || '#CCD0CF' }}
              />
            </div>
          );
        })}
      </div>

      {/* Bottom Arrow Button: Chuyển sang toàn trang Đấu Trường BXH */}
      <button
        type="button"
        onClick={() => setActiveTab('leaderboard')}
        className="pt-2 text-[#9BA8AB] hover:text-[#CCD0CF] transition flex flex-col items-center cursor-pointer group/btn"
        title="Mở toàn bộ Đấu Trường BXH"
      >
        <div className="w-8 h-8 rounded-full bg-[#11212D] border border-[#253745] group-hover/btn:border-[#4A5C6A] group-hover/btn:bg-[#253745] flex items-center justify-center transition shadow">
          <ChevronRight className="w-4 h-4 text-[#CCD0CF]" />
        </div>
      </button>
    </motion.aside>
  );
};
