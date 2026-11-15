import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';

export const FloatingReward: React.FC = () => {
  const floatingRewards = useFaeQuestStore((state) => state.floatingRewards);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {floatingRewards.map((reward) => (
        <div
          key={reward.id}
          className="absolute font-rpg font-extrabold text-sm sm:text-base text-fae drop-shadow-[0_2px_10px_rgba(217,119,82,0.8)] animate-floatUp"
          style={{
            left: `${reward.x}px`,
            top: `${reward.y - 20}px`,
          }}
        >
          {reward.text}
        </div>
      ))}
    </div>
  );
};
