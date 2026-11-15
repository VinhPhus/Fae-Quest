import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { SYSTEM_TITLES } from '../../constants/systemQuests';
import { RivalTargetBanner } from './RivalTargetBanner';
import { Trophy, RefreshCw, UserPlus, Swords } from 'lucide-react';

export const LeaderboardTable: React.FC = () => {
  const {
    playerName,
    avatarUrl,
    exp,
    rivals,
    equippedTitleId,
    simulateRivalActivity,
    setAddRivalOpen,
  } = useFaeQuestStore();

  const playerTitle = (SYSTEM_TITLES[equippedTitleId] || SYSTEM_TITLES.title_tan_binh_gai_do).name;

  const allCombatants = [
    {
      id: 'player_me',
      name: playerName,
      title: playerTitle,
      exp,
      avatar: avatarUrl || '🛡️',
      isPlayer: true,
    },
    ...rivals.map((r) => ({
      ...r,
      isPlayer: false,
    })),
  ].sort((a, b) => b.exp - a.exp);

  return (
    <div className="space-y-6">
      {/* Leaderboard Header Banner */}
      <div className="rpg-card rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-opal/30 border border-opal-light/50 text-xs font-bold text-parchment">
            <Swords className="w-3.5 h-3.5 text-fae" />
            <span>Đấu Trường Danh Vọng</span>
          </div>
          <h2 className="text-2xl font-extrabold text-parchment">Bảng Xếp Hạng Chiến Binh</h2>
          <p className="text-sm text-parchment/75 max-w-2xl">
            So tài cùng các đối thủ giả lập từ bậc <strong className="text-fae-light">Đồng</strong> đến{' '}
            <strong className="text-fae-light">Thách Đấu</strong>. Hãy hoàn thành nhiệm vụ mỗi ngày để
            vượt mặt các đối thủ phía trước!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={simulateRivalActivity}
            className="px-4 py-2.5 rounded-xl rpg-btn-opal text-xs font-bold text-parchment flex items-center gap-2 shadow"
          >
            <RefreshCw className="w-4 h-4 text-fae" />
            <span>Cập Nhật Hoạt Động Đối Thủ</span>
          </button>
          <button
            onClick={() => setAddRivalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-bargain hover:bg-bargain-light border border-fae/40 text-xs font-bold text-parchment flex items-center gap-2 transition shadow"
          >
            <UserPlus className="w-4 h-4 text-fae" />
            <span>Thêm Đối Thủ Mới</span>
          </button>
        </div>
      </div>

      {/* Target Banner */}
      <RivalTargetBanner />

      {/* Leaderboard List */}
      <div className="rpg-card rounded-3xl overflow-hidden border border-opal/30 shadow-2xl">
        <div className="px-6 py-4 bg-thorn-dark/90 border-b border-parchment/10 grid grid-cols-12 text-xs font-bold uppercase tracking-wider text-parchment/60">
          <div className="col-span-2 sm:col-span-1">Hạng</div>
          <div className="col-span-6 sm:col-span-5">Chiến Binh</div>
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

                {/* Name & Title */}
                <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-thorn-dark/90 border border-opal/40 flex items-center justify-center text-xl shrink-0 shadow-inner overflow-hidden">
                    {c.isPlayer && avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={c.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      c.avatar
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-parchment truncate">{c.name}</p>
                      {c.isPlayer && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-fae text-thorn-dark shadow">
                          BẠN
                        </span>
                      )}
                    </div>
                    {(() => {
                      const matchingTitle = Object.values(SYSTEM_TITLES).find((t) => t.name === c.title);
                      if (matchingTitle) {
                        return (
                          <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${matchingTitle.color}`}>
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
