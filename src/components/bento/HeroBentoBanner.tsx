import React, { useRef, useState } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import {
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_UPLOAD_URL,
} from '../../constants/cloudinary';
import { compressImageToDataUrl } from '../../utils/imageCompressor';
import { CoinIcon } from '../ui/CoinIcon';
import {
  ChevronRight,
  Camera,
  Loader2,
  Flame,
  Trophy,
  Sparkles,
} from 'lucide-react';

export const HeroBentoBanner: React.FC = () => {
  const {
    playerName,
    avatarUrl,
    setAvatarUrl,
    exp,
    streakDays,
    rivals,
    setRoadmapOpen,
    addToast,
  } = useFaeQuestStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const currentIdx = getRankIndexByExp(exp);
  const currentTier = RANK_TIERS[currentIdx];
  const nextTier = currentIdx < RANK_TIERS.length - 1 ? RANK_TIERS[currentIdx + 1] : null;

  // Calculate progress
  let progressPercent = 100;
  if (nextTier) {
    const span = nextTier.minExp - currentTier.minExp;
    const gainedInTier = exp - currentTier.minExp;
    progressPercent = Math.min(100, Math.max(4, Math.round((gainedInTier / span) * 100)));
  }

  // Calculate player position in leaderboard
  const allCombatants = [
    { name: playerName, exp, isPlayer: true },
    ...rivals.map((r) => ({ name: r.name, exp: r.exp, isPlayer: false })),
  ].sort((a, b) => b.exp - a.exp);
  const playerRankPos = allCombatants.findIndex((c) => c.isPlayer) + 1;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 5 * 1024 * 1024) {
      addToast('Dung lượng ảnh tối đa 5MB. Vui lòng chọn ảnh nhỏ hơn!', 'error');
      return;
    }
    if (!file.type.startsWith('image/')) {
      addToast('Định dạng không hợp lệ. Vui lòng chọn file hình ảnh!', 'error');
      return;
    }

    try {
      setIsUploading(true);
      addToast('Đang tối ưu và tải ảnh đại diện...', 'info');

      const localDataUrl = await compressImageToDataUrl(file).catch(() => null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (localDataUrl) {
          setAvatarUrl(localDataUrl);
          addToast('Đã lưu ảnh đại diện trực tiếp trên trình duyệt!', 'info');
        } else {
          addToast('Tải ảnh thất bại!', 'error');
        }
        return;
      }

      const data = await response.json();
      if (data.secure_url) {
        setAvatarUrl(data.secure_url);
        addToast('Cập nhật ảnh đại diện lên Cloudinary thành công!', 'success');
      } else if (localDataUrl) {
        setAvatarUrl(localDataUrl);
        addToast('Đã lưu ảnh đại diện vào hệ thống!', 'success');
      }
    } catch (err) {
      try {
        const localDataUrl = await compressImageToDataUrl(file);
        setAvatarUrl(localDataUrl);
        addToast('Đã lưu ảnh đại diện trực tiếp trên thiết bị!', 'info');
      } catch {
        addToast('Không thể xử lý hình ảnh. Vui lòng thử lại!', 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="relative rounded-[28px] bg-[#11212D] p-6 sm:p-7 shadow-[0_16px_40px_rgba(0,0,0,0.7)] border border-[#253745] overflow-visible">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-[#4A5C6A]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-[#253745]/30 blur-3xl pointer-events-none" />

      <div className="flex flex-col-reverse sm:flex-row items-center sm:items-start justify-between gap-6 relative z-10">
        {/* Left Column: Hunter Info & Progression */}
        <div className="space-y-4 flex-1 min-w-0 w-full sm:w-auto text-left">
          {/* Top Tag & Rank Status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF]">
              CHIẾN DỊCH CHINH PHỤC
            </span>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#06141B] border border-[#253745] text-[#CCD0CF] flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-300" />
              <span>#{playerRankPos} BXH Đấu Trường</span>
            </span>
            {streakDays >= 3 && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>+20% EXP Chuỗi</span>
              </span>
            )}
          </div>

          {/* Hunter Name & Rank Badge */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-rpg font-black text-2xl sm:text-3xl md:text-4xl text-[#CCD0CF] tracking-wide truncate drop-shadow-md">
                {playerName}
              </h2>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1 rounded-lg text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#253745] transition cursor-pointer"
                title="Thay đổi ảnh đại diện"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-xs text-[#9BA8AB]">Bậc Danh Vọng:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#253745] border border-[#4A5C6A] text-xs font-black text-[#CCD0CF] shadow-md">
                <img
                  src={currentTier.iconUrl}
                  alt={currentTier.name}
                  className="w-4 h-4 object-contain"
                />
                <span className="tracking-wider">{currentTier.name.toUpperCase()}</span>
              </span>
            </div>
          </div>

          {/* EXP Progress Bar & Action */}
          <div className="space-y-2 pt-1 max-w-lg">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#CCD0CF] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#9BA8AB]" />
                <span>Tiến Độ EXP Thăng Hạng</span>
              </span>
              <span className="text-[#CCD0CF] font-mono">
                {nextTier ? `${exp} / ${nextTier.minExp} EXP` : `${exp} EXP (ĐỈNH CAO)`}
              </span>
            </div>

            {/* Glowing Multi-step Bar - Obsidian & Steel */}
            <div className="w-full bg-[#06141B] h-3.5 rounded-full overflow-hidden p-0.5 shadow-inner border border-[#253745]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4A5C6A] via-[#9BA8AB] to-[#CCD0CF] transition-all duration-500 shadow-[0_0_12px_rgba(204,208,207,0.3)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Bottom Sub-info: Coin Bonus & Chi Tiết Rank Button */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-[#9BA8AB] flex items-center gap-1">
                {nextTier ? (
                  <>
                    <span>Thăng hạng nhận:</span>
                    <strong className="text-[#CCD0CF] font-bold">+{nextTier.bonusCoins} Xu</strong>
                    <CoinIcon size="xs" />
                  </>
                ) : (
                  <span className="text-amber-300 font-bold">★ Đạt cảnh giới Thách Đấu tối thượng!</span>
                )}
              </div>

              {/* Primary CTA: Chi Tiết Rank */}
              <button
                type="button"
                onClick={() => setRoadmapOpen(true)}
                className="px-3.5 py-1 rounded-full bg-[#CCD0CF] hover:bg-white active:scale-95 text-[#06141B] font-extrabold text-[11px] flex items-center gap-1 shadow-[0_3px_14px_rgba(204,208,207,0.25)] transition cursor-pointer"
                title="Xem Lộ Trình Chinh Phục Đỉnh Thách Đấu"
              >
                <span>Chi Tiết Rank</span>
                <ChevronRight className="w-3 h-3 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Rank Emblem / Avatar extending above card edge */}
        <div className="relative shrink-0 flex flex-col items-center justify-center sm:-mt-10 md:-mt-14 sm:-mr-2 z-20">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative group cursor-pointer select-none"
            title="Bấm để cập nhật ảnh đại diện Thợ Săn"
          >
            {/* Ambient halo behind 3D emblem */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#CCD0CF]/15 via-[#4A5C6A]/20 to-[#253745]/20 blur-xl scale-125 pointer-events-none animate-pulse" />

            {/* Main 3D Emblem Container */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
              {avatarUrl ? (
                <div className="w-full h-full rounded-[30px] p-1.5 bg-gradient-to-br from-[#CCD0CF] via-[#4A5C6A] to-[#11212D] shadow-[0_16px_36px_rgba(0,0,0,0.85)]">
                  <img
                    src={avatarUrl}
                    alt={playerName}
                    className="w-full h-full object-cover rounded-[26px]"
                  />
                  {/* Floating Rank Badge in corner */}
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#11212D] border-2 border-[#CCD0CF] flex items-center justify-center shadow-lg">
                    <img
                      src={currentTier.iconUrl}
                      alt={currentTier.name}
                      className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* 3D Rank Icon popping out */}
                  <img
                    src={currentTier.iconUrl}
                    alt={currentTier.name}
                    className="w-full h-full object-contain drop-shadow-[0_16px_28px_rgba(204,208,207,0.25)] transform -rotate-2 hover:rotate-0 transition-transform duration-300"
                  />
                  {/* Glowing letter shield at bottom center */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#11212D] border border-[#4A5C6A] shadow-lg text-[10px] font-black tracking-widest text-[#CCD0CF] uppercase">
                    {currentTier.name}
                  </div>
                </div>
              )}

              {/* Uploading Spinner */}
              {isUploading && (
                <div className="absolute inset-0 bg-[#06141B]/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-1 z-30">
                  <Loader2 className="w-6 h-6 text-[#CCD0CF] animate-spin" />
                  <span className="text-[10px] font-bold text-[#CCD0CF]">Đang lưu ảnh...</span>
                </div>
              )}

              {/* Camera Hover Hint */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex flex-col items-center justify-center text-[#CCD0CF] gap-1 pointer-events-none backdrop-blur-[2px]">
                <Camera className="w-5 h-5 text-[#CCD0CF] animate-bounce" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Đổi Ảnh</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
