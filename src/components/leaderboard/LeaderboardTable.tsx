import React, { useState, useEffect } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { SYSTEM_TITLES, resolveTitleObject } from '../../constants/systemQuests';
import { RivalTargetBanner } from './RivalTargetBanner';
import { fetchCommunityLeaderboard, HunterProfileCloud } from '../../utils/syncManager';
import { Trophy, RefreshCw, UserPlus, Swords, Globe, Bot, ShieldCheck } from 'lucide-react';

export const LeaderboardHeader: React.FC = () => {
  const { userRole, simulateRivalActivity, setAddRivalOpen, syncToCloud } = useFaeQuestStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    await syncToCloud(true);
    window.dispatchEvent(new CustomEvent('faequest:reload_leaderboard'));
    setTimeout(() => setIsLoading(false), 800);
  };

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
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#CCD0CF] font-rpg tracking-wide">Bảng Xếp Hạng Thợ Săn</h2>
          <p className="text-xs text-[#9BA8AB] max-w-2xl leading-relaxed hidden sm:block">
            {userRole === 'admin'
              ? 'Tài khoản Quản Trị Viên được tự động ẩn khỏi BXH để bảo toàn tính minh bạch và công bằng cho Đấu Trường.'
              : 'BXH Cộng Đồng kết nối trực tiếp với đám mây Supabase (Top 50). Hoàn thành nhiệm vụ kỷ luật mỗi ngày để vươn lên ngôi vị Thách Đấu!'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-[#CCD0CF] hover:bg-white text-[#06141B] text-xs font-extrabold flex items-center gap-1.5 shadow active:scale-95 transition cursor-pointer disabled:opacity-50"
            title="Tải lại BXH cộng đồng từ Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Đang tải...' : 'Làm Mới BXH'}</span>
          </button>
          <button
            type="button"
            onClick={simulateRivalActivity}
            className="px-3 py-2 rounded-xl bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
            title="Mô phỏng đối thủ AI tăng điểm EXP"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>Luyện Tập Với AI</span>
          </button>
          <button
            type="button"
            onClick={() => setAddRivalOpen(true)}
            className="px-3 py-2 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] border border-[#4A5C6A] text-xs font-bold text-[#CCD0CF] flex items-center gap-1.5 transition shadow cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-300" />
            <span>Thêm Đối Thủ</span>
          </button>
        </div>
      </div>

      {/* Target Banner */}
      <RivalTargetBanner />
    </div>
  );
};

export const LeaderboardTable: React.FC = () => {
  const {
    playerName,
    avatarUrl,
    exp,
    rivals,
    equippedTitleId,
    hunterId,
    simulateRivalActivity,
    setAddRivalOpen,
    syncToCloud,
    userRole,
  } = useFaeQuestStore();

  const [communityProfiles, setCommunityProfiles] = useState<HunterProfileCloud[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const playerTitle = resolveTitleObject(equippedTitleId).name;

  const loadLeaderboard = async () => {
    setIsLoading(true);
    // Đồng bộ trạng thái mới nhất của bạn lên Supabase trước khi tải lại
    await syncToCloud(true);
    const res = await fetchCommunityLeaderboard(50);
    setCommunityProfiles(res.profiles || []);
    setIsLoading(false);
    setLastRefreshed(new Date().toLocaleTimeString('vi-VN'));
  };

  useEffect(() => {
    loadLeaderboard();
    const handleReload = () => loadLeaderboard();
    window.addEventListener('faequest:reload_leaderboard', handleReload);
    return () => window.removeEventListener('faequest:reload_leaderboard', handleReload);
  }, []);

  // 1. Dữ liệu của người dùng hiện tại
  const myCombatant = {
    id: hunterId || 'player_me',
    name: playerName,
    title: playerTitle,
    exp,
    avatar: avatarUrl || '🛡️',
    isPlayer: true,
    isCommunity: true,
  };

  // 2. Dữ liệu thợ săn cộng đồng từ Supabase (loại bỏ chính mình để tránh trùng lặp)
  const otherCommunityCombatants = communityProfiles
    .filter((p) => p.id !== hunterId)
    .map((p) => {
      const matchingTitle = resolveTitleObject(p.equipped_title);
      return {
        id: p.id,
        name: p.username,
        title: matchingTitle.name,
        exp: p.exp,
        avatar: p.avatar_url || '⚔️',
        isPlayer: false,
        isCommunity: true,
      };
    });

  // Nếu là Admin, ẩn hoàn toàn tài khoản của mình khỏi Đấu Trường BXH
  const communityCombatants = userRole === 'admin'
    ? otherCommunityCombatants
    : [myCombatant, ...otherCommunityCombatants];

  // 3. Đối thủ AI dự phòng
  const aiCombatants = rivals.map((r) => ({
    id: r.id,
    name: r.name,
    title: r.title,
    exp: r.exp,
    avatar: r.avatar,
    isPlayer: false,
    isCommunity: false,
  }));

  // Kết hợp: Nếu số lượng người chơi thật < 10, bổ sung thêm các đối thủ AI để bảng luôn đủ 10 bậc
  let combined = [...communityCombatants];
  if (communityCombatants.length < 10) {
    const slotsNeeded = 10 - communityCombatants.length;
    combined = [...communityCombatants, ...aiCombatants.slice(0, slotsNeeded)];
  }

  const allCombatants = combined.sort((a, b) => b.exp - a.exp);

  return (
    <div className="space-y-6">
      {/* Leaderboard List */}
      <div className="rpg-card rounded-2xl sm:rounded-3xl overflow-hidden border border-opal/30 shadow-2xl">
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 bg-thorn-dark/90 border-b border-parchment/10 flex items-center justify-between sm:grid sm:grid-cols-12 text-xs font-bold uppercase tracking-wider text-parchment/60">
          <div className="hidden sm:block sm:col-span-1">Hạng</div>
          <div className="flex-1 sm:col-span-5">Thợ Săn</div>
          <div className="hidden sm:block sm:col-span-3 text-center">Bậc Rank</div>
          <div className="hidden sm:block sm:col-span-3 text-right">Điểm EXP</div>
          <div className="sm:hidden text-right text-fae">Bậc & EXP</div>
        </div>

        <div className="divide-y divide-parchment/10">
          {allCombatants.map((c, idx) => {
            const rankPos = idx + 1;
            const rankIdx = getRankIndexByExp(c.exp);
            const tier = RANK_TIERS[rankIdx];

            let rankBadge = (
              <span className="font-extrabold text-xs sm:text-sm text-parchment/70">#{rankPos}</span>
            );
            if (rankPos === 1) {
              rankBadge = (
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400 text-thorn-dark font-black text-[11px] sm:text-xs flex items-center justify-center shadow">
                  1
                </span>
              );
            } else if (rankPos === 2) {
              rankBadge = (
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-300 text-thorn-dark font-black text-[11px] sm:text-xs flex items-center justify-center shadow">
                  2
                </span>
              );
            } else if (rankPos === 3) {
              rankBadge = (
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-700 text-white font-black text-[11px] sm:text-xs flex items-center justify-center shadow">
                  3
                </span>
              );
            }

            const isAvatarUrl =
              typeof c.avatar === 'string' &&
              (c.avatar.startsWith('http') || c.avatar.startsWith('/'));

            return (
              <div
                key={c.id}
                className={`px-3.5 sm:px-6 py-3 sm:py-4 flex items-center justify-between sm:grid sm:grid-cols-12 gap-2 sm:gap-0 transition ${c.isPlayer
                  ? 'bg-gradient-to-r from-bargain via-bargain-light/40 to-transparent border-l-4 border-l-fae'
                  : 'hover:bg-thorn-dark/40'
                  }`}
              >
                {/* Desktop: Rank Pos (1 col) */}
                <div className="hidden sm:flex sm:col-span-1 items-center">{rankBadge}</div>

                {/* Name & Title & Tags (Mobile: flex row with Rank and Avatar / Desktop: 5 cols) */}
                <div className="flex items-center gap-2.5 sm:gap-3 flex-1 sm:col-span-5 min-w-0">
                  <div className="sm:hidden flex items-center shrink-0">{rankBadge}</div>

                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-thorn-dark/90 border border-opal/40 flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-inner overflow-hidden">
                    {isAvatarUrl ? (
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span>{c.avatar || '⚔️'}</span>
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs sm:text-sm font-bold text-parchment truncate">{c.name}</p>
                      {c.isPlayer ? (
                        <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-fae text-thorn-dark shadow">
                          BẠN
                        </span>
                      ) : c.isCommunity ? (
                        <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 items-center gap-0.5">
                          <Globe className="w-2.5 h-2.5" />
                          <span>Cộng Đồng</span>
                        </span>
                      ) : (
                        <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-400/30 items-center gap-0.5">
                          <Bot className="w-2.5 h-2.5" />
                          <span>AI</span>
                        </span>
                      )}
                    </div>

                    {(() => {
                      const matchingTitle = Object.values(SYSTEM_TITLES).find(
                        (t) => t.name === c.title
                      );
                      if (matchingTitle) {
                        return (
                          <div
                            className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold ${matchingTitle.color}`}
                          >
                            {matchingTitle.iconUrl ? (
                              <img
                                src={matchingTitle.iconUrl}
                                alt={matchingTitle.name}
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain shrink-0 drop-shadow"
                                loading="lazy"
                              />
                            ) : (
                              <span>{matchingTitle.icon}</span>
                            )}
                            <span className="truncate max-w-[120px] sm:max-w-none">{c.title}</span>
                          </div>
                        );
                      }
                      return <p className="text-[10px] sm:text-xs text-parchment/60 truncate">{c.title}</p>;
                    })()}
                  </div>
                </div>

                {/* Desktop: Rank Tier Badge (3 cols) */}
                <div className="hidden sm:flex sm:col-span-3 items-center justify-center gap-2">
                  <img
                    src={tier.iconUrl}
                    alt={tier.name}
                    className="w-7 h-7 object-contain select-none rank-badge-interactive drop-shadow"
                    loading="lazy"
                  />
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold border border-parchment/20 bg-gradient-to-r ${tier.badgeBg} text-parchment shadow-sm`}
                  >
                    {tier.name}
                  </span>
                </div>

                {/* Desktop: EXP (3 cols) */}
                <div className="hidden sm:block sm:col-span-3 text-right">
                  <span className="text-sm font-extrabold text-fae">{c.exp.toLocaleString()}</span>
                  <span className="text-xs text-parchment/60 ml-1">EXP</span>
                </div>

                {/* Mobile Right Block: Compact Rank Badge + EXP on same row */}
                <div className="sm:hidden flex flex-col items-end shrink-0 pl-1">
                  <div className="flex items-center gap-1">
                    <img
                      src={tier.iconUrl}
                      alt={tier.name}
                      className="w-4 h-4 object-contain"
                      loading="lazy"
                    />
                    <span className="text-[10px] font-bold text-parchment">{tier.name}</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-fae">
                    {c.exp.toLocaleString()} <span className="text-[9px] text-parchment/60 font-normal">EXP</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
