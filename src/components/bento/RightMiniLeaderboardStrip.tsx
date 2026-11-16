import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { Trophy, ChevronRight } from 'lucide-react';

export const RightMiniLeaderboardStrip: React.FC = () => {
  const { playerName, avatarUrl, exp, rivals, setActiveTab } = useFaeQuestStore();

  const allCombatants = [
    {
      id: 'me',
      name: playerName,
      exp,
      avatar: avatarUrl,
      isPlayer: true,
    },
    ...rivals.map((r) => ({
      id: r.id,
      name: r.name,
      exp: r.exp,
      avatar: r.avatar,
      isPlayer: false,
    })),
  ].sort((a, b) => b.exp - a.exp);

  const top5 = allCombatants.slice(0, 5);

  return (
    <aside
      onClick={() => setActiveTab('leaderboard')}
      className="hidden xl:flex flex-col items-center py-5 px-2.5 w-16 shrink-0 rounded-[28px] bg-[#11212D] border border-[#253745] shadow-[0_12px_36px_rgba(0,0,0,0.6)] hover:border-[#4A5C6A] transition-all duration-300 cursor-pointer group"
      title="Nhấn để mở Bảng Xếp Hạng Đấu Trường"
    >
      {/* Top: User's Own Avatar with Glowing Ring */}
      <div className="relative group/avatar">
        <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#CCD0CF] via-[#4A5C6A] to-[#253745] shadow-lg shadow-black/40 group-hover:scale-105 transition">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={playerName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-[#06141B] flex items-center justify-center text-xs font-black text-[#CCD0CF]">
              {playerName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {/* Status Dot */}
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#11212D]" />
      </div>

      <span className="text-[9px] font-black tracking-widest text-[#CCD0CF] uppercase mt-1">
        BẠN
      </span>

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
              title={`#${index + 1} ${c.name} • ${c.exp} EXP (${cTier.name})`}
            >
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
                {c.avatar && c.avatar.startsWith('http') ? (
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-[#CCD0CF]">
                    {c.avatar || c.name.charAt(0).toUpperCase()}
                  </span>
                )}

                {/* Rank Pos Badge */}
                <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-[#11212D] border border-[#253745] text-[9px] font-extrabold text-[#CCD0CF] flex items-center justify-center">
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
      <div className="pt-2 text-[#9BA8AB] group-hover:text-[#CCD0CF] transition">
        <ChevronRight className="w-4 h-4" />
      </div>
    </aside>
  );
};
