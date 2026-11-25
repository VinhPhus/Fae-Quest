import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { notifyBagHit, resolveActiveBagTarget, subscribeFlyRequests } from './shopFlyBridge';
import './ShopFlyFX.css';

/**
 * Lớp phủ thực hiện đường bay Parabol Web Animations API (12 keyframes) cho vật phẩm Cửa Hàng -> Túi Đồ.
 */
export const FlyToBagOverlay: React.FC = () => {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const [srAnnouncement, setSrAnnouncement] = useState<string>('');

  useEffect(() => {
    const unsubscribe = subscribeFlyRequests(({ sourceEl, emoji, title, isSystem }) => {
      const announceSuccess = () => {
        notifyBagHit(title);
        setSrAnnouncement('');
        requestAnimationFrame(() => {
          setSrAnnouncement(`Đã thêm ${title} vào Túi Đồ`);
        });
      };

      const reducedMotion =
        typeof window !== 'undefined' &&
        Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

      const canWebAnimate =
        typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';

      const targetEl = resolveActiveBagTarget();
      const layer = layerRef.current;

      if (reducedMotion || !canWebAnimate || !sourceEl || !targetEl || !layer) {
        announceSuccess();
        return;
      }

      const targetIconEl = targetEl.querySelector<HTMLElement>('.u442-bag-ic') || targetEl;
      const srcRect = sourceEl.getBoundingClientRect();
      const dstRect = targetIconEl.getBoundingClientRect();

      if (srcRect.width === 0 || dstRect.width === 0) {
        announceSuccess();
        return;
      }

      const sx = srcRect.left + srcRect.width / 2;
      const sy = srcRect.top + srcRect.height / 2;
      const ex = dstRect.left + dstRect.width / 2;
      const ey = dstRect.top + dstRect.height / 2;

      const cx = (sx + ex) / 2;
      const cy = Math.min(sy, ey) - 90;

      // Tạo phần tử clone mang đúng icon thật của vật phẩm
      const clone = document.createElement('div');
      clone.className = `u442-fly ${isSystem ? 'is-system' : 'is-custom'}`;

      const isImageUrl =
        emoji.startsWith('http') || emoji.startsWith('/') || emoji.startsWith('data:');
      if (isImageUrl) {
        const img = document.createElement('img');
        img.src = emoji;
        img.alt = title;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        clone.appendChild(img);
      } else {
        const span = document.createElement('span');
        span.textContent = emoji;
        span.style.fontSize = '26px';
        span.style.lineHeight = '1';
        clone.appendChild(span);
      }

      layer.appendChild(clone);

      // Tạo 12 keyframes theo đường cong Bezier bậc 2
      const keyframes: Keyframe[] = [];
      const steps = 12;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const u = 1 - t;
        const x = u * u * sx + 2 * u * t * cx + t * t * ex;
        const y = u * u * sy + 2 * u * t * cy + t * t * ey;
        const scale = 1 - 0.66 * t; // 1.0 -> 0.34
        const rotate = 24 * t; // 0deg -> 24deg
        const opacity = t > 0.92 ? Math.max(0, (1 - t) / 0.08) : 1;

        keyframes.push({
          transform: `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)}) rotate(${rotate.toFixed(2)}deg)`,
          opacity: Number(opacity.toFixed(3)),
        });
      }

      let cleaned = false;
      const cleanup = (triggerHit: boolean) => {
        if (cleaned) return;
        cleaned = true;
        if (clone.parentNode) {
          clone.parentNode.removeChild(clone);
        }
        if (triggerHit) {
          announceSuccess();
        }
      };

      const animation = clone.animate(keyframes, {
        duration: 720,
        easing: 'cubic-bezier(0.45, 0, 0.55, 1)',
        fill: 'forwards',
      });

      animation.onfinish = () => cleanup(true);
      animation.oncancel = () => cleanup(false);
    });

    return () => {
      unsubscribe();
      if (layerRef.current) {
        layerRef.current.innerHTML = '';
      }
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        ref={layerRef}
        className="fixed inset-0 pointer-events-none z-[9998]"
        aria-hidden="true"
      />
      <p role="status" className="sr-only">
        {srAnnouncement}
      </p>
    </>,
    document.body
  );
};
