import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CoinIcon } from '../ui/CoinIcon';
import { Sparkles, ShoppingBag, Plus, Trash2 } from 'lucide-react';

export const RewardShopGrid: React.FC = () => {
  const {
    shopItems,
    coins,
    buyShopItem,
    deleteShopItem,
    setAddShopItemOpen,
  } = useFaeQuestStore();

  return (
    <div className="space-y-6">
      {/* Shop Header Banner */}
      <div className="rpg-card-opal rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fae/20 border border-fae/40 text-xs font-bold text-fae-light">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Thương Hội Fae Fruit</span>
          </div>
          <h2 className="text-2xl font-extrabold text-parchment">Cửa Hàng Tự Thưởng Bản Thân</h2>
          <p className="text-sm text-parchment/75 max-w-2xl">
            Mỗi khi hoàn thành nhiệm vụ và <strong className="text-fae-light">Thăng Cấp Rank</strong>, bạn nhận được lượng lớn <strong className="text-fae-light">Xu Thưởng</strong>. Hãy dùng Xu để đổi lấy những phần thưởng xứng đáng ngoài đời thực!
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end bg-thorn-dark/85 px-5 py-3.5 rounded-2xl border border-fae/40 shadow-xl">
          <div className="flex items-center gap-3">
            <CoinIcon size="xl" />
            <div>
              <span className="text-xs text-parchment/60 block">Số dư hiện tại</span>
              <span className="text-2xl font-extrabold text-fae flex items-center gap-1.5">
                <span>{coins}</span>
                <span className="text-sm font-bold text-fae-light">Xu</span>
              </span>
            </div>
          </div>
          <button
            onClick={() => setAddShopItemOpen(true)}
            className="ml-4 px-3.5 py-2 rounded-xl rpg-btn-primary text-xs font-bold text-parchment flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Món Mới</span>
          </button>
        </div>
      </div>

      {/* Shop Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {shopItems.map((item) => {
          const canAfford = coins >= item.cost;
          return (
            <div
              key={item.id}
              className="rpg-card rounded-3xl p-5 flex flex-col justify-between gap-4 hover:border-fae/60 transition group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-14 h-14 rounded-2xl bg-thorn-dark/90 border border-fae/40 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition">
                  {item.emoji}
                </div>
                <span className="px-3 py-1 rounded-full bg-fae/20 border border-fae/50 text-sm font-extrabold text-fae flex items-center gap-1.5 shadow-sm">
                  <CoinIcon size="sm" />
                  <span>{item.cost} Xu</span>
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-parchment">{item.title}</h4>
                <p className="text-xs text-parchment/65 mt-1 leading-relaxed">
                  {item.desc || 'Phần thưởng xứng đáng cho nỗ lực của bạn.'}
                </p>
              </div>

              <div className="pt-2 border-t border-parchment/10 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    if (canAfford) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      buyShopItem(item.id, { x: rect.left + 20, y: rect.top });
                    }
                  }}
                  disabled={!canAfford}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                    canAfford
                      ? 'rpg-btn-primary text-parchment'
                      : 'bg-thorn-dark/80 border border-parchment/15 text-parchment/40 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{canAfford ? 'Đổi Phần Thưởng' : `Thiếu ${item.cost - coins} Xu`}</span>
                </button>
                <button
                  onClick={() => deleteShopItem(item.id)}
                  className="p-2.5 rounded-xl bg-thorn-dark/60 hover:bg-rose-950 text-parchment/40 hover:text-rose-300 transition"
                  title="Xóa vật phẩm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
