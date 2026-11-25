import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import {
  X,
  RotateCw,
  Image as ImageIcon,
  Layers,
  EyeOff,
  Lock,
  Share2,
  Download,
  Loader2,
  Sparkles,
  Check,
} from 'lucide-react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { toast } from '../../store/useToastStore';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { resolveTitleObject } from '../../constants/systemQuests';
import { DEFAULT_COVER_URL } from './ChangeCoverModal';
import { dataUrlToFile, imageUrlToBase64, waitForImagesToLoad } from '../../utils/imageExportHelper';
import {
  BlackCardRankTheme,
  computeHunterArchetypeTitle,
  formatBlackCardNumber,
  getBlackCardRankTheme,
} from '../../utils/hunterArchetype';
import './HunterBlackCard.css';

export interface HunterBlackCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportMode = 'both' | 'current';

interface CardRenderData {
  playerName: string;
  initialChar: string;
  titleName: string;
  archetypeTitle: string;
  exp: number;
  nextTierMinExp: number | null;
  progressPercent: number;
  stars: number;
  streakDays: number;
  completedTotal: number;
  playerRankPos: number;
  seasonLabel: string;
  theme: BlackCardRankTheme;
  cardNumber: { prefix: string; seg1: string; seg2: string; rankTag: string };
  isMasked: boolean;
  useCover: boolean;
  avatarSrc: string;
  coverSrc: string;
  logoSrc: string;
}

const TRANSPARENT_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAAElFTkSuQmCC';

/**
 * Nội dung Mặt Trước (Căn Cước Thợ Săn) — tái sử dụng chung cho cả bản 3D tương tác & bản 2D xuất PNG.
 */
const BlackCardFrontContent: React.FC<{ data: CardRenderData; flat?: boolean }> = ({
  data,
  flat = false,
}) => {
  const {
    playerName,
    initialChar,
    titleName,
    seasonLabel,
    theme,
    cardNumber,
    isMasked,
    useCover,
    avatarSrc,
    coverSrc,
    logoSrc,
  } = data;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: theme.bgGradient,
        padding: flat ? '18px 20px' : 'clamp(14px, 4.2vw, 18px) clamp(16px, 4.8vw, 20px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Tùy chọn phủ mờ Ảnh Bìa cá nhân (không dùng mix-blend-mode hay transparent để iOS Safari xuất chuẩn) */}
      {useCover && coverSrc && (
        <>
          <img
            src={coverSrc}
            alt="Ảnh bìa thợ săn"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.32,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(145deg, rgba(6, 20, 27, 0.72) 0%, rgba(13, 24, 33, 0.42) 50%, rgba(6, 20, 27, 0.84) 100%)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      {/* Vòng cung mảnh góc phải dưới đặc trưng cho bản export 2D (3D dùng ::after) */}
      {flat && (
        <div
          style={{
            position: 'absolute',
            right: '-46px',
            bottom: '-48px',
            width: '170px',
            height: '170px',
            borderRadius: '9999px',
            border: '1.5px solid rgba(255, 255, 255, 0.09)',
            boxShadow:
              'inset 0 0 0 16px rgba(255, 255, 255, 0.02), 0 0 0 18px rgba(255, 255, 255, 0.045)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Hàng 1: Logo FAEQUEST & Badge Rank */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div className="u052-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '7px',
              background: '#06141B',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {logoSrc && (
              <img
                src={logoSrc}
                alt="FaeQuest"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            )}
          </div>
          <span
            className="font-rpg"
            style={{
              fontSize: '12px',
              fontWeight: 900,
              letterSpacing: '0.16em',
              color: '#F4F0E8',
            }}
          >
            FAE<span style={{ color: theme.accent }}>QUEST</span>
          </span>
        </div>

        <span
          className="u052-tier"
          style={{
            padding: '3px 10px',
            borderRadius: '999px',
            background: theme.badgeBg,
            border: `1px solid ${theme.accentBorder}`,
            color: theme.badgeText,
            fontSize: '10px',
            fontWeight: 900,
            letterSpacing: '0.1em',
            boxShadow: `0 0 14px -2px ${theme.glowRgba}`,
            whiteSpace: 'nowrap',
          }}
        >
          {theme.tierLabel}
        </span>
      </div>

      {/* Hàng 2: Avatar tròn (46x46px) + Chip kim loại ánh vàng */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginTop: '2px',
        }}
      >
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '9999px',
            background: '#06141B',
            border: `2px solid ${theme.accentBorder}`,
            boxShadow: `0 4px 16px rgba(0, 0, 0, 0.55), 0 0 12px -2px ${theme.glowRgba}`,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={playerName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span
              className="font-rpg"
              style={{ fontSize: '18px', fontWeight: 900, color: theme.badgeText }}
            >
              {initialChar}
            </span>
          )}
        </div>

        <div className="u052-chip" />
      </div>

      {/* Hàng 3: Số Hắc Thẻ định dạng 4 ký tự + Lớp khóa ẩn danh */}
      <div style={{ position: 'relative', zIndex: 3 }}>
        <div className="u052-num-wrap">
          <div className="u052-num" style={flat ? { fontSize: '15px' } : undefined}>
            <span>{cardNumber.prefix}</span>
            <span style={{ opacity: 0.45, margin: '0 6px' }}>•</span>
            <span
              style={
                isMasked
                  ? {
                      color: theme.badgeText,
                      opacity: 0.72,
                      letterSpacing: '0.14em',
                    }
                  : undefined
              }
            >
              {cardNumber.seg1}
            </span>
            <span style={{ opacity: 0.45, margin: '0 6px' }}>•</span>
            <span
              style={
                isMasked
                  ? {
                      color: theme.badgeText,
                      opacity: 0.72,
                      letterSpacing: '0.14em',
                    }
                  : undefined
              }
            >
              {cardNumber.seg2}
            </span>
            <span style={{ opacity: 0.45, margin: '0 6px' }}>•</span>
            <span style={{ color: theme.accent }}>{cardNumber.rankTag}</span>
          </div>

          {isMasked && (
            <span className="u052-lock" title="Đang ẩn mã định danh">
              <Lock className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
      </div>

      {/* Hàng 4: Tên nhân vật + Danh hiệu (trái) & Mùa giải (phải) */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: '9px',
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: theme.accent,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginBottom: '2px',
            }}
          >
            {titleName}
          </div>
          <div
            className="u052-name font-rpg"
            style={{
              fontSize: flat ? '15px' : 'clamp(13px, 3.8vw, 15px)',
              fontWeight: 900,
              letterSpacing: '0.06em',
              color: '#FFFFFF',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.15,
            }}
          >
            {playerName}
          </div>
        </div>

        <div
          className="u052-exp"
          style={{
            textAlign: 'right',
            flexShrink: 0,
            fontSize: '9.5px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: 'rgba(244, 240, 232, 0.78)',
            textTransform: 'uppercase',
            lineHeight: 1.25,
          }}
        >
          {seasonLabel}
        </div>
      </div>
    </div>
  );
};

/**
 * Nội dung Mặt Sau (Chiến Tích & Đặc Quyền Thợ Săn) — tái sử dụng chung cho cả 3D & 2D PNG.
 */
const BlackCardBackContent: React.FC<{ data: CardRenderData; flat?: boolean }> = ({
  data,
  flat = false,
}) => {
  const {
    archetypeTitle,
    exp,
    nextTierMinExp,
    progressPercent,
    stars,
    streakDays,
    completedTotal,
    playerRankPos,
    theme,
  } = data;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: theme.backGradient,
        padding: flat ? '14px 0 16px' : 'clamp(10px, 3vw, 14px) 0 clamp(12px, 3.5vw, 16px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Dải từ tối màu trên cùng */}
      <div className="u052-strip">
        KỶ LUẬT THÉP TÔI LUYỆN Ý CHÍ THỢ SĂN • FAEQUEST.VERCEL.APP
      </div>

      {/* Khu vực Tiến Trình Rank & Hệ Thợ Săn + Ô Rank/Sao nổi bật */}
      <div
        style={{
          padding: flat ? '0 20px' : '0 clamp(14px, 4.4vw, 20px)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {/* Khung Tiến Trình Rank & Hệ Thợ Săn */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            padding: '9px 11px',
            borderRadius: '11px',
            background: 'rgba(6, 20, 27, 0.72)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 800,
                color: '#F4F0E8',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {archetypeTitle}
            </span>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 700,
                color: theme.badgeText,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {exp.toLocaleString('vi-VN')} /{' '}
              {nextTierMinExp !== null ? nextTierMinExp.toLocaleString('vi-VN') : 'MAX'} EXP
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                borderRadius: '999px',
                background: theme.progressGlow,
                boxShadow: `0 0 10px ${theme.glowRgba}`,
              }}
            />
          </div>
        </div>

        {/* Ô nổi bật Hạng BXH & Sao vinh dự (tương đương ô CVC) */}
        <div
          className="u052-cvc"
          style={{
            minWidth: '64px',
            padding: '7px 10px',
            borderRadius: '11px',
            background: 'linear-gradient(145deg, #F6EEDB 0%, #DFCFA8 100%)',
            color: '#17120A',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 6px 14px rgba(0, 0, 0, 0.4)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '13px',
              fontWeight: 900,
              lineHeight: 1.1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            #{playerRankPos}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#854D0E',
              lineHeight: 1.2,
              marginTop: '1px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            ★{stars}
          </span>
        </div>
      </div>

      {/* Dải 3 ô đặc quyền dưới đáy (.u052-perk) */}
      <div
        style={{
          padding: flat ? '0 20px' : '0 clamp(14px, 4.4vw, 20px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '8px',
        }}
      >
        <div
          className="u052-perk"
          style={{
            padding: '7px 6px',
            borderRadius: '10px',
            background: 'rgba(6, 20, 27, 0.68)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: flat ? '13.5px' : 'clamp(12px, 3.4vw, 13.5px)',
              fontWeight: 900,
              color: theme.badgeText,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.2,
            }}
          >
            {streakDays}N
          </div>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#9BA8AB', marginTop: '2px' }}>
            Chuỗi Kỷ Luật
          </div>
        </div>

        <div
          className="u052-perk"
          style={{
            padding: '7px 6px',
            borderRadius: '10px',
            background: 'rgba(6, 20, 27, 0.68)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: flat ? '13.5px' : 'clamp(12px, 3.4vw, 13.5px)',
              fontWeight: 900,
              color: '#6EE7B7',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.2,
            }}
          >
            {completedTotal.toLocaleString('vi-VN')}
          </div>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#9BA8AB', marginTop: '2px' }}>
            Lệnh Đã Xong
          </div>
        </div>

        <div
          className="u052-perk"
          style={{
            padding: '7px 6px',
            borderRadius: '10px',
            background: 'rgba(6, 20, 27, 0.68)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: flat ? '13.5px' : 'clamp(12px, 3.4vw, 13.5px)',
              fontWeight: 900,
              color: '#FFFFFF',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.2,
            }}
          >
            {exp.toLocaleString('vi-VN')}
          </div>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#9BA8AB', marginTop: '2px' }}>
            Tổng EXP
          </div>
        </div>
      </div>
    </div>
  );
};

export const HunterBlackCardModal: React.FC<HunterBlackCardModalProps> = ({
  isOpen,
  onClose,
}) => {
  useBodyScrollLock(isOpen);

  const {
    playerName,
    avatarUrl,
    coverUrl,
    exp,
    stars,
    streakDays,
    completedTotal,
    hunterId,
    communityProfiles,
    equippedTitleId,
    tasks,
    focusSessionsCompleted,
    cumulativeCategoryStats,
    seasonAnnouncements,
  } = useFaeQuestStore();

  // Trạng thái 3D vật lý (#052)
  const [angle, setAngle] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [useCover, setUseCover] = useState<boolean>(false);
  const [isMasked, setIsMasked] = useState<boolean>(false);
  const [exportMode, setExportMode] = useState<ExportMode>('both');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Dữ liệu ảnh Base64 dành riêng cho khung kết xuất PNG 2D phẳng
  const [exportAssets, setExportAssets] = useState<{
    avatar: string;
    cover: string;
    logo: string;
  }>({
    avatar: '',
    cover: '',
    logo: '/assets/logo.png',
  });

  const exportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startAngle: number;
    lastX: number;
    lastTime: number;
    vx: number;
    currentAngle: number;
    moved: boolean;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startAngle: 0,
    lastX: 0,
    lastTime: 0,
    vx: 0,
    currentAngle: 0,
    moved: false,
  });

  // Reset góc xoay sạch sẽ mỗi lần mở Modal
  useEffect(() => {
    if (isOpen) {
      setAngle(0);
      dragRef.current.currentAngle = 0;
      setDownloadSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const currentIdx = getRankIndexByExp(exp);
  const currentTier = RANK_TIERS[currentIdx];
  const nextTier = currentIdx < RANK_TIERS.length - 1 ? RANK_TIERS[currentIdx + 1] : null;

  let progressPercent = 100;
  if (nextTier) {
    const span = nextTier.minExp - currentTier.minExp;
    const gained = exp - currentTier.minExp;
    progressPercent = Math.min(100, Math.max(0, Math.round((gained / span) * 100)));
  }

  const playerRankPos = useMemo(() => {
    const all = [
      { id: hunterId, exp: typeof exp === 'number' ? exp : 0, isPlayer: true },
      ...(communityProfiles || [])
        .filter((p) => p.id !== hunterId && p.role !== 'admin')
        .map((p) => ({ id: p.id, exp: typeof p.exp === 'number' ? p.exp : 0, isPlayer: false })),
    ].sort((a, b) => b.exp - a.exp);
    return Math.max(1, all.findIndex((c) => c.isPlayer) + 1);
  }, [hunterId, exp, communityProfiles]);

  const titleObj = resolveTitleObject(equippedTitleId);
  const archetypeTitle = useMemo(
    () =>
      computeHunterArchetypeTitle({
        tasks,
        completedTotal,
        exp,
        streakDays,
        focusSessionsCompleted,
        cumulativeCategoryStats,
      }),
    [tasks, completedTotal, exp, streakDays, focusSessionsCompleted, cumulativeCategoryStats]
  );

  const seasonLabel = useMemo(() => {
    const latest = seasonAnnouncements?.[0]?.season_tag;
    if (latest && /mùa\s*2/i.test(latest)) return 'MÙA 2 • HẮC ÁM';
    if (latest && latest.trim()) return latest.trim().toUpperCase();
    return 'MÙA 2 • HẮC ÁM';
  }, [seasonAnnouncements]);

  const theme = getBlackCardRankTheme(currentTier.id);
  const effectiveCoverUrl = coverUrl && coverUrl.trim() ? coverUrl.trim() : DEFAULT_COVER_URL;

  const liveData: CardRenderData = useMemo(
    () => ({
      playerName: playerName || 'Thợ Săn Fae',
      initialChar: (playerName?.trim()?.[0] || 'F').toUpperCase(),
      titleName: titleObj.name,
      archetypeTitle,
      exp,
      nextTierMinExp: nextTier ? nextTier.minExp : null,
      progressPercent,
      stars,
      streakDays,
      completedTotal,
      playerRankPos,
      seasonLabel,
      theme,
      cardNumber: formatBlackCardNumber(hunterId, playerRankPos, isMasked),
      isMasked,
      useCover,
      avatarSrc: avatarUrl || '',
      coverSrc: effectiveCoverUrl,
      logoSrc: '/assets/logo.png',
    }),
    [
      playerName,
      titleObj.name,
      archetypeTitle,
      exp,
      nextTier,
      progressPercent,
      stars,
      streakDays,
      completedTotal,
      playerRankPos,
      seasonLabel,
      theme,
      hunterId,
      isMasked,
      useCover,
      avatarUrl,
      effectiveCoverUrl,
    ]
  );

  const exportData: CardRenderData = useMemo(
    () => ({
      ...liveData,
      avatarSrc: exportAssets.avatar || liveData.avatarSrc,
      coverSrc: exportAssets.cover || liveData.coverSrc,
      logoSrc: exportAssets.logo || liveData.logoSrc,
    }),
    [liveData, exportAssets]
  );

  const isBackShown = Math.abs(Math.round(angle / 180)) % 2 === 1;
  const shimmerPos = 50 + Math.sin((angle * Math.PI) / 180) * 60;

  // Pointer Physics (#052)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const now = performance.now();
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startAngle: angle,
      lastX: e.clientX,
      lastTime: now,
      vx: 0,
      currentAngle: angle,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragRef.current;
    if (!st.active || st.pointerId !== e.pointerId) return;

    const dx = e.clientX - st.startX;
    if (!st.moved && Math.abs(dx) > 6) {
      st.moved = true;
      setIsDragging(true);
    }

    if (st.moved) {
      const now = performance.now();
      const dt = Math.max(8, now - st.lastTime);
      st.vx = ((e.clientX - st.lastX) / dt) * 16;
      st.lastX = e.clientX;
      st.lastTime = now;

      const nextAngle = st.startAngle + dx * 0.9;
      st.currentAngle = nextAngle;
      setAngle(nextAngle);
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragRef.current;
    if (!st.active || st.pointerId !== e.pointerId) return;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    st.active = false;
    setIsDragging(false);

    if (!st.moved) {
      // Tap/click: lật mượt 180deg giữa Mặt Trước & Mặt Sau
      const snapped = Math.round(st.startAngle / 180) * 180 + 180;
      st.currentAngle = snapped;
      setAngle(snapped);
    } else {
      // Thả tay: tính quán tính vx * 8 để chốt vào bội số 180deg gần nhất
      const projected = st.currentAngle + st.vx * 8;
      const snapped = Math.round(projected / 180) * 180;
      st.currentAngle = snapped;
      setAngle(snapped);
    }
  };

  const handleFlipButton = () => {
    const next = Math.round(angle / 180) * 180 + 180;
    dragRef.current.currentAngle = next;
    setAngle(next);
  };

  /**
   * Kết xuất ảnh PNG sắc nét (pixelRatio: 3) từ khung 2D phẳng ngoài màn hình (chống lỗi đen WebKit/iOS Safari).
   */
  const renderBlackCardPng = async (): Promise<string> => {
    const [avatarB64, coverB64, logoB64] = await Promise.all([
      avatarUrl ? imageUrlToBase64(avatarUrl, undefined, 400) : Promise.resolve(''),
      useCover && effectiveCoverUrl
        ? imageUrlToBase64(effectiveCoverUrl, undefined, 1080)
        : Promise.resolve(''),
      imageUrlToBase64('/assets/logo.png', undefined, 200),
    ]);

    setExportAssets({
      avatar: avatarB64 || avatarUrl || '',
      cover: coverB64 || effectiveCoverUrl || '',
      logo: logoB64 || '/assets/logo.png',
    });

    await new Promise((r) => setTimeout(r, 120));

    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // Bỏ qua lỗi font readiness nếu trình duyệt hạn chế
      }
    }

    if (!exportRef.current) {
      throw new Error('Khung kết xuất ảnh chưa sẵn sàng');
    }

    await waitForImagesToLoad(exportRef.current);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 40)))
    );

    const width = exportMode === 'both' ? 460 : 428;
    const height = exportMode === 'both' ? 596 : 288;

    const toPngOptions = {
      width,
      height,
      canvasWidth: width,
      canvasHeight: height,
      pixelRatio: 3,
      backgroundColor: '#06141B',
      skipFonts: true,
      fontEmbedCSS: '',
      cacheBust: false,
      imagePlaceholder: TRANSPARENT_1X1,
      onImageErrorHandler: () => TRANSPARENT_1X1,
    };

    // Warm-up pass giúp WebKit/Safari nạp đầy đủ texture trước lần chụp chính
    try {
      await toPng(exportRef.current, toPngOptions);
    } catch {
      // Bỏ qua lỗi lượt khởi động
    }
    await new Promise((r) => setTimeout(r, 80));

    return await toPng(exportRef.current, toPngOptions);
  };

  const triggerBrowserDownload = (dataUrl: string) => {
    const safeName = (playerName || 'ThoSan').replace(/\s+/g, '_');
    const suffix = exportMode === 'both' ? '2Mat' : isBackShown ? 'MatSau' : 'MatTruoc';
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `FaeQuest-HacThe-${safeName}-${suffix}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPng = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const toastId = toast.wait(
      'Đang kết xuất Hắc Thẻ Thợ Săn...',
      'Đang tạo ảnh PNG siêu nét (pixelRatio 3x)'
    );

    try {
      const pngUrl = await renderBlackCardPng();
      triggerBrowserDownload(pngUrl);
      setDownloadSuccess(true);
      window.setTimeout(() => setDownloadSuccess(false), 2500);

      toast.update(toastId, {
        kind: 'ok',
        title: 'Đã tải Hắc Thẻ về máy',
        description:
          exportMode === 'both'
            ? 'Đã lưu ảnh ghép Mặt Trước & Mặt Sau sắc nét'
            : 'Đã lưu ảnh mặt thẻ đang xem',
      });
    } catch (err) {
      console.error('Lỗi xuất Hắc Thẻ PNG:', err);
      toast.update(toastId, {
        kind: 'err',
        title: 'Kết xuất Hắc Thẻ thất bại',
        description: 'Vui lòng thử lại sau giây lát',
        action: {
          label: 'Thử lại',
          onClick: () => handleDownloadPng(),
        },
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSharePng = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const toastId = toast.wait(
      'Đang chuẩn bị Hắc Thẻ để chia sẻ...',
      'Đang xử lý ảnh PNG độ nét cao'
    );

    try {
      const pngUrl = await renderBlackCardPng();
      const safeName = (playerName || 'ThoSan').replace(/\s+/g, '_');
      const file = dataUrlToFile(pngUrl, `FaeQuest-HacThe-${safeName}.png`);

      const canShareFiles =
        typeof navigator !== 'undefined' &&
        Boolean(navigator.share) &&
        Boolean(navigator.canShare?.({ files: [file] }));

      if (canShareFiles) {
        await navigator.share({
          title: 'Hắc Thẻ Thợ Săn FaeQuest',
          text: `Hắc Thẻ Thợ Săn (${theme.tierLabel}) của ${playerName} trên FaeQuest!`,
          files: [file],
        });
        toast.update(toastId, {
          kind: 'ok',
          title: 'Đã chia sẻ Hắc Thẻ thành công',
        });
      } else {
        triggerBrowserDownload(pngUrl);
        toast.update(toastId, {
          kind: 'ok',
          title: 'Đã tải ảnh Hắc Thẻ về máy',
          description: 'Thiết bị chưa hỗ trợ chia sẻ tệp trực tiếp, ảnh đã được lưu sẵn',
        });
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        toast.dismiss(toastId);
      } else {
        console.error('Lỗi chia sẻ Hắc Thẻ:', err);
        toast.update(toastId, {
          kind: 'err',
          title: 'Chia sẻ thất bại',
          description: 'Hãy thử bấm Tải Ảnh Về Máy',
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Hắc Thẻ Thợ Săn 3D FaeQuest"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-[#06141B]/85 backdrop-blur-md"
            />

            {/* Khung Modal chính */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-lg rounded-[28px] bg-[#0D1821]/95 border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.85)] p-4 sm:p-6 flex flex-col items-center gap-4 my-auto"
            >
              {/* Header */}
              <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: theme.accentSoft,
                      border: `1px solid ${theme.accentBorder}`,
                      color: theme.accent,
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-rpg font-extrabold text-base sm:text-lg text-[#F4F0E8] truncate">
                      Hắc Thẻ Thợ Săn
                    </h3>
                    <p className="text-[11px] text-[#9BA8AB] truncate">
                      Chạm để lật mặt • Kéo ngang để xoay 3D
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Đóng Hắc Thẻ"
                  className="w-8 h-8 rounded-full bg-[#06141B] hover:bg-[#1B2F3E] border border-white/15 text-[#CCD0CF] hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sân khấu Thẻ Đen 3D (#052) */}
              <div className="u052-wrap">
                <div
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUpOrCancel}
                  onPointerCancel={handlePointerUpOrCancel}
                  className={`u052-card ${isDragging ? 'drag' : ''}`}
                  style={
                    {
                      transform: `rotateX(var(--tilt)) rotateY(${angle}deg)`,
                      '--sh': `${shimmerPos.toFixed(2)}%`,
                    } as React.CSSProperties
                  }
                >
                  {/* Mặt Trước */}
                  <div className="u052-face u052-front">
                    <BlackCardFrontContent data={liveData} />
                    <div className="u052-shine" />
                  </div>

                  {/* Mặt Sau */}
                  <div className="u052-face u052-back">
                    <BlackCardBackContent data={liveData} />
                    <div className="u052-shine" />
                  </div>
                </div>
              </div>

              {/* Hàng nút điều khiển thẻ gọn phía dưới (.u052-bar) */}
              <div className="u052-bar w-full">
                <button
                  type="button"
                  onClick={handleFlipButton}
                  className="u052-btn"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{isBackShown ? 'Lật Mặt Trước' : 'Lật Mặt Sau'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUseCover((prev) => !prev)}
                  aria-pressed={useCover}
                  className="u052-btn"
                >
                  {useCover ? (
                    <>
                      <Layers className="w-3.5 h-3.5" />
                      <span>Nền Kim Loại</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Nền Ảnh Bìa</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsMasked((prev) => !prev)}
                  aria-pressed={isMasked}
                  className="u052-btn"
                  title="Che mã định danh khi chụp ảnh công khai"
                >
                  {isMasked ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                  <span>Ẩn ID</span>
                </button>
              </div>

              {/* Bộ chọn chế độ xuất + Hai nút Chia Sẻ / Tải Ảnh */}
              <div className="w-full pt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-center gap-1.5 p-1 rounded-full bg-[#06141B] border border-white/10 w-fit mx-auto">
                  <button
                    type="button"
                    onClick={() => setExportMode('both')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                      exportMode === 'both'
                        ? 'bg-[#253745] text-white border border-white/15 shadow-sm'
                        : 'text-[#9BA8AB] hover:text-white'
                    }`}
                  >
                    Xuất Cả 2 Mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportMode('current')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                      exportMode === 'current'
                        ? 'bg-[#253745] text-white border border-white/15 shadow-sm'
                        : 'text-[#9BA8AB] hover:text-white'
                    }`}
                  >
                    Mặt Đang Xem
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleSharePng}
                    disabled={isExporting}
                    className="h-10 px-4 rounded-2xl bg-[#11212D] hover:bg-[#1A2F40] border border-white/15 text-[#F4F0E8] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer disabled:opacity-60"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Share2 className="w-4 h-4 text-amber-300" />
                    )}
                    <span>Chia Sẻ Ngay</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    disabled={isExporting}
                    className="h-10 px-4 rounded-2xl bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(204,208,207,0.2)] transition active:scale-[0.98] cursor-pointer disabled:opacity-60"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : downloadSuccess ? (
                      <Check className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{downloadSuccess ? 'Đã Lưu Ảnh' : 'Tải Ảnh Về Máy'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Khung kết xuất 2D phẳng ẩn ngoài màn hình — an toàn 100% trên iOS Safari/WebKit */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          pointerEvents: 'none',
          opacity: 1,
          zIndex: -1,
        }}
      >
        {exportMode === 'both' ? (
          <div
            ref={exportRef}
            style={{
              width: '460px',
              height: '596px',
              background: '#06141B',
              backgroundImage: `radial-gradient(circle at 50% 48%, ${theme.glowRgba} 0%, rgba(6, 20, 27, 0) 70%)`,
              padding: '24px 40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
              color: '#F4F0E8',
            }}
          >
            {/* Header thương hiệu phía trên */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {exportData.logoSrc && (
                <img
                  src={exportData.logoSrc}
                  alt="FaeQuest"
                  style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                />
              )}
              <span
                className="font-rpg"
                style={{
                  fontSize: '12px',
                  fontWeight: 900,
                  letterSpacing: '0.18em',
                  color: '#F4F0E8',
                }}
              >
                FAEQUEST • HẮC THẺ THỢ SĂN
              </span>
            </div>

            {/* Mặt Trước 2D phẳng */}
            <div
              style={{
                width: '380px',
                height: '240px',
                borderRadius: '20px',
                overflow: 'hidden',
                border: `1px solid ${theme.accentBorder}`,
                boxShadow: `0 18px 38px rgba(0, 0, 0, 0.78), 0 0 24px -6px ${theme.glowRgba}`,
              }}
            >
              <BlackCardFrontContent data={exportData} flat />
            </div>

            {/* Mặt Sau 2D phẳng */}
            <div
              style={{
                width: '380px',
                height: '240px',
                borderRadius: '20px',
                overflow: 'hidden',
                border: `1px solid ${theme.accentBorder}`,
                boxShadow: `0 18px 38px rgba(0, 0, 0, 0.78), 0 0 24px -6px ${theme.glowRgba}`,
              }}
            >
              <BlackCardBackContent data={exportData} flat />
            </div>

            {/* Footer */}
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: '#9BA8AB',
              }}
            >
              FAEQUEST.VERCEL.APP • {seasonLabel}
            </div>
          </div>
        ) : (
          <div
            ref={exportRef}
            style={{
              width: '428px',
              height: '288px',
              background: '#06141B',
              backgroundImage: `radial-gradient(circle at 50% 50%, ${theme.glowRgba} 0%, rgba(6, 20, 27, 0) 72%)`,
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: '380px',
                height: '240px',
                borderRadius: '20px',
                overflow: 'hidden',
                border: `1px solid ${theme.accentBorder}`,
                boxShadow: `0 18px 38px rgba(0, 0, 0, 0.78), 0 0 24px -6px ${theme.glowRgba}`,
              }}
            >
              {isBackShown ? (
                <BlackCardBackContent data={exportData} flat />
              ) : (
                <BlackCardFrontContent data={exportData} flat />
              )}
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
};
