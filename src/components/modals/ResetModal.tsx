import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { AlertTriangle, X } from 'lucide-react';

export const ResetModal: React.FC = () => {
  const { isResetOpen, setResetOpen, resetAllData } = useFaeQuestStore();

  if (!isResetOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-thorn-dark/85 backdrop-blur-md">
      <div className="rpg-card rounded-3xl max-w-sm w-full p-6 space-y-4 border border-fae/50 text-center shadow-2xl relative">
        <button
          onClick={() => setResetOpen(false)}
          className="absolute top-4 right-4 text-parchment/40 hover:text-parchment p-1 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-bargain mx-auto flex items-center justify-center text-fae border border-fae/40 shadow-lg">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="font-rpg font-bold text-lg text-parchment">Khởi Tạo Lại Hành Trình?</h3>
        <p className="text-xs text-parchment/75 leading-relaxed">
          Toàn bộ điểm EXP, Rank, Xu và danh sách nhiệm vụ sẽ được đặt về trạng thái mặc định ban đầu.
        </p>

        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={() => setResetOpen(false)}
            className="px-4 py-2.5 rounded-xl bg-thorn-dark text-xs font-semibold text-parchment/70 hover:text-parchment"
          >
            Giữ lại
          </button>
          <button
            onClick={resetAllData}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition shadow"
          >
            Đặt lại tất cả
          </button>
        </div>
      </div>
    </div>
  );
};
