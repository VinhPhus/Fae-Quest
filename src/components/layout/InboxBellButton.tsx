import React, { useEffect, useRef, useState } from 'react';
import { Mail } from 'lucide-react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import '../modals/InboxPopover.css';

const triggerRegistry = new Set<HTMLButtonElement>();

/**
 * Tìm nút Hộp Thư đang hiển thị trên màn hình (Desktop Top Bar hoặc Mobile Header).
 */
export function getVisibleInboxAnchor(): HTMLButtonElement | null {
  for (const btn of triggerRegistry) {
    const rect = btn.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return btn;
    }
  }
  return null;
}

export function isInboxTriggerElement(target: Node | null): boolean {
  if (!target) return false;
  for (const btn of triggerRegistry) {
    if (btn === target || btn.contains(target)) {
      return true;
    }
  }
  return false;
}

interface InboxBellButtonProps {
  variant: 'desktop' | 'mobile';
}

export const InboxBellButton: React.FC<InboxBellButtonProps> = ({ variant }) => {
  const unreadMessagesCount = useFaeQuestStore((s) => s.unreadMessagesCount);
  const isUserInboxOpen = useFaeQuestStore((s) => s.isUserInboxOpen);
  const setUserInboxOpen = useFaeQuestStore((s) => s.setUserInboxOpen);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const prevUnreadRef = useRef<number>(unreadMessagesCount);
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    triggerRegistry.add(el);
    return () => {
      triggerRegistry.delete(el);
    };
  }, []);

  // Kích hoạt lắc chuông & nảy badge khi có thư mới / unread tăng lên
  useEffect(() => {
    if (unreadMessagesCount > prevUnreadRef.current) {
      setIsRinging(false);
      requestAnimationFrame(() => {
        setIsRinging(true);
      });
      const timer = window.setTimeout(() => setIsRinging(false), 950);
      prevUnreadRef.current = unreadMessagesCount;
      return () => window.clearTimeout(timer);
    }
    prevUnreadRef.current = unreadMessagesCount;
  }, [unreadMessagesCount]);

  const sizeClass =
    variant === 'desktop'
      ? 'hidden md:inline-flex w-10 h-10 rounded-full shrink-0'
      : 'w-8 h-8 rounded-xl shrink-0';

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={() => setUserInboxOpen(!isUserInboxOpen)}
      aria-expanded={isUserInboxOpen}
      aria-haspopup="dialog"
      aria-label={
        unreadMessagesCount > 0
          ? `Hộp Thư Thợ Săn (${unreadMessagesCount} thư chưa đọc)`
          : 'Mở Hộp Thư Thợ Săn'
      }
      title={
        unreadMessagesCount > 0 ? `Hộp Thư (${unreadMessagesCount} chưa đọc)` : 'Hộp Thư Thợ Săn'
      }
      className={`u074-bell ${sizeClass} ${isUserInboxOpen ? 'is-open' : ''} ${
        isRinging ? 'is-ringing' : ''
      }`}
    >
      <Mail className={`u074-bell-ic ${variant === 'desktop' ? 'w-4 h-4' : 'w-4 h-4'}`} />
      <span
        className={`u074-badge ${unreadMessagesCount <= 0 ? 'zero' : ''} ${
          isRinging ? 'is-bumping' : ''
        }`}
        aria-hidden={unreadMessagesCount <= 0}
      >
        {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
      </span>
    </button>
  );
};
