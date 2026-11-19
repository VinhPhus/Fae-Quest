import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { CoinIcon } from '../ui/CoinIcon';
import { InventoryTicket } from '../../types';
import { Backpack, Ticket } from 'lucide-react';
import { EASING_SPRING } from '../../constants/motion';

export const InventoryHeader: React.FC = () => {
  const { inventory, exp } = useFaeQuestStore();
  const currentRankIdx = getRankIndexByExp(exp);
  const currentTier = RANK_TIERS[currentRankIdx];

  return (
    <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-[#11212D] border border-[#253745] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#253745] border border-[#4A5C6A] text-[11px] font-extrabold text-[#CCD0CF]">
            <img src={currentTier.iconUrl} alt={currentTier.name} className="w-3.5 h-3.5 object-contain [image-rendering:pixelated]" />
            <span>{currentTier.name.toUpperCase()}</span>
          </span>
          <span className="text-[11px] text-[#9BA8AB] font-mono">
            {exp} EXP
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#CCD0CF] flex items-center gap-2 font-rpg tracking-wide">
          <Backpack className="w-5 h-5 text-[#CCD0CF]" />
          <span>Túi Đồ Thợ Săn</span>
        </h2>
        <p className="text-xs text-[#9BA8AB] mt-1 leading-relaxed hidden sm:block">
          Nơi cất giữ các vật phẩm tự thưởng bạn đã quy đổi bằng Xu Vàng. Hãy kích hoạt sử dụng trước khi vật phẩm hết hiệu lực!
        </p>
      </div>

      {/* Capacity Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#06141B] border border-[#253745] text-xs font-bold shrink-0 shadow-inner">
        <span className="text-[#9BA8AB]">Sức chứa:</span>
        <span
          className={
            inventory.length >= 50
              ? 'text-rose-400 font-black'
              : inventory.length >= 40
              ? 'text-amber-400 font-black'
              : 'text-[#CCD0CF] font-black'
          }
        >
          {inventory.length} / 50 ô
        </span>
      </div>
    </div>
  );
};

export const InventoryList: React.FC = () => {
  const { inventory, useInventoryTicket, setActiveTab } = useFaeQuestStore();
  const [usingTicketId, setUsingTicketId] = useState<string | null>(null);

  const handleUseTicket = (id: string) => {
    setUsingTicketId(id);
    setTimeout(() => {
      useInventoryTicket(id);
      setUsingTicketId(null);
    }, 250);
  };

  const formatItemTimeStatus = (item: InventoryTicket) => {
    const now = Date.now();

    // Purchase time string (HH:mm)
    let purchaseTime = '';
    if (item.purchasedAt) {
      purchaseTime = new Date(item.purchasedAt).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (item.redeemedAt) {
      purchaseTime = item.redeemedAt;
    } else {
      purchaseTime = 'Gần đây';
    }

    // Expiry calculation (7 days from purchase)
    const expiresAt = item.expiresAt || ((item.purchasedAt || now) + 7 * 24 * 60 * 60 * 1000);
    const timeLeftMs = expiresAt - now;

    if (timeLeftMs <= 0) {
      return (
        <span className="text-rose-400 font-semibold text-xs inline-flex items-center gap-1">
          <span>🕒 Đổi lúc: {purchaseTime} • Đã hết hạn</span>
        </span>
      );
    }

    const hoursLeft = Math.ceil(timeLeftMs / (60 * 60 * 1000));
    const daysLeft = Math.ceil(timeLeftMs / (24 * 60 * 60 * 1000));

    if (timeLeftMs < 24 * 60 * 60 * 1000) {
      return (
        <span className="text-xs text-[#9BA8AB] inline-flex items-center gap-1">
          <span>🕒 Đổi lúc: {purchaseTime} •</span>
          <span className="text-amber-300 font-bold">Hạn dùng: còn {hoursLeft} giờ</span>
        </span>
      );
    }

    return (
      <span className="text-xs text-[#9BA8AB] inline-flex items-center gap-1">
        <span>🕒 Đổi lúc: {purchaseTime} •</span>
        <span className="text-[#CCD0CF]">Hạn dùng: còn {daysLeft} ngày</span>
      </span>
    );
  };

  if (inventory.length === 0) {
    return (
      <div className="rounded-[28px] p-10 text-center space-y-4 bg-[#11212D] border border-[#253745] shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-[#06141B] border border-[#4A5C6A] mx-auto flex items-center justify-center text-[#CCD0CF] shadow-inner">
          <Backpack className="w-8 h-8" />
        </div>
        <h4 className="text-base font-bold text-[#CCD0CF]">Túi Đồ Đang Trống</h4>
        <p className="text-xs text-[#9BA8AB] max-w-md mx-auto leading-relaxed">
          Bạn chưa đổi phần thưởng nào. Hãy tích lũy Xu Vàng từ việc hoàn thành nhiệm vụ và ghé thăm Cửa Hàng để tự thưởng cho mình nhé!
        </p>
        <button
          onClick={() => setActiveTab('shop')}
          className="px-5 py-2.5 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs inline-flex items-center gap-2 shadow-[0_4px_18px_rgba(204,208,207,0.2)] hover:scale-105 active:scale-95 transition cursor-pointer"
        >
          <Ticket className="w-4 h-4 text-[#06141B]" />
          <span>Ghé Thăm Cửa Hàng Ngay</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inventory Item Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {inventory.map((ticket) => {
            const isUsing = usingTicketId === ticket.id;
            return (
              <motion.div
                layout
                key={ticket.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={
                  isUsing
                    ? {
                        scale: 1.04,
                        opacity: 0,
                        filter: 'drop-shadow(0 0 16px rgba(204,208,207,0.8))',
                      }
                    : { opacity: 1, scale: 1, filter: 'drop-shadow(0 0 0px rgba(0,0,0,0))' }
                }
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.28, ease: EASING_SPRING }}
                className="rounded-[24px] p-5 bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] flex items-center justify-between gap-4 transition-colors duration-200 shadow-md group"
              >
                {/* Left: Emoji & Information */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-[#06141B] border border-[#253745] group-hover:border-[#4A5C6A] flex items-center justify-center text-3xl shrink-0 shadow-inner group-hover:scale-105 transition overflow-hidden">
                    {ticket.emoji}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-[#CCD0CF] truncate">
                        {ticket.title}
                      </h4>
                      <span className="text-[11px] text-amber-300 font-bold inline-flex items-center gap-0.5 shrink-0">
                        <span>({ticket.cost}</span>
                        <CoinIcon size="xs" />
                        <span>)</span>
                      </span>
                    </div>

                    <div>{formatItemTimeStatus(ticket)}</div>
                  </div>
                </div>

                {/* Right Action Button: Use Immediately */}
                <div className="shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    disabled={isUsing}
                    onClick={() => handleUseTicket(ticket.id)}
                    className="px-4 py-2 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs shadow-[0_4px_16px_rgba(204,208,207,0.2)] flex items-center gap-1.5 hover:scale-105 transition cursor-pointer disabled:opacity-50"
                    title="Kích hoạt và sử dụng phần thưởng ngay"
                  >
                    <Ticket className="w-4 h-4 text-[#06141B]" />
                    <span>Sử Dụng Ngay</span>
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
