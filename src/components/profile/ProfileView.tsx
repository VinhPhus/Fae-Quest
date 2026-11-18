import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { resolveTitleObject } from '../../constants/systemQuests';
import { CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_UPLOAD_URL } from '../../constants/cloudinary';
import { compressImageToDataUrl } from '../../utils/imageCompressor';
import { CoinIcon } from '../ui/CoinIcon';
import { DEFAULT_COVER_URL } from '../modals/ChangeCoverModal';
import { ProductivityAnalytics } from '../analytics/ProductivityAnalytics';
import {
  User,
  Camera,
  Loader2,
  Flame,
  Trophy,
  Sparkles,
  Scroll,
  Star,
  CheckCircle2,
  Award,
  ChevronRight,
  Copy,
  Clock,
  Check,
  Shield,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * Sticky Top Header for Profile Page
 */
export const ProfileHeader: React.FC = () => {
  const { exp, setOathOpen, setSettingsOpen } = useFaeQuestStore();
  const currentIdx = getRankIndexByExp(exp);
  const currentTier = RANK_TIERS[currentIdx];

  return (
    <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-[#11212D] border border-[#253745] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06141B] border border-[#4A5C6A] text-xs font-bold text-[#CCD0CF]">
            <User className="w-3.5 h-3.5 text-cyan-300" />
            <span>Hồ Sơ Cá Nhân</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#253745] border border-[#4A5C6A] text-[11px] font-extrabold text-[#CCD0CF]">
            <img src={currentTier.iconUrl} alt={currentTier.name} className="w-3.5 h-3.5 object-contain" />
            <span>{currentTier.name.toUpperCase()}</span>
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#CCD0CF] font-rpg tracking-wide">
          Hồ Sơ & Danh Vọng Thợ Săn
        </h2>
        <p className="text-xs text-[#9BA8AB] max-w-2xl leading-relaxed hidden sm:block">
          Quản lý định danh cá nhân, thẻ căn cước, danh hiệu vinh quang và lịch sử phát triển năng lực của bạn.
        </p>
      </div>

      <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
        <button
          type="button"
          onClick={() => setOathOpen(true)}
          className="px-3.5 py-2 rounded-full bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          title="Xem Bản Khế Ước Thợ Săn"
        >
          <Scroll className="w-3.5 h-3.5" />
          <span>Bản Khế Ước</span>
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="px-3.5 py-2 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs flex items-center gap-1.5 shadow-[0_4px_16px_rgba(204,208,207,0.2)] active:scale-95 transition cursor-pointer"
          title="Mở Cài Đặt Ứng Dụng"
        >
          <span>Cài Đặt</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Main Profile View Component
 * Contains Thẻ Căn Cước Thợ Săn and Thống Kê Thợ Săn side-by-side (grid-cols-1 lg:grid-cols-2),
 * followed by Hunter Account History & Productivity Analytics below.
 */
export const ProfileView: React.FC = () => {
  const {
    playerName,
    avatarUrl,
    setAvatarUrl,
    coverUrl,
    setChangeCoverOpen,
    exp,
    stars,
    coins,
    streakDays,
    completedTotal,
    tasks,
    hunterId,
    communityProfiles,
    equippedTitleId,
    focusSessionsCompleted,
    lastActiveDate,
    setRoadmapOpen,
    setOathOpen,
    setActiveTab,
    addToast,
  } = useFaeQuestStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showAnalyticsSection, setShowAnalyticsSection] = useState(true);

  const currentIdx = getRankIndexByExp(exp);
  const currentTier = RANK_TIERS[currentIdx];
  const nextTier = currentIdx < RANK_TIERS.length - 1 ? RANK_TIERS[currentIdx + 1] : null;

  // Calculate progress percent
  let progressPercent = 100;
  if (nextTier) {
    const span = nextTier.minExp - currentTier.minExp;
    const gainedInTier = exp - currentTier.minExp;
    progressPercent = Math.min(100, Math.max(0, Math.round((gainedInTier / span) * 100)));
  }

  // Circular progress SVG constants (r=42, C ≈ 263.89)
  const circleRadius = 42;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Leaderboard position calculation
  const allCombatants = [
    { id: hunterId, name: playerName, exp: typeof exp === 'number' ? exp : 0, isPlayer: true },
    ...(communityProfiles || [])
      .filter((p) => p.id !== hunterId && p.role !== 'admin')
      .map((p) => ({ id: p.id, name: p.username, exp: typeof p.exp === 'number' ? p.exp : 0, isPlayer: false })),
  ].sort((a, b) => b.exp - a.exp);
  const playerRankPos = allCombatants.findIndex((c) => c.isPlayer) + 1;

  const titleObj = resolveTitleObject(equippedTitleId);

  const handleCopyHunterId = () => {
    if (!hunterId) return;
    navigator.clipboard.writeText(hunterId);
    setCopiedId(true);
    addToast('Đã sao chép Mã Định Danh Thợ Săn vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopiedId(false), 2000);
  };

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
      addToast('Đang tối ưu và cập nhật ảnh đại diện...', 'info');

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
          addToast('Đã lưu ảnh đại diện thành công!', 'success');
        } else {
          addToast('Tải ảnh đại diện thất bại, vui lòng thử lại!', 'error');
        }
        return;
      }

      const data = await response.json();
      if (data.secure_url) {
        setAvatarUrl(data.secure_url);
        addToast('Cập nhật ảnh đại diện Thợ Săn thành công!', 'success');
      } else if (localDataUrl) {
        setAvatarUrl(localDataUrl);
        addToast('Đã lưu ảnh đại diện thành công!', 'success');
      }
    } catch {
      try {
        const localDataUrl = await compressImageToDataUrl(file);
        setAvatarUrl(localDataUrl);
        addToast('Đã lưu ảnh đại diện trực tiếp!', 'success');
      } catch {
        addToast('Không thể xử lý hình ảnh. Vui lòng thử lại!', 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for Avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      {/* ================= BỐ CỤC 2 CỘT NGANG (grid-cols-1 lg:grid-cols-2) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch w-full">
        {/* ================= THẺ 1: THẺ CĂN CƯỚC THỢ SĂN CÓ ẢNH BÌA & AVATAR ================= */}
        <div className="rounded-[28px] bg-[#11212D] border border-[#253745] shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[340px]">
          {/* Nút Đổi Ảnh Bìa */}
          <button
            type="button"
            onClick={() => setChangeCoverOpen(true)}
            className="absolute top-3 right-3 z-30 px-3 py-1.5 rounded-full bg-[#06141B]/85 hover:bg-[#11212D] text-[#CCD0CF] hover:text-white border border-[#253745] hover:border-[#4A5C6A] backdrop-blur-md text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer group"
            title="Tùy chỉnh hoặc thay đổi ảnh bìa Thợ Săn"
          >
            <Camera className="w-3.5 h-3.5 text-[#9BA8AB] group-hover:text-amber-300 transition-colors" />
            <span>Đổi Ảnh Bìa</span>
          </button>

          {/* 1. Background Ảnh Bìa (Cover Banner Dark Fantasy) */}
          <div className="absolute top-0 inset-x-0 h-36 sm:h-40 overflow-hidden pointer-events-none z-0">
            <img
              src={coverUrl || DEFAULT_COVER_URL}
              alt="Hunter Dark Fantasy Cover"
              className="w-full h-full object-cover object-center opacity-55 brightness-90 scale-105"
              style={{
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 100%)',
              }}
            />
            {/* Lớp hòa trộn gradient vào màu nền #11212D */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#06141B]/30 via-[#11212D]/60 to-[#11212D]" />
          </div>

          {/* Ánh sáng mờ nhẹ phía sau */}
          <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-[#4A5C6A]/15 blur-3xl pointer-events-none" />

          {/* 2. Khối Nội Dung Thẻ Căn Cước */}
          <div className="relative z-10 px-4 sm:px-6 pb-5 pt-16 sm:pt-20 flex flex-col justify-between flex-1 gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 w-full">
              {/* Vòng tròn Avatar SVG Circular Progress */}
              <div className="relative shrink-0 flex flex-col items-center justify-center -mt-10 sm:-mt-12 z-20">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center select-none shadow-[0_8px_25px_rgba(0,0,0,0.8)] rounded-full">
                  <svg className="w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={circleRadius} stroke="#253745" strokeWidth="5" fill="transparent" />
                    <circle
                      cx="50"
                      cy="50"
                      r={circleRadius}
                      stroke="#CCD0CF"
                      strokeWidth="5"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                      style={{ filter: 'drop-shadow(0 0 8px rgba(204,208,207,0.6))' }}
                    />
                  </svg>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-2.5 sm:inset-3 rounded-full overflow-hidden bg-[#06141B] border-2 border-[#11212D] shadow-inner group cursor-pointer flex items-center justify-center z-10"
                    title="Nhấn để cập nhật ảnh đại diện Thợ Săn"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={playerName} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <img src={currentTier.iconUrl} alt={currentTier.name} className="w-full h-full object-contain p-2" />
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex flex-col items-center justify-center text-[#CCD0CF] pointer-events-none">
                      <Camera className="w-4 h-4 text-[#CCD0CF]" />
                      <span className="text-[9px] font-extrabold uppercase mt-0.5">Đổi ảnh</span>
                    </div>

                    {isUploading && (
                      <div className="absolute inset-0 bg-[#06141B]/85 backdrop-blur-sm rounded-full flex flex-col items-center justify-center gap-1 z-30">
                        <Loader2 className="w-5 h-5 text-[#CCD0CF] animate-spin" />
                        <span className="text-[9px] font-bold text-[#CCD0CF]">Đang lưu...</span>
                      </div>
                    )}
                  </div>

                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#11212D] border border-[#4A5C6A] shadow-md z-20 text-[10px] font-mono font-bold text-[#CCD0CF]">
                    {nextTier ? `${exp} / ${nextTier.minExp} EXP` : `${exp} EXP (MAX)`}
                  </div>
                </div>
              </div>

              {/* Thông tin cốt lõi (Tên Thợ Săn, Tags, Danh Hiệu) */}
              <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left w-full sm:w-auto">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="font-rpg font-black text-2xl sm:text-3xl text-[#CCD0CF] tracking-wide truncate drop-shadow-md">
                    {playerName}
                  </h3>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-lg text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#253745] transition cursor-pointer"
                    title="Thay đổi ảnh đại diện"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* Cụm Badge: #BXH, ⭐ Sao, 📜 Khế Ước */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#06141B]/90 border border-[#253745] text-[#CCD0CF] flex items-center gap-1 shadow-sm">
                    <Trophy className="w-3.5 h-3.5 text-amber-300" />
                    <span>#{playerRankPos} BXH</span>
                  </span>

                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-400/40 text-yellow-300 flex items-center gap-1 shadow-sm">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span>⭐ {stars} Sao</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setOathOpen(true)}
                    className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#06141B]/90 hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] flex items-center gap-1 transition cursor-pointer"
                    title="Xem lại Bản Khế Ước Thợ Săn"
                  >
                    <Scroll className="w-3.5 h-3.5 text-[#CCD0CF]" />
                    <span>Khế Ước</span>
                  </button>

                  {streakDays >= 3 && (
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 shadow-sm">
                      <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>+20% EXP Chuỗi</span>
                    </span>
                  )}
                </div>

                {/* Danh hiệu đang trang bị */}
                <div className="flex items-center justify-center sm:justify-start pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('system-quests')}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#06141B]/80 hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-xs font-bold text-[#CCD0CF] shadow-sm transition cursor-pointer"
                    title="Mở Kho Danh Hiệu để thay đổi danh hiệu"
                  >
                    <img src={titleObj.iconUrl} alt={titleObj.name} className="w-4 h-4 object-contain" />
                    <span className="truncate max-w-[220px]">{titleObj.name}</span>
                    <span className="text-[10px] text-[#9BA8AB] font-normal">| Đổi</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Hàng dưới: Cấp Bậc & Cụm nút hành động */}
            <div className="pt-3 border-t border-[#253745]/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#253745] border border-[#4A5C6A] text-xs font-black text-[#CCD0CF] shadow-sm">
                  <img src={currentTier.iconUrl} alt={currentTier.name} className="w-4 h-4 object-contain" />
                  <span>{currentTier.name.toUpperCase()}</span>
                </span>
                {nextTier && (
                  <span className="text-[11px] text-[#9BA8AB] flex items-center gap-1 font-medium">
                    <span>Lên hạng:</span>
                    <strong className="text-[#CCD0CF] font-bold">+{nextTier.bonusCoins} Xu</strong>
                    <CoinIcon size="xs" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRoadmapOpen(true)}
                  className="px-3 py-1.5 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs flex items-center gap-1 shadow-md transition active:scale-95 cursor-pointer"
                  title="Xem Lộ Trình Chinh Phục Đỉnh Thách Đấu"
                >
                  <span>Chi Tiết Rank</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('system-quests')}
                  className="px-3 py-1.5 rounded-full bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] hover:text-white font-bold text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer"
                  title="Xem Bộ Sưu Tập Danh Hiệu"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Đổi Danh Hiệu</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= THẺ 2: THỐNG KÊ THỢ SĂN ================= */}
        <div className="rounded-[28px] bg-[#11212D] border border-[#253745] shadow-xl p-5 sm:p-6 flex flex-col justify-between min-h-[340px] relative overflow-hidden">
          {/* Header Thống Kê Thợ Săn */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#253745]/70 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shadow">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-rpg font-extrabold text-base sm:text-lg text-[#CCD0CF] tracking-wide">
                  Thống Kê Thợ Săn
                </h4>
                <span className="text-[11px] text-[#9BA8AB] block">Tổng hợp tài nguyên & thành tích</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('system-quests')}
              className="px-3 py-1.5 rounded-full bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] hover:text-white transition font-bold text-xs flex items-center gap-1 cursor-pointer shadow-sm"
              title="Mở Đại Sảnh Thành Tựu & Kho Danh Hiệu"
            >
              <span>Kho Danh Hiệu</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ô Trưng Bày Danh Hiệu Hiện Tại */}
          <div
            onClick={() => setActiveTab('system-quests')}
            className="my-3.5 bg-[#06141B]/75 border border-[#253745] hover:border-[#4A5C6A] rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-300 shadow-inner group relative overflow-hidden"
            title="Nhấn để mở Kho Danh Hiệu & Đổi Danh Hiệu"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(204,208,207,0.08)_0%,transparent_70%)] pointer-events-none group-hover:scale-125 transition-transform" />

            {/* Icon Danh Hiệu Lớn */}
            <div className="w-14 h-14 rounded-2xl bg-[#11212D] border border-[#4A5C6A] flex items-center justify-center p-2 shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <img
                src={titleObj.iconUrl}
                alt={titleObj.name}
                className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(204,208,207,0.25)]"
              />
            </div>

            {/* Cột thông tin bên cạnh */}
            <div className="flex-1 min-w-0 space-y-1 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#9BA8AB] block">
                DANH HIỆU HIỆN TẠI
              </span>
              <h5 className="font-rpg font-bold text-base sm:text-lg text-[#CCD0CF] group-hover:text-white transition truncate">
                {titleObj.name}
              </h5>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span
                  className={`text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full bg-[#11212D] border ${
                    titleObj.rarity === 'legendary'
                      ? 'border-amber-400/50 text-amber-300'
                      : titleObj.rarity === 'epic'
                      ? 'border-purple-400/50 text-purple-300'
                      : titleObj.rarity === 'rare'
                      ? 'border-sky-400/50 text-sky-300'
                      : 'border-[#4A5C6A] text-[#9BA8AB]'
                  }`}
                >
                  {titleObj.rarity.toUpperCase()}
                </span>

                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-400/40 text-yellow-300 inline-flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>⭐ {stars} Sao Vinh Dự</span>
                </span>
              </div>
            </div>
          </div>

          {/* Hàng 3 ô chỉ số (Xu Vàng, Chuỗi Kỷ Luật, Nhiệm Vụ Xong) */}
          <div className="grid grid-cols-3 gap-3 relative z-10">
            {/* 1. Xu Vàng */}
            <div className="p-3.5 rounded-2xl bg-[#06141B] border border-[#253745] hover:border-amber-400/50 transition flex flex-col items-center justify-center text-center shadow-inner">
              <div className="flex items-center gap-1.5">
                <CoinIcon size="sm" />
                <span className="font-mono font-black text-base sm:text-lg text-[#CCD0CF] truncate">
                  {coins.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-[#9BA8AB] font-bold mt-1">Xu Vàng</span>
            </div>

            {/* 2. Chuỗi Ngày */}
            <div className="p-3.5 rounded-2xl bg-[#06141B] border border-[#253745] hover:border-amber-400/50 transition flex flex-col items-center justify-center text-center shadow-inner">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                <span className="font-mono font-black text-base sm:text-lg text-amber-300 truncate">
                  {streakDays}N
                </span>
              </div>
              <span className="text-[10px] text-[#9BA8AB] font-bold mt-1">Chuỗi Kỷ Luật</span>
            </div>

            {/* 3. Nhiệm Vụ Xong */}
            <div className="p-3.5 rounded-2xl bg-[#06141B] border border-[#253745] hover:border-emerald-400/50 transition flex flex-col items-center justify-center text-center shadow-inner">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono font-black text-base sm:text-lg text-emerald-300 truncate">
                  {completedTotal.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-[#9BA8AB] font-bold mt-1">Nhiệm Vụ Xong</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= KHUNG LỊCH SỬ & THÔNG TIN ĐỊNH DANH (DƯỚI PROFILE) ================= */}
      <div className="rounded-[28px] bg-[#11212D] border border-[#253745] p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#253745]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-cyan-300 shadow">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-rpg font-extrabold text-base sm:text-lg text-[#CCD0CF] tracking-wide">
                Thông Tin & Lịch Sử Hoạt Động Thợ Săn
              </h4>
              <span className="text-[11px] text-[#9BA8AB] block">
                Dữ liệu cá nhân được đồng bộ và bảo vệ an toàn
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAnalyticsSection(!showAnalyticsSection)}
            className="px-3 py-1.5 rounded-full bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showAnalyticsSection ? 'Ẩn Biểu Đồ Năng Lực' : 'Xem Biểu Đồ Năng Lực'}</span>
            {showAnalyticsSection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 4 Thẻ Thông Số Tài Khoản */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Mã Định Danh Thợ Săn */}
          <div className="p-3.5 rounded-2xl bg-[#06141B] border border-[#253745] flex items-center justify-between gap-2 shadow-inner">
            <div className="min-w-0">
              <span className="text-[10px] text-[#9BA8AB] uppercase font-bold block">MÃ ĐỊNH DANH</span>
              <span className="font-mono text-xs text-[#CCD0CF] font-bold truncate block">
                {hunterId ? `${hunterId.substring(0, 10)}...` : 'Chưa thiết lập'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyHunterId}
              className="p-2 rounded-xl bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] hover:text-white transition cursor-pointer shrink-0"
              title="Sao chép Mã Định Danh Thợ Săn"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* 2. Phiên Fae Focus */}
          <div className="p-3.5 rounded-2xl bg-[#06141B] border border-[#253745] flex items-center gap-3 shadow-inner">
            <div className="w-9 h-9 rounded-xl bg-[#11212D] border border-[#253745] flex items-center justify-center text-cyan-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#9BA8AB] uppercase font-bold block">PHIÊN FOCUS ĐÃ XONG</span>
              <span className="font-mono text-base font-black text-[#CCD0CF]">
                {focusSessionsCompleted || 0} Phiên
              </span>
            </div>
          </div>

          {/* 3. Hoạt Động Gần Nhất */}
          <div className="p-3.5 rounded-2xl bg-[#06141B] border border-[#253745] flex items-center gap-3 shadow-inner">
            <div className="w-9 h-9 rounded-xl bg-[#11212D] border border-[#253745] flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#9BA8AB] uppercase font-bold block">HOẠT ĐỘNG GẦN NHẤT</span>
              <span className="font-mono text-xs font-bold text-[#CCD0CF] truncate block">
                {lastActiveDate ? lastActiveDate : 'Hôm nay'}
              </span>
            </div>
          </div>

          {/* 4. Tổng Nhiệm Vụ Trong Danh Sách */}
          <div className="p-3.5 rounded-2xl bg-[#06141B] border border-[#253745] flex items-center gap-3 shadow-inner">
            <div className="w-9 h-9 rounded-xl bg-[#11212D] border border-[#253745] flex items-center justify-center text-amber-300 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#9BA8AB] uppercase font-bold block">NHIỆM VỤ ĐANG QUẢN LÝ</span>
              <span className="font-mono text-base font-black text-[#CCD0CF]">
                {tasks.length} Mục
              </span>
            </div>
          </div>
        </div>

        {/* Tích Hợp Biểu Đồ Năng Suất Cá Nhân */}
        {showAnalyticsSection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-3 border-t border-[#253745]/70"
          >
            <ProductivityAnalytics />
          </motion.div>
        )}
      </div>
    </div>
  );
};
