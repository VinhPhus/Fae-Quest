import React from 'react';
import { createPortal } from 'react-dom';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { RankEmblemSvg } from '../hero/RankEmblemSvg';
import { CoinIcon } from '../ui/CoinIcon';
import { X, Trophy, CheckCircle, Lock, Star, Sparkles } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export const RankRoadmapModal: React.FC = () => {
  const { isRoadmapOpen, setRoadmapOpen, exp, playerName } = useFaeQuestStore();

  useBodyScrollLock(isRoadmapOpen);

  if (!isRoadmapOpen || typeof document === 'undefined') return null;

  const currentIdx = getRankIndexByExp(exp);
  const currentTier = RANK_TIERS[currentIdx];
  const nextTier = currentIdx < RANK_TIERS.length - 1 ? RANK_TIERS[currentIdx + 1] : null;

  let progressPercent = 100;
  let expNeeded = 0;
  if (nextTier) {
    const span = nextTier.minExp - currentTier.minExp;
    const gainedInTier = exp - currentTier.minExp;
    progressPercent = Math.min(100, Math.max(3, Math.round((gainedInTier / span) * 100)));
    expNeeded = nextTier.minExp - exp;
  }

  return createPortal(
    <div
      onClick={() => setRoadmapOpen(false)}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      className="fixed inset-0 w-screen h-[100dvh] z-[100] bg-[#06141B]/80 backdrop-blur-md touch-none overscroll-none flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rpg-card rounded-2xl sm:rounded-3xl max-w-3xl w-[94vw] sm:w-full max-h-[90dvh] flex flex-col overflow-hidden overscroll-contain touch-pan-y border border-fae/50 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-parchment/10 flex items-center justify-between bg-thorn-dark/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-fae to-bargain flex items-center justify-center text-parchment shadow border border-parchment/20">
              <Trophy className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-fae-light font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hệ Thống Phân Hạng 2026</span>
              </div>
              <h3 className="font-rpg font-bold text-lg sm:text-xl text-parchment">
                Lộ Trình Chinh Phục Đỉnh Thách Đấu
              </h3>
            </div>
          </div>
          <button
            onClick={() => setRoadmapOpen(false)}
            className="text-parchment/40 hover:text-parchment p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Top Summary Banner: Current Status & Progress */}
          <div className="p-4 sm:p-5 rounded-2xl bg-thorn-dark/90 border border-fae/40 shadow-inner flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-thorn to-bargain border border-fae/60 flex items-center justify-center p-1.5 shrink-0 rank-shine-fx">
              <RankEmblemSvg
                iconUrl={currentTier.iconUrl}
                alt={currentTier.name}
                className="w-full h-full"
                showPulse={false}
              />
            </div>

            <div className="space-y-2 flex-1 min-w-0 w-full text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs text-parchment/70 font-semibold">{playerName}:</span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-rpg bg-fae text-thorn-dark">
                  BẬC {currentTier.name.toUpperCase()}
                </span>
                <span className="text-xs text-fae font-bold">({exp.toLocaleString()} EXP)</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-thorn h-3 rounded-full overflow-hidden p-0.5 border border-opal/30">
                <div
                  className="exp-bar-fill h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-parchment/80">
                <span>
                  {nextTier ? (
                    <>
                      Còn thiếu <strong className="text-fae font-bold">{expNeeded} EXP</strong> để lên{' '}
                      <strong className="text-parchment font-bold">BẬC {nextTier.name.toUpperCase()}</strong>
                    </>
                  ) : (
                    <strong className="text-fae">Đạt đỉnh vinh quang Thách Đấu!</strong>
                  )}
                </span>
                <span className="text-fae font-bold inline-flex items-center gap-1">
                  {nextTier ? (
                    <>
                      <span>Thưởng: +{nextTier.bonusCoins || nextTier.coinBonus}</span>
                      <CoinIcon size="xs" />
                    </>
                  ) : (
                    'Tối Đa'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* List of 7 Tiers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-parchment/70 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-fae" />
              <span>Danh Sách 7 Bậc Danh Vọng & Thưởng Thăng Hạng</span>
            </h4>

            {RANK_TIERS.map((tier, idx) => {
              const isCurrent = idx === currentIdx;
              const isUnlocked = idx <= currentIdx;

              return (
                <div
                  key={tier.id}
                  className={`rounded-2xl p-4 sm:p-4.5 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-bargain via-thorn-light to-thorn-dark border-fae shadow-xl ring-2 ring-fae/50 scale-[1.01]'
                      : isUnlocked
                      ? 'bg-thorn-dark/80 border-opal/40 opacity-90 hover:border-fae/40'
                      : 'bg-thorn-dark/40 border-parchment/10 opacity-55'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-16 rounded-2xl bg-thorn-dark/95 border border-fae/40 flex items-center justify-center shrink-0 p-1.5 shadow-inner rank-shine-fx">
                      <RankEmblemSvg
                        iconUrl={tier.iconUrl}
                        alt={tier.name}
                        className="w-full h-full"
                        showPulse={isCurrent}
                      />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-rpg font-bold text-base sm:text-lg text-parchment">
                          Bậc {tier.name}
                        </h5>
                        {isCurrent && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-fae text-thorn-dark shadow">
                            Bậc Hiện Tại
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-parchment/75 italic">"{tier.quote}"</p>
                      <div className="flex items-center gap-3 text-xs text-parchment/60 pt-0.5">
                        <span>
                          Mốc EXP: <strong className="text-fae">{tier.minExp} - {tier.maxExp >= 999999 ? 'Trở Lên' : tier.maxExp} EXP</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 text-fae-light font-bold">
                          <CoinIcon size="xs" />
                          <span>Thưởng Thăng Hạng: +{tier.bonusCoins || tier.coinBonus} Xu</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-fae/20 border border-fae text-xs font-bold text-fae">
                        <CheckCircle className="w-4 h-4" />
                        <span>Đang Tại Bậc</span>
                      </span>
                    ) : isUnlocked ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-xs font-bold text-emerald-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>Đã Chinh Phục</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-thorn-dark border border-parchment/15 text-xs font-semibold text-parchment/50">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Chưa Mở Khóa</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-thorn-dark/80 border-t border-parchment/10 text-center shrink-0">
          <button
            onClick={() => setRoadmapOpen(false)}
            className="px-6 py-2 rounded-xl bg-opal/40 hover:bg-opal/60 border border-opal/50 text-xs font-bold text-parchment transition"
          >
            Đóng Lộ Trình
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
