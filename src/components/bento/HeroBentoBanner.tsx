import React, { useRef, useState } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { resolveTitleObject } from '../../constants/systemQuests';
import { CATEGORIES, DIFFICULTIES } from '../../constants/categories';
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
  Scroll,
  Star,
  Play,
  Check,
  CheckCircle2,
  Award,
} from 'lucide-react';

export const HeroBentoBanner: React.FC = () => {
  const {
    playerName,
    avatarUrl,
    setAvatarUrl,
    exp,
    stars,
    coins,
    streakDays,
    completedTotal,
    rivals,
    tasks,
    toggleTask,
    activePomodoroTaskId,
    setActivePomodoroTaskId,
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

  // Calculate player position in leaderboard
  const allCombatants = [
    { name: playerName, exp, isPlayer: true },
    ...rivals.map((r) => ({ name: r.name, exp: r.exp, isPlayer: false })),
  ].sort((a, b) => b.exp - a.exp);
  const playerRankPos = allCombatants.findIndex((c) => c.isPlayer) + 1;

  // Resolve equipped title
  const titleObj = resolveTitleObject(equippedTitleId);

  // Pick the single most prioritized task for compact focus widget
  const focusTask = activePomodoroTaskId
    ? tasks.find((t) => t.id === activePomodoroTaskId)
    : tasks.find((t) => t.isDailyRecurring && !t.completed) ||
      tasks.find((t) => !t.completed);

  const focusDiff = focusTask ? DIFFICULTIES[focusTask.difficulty] || DIFFICULTIES.medium : null;
  const focusCat = focusTask ? CATEGORIES[focusTask.category] || CATEGORIES['ca-nhan'] : null;

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
          {/* 1. Background Ảnh Bìa (Cover Banner Dark Fantasy 120px - 140px) */}
          <div className="absolute top-0 inset-x-0 h-32 sm:h-36 overflow-hidden pointer-events-none z-0">
            <img
              src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000&auto=format&fit=crop"
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
                      className="w-full h-full object-contain p-2"
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
                    className="w-3.5 h-3.5 object-contain"
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

        {/* ================= CỘT PHẢI (lg:col-span-5): WIDGETS ƯU TIÊN ================= */}
        <div className="lg:col-span-5 flex flex-col gap-2.5 sm:gap-3 justify-between">
          {/* Widget 1: Tiêu Điểm Nhanh (Compact Mode - Tối đa 1 việc ưu tiên) */}
          <div className="rounded-2xl bg-[#11212D] p-3 sm:p-3.5 border border-[#253745] shadow-lg flex flex-col justify-between text-left">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#253745]/60">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Flame className="w-3 h-3 fill-amber-300" />
                </div>
                <h4 className="font-rpg font-bold text-xs text-[#CCD0CF] tracking-wide">
                  Tiêu Điểm Nhanh
                </h4>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#06141B] border border-[#253745] text-[#9BA8AB]">
                {activePomodoroTaskId ? 'Đang Focus' : focusTask ? 'Ưu tiên' : 'Hoàn tất'}
              </span>
            </div>

            {/* Task Item hoặc Empty State */}
            {focusTask && focusDiff && focusCat ? (
              <div className="mt-2 p-2 rounded-xl bg-[#06141B] border border-[#253745] flex items-center justify-between gap-2 shadow-inner">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[10px] font-bold text-[#CCD0CF] shrink-0">
                    {focusCat.label.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#CCD0CF] truncate leading-tight">
                      {focusTask.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] mt-0.5 text-[#9BA8AB]">
                      <span>+{focusDiff.exp} EXP</span>
                      <span className="text-[#4A5C6A]">•</span>
                      <span className="text-amber-300 font-bold flex items-center gap-0.5">
                        +{focusDiff.coins} <CoinIcon size="xs" />
                      </span>
                      {focusTask.isDailyRecurring && (
                        <>
                          <span className="text-[#4A5C6A]">•</span>
                          <span className="text-cyan-400 font-bold">Hằng ngày</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActivePomodoroTaskId(focusTask.id)}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      activePomodoroTaskId === focusTask.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                        : 'bg-[#11212D] hover:bg-[#253745] border-[#253745] text-amber-300'
                    }`}
                    title="Bật phiên Fae Focus"
                  >
                    <Play className="w-3 h-3 fill-amber-300" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      toggleTask(focusTask.id, { x: rect.right, y: rect.top });
                    }}
                    className="p-1.5 rounded-lg bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] hover:text-white transition cursor-pointer"
                    title="Hoàn thành nhiệm vụ"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 p-2 rounded-xl bg-[#06141B] border border-[#253745] text-center">
                <span className="text-[11px] text-[#9BA8AB]">
                  ✨ Đã hoàn tất mọi nhiệm vụ ưu tiên hôm nay!
                </span>
              </div>
            )}
          </div>

          {/* Widget 2: Thống Kê Thợ Săn (Compact Mode - Dàn hàng ngang 3 chỉ số bên cạnh Danh hiệu) */}
          <div className="rounded-2xl bg-[#11212D] p-3 sm:p-3.5 border border-[#253745] shadow-lg flex flex-col justify-between text-left">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#253745]/60">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF]">
                  <Award className="w-3 h-3" />
                </div>
                <h4 className="font-rpg font-bold text-xs text-[#CCD0CF] tracking-wide">
                  Thống Kê Thợ Săn
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('system-quests')}
                className="text-[10px] font-bold text-[#9BA8AB] hover:text-[#CCD0CF] flex items-center gap-0.5 transition cursor-pointer"
                title="Mở Kho Danh Hiệu"
              >
                <span>Kho Danh Hiệu</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Icon Danh Hiệu + 3 Chỉ Số Dàn Ngang */}
            <div className="mt-2 flex items-center gap-2">
              {/* Icon Danh Hiệu Nhỏ Gọn */}
              <div
                onClick={() => setActiveTab('system-quests')}
                className="w-10 h-10 rounded-xl bg-[#06141B] border border-[#253745] hover:border-[#4A5C6A] p-1 shrink-0 flex items-center justify-center shadow-inner cursor-pointer transition group"
                title={`${titleObj.name} (${titleObj.rarity.toUpperCase()}) - Mở Kho Danh Hiệu`}
              >
                <img
                  src={titleObj.iconUrl}
                  alt={titleObj.name}
                  className="w-full h-full object-contain drop-shadow group-hover:scale-110 transition-transform"
                />
              </div>

              {/* 3 Chỉ số dàn hàng ngang */}
              <div className="grid grid-cols-3 gap-1.5 flex-1 min-w-0">
                {/* 1. Xu Vàng */}
                <div className="py-1 px-1.5 rounded-xl bg-[#06141B] border border-[#253745] text-center flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1">
                    <CoinIcon size="xs" />
                    <span className="font-mono font-black text-xs text-[#CCD0CF] truncate">
                      {coins}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#9BA8AB] leading-none mt-0.5">Xu Vàng</span>
                </div>

                {/* 2. Chuỗi Ngày */}
                <div className="py-1 px-1.5 rounded-xl bg-[#06141B] border border-[#253745] text-center flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                    <span className="font-mono font-black text-xs text-amber-300 truncate">
                      {streakDays}N
                    </span>
                  </div>
                  <span className="text-[9px] text-[#9BA8AB] leading-none mt-0.5">Chuỗi Ngày</span>
                </div>

                {/* 3. Task Xong */}
                <div className="py-1 px-1.5 rounded-xl bg-[#06141B] border border-[#253745] text-center flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="font-mono font-black text-xs text-emerald-300 truncate">
                      {completedTotal}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#9BA8AB] leading-none mt-0.5">Đã Xong</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
