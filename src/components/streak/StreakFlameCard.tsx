import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { getLocalDateStr } from '../../utils/dateUtils';
import './StreakFlameCard.css';

const WEEK_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;

interface SparkSpec {
  phase: number;
  speed: number;
  driftX: number;
  baseX: number;
  radius: number;
}

const SPARK_SPECS: SparkSpec[] = [
  { phase: 0.05, speed: 0.42, driftX: -7, baseX: 54, radius: 1.9 },
  { phase: 0.21, speed: 0.56, driftX: 9, baseX: 64, radius: 1.5 },
  { phase: 0.38, speed: 0.48, driftX: -5, baseX: 59, radius: 2.1 },
  { phase: 0.52, speed: 0.63, driftX: 6, baseX: 56, radius: 1.4 },
  { phase: 0.67, speed: 0.44, driftX: 11, baseX: 62, radius: 1.7 },
  { phase: 0.81, speed: 0.52, driftX: -10, baseX: 60, radius: 1.3 },
  { phase: 0.93, speed: 0.59, driftX: 4, baseX: 58, radius: 1.6 },
];

function parseYmdToLocalNoon(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function addDaysToYmd(ymd: string, deltaDays: number): string {
  const dt = parseYmdToLocalNoon(ymd);
  if (!dt) return ymd;
  dt.setDate(dt.getDate() + deltaDays);
  return getLocalDateStr(dt);
}

export interface StreakFlameCardProps {
  mode?: 'view' | 'modal';
  onClose?: () => void;
  /** Khi ở chế độ Modal chúc mừng ngày mới, truyền prevStreak để diễn hoạt cuộn từ số cũ lên số mới */
  celebrationFrom?: number;
  className?: string;
}

export const StreakFlameCard: React.FC<StreakFlameCardProps> = ({
  mode = 'view',
  onClose,
  celebrationFrom,
  className = '',
}) => {
  const storeStreakDays = useFaeQuestStore((s) => s.streakDays);
  const storeLastStreakDate = useFaeQuestStore((s) => s.lastStreakDate);
  const currentUser = useFaeQuestStore((s) => s.currentUser);
  const syncDailyLoginStreak = useFaeQuestStore((s) => s.syncDailyLoginStreak);

  const uid = useId().replace(/:/g, '');
  const outerGradId = `u379-og-${uid}`;
  const midGradId = `u379-mg-${uid}`;
  const coreGradId = `u379-cg-${uid}`;

  // Ngày hôm nay theo giờ địa phương, tự cập nhật khi chạy qua 00:00 hoặc mở lại trên điện thoại
  const [todayStr, setTodayStr] = useState<string>(() => getLocalDateStr());
  const [isSyncing, setIsSyncing] = useState(false);

  // Điều khiển chuỗi diễn hoạt chúc mừng ngày mới (sau 350ms mới cuộn Odometer + bùng lửa + tích hôm nay)
  const hasCelebrationAnim = mode === 'modal' && typeof celebrationFrom === 'number';
  const [celebrationRevealed, setCelebrationRevealed] = useState<boolean>(() => !hasCelebrationAnim);
  const [todayJustPopped, setTodayJustPopped] = useState<boolean>(false);

  useEffect(() => {
    const refreshToday = () => {
      const next = getLocalDateStr();
      setTodayStr((prev) => (prev === next ? prev : next));
    };
    refreshToday();
    const timer = window.setInterval(refreshToday, 15000);
    window.addEventListener('focus', refreshToday);
    document.addEventListener('visibilitychange', refreshToday);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshToday);
      document.removeEventListener('visibilitychange', refreshToday);
    };
  }, []);

  const normalizedLastStreakDate = String(storeLastStreakDate || '').slice(0, 10);

  // Giá trị hiển thị thực tế (tôn trọng nhịp trễ 350ms khi mở Modal chúc mừng)
  const effectiveStreak = hasCelebrationAnim && !celebrationRevealed ? celebrationFrom : storeStreakDays;
  const isCheckedInToday =
    hasCelebrationAnim && !celebrationRevealed
      ? false
      : normalizedLastStreakDate === todayStr && storeStreakDays > 0;

  // Suy ngược chính xác 7 ngày trong tuần hiện tại (T2 = index 0 .. CN = index 6)
  const weekState = useMemo(() => {
    const todayDate = parseYmdToLocalNoon(todayStr) || new Date();
    const todayWeekIdx = (todayDate.getDay() + 6) % 7;
    const mondayStr = addDaysToYmd(todayStr, -todayWeekIdx);

    const litDates = new Set<string>();
    if (effectiveStreak > 0) {
      let anchorStr = '';
      if (hasCelebrationAnim && !celebrationRevealed) {
        // Trước khoảnh khắc chúc mừng: mốc cuối là hôm qua (nếu hôm nay mới nối tiếp)
        anchorStr = addDaysToYmd(todayStr, -1);
      } else if (normalizedLastStreakDate && /^\d{4}-\d{2}-\d{2}$/.test(normalizedLastStreakDate)) {
        anchorStr = normalizedLastStreakDate;
      } else {
        anchorStr = todayStr;
      }

      const cappedDays = Math.min(effectiveStreak, 14);
      for (let i = 0; i < cappedDays; i++) {
        litDates.add(addDaysToYmd(anchorStr, -i));
      }
    }

    const days = WEEK_LABELS.map((label, idx) => {
      const dateStr = addDaysToYmd(mondayStr, idx);
      return {
        label,
        idx,
        dateStr,
        isToday: idx === todayWeekIdx,
        isOn: litDates.has(dateStr),
      };
    });

    const doneInWeek = days.filter((d) => d.isOn).length;
    return { days, todayWeekIdx, doneInWeek };
  }, [todayStr, effectiveStreak, normalizedLastStreakDate, hasCelebrationAnim, celebrationRevealed]);

  // Ref vật lý cho vòng lặp requestAnimationFrame
  const cardRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const outerPathRef = useRef<SVGPathElement | null>(null);
  const midPathRef = useRef<SVGPathElement | null>(null);
  const corePathRef = useRef<SVGPathElement | null>(null);
  const sparkRefs = useRef<(SVGCircleElement | null)[]>([]);
  const flareRef = useRef<number>(0);

  const isMilestone =
    effectiveStreak > 0 &&
    (weekState.doneInWeek === 7 ||
      effectiveStreak % 30 === 0 ||
      effectiveStreak % 14 === 0 ||
      effectiveStreak % 7 === 0);

  const flameIntensityRef = useRef({
    doneInWeek: weekState.doneInWeek,
    streak: effectiveStreak,
    isMilestone,
  });

  useEffect(() => {
    flameIntensityRef.current = {
      doneInWeek: weekState.doneInWeek,
      streak: effectiveStreak,
      isMilestone,
    };
  }, [weekState.doneInWeek, effectiveStreak, isMilestone]);

  // Kích hoạt bùng sáng sau 350ms nếu ở Modal chúc mừng ngày mới
  useEffect(() => {
    if (!hasCelebrationAnim) return;
    setCelebrationRevealed(false);
    setTodayJustPopped(false);

    const timer = window.setTimeout(() => {
      setCelebrationRevealed(true);
      setTodayJustPopped(true);
      flareRef.current = 1;
    }, 350);

    return () => window.clearTimeout(timer);
  }, [hasCelebrationAnim, celebrationFrom, storeStreakDays]);

  // Vòng lặp ngọn lửa SVG 3 lớp Bezier mượt + 7 đốm tàn lửa + tiết kiệm pin ngoài viewport
  useEffect(() => {
    const cardEl = cardRef.current;
    if (!cardEl) return;

    const drawFrame = (t: number) => {
      const { doneInWeek, streak, isMilestone: milestoneActive } = flameIntensityRef.current;
      const flare = flareRef.current;
      const progress = Math.min(1, Math.max(0, doneInWeek / 7));

      // Độ lớn scale từ 0.82 đến 1.15 theo số ngày sáng trong tuần (+ nhích nhẹ ở mốc đặc biệt)
      const baseScale =
        streak <= 0 ? 0.82 : 0.82 + progress * 0.28 + (milestoneActive ? 0.05 : 0);
      const scale = Math.min(1.15, baseScale) + flare * 0.09;

      const sway1 = Math.sin(t * 2.5) * (2.6 + flare * 2.4);
      const sway2 = Math.cos(t * 3.4 + 0.7) * (1.9 + flare * 2.0);
      const breath = Math.sin(t * 4.2) * (1.8 + flare * 1.6);

      const cx = 60;
      const baseY = 104;
      const tipY = baseY - (68 + breath * 1.4) * scale;
      const tipX = cx + sway1 * 1.15;
      const midW = 29 * scale;
      const hipW = 23 * scale;

      // Lớp ngoài đỏ-cam (u379-fo)
      const outerD = [
        `M ${cx.toFixed(2)} ${baseY.toFixed(2)}`,
        `C ${(cx - hipW).toFixed(2)} ${baseY.toFixed(2)}, ${(cx - midW).toFixed(2)} ${(
          baseY -
          28 * scale
        ).toFixed(2)}, ${(cx - 10 * scale + sway2 * 0.5).toFixed(2)} ${(
          baseY -
          50 * scale
        ).toFixed(2)}`,
        `C ${(cx - 4 * scale + sway1 * 0.7).toFixed(2)} ${(baseY - 60 * scale).toFixed(2)}, ${(
          tipX -
          2 * scale
        ).toFixed(2)} ${(tipY + 8 * scale).toFixed(2)}, ${tipX.toFixed(2)} ${tipY.toFixed(2)}`,
        `C ${(tipX + 4 * scale).toFixed(2)} ${(tipY + 12 * scale).toFixed(2)}, ${(
          cx +
          16 * scale +
          sway2 * 0.6
        ).toFixed(2)} ${(baseY - 46 * scale).toFixed(2)}, ${(cx + midW).toFixed(2)} ${(
          baseY -
          24 * scale
        ).toFixed(2)}`,
        `C ${(cx + hipW).toFixed(2)} ${baseY.toFixed(2)}, ${cx.toFixed(2)} ${baseY.toFixed(
          2
        )}, ${cx.toFixed(2)} ${baseY.toFixed(2)} Z`,
      ].join(' ');

      if (outerPathRef.current) {
        outerPathRef.current.setAttribute('d', outerD);
      }

      // Lớp giữa vàng-cam (u379-fm)
      const midTipY = baseY - (50 + breath * 1.05) * scale;
      const midTipX = cx + sway2 * 0.95;
      const mW = 19 * scale;
      const midD = [
        `M ${cx.toFixed(2)} ${(baseY - 2).toFixed(2)}`,
        `C ${(cx - mW).toFixed(2)} ${(baseY - 2).toFixed(2)}, ${(cx - mW * 1.1).toFixed(2)} ${(
          baseY -
          22 * scale
        ).toFixed(2)}, ${(cx - 5 * scale + sway1 * 0.4).toFixed(2)} ${(
          baseY -
          38 * scale
        ).toFixed(2)}`,
        `C ${(cx + sway2 * 0.5).toFixed(2)} ${(midTipY + 8 * scale).toFixed(
          2
        )}, ${midTipX.toFixed(2)} ${midTipY.toFixed(2)}, ${midTipX.toFixed(2)} ${midTipY.toFixed(
          2
        )}`,
        `C ${(midTipX + 8 * scale).toFixed(2)} ${(midTipY + 14 * scale).toFixed(2)}, ${(
          cx +
          mW * 1.08
        ).toFixed(2)} ${(baseY - 20 * scale).toFixed(2)}, ${(cx + mW).toFixed(2)} ${(
          baseY - 2
        ).toFixed(2)}`,
        `C ${(cx + mW * 0.5).toFixed(2)} ${(baseY - 2).toFixed(2)}, ${cx.toFixed(2)} ${(
          baseY - 2
        ).toFixed(2)}, ${cx.toFixed(2)} ${(baseY - 2).toFixed(2)} Z`,
      ].join(' ');

      if (midPathRef.current) {
        midPathRef.current.setAttribute('d', midD);
      }

      // Lớp lõi vàng trắng (u379-fc)
      const coreTipY = baseY - (32 + breath * 0.7) * scale;
      const coreTipX = cx + sway1 * 0.55;
      const cW = 10.5 * scale;
      const coreD = [
        `M ${cx.toFixed(2)} ${(baseY - 4).toFixed(2)}`,
        `C ${(cx - cW).toFixed(2)} ${(baseY - 4).toFixed(2)}, ${(cx - cW).toFixed(2)} ${(
          baseY -
          16 * scale
        ).toFixed(2)}, ${coreTipX.toFixed(2)} ${coreTipY.toFixed(2)}`,
        `C ${(cx + cW).toFixed(2)} ${(baseY - 16 * scale).toFixed(2)}, ${(cx + cW).toFixed(2)} ${(
          baseY - 4
        ).toFixed(2)}, ${cx.toFixed(2)} ${(baseY - 4).toFixed(2)} Z`,
      ].join(' ');

      if (corePathRef.current) {
        corePathRef.current.setAttribute('d', coreD);
      }

      // Hào quang nền
      if (glowRef.current) {
        const glowScale = scale * (0.95 + Math.sin(t * 3.1) * 0.06 + flare * 0.25);
        const glowOpacity = Math.min(
          1,
          (streak <= 0 ? 0.35 : 0.52 + progress * 0.28 + (milestoneActive ? 0.14 : 0)) + flare * 0.3
        );
        glowRef.current.style.transform = `translate(-50%, -50%) scale(${glowScale.toFixed(3)})`;
        glowRef.current.style.opacity = glowOpacity.toFixed(3);
      }

      // 7 đốm tàn lửa (u379-sp)
      const activeSparks = streak <= 0 ? 3 : Math.min(7, 3 + Math.round(progress * 4) + (milestoneActive ? 1 : 0));
      const travelDist = (52 + flare * 24) * scale;

      SPARK_SPECS.forEach((sp, i) => {
        const el = sparkRefs.current[i];
        if (!el) return;
        const speedBoost = sp.speed * (1 + flare * 0.85);
        const life = (t * speedBoost + sp.phase) % 1;
        const x = sp.baseX + Math.sin(life * Math.PI * 2 + sp.phase * 8) * sp.driftX + flare * (i % 2 === 0 ? -3 : 3);
        const y = baseY - 16 * scale - life * travelDist;
        const visibilityFactor = i < activeSparks || flare > 0.15 ? 1 : 0.25;
        const alpha = Math.sin(life * Math.PI) * visibilityFactor * (0.65 + flare * 0.35);
        const r = sp.radius * (1 - life * 0.45) * (1 + flare * 0.25);

        el.setAttribute('cx', x.toFixed(2));
        el.setAttribute('cy', y.toFixed(2));
        el.setAttribute('r', Math.max(0.4, r).toFixed(2));
        el.setAttribute('opacity', Math.max(0, Math.min(1, alpha)).toFixed(3));
      });
    };

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      drawFrame(0.6);
      return;
    }

    let rafId: number | null = null;
    let isVisible = true;
    const startTime = performance.now();

    const loop = (now: number) => {
      if (!isVisible) {
        rafId = null;
        return;
      }
      const elapsed = (now - startTime) / 1000;
      if (flareRef.current > 0.004) {
        flareRef.current *= 0.94;
      } else {
        flareRef.current = 0;
      }
      drawFrame(elapsed);
      rafId = window.requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (rafId === null && isVisible) {
        rafId = window.requestAnimationFrame(loop);
      }
    };

    const stopLoop = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          isVisible = Boolean(entry?.isIntersecting);
          if (isVisible) {
            startLoop();
          } else {
            stopLoop();
          }
        },
        { threshold: 0.05 }
      );
      io.observe(cardEl);
    }

    startLoop();

    return () => {
      stopLoop();
      if (io) io.disconnect();
    };
  }, []);

  const handleTriggerFlare = () => {
    flareRef.current = 1;
  };

  const handleManualCheckIn = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const updated = await syncDailyLoginStreak(currentUser?.id, { skipModal: true });
      if (updated !== null) {
        flareRef.current = 1;
        setTodayJustPopped(true);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Tách từng chữ số 0-9 không giới hạn chiều dài cho Odometer
  const digits = String(Math.max(0, Math.floor(effectiveStreak))).split('');

  return (
    <div
      ref={cardRef}
      className={`u379-card ${isMilestone ? 'is-milestone' : ''} ${className}`}
    >
      {/* Huy hiệu Trọn Tuần khi sáng đủ 7/7 ngày T2-CN */}
      {weekState.doneInWeek === 7 && (
        <span className="u379-bd">Trọn Tuần!</span>
      )}

      {/* Vùng ngọn lửa tương tác: chạm để bùng sáng (flare = 1) mà không đổi DB */}
      <button
        type="button"
        onClick={handleTriggerFlare}
        className="u379-flame-btn"
        aria-label="Chạm để thổi bùng ngọn lửa kỷ luật"
        title="Chạm để thổi bùng ngọn lửa"
      >
        <div ref={glowRef} className="u379-glow" />
        <svg viewBox="0 0 120 120" className="u379-svg" aria-hidden="true">
          <defs>
            <linearGradient id={outerGradId} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#F03E3E" />
              <stop offset="58%" stopColor="#FF6B2B" />
              <stop offset="100%" stopColor="#FFA94D" />
            </linearGradient>
            <linearGradient id={midGradId} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#FF6B2B" />
              <stop offset="65%" stopColor="#FFA94D" />
              <stop offset="100%" stopColor="#FFD43B" />
            </linearGradient>
            <linearGradient id={coreGradId} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#FFD43B" />
              <stop offset="100%" stopColor="#FFF9DB" />
            </linearGradient>
          </defs>

          <path ref={outerPathRef} className="u379-fo" fill={`url(#${outerGradId})`} />
          <path ref={midPathRef} className="u379-fm" fill={`url(#${midGradId})`} />
          <path ref={corePathRef} className="u379-fc" fill={`url(#${coreGradId})`} />

          {SPARK_SPECS.map((sp, i) => (
            <circle
              key={i}
              ref={(el) => {
                sparkRefs.current[i] = el;
              }}
              className="u379-sp"
              cx={sp.baseX}
              cy={80}
              r={sp.radius}
              fill={i % 2 === 0 ? '#FFD43B' : '#FFA94D'}
              opacity="0"
            />
          ))}
        </svg>
      </button>

      {/* Bộ đếm Odometer từng chữ số + nhãn */}
      <div className="u379-cnt">
        <div className="u379-odo" aria-label={`${effectiveStreak} ngày liên tiếp`}>
          {digits.map((d, idx) => {
            const num = Number(d) || 0;
            const slotFromRight = digits.length - 1 - idx;
            return (
              <span key={`slot-${slotFromRight}`} className="u379-col">
                <span
                  className="u379-tk"
                  style={{ transform: `translateY(-${num * 10}%)` }}
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <span key={n}>{n}</span>
                  ))}
                </span>
              </span>
            );
          })}
        </div>
        <span className="u379-lbl">ngày liên tiếp</span>
      </div>

      {/* Lịch tuần thực tế T2 - CN */}
      <div className="u379-wk" role="list" aria-label="Lịch giữ lửa trong tuần">
        {weekState.days.map((day) => {
          const shouldPop = day.isToday && day.isOn && todayJustPopped;
          return (
            <div
              key={day.dateStr}
              role="listitem"
              className={`u379-day ${day.isToday ? 'is-today-col' : ''}`}
              title={`${day.label} (${day.dateStr})`}
            >
              <span className="u379-dlbl">{day.label}</span>
              <div
                className={[
                  'u379-dot',
                  day.isToday ? 'is-today' : '',
                  day.isOn ? 'is-on' : '',
                  shouldPop ? 'is-pop' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {day.isOn && (
                  <svg viewBox="0 0 16 16" className="u379-chk" aria-hidden="true">
                    <path d="M3.5 8.5 L6.5 11.5 L12.5 4.5" />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Khu vực đáy thẻ theo đúng 3 ngữ cảnh */}
      <div className="u379-ft">
        {mode === 'modal' ? (
          <button
            type="button"
            onClick={onClose}
            className="u379-cta"
          >
            Tiếp Tục Rèn Luyện
          </button>
        ) : isCheckedInToday ? (
          <div className="u379-status">
            🔥 Đã giữ lửa hôm nay
          </div>
        ) : (
          <button
            type="button"
            onClick={handleManualCheckIn}
            disabled={isSyncing}
            className="u379-cta"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang thắp lửa...</span>
              </>
            ) : (
              <span>Thắp Lửa Hôm Nay</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
