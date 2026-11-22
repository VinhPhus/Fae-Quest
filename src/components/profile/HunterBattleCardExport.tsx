import React, { forwardRef } from 'react';
import { RankTier } from '../../types';
import { Trophy, Shield, Sparkles } from 'lucide-react';

export interface HunterBattleCardExportProps {
  playerName: string;
  avatarBase64: string;
  coverBase64: string;
  currentTier: RankTier;
  nextTier: RankTier | null;
  exp: number;
  stars: number;
  streakDays: number;
  completedTotal: number;
  titleName: string;
  titleIconUrl?: string;
  titleRarity?: string;
  hunterId?: string;
  playerRankPos?: number;
  level?: number;
  logoBase64?: string;
  rankIconBase64?: string;
}

export const RANK_GLOW_STYLES: Record<
  string,
  { border: string; shadow: string; textGradient: string; barBg: string }
> = {
  dong: {
    border: '#8C583A',
    shadow: '0 0 30px rgba(140, 88, 58, 0.65)',
    textGradient: 'from-[#E0B594] to-[#8C583A]',
    barBg: 'from-[#8C583A] to-[#C48C6A]',
  },
  bac: {
    border: '#CBD5E1',
    shadow: '0 0 30px rgba(203, 213, 225, 0.65)',
    textGradient: 'from-slate-100 to-slate-400',
    barBg: 'from-[#8B9BB4] to-[#E2E8F0]',
  },
  vang: {
    border: '#F59E0B',
    shadow: '0 0 35px rgba(245, 158, 11, 0.75)',
    textGradient: 'from-amber-200 via-yellow-300 to-amber-500',
    barBg: 'from-[#D97706] to-[#FBBF24]',
  },
  'luc-bao': {
    border: '#10B981',
    shadow: '0 0 35px rgba(16, 185, 129, 0.75)',
    textGradient: 'from-emerald-200 to-teal-400',
    barBg: 'from-[#059669] to-[#34D399]',
  },
  'cao-thu': {
    border: '#8B5CF6',
    shadow: '0 0 35px rgba(139, 92, 246, 0.75)',
    textGradient: 'from-purple-200 via-violet-300 to-indigo-400',
    barBg: 'from-[#7C3AED] to-[#A78BFA]',
  },
  'dai-cao-thu': {
    border: '#F43F5E',
    shadow: '0 0 40px rgba(244, 63, 94, 0.85)',
    textGradient: 'from-rose-200 via-pink-400 to-rose-600',
    barBg: 'from-[#E11D48] to-[#FB7185]',
  },
  'thach-dau': {
    border: '#FBBF24',
    shadow: '0 0 45px rgba(251, 191, 36, 0.95)',
    textGradient: 'from-amber-100 via-yellow-300 to-amber-500',
    barBg: 'from-[#B45309] via-[#F59E0B] to-[#FDE68A]',
  },
};

/**
 * Thẻ Sưu Tầm Dark Fantasy Cao Cấp (Luxury Collector Card)
 * Kích thước chuẩn 540x960 (Tỷ lệ 9:16) dùng để xuất PNG siêu nét 1080x1920 Story & TikTok.
 * Đảm bảo 100% hình ảnh nhúng Base64, tuyệt đối không chứa thẻ <img> với URL nội bộ/mạng.
 */
export const HunterBattleCardExport = forwardRef<HTMLDivElement, HunterBattleCardExportProps>(
  (
    {
      playerName,
      avatarBase64,
      coverBase64,
      currentTier,
      nextTier,
      exp,
      stars,
      streakDays,
      completedTotal,
      titleName,
      titleIconUrl,
      titleRarity = 'rare',
      hunterId,
      playerRankPos = 1,
      logoBase64,
      rankIconBase64,
    },
    ref
  ) => {
    const glowConfig = RANK_GLOW_STYLES[currentTier.id] || RANK_GLOW_STYLES['dong'];

    // Calculate rank progress percent
    let progressPercent = 100;
    if (nextTier) {
      const span = nextTier.minExp - currentTier.minExp;
      const gainedInTier = exp - currentTier.minExp;
      progressPercent = Math.min(100, Math.max(0, Math.round((gainedInTier / span) * 100)));
    }

    return (
      <div
        className="fixed pointer-events-none select-none z-[-9999]"
        style={{
          position: 'fixed',
          top: 0,
          left: '-9999px',
          width: '540px',
          height: '960px',
          overflow: 'visible',
          pointerEvents: 'none',
          zIndex: -9999,
        }}
        aria-hidden="true"
      >
        {/* ================= KHUNG CHÍNH 540x960 (BO TRÒN 32PX) ================= */}
        <div
          ref={ref}
          style={{ width: '540px', height: '960px', minWidth: '540px', minHeight: '960px' }}
          className="relative w-[540px] h-[960px] rounded-[32px] overflow-hidden border border-white/20 bg-[#06141B] opacity-100 text-[#CCD0CF] select-none box-border font-sans shadow-2xl"
        >
          {/* 1. NỀN ẢNH BÌA TRÀN SÁT MÉP TRÊN (H=440PX) + CHUYỂN SẮC ĐA TẦNG */}
          <div className="absolute top-0 inset-x-0 h-[440px] w-full overflow-hidden pointer-events-none z-0">
            {coverBase64 ? (
              <img
                src={coverBase64}
                alt="Hunter Cover"
                crossOrigin="anonymous"
                className="w-full h-[440px] object-cover object-center"
              />
            ) : (
              <svg
                viewBox="0 0 540 440"
                width="540"
                height="440"
                className="w-full h-[440px] object-cover"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#040D12" />
                    <stop offset="35%" stopColor="#0B1E29" />
                    <stop offset="70%" stopColor="#132B3A" />
                    <stop offset="100%" stopColor="#06141B" />
                  </linearGradient>
                  <radialGradient id="moonGlow" cx="50%" cy="28%" r="48%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
                    <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#06141B" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="mtnGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#182E3C" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#06141B" stopOpacity="0.95" />
                  </linearGradient>
                  <linearGradient id="mtnGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0D1E28" />
                    <stop offset="100%" stopColor="#06141B" />
                  </linearGradient>
                </defs>
                <rect width="540" height="440" fill="url(#skyGrad)" />
                <circle cx="270" cy="150" r="220" fill="url(#moonGlow)" />
                <polygon points="0,320 85,210 170,290 270,165 370,285 455,215 540,310 540,440 0,440" fill="url(#mtnGrad1)" />
                <polygon points="0,380 110,270 210,340 315,240 430,350 540,280 540,440 0,440" fill="url(#mtnGrad2)" />
                <rect x="256" y="150" width="28" height="90" fill="#07131A" />
                <polygon points="252,150 270,120 288,150" fill="#07131A" />
                <rect x="242" y="180" width="16" height="60" fill="#08151D" />
                <polygon points="239,180 250,160 261,180" fill="#08151D" />
                <rect x="282" y="180" width="16" height="60" fill="#08151D" />
                <polygon points="279,180 290,160 301,180" fill="#08151D" />
                <circle cx="75" cy="80" r="1.5" fill="#FDE68A" opacity="0.6" />
                <circle cx="140" cy="50" r="1.2" fill="#FDE68A" opacity="0.5" />
                <circle cx="210" cy="95" r="1.5" fill="#FDE68A" opacity="0.7" />
                <circle cx="340" cy="65" r="1.8" fill="#FDE68A" opacity="0.8" />
                <circle cx="420" cy="90" r="1.2" fill="#FDE68A" opacity="0.5" />
                <circle cx="485" cy="55" r="1.5" fill="#FDE68A" opacity="0.6" />
              </svg>
            )}
            {/* Lớp chuyển sắc đa tầng: nửa trên hiện rõ nét ảnh bìa, nửa dưới tan êm vào #06141B */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(6,20,27,0.22) 0%, rgba(6,20,27,0.02) 28%, rgba(6,20,27,0.65) 72%, #06141B 100%)',
              }}
            />
          </div>

          {/* 2. ÁNH SÁNG TỎA TÂM MỜ (RADIAL AMBIENT GLOW) MÀU BẬC RANK Ở NỬA DƯỚI */}
          <div
            className="absolute -bottom-24 inset-x-0 h-[420px] rounded-full blur-[120px] pointer-events-none opacity-25 z-0"
            style={{ backgroundColor: glowConfig.border }}
          />

          {/* 3. KHUNG VIỀN KÉP MẢNH ÁNH KIM CỔ ĐIỂN (INNER HAIRLINE VINTAGE FRAME) */}
          <div className="absolute inset-[14px] border border-white/10 rounded-[22px] pointer-events-none z-30">
            {/* 4 Mấu góc cổ điển */}
            <div
              className="absolute -top-[1px] -left-[1px] w-3.5 h-3.5 border-t-2 border-l-2 rounded-tl-[4px] pointer-events-none"
              style={{ borderColor: `${glowConfig.border}88` }}
            />
            <div
              className="absolute -top-[1px] -right-[1px] w-3.5 h-3.5 border-t-2 border-r-2 rounded-tr-[4px] pointer-events-none"
              style={{ borderColor: `${glowConfig.border}88` }}
            />
            <div
              className="absolute -bottom-[1px] -left-[1px] w-3.5 h-3.5 border-b-2 border-l-2 rounded-bl-[4px] pointer-events-none"
              style={{ borderColor: `${glowConfig.border}88` }}
            />
            <div
              className="absolute -bottom-[1px] -right-[1px] w-3.5 h-3.5 border-b-2 border-r-2 rounded-br-[4px] pointer-events-none"
              style={{ borderColor: `${glowConfig.border}88` }}
            />
          </div>

          {/* ================= NỘI DUNG 4 TẦNG CÂN ĐỐI (FLEX JUSTIFY-BETWEEN) ================= */}
          <div className="flex flex-col justify-between h-full px-8 py-7 relative z-10 box-border">
            {/* ================= TẦNG 1: THANH ĐỊNH DANH TRONG SUỐT (NỔI TRỰC TIẾP TRÊN ẢNH BÌA) ================= */}
            <div className="flex items-center justify-between w-full pt-1">
              {/* Bên trái: Logo + Thương hiệu FaeQuest */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#06141B]/85 border border-white/20 p-1 flex items-center justify-center shadow-lg shrink-0">
                  {logoBase64 && logoBase64.startsWith('data:') ? (
                    <img
                      src={logoBase64}
                      alt="FaeQuest Logo"
                      crossOrigin="anonymous"
                      className="w-full h-full object-contain [image-rendering:pixelated]"
                    />
                  ) : (
                    <Shield className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                <div>
                  <h1 className="font-rpg font-black text-lg tracking-wider text-white leading-tight drop-shadow-md whitespace-nowrap">
                    FAE<span className="text-amber-400">QUEST</span>
                  </h1>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/75 drop-shadow-sm whitespace-nowrap">
                    THẺ CHIẾN TÍCH
                  </p>
                </div>
              </div>

              {/* Bên phải: Huy hiệu mùa giải gọn gàng */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#06141B]/75 border border-white/20 text-[10px] font-bold text-[#CCD0CF] shadow-md shrink-0 whitespace-nowrap">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>MÙA 2 • HẮC ÁM</span>
              </div>
            </div>

            {/* ================= TẦNG 2: TÂM ĐIỂM NHÂN VẬT (VÙNG GIAO THOA ẢNH BÌA & NỀN TỐI) ================= */}
            <div className="flex flex-col items-center text-center my-auto pt-2">
              {/* Avatar lớn 136x136 viền 2 lớp ánh kim sang trọng */}
              <div
                className="w-[136px] h-[136px] rounded-full p-[3px] relative flex items-center justify-center shadow-2xl transition-all"
                style={{
                  border: `2.5px solid ${glowConfig.border}`,
                  boxShadow: `0 0 28px ${glowConfig.border}66, 0 12px 32px rgba(0,0,0,0.85)`,
                }}
              >
                {/* Lớp viền đệm trong tạo hiệu ứng huy chương */}
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#11212D] to-[#06141B] p-[3px] border border-white/20 flex items-center justify-center overflow-hidden">
                  {avatarBase64 && avatarBase64.startsWith('data:') ? (
                    <img
                      src={avatarBase64}
                      alt={playerName}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#11212D] to-[#06141B] flex items-center justify-center text-amber-300 font-rpg font-black text-3xl">
                      {playerName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Huy hiệu thứ hạng nhỏ gọn TOP #X dưới chân Avatar */}
                <div
                  className="absolute -bottom-2.5 px-3.5 py-0.5 rounded-full bg-[#06141B] border border-amber-400/80 shadow-xl flex items-center gap-1.5 whitespace-nowrap z-30"
                  style={{
                    boxShadow: '0 4px 12px rgba(0,0,0,0.9), 0 0 10px rgba(245,158,11,0.4)',
                  }}
                >
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                    TOP #{playerRankPos}
                  </span>
                </div>
              </div>

              {/* Tên nhân vật hiển thị font Serif / RPG cỡ lớn sang trọng */}
              <h2 className="font-rpg font-black text-[30px] text-white tracking-wide text-center mt-5 drop-shadow-lg max-w-[480px] truncate whitespace-nowrap leading-tight px-2">
                {playerName}
              </h2>

              {/* Danh hiệu hiện tại dạng dải ruy-băng ánh kim: 100% hiển thị đầy đủ, không rớt dòng */}
              <div className="mt-2.5 flex items-center justify-center max-w-[480px]">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#0F202B] via-[#142A38] to-[#0F202B] border text-xs font-black shadow-lg whitespace-nowrap ${
                    titleRarity === 'legendary'
                      ? 'border-amber-400/80 text-amber-300 shadow-amber-500/10'
                      : titleRarity === 'epic'
                      ? 'border-purple-400/80 text-purple-300 shadow-purple-500/10'
                      : 'border-sky-400/80 text-sky-300 shadow-sky-500/10'
                  }`}
                >
                  {titleIconUrl && titleIconUrl.startsWith('data:') && (
                    <img
                      src={titleIconUrl}
                      alt={titleName}
                      crossOrigin="anonymous"
                      className="w-4 h-4 object-contain shrink-0 [image-rendering:pixelated]"
                    />
                  )}
                  <span className="tracking-wider uppercase text-xs font-extrabold whitespace-nowrap">
                    {titleName}
                  </span>
                </div>
              </div>

              {/* Hàng phụ thông số vinh dự: Nằm gọn trên 1 dòng duy nhất */}
              <div className="flex items-center justify-center gap-2 mt-2 text-[11px] font-semibold text-[#9BA8AB] whitespace-nowrap">
                <span>#{playerRankPos} BXH</span>
                <span className="text-white/30">•</span>
                <span className="text-amber-300 font-bold">★ {stars} Sao Vinh Dự</span>
              </div>
            </div>

            {/* ================= TẦNG 3: KHUNG HUY HIỆU BẬC HẠNG & BẢNG CHỈ SỐ THỐNG NHẤT ================= */}
            <div className="space-y-3.5 w-full">
              {/* 1. Khung Bậc Hạng Gradient Tối Ánh Kim */}
              <div
                className="p-4 rounded-2xl bg-gradient-to-br from-[#0F202B]/95 to-[#08131A]/95 border shadow-xl relative overflow-hidden"
                style={{
                  borderColor: `${glowConfig.border}55`,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Huy hiệu Rank lớn có hào quang nhẹ */}
                  <div
                    className="w-16 h-16 rounded-2xl bg-[#06141B] border border-white/15 p-2 flex items-center justify-center shrink-0 shadow-lg relative"
                    style={{
                      boxShadow: `0 0 25px ${glowConfig.border}44`,
                    }}
                  >
                    {rankIconBase64 && rankIconBase64.startsWith('data:') ? (
                      <img
                        src={rankIconBase64}
                        alt={currentTier.name}
                        crossOrigin="anonymous"
                        className="w-full h-full object-contain [image-rendering:pixelated]"
                      />
                    ) : (
                      <span
                        className="font-rpg font-black text-2xl"
                        style={{ color: glowConfig.border }}
                      >
                        {currentTier.name.slice(0, 1)}
                      </span>
                    )}
                  </div>

                  {/* Thông tin Bậc Rank */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#9BA8AB] block">
                      BẬC HẠNG HIỆN TẠI
                    </span>
                    <h3
                      className={`font-rpg font-black text-2xl tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r whitespace-nowrap ${glowConfig.textGradient}`}
                    >
                      BẬC {currentTier.name}
                    </h3>
                    <p className="text-[11px] text-[#9BA8AB] italic line-clamp-1 mt-0.5">
                      &ldquo;{currentTier.quote}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Thanh tiến trình EXP mảnh phát sáng */}
                <div className="mt-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#9BA8AB] font-bold">Tiến Trình Rank</span>
                    <span className="text-white font-black tracking-wide">
                      {exp.toLocaleString()} / {nextTier ? `${nextTier.minExp.toLocaleString()} EXP` : 'MAX'}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#06141B] border border-white/10 overflow-hidden p-[1px]">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${glowConfig.barBg} transition-all`}
                      style={{
                        width: `${progressPercent}%`,
                        boxShadow: `0 0 8px ${glowConfig.border}88`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Dải 3 Chỉ Số Chiến Tích (Gộp thành 1 khối bảng ngang thống nhất) */}
              <div className="grid grid-cols-3 divide-x divide-white/10 rounded-2xl bg-[#0B1922]/90 border border-white/10 py-4 shadow-xl">
                {/* Cột 1: Chuỗi Kỷ Luật */}
                <div className="flex flex-col items-center justify-center text-center px-2">
                  <span className="font-mono font-black text-[26px] sm:text-[28px] text-amber-300 leading-tight">
                    {streakDays}N
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9BA8AB] mt-1 whitespace-nowrap">
                    Chuỗi Kỷ Luật
                  </span>
                </div>

                {/* Cột 2: Lệnh Đã Xong */}
                <div className="flex flex-col items-center justify-center text-center px-2">
                  <span className="font-mono font-black text-[26px] sm:text-[28px] text-emerald-300 leading-tight">
                    {completedTotal.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9BA8AB] mt-1 whitespace-nowrap">
                    Lệnh Đã Xong
                  </span>
                </div>

                {/* Cột 3: Tổng EXP */}
                <div className="flex flex-col items-center justify-center text-center px-2">
                  <span className="font-mono font-black text-[26px] sm:text-[28px] text-cyan-300 leading-tight">
                    {exp > 99999 ? `${(exp / 1000).toFixed(0)}k` : exp.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9BA8AB] mt-1 whitespace-nowrap">
                    Tổng EXP
                  </span>
                </div>
              </div>
            </div>

            {/* ================= TẦNG 4: CHÂN THẺ KHẾ ƯỚC (FOOTER) ================= */}
            <div className="w-full flex flex-col items-center text-center pt-2">
              {/* Đường kẻ mảnh chuyển sắc mờ dần về 2 đầu */}
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mb-3" />

              {/* Khẩu hiệu kỷ luật */}
              <p className="text-[11px] font-medium text-white/70 italic tracking-wide">
                &ldquo;Kỷ luật thép tôi luyện ý chí Thợ Săn — Biến mục tiêu thành chiến tích.&rdquo;
              </p>

              {/* Dòng định danh hệ thống */}
              <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-[#9BA8AB]">
                <span>⚔️ FaeQuest RPG</span>
                <span className="text-white/20">•</span>
                <span className="text-amber-400 font-bold">faequest.vercel.app</span>
                {hunterId && (
                  <>
                    <span className="text-white/20">•</span>
                    <span>ID: {hunterId.substring(0, 8)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

HunterBattleCardExport.displayName = 'HunterBattleCardExport';
