import React, { forwardRef } from 'react';
import { RankTier } from '../../types';
import { Flame, CheckCircle2, Trophy, Shield, Sparkles } from 'lucide-react';
import { DEFAULT_COVER_URL } from '../modals/ChangeCoverModal';

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

export const RANK_GLOW_STYLES: Record<string, { border: string; shadow: string; textGradient: string; barBg: string }> = {
  dong: {
    border: '#8C583A',
    shadow: '0 0 25px rgba(140, 88, 58, 0.65)',
    textGradient: 'from-[#E0B594] to-[#8C583A]',
    barBg: 'from-[#8C583A] to-[#C48C6A]',
  },
  bac: {
    border: '#CBD5E1',
    shadow: '0 0 25px rgba(203, 213, 225, 0.65)',
    textGradient: 'from-slate-100 to-slate-400',
    barBg: 'from-[#8B9BB4] to-[#E2E8F0]',
  },
  vang: {
    border: '#F59E0B',
    shadow: '0 0 30px rgba(245, 158, 11, 0.75)',
    textGradient: 'from-amber-200 via-yellow-300 to-amber-500',
    barBg: 'from-[#D97706] to-[#FBBF24]',
  },
  'luc-bao': {
    border: '#10B981',
    shadow: '0 0 30px rgba(16, 185, 129, 0.75)',
    textGradient: 'from-emerald-200 to-teal-400',
    barBg: 'from-[#059669] to-[#34D399]',
  },
  'cao-thu': {
    border: '#8B5CF6',
    shadow: '0 0 30px rgba(139, 92, 246, 0.75)',
    textGradient: 'from-purple-200 via-violet-300 to-indigo-400',
    barBg: 'from-[#7C3AED] to-[#A78BFA]',
  },
  'dai-cao-thu': {
    border: '#F43F5E',
    shadow: '0 0 35px rgba(244, 63, 94, 0.85)',
    textGradient: 'from-rose-200 via-pink-400 to-rose-600',
    barBg: 'from-[#E11D48] to-[#FB7185]',
  },
  'thach-dau': {
    border: '#FBBF24',
    shadow: '0 0 40px rgba(251, 191, 36, 0.95)',
    textGradient: 'from-amber-100 via-yellow-300 to-amber-500',
    barBg: 'from-[#B45309] via-[#F59E0B] to-[#FDE68A]',
  },
};

/**
 * Fixed 9:16 (540x960) Off-screen Card for High-Res PNG Export (1080x1920)
 * Thiết kế tràn viền bo tròn 32px, không viền đệm thừa
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
      <div className="fixed top-0 left-0 w-0 h-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
        {/* Khung chính của thẻ tràn đầy 100% diện tích 540x960, bo tròn 32px */}
        <div
          ref={ref}
          className="relative w-[540px] h-[960px] rounded-[32px] overflow-hidden border border-white/15 bg-[#06141B] opacity-100 text-[#CCD0CF] flex flex-col justify-between select-none box-border font-sans shadow-2xl"
        >
          {/* Background Atmospheric Glow */}
          <div
            className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[100px] pointer-events-none opacity-40 z-0"
            style={{ backgroundColor: glowConfig.border }}
          />
          <div
            className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-[100px] pointer-events-none opacity-25 z-0"
            style={{ backgroundColor: glowConfig.border }}
          />

          {/* Subtle Corner Accents */}
          <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-[#4A5C6A] rounded-tl-sm pointer-events-none z-30" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-[#4A5C6A] rounded-tr-sm pointer-events-none z-30" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-[#4A5C6A] rounded-bl-sm pointer-events-none z-30" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-[#4A5C6A] rounded-br-sm pointer-events-none z-30" />

          {/* ================= 1. HEADER ================= */}
          <div className="pt-4 px-6 pb-2.5 flex items-center justify-between border-b border-[#253745]/80 relative z-20 bg-[#06141B]/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#06141B] border border-[#4A5C6A] p-1 flex items-center justify-center shadow-md">
                {logoBase64 ? (
                  <img
                    src={logoBase64}
                    alt="FaeQuest Logo"
                    className="w-full h-full object-contain [image-rendering:pixelated]"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <Shield className="w-6 h-6 text-amber-400" />
                )}
              </div>
              <div>
                <h1 className="font-rpg font-black text-lg tracking-wider text-white leading-tight">
                  FAE<span className="text-amber-400">QUEST</span>
                </h1>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9BA8AB]">
                  THẺ CHIẾN TÍCH THỢ SĂN
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#11212D] border border-[#253745] text-[10px] font-bold text-[#CCD0CF]">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>MÙA 2 • HẮC ÁM</span>
            </div>
          </div>

          {/* ================= 2. CHARACTER & COVER SECTION ================= */}
          <div className="relative flex flex-col items-center z-10 w-full">
            {/* Cover Banner (Nửa trên thẻ, cao 300px, sắc nét, opacity 85%) */}
            <div className="w-full h-[300px] overflow-hidden relative bg-[#06141B] shrink-0">
              <img
                src={coverBase64 || DEFAULT_COVER_URL}
                alt="Hunter Cover"
                className="w-full h-[300px] object-cover object-center opacity-85 brightness-95"
                crossOrigin="anonymous"
              />
              {/* Lớp gradient chuyển sắc nhẹ ở phần đáy */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#06141B]/20 via-[#06141B]/45 to-[#06141B]" />
            </div>

            {/* Avatar overlapping banner */}
            <div className="-mt-16 relative flex flex-col items-center z-20">
              <div
                className="w-28 h-28 rounded-full p-1 bg-[#06141B] relative flex items-center justify-center shadow-2xl transition-all"
                style={{
                  border: `3px solid ${glowConfig.border}`,
                  boxShadow: glowConfig.shadow,
                }}
              >
                {avatarBase64 ? (
                  <img
                    src={avatarBase64}
                    alt={playerName}
                    className="w-full h-full object-cover rounded-full"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#11212D] flex items-center justify-center text-white font-black text-2xl">
                    {playerName.slice(0, 2).toUpperCase()}
                  </div>
                )}

                {/* Rank Badge dưới chân Avatar (Thay thế huy hiệu Cấp số) */}
                <div
                  className="absolute -bottom-3 px-3 py-1 rounded-full bg-[#06141B] border shadow-xl flex items-center gap-1.5 whitespace-nowrap z-30"
                  style={{
                    borderColor: glowConfig.border,
                    boxShadow: `0 4px 14px rgba(0,0,0,0.8), 0 0 12px ${glowConfig.border}66`,
                  }}
                >
                  <img
                    src={rankIconBase64 || currentTier.iconUrl}
                    alt={currentTier.name}
                    className="w-3.5 h-3.5 object-contain [image-rendering:pixelated]"
                    crossOrigin="anonymous"
                  />
                  <span
                    className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap"
                    style={{ color: glowConfig.border }}
                  >
                    BẬC {currentTier.name.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Player Name: Tăng khoảng cách mt-5 tách biệt hẳn khỏi badge */}
              <h2 className="font-rpg font-black text-2xl text-white tracking-wide text-center mt-5 drop-shadow-md max-w-[440px] truncate">
                {playerName}
              </h2>

              {/* Equipped Title & Subtitle */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#06141B]/90 border text-xs font-black shadow-sm ${
                    titleRarity === 'legendary'
                      ? 'border-amber-400/60 text-amber-300'
                      : titleRarity === 'epic'
                      ? 'border-purple-400/60 text-purple-300'
                      : 'border-sky-400/60 text-sky-300'
                  }`}
                >
                  {titleIconUrl && (
                    <img
                      src={titleIconUrl}
                      alt={titleName}
                      className="w-3.5 h-3.5 object-contain [image-rendering:pixelated]"
                      crossOrigin="anonymous"
                    />
                  )}
                  <span>{titleName}</span>
                </div>

                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#11212D] border border-[#253745] text-[11px] font-bold text-[#9BA8AB]">
                  <Trophy className="w-3 h-3 text-amber-300" />
                  <span>#{playerRankPos} BXH</span>
                </div>

                {stars > 0 && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-400/30 text-[11px] font-bold text-yellow-300">
                    <span>⭐ {stars} Sao</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= 3. CENTRAL RANK TIER BADGE & PROGRESS ================= */}
          <div className="mx-6 p-4 rounded-2xl bg-[#11212D]/85 border border-[#253745] shadow-xl relative overflow-hidden backdrop-blur-sm z-10">
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-2xl bg-[#06141B] border border-[#4A5C6A] p-2 flex items-center justify-center shrink-0 shadow-lg"
                style={{
                  boxShadow: `0 0 20px ${glowConfig.border}33`,
                }}
              >
                <img
                  src={rankIconBase64 || currentTier.iconUrl}
                  alt={currentTier.name}
                  className="w-full h-full object-contain [image-rendering:pixelated]"
                  crossOrigin="anonymous"
                />
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#9BA8AB] block">
                  BẬC HẠNG HIỆN TẠI
                </span>
                <h3
                  className={`font-rpg font-black text-2xl tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r ${glowConfig.textGradient}`}
                >
                  BẬC {currentTier.name}
                </h3>
                <p className="text-[11px] text-[#9BA8AB] italic line-clamp-1 mt-0.5">
                  &ldquo;{currentTier.quote}&rdquo;
                </p>
              </div>
            </div>

            {/* EXP Progress Bar */}
            <div className="mt-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#9BA8AB] font-bold">Tiến Trình Rank</span>
                <span className="text-white font-black">
                  {exp.toLocaleString()} / {nextTier ? `${nextTier.minExp.toLocaleString()} EXP` : 'MAX'}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#06141B] border border-[#253745] overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${glowConfig.barBg} transition-all`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* ================= 4. 3-COLUMN COMBAT STATS ================= */}
          <div className="mx-6 grid grid-cols-3 gap-3 z-10">
            {/* Col 1: Chuỗi Kỷ Luật */}
            <div className="p-3.5 rounded-2xl bg-[#11212D]/85 border border-[#253745] flex flex-col items-center justify-center text-center shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center mb-1.5">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
              <span className="font-mono font-black text-xl text-amber-300">
                {streakDays}N
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#9BA8AB] mt-0.5">
                Chuỗi Kỷ Luật
              </span>
            </div>

            {/* Col 2: Lệnh Đã Xong */}
            <div className="p-3.5 rounded-2xl bg-[#11212D]/85 border border-[#253745] flex flex-col items-center justify-center text-center shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-mono font-black text-xl text-emerald-300">
                {completedTotal.toLocaleString()}
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#9BA8AB] mt-0.5">
                Lệnh Đã Xong
              </span>
            </div>

            {/* Col 3: Tổng EXP */}
            <div className="p-3.5 rounded-2xl bg-[#11212D]/85 border border-[#253745] flex flex-col items-center justify-center text-center shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center mb-1.5">
                <Trophy className="w-4 h-4 text-cyan-300" />
              </div>
              <span className="font-mono font-black text-xl text-cyan-300">
                {exp > 99999 ? `${(exp / 1000).toFixed(0)}k` : exp.toLocaleString()}
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#9BA8AB] mt-0.5">
                Tổng EXP
              </span>
            </div>
          </div>

          {/* ================= 5. FOOTER ================= */}
          <div className="px-6 py-4 border-t border-[#253745]/80 bg-[#06141B]/90 flex flex-col items-center justify-center text-center relative z-20">
            <p className="text-[11px] font-medium text-[#CCD0CF] italic tracking-wide">
              &ldquo;Kỷ luật thép tôi luyện ý chí Thợ Săn — Biến mục tiêu thành chiến tích.&rdquo;
            </p>
            <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-[#9BA8AB]">
              <span>⚔️ FaeQuest RPG Todo</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">faequest.vercel.app</span>
              {hunterId && (
                <>
                  <span>•</span>
                  <span>ID: {hunterId.substring(0, 8)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

HunterBattleCardExport.displayName = 'HunterBattleCardExport';
