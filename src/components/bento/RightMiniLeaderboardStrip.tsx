import React, { useState, useEffect } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { fetchCommunityLeaderboard, HunterProfileCloud } from '../../utils/syncManager';
import { Trophy, ChevronRight } from 'lucide-react';

export const RightMiniLeaderboardStrip: React.FC = () => {
  const { playerName, avatarUrl, exp, rivals, hunterId, setActiveTab, userRole } = useFaeQuestStore();
  const [communityProfiles, setCommunityProfiles] = useState<HunterProfileCloud[]>([]);

  // Tải dữ liệu BXH thật từ Supabase
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
    return () => {
      isMounted = false;
    };
  }, [exp]);

  // 1. Hồ sơ trực tiếp (live state) của người dùng hiện tại
  const myCombatant = {
    id: hunterId || 'player_me',
    name: playerName,
    exp,
    avatar: avatarUrl || null,
    isPlayer: true,
  };

  // 2. Thợ săn thật từ bảng profiles Supabase (loại trừ tài khoản hiện tại để tránh trùng)
  const otherCommunity = communityProfiles
    .filter((p) => p.id !== hunterId)
    .map((p) => ({
      id: p.id,
      name: p.username || 'Thợ Săn Ẩn Danh',
      exp: p.exp || 0,
      avatar: p.avatar_url || null,
      isPlayer: false,
    }));

  // 3. Dự phòng đối thủ AI nếu chưa đủ 5 người chơi
  const aiCombatants = rivals.map((r) => ({
    id: r.id,
    name: r.name,
    exp: r.exp,
    avatar:
      r.avatar &&
      (r.avatar.startsWith('http') || r.avatar.startsWith('/') || r.avatar.startsWith('data:'))
        ? r.avatar
        : null,
    isPlayer: false,
  }));

  // Hợp nhất và sắp xếp giảm dần theo EXP (Tài khoản Admin không tham gia đua top)
  let combined = userRole === 'admin' ? [...otherCommunity] : [myCombatant, ...otherCommunity];
  if (combined.length < 5) {
    const needed = 5 - combined.length;
    combined = [...combined, ...aiCombatants.slice(0, needed)];
  }

  const allCombatants = combined.sort((a, b) => b.exp - a.exp);

  // Vị trí thứ hạng chính xác 100% của người dùng trên BXH tổng
  const userRankIndex = allCombatants.findIndex((c) => c.isPlayer);
  const myRank = userRankIndex !== -1 ? userRankIndex + 1 : 1;
  const myRankTier = RANK_TIERS[getRankIndexByExp(exp)];

  // Top 5 Thợ Săn dẫn đầu
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
    <aside
      onClick={() => setActiveTab('leaderboard')}
      className="hidden xl:flex flex-col items-center py-5 px-2.5 w-16 shrink-0 rounded-[28px] bg-[#11212D] border border-[#253745] shadow-[0_12px_36px_rgba(0,0,0,0.6)] hover:border-[#4A5C6A] transition-all duration-300 cursor-pointer group"
      title="Nhấn để mở Bảng Xếp Hạng Đấu Trường"
    >
      {/* Top: User's Own Avatar with Real Live Rank */}
      <div className="relative group/user flex flex-col items-center">
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

        <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#CCD0CF] via-[#4A5C6A] to-[#253745] shadow-lg shadow-black/40 group-hover:scale-105 transition relative">
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
      <div className="flex flex-col items-center text-[#9BA8AB] group-hover:text-[#CCD0CF] transition mb-2">
        <Trophy className="w-3.5 h-3.5" />
        <span className="text-[8px] font-bold uppercase tracking-tighter mt-0.5">TOP</span>
      </div>

      {/* Top 5 Combatants Vertical Stack */}
      <div className="space-y-3 flex-1 flex flex-col items-center">
        {top5.map((c, index) => {
          const cRankIdx = getRankIndexByExp(c.exp);
          const cTier = RANK_TIERS[cRankIdx];

          return (
            <div
              key={c.id}
              className="relative group/item flex flex-col items-center"
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

      {/* Bottom Arrow Hint */}
      <div className="pt-2 text-[#9BA8AB] group-hover:text-[#CCD0CF] transition flex flex-col items-center">
        <ChevronRight className="w-4 h-4" />
      </div>
    </aside>
  );
};
