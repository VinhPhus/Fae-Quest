import { useEffect } from 'react';

let lockCount = 0;
let originalHtmlOverflow = '';
let originalBodyOverflow = '';
let originalHtmlOverscroll = '';
let originalBodyOverscroll = '';

/**
 * Custom hook to lock body & html scroll when a Modal / Bottom Sheet / Overlay is open.
 * Supports nested / multiple modals using a reference counter.
 */
export const useBodyScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    if (lockCount === 0) {
      originalHtmlOverflow = document.documentElement.style.overflow;
      originalBodyOverflow = document.body.style.overflow;
      originalHtmlOverscroll = document.documentElement.style.overscrollBehavior;
      originalBodyOverscroll = document.body.style.overscrollBehavior;

      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.overscrollBehavior = 'none';
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    }
    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.documentElement.style.overscrollBehavior = originalHtmlOverscroll;
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.overscrollBehavior = originalBodyOverscroll;
      }
    };
  }, [isOpen]);
};
