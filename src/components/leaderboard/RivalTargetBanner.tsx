import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { Swords, Crown } from 'lucide-react';

export const RivalTargetBanner: React.FC = () => {
  const { playerName, exp, rivals } = useFaeQuestStore();

  const combatants = [
    { name: playerName, exp, isPlayer: true },
    ...rivals.map((r) => ({ name: r.name, exp: r.exp, isPlayer: false })),
  ].sort((a, b) => b.exp - a.exp);

  const playerIdx = combatants.findIndex((c) => c.isPlayer);
  const rivalAhead = playerIdx > 0 ? combatants[playerIdx - 1] : null;

  if (!rivalAhead) {
    return (
      <div className="rpg-card-opal rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-amber-400/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-300">
              Đỉnh Cao Bá Chủ: Hạng #1 Đấu Trường
            </h4>
            <p className="text-xs text-parchment/75">
              Bạn đang dẫn đầu toàn bộ các chiến binh! Hãy duy trì kỷ luật mỗi ngày để giữ vững ngôi vương.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const expNeeded = rivalAhead.exp - exp;
  const targetRankPos = playerIdx; // Since 0-indexed, target rank is playerIdx

  return (
    <div className="rpg-card-opal rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-opal/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-fae/20 border border-fae/40 flex items-center justify-center text-fae">
          <Swords className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-parchment">Mục Tiêu Bứt Phá Kế Tiếp</h4>
          <p className="text-xs text-parchment/80">
            Bạn chỉ cần thêm <strong className="text-fae font-bold">+{expNeeded} EXP</strong> nữa để vượt
            qua đối thủ <strong className="text-parchment font-bold">"{rivalAhead.name}"</strong> và
            chiếm vị trí <strong className="text-amber-300 font-bold">Hạng #{targetRankPos}</strong>!
          </p>
        </div>
      </div>
    </div>
  );
};
