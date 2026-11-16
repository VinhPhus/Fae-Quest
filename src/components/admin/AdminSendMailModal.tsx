import React, { useState } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { AdminUserOverview } from '../../types';
import { Mail, X, Send, AlertTriangle, Bell, Gift, Sparkles } from 'lucide-react';

interface Props {
  user: AdminUserOverview | null;
  onClose: () => void;
  defaultType?: 'warning' | 'notice' | 'gift';
  defaultSubject?: string;
  defaultContent?: string;
}

export const AdminSendMailModal: React.FC<Props> = ({
  user,
  onClose,
  defaultType = 'warning',
  defaultSubject = '',
  defaultContent = '',
}) => {
  const { adminSendMail, addToast } = useFaeQuestStore();

  const [messageType, setMessageType] = useState<'warning' | 'notice' | 'gift'>(defaultType);
  const [subject, setSubject] = useState<string>(
    defaultSubject || (defaultType === 'warning' ? 'Cảnh báo hoạt động bất thường' : 'Thông báo từ Ban Quản Trị')
  );
  const [content, setContent] = useState<string>(defaultContent);
  const [sending, setSending] = useState<boolean>(false);

  if (!user) return null;

  const applyTemplate = (type: 'warning' | 'contract' | 'gift') => {
    if (type === 'warning') {
      setMessageType('warning');
      setSubject('⚠️ Cảnh báo: Phát hiện tần suất hoàn thành nhiệm vụ bất thường');
      setContent(
        `Chào Thợ Săn ${user.username},\n\nHệ thống Live-Ops vừa ghi nhận tài khoản của bạn có chuỗi hoàn thành nhiệm vụ hoặc tích lũy EXP với tốc độ bất thường trong thời gian ngắn.\n\nFaeQuest được tạo ra nhằm rèn luyện tính kỷ luật và phát triển bản thân thực thụ, không phải để chạy đua bằng thủ thuật spam. Vui lòng điều chỉnh lại tốc độ để bảo vệ uy danh Thợ Săn của mình.`
      );
    } else if (type === 'contract') {
      setMessageType('notice');
      setSubject('📜 Nhắc nhở tinh thần Khế Ước Thợ Săn');
      setContent(
        `Chào Thợ Săn ${user.username},\n\nBan Quản Trị gửi lời chào thân ái. Hãy nhớ rằng mỗi nhiệm vụ hoàn thành là một bước tiến của bạn ngoài đời thực. Hãy tập trung vào chất lượng công việc và duy trì chuỗi kỷ luật bền bỉ mỗi ngày nhé!`
      );
    } else if (type === 'gift') {
      setMessageType('gift');
      setSubject('🎁 Quà Tặng Động Viên Từ Ban Quản Trị');
      setContent(
        `Chào Thợ Săn ${user.username},\n\nBan Quản Trị đánh giá cao tinh thần nỗ lực và sự kiên trì của bạn tại FaeQuest. Chúc bạn tiếp tục gặt hái nhiều thành tựu rực rỡ trên Đấu Trường!`
      );
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      addToast('Vui lòng điền đầy đủ tiêu đề và nội dung thư', 'error');
      return;
    }

    setSending(true);
    try {
      const success = await adminSendMail(user.id, subject.trim(), content.trim(), messageType);
      if (success) {
        addToast(`Đã gửi thư tới Thợ Săn "${user.username}"`, 'success');
        onClose();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#11212D] border border-[#253745] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#CCD0CF]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#253745] flex items-center justify-between bg-[#06141B]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shadow-inner">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-rpg tracking-wide">
                Gửi Thư / Cảnh Báo Trực Tiếp
              </h3>
              <p className="text-xs text-[#9BA8AB]">
                Gửi tới Thợ Săn: <span className="text-amber-300 font-bold">{user.username}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#9BA8AB] hover:text-white hover:bg-[#253745] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[65vh] no-scrollbar">
          {/* Quick Templates Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#9BA8AB] block">
              Mẫu Thư Nhanh
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyTemplate('warning')}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition cursor-pointer flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Cảnh báo bất thường</span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('contract')}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition cursor-pointer flex items-center gap-1.5"
              >
                <Bell className="w-3 h-3" />
                <span>Tinh thần Khế Ước</span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('gift')}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer flex items-center gap-1.5"
              >
                <Gift className="w-3 h-3" />
                <span>Khen thưởng</span>
              </button>
            </div>
          </div>

          {/* Message Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#9BA8AB] block">
              Loại Thư
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'warning', label: 'Cảnh Báo', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                { id: 'notice', label: 'Thông Báo', icon: <Bell className="w-3.5 h-3.5" /> },
                { id: 'gift', label: 'Quà Tặng', icon: <Gift className="w-3.5 h-3.5" /> },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMessageType(t.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                    messageType === t.id
                      ? 'bg-[#CCD0CF] text-[#06141B] border-white shadow-sm'
                      : 'bg-[#06141B] text-[#9BA8AB] border-[#253745] hover:text-[#CCD0CF]'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#9BA8AB] block">
              Tiêu Đề Thư
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Nhập tiêu đề thư..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#06141B] border border-[#253745] text-xs sm:text-sm text-[#CCD0CF] focus:outline-none focus:border-[#4A5C6A] transition"
              required
            />
          </div>

          {/* Content Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#9BA8AB] block">
              Nội Dung Thư
            </label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung nhắc nhở hoặc chỉ thị..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#06141B] border border-[#253745] text-xs sm:text-sm text-[#CCD0CF] focus:outline-none focus:border-[#4A5C6A] transition resize-none leading-relaxed"
              required
            />
            {messageType === 'warning' && (
              <p className="text-[11px] text-amber-400/90 italic">
                * Thư loại Cảnh Báo sẽ tự động bật Modal trang trọng trên màn hình của người dùng khi họ mở ứng dụng.
              </p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#253745]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#06141B] hover:bg-[#253745] text-xs font-semibold text-[#9BA8AB] transition cursor-pointer border border-[#253745]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2 rounded-xl bg-[#CCD0CF] hover:bg-white text-[#06141B] text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Đang gửi...' : 'Gửi Thư'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
