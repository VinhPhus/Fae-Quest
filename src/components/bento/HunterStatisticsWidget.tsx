import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { CoinIcon } from '../ui/CoinIcon';
import { Trophy, Flame, Shield } from 'lucide-react';

export const HunterStatisticsWidget: React.FC = () => {
  const { exp, coins, streakDays, completedTotal } = useFaeQuestStore();

  const currentIdx = getRankIndexByExp(exp);
  const currentTier = RANK_TIERS[currentIdx];
  const nextTier = currentIdx < RANK_TIERS.length - 1 ? RANK_TIERS[currentIdx + 1] : null;

  // Calculate progress %
  let progressPercent = 100;
  if (nextTier) {
    const span = nextTier.minExp - currentTier.minExp;
    const gainedInTier = exp - currentTier.minExp;
    progressPercent = Math.min(100, Math.max(0, Math.round((gainedInTier / span) * 100)));
  }

  // SVG Ring Constants
  const radius = 54;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="rounded-[28px] p-6 bg-[#11212D] border border-[#253745] shadow-[0_16px_40px_rgba(0,0,0,0.7)] space-y-6 relative overflow-hidden text-center">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(204,208,207,0.08)_0%,transparent_60%)] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-[#253745] relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF]">
            <Trophy className="w-4 h-4" />
          </div>
          <h4 className="font-rpg font-extrabold text-sm text-[#CCD0CF] tracking-wide">
            Thống Kê Thợ Săn
          </h4>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF]">
          {currentTier.name}
        </span>
      </div>

      {/* Center: Layered Glowing Progress Ring - Obsidian & Steel */}
      <div className="relative flex items-center justify-center my-2">
        <svg className="w-36 h-36 transform -rotate-90">
          <defs>
            <linearGradient id="monochromeRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4A5C6A" />
              <stop offset="50%" stopColor="#9BA8AB" />
              <stop offset="100%" stopColor="#CCD0CF" />
            </linearGradient>
            <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="#06141B"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Glowing Progress Arc */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="url(#monochromeRingGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            filter="url(#ringGlow)"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Ring Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="font-rpg font-black text-2xl text-[#CCD0CF] tracking-tight leading-none drop-shadow">
            {exp}
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-[#9BA8AB] mt-0.5">
            EXP TÍCH LŨY
          </span>
          <span className="text-[10px] font-extrabold text-[#CCD0CF] mt-0.5 bg-[#06141B] px-2 py-0.2 rounded-full border border-[#253745]">
            {progressPercent}% tới Rank kế
          </span>
        </div>
      </div>

      {/* 3 Circular Glowing Stat Badges */}
      <div className="grid grid-cols-3 gap-2 pt-1 relative z-10">
        {/* Badge 1: Xu Vàng */}
        <div className="p-2.5 rounded-2xl bg-[#06141B] border border-[#253745] hover:border-amber-400/50 transition-all flex flex-col items-center justify-center gap-1 shadow-sm group">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow-inner group-hover:scale-110 transition">
            <CoinIcon size="sm" />
          </div>
          <span className="text-xs font-black text-amber-300 leading-tight">
            {coins} Xu
          </span>
          <span className="text-[9px] text-[#9BA8AB] uppercase tracking-wider font-semibold">
            Ngân Khố
          </span>
        </div>

        {/* Badge 2: Chuỗi Kỷ Luật */}
        <div className="p-2.5 rounded-2xl bg-[#06141B] border border-[#253745] hover:border-orange-400/50 transition-all flex flex-col items-center justify-center gap-1 shadow-sm group">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400 shadow-inner group-hover:scale-110 transition">
            <Flame className="w-4 h-4 fill-orange-400" />
          </div>
          <span className="text-xs font-black text-orange-300 leading-tight">
            {streakDays}N
          </span>
          <span className="text-[9px] text-[#9BA8AB] uppercase tracking-wider font-semibold">
            Chuỗi Kỷ Luật
          </span>
        </div>

        {/* Badge 3: Đã Xong */}
        <div className="p-2.5 rounded-2xl bg-[#06141B] border border-[#253745] hover:border-[#4A5C6A] transition-all flex flex-col items-center justify-center gap-1 shadow-sm group">
          <div className="w-8 h-8 rounded-full bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shadow-inner group-hover:scale-110 transition">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-xs font-black text-[#CCD0CF] leading-tight">
            {completedTotal} Task
          </span>
          <span className="text-[9px] text-[#9BA8AB] uppercase tracking-wider font-semibold">
            Đã Xong
          </span>
        </div>
      </div>
    </div>
  );
};
