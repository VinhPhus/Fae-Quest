import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { resolveTitleObject } from '../../constants/systemQuests';
import { CoinIcon } from '../ui/CoinIcon';
import { Flame, Shield, Award, ChevronRight, Star } from 'lucide-react';

export const HunterStatisticsWidget: React.FC = () => {
  const { coins, streakDays, completedTotal, equippedTitleId, setActiveTab, stars } = useFaeQuestStore();

  const titleObj = resolveTitleObject(equippedTitleId);

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return { label: 'LEGENDARY', border: 'border-amber-400/50', text: 'text-amber-300' };
      case 'epic':
        return { label: 'EPIC', border: 'border-purple-400/50', text: 'text-purple-300' };
      case 'rare':
        return { label: 'RARE', border: 'border-sky-400/50', text: 'text-sky-300' };
      default:
        return { label: 'COMMON', border: 'border-[#4A5C6A]', text: 'text-[#9BA8AB]' };
    }
  };

  const rarityInfo = getRarityBadge(titleObj.rarity);

  return (
    <div className="rounded-[28px] p-6 bg-[#11212D] border border-[#253745] shadow-[0_16px_40px_rgba(0,0,0,0.7)] space-y-5 relative overflow-hidden text-center flex flex-col justify-between">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(204,208,207,0.06)_0%,transparent_65%)] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#253745] relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF]">
            <Award className="w-4 h-4" />
          </div>
          <h4 className="font-rpg font-extrabold text-sm text-[#CCD0CF] tracking-wide">
            Thống Kê Thợ Săn
          </h4>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('system-quests')}
          className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF] hover:bg-[#4A5C6A] hover:text-white transition cursor-pointer flex items-center gap-1"
        >
          <span>Kho Danh Hiệu</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Center: Equipped Title Showcase (replaces EXP circle) */}
      <div
        onClick={() => setActiveTab('system-quests')}
        className="my-1 py-4 px-3 rounded-2xl bg-[#06141B]/70 border border-[#253745] hover:border-[#4A5C6A] transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group shadow-inner relative overflow-hidden"
        title="Nhấn để mở Kho Danh Hiệu & Đổi Danh Hiệu"
      >
        {/* Soft Ambient Silver Halo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(204,208,207,0.12)_0%,transparent_70%)] pointer-events-none group-hover:scale-125 transition-transform duration-500" />

        {/* Large Medal Frame with silver drop shadow */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#06141B] border-2 border-[#4A5C6A] group-hover:border-[#CCD0CF] flex items-center justify-center shadow-[0_0_20px_rgba(204,208,207,0.2)] group-hover:shadow-[0_0_28px_rgba(204,208,207,0.4)] transition-all duration-300 p-2.5">
          <img
            src={titleObj.iconUrl}
            alt={titleObj.name}
            className="w-full h-full object-contain drop-shadow-[0_0_16px_rgba(204,208,207,0.25)] group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        {/* Title Name & Details */}
        <div className="mt-3 flex flex-col items-center gap-1 relative z-10 w-full px-2">
          <h5 className="font-rpg font-bold text-base text-[#CCD0CF] group-hover:text-white transition tracking-wide text-center truncate max-w-full">
            {titleObj.name}
          </h5>

          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full bg-[#11212D] border ${rarityInfo.border} ${rarityInfo.text}`}
            >
              {rarityInfo.label}
            </span>
            <span className="text-[10px] text-[#9BA8AB] group-hover:text-[#CCD0CF] transition flex items-center gap-0.5 underline underline-offset-2">
              <span>Đổi danh hiệu</span>
            </span>
          </div>

          {stars > 0 && (
            <div className="mt-1.5 px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-400/40 text-yellow-300 inline-flex items-center gap-1.5 text-xs font-bold shadow-sm">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span>⭐ {stars} Sao Vinh Dự</span>
            </div>
          )}
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
