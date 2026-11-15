import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RankEmblemSvg } from '../hero/RankEmblemSvg';
import { CoinIcon } from '../ui/CoinIcon';
import { Sparkles, Trophy } from 'lucide-react';

export const RankUpModal: React.FC = () => {
  const { rankUpData, closeRankUpModal } = useFaeQuestStore();

  if (!rankUpData) return null;

  const { achievedTier, bonusCoins } = rankUpData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-thorn-dark/85 backdrop-blur-md">
      <div className="rpg-card rounded-3xl max-w-md w-full p-7 text-center relative overflow-hidden border-2 border-fae shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Glow rays */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-fae/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-fae text-thorn-dark font-extrabold text-xs uppercase tracking-widest shadow">
            <Sparkles className="w-4 h-4" />
            <span>Thăng Cấp Thành Công!</span>
          </div>

          <h3 className="font-rpg text-3xl font-extrabold text-parchment">THĂNG HẠNG MỚI</h3>

          {/* New Rank Emblem with Gamified Shine & Pulse */}
          <div className="w-40 h-40 mx-auto rounded-3xl bg-gradient-to-b from-thorn-dark via-bargain-dark to-thorn border-2 border-fae flex items-center justify-center shadow-2xl relative p-3 rank-shine-fx">
            <RankEmblemSvg
              iconUrl={achievedTier.iconUrl}
              svgString={achievedTier.svg}
              alt={achievedTier.name}
              className="w-full h-full"
              showPulse={true}
            />
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-parchment/60">Bạn đã đạt đến cảnh giới</p>
            <p className="font-rpg text-3xl font-extrabold text-fae mt-1">
              BẬC {achievedTier.name.toUpperCase()}
            </p>
            <p className="text-xs text-parchment/80 mt-2 px-4 italic">
              "{achievedTier.quote}"
            </p>
          </div>

          {/* Coin Bonus Box */}
          {bonusCoins > 0 && (
            <div className="bg-thorn-dark/90 rounded-2xl p-4 border border-fae/50 flex items-center justify-center gap-3.5 shadow-inner">
              <CoinIcon size="2xl" />
              <div className="text-left">
                <span className="text-xs text-parchment/70 block">Phần thưởng Thăng Cấp Rank</span>
                <span className="text-xl font-extrabold text-fae flex items-center gap-1.5">
                  <span>+{bonusCoins}</span>
                  <span className="text-base font-bold text-fae-light">Xu Vàng</span>
                </span>
              </div>
            </div>
          )}

          <button
            onClick={closeRankUpModal}
            className="w-full py-3.5 rounded-xl rpg-btn-primary font-bold text-sm text-parchment shadow-xl"
          >
            Tuyệt Vời! Tiếp Tục Chinh Phục
          </button>
        </div>
      </div>
    </div>
  );
};
