import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { RankEmblemSvg } from './RankEmblemSvg';

export const RankProgressionStrip: React.FC = () => {
  const exp = useFaeQuestStore((state) => state.exp);
  const setRoadmapOpen = useFaeQuestStore((state) => state.setRoadmapOpen);
  const currentIdx = getRankIndexByExp(exp);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-4 border-t border-parchment/10">
      {RANK_TIERS.map((tier, idx) => {
        const isCurrent = idx === currentIdx;
        const isUnlocked = idx <= currentIdx;

        return (
          <div
            key={tier.id}
            onClick={() => setRoadmapOpen(true)}
            className={`cursor-pointer rounded-2xl p-2.5 border transition-all flex items-center gap-2.5 ${
              isCurrent
                ? 'bg-gradient-to-r from-bargain to-opal/60 border-fae shadow-lg ring-1 ring-fae/50 scale-[1.02]'
                : isUnlocked
                ? 'bg-thorn-dark/80 border-opal/40 opacity-90 hover:border-fae/50'
                : 'bg-thorn-dark/40 border-parchment/10 opacity-45 hover:opacity-75'
            }`}
          >
            <div className="w-10 h-10 shrink-0 flex items-center justify-center">
              <RankEmblemSvg
                iconUrl={tier.iconUrl}
                svgString={tier.svg}
                alt={tier.name}
                className="w-full h-full"
                showShine={false}
                showPulse={isCurrent}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold text-parchment truncate">{tier.name}</p>
                {isCurrent && <span className="w-2 h-2 rounded-full bg-fae animate-ping" />}
              </div>
              <p className="text-[10px] text-parchment/65">{tier.minExp}+ EXP</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
