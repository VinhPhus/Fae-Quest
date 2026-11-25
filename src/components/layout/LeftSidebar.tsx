import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { useChillyAudioStore } from '../../store/useChillyAudioStore';
import { ActiveTab } from '../../types';
import { CoinIcon } from '../ui/CoinIcon';
import { StreakFlameCard } from '../streak/StreakFlameCard';
import { InboxBellButton } from './InboxBellButton';
import './NavigationRail.css';
import {
  CheckSquare,
  ShoppingBag,
  Trophy,
  BookOpen,
  Flame,
  Settings,
  Scroll,
  ChevronLeft,
  ShieldAlert,
  User,
  Award,
  HeartPulse,
  LogOut,
  X,
} from 'lucide-react';

const RAIL_STORAGE_KEY = 'faequest_sidebar_rail';

export const LeftSidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    tasks,
    inventory,
    systemQuests,
    coins,
    streakDays,
    playerName,
    avatarUrl,
    setSettingsOpen,
    setOathOpen,
    isSidebarCollapsed,
    setSidebarCollapsed,
    userRole,
    unreadAnnouncementsCount,
    isFocusModalOpen,
    activeFocusTaskId,
    signOut,
  } = useFaeQuestStore();

  const isChillyFullscreen = useChillyAudioStore((s) => s.isChillyFullscreen);

  // Khởi tạo trạng thái thu gọn thanh bên từ localStorage
  const [isRail, setIsRail] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(RAIL_STORAGE_KEY);
      if (saved === 'true') return true;
      if (saved === 'false') return false;
    }
    return isSidebarCollapsed;
  });

  // Đồng bộ vào store chung khi mount
  useEffect(() => {
    setSidebarCollapsed(isRail);
  }, [isRail, setSidebarCollapsed]);

  const handleToggleRail = () => {
    const next = !isRail;
    setIsRail(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(RAIL_STORAGE_KEY, String(next));
    }
    setSidebarCollapsed(next);
  };

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const now = Date.now();
  const validUnusedInventoryCount = inventory.filter(
    (i) => !i.used && (!i.expiresAt || i.expiresAt > now)
  ).length;

  const [todayStr, setTodayStr] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  });

  useEffect(() => {
    const updateDate = () => {
      const d = new Date();
      setTodayStr(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`
      );
    };
    const timer = setInterval(updateDate, 10000);
    return () => clearInterval(timer);
  }, []);

  const actionableSystemQuestsCount = (systemQuests || []).filter((q) => {
    if (
      q.type === 'streak_counter' &&
      !q.isCompleted &&
      q.lastCheckInDate !== todayStr &&
      q.lastResetDate !== todayStr
    ) {
      return true;
    }
    if (q.isCompleted && !q.isRewardClaimed) {
      return true;
    }
    return false;
  }).length;

  const menuItems: {
    id: ActiveTab;
    label: string;
    mobileLabel: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: 'quests',
      label: 'Nhiệm Vụ',
      mobileLabel: 'Nhiệm Vụ',
      icon: <CheckSquare />,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'leaderboard',
      label: 'Đấu Trường',
      mobileLabel: 'Đấu Trường',
      icon: <Trophy />,
      badge: unreadAnnouncementsCount > 0 ? unreadAnnouncementsCount : undefined,
    },
    {
      id: 'shop',
      label: 'Cửa Hàng & Túi Đồ',
      mobileLabel: 'Cửa Hàng',
      icon: <ShoppingBag />,
      badge: validUnusedInventoryCount > 0 ? validUnusedInventoryCount : undefined,
    },
    {
      id: 'chilly-healing',
      label: 'Chilly Healing',
      mobileLabel: 'Healing',
      icon: <HeartPulse />,
    },
    {
      id: 'chronicles',
      label: 'Nhật Ký',
      mobileLabel: 'Nhật Ký',
      icon: <BookOpen />,
    },
    {
      id: 'system-quests',
      label: 'Thành Tựu',
      mobileLabel: 'Thành Tựu',
      icon: <Award />,
      badge: actionableSystemQuestsCount > 0 ? actionableSystemQuestsCount : undefined,
    },
    {
      id: 'profile',
      label: 'Hồ Sơ',
      mobileLabel: 'Hồ Sơ',
      icon: <User />,
    },
    ...(userRole === 'admin'
      ? [
          {
            id: 'admin' as ActiveTab,
            label: 'Quản Trị Hệ Thống',
            mobileLabel: 'Quản Trị',
            icon: <ShieldAlert className="text-amber-300" />,
          },
        ]
      : []),
  ];

  // Các tab hiển thị trên thanh điều hướng đáy điện thoại
  const mobileBottomMenuItems = menuItems.filter(
    (item) => item.id !== 'system-quests' && item.id !== 'admin'
  );

  // ================= ĐO VỊ TRÍ VIÊN THUỐC DESKTOP (THEO TRỤC Y) =================
  const desktopNavRef = useRef<HTMLElement | null>(null);
  const desktopBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [desktopPillY, setDesktopPillY] = useState<number>(0);
  const [desktopPillVisible, setDesktopPillVisible] = useState<boolean>(false);
  const [desktopPillNoTrans, setDesktopPillNoTrans] = useState<boolean>(true);
  const desktopMountedRef = useRef<boolean>(false);

  useLayoutEffect(() => {
    const activeIdx = menuItems.findIndex((m) => m.id === activeTab);
    const activeEl = desktopBtnRefs.current[activeIdx];
    if (activeEl) {
      setDesktopPillY(activeEl.offsetTop);
      setDesktopPillVisible(true);
    } else {
      setDesktopPillVisible(false);
    }

    if (!desktopMountedRef.current) {
      desktopMountedRef.current = true;
      const raf = requestAnimationFrame(() => {
        setDesktopPillNoTrans(false);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [activeTab, isRail, menuItems.length]);

  useEffect(() => {
    const navEl = desktopNavRef.current;
    if (!navEl || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const activeIdx = menuItems.findIndex((m) => m.id === activeTab);
      const activeEl = desktopBtnRefs.current[activeIdx];
      if (activeEl) {
        setDesktopPillY(activeEl.offsetTop);
      }
    });
    ro.observe(navEl);
    return () => ro.disconnect();
  }, [activeTab, menuItems.length]);

  // Hỗ trợ di chuyển bàn phím ArrowUp / ArrowDown trên Desktop
  const handleDesktopNavKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    const buttons = desktopBtnRefs.current.filter(Boolean) as HTMLButtonElement[];
    if (buttons.length === 0) return;
    const currentIdx = buttons.findIndex((btn) => btn === document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % buttons.length;
      buttons[nextIdx]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx =
        currentIdx === -1 ? buttons.length - 1 : (currentIdx - 1 + buttons.length) % buttons.length;
      buttons[prevIdx]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      buttons[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      buttons[buttons.length - 1]?.focus();
    }
  };

  // ================= ĐO VỊ TRÍ VIÊN THUỐC MOBILE (THEO TRỤC X) =================
  const mobileDockRef = useRef<HTMLDivElement | null>(null);
  const mobileBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [mobilePillPos, setMobilePillPos] = useState<{ x: number; w: number; visible: boolean }>({
    x: 0,
    w: 0,
    visible: false,
  });
  const [mobilePillNoTrans, setMobilePillNoTrans] = useState<boolean>(true);
  const mobileMountedRef = useRef<boolean>(false);

  useLayoutEffect(() => {
    const activeIdx = mobileBottomMenuItems.findIndex((m) => m.id === activeTab);
    const activeEl = mobileBtnRefs.current[activeIdx];
    if (activeEl) {
      setMobilePillPos({
        x: activeEl.offsetLeft,
        w: activeEl.offsetWidth,
        visible: true,
      });
    } else {
      setMobilePillPos((prev) => ({ ...prev, visible: false }));
    }

    if (!mobileMountedRef.current) {
      mobileMountedRef.current = true;
      const raf = requestAnimationFrame(() => {
        setMobilePillNoTrans(false);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [activeTab, mobileBottomMenuItems.length]);

  useEffect(() => {
    const dockEl = mobileDockRef.current;
    if (!dockEl || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const activeIdx = mobileBottomMenuItems.findIndex((m) => m.id === activeTab);
      const activeEl = mobileBtnRefs.current[activeIdx];
      if (activeEl) {
        setMobilePillPos({
          x: activeEl.offsetLeft,
          w: activeEl.offsetWidth,
          visible: true,
        });
      }
    });
    ro.observe(dockEl);
    return () => ro.disconnect();
  }, [activeTab, mobileBottomMenuItems.length]);

  const [desktopStreakOpen, setDesktopStreakOpen] = useState<boolean>(false);
  const [mobileStreakOpen, setMobileStreakOpen] = useState<boolean>(false);
  const desktopStreakRef = useRef<HTMLDivElement | null>(null);
  const desktopStatRowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!desktopStreakOpen && !mobileStreakOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDesktopStreakOpen(false);
        setMobileStreakOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (!desktopStreakOpen) return;
      const target = e.target as Node;
      if (
        desktopStreakRef.current &&
        !desktopStreakRef.current.contains(target) &&
        desktopStatRowRef.current &&
        !desktopStatRowRef.current.contains(target)
      ) {
        setDesktopStreakOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [desktopStreakOpen, mobileStreakOpen]);

  // Ẩn thanh điều hướng đáy khi đang ở toàn màn hình Chilly Healing hoặc đang tập trung
  const shouldHideMobileDock =
    isChillyFullscreen || (isFocusModalOpen && Boolean(activeFocusTaskId));

  const playerInitial = (playerName?.trim()?.[0] || 'T').toUpperCase();

  return (
    <>
      {/* ================= DESKTOP FLOATING SIDEBAR (>= 768px) ================= */}
      <aside
        aria-label="Thanh điều hướng chính"
        className={`hidden md:flex u417-aside ${isRail ? 'is-rail' : ''}`}
      >
        {/* Nút gạt thu gọn nổi trên cạnh phải */}
        <button
          type="button"
          onClick={handleToggleRail}
          aria-expanded={!isRail}
          aria-label={isRail ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          title={isRail ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          className="u417-tg"
        >
          <ChevronLeft className="u417-tg-ic" />
        </button>

        {/* Đầu thanh điều hướng: Biểu tượng FaeQuest + Nhãn thương hiệu */}
        <div className="u417-hd">
          <div className="u417-logo-slot">
            <div className="u417-logo-box">
              <img
                src="/assets/logo.png"
                alt="FaeQuest"
                className="w-full h-full object-contain [image-rendering:pixelated]"
              />
            </div>
          </div>
          <span className="u417-lb font-rpg font-extrabold text-[15px] tracking-wider text-[#F4F0E8] pl-1">
            FAE<span className="text-[#B7A4FF]">QUEST</span>
          </span>
        </div>

        {/* Chỉ số nhanh: Xu & Chuỗi ngày */}
        <div
          ref={desktopStatRowRef}
          onClick={isRail ? () => setDesktopStreakOpen((prev) => !prev) : undefined}
          role={isRail ? 'button' : undefined}
          tabIndex={isRail ? 0 : undefined}
          onKeyDown={
            isRail
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDesktopStreakOpen((prev) => !prev);
                  }
                }
              : undefined
          }
          className={`u417-stat-row ${isRail ? 'cursor-pointer hover:brightness-110' : ''}`}
          title={isRail ? `${coins} Xu • Chuỗi ${streakDays} ngày (Nhấn để xem ngọn lửa)` : undefined}
        >
          <div className="u417-ic">
            <CoinIcon size="sm" />
          </div>
          <div className="u417-lb flex items-center justify-between flex-1 pr-2 text-xs font-bold">
            <span className="text-[#F4F0E8] tabular-nums">{coins} Xu</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDesktopStreakOpen((prev) => !prev);
              }}
              aria-expanded={desktopStreakOpen}
              aria-label={`Xem Chuỗi Kỷ Luật ${streakDays} ngày`}
              title="Xem Ngọn Lửa Chuỗi Kỷ Luật"
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-amber-300 tabular-nums transition cursor-pointer ${
                desktopStreakOpen
                  ? 'border-amber-400/80 bg-amber-500/25 shadow-[0_0_16px_rgba(255,146,43,0.42)]'
                  : 'border-amber-400/35 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-400/65 shadow-[0_0_12px_rgba(255,146,43,0.2)]'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
              <span>{streakDays}N</span>
            </button>
          </div>
        </div>

        {/* Desktop Popover hiển thị thẻ Ngọn Lửa Chuỗi Kỷ Luật */}
        <AnimatePresence>
          {desktopStreakOpen && (
            <motion.div
              ref={desktopStreakRef}
              initial={{ opacity: 0, x: -10, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="hidden md:block absolute left-[calc(100%+14px)] top-12 z-[95] w-[360px] shadow-[0_28px_60px_rgba(0,0,0,0.85)] rounded-[26px]"
            >
              <StreakFlameCard mode="view" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Danh sách mục điều hướng với Viên thuốc trượt lò xo */}
        <nav
          ref={desktopNavRef}
          onKeyDown={handleDesktopNavKeyDown}
          className="u417-nav"
          aria-label="Danh mục tính năng"
        >
          {/* Viên thuốc nền mục đang chọn */}
          <div
            aria-hidden="true"
            className={`u417-pl ${desktopPillNoTrans ? 'is-no-trans' : ''}`}
            style={
              {
                '--py': `${desktopPillY}px`,
                opacity: desktopPillVisible ? 1 : 0,
              } as React.CSSProperties
            }
          />

          {menuItems.map((item, idx) => {
            const isActive = activeTab === item.id;
            const isHealing = item.id === 'chilly-healing';

            return (
              <button
                key={item.id}
                ref={(el) => {
                  desktopBtnRefs.current[idx] = el;
                }}
                type="button"
                id={
                  item.id === 'profile'
                    ? 'tour-sidebar-profile'
                    : item.id === 'shop'
                    ? 'tour-sidebar-shop'
                    : undefined
                }
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActiveTab(item.id)}
                className={`u417-it ${isActive ? 'is-active' : ''} ${
                  isHealing ? 'is-healing' : ''
                }`}
              >
                <span className="u417-ic">{item.icon}</span>
                <span className="u417-lb flex-1 pr-8">{item.label}</span>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="u417-bd">{item.badge}</span>
                )}

                {/* Tooltip khi đang thu gọn */}
                <span className="u417-tip" role="tooltip">
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 ? ` (${item.badge})` : ''}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Chân thanh điều hướng: Cài Đặt, Hồ sơ nhỏ & Đăng xuất */}
        <div className="u417-ft">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="u417-foot-btn"
          >
            <span className="u417-ic">
              <Settings />
            </span>
            <span className="u417-lb">Cài Đặt</span>
            <span className="u417-tip" role="tooltip">
              Cài Đặt
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="u417-foot-btn"
          >
            <span className="u417-ic">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={playerName}
                  className="w-[26px] h-[26px] rounded-full object-cover ring-1 ring-white/20"
                />
              ) : (
                <span className="w-[26px] h-[26px] rounded-full bg-[#162633] ring-1 ring-white/20 flex items-center justify-center text-[11px] font-extrabold text-[#F4F0E8]">
                  {playerInitial}
                </span>
              )}
            </span>
            <span className="u417-lb flex flex-col leading-tight min-w-0 pr-2">
              <span className="text-[12px] font-bold text-[#F4F0E8] truncate">
                {playerName || 'Thợ Săn'}
              </span>
              <span className="text-[10px] text-white/45 truncate">Tài khoản cá nhân</span>
            </span>
            <span className="u417-tip" role="tooltip">
              {playerName || 'Thợ Săn'} • Hồ Sơ
            </span>
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            className="u417-foot-btn hover:!text-rose-300"
          >
            <span className="u417-ic">
              <LogOut />
            </span>
            <span className="u417-lb">Đăng Xuất</span>
            <span className="u417-tip" role="tooltip">
              Đăng Xuất
            </span>
          </button>
        </div>
      </aside>

      {/* ================= MOBILE BOTTOM FLOATING DOCK (< 768px) ================= */}
      <nav
        aria-label="Điều hướng di động"
        className={`md:hidden u417-dock ${shouldHideMobileDock ? 'is-hidden' : ''}`}
      >
        <div ref={mobileDockRef} className="u417-dock-inner">
          {/* Viên thuốc trượt ngang lò xo */}
          <div
            aria-hidden="true"
            className={`u417-m-pl ${mobilePillNoTrans ? 'is-no-trans' : ''}`}
            style={
              {
                '--mx': `${mobilePillPos.x}px`,
                '--mw': `${mobilePillPos.w}px`,
                opacity: mobilePillPos.visible ? 1 : 0,
              } as React.CSSProperties
            }
          />

          {mobileBottomMenuItems.map((item, idx) => {
            const isActive = activeTab === item.id;
            const isHealing = item.id === 'chilly-healing';

            return (
              <button
                key={item.id}
                ref={(el) => {
                  mobileBtnRefs.current[idx] = el;
                }}
                type="button"
                id={
                  item.id === 'profile'
                    ? 'tour-mobile-profile'
                    : item.id === 'shop'
                    ? 'tour-mobile-shop'
                    : undefined
                }
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActiveTab(item.id)}
                className={`u417-m-it ${isActive ? 'is-active' : ''} ${
                  isHealing ? 'is-healing' : ''
                }`}
              >
                <div className="relative flex items-center justify-center">
                  {item.icon}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="u417-m-bd">{item.badge}</span>
                  )}
                </div>
                <span
                  className={`text-[9.5px] sm:text-[10px] truncate max-w-[58px] px-0.5 leading-tight transition-colors ${
                    isActive
                      ? isHealing
                        ? 'text-[#7EE8C0] font-bold'
                        : 'text-[#F4F0E8] font-bold'
                      : 'text-white/50 font-medium'
                  }`}
                >
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ================= MOBILE TOP HEADER (< 768px) ================= */}
      <header className="md:hidden sticky top-0 z-40 bg-[#06141B]/95 backdrop-blur-md border-b border-white/10 px-3 sm:px-3.5 py-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] flex items-center justify-between gap-1.5">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0D1821] overflow-hidden flex items-center justify-center shadow border border-white/15 shrink-0 p-0.5">
            <img
              src="/assets/logo.png"
              alt="FaeQuest"
              className="w-full h-full object-contain [image-rendering:pixelated]"
            />
          </div>
          <div>
            <h1 className="font-rpg font-extrabold text-xs sm:text-sm tracking-wider text-[#F4F0E8]">
              FAE<span className="text-[#B7A4FF]">QUEST</span>
            </h1>
          </div>
        </div>

        {/* Middle: Coins & Streak */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <div className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg bg-[#0D1821] border border-white/10 text-[11px] sm:text-xs font-bold shadow-sm">
            <CoinIcon size="xs" />
            <span className="text-[#F4F0E8]">{coins}</span>
          </div>

          <button
            type="button"
            onClick={() => setMobileStreakOpen(true)}
            aria-label={`Xem Chuỗi Kỷ Luật ${streakDays} ngày`}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/12 border border-amber-400/45 text-[11px] sm:text-xs font-bold text-amber-300 shadow-[0_0_12px_rgba(255,146,43,0.22)] hover:border-amber-400/75 active:scale-95 transition cursor-pointer"
            title="Xem Chuỗi Kỷ Luật"
          >
            <Flame className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-400 fill-amber-400 shrink-0" />
            <span>{streakDays}N</span>
          </button>
        </div>

        {/* Right: Cụm nút tiện ích (Thành Tựu, Hộp Thư, Khế Ước & Cài Đặt) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('system-quests')}
            className={`p-1.5 rounded-lg border transition shadow-sm relative cursor-pointer ${
              activeTab === 'system-quests'
                ? 'bg-[#162633] border-white/25 text-[#F4F0E8]'
                : 'bg-[#0D1821] border-white/10 text-white/60 hover:text-[#F4F0E8]'
            }`}
            title="Thành Tựu & Danh Hiệu"
          >
            <Award className="w-4 h-4" />
            {actionableSystemQuestsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full text-[8px] font-extrabold bg-[#B7A4FF] text-[#0D1821] shadow-sm">
                {actionableSystemQuestsCount}
              </span>
            )}
          </button>

          <InboxBellButton variant="mobile" />

          <button
            type="button"
            onClick={() => setOathOpen(true)}
            className="p-1.5 rounded-lg bg-[#0D1821] border border-white/10 text-[#F4F0E8] hover:border-white/25 transition shadow-sm cursor-pointer"
            title="Khế Ước Thợ Săn"
          >
            <Scroll className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded-lg bg-[#0D1821] border border-white/10 text-white/75 hover:text-[#F4F0E8] hover:border-white/25 transition shadow-sm cursor-pointer"
            title="Cài Đặt"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Modal hiển thị thẻ Ngọn Lửa Chuỗi Kỷ Luật */}
      <AnimatePresence>
        {mobileStreakOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileStreakOpen(false)}
            className="md:hidden fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#06141B]/82 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết Chuỗi Kỷ Luật"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[360px] flex flex-col items-center gap-3"
            >
              <button
                type="button"
                onClick={() => setMobileStreakOpen(false)}
                aria-label="Đóng thẻ Chuỗi Kỷ Luật"
                className="self-end w-8 h-8 rounded-full bg-[#11212D]/90 border border-white/15 text-[#F4F0E8] flex items-center justify-center shadow-lg active:scale-95 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <StreakFlameCard mode="view" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
