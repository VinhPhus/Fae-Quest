import React, { useState } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { AdminUserOverview } from '../../types';
import { ShieldAlert, X, Lock, Unlock, AlertTriangle, Clock } from 'lucide-react';

interface Props {
  user: AdminUserOverview | null;
  onClose: () => void;
  defaultReason?: string;
}

export const AdminBanUserModal: React.FC<Props> = ({
  user,
  onClose,
  defaultReason = '',
}) => {
  const { adminBanUser, addToast } = useFaeQuestStore();

  const isCurrentlyBanned =
    user?.banned_until && new Date(user.banned_until).getTime() > Date.now();

  const [banHours, setBanHours] = useState<number>(isCurrentlyBanned ? 0 : 24);
  const [reason, setReason] = useState<string>(
    defaultReason || user?.ban_reason || 'Tốc độ hoàn thành nhiệm vụ nhanh bất thường (Nghi vấn spam)'
  );
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!user) return null;

  const durationOptions = [
    { label: 'Mở Khóa (Gỡ phạt)', hours: 0, isUnlock: true },
    { label: '24 Giờ', hours: 24 },
    { label: '3 Ngày', hours: 72 },
    { label: '7 Ngày', hours: 168 },
    { label: '30 Ngày', hours: 720 },
    { label: 'Vĩnh Viễn', hours: 876000 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const success = await adminBanUser(user.id, banHours, reason.trim());
      if (success) {
        if (banHours === 0) {
          addToast(`Đã gỡ khóa tài khoản cho "${user.username}"`, 'success');
        } else {
          addToast(`Đã áp dụng lệnh khóa cho "${user.username}" (${banHours} giờ)`, 'info');
        }
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#11212D] border-2 border-rose-500/40 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#CCD0CF]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#253745] flex items-center justify-between bg-[#06141B]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-rpg tracking-wide">
                {banHours === 0 ? 'Mở Khóa Tài Khoản' : 'Khóa Tài Khoản Thợ Săn'}
              </h3>
              <p className="text-xs text-[#9BA8AB]">
                Đối tượng: <span className="text-white font-bold">{user.username}</span>
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

        {/* Current Status Badge */}
        {isCurrentlyBanned && (
          <div className="bg-rose-950/40 px-5 py-2.5 border-b border-rose-500/30 flex items-center gap-2 text-xs text-rose-300 font-medium">
            <Lock className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              Tài khoản hiện đang bị khóa đến:{' '}
              {new Date(user.banned_until!).toLocaleString('vi-VN')}
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto no-scrollbar">
          {/* Duration Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#9BA8AB] block">
              Thời Hạn Khóa
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {durationOptions.map((opt) => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => setBanHours(opt.hours)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center justify-center gap-1.5 ${
                    banHours === opt.hours
                      ? opt.isUnlock
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                        : 'bg-rose-600 text-white border-rose-400 shadow-md'
                      : 'bg-[#06141B] text-[#9BA8AB] border-[#253745] hover:text-[#CCD0CF]'
                  }`}
                >
                  {opt.isUnlock ? <Unlock className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ban Reason */}
          {banHours > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#9BA8AB] block">
                Lý Do Khóa (Sẽ hiển thị trên màn hình người dùng)
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do áp dụng lệnh phạt..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#06141B] border border-[#253745] text-xs sm:text-sm text-[#CCD0CF] focus:outline-none focus:border-rose-500/50 transition resize-none leading-relaxed"
                required
              />
            </div>
          )}

          {/* Notice */}
          <div className="p-3 rounded-xl bg-[#06141B] border border-[#253745] text-xs text-[#9BA8AB] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              {banHours === 0
                ? 'Mở khóa sẽ khôi phục toàn bộ quyền truy cập và chức năng của Thợ Săn ngay lập tức.'
                : 'Khi bị khóa, Thợ Săn sẽ bị chặn vào ứng dụng và chỉ thấy màn hình đếm ngược kèm lý do.'}
            </span>
          </div>

          {/* Action Buttons */}
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
              disabled={submitting}
              className={`px-5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 ${
                banHours === 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-[#06141B]'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              {banHours === 0 ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{submitting ? 'Đang xử lý...' : banHours === 0 ? 'Xác Nhận Mở Khóa' : 'Thi Hành Lệnh Khóa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
