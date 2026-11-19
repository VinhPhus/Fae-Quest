import React, { useRef, useState } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { resolveTitleObject } from '../../constants/systemQuests';
import {
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_UPLOAD_URL,
} from '../../constants/cloudinary';
import { compressImageToDataUrl } from '../../utils/imageCompressor';
import { CoinIcon } from '../ui/CoinIcon';
import { DEFAULT_COVER_URL } from '../modals/ChangeCoverModal';
import {
  ChevronRight,
  Camera,
  Loader2,
  Flame,
  Trophy,
  Sparkles,
  Scroll,
  Star,
  CheckCircle2,
  Award,
} from 'lucide-react';

export const HeroBentoBanner: React.FC = () => {
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
    hunterId,
    communityProfiles,
    equippedTitleId,
    setRoadmapOpen,
    setOathOpen,
    setActiveTab,
    addToast,
  } = useFaeQuestStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  // Calculate circular progress dash offset (Radius r=42, circumference C=2*PI*42 ≈ 263.89)
  const circleRadius = 42;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Calculate player position in real leaderboard
  const allCombatants = [
    { id: hunterId, name: playerName, exp: typeof exp === 'number' ? exp : 0, isPlayer: true },
    ...(communityProfiles || [])
      .filter((p) => p.id !== hunterId && p.role !== 'admin')
      .map((p) => ({ id: p.id, name: p.username, exp: typeof p.exp === 'number' ? p.exp : 0, isPlayer: false })),
  ].sort((a, b) => b.exp - a.exp);
  const playerRankPos = allCombatants.findIndex((c) => c.isPlayer) + 1;

  // Resolve equipped title
  const titleObj = resolveTitleObject(equippedTitleId);

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
    } catch {
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
    <section className="w-full">
      {/* Hidden file input for Avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      {/* Main 2-Column Dashboard Header Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch w-full">
        {/* ================= CỘT TRÁI (lg:col-span-7): THẺ CĂN CƯỚC THỢ SĂN VỚI ẢNH BÌA ================= */}
        <div className="lg:col-span-7 rounded-2xl sm:rounded-3xl bg-[#11212D] border border-[#253745] shadow-xl relative overflow-hidden flex flex-col justify-between">
          {/* Nút Đổi Ảnh Bìa (Top-right of card) */}
          <button
            type="button"
            onClick={() => setChangeCoverOpen(true)}
            className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-30 px-2.5 py-1 rounded-full bg-[#06141B]/80 hover:bg-[#11212D] text-[#CCD0CF] hover:text-white border border-[#253745] hover:border-[#4A5C6A] backdrop-blur-md text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer group"
            title="Tùy chỉnh hoặc thay đổi ảnh bìa Thợ Săn"
          >
            <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#9BA8AB] group-hover:text-amber-300 transition-colors" />
            <span>Đổi Ảnh Bìa</span>
          </button>

          {/* 1. Background Ảnh Bìa (Cover Banner Dark Fantasy 120px - 140px) */}
          <div className="absolute top-0 inset-x-0 h-32 sm:h-36 overflow-hidden pointer-events-none z-0">
            <img
              src={coverUrl || DEFAULT_COVER_URL}
              alt="Hunter Dark Fantasy Cover"
              className="w-full h-full object-cover object-center opacity-50 brightness-90 scale-105"
              style={{
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
              }}
            />
            {/* Lớp hòa trộn gradient vào màu nền #11212D */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#06141B]/30 via-[#11212D]/60 to-[#11212D]" />
          </div>

          {/* Ánh sáng mờ nhẹ phía sau */}
          <div className="absolute top-1/2 right-1/4 w-44 h-44 rounded-full bg-[#4A5C6A]/10 blur-3xl pointer-events-none" />

          {/* 2. Khối Nội Dung (Flexbox Spread): Avatar (Trái) | Thông tin cốt lõi (Giữa) | Thành tích & Thao tác (Phải) */}
          <div className="relative z-10 px-3.5 sm:px-5 pb-3.5 sm:pb-4 pt-10 sm:pt-12 flex flex-col sm:flex-row items-center sm:items-end gap-3.5 sm:gap-4 w-full h-full">
            {/* CỘT TRÁI: Khối Avatar nhô lên đè ranh giới giữa ảnh bìa & màu trơn */}
            <div className="relative shrink-0 flex flex-col items-center justify-center -mt-8 sm:-mt-10 z-20">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center select-none shadow-[0_8px_25px_rgba(0,0,0,0.8)] rounded-full">
                {/* Pure SVG Circular Progress */}
                <svg
                  className="w-full h-full transform -rotate-90 pointer-events-none"
                  viewBox="0 0 100 100"
                >
                  {/* Track Circle (Nền Thép Tối) */}
                  <circle
                    cx="50"
                    cy="50"
                    r={circleRadius}
                    stroke="#253745"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  {/* Progress Circle (Phát Sáng Bạc #CCD0CF) */}
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
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(204,208,207,0.6))',
                    }}
                  />
                </svg>

                {/* Inner Avatar Image / Rank Emblem */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-2.5 sm:inset-3 rounded-full overflow-hidden bg-[#06141B] border-2 border-[#11212D] shadow-inner group cursor-pointer flex items-center justify-center z-10"
                  title="Nhấn để cập nhật ảnh đại diện Thợ Săn"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={playerName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <img
                      src={currentTier.iconUrl}
                      alt={currentTier.name}
                      className="w-full h-full object-contain [image-rendering:pixelated] p-2"
                    />
                  )}

                  {/* Camera Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex flex-col items-center justify-center text-[#CCD0CF] pointer-events-none">
                    <Camera className="w-4 h-4 text-[#CCD0CF]" />
                    <span className="text-[9px] font-extrabold uppercase mt-0.5">Đổi ảnh</span>
                  </div>

                  {/* Uploading Spinner */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-[#06141B]/85 backdrop-blur-sm rounded-full flex flex-col items-center justify-center gap-1 z-30">
                      <Loader2 className="w-5 h-5 text-[#CCD0CF] animate-spin" />
                      <span className="text-[9px] font-bold text-[#CCD0CF]">Đang lưu...</span>
                    </div>
                  )}
                </div>

                {/* Badge EXP (Pill) đè ngay mép dưới vòng tròn */}
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#11212D] border border-[#4A5C6A] shadow-md z-20 text-[10px] font-mono font-bold text-[#CCD0CF]">
                  {nextTier ? `${exp} / ${nextTier.minExp} EXP` : `${exp} EXP (MAX)`}
                </div>
              </div>
            </div>

            {/* CỘT GIỮA: Thông tin cốt lõi (Tên Thợ Săn, Tags, Danh Hiệu) */}
            <div className="flex-1 min-w-0 space-y-1.5 text-center sm:text-left w-full sm:w-auto">
              {/* Tên Thợ Săn */}
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="font-rpg font-black text-xl sm:text-2xl text-[#CCD0CF] tracking-wide truncate drop-shadow-md">
                  {playerName}
                </h2>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 rounded-lg text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#253745] transition cursor-pointer"
                  title="Thay đổi ảnh đại diện"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cụm Badge xếp ngang: #BXH, ⭐ Sao, 📜 Khế Ước */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#06141B]/90 border border-[#253745] text-[#CCD0CF] flex items-center gap-1 shadow-sm">
                  <Trophy className="w-3 h-3 text-amber-300" />
                  <span>#{playerRankPos} BXH</span>
                </span>

                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-400/40 text-yellow-300 flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span>⭐ {stars} Sao</span>
                </span>

                <button
                  type="button"
                  onClick={() => setOathOpen(true)}
                  className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#06141B]/90 hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] flex items-center gap-1 transition cursor-pointer"
                  title="Xem lại Bản Khế Ước Thợ Săn"
                >
                  <Scroll className="w-3 h-3 text-[#CCD0CF]" />
                  <span>Khế Ước</span>
                </button>

                {streakDays >= 3 && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 shadow-sm">
                    <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>+20% EXP Chuỗi</span>
                  </span>
                )}
              </div>

              {/* Icon & Tên Danh Hiệu đang trang bị */}
              <div className="flex items-center justify-center sm:justify-start pt-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('system-quests')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-[#06141B]/80 hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[11px] font-bold text-[#CCD0CF] shadow-sm transition cursor-pointer"
                  title="Mở Kho Danh Hiệu để thay đổi danh hiệu"
                >
                  <img
                    src={titleObj.iconUrl}
                    alt={titleObj.name}
                    className="w-3.5 h-3.5 object-contain"
                  />
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">{titleObj.name}</span>
                </button>
              </div>
            </div>

            {/* CỘT PHẢI: Thành tích & Thao tác (Căn lề phải ml-auto) */}
            <div className="sm:ml-auto flex flex-col items-center sm:items-end justify-between gap-2 shrink-0 w-full sm:w-auto">
              {/* Bậc Danh Vọng & Phần thưởng mục tiêu */}
              <div className="flex flex-col items-center sm:items-end gap-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-[#253745] border border-[#4A5C6A] text-[11px] font-black text-[#CCD0CF] shadow-sm">
                  <img
                    src={currentTier.iconUrl}
                    alt={currentTier.name}
                    className="w-3.5 h-3.5 object-contain [image-rendering:pixelated]"
                  />
                  <span>{currentTier.name.toUpperCase()}</span>
                </span>
                {nextTier && (
                  <span className="text-[10px] text-[#9BA8AB] flex items-center gap-1 font-medium">
                    <span>Lên hạng:</span>
                    <strong className="text-[#CCD0CF] font-bold">+{nextTier.bonusCoins} Xu</strong>
                    <CoinIcon size="xs" />
                  </span>
                )}
              </div>

              {/* Cụm 2 nút hành động (Chi Tiết Rank > và Đổi Danh Hiệu) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRoadmapOpen(true)}
                  className="px-2.5 sm:px-3 py-1 rounded-full bg-[#CCD0CF] hover:bg-white active:scale-95 text-[#06141B] font-extrabold text-[11px] flex items-center gap-1 shadow-[0_2px_10px_rgba(204,208,207,0.2)] transition cursor-pointer"
                  title="Xem Lộ Trình Chinh Phục Đỉnh Thách Đấu"
                >
                  <span>Chi Tiết Rank</span>
                  <ChevronRight className="w-3 h-3 stroke-[3]" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('system-quests')}
                  className="px-2.5 sm:px-3 py-1 rounded-full bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] hover:text-white active:scale-95 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                  title="Xem Bộ Sưu Tập Danh Hiệu"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Đổi Danh Hiệu</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI (lg:col-span-5): THỐNG KÊ THỢ SĂN (EXPANDED TO FULL HEIGHT) ================= */}
        <div className="lg:col-span-5 h-full flex flex-col justify-between bg-[#11212D] border border-[#253745] rounded-2xl sm:rounded-[28px] p-4 sm:p-5 shadow-xl relative overflow-hidden">
          {/* Hàng trên: Tiêu đề + Nút Kho Danh Hiệu > */}
          <div className="flex items-center justify-between pb-3 border-b border-[#253745]/70 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF]">
                <Award className="w-4 h-4" />
              </div>
              <h4 className="font-rpg font-extrabold text-sm sm:text-base text-[#CCD0CF] tracking-wide">
                Thống Kê Thợ Săn
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('system-quests')}
              className="px-3 py-1 rounded-full bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] hover:text-white transition font-bold text-xs flex items-center gap-1 cursor-pointer shadow-sm"
              title="Mở Đại Sảnh Thành Tựu & Kho Danh Hiệu"
            >
              <span>Kho Danh Hiệu</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Khu vực trung tâm: Trưng bày Danh Hiệu & Sao Vinh Dự */}
          <div
            onClick={() => setActiveTab('system-quests')}
            className="my-3 bg-[#06141B]/70 border border-[#253745] hover:border-[#4A5C6A] rounded-2xl p-3.5 flex items-center gap-4 cursor-pointer transition-all duration-300 shadow-inner group relative overflow-hidden"
            title="Nhấn để mở Kho Danh Hiệu & Đổi Danh Hiệu"
          >
            {/* Ambient subtle glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(204,208,207,0.08)_0%,transparent_70%)] pointer-events-none group-hover:scale-125 transition-transform" />

            {/* Icon danh hiệu lớn w-14 h-14 */}
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
                  className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full bg-[#11212D] border ${
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

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-400/40 text-yellow-300 inline-flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>⭐ {stars} Sao Vinh Dự</span>
                </span>
              </div>
            </div>
          </div>

          {/* Hàng dưới cùng: 3 ô chỉ số (Xu Vàng, Chuỗi Ngày, Đã Xong) grid-cols-3 gap-3 */}
          <div className="grid grid-cols-3 gap-3 relative z-10">
            {/* 1. Xu Vàng */}
            <div className="p-3 rounded-2xl bg-[#06141B] border border-[#253745] hover:border-amber-400/50 transition flex flex-col items-center justify-center text-center shadow-inner">
              <div className="flex items-center gap-1.5">
                <CoinIcon size="sm" />
                <span className="font-mono font-black text-sm sm:text-base text-[#CCD0CF] truncate">
                  {coins.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-[#9BA8AB] font-bold mt-1">Xu Vàng</span>
            </div>

            {/* 2. Chuỗi Ngày */}
            <div className="p-3 rounded-2xl bg-[#06141B] border border-[#253745] hover:border-amber-400/50 transition flex flex-col items-center justify-center text-center shadow-inner">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                <span className="font-mono font-black text-sm sm:text-base text-amber-300 truncate">
                  {streakDays}N
                </span>
              </div>
              <span className="text-[10px] text-[#9BA8AB] font-bold mt-1">Chuỗi Kỷ Luật</span>
            </div>

            {/* 3. Đã Xong */}
            <div className="p-3 rounded-2xl bg-[#06141B] border border-[#253745] hover:border-emerald-400/50 transition flex flex-col items-center justify-center text-center shadow-inner">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono font-black text-sm sm:text-base text-emerald-300 truncate">
                  {completedTotal.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-[#9BA8AB] font-bold mt-1">Nhiệm Vụ Xong</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
