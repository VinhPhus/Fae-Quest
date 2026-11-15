import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CoinIcon } from '../ui/CoinIcon';
import { InventoryTicket } from '../../types';
import { Backpack, CheckCircle2, Ticket, Sparkles } from 'lucide-react';

export const InventoryList: React.FC = () => {
  const { inventory, useInventoryTicket, setActiveTab } = useFaeQuestStore();

  const formatItemTimeStatus = (item: InventoryTicket) => {
    const now = Date.now();

    // If item was already used
    if (item.used) {
      return (
        <span className="text-emerald-400 font-medium inline-flex items-center gap-1 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          <span>✨ Đang tận hưởng phần thưởng</span>
        </span>
      );
    }

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
        <span className="text-xs text-parchment/70 inline-flex items-center gap-1">
          <span>🕒 Đổi lúc: {purchaseTime} •</span>
          <span className="text-[#D97352] font-bold">Hạn dùng: còn {hoursLeft} giờ</span>
        </span>
      );
    }

    return (
      <span className="text-xs text-parchment/70 inline-flex items-center gap-1">
        <span>🕒 Đổi lúc: {purchaseTime} •</span>
        <span>Hạn dùng: còn {daysLeft} ngày</span>
      </span>
    );
  };

  if (inventory.length === 0) {
    return (
      <div className="rpg-card rounded-3xl p-10 text-center space-y-4 border border-fae/30 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-thorn-dark/80 border border-opal/40 mx-auto flex items-center justify-center text-fae shadow-inner">
          <Backpack className="w-8 h-8" />
        </div>
        <h4 className="text-base font-bold text-parchment">Túi Đồ Đang Trống</h4>
        <p className="text-xs text-parchment/65 max-w-md mx-auto leading-relaxed">
          Bạn chưa đổi phần thưởng nào. Hãy tích lũy Xu Vàng từ việc hoàn thành nhiệm vụ và ghé thăm Cửa Hàng để tự thưởng cho mình nhé!
        </p>
        <button
          onClick={() => setActiveTab('shop')}
          className="px-5 py-2.5 rounded-xl rpg-btn-primary font-bold text-xs text-parchment inline-flex items-center gap-2 shadow hover:scale-105 transition"
        >
          <Ticket className="w-4 h-4" />
          <span>Ghé Thăm Cửa Hàng Ngay</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="rpg-card rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-fae/40 shadow-xl">
        <div>
          <h2 className="text-2xl font-extrabold text-parchment flex items-center gap-2 font-rpg tracking-wide">
            <Backpack className="w-6 h-6 text-fae" />
            <span>Túi Đồ Thợ Săn</span>
          </h2>
          <p className="text-xs sm:text-sm text-parchment/75 mt-1 leading-relaxed">
            Nơi cất giữ các vật phẩm tự thưởng bạn đã quy đổi bằng Xu Vàng. Hãy kích hoạt sử dụng trước khi vật phẩm hết hiệu lực!
          </p>
        </div>
      </div>

      {/* Inventory Item Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {inventory.map((ticket) => (
          <div
            key={ticket.id}
            className={`rpg-card rounded-2xl p-5 flex items-center justify-between gap-4 border transition duration-200 ${
              ticket.used
                ? 'opacity-70 bg-thorn-dark/60 border-opal/30'
                : 'border-fae/40 shadow-lg hover:border-fae'
            }`}
          >
            {/* Left: Emoji & Information */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-thorn-dark/90 border border-fae/40 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                {ticket.emoji}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4
                    className={`text-sm sm:text-base font-bold truncate ${
                      ticket.used ? 'text-parchment/60' : 'text-parchment'
                    }`}
                  >
                    {ticket.title}
                  </h4>
                  <span className="text-[11px] text-fae font-bold inline-flex items-center gap-0.5 shrink-0">
                    <span>({ticket.cost}</span>
                    <CoinIcon size="xs" />
                    <span>)</span>
                  </span>
                </div>

                <div>{formatItemTimeStatus(ticket)}</div>
              </div>
            </div>

            {/* Right Action Button */}
            <div className="shrink-0">
              {ticket.used ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-thorn-dark/80 border border-parchment/15 text-xs font-semibold text-emerald-400 select-none">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✔ Đã Dùng</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => useInventoryTicket(ticket.id)}
                  className="px-4 py-2 rounded-xl rpg-btn-primary font-bold text-xs text-parchment shadow-md flex items-center gap-1.5 hover:scale-105 active:scale-95 transition"
                >
                  <Ticket className="w-4 h-4" />
                  <span>🎫 Sử Dụng Ngay</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
