import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { StreakFlameCard } from '../streak/StreakFlameCard';

/**
 * Modal chúc mừng giữ lửa Chuỗi Kỷ Luật qua ngày mới (tự động mở tối đa 1 lần/ngày).
 */
export const StreakCelebrationModal: React.FC = () => {
  const streakCelebrationData = useFaeQuestStore((s) => s.streakCelebrationData);
  const closeStreakCelebrationModal = useFaeQuestStore((s) => s.closeStreakCelebrationModal);

  useEffect(() => {
    if (!streakCelebrationData) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeStreakCelebrationModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [streakCelebrationData, closeStreakCelebrationModal]);

  return (
    <AnimatePresence>
      {streakCelebrationData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={closeStreakCelebrationModal}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#06141B]/82 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Chúc mừng giữ vững Chuỗi Kỷ Luật"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[360px] flex justify-center"
          >
            <StreakFlameCard
              mode="modal"
              celebrationFrom={streakCelebrationData.prevStreak}
              onClose={closeStreakCelebrationModal}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
