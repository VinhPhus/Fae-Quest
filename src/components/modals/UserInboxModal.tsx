import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  ChevronDown,
  Inbox,
  CheckCheck,
  Sparkles,
  Coins,
  Star,
  Trash2,
  Gift,
  AlertTriangle,
  ScrollText,
  Clock,
  Loader2,
} from 'lucide-react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { UserMessage } from '../../types';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { getVisibleInboxAnchor, isInboxTriggerElement } from '../layout/InboxBellButton';
import './InboxPopover.css';

type MailFilterTab = 'all' | 'warning' | 'notice' | 'gift';

const TAB_ITEMS: Array<{ id: MailFilterTab; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'warning', label: 'Cảnh báo' },
  { id: 'notice', label: 'Thông báo' },
  { id: 'gift', label: 'Quà tặng' },
];

export const UserInboxModal: React.FC = () => {
  const {
    isUserInboxOpen,
    setUserInboxOpen,
    userMessages,
    unreadMessagesCount,
    markMessageAsRead,
    markAllMessagesAsRead,
    claimMailReward,
    deleteUserMessage,
    clearClaimedMessages,
  } = useFaeQuestStore();

  const [activeTab, setActiveTab] = useState<MailFilterTab>('all');
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [leavingIds, setLeavingIds] = useState<Record<string, boolean>>({});
  const [enteringIds, setEnteringIds] = useState<Record<string, boolean>>({});
  const [dominoReadIds, setDominoReadIds] = useState<Record<string, boolean>>({});
  const [isMarkingAllDomino, setIsMarkingAllDomino] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  // Điều khiển vòng đời mở/đóng Popover mượt (#074)
  const [rendered, setRendered] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 640 : true
  );
  const [popoverCoords, setPopoverCoords] = useState<{
    top: number;
    right: number;
    arrowRight: number;
  }>({ top: 68, right: 20, arrowRight: 28 });

  const panelRef = useRef<HTMLDivElement | null>(null);
  const returnFocusElRef = useRef<HTMLButtonElement | null>(null);
  const shouldReturnFocusRef = useRef<boolean>(false);
  const closeTimerRef = useRef<number | null>(null);
  const dominoTimersRef = useRef<number[]>([]);
  const knownIdsRef = useRef<Set<string>>(new Set());

  const updateViewportAndCoords = useCallback(() => {
    if (typeof window === 'undefined') return;
    const isDesk = window.innerWidth >= 640;
    setIsDesktopViewport(isDesk);
    if (!isDesk) return;

    const anchor = getVisibleInboxAnchor();
    if (!anchor) {
      setPopoverCoords({ top: 68, right: 20, arrowRight: 28 });
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const popWidth = Math.min(430, window.innerWidth - 24);
    const desiredRight = Math.max(12, window.innerWidth - rect.right - 14);
    const clampedRight = Math.min(desiredRight, window.innerWidth - popWidth - 12);
    const panelRight = window.innerWidth - clampedRight;
    const anchorCenterX = rect.left + rect.width / 2;
    const arrowRight = Math.max(20, Math.min(popWidth - 20, panelRight - anchorCenterX));
    const top = Math.min(rect.bottom + 12, Math.max(12, window.innerHeight - 260));

    setPopoverCoords({ top, right: clampedRight, arrowRight });
  }, []);

  // Mở / đóng Popover giữ animation thu gọn (#074)
  useEffect(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (isUserInboxOpen) {
      returnFocusElRef.current = getVisibleInboxAnchor();
      shouldReturnFocusRef.current = false;
      knownIdsRef.current = new Set(userMessages.map((m) => m.id));
      setEnteringIds({});
      setLeavingIds({});
      setDominoReadIds({});
      setIsClosing(false);
      setRendered(true);
    } else if (rendered) {
      setIsClosing(true);
      const delay = isDesktopViewport ? 300 : 240;
      closeTimerRef.current = window.setTimeout(() => {
        setRendered(false);
        setIsClosing(false);
        if (shouldReturnFocusRef.current) {
          shouldReturnFocusRef.current = false;
          returnFocusElRef.current?.focus({ preventScroll: true });
        }
      }, delay);
    }
  }, [isUserInboxOpen, isDesktopViewport, rendered]);

  // Tính lại tọa độ neo mỗi khi mở hoặc resize màn hình
  useLayoutEffect(() => {
    if (!rendered) return;
    updateViewportAndCoords();
    window.addEventListener('resize', updateViewportAndCoords);
    return () => window.removeEventListener('resize', updateViewportAndCoords);
  }, [rendered, updateViewportAndCoords]);

  // Bắt đầu theo dõi thư mới từ Realtime khi Popover đang mở -> hiệu ứng chèn đỉnh danh sách
  useEffect(() => {
    if (!rendered || !isUserInboxOpen) return;
    const incoming: string[] = [];
    userMessages.forEach((m) => {
      if (!knownIdsRef.current.has(m.id)) {
        knownIdsRef.current.add(m.id);
        incoming.push(m.id);
      }
    });
    if (incoming.length > 0) {
      setEnteringIds((prev) => {
        const next = { ...prev };
        incoming.forEach((id) => {
          next[id] = true;
        });
        return next;
      });
      const timer = window.setTimeout(() => {
        setEnteringIds((prev) => {
          const next = { ...prev };
          incoming.forEach((id) => delete next[id]);
          return next;
        });
      }, 500);
      return () => window.clearTimeout(timer);
    }
  }, [userMessages, rendered, isUserInboxOpen]);

  // Dọn dẹp timers domino khi unmount
  useEffect(() => {
    return () => {
      dominoTimersRef.current.forEach((t) => window.clearTimeout(t));
      dominoTimersRef.current = [];
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // Đóng khi nhấn Esc (trả focus về nút Hộp Thư) hoặc bấm ra ngoài
  useEffect(() => {
    if (!isUserInboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        shouldReturnFocusRef.current = true;
        setUserInboxOpen(false);
      }
    };

    const handlePointerOutside = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        !isInboxTriggerElement(target)
      ) {
        setUserInboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerOutside);
    };
  }, [isUserInboxOpen, setUserInboxOpen]);

  // Chỉ khóa cuộn thân trang trên Mobile (< 640px) khi mở hộp thoại
  useBodyScrollLock(rendered && !isDesktopViewport);

  const filteredMessages = useMemo(
    () =>
      userMessages.filter((msg) => {
        if (activeTab === 'all') return true;
        return msg.message_type === activeTab;
      }),
    [userMessages, activeTab]
  );

  // Số lượng chưa đọc / chưa nhận quà nhỏ trên mỗi tab lọc
  const tabCounts = useMemo(() => {
    const counts: Record<MailFilterTab, number> = {
      all: 0,
      warning: 0,
      notice: 0,
      gift: 0,
    };
    userMessages.forEach((m) => {
      const isUnread = !m.is_read && !dominoReadIds[m.id];
      const hasUnclaimedGift =
        m.message_type === 'gift' &&
        !m.is_claimed &&
        Boolean(
          (m.reward_exp && m.reward_exp > 0) ||
            (m.reward_coins && m.reward_coins > 0) ||
            (m.reward_stars && m.reward_stars > 0) ||
            (m.reward_items && m.reward_items.length > 0)
        );
      if (isUnread) {
        counts.all += 1;
        if (m.message_type === 'warning') counts.warning += 1;
        else if (m.message_type === 'notice') counts.notice += 1;
      }
      if (isUnread || hasUnclaimedGift) {
        if (m.message_type === 'gift') counts.gift += 1;
      }
    });
    return counts;
  }, [userMessages, dominoReadIds]);

  const handleCloseWithFocus = () => {
    shouldReturnFocusRef.current = true;
    setUserInboxOpen(false);
  };

  // Hiệu ứng Đọc tất cả kiểu domino lệch nhịp 100ms (#074)
  const handleDominoMarkAllRead = async () => {
    if (unreadMessagesCount <= 0 || isMarkingAllDomino) return;

    const visibleUnread = filteredMessages.filter((m) => !m.is_read);
    const targets = visibleUnread.length > 0 ? visibleUnread : userMessages.filter((m) => !m.is_read);

    const reducedMotion =
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

    if (reducedMotion || targets.length === 0) {
      await markAllMessagesAsRead();
      return;
    }

    setIsMarkingAllDomino(true);
    dominoTimersRef.current.forEach((t) => window.clearTimeout(t));
    dominoTimersRef.current = [];

    targets.forEach((msg, index) => {
      const tId = window.setTimeout(() => {
        setDominoReadIds((prev) => ({ ...prev, [msg.id]: true }));
      }, index * 100);
      dominoTimersRef.current.push(tId);
    });

    const finalizeTimer = window.setTimeout(async () => {
      await markAllMessagesAsRead();
      setDominoReadIds({});
      setIsMarkingAllDomino(false);
    }, targets.length * 100 + 80);
    dominoTimersRef.current.push(finalizeTimer);
  };

  const handleClearClaimed = async () => {
    if (isClearing) return;
    setIsClearing(true);
    try {
      await clearClaimedMessages();
    } finally {
      setIsClearing(false);
    }
  };

  const handleClaim = async (e: React.MouseEvent, msgId: string) => {
    e.stopPropagation();
    if (claimingId === msgId) return;
    setClaimingId(msgId);
    try {
      await claimMailReward(msgId);
    } finally {
      setClaimingId(null);
    }
  };

  // Hiệu ứng thu gọn 1fr -> 0fr trước khi xóa dòng thư khỏi Supabase
  const handleDeleteRow = async (e: React.MouseEvent, msgId: string) => {
    e.stopPropagation();
    if (leavingIds[msgId]) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

    if (reducedMotion) {
      await deleteUserMessage(msgId);
      return;
    }

    setLeavingIds((prev) => ({ ...prev, [msgId]: true }));
    window.setTimeout(async () => {
      const deleted = await deleteUserMessage(msgId);
      if (!deleted) {
        setLeavingIds((prev) => {
          const next = { ...prev };
          delete next[msgId];
          return next;
        });
      }
    }, 260);
  };

  const renderMessageAvatar = (type: UserMessage['message_type']) => {
    if (type === 'warning') {
      return (
        <div className="u074-av is-warning" aria-hidden="true">
          <AlertTriangle className="w-4 h-4" />
          <span className="u074-av-sub">⚠️</span>
        </div>
      );
    }
    if (type === 'gift') {
      return (
        <div className="u074-av is-gift" aria-hidden="true">
          <Gift className="w-4 h-4" />
          <span className="u074-av-sub">🎁</span>
        </div>
      );
    }
    return (
      <div className="u074-av is-notice" aria-hidden="true">
        <ScrollText className="w-4 h-4" />
        <span className="u074-av-sub">📜</span>
      </div>
    );
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return `${time} • ${date}`;
  };

  if (!rendered || typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Lớp nền mờ chỉ dùng trên Mobile (< 640px) để dễ chạm đóng mà không che mờ Desktop */}
      {!isDesktopViewport && (
        <div
          onClick={handleCloseWithFocus}
          className={`fixed inset-0 z-[104] bg-[#06141B]/78 backdrop-blur-md transition-opacity duration-200 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}

      {/* Khung Popover bung lò xo (#074) */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={!isDesktopViewport}
        aria-label="Hộp Thư Thợ Săn"
        className={`u074-pan ${isClosing ? 'is-closing' : 'is-open'}`}
        style={
          isDesktopViewport
            ? ({
                top: `${popoverCoords.top}px`,
                right: `${popoverCoords.right}px`,
                '--u074-arrow-right': `${popoverCoords.arrowRight}px`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {/* Đầu khung Hộp Thư */}
        <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-white/10 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[#F4F0E8] font-rpg tracking-wide truncate">
                Hộp Thư Thợ Săn
              </h2>
              {unreadMessagesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#FF5A6E]/20 border border-[#FF5A6E]/45 text-[10px] font-extrabold text-[#FF99A6] tabular-nums shrink-0">
                  {unreadMessagesCount} mới
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#9BA8AB] mt-0.5 truncate">
              Thông điệp, quà tặng và chỉ thị từ Ban Quản Trị
            </p>
          </div>

          <button
            type="button"
            onClick={handleCloseWithFocus}
            aria-label="Đóng Hộp Thư"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-[#9BA8AB] hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thanh 4 Tab Lọc & Thanh Tác Vụ Nhanh */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-white/10 space-y-2 shrink-0">
          <div
            role="tablist"
            aria-label="Phân loại thư"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5"
          >
            {TAB_ITEMS.map((tab) => {
              const isSelected = activeTab === tab.id;
              const badgeCount = tabCounts[tab.id];
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(tab.id)}
                  className="u074-tab"
                >
                  <span>{tab.label}</span>
                  {badgeCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-black tabular-nums ${
                        isSelected
                          ? 'bg-[#06141B]/20 text-[#06141B]'
                          : 'bg-[#FF5A6E]/25 text-[#FF99A6]'
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={unreadMessagesCount <= 0 || isMarkingAllDomino}
              onClick={handleDominoMarkAllRead}
              className="u074-all"
              title="Đánh dấu tất cả thư là đã đọc"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đọc tất cả</span>
            </button>

            <button
              type="button"
              disabled={isClearing}
              onClick={handleClearClaimed}
              className="u074-all hover:!bg-rose-500/15 hover:!border-rose-500/40 hover:!text-rose-300"
              title="Xóa sạch các thư đã đọc hoặc đã nhận quà"
            >
              {isClearing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Dọn thư đã nhận</span>
            </button>
          </div>
        </div>

        {/* Danh sách thư cuộn mượt */}
        <div className="u074-scroll flex-1 p-3 sm:p-4 space-y-2.5 min-h-[160px]">
          {filteredMessages.length === 0 ? (
            <div className="py-10 px-4 flex flex-col items-center justify-center text-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-[#06141B]/80 border border-white/10 flex items-center justify-center text-[#9BA8AB] shadow-inner">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#CCD0CF]">Hộp thư hiện đang trống</p>
              <span className="text-[11px] text-[#9BA8AB]/70 max-w-[260px]">
                Mọi thông điệp, quà tặng và chỉ thị mới sẽ xuất hiện tại đây
              </span>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isExpanded = expandedMessageId === msg.id;
              const effectivelyRead = msg.is_read || Boolean(dominoReadIds[msg.id]);
              const isEntering = Boolean(enteringIds[msg.id]);
              const isLeaving = Boolean(leavingIds[msg.id]);

              const hasRewards = Boolean(
                (msg.reward_exp && msg.reward_exp > 0) ||
                  (msg.reward_coins && msg.reward_coins > 0) ||
                  (msg.reward_stars && msg.reward_stars > 0) ||
                  (msg.reward_items && msg.reward_items.length > 0)
              );
              const canDelete = msg.is_claimed || !hasRewards;

              const dotToneClass =
                msg.message_type === 'warning'
                  ? 'is-warning'
                  : msg.message_type === 'gift'
                  ? 'is-gift'
                  : 'is-notice';

              return (
                <div
                  key={msg.id}
                  className={`u074-row-shell ${isEntering ? 'is-entering' : ''} ${
                    isLeaving ? 'is-leaving' : ''
                  }`}
                >
                  <div className="u074-row-inner">
                    <div
                      className={`rounded-2xl border transition-colors duration-200 overflow-hidden ${
                        !effectivelyRead
                          ? 'bg-[#06141B]/90 border-white/15 shadow-md'
                          : 'bg-[#06141B]/45 border-white/[0.07]'
                      }`}
                    >
                      {/* Hàng tiêu đề thư bấm để mở rộng Accordion & đánh dấu đã đọc */}
                      <div
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onClick={() => {
                          if (!msg.is_read) {
                            markMessageAsRead(msg.id);
                          }
                          setExpandedMessageId(isExpanded ? null : msg.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (!msg.is_read) {
                              markMessageAsRead(msg.id);
                            }
                            setExpandedMessageId(isExpanded ? null : msg.id);
                          }
                        }}
                        className="p-3 sm:p-3.5 flex items-start gap-3 cursor-pointer hover:bg-white/[0.04] transition-colors outline-none"
                      >
                        {/* Avatar tròn phân loại góc */}
                        {renderMessageAvatar(msg.message_type)}

                        {/* Tiêu đề, tóm tắt, thời gian */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className={`text-[13px] leading-snug line-clamp-2 transition-colors duration-300 ${
                                !effectivelyRead
                                  ? 'font-extrabold text-white'
                                  : 'font-semibold text-[#9BA8AB]'
                              }`}
                            >
                              {msg.subject}
                            </h4>

                            <div className="flex items-center gap-2 shrink-0 pt-1">
                              {/* Chấm chưa đọc phát sáng thu mượt về scale(0) */}
                              <span
                                className={`u074-dot ${dotToneClass} ${
                                  effectivelyRead ? 'is-read' : ''
                                }`}
                              />
                              <ChevronDown
                                className={`w-3.5 h-3.5 text-[#9BA8AB] transition-transform duration-300 ${
                                  isExpanded ? 'rotate-180 text-white' : ''
                                }`}
                              />
                            </div>
                          </div>

                          {!isExpanded && (
                            <p className="text-[11.5px] text-[#9BA8AB]/85 line-clamp-1 mt-0.5">
                              {msg.content}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10.5px] text-[#9BA8AB]/75">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimestamp(msg.created_at)}</span>
                            </span>

                            {hasRewards && (
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9.5px] font-bold border ${
                                  msg.is_claimed
                                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300/80'
                                    : 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                                }`}
                              >
                                <Gift className="w-2.5 h-2.5" />
                                <span>{msg.is_claimed ? 'Đã nhận quà' : 'Có quà tặng'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Vùng Accordion chi tiết nội dung & nhận quà */}
                      <div className={`u074-acc ${isExpanded ? 'is-open' : ''}`}>
                        <div className="u074-acc-inner">
                          <div className="px-3.5 pb-3.5 pt-2.5 border-t border-white/[0.08] bg-[#11212D]/45 space-y-3">
                            <p className="text-xs text-[#CCD0CF] leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>

                            {/* Hộp Phần Thưởng Đính Kèm */}
                            {hasRewards && (
                              <div className="p-3 rounded-xl bg-[#06141B]/90 border border-white/10 space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-extrabold text-amber-300 inline-flex items-center gap-1.5">
                                    <Gift className="w-3.5 h-3.5" />
                                    <span>Phần Thưởng Đính Kèm</span>
                                  </span>
                                  {msg.is_claimed && (
                                    <span className="text-[10.5px] font-bold text-emerald-400 inline-flex items-center gap-1">
                                      <CheckCheck className="w-3.5 h-3.5" />
                                      <span>Đã nhận</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  {Boolean(msg.reward_exp && msg.reward_exp > 0) && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-[11px] font-bold text-cyan-300">
                                      <Sparkles className="w-3 h-3 text-cyan-400" />
                                      <span>+{msg.reward_exp} EXP</span>
                                    </span>
                                  )}

                                  {Boolean(msg.reward_coins && msg.reward_coins > 0) && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-950/50 border border-amber-500/30 text-[11px] font-bold text-amber-300">
                                      <Coins className="w-3 h-3 text-amber-400" />
                                      <span>+{msg.reward_coins} Xu</span>
                                    </span>
                                  )}

                                  {Boolean(msg.reward_stars && msg.reward_stars > 0) && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yellow-950/50 border border-yellow-500/30 text-[11px] font-bold text-yellow-300">
                                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                      <span>+{msg.reward_stars} Sao</span>
                                    </span>
                                  )}

                                  {msg.reward_items?.map((item) => (
                                    <span
                                      key={item.id}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#11212D] border border-white/15 text-[11px] font-semibold text-[#CCD0CF]"
                                    >
                                      <span>{item.icon}</span>
                                      <span>{item.name}</span>
                                      <span className="text-amber-300 font-bold">x{item.count}</span>
                                    </span>
                                  ))}
                                </div>

                                {!msg.is_claimed && (
                                  <button
                                    type="button"
                                    disabled={claimingId === msg.id}
                                    onClick={(e) => handleClaim(e, msg.id)}
                                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#06141B] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition cursor-pointer disabled:opacity-60"
                                  >
                                    {claimingId === msg.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-3.5 h-3.5" />
                                    )}
                                    <span>{claimingId === msg.id ? 'Đang nhận quà...' : 'Nhận Quà'}</span>
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Footer dòng thư: Đánh dấu đã đọc / Xóa thư lẻ */}
                            <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-[#9BA8AB]">
                              {!msg.is_read ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markMessageAsRead(msg.id);
                                  }}
                                  className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Đánh dấu đã đọc</span>
                                </button>
                              ) : (
                                <span className="text-[10.5px] text-[#9BA8AB]/60">Đã xem</span>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteRow(e, msg.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/40 text-[#9BA8AB] hover:text-rose-300 transition cursor-pointer"
                                  title="Xóa thư này"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Xóa thư</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>,
    document.body
  );
};
