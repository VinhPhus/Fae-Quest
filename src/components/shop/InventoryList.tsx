import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CoinIcon } from '../ui/CoinIcon';
import { Backpack, CheckCircle2, Ticket, Clock } from 'lucide-react';

export const InventoryList: React.FC = () => {
  const { inventory, useInventoryTicket, setActiveTab } = useFaeQuestStore();

  if (inventory.length === 0) {
    return (
      <div className="rpg-card rounded-3xl p-10 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-thorn-dark/80 border border-opal/40 mx-auto flex items-center justify-center text-fae">
          <Backpack className="w-8 h-8" />
        </div>
        <h4 className="text-base font-bold text-parchment">Kho Phần Thưởng Đang Trống</h4>
        <p className="text-xs text-parchment/65 max-w-md mx-auto">
          Bạn chưa đổi phần thưởng nào. Hãy tích lũy Xu từ việc hoàn thành nhiệm vụ và ghé thăm Cửa Hàng!
        </p>
        <button
          onClick={() => setActiveTab('shop')}
          className="px-5 py-2.5 rounded-xl rpg-btn-primary font-bold text-xs text-parchment inline-flex items-center gap-2 shadow"
        >
          <Ticket className="w-4 h-4" />
          <span>Ghé Thăm Cửa Hàng Ngay</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rpg-card rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-parchment flex items-center gap-2">
            <Backpack className="w-6 h-6 text-fae" />
            <span>Kho Vé Tự Thưởng Đã Mua</span>
          </h2>
          <p className="text-sm text-parchment/75 mt-1">
            Những phần thưởng bạn đã mua bằng Xu sẽ nằm tại đây. Hãy nhấn <strong>"Sử dụng ngay"</strong> khi bạn thực hiện phần thưởng đó ngoài đời thực nhé!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {inventory.map((ticket) => (
          <div
            key={ticket.id}
            className={`rpg-card rounded-2xl p-5 flex items-center justify-between gap-4 border transition ${
              ticket.used
                ? 'opacity-60 bg-thorn-dark/50 border-parchment/10'
                : 'border-fae/40 shadow-lg hover:border-fae'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-thorn-dark/90 border border-fae/40 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                {ticket.emoji}
              </div>
              <div className="space-y-1 min-w-0">
                <h4
                  className={`text-sm sm:text-base font-bold truncate ${
                    ticket.used ? 'line-through text-parchment/50' : 'text-parchment'
                  }`}
                >
                  {ticket.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-parchment/60">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Đổi lúc: {ticket.redeemedAt}</span>
                  <span className="text-fae font-bold inline-flex items-center gap-1">
                    <span>({ticket.cost}</span>
                    <CoinIcon size="xs" />
                    <span>)</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {ticket.used ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-thorn-dark border border-parchment/10 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã Dùng</span>
                </span>
              ) : (
                <button
                  onClick={() => useInventoryTicket(ticket.id)}
                  className="px-4 py-2 rounded-xl rpg-btn-primary font-bold text-xs text-parchment shadow-md flex items-center gap-1.5"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Sử Dụng Ngay</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
