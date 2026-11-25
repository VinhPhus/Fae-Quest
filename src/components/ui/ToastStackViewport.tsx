import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useToastStore, ToastItem } from '../../store/useToastStore';
import { useChillyAudioStore } from '../../store/useChillyAudioStore';
import './ToastStack.css';
import { Check, Sparkles, Info, Loader2, AlertTriangle, X, HeartPulse } from 'lucide-react';

interface ToastCardProps {
  item: ToastItem;
  index: number;
  isExpanded: boolean;
  isMobile: boolean;
  offsetY: number;
  onDismiss: (id: string) => void;
  onExpandMobile: () => void;
  canExpandOnTap: boolean;
  measureRef: (el: HTMLDivElement | null) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({
  item,
  index,
  isExpanded,
  isMobile,
  offsetY,
  onDismiss,
  onExpandMobile,
  canExpandOnTap,
  measureRef,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [throwDir, setThrowDir] = useState<-1 | 0 | 1>(0);

  const pointerStartRef = useRef<{ x: number; y: number; active: boolean; moved: boolean }>({
    x: 0,
    y: 0,
    active: false,
    moved: false,
  });

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const isBack = !isExpanded && index > 0;

  // Cập nhật thuộc tính DOM inert cho các thẻ phía sau khi thu gọn
  useEffect(() => {
    const el = cardRef.current as (HTMLDivElement & { inert?: boolean }) | null;
    if (el) {
      el.inert = isBack;
    }
  }, [isBack]);

  const setRefs = (el: HTMLDivElement | null) => {
    cardRef.current = el;
    measureRef(el);
  };

  const isHiddenLayer = !isExpanded && index >= 3;
  const scale = isExpanded ? 1 : Math.max(0.76, 1 - Math.min(index, 3) * 0.06);

  // Tọa độ đứng: Desktop bung lên trên (-Y), Mobile bung xuống dưới (+Y)
  let baseY = 0;
  if (!mounted) {
    baseY = isMobile ? -18 : 18;
  } else if (isExpanded) {
    baseY = isMobile ? offsetY : -offsetY;
  } else {
    const clampedIdx = Math.min(index, 3);
    baseY = isMobile ? clampedIdx * 12 : -(clampedIdx * 14);
  }

  let translateX = dragX;
  let rotateDeg = Math.max(-8, Math.min(8, dragX * 0.06));
  if (throwDir !== 0) {
    translateX = throwDir * 380;
    rotateDeg = throwDir * 8;
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    if (isBack && !isExpanded) return;

    pointerStartRef.current = { x: e.clientX, y: e.clientY, active: true, moved: false };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current.active) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;

    if (!pointerStartRef.current.moved) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
        pointerStartRef.current.active = false;
        return;
      }
      if (Math.abs(dx) > 6) {
        pointerStartRef.current.moved = true;
        setIsDragging(true);
      }
    }

    if (pointerStartRef.current.moved) {
      setDragX(dx);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current.active) return;
    pointerStartRef.current.active = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (!pointerStartRef.current.moved) {
      // Chạm nhẹ trên Mobile khi chồng >= 2 thẻ -> bung danh sách
      if (isMobile && canExpandOnTap && !isExpanded) {
        onExpandMobile();
      }
      return;
    }

    if (Math.abs(dragX) >= 90) {
      const dir: -1 | 1 = dragX >= 0 ? 1 : -1;
      setIsDragging(false);
      setThrowDir(dir);
      setTimeout(() => onDismiss(item.id), 220);
    } else {
      setIsDragging(false);
      setDragX(0);
    }
  };

  const renderIcon = () => {
    switch (item.kind) {
      case 'ok':
        return <Check className="w-4 h-4 stroke-[2.5]" />;
      case 'reward':
        return <Sparkles className="w-4 h-4" />;
      case 'wait':
        return <Loader2 className="w-4 h-4 u070-spin" />;
      case 'err':
        return <AlertTriangle className="w-4 h-4" />;
      case 'info':
      default:
        return item.accent === 'healing' ? (
          <HeartPulse className="w-4 h-4" />
        ) : (
          <Info className="w-4 h-4" />
        );
    }
  };

  return (
    <div
      ref={setRefs}
      data-kind={item.kind}
      data-accent={item.accent || undefined}
      role={item.kind === 'err' ? 'alert' : 'status'}
      aria-live={item.kind === 'err' ? 'assertive' : 'polite'}
      aria-hidden={isBack || undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={
        {
          zIndex: 50 - index,
          opacity: !mounted || throwDir !== 0 || isHiddenLayer ? 0 : 1,
          transform: `translate3d(${translateX}px, ${baseY}px, 0) scale(${scale}) rotate(${rotateDeg}deg)`,
          '--u070-dur': `${item.duration}ms`,
        } as React.CSSProperties
      }
      className={`u070-t ${isBack ? 'is-back' : ''} ${isHiddenLayer ? 'is-hidden-layer' : ''} ${
        isDragging ? 'is-dragging' : ''
      } ${throwDir !== 0 ? 'is-throwing' : ''}`}
    >
      <div className="u070-inner">
        <div className="u070-ico">{renderIcon()}</div>

        <div className="u070-body">
          <div className="u070-title">{item.title}</div>
          {item.description && <div className="u070-desc">{item.description}</div>}
          {item.action && (
            <button
              type="button"
              className="u070-act"
              onClick={(e) => {
                e.stopPropagation();
                item.action?.onClick();
                onDismiss(item.id);
              }}
            >
              {item.action.label}
            </button>
          )}
        </div>

        <button
          type="button"
          className="u070-close"
          aria-label="Đóng thông báo"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(item.id);
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Thanh tiến trình đếm ngược ở đáy (ẩn đối với trạng thái wait) */}
      {Number.isFinite(item.duration) && (
        <div key={`${item.id}_${item.timerVersion}`} className="u070-bar" />
      )}
    </div>
  );
};

export const ToastStackViewport: React.FC = () => {
  const { toasts, isExpanded, dismiss, setExpanded } = useToastStore();
  const isChillyFullscreen = useChillyAudioStore((s) => s.isChillyFullscreen);

  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [heights, setHeights] = useState<Record<string, number>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Đo chiều cao thực tế từng thẻ để khi bung danh sách không bao giờ bị đè chữ
  useLayoutEffect(() => {
    const nextHeights: Record<string, number> = {};
    let changed = false;
    for (const t of toasts.slice(0, 6)) {
      const el = cardRefs.current[t.id];
      const h = el ? el.offsetHeight : 60;
      nextHeights[t.id] = h;
      if (heights[t.id] !== h) changed = true;
    }
    if (changed) {
      setHeights(nextHeights);
    }
  }, [toasts, isExpanded, isMobile]);

  // Trên Mobile: chạm ra ngoài chồng thẻ để thu gọn lại
  useEffect(() => {
    if (!isMobile || !isExpanded || typeof document === 'undefined') return;
    const handleOutside = (e: PointerEvent) => {
      if (viewportRef.current && !viewportRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [isMobile, isExpanded, setExpanded]);

  if (typeof document === 'undefined' || toasts.length === 0) return null;

  const visibleToasts = toasts.slice(0, 6);
  const offsets: number[] = [];
  let runningY = 0;
  for (let i = 0; i < visibleToasts.length; i++) {
    offsets.push(runningY);
    const h = heights[visibleToasts[i].id] || 60;
    runningY += h + 8;
  }

  const frontHeight = heights[visibleToasts[0]?.id] || 60;
  const stackHeight = isExpanded
    ? Math.max(frontHeight, runningY - 8)
    : frontHeight + Math.min(visibleToasts.length - 1, 2) * (isMobile ? 12 : 14);

  return createPortal(
    <div
      ref={viewportRef}
      onMouseEnter={() => {
        if (!isMobile) setExpanded(true);
      }}
      onMouseLeave={() => {
        if (!isMobile) setExpanded(false);
      }}
      onFocus={() => setExpanded(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setExpanded(false);
        }
      }}
      className={`u070-vp ${isExpanded ? 'is-expanded' : ''} ${
        isChillyFullscreen ? 'is-chilly-fs' : ''
      }`}
    >
      <div className="u070-stack" style={{ height: `${stackHeight}px` }}>
        {visibleToasts.map((item, idx) => (
          <ToastCard
            key={item.id}
            item={item}
            index={idx}
            isExpanded={isExpanded}
            isMobile={isMobile}
            offsetY={offsets[idx] || 0}
            onDismiss={dismiss}
            onExpandMobile={() => setExpanded(true)}
            canExpandOnTap={visibleToasts.length >= 2}
            measureRef={(el) => {
              cardRefs.current[item.id] = el;
            }}
          />
        ))}
      </div>
    </div>,
    document.body
  );
};
