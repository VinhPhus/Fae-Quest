import React, { useState } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CoinIcon } from '../ui/CoinIcon';
import { Plus, X } from 'lucide-react';

export const AddShopItemModal: React.FC = () => {
  const { isAddShopItemOpen, setAddShopItemOpen, addShopItem } = useFaeQuestStore();

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cost, setCost] = useState<number | ''>(25);
  const [emoji, setEmoji] = useState('🎁');

  const popularEmojis = ['🎁', '🍜', '🧋', '🎮', '🎬', '🛍️', '🏖️', '🍕', '💆', '🍦', '☕', '🎧'];

  if (!isAddShopItemOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCost = typeof cost === 'number' && cost >= 1 ? cost : 1;
    addShopItem(title, desc, finalCost, emoji);
    setTitle('');
    setDesc('');
    setCost(25);
    setEmoji('🎁');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-thorn-dark/85 backdrop-blur-md">
      <div className="rpg-card rounded-2xl sm:rounded-3xl max-w-md w-[94vw] sm:w-full max-h-[88vh] overflow-y-auto p-5 sm:p-7 space-y-4 border border-fae/50 shadow-2xl relative">
        <button
          onClick={() => setAddShopItemOpen(false)}
          className="absolute top-4 right-4 text-parchment/40 hover:text-parchment p-1 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-rpg font-bold text-xl text-parchment flex items-center gap-2">
          <span>Tạo Phần Thưởng Tự Thưởng Mới</span>
        </h3>
        <p className="text-xs text-parchment/70">
          Hãy thiết lập món quà bạn mơ ước để tạo động lực hoàn thành nhiệm vụ!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-parchment/80 mb-1">
              Tên Phần Thưởng *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đi massage cổ vai gáy, Mua album nhạc..."
              required
              className="w-full px-4 py-2.5 rounded-xl bg-thorn-dark border border-opal/40 text-sm text-parchment focus:border-fae focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-parchment/80 mb-1">
              Mô Tả Thưởng Thức
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="VD: Thư giãn thoải mái sau 1 tuần hoàn thành KPI"
              className="w-full px-4 py-2.5 rounded-xl bg-thorn-dark border border-opal/40 text-sm text-parchment focus:border-fae focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-parchment/80 mb-1 flex items-center gap-1.5">
                <span>Giá Quy Đổi</span>
                <CoinIcon size="xs" />
                <span>*</span>
              </label>
              <input
                type="number"
                min="1"
                max="9999"
                value={cost}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setCost('');
                  } else {
                    const parsed = parseInt(val, 10);
                    setCost(isNaN(parsed) ? '' : parsed);
                  }
                }}
                onBlur={() => {
                  if (cost === '' || cost < 1) {
                    setCost(1);
                  }
                }}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-thorn-dark border border-opal/40 text-sm font-bold text-fae focus:border-fae focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-parchment/80 mb-1">
                Biểu Tượng Emoji
              </label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
                className="w-full px-4 py-2.5 rounded-xl bg-thorn-dark border border-opal/40 text-center text-xl focus:border-fae focus:outline-none"
              />
            </div>
          </div>

          {/* Quick emoji selection */}
          <div>
            <span className="block text-[11px] text-parchment/60 mb-1.5">Gợi ý emoji:</span>
            <div className="flex flex-wrap gap-2">
              {popularEmojis.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition ${
                    emoji === e ? 'bg-fae/30 border border-fae' : 'bg-thorn-dark border border-opal/20 hover:border-opal/50'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-parchment/10">
            <button
              type="button"
              onClick={() => setAddShopItemOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-thorn-dark text-xs font-semibold text-parchment/70 hover:text-parchment"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl rpg-btn-primary text-xs font-bold text-parchment flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Vào Shop</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
