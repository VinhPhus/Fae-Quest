import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { supabase } from '../../utils/supabaseClient';
import { playSound } from '../../utils/soundEngine';
import {
  X,
  Swords,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Loader2,
  Calendar,
  Users,
  ShieldAlert,
} from 'lucide-react';

interface PreviewHunter {
  id: string;
  username: string;
  avatar_url?: string | null;
  currentExp: number;
  currentTierName: string;
  currentTierIcon: string;
  newExp: number;
  newTierName: string;
  newTierIcon: string;
}

export const SeasonResetModal: React.FC = () => {
  const {
    isSeasonResetModalOpen,
    setSeasonResetModalOpen,
    resetSeasonRank,
    soundEnabled,
  } = useFaeQuestStore();

  const [seasonTitle, setSeasonTitle] = useState<string>('Mùa 2: Kỷ Nguyên Hắc Ám');
  const [customNotice, setCustomNotice] = useState<string>(
    '⚔️ Mùa giải mới đã chính thức bắt đầu!\nToàn bộ Thợ Săn đã được lùi 2 bậc Rank để sẵn sàng cho cuộc đua vinh quang mới.\nHãy hoàn thành nhiệm vụ mỗi ngày để leo lên Bục Vinh Quang!'
  );
  const [hunters, setHunters] = useState<PreviewHunter[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  useEffect(() => {
    if (!isSeasonResetModalOpen) return;

    const fetchPreview = async () => {
      setIsLoadingPreview(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, exp, role')
          .neq('role', 'admin')
          .order('exp', { ascending: false })
          .limit(10);

        if (!error && data) {
          const mapped: PreviewHunter[] = data.map((p) => {
            const curExp = Number(p.exp) || 0;
            const curIdx = getRankIndexByExp(curExp);
            const newIdx = Math.max(0, curIdx - 2);

            return {
              id: p.id,
              username: p.username || 'Thợ Săn',
              avatar_url: p.avatar_url,
              currentExp: curExp,
              currentTierName: RANK_TIERS[curIdx].name,
              currentTierIcon: RANK_TIERS[curIdx].iconUrl,
              newExp: RANK_TIERS[newIdx].minExp,
              newTierName: RANK_TIERS[newIdx].name,
              newTierIcon: RANK_TIERS[newIdx].iconUrl,
            };
          });
          setHunters(mapped);
        }
      } catch (err) {
        console.error('Error fetching reset preview:', err);
      } finally {
        setIsLoadingPreview(false);
      }
    };

    fetchPreview();
  }, [isSeasonResetModalOpen]);

  if (!isSeasonResetModalOpen) return null;

  const handleClose = () => {
    playSound('ui_click', soundEnabled);
    setSeasonResetModalOpen(false);
  };

  const handleConfirmReset = async () => {
    playSound('ui_click', soundEnabled);
    setIsResetting(true);
    const result = await resetSeasonRank(seasonTitle.trim(), customNotice.trim());
    setIsResetting(false);

    if (result.success) {
      playSound('rank_up', soundEnabled);
      setSeasonResetModalOpen(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-[#11212D] border border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] my-auto overflow-hidden text-[#CCD0CF]"
        >
          {/* Header Glow */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            disabled={isResetting}
            className="absolute top-4 right-4 p-2 rounded-xl text-[#9BA8AB] hover:text-white hover:bg-[#253745] transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title & Badge */}
          <div className="space-y-2 mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wide">
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <span>ĐIỀU HÀNH MÙA GIẢI • RESET RANK ĐẤU TRƯỜNG</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-rpg tracking-wide flex items-center gap-2">
              <span>⚔️ Khởi Tạo Lại Mùa Giải Mới</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#9BA8AB] leading-relaxed">
              Áp dụng quy tắc giảm <strong>2 bậc Rank</strong> cho toàn bộ Thợ Săn trên hệ thống (ví dụ: <em>Cao Thủ ➔ Vàng</em>, <em>Lục Bảo ➔ Bạc</em>). Người chơi ở 2 bậc thấp nhất (Đồng, Bạc) sẽ được đưa về mốc khởi điểm (Đồng: 0 EXP).
            </p>
          </div>

          {/* Input Section */}
          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9BA8AB] mb-1.5">
                Tên Mùa Giải Mới
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={seasonTitle}
                  onChange={(e) => setSeasonTitle(e.target.value)}
                  disabled={isResetting}
                  placeholder="VD: Mùa 2: Kỷ Nguyên Hắc Ám"
                  className="w-full bg-[#06141B] border border-[#253745] focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm font-bold text-white placeholder-[#4A5C6A] outline-none transition"
                />
                <Calendar className="w-4 h-4 text-[#9BA8AB] absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9BA8AB] mb-1.5">
                Nội Dung Thông Báo Tự Động Gửi Lên BXH
              </label>
              <textarea
                value={customNotice}
                onChange={(e) => setCustomNotice(e.target.value)}
                disabled={isResetting}
                rows={3}
                placeholder="Nhập thông báo gửi đến toàn bộ Thợ Săn..."
                className="w-full bg-[#06141B] border border-[#253745] focus:border-amber-400 rounded-xl p-3 text-xs sm:text-sm text-[#CCD0CF] placeholder-[#4A5C6A] outline-none transition resize-none"
              />
            </div>
          </div>

          {/* Live Preview List */}
          <div className="mb-5 bg-[#06141B] border border-[#253745] rounded-2xl p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#9BA8AB] mb-2.5">
              <span className="flex items-center gap-1.5 text-amber-300">
                <Users className="w-3.5 h-3.5" />
                Mô Phỏng Lùi 2 Bậc (Top 10 Thợ Săn)
              </span>
              <span>Bậc Mới Sau Reset</span>
            </div>

            {isLoadingPreview ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-[#9BA8AB]">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Đang tải danh sách người chơi...</span>
              </div>
            ) : hunters.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#9BA8AB]">
                Chưa có dữ liệu Thợ Săn nào trên hệ thống.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {hunters.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between text-xs bg-[#11212D]/80 border border-[#253745] rounded-xl px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-[#CCD0CF] truncate max-w-[120px] sm:max-w-[180px]">
                        {h.username}
                      </span>
                      <div className="inline-flex items-center gap-1 text-[11px] text-[#9BA8AB] shrink-0">
                        <img
                          src={h.currentTierIcon}
                          alt={h.currentTierName}
                          className="w-3.5 h-3.5 object-contain [image-rendering:pixelated]"
                        />
                        <span>{h.currentTierName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 text-[#4A5C6A]" />
                      <div className="inline-flex items-center gap-1 font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                        <img
                          src={h.newTierIcon}
                          alt={h.newTierName}
                          className="w-3.5 h-3.5 object-contain [image-rendering:pixelated]"
                        />
                        <span>{h.newTierName}</span>
                        <span className="text-[10px] text-[#9BA8AB] font-mono">
                          ({h.newExp} EXP)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning Note */}
          <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 mb-6">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200/90 leading-relaxed">
              <strong>Lưu ý quan trọng:</strong> Thao tác này sẽ cập nhật điểm EXP khởi đầu của toàn bộ Thợ Săn trên Supabase và tạo thông báo mùa mới. Sau khi reset, thứ hạng sẽ được tính toán lại theo mùa mới.
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isResetting}
              className="px-4 py-2.5 rounded-xl border border-[#253745] hover:border-[#4A5C6A] bg-[#06141B] text-[#CCD0CF] hover:text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              Hủy Bỏ
            </button>

            <button
              type="button"
              onClick={handleConfirmReset}
              disabled={isResetting || !seasonTitle.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#06141B] text-xs font-black shadow-lg hover:shadow-amber-500/25 flex items-center gap-2 transition cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#06141B]" />
                  <span>Đang Reset Toàn Bộ Rank...</span>
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4 text-[#06141B]" />
                  <span>Xác Nhận Reset Rank Mùa Giải</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
