import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { AdminUserOverview } from '../../types';
import { Trash2, X, AlertOctagon } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface Props {
  user: AdminUserOverview | null;
  onClose: () => void;
}

export const AdminConfirmDeleteModal: React.FC<Props> = ({ user, onClose }) => {
  const { adminDeleteUser, addToast } = useFaeQuestStore();
  const [confirmText, setConfirmText] = useState<string>('');
  const [deleting, setDeleting] = useState<boolean>(false);

  useBodyScrollLock(!!user);

  if (!user) return null;

  const isConfirmed = confirmText.trim().toLowerCase() === user.username.trim().toLowerCase();

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setDeleting(true);
    try {
      const success = await adminDeleteUser(user.id);
      if (success) {
        addToast(`Đã xóa vĩnh viễn tài khoản "${user.username}"`, 'info');
        onClose();
      }
    } finally {
      setDeleting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-[100dvh] z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#06141B]/80 backdrop-blur-md animate-in fade-in duration-200 touch-none overscroll-none"
      onClick={onClose}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div
        className="relative w-full max-w-md bg-[#11212D] border-2 border-rose-600 rounded-3xl shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden text-[#CCD0CF] overscroll-contain touch-pan-y"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#253745] flex items-center justify-between bg-rose-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-rpg tracking-wide">
                Xóa Vĩnh Viễn Tài Khoản
              </h3>
              <p className="text-xs text-rose-300">
                Hành động này KHÔNG THỂ khôi phục!
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

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs sm:text-sm text-[#CCD0CF] leading-relaxed">
            Bạn chuẩn bị xóa toàn bộ dữ liệu của Thợ Săn{' '}
            <strong className="text-white bg-[#06141B] px-2 py-0.5 rounded border border-[#253745]">
              {user.username}
            </strong>{' '}
            khỏi hệ thống (bao gồm hồ sơ, cấp bậc, túi đồ và toàn bộ lịch sử nhật ký).
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#9BA8AB] block">
              Nhập chính xác tên <strong className="text-rose-400">{user.username}</strong> để xác nhận:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={user.username}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#06141B] border border-rose-500/50 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500 transition font-mono"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#253745]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#06141B] hover:bg-[#253745] text-xs font-semibold text-[#9BA8AB] transition cursor-pointer border border-[#253745]"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isConfirmed || deleting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? 'Đang xóa...' : 'Xác Nhận Xóa Vĩnh Viễn'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
