import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { ShieldAlert, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const AdminWarningModal: React.FC = () => {
  const { activeWarningMessage, setActiveWarningMessage, markMessageAsRead } = useFaeQuestStore();

  if (!activeWarningMessage) return null;

  const handleAcknowledge = async () => {
    if (activeWarningMessage.id) {
      await markMessageAsRead(activeWarningMessage.id);
    }
    setActiveWarningMessage(null);
  };

  const formattedDate = new Date(activeWarningMessage.created_at).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#11212D] border-2 border-amber-500/50 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-[#CCD0CF] space-y-5 overflow-hidden">
        {/* Glow Header FX */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Warning Icon Badge */}
        <div className="flex items-center gap-3.5 border-b border-[#253745] pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3" />
              <span>Cảnh Báo Từ Quản Trị Viên</span>
            </div>
            <h3 className="text-lg font-extrabold text-white font-rpg tracking-wide truncate mt-0.5">
              {activeWarningMessage.subject}
            </h3>
          </div>
        </div>

        {/* Time Stamp */}
        <div className="flex items-center gap-1.5 text-xs text-[#9BA8AB]">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Thời gian gửi: {formattedDate}</span>
        </div>

        {/* Message Content */}
        <div className="bg-[#06141B] border border-[#253745] rounded-2xl p-4.5 space-y-3">
          <p className="text-sm text-[#CCD0CF] leading-relaxed whitespace-pre-wrap">
            {activeWarningMessage.content}
          </p>
          <div className="pt-2 border-t border-[#253745]/60 text-xs text-[#9BA8AB] italic">
            🛡️ Vui lòng rà soát lại tiến độ thực thi để bảo toàn sự công bằng trên Đấu Trường FaeQuest.
          </div>
        </div>

        {/* Confirmation Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleAcknowledge}
            className="w-full py-3 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#06141B] font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.25)] transition duration-200 active:scale-[0.98] cursor-pointer"
          >
            <CheckCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Tôi Đã Hiểu & Cam Kết Tuân Thủ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
