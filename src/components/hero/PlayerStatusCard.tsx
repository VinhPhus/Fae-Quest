import React, { useRef, useState } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { SYSTEM_TITLES } from '../../constants/systemQuests';
import {
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_UPLOAD_URL,
} from '../../constants/cloudinary';
import { compressImageToDataUrl } from '../../utils/imageCompressor';
import { CoinIcon } from '../ui/CoinIcon';
import {
  Sparkles,
  CheckCircle,
  Flame,
  Star,
  Trophy,
  ChevronRight,
  Scroll,
  Camera,
  Loader2,
  Shield,
} from 'lucide-react';

export const PlayerStatusCard: React.FC = () => {
  const {
    playerName,
    avatarUrl,
    setAvatarUrl,
    exp,
    coins,
    completedTotal,
    streakDays,
    rivals,
    equippedTitleId,
    setActiveTab,
    setRoadmapOpen,
    setOathOpen,
    addToast,
  } = useFaeQuestStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const currentIdx = getRankIndexByExp(exp);
  const currentTier = RANK_TIERS[currentIdx];
  const nextTier = currentIdx < RANK_TIERS.length - 1 ? RANK_TIERS[currentIdx + 1] : null;

  // Calculate progress
  let progressPercent = 100;
  let expNeeded = 0;
  if (nextTier) {
    const span = nextTier.minExp - currentTier.minExp;
    const gainedInTier = exp - currentTier.minExp;
    progressPercent = Math.min(100, Math.max(3, Math.round((gainedInTier / span) * 100)));
    expNeeded = nextTier.minExp - exp;
  }

  // Calculate player position in leaderboard
  const allCombatants = [
    { name: playerName, exp, isPlayer: true },
    ...rivals.map((r) => ({ name: r.name, exp: r.exp, isPlayer: false })),
  ].sort((a, b) => b.exp - a.exp);
  const playerRankPos = allCombatants.findIndex((c) => c.isPlayer) + 1;

  // First letter of player name for Dark Fantasy default avatar
  const initialLetter = playerName.trim().charAt(0).toUpperCase() || 'F';

  // Handle Cloudinary upload with automatic smart local fallback
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so re-selecting same file triggers onChange
    e.target.value = '';

    // Client-side validation: Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      addToast('Dung lượng ảnh tối đa 5MB. Vui lòng chọn ảnh nhỏ hơn!', 'error');
      return;
    }

    // Client-side validation: Image types only
    if (!file.type.startsWith('image/')) {
      addToast('Định dạng không hợp lệ. Vui lòng chọn file hình ảnh!', 'error');
      return;
    }

    try {
      setIsUploading(true);
      addToast('Đang tối ưu và tải ảnh đại diện...', 'info');

      // 1. Tối ưu nén ảnh cục bộ trước (đảm bảo avatar luôn hoạt động 100%)
      const localDataUrl = await compressImageToDataUrl(file).catch(() => null);

      // 2. Thử tải lên Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        const errMsg = errJson?.error?.message || `Lỗi HTTP ${response.status}`;
        console.warn('Cloudinary upload warning:', errMsg);

        // Fallback: Nếu Cloudinary chưa tạo preset faequest_avatars, tự động lưu ảnh cục bộ
        if (localDataUrl) {
          setAvatarUrl(localDataUrl);
          addToast(
            `Đã lưu ảnh đại diện trực tiếp trên trình duyệt! (Lưu ý: Cloudinary báo "${errMsg}")`,
            'info'
          );
        } else {
          addToast(`Tải ảnh thất bại: ${errMsg}`, 'error');
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
      console.warn('Cloudinary network fallback:', err);
      // Fallback khi không kết nối được Cloudinary
      try {
        const localDataUrl = await compressImageToDataUrl(file);
        setAvatarUrl(localDataUrl);
        addToast('Đã lưu ảnh đại diện trực tiếp trên thiết bị của bạn!', 'info');
      } catch {
        addToast('Không thể xử lý hình ảnh. Vui lòng thử lại!', 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="rpg-card rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xl border border-fae/30">
      {/* Decorative ambient background glows */}
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-fae/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-opal/20 blur-3xl pointer-events-none" />

      {/* Hidden file input for Avatar Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center relative z-10">
        {/* Left: Avatar Upload Frame & Player Identity (5 cols) */}
        <div className="lg:col-span-5 flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-4 text-center sm:text-left">
          {/* Avatar Upload Frame with CHI TIẾT RANK Action */}
          <div
            className="relative group cursor-pointer shrink-0"
            onClick={() => fileInputRef.current?.click()}
            title="Nhấn để tải lên / thay đổi ảnh đại diện cá nhân"
          >
            <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-2xl bg-gradient-to-b from-thorn-dark via-bargain-dark to-thorn flex items-center justify-center border-2 border-fae/60 shadow-xl relative overflow-hidden group-hover:border-fae transition-all duration-300 group-hover:scale-105">
              {/* Avatar Image or Default Dark Fantasy Avatar */}
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={playerName}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#2D1036] via-[#4A152D] to-[#6B0733] flex flex-col items-center justify-center relative overflow-hidden select-none border border-fae/30">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(217,119,82,0.35)_0%,transparent_70%)]" />
                  <Shield className="w-14 h-14 text-fae/20 absolute -bottom-1" />
                  <span className="font-rpg font-black text-3xl sm:text-4xl text-parchment drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] relative z-10">
                    {initialLetter}
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-fae/80 absolute top-2 right-2 animate-pulse" />
                </div>
              )}

              {/* Hover Dark Overlay with Camera Icon */}
              <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1 z-10 rounded-2xl pointer-events-none">
                <Camera className="w-5 h-5 text-fae animate-bounce" />
                <span className="text-[10px] font-extrabold text-parchment tracking-wider uppercase drop-shadow">
                  Đổi Avatar
                </span>
              </div>

              {/* Uploading Spinner Overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-thorn-dark/85 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5 z-20 rounded-2xl pointer-events-none">
                  <Loader2 className="w-6 h-6 text-fae animate-spin" />
                  <span className="text-[9px] font-bold text-amber-200">Đang tải...</span>
                </div>
              )}
            </div>

            {/* CHI TIẾT RANK Action Button at bottom of Avatar frame */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRoadmapOpen(true);
              }}
              className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-fae text-thorn-dark shadow-md hover:scale-105 transition flex items-center gap-0.5 border border-parchment/30 z-20"
              title="Nhấn để xem Lộ Trình Chinh Phục Đỉnh Thách Đấu"
            >
              <span>CHI TIẾT RANK</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Identity & Current Rank Badge */}
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('system-quests')}
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-[11px] font-bold shadow transition hover:scale-105 ${
                  (SYSTEM_TITLES[equippedTitleId] || SYSTEM_TITLES.title_tan_binh_gai_do).badgeBg
                } ${(SYSTEM_TITLES[equippedTitleId] || SYSTEM_TITLES.title_tan_binh_gai_do).borderColor}`}
                title="Bấm để mở Kho Danh Hiệu & Đổi Danh Hiệu"
              >
                <img
                  src={(SYSTEM_TITLES[equippedTitleId] || SYSTEM_TITLES.title_tan_binh_gai_do).iconUrl}
                  alt={(SYSTEM_TITLES[equippedTitleId] || SYSTEM_TITLES.title_tan_binh_gai_do).name}
                  className="w-4 h-4 sm:w-4.5 sm:h-4.5 object-contain drop-shadow"
                />
                <span className={(SYSTEM_TITLES[equippedTitleId] || SYSTEM_TITLES.title_tan_binh_gai_do).color}>
                  {(SYSTEM_TITLES[equippedTitleId] || SYSTEM_TITLES.title_tan_binh_gai_do).name}
                </span>
                <span className="text-[10px] text-parchment/50 font-normal">| Đổi</span>
              </button>

              <button
                type="button"
                onClick={() => setOathOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-fae/15 hover:bg-fae/25 border border-fae/40 text-[11px] text-fae-light font-bold transition shadow-sm hover:scale-105"
                title="Xem lại Bản Khế Ước Thợ Săn FaeQuest"
              >
                <Scroll className="w-3 h-3 text-fae" />
                <span>📜 Khế Ước</span>
              </button>
            </div>

            {/* Player Name without Pencil Edit Button */}
            <div className="flex items-center justify-center sm:justify-start">
              <h2 className="text-xl sm:text-2xl font-extrabold text-parchment tracking-tight truncate">
                {playerName}
              </h2>
            </div>

            {/* Rank Tier Badge with 22x22px Rank Image */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-0.5">
              <span className="text-[11px] uppercase tracking-wider text-parchment/60">Bậc:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-rpg font-bold text-xs bg-gradient-to-r from-fae to-bargain text-parchment shadow border border-parchment/20">
                <img
                  src={currentTier.iconUrl}
                  alt={currentTier.name}
                  className="w-[22px] h-[22px] object-contain drop-shadow"
                  loading="lazy"
                />
                <span>{currentTier.name.toUpperCase()}</span>
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-opal/30 border border-opal-light/40 text-parchment flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-300" />
                <span>Hạng #{playerRankPos} BXH</span>
              </span>

              {streakDays >= 3 && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>+20% EXP</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Middle: EXP Bar & Next Rank Target (4 cols) */}
        <div className="lg:col-span-4 bg-thorn-dark/70 rounded-xl p-3.5 sm:p-4 border border-opal/30 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-parchment/80 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-fae fill-fae" />
              Tiến Độ EXP
            </span>
            <span className="font-bold text-fae">
              {nextTier ? `${exp} / ${nextTier.minExp} EXP` : `${exp} EXP (TỐI ĐA)`}
            </span>
          </div>

          {/* Progress bar container */}
          <div className="w-full bg-thorn-dark h-3 rounded-full overflow-hidden p-0.5 border border-opal/40">
            <div
              className="exp-bar-fill h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-parchment/70">
            <div className="truncate">
              {nextTier ? (
                <span>
                  Cần thêm <strong className="text-fae font-bold">{expNeeded} EXP</strong> lên{' '}
                  <strong className="text-parchment font-bold">{nextTier.name.toUpperCase()}</strong>
                </span>
              ) : (
                <span className="text-fae font-bold">Đỉnh Cao Thách Đấu!</span>
              )}
            </div>
            <span className="text-fae-light font-bold shrink-0 ml-2 inline-flex items-center gap-1">
              {nextTier ? (
                <>
                  <span>Thưởng: +{nextTier.bonusCoins || nextTier.coinBonus}</span>
                  <CoinIcon size="xs" />
                </>
              ) : (
                'Huyền Thoại'
              )}
            </span>
          </div>
        </div>

        {/* Right: Quick Stats (3 cols) */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-2.5">
          <div className="bg-thorn-dark/80 rounded-xl p-3 border border-fae/40 flex flex-col items-center justify-center text-center shadow group">
            <CoinIcon size="lg" className="mb-0.5" />
            <span className="text-xl font-extrabold text-fae leading-tight">{coins}</span>
            <span className="text-[10px] text-parchment/65 font-medium">Xu Vàng</span>
          </div>

          <div className="bg-thorn-dark/80 rounded-xl p-3 border border-opal/40 flex flex-col items-center justify-center text-center shadow">
            <CheckCircle className="w-5 h-5 text-emerald-400 mb-0.5" />
            <span className="text-xl font-extrabold text-parchment leading-tight">{completedTotal}</span>
            <span className="text-[10px] text-parchment/65 font-medium">Đã Xong</span>
          </div>
        </div>
      </div>
    </section>
  );
};
