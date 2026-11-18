import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { CoinIcon } from '../ui/CoinIcon';
import { Sparkles, X, Shield, Swords } from 'lucide-react';

export const RewardPopupOverlay: React.FC = () => {
  const { rewardPopup, closeRewardPopup } = useFaeQuestStore();

  const isOpen = Boolean(rewardPopup?.isOpen);

  // Safety fallback timer (3 seconds) in component as well
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      closeRewardPopup();
    }, 3000);
    return () => clearTimeout(timer);
  }, [isOpen, closeRewardPopup]);

  if (!rewardPopup) return null;

  const {
    avatarUrl,
    oldExp = 0,
    newExp = 0,
    addedExp = 0,
    addedCoins = 0,
    isLevelUp = false,
    newRankName = '',
  } = rewardPopup;

  // Calculate percentage progression in rank tiers
  const oldIdx = getRankIndexByExp(oldExp);
  const oldTier = RANK_TIERS[oldIdx];
  const nextOldTier = oldIdx < RANK_TIERS.length - 1 ? RANK_TIERS[oldIdx + 1] : null;
  const oldSpan = nextOldTier ? Math.max(1, nextOldTier.minExp - oldTier.minExp) : 1000;
  const oldPercent = Math.min(100, Math.max(0, Math.round(((oldExp - oldTier.minExp) / oldSpan) * 100)));

  const newIdx = getRankIndexByExp(newExp);
  const newTier = RANK_TIERS[newIdx];
  const nextNewTier = newIdx < RANK_TIERS.length - 1 ? RANK_TIERS[newIdx + 1] : null;
  const newSpan = nextNewTier ? Math.max(1, nextNewTier.minExp - newTier.minExp) : 1000;
  const newPercent = Math.min(100, Math.max(0, Math.round(((newExp - newTier.minExp) / newSpan) * 100)));

  // SVG Ring Progress constants (r = 70, circumference ≈ 439.82)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  // Animation values for SVG strokeDashoffset
  const initialOffset = circumference * (1 - oldPercent / 100);
  const finalOffset = circumference * (1 - newPercent / 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="reward-overlay-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={closeRewardPopup}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#06141B]/60 backdrop-blur-sm select-none"
        >
          {/* Main Card Modal */}
          <motion.div
            key="reward-popup-card"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative max-w-sm w-full bg-[#11212D] border rounded-[28px] p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-center flex flex-col items-center overflow-hidden transition-all ${
              isLevelUp ? 'border-yellow-500/60 shadow-[0_0_50px_rgba(250,204,21,0.2)]' : 'border-[#4A5C6A]/60'
            }`}
          >
            {/* Ambient Background Aura */}
            <div
              className={`absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-colors ${
                isLevelUp ? 'bg-yellow-500/25' : 'bg-[#253745]/40'
              }`}
            />

            {/* Close Button */}
            <button
              type="button"
              onClick={closeRewardPopup}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#4A5C6A] hover:text-[#CCD0CF] hover:bg-[#253745]/60 transition cursor-pointer"
              title="Đóng sớm (Esc)"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header / Celebration Title */}
            <div className="relative z-10 w-full mb-1">
              {isLevelUp ? (
                <motion.div
                  initial={{ scale: 0.85, opacity: 0, y: -8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 350 }}
                  className="space-y-1"
                >
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 font-extrabold text-[11px] uppercase tracking-wider shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-yellow-400" />
                    <span>Thăng Cấp Thành Công!</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-yellow-400 tracking-wider drop-shadow-[0_0_15px_rgba(250,204,21,0.55)] uppercase">
                    🎉 THĂNG BẬC RANK!
                  </h2>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-0.5"
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#9BA8AB]">
                    Chiến Lợi Phẩm Nhiệm Vụ
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#CCD0CF] tracking-wide">
                    Hoàn Thành Mục Tiêu
                  </h3>
                </motion.div>
              )}
            </div>

            {/* Floating Text Indicator (+60 EXP • +5 Xu) */}
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.45, ease: 'easeOut' }}
              className="relative z-10 my-3 inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#06141B] border border-[#253745] shadow-inner"
            >
              <span className="text-emerald-400 font-extrabold text-sm flex items-center gap-1">
                +{addedExp} <span className="text-[11px] font-semibold text-emerald-300/80">EXP</span>
              </span>
              <span className="text-[#4A5C6A] font-bold">•</span>
              <span className="text-yellow-400 font-extrabold text-sm flex items-center gap-1">
                +{addedCoins} <span className="text-[11px] font-semibold text-yellow-300/80">Xu</span>
                <CoinIcon size="sm" />
              </span>
            </motion.div>

            {/* Center: Avatar & SVG Ring Progress */}
            <motion.div
              animate={
                isLevelUp
                  ? { scale: [1, 1, 1.1, 1] }
                  : { scale: 1 }
              }
              transition={
                isLevelUp
                  ? { duration: 1.6, times: [0, 0.4, 0.48, 1], ease: 'easeInOut' }
                  : undefined
              }
              className="relative z-10 w-44 h-44 flex items-center justify-center my-1"
            >
              {/* SVG Ring Progress */}
              <svg
                className="w-44 h-44 absolute inset-0 pointer-events-none"
                viewBox="0 0 160 160"
              >
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="#253745"
                  strokeWidth="7"
                  fill="none"
                />

                {/* Animated EXP Progress Ring */}
                <motion.circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={isLevelUp ? '#FBBF24' : '#CCD0CF'}
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  transform="rotate(-90 80 80)"
                  style={{
                    filter: isLevelUp
                      ? 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.7))'
                      : 'drop-shadow(0 0 6px rgba(204, 208, 207, 0.5))',
                  }}
                  initial={{ strokeDashoffset: initialOffset }}
                  animate={
                    isLevelUp
                      ? {
                          strokeDashoffset: [
                            initialOffset,
                            0,
                            0,
                            circumference,
                            finalOffset,
                          ],
                        }
                      : { strokeDashoffset: finalOffset }
                  }
                  transition={
                    isLevelUp
                      ? {
                          duration: 1.6,
                          times: [0, 0.4, 0.46, 0.5, 1],
                          ease: 'easeInOut',
                        }
                      : { duration: 1.5, ease: 'easeOut' }
                  }
                />
              </svg>

              {/* Avatar Image w-32 h-32 */}
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#253745] bg-[#06141B] shadow-[inset_0_2px_10px_rgba(0,0,0,0.7)] flex items-center justify-center relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Hunter Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#11212D] to-[#06141B] text-[#CCD0CF]">
                    <Shield className="w-12 h-12 text-[#4A5C6A]" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Rank Information Below Avatar */}
            <div className="relative z-10 w-full mt-2">
              {isLevelUp ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-1"
                >
                  <p className="text-[11px] uppercase tracking-widest text-[#9BA8AB]">
                    Đã Khai Mở Cảnh Giới Mới
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-[#CCD0CF] flex items-center justify-center gap-2">
                    <Swords className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]">
                      Bậc {newRankName || newTier.name}
                    </span>
                  </p>
                  {newTier.quote && (
                    <p className="text-xs text-[#9BA8AB] italic max-w-xs mx-auto mt-1 px-3">
                      "{newTier.quote}"
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-1"
                >
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#06141B] border border-[#253745] text-xs font-bold text-[#CCD0CF]">
                    <span>Bậc {newTier.name}</span>
                    <span className="text-[#4A5C6A]">•</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {newExp} {nextNewTier ? `/ ${nextNewTier.minExp}` : ''} EXP
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom Auto-Close Notice */}
            <div className="relative z-10 mt-4 text-[11px] text-[#4A5C6A] flex items-center justify-center gap-1.5 font-medium">
              <span>Bấm ra ngoài để đóng</span>
              <span>•</span>
              <span>Tự động đóng sau 3s</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
