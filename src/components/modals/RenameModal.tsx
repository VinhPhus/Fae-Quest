import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { Pencil, X } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  MAX_HUNTER_NAME_LENGTH,
  MIN_HUNTER_NAME_LENGTH,
  collapseHunterNameSpaces,
  validateHunterName,
} from '../../utils/hunterName';

export const RenameModal: React.FC = () => {
  const { isRenameOpen, setRenameOpen, playerName, setPlayerName } = useFaeQuestStore();
  const [name, setName] = useState(playerName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(playerName);
    setError(null);
  }, [playerName, isRenameOpen]);

  useBodyScrollLock(isRenameOpen);

  if (!isRenameOpen || typeof document === 'undefined') return null;

  const cleanLen = collapseHunterNameSpaces(name).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateHunterName(name);
    if (!res.valid) {
      setError(res.error || `Tên Thợ Săn cần từ ${MIN_HUNTER_NAME_LENGTH} đến ${MAX_HUNTER_NAME_LENGTH} ký tự`);
      return;
    }
    setPlayerName(res.cleanName);
    setRenameOpen(false);
  };

  return createPortal(
    <div
      onClick={() => setRenameOpen(false)}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      className="fixed inset-0 w-screen h-[100dvh] z-[100] bg-[#06141B]/80 backdrop-blur-md touch-none overscroll-none flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rpg-card rounded-2xl sm:rounded-3xl max-w-sm w-[94vw] sm:w-full max-h-[90dvh] overflow-y-auto overscroll-contain touch-pan-y p-5 sm:p-6 space-y-4 border border-fae/50 shadow-2xl relative"
      >
        <button
          onClick={() => setRenameOpen(false)}
          className="absolute top-4 right-4 text-parchment/40 hover:text-parchment p-1 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-rpg font-bold text-lg text-parchment flex items-center gap-2">
          <Pencil className="w-4 h-4 text-fae" />
          <span>Đổi Tên Nhân Vật</span>
        </h3>
        <p className="text-xs text-parchment/70">
          Nhập biệt danh hiệp sĩ bạn muốn xuất hiện trên Bảng Xếp Hạng.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Nhập biệt danh (2–20 ký tự)..."
              required
              minLength={MIN_HUNTER_NAME_LENGTH}
              maxLength={MAX_HUNTER_NAME_LENGTH}
              className="w-full px-4 py-2.5 rounded-xl bg-thorn-dark border border-opal/40 text-sm text-parchment focus:border-fae focus:outline-none shadow-inner"
            />
            <div className="flex items-center justify-between text-[11px] px-1">
              <span className={error ? 'text-rose-400 font-semibold' : 'text-parchment/60'}>
                {error || `Từ ${MIN_HUNTER_NAME_LENGTH} đến ${MAX_HUNTER_NAME_LENGTH} ký tự`}
              </span>
              <span
                className={`font-mono font-bold tabular-nums ${
                  cleanLen > MAX_HUNTER_NAME_LENGTH ? 'text-rose-400' : 'text-parchment/70'
                }`}
              >
                {cleanLen}/{MAX_HUNTER_NAME_LENGTH}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRenameOpen(false)}
              className="px-4 py-2 rounded-xl bg-thorn-dark text-xs font-semibold text-parchment/70 hover:text-parchment"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={cleanLen < MIN_HUNTER_NAME_LENGTH || cleanLen > MAX_HUNTER_NAME_LENGTH}
              className="px-5 py-2 rounded-xl rpg-btn-primary text-xs font-bold text-parchment shadow disabled:opacity-50"
            >
              Lưu Tên
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
