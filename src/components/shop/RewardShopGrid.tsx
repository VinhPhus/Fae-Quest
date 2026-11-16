import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CoinIcon } from '../ui/CoinIcon';
import { Sparkles, ShoppingBag, Plus, Trash2 } from 'lucide-react';

export const RewardShopGrid: React.FC = () => {
  const {
    shopItems,
    systemShopItems,
    coins,
    inventory,
    buyShopItem,
    deleteShopItem,
    setAddShopItemOpen,
  } = useFaeQuestStore();

  const isInventoryFull = inventory.length >= 50;

  // Ghép nối vật phẩm hệ thống do Admin thiết lập và các vật phẩm tự thưởng cá nhân
  const allShopItems = [
    ...systemShopItems.map((sys) => ({
      id: `sys_${sys.id}`,
      title: sys.name,
      desc: sys.description,
      cost: sys.cost,
      emoji: sys.icon,
      isSystem: true,
    })),
    ...shopItems.map((item) => ({
      ...item,
      isSystem: false,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Shop Header Banner */}
      <div className="rounded-[28px] p-6 bg-[#11212D] border border-[#253745] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06141B] border border-[#4A5C6A] text-xs font-bold text-[#CCD0CF]">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Thương Hội Fae Fruit</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#CCD0CF] font-rpg tracking-wide">
            Cửa Hàng Tự Thưởng Bản Thân
          </h2>
          <p className="text-sm text-[#9BA8AB] max-w-2xl leading-relaxed">
            Mỗi khi hoàn thành nhiệm vụ và <strong className="text-[#CCD0CF]">Thăng Cấp Rank</strong>, bạn nhận được lượng lớn <strong className="text-amber-300">Xu Thưởng</strong>. Hãy dùng Xu để đổi lấy những phần thưởng xứng đáng ngoài đời thực!
          </p>
        </div>

        <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end bg-[#06141B] px-5 py-3.5 rounded-2xl border border-[#253745] shadow-xl">
          <div className="flex items-center gap-3">
            <CoinIcon size="xl" />
            <div>
              <span className="text-xs text-[#9BA8AB] block">Số dư hiện tại</span>
              <span className="text-2xl font-extrabold text-amber-300 flex items-center gap-1.5 font-rpg">
                <span>{coins}</span>
                <span className="text-sm font-bold text-[#CCD0CF]">Xu</span>
              </span>
            </div>
          </div>
          <button
            onClick={() => setAddShopItemOpen(true)}
            className="ml-4 px-4 py-2 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs flex items-center gap-1.5 shadow-[0_4px_16px_rgba(204,208,207,0.2)] active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Thêm Món Mới</span>
          </button>
        </div>
      </div>

      {/* Shop Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {allShopItems.map((item) => {
          const canAfford = coins >= item.cost;
          const isItemIconUrl =
            item.emoji.startsWith('http') || item.emoji.startsWith('/') || item.emoji.startsWith('data:');

          return (
            <div
              key={item.id}
              className={`rounded-[28px] p-5 bg-[#11212D] border transition-all duration-200 shadow-md group flex flex-col justify-between gap-4 ${
                item.isSystem
                  ? 'border-amber-500/30 hover:border-amber-500/60'
                  : 'border-[#253745] hover:border-[#4A5C6A]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#06141B] border border-[#253745] group-hover:border-[#4A5C6A] flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition overflow-hidden p-1">
                  {isItemIconUrl ? (
                    <img src={item.emoji} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <span>{item.emoji}</span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {item.isSystem && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[9px] font-extrabold text-amber-300 uppercase tracking-wider">
                      🏛️ Vật Phẩm Hệ Thống
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full bg-[#06141B] border border-[#253745] text-sm font-extrabold text-amber-300 flex items-center gap-1.5 shadow-sm">
                    <CoinIcon size="sm" />
                    <span>{item.cost} Xu</span>
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-[#CCD0CF]">{item.title}</h4>
                <p className="text-xs text-[#9BA8AB] mt-1 leading-relaxed">
                  {item.desc || 'Phần thưởng xứng đáng cho nỗ lực của bạn.'}
                </p>
              </div>

              <div className="pt-2 border-t border-[#253745] flex items-center gap-2">
                <button
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    buyShopItem(item.id, { x: rect.left + 20, y: rect.top });
                  }}
                  disabled={!canAfford}
                  className={`flex-1 py-2.5 px-4 rounded-full font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${canAfford
                    ? isInventoryFull
                      ? 'bg-[#253745] border border-amber-400/40 text-amber-300'
                      : 'bg-[#CCD0CF] hover:bg-white text-[#06141B] shadow-[0_4px_16px_rgba(204,208,207,0.2)] active:scale-95'
                    : 'bg-[#06141B] border border-[#253745] text-[#9BA8AB]/40 cursor-not-allowed'
                    }`}
                  title={isInventoryFull ? 'Túi Đồ đã đầy (50/50)' : undefined}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {!canAfford
                      ? `Thiếu ${item.cost - coins} Xu`
                      : isInventoryFull
                        ? 'Túi Đồ Đầy (50/50)'
                        : 'Đổi Phần Thưởng'}
                  </span>
                </button>

                {/* Quy tắc: KHÔNG HIỂN THỊ nút Xóa đối với Vật Phẩm Hệ Thống */}
                {!item.isSystem && (
                  <button
                    onClick={() => deleteShopItem(item.id)}
                    className="p-2.5 rounded-full bg-[#06141B] hover:bg-rose-950/70 border border-[#253745] hover:border-rose-500/50 text-[#9BA8AB] hover:text-rose-300 transition cursor-pointer"
                    title="Xóa vật phẩm tự thưởng này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
