import React, { useState, useEffect } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { SYSTEM_TITLES } from '../../constants/systemQuests';
import { RivalTargetBanner } from './RivalTargetBanner';
import { fetchCommunityLeaderboard, HunterProfileCloud } from '../../utils/syncManager';
import { Trophy, RefreshCw, UserPlus, Swords, Globe, Bot, ShieldCheck } from 'lucide-react';

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
  } = useFaeQuestStore();

  const [communityProfiles, setCommunityProfiles] = useState<HunterProfileCloud[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const playerTitle = (SYSTEM_TITLES[equippedTitleId] || SYSTEM_TITLES.title_tan_binh_gai_do).name;

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
      const matchingTitle = SYSTEM_TITLES[p.equipped_title];
      return {
        id: p.id,
        name: p.username,
        title: matchingTitle ? matchingTitle.name : 'Tân Binh Gai Đỏ',
        exp: p.exp,
        avatar: p.avatar_url || '⚔️',
        isPlayer: false,
        isCommunity: true,
      };
    });

  const communityCombatants = [myCombatant, ...otherCommunityCombatants];

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
      {/* Leaderboard Header Banner */}
      <div className="rpg-card rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-opal/30 border border-opal-light/50 text-xs font-bold text-parchment">
            <Swords className="w-3.5 h-3.5 text-fae" />
            <span>Đấu Trường Danh Vọng • Supabase Realtime</span>
          </div>
          <h2 className="text-2xl font-extrabold text-parchment">Bảng Xếp Hạng Thợ Săn</h2>
          <p className="text-sm text-parchment/75 max-w-2xl leading-relaxed">
            BXH Cộng Đồng kết nối trực tiếp với đám mây Supabase (Top 50). Hoàn thành nhiệm vụ kỷ luật mỗi ngày để vươn lên ngôi vị Thách Đấu!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadLeaderboard}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl rpg-btn-primary text-xs font-bold text-parchment flex items-center gap-2 shadow hover:scale-105 transition disabled:opacity-50"
            title="Tải lại BXH cộng đồng từ Supabase"
          >
            <RefreshCw className={`w-4 h-4 text-parchment ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Đang tải...' : 'Làm Mới BXH Cloud'}</span>
          </button>
          <button
            onClick={simulateRivalActivity}
            className="px-3.5 py-2.5 rounded-xl rpg-btn-opal text-xs font-bold text-parchment flex items-center gap-1.5 shadow"
            title="Mô phỏng đối thủ AI tăng điểm EXP"
          >
            <Bot className="w-4 h-4 text-fae" />
            <span>Luyện Tập Với AI</span>
          </button>
          <button
            onClick={() => setAddRivalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-bargain hover:bg-bargain-light border border-fae/40 text-xs font-bold text-parchment flex items-center gap-1.5 transition shadow"
          >
            <UserPlus className="w-4 h-4 text-fae" />
            <span>Thêm Đối Thủ</span>
          </button>
        </div>
      </div>

      {/* Target Banner */}
      <RivalTargetBanner />

      {/* Leaderboard List */}
      <div className="rpg-card rounded-3xl overflow-hidden border border-opal/30 shadow-2xl">
        <div className="px-6 py-4 bg-thorn-dark/90 border-b border-parchment/10 grid grid-cols-12 text-xs font-bold uppercase tracking-wider text-parchment/60">
          <div className="col-span-2 sm:col-span-1">Hạng</div>
          <div className="col-span-6 sm:col-span-5">Thợ Săn</div>
          <div className="col-span-4 sm:col-span-3 text-center">Bậc Rank</div>
          <div className="hidden sm:block sm:col-span-3 text-right">Điểm EXP</div>
        </div>

        <div className="divide-y divide-parchment/10">
          {allCombatants.map((c, idx) => {
            const rankPos = idx + 1;
            const rankIdx = getRankIndexByExp(c.exp);
            const tier = RANK_TIERS[rankIdx];

            let rankBadge = (
              <span className="font-extrabold text-sm text-parchment/70">#{rankPos}</span>
            );
            if (rankPos === 1) {
              rankBadge = (
                <span className="w-7 h-7 rounded-full bg-amber-400 text-thorn-dark font-black text-xs flex items-center justify-center shadow">
                  1
                </span>
              );
            } else if (rankPos === 2) {
              rankBadge = (
                <span className="w-7 h-7 rounded-full bg-slate-300 text-thorn-dark font-black text-xs flex items-center justify-center shadow">
                  2
                </span>
              );
            } else if (rankPos === 3) {
              rankBadge = (
                <span className="w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow">
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
                className={`px-6 py-4 grid grid-cols-12 items-center transition ${
                  c.isPlayer
                    ? 'bg-gradient-to-r from-bargain via-bargain-light/40 to-transparent border-l-4 border-l-fae'
                    : 'hover:bg-thorn-dark/40'
                }`}
              >
                {/* Rank Pos */}
                <div className="col-span-2 sm:col-span-1 flex items-center">{rankBadge}</div>

                {/* Name & Title & Tags */}
                <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-thorn-dark/90 border border-opal/40 flex items-center justify-center text-xl shrink-0 shadow-inner overflow-hidden">
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-parchment truncate">{c.name}</p>
                      {c.isPlayer ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-fae text-thorn-dark shadow">
                          BẠN
                        </span>
                      ) : c.isCommunity ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-0.5">
                          <Globe className="w-2.5 h-2.5" />
                          <span>Cộng Đồng</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center gap-0.5">
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
                            className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${matchingTitle.color}`}
                          >
                            {matchingTitle.iconUrl ? (
                              <img
                                src={matchingTitle.iconUrl}
                                alt={matchingTitle.name}
                                className="w-4 h-4 object-contain shrink-0 drop-shadow"
                                loading="lazy"
                              />
                            ) : (
                              <span>{matchingTitle.icon}</span>
                            )}
                            <span className="truncate">{c.title}</span>
                          </div>
                        );
                      }
                      return <p className="text-xs text-parchment/60 truncate">{c.title}</p>;
                    })()}
                  </div>
                </div>

                {/* Rank Tier Badge */}
                <div className="col-span-4 sm:col-span-3 flex items-center justify-center gap-2">
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

                {/* EXP */}
                <div className="hidden sm:block sm:col-span-3 text-right">
                  <span className="text-sm font-extrabold text-fae">{c.exp.toLocaleString()}</span>
                  <span className="text-xs text-parchment/60 ml-1">EXP</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
