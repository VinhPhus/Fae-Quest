import React, { useState } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { UserPlus, X } from 'lucide-react';

export const AddRivalModal: React.FC = () => {
  const { isAddRivalOpen, setAddRivalOpen, addRival } = useFaeQuestStore();

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [exp, setExp] = useState(350);
  const [avatar, setAvatar] = useState('⚔️');

  const avatarPresets = ['⚔️', '🦊', '🐺', '🦁', '🦄', '🐉', '🦅', '👑', '🧙‍♂️', '🥷', '🧝‍♀️', '⚡'];

  if (!isAddRivalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addRival(name, title || 'Chiến Binh Ẩn Danh', exp, avatar);
    setName('');
    setTitle('');
    setExp(350);
    setAvatar('⚔️');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-thorn-dark/85 backdrop-blur-md">
      <div className="rpg-card rounded-2xl sm:rounded-3xl max-w-md w-[94vw] sm:w-full max-h-[88vh] overflow-y-auto p-5 sm:p-7 space-y-4 border border-fae/50 shadow-2xl relative">
        <button
          onClick={() => setAddRivalOpen(false)}
          className="absolute top-4 right-4 text-parchment/40 hover:text-parchment p-1 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-rpg font-bold text-xl text-parchment flex items-center gap-2">
          <span>Triệu Hồi Đối Thủ Mới</span>
        </h3>
        <p className="text-xs text-parchment/70">
          Thêm bạn bè hoặc đối thủ giả lập để thi đua và tăng tinh thần kỷ luật!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-parchment/80 mb-1">
              Tên Chiến Binh *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Tuấn Anh, Sarah Miller, Đức Huy..."
              required
              className="w-full px-4 py-2.5 rounded-xl bg-thorn-dark border border-opal/40 text-sm text-parchment focus:border-fae focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-parchment/80 mb-1">
              Danh Hiệu / Biệt Danh
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Sát Thủ Deadline, Kiếm Sĩ Cần Cù..."
              className="w-full px-4 py-2.5 rounded-xl bg-thorn-dark border border-opal/40 text-sm text-parchment focus:border-fae focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-parchment/80 mb-1">
                Điểm EXP Ban Đầu *
              </label>
              <input
                type="number"
                min="0"
                max="99999"
                value={exp}
                onChange={(e) => setExp(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-thorn-dark border border-opal/40 text-sm font-bold text-fae focus:border-fae focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-parchment/80 mb-1">
                Biểu Tượng Avatar
              </label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                maxLength={4}
                className="w-full px-4 py-2.5 rounded-xl bg-thorn-dark border border-opal/40 text-center text-xl focus:border-fae focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Avatar selection */}
          <div>
            <span className="block text-[11px] text-parchment/60 mb-1.5">Gợi ý Avatar:</span>
            <div className="flex flex-wrap gap-2">
              {avatarPresets.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition ${
                    avatar === a ? 'bg-fae/30 border border-fae' : 'bg-thorn-dark border border-opal/20 hover:border-opal/50'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-parchment/10">
            <button
              type="button"
              onClick={() => setAddRivalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-thorn-dark text-xs font-semibold text-parchment/70 hover:text-parchment"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl rpg-btn-opal text-xs font-bold text-parchment flex items-center gap-1.5 shadow"
            >
              <UserPlus className="w-4 h-4 text-fae" />
              <span>Thêm Đối Thủ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
