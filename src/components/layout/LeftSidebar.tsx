import React, { useState, useEffect } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { ActiveTab } from '../../types';
import { CoinIcon } from '../ui/CoinIcon';
import {
  CheckSquare,
  ShoppingBag,
  Trophy,
  Backpack,
  BarChart2,
  Flame,
  Settings,
  Scroll,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Mail,
} from 'lucide-react';

export const LeftSidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    tasks,
    inventory,
    systemQuests,
    coins,
    streakDays,
    setSettingsOpen,
    setOathOpen,
    isSidebarCollapsed,
    toggleSidebar,
    userRole,
    unreadMessagesCount,
    setUserInboxOpen,
  } = useFaeQuestStore();

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const now = Date.now();
  const validUnusedInventoryCount = inventory.filter(
    (i) => !i.used && (!i.expiresAt || i.expiresAt > now)
  ).length;

  const [todayStr, setTodayStr] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const updateDate = () => {
      const d = new Date();
      setTodayStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
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

  const menuItems: { id: ActiveTab; label: string; mobileLabel: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'quests',
      label: 'Nhiệm Vụ',
      mobileLabel: 'Nhiệm Vụ',
      icon: <CheckSquare className="w-5 h-5 shrink-0" />,
      badge: pendingCount,
    },
    {
      id: 'system-quests',
      label: 'Thành Tựu',
      mobileLabel: 'Thành Tựu',
      icon: <Scroll className="w-5 h-5 shrink-0" />,
      badge: actionableSystemQuestsCount,
    },
    {
      id: 'shop',
      label: 'Cửa Hàng',
      mobileLabel: 'Cửa Hàng',
      icon: <ShoppingBag className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'leaderboard',
      label: 'Đấu Trường BXH',
      mobileLabel: 'BXH',
      icon: <Trophy className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'inventory',
      label: 'Túi Đồ',
      mobileLabel: 'Túi Đồ',
      icon: <Backpack className="w-5 h-5 shrink-0" />,
      badge: validUnusedInventoryCount,
    },
    {
      id: 'analytics',
      label: 'Thống Kê Năng Suất',
      mobileLabel: 'Thống Kê',
      icon: <BarChart2 className="w-5 h-5 shrink-0" />,
    },
    ...(userRole === 'admin'
      ? [
          {
            id: 'admin' as ActiveTab,
            label: '🛡️ Quản Trị Hệ Thống',
            mobileLabel: 'Admin',
            icon: <ShieldAlert className="w-5 h-5 shrink-0 text-amber-300" />,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* ================= DESKTOP / TABLET SIDEBAR (>= 768px) ================= */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 shrink-0 z-30 bg-[#11212D]/95 backdrop-blur-md border-r border-[#253745] overflow-hidden no-scrollbar transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[width] ${isSidebarCollapsed ? 'w-[76px]' : 'w-[260px]'
          }`}
      >
        {/* 1. Header of Sidebar: Brand & Logo */}
        <div className="px-3.5 py-3 border-b border-[#253745] h-[68px] flex items-center shrink-0 overflow-hidden">
          <div
            className="flex items-center gap-2.5 min-w-0 w-full"
            title={isSidebarCollapsed ? 'FaeQuest RPG Todo V2.0' : undefined}
          >
            {/* Logo Emblem Icon */}
            <div className="w-10 h-10 rounded-xl bg-[#06141B] overflow-hidden flex items-center justify-center shadow-lg border border-[#4A5C6A] shrink-0 relative group">
              <img
                src="/assets/logo.png"
                alt="FaeQuest Logo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
              />
            </div>

            {/* Smooth Fade + Slide Brand Text */}
            <div
              className={`flex flex-col min-w-0 whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${isSidebarCollapsed
                ? 'opacity-0 max-w-0 -translate-x-2 ml-0 pointer-events-none'
                : 'opacity-100 max-w-[170px] translate-x-0 ml-1'
                }`}
            >
              <div className="flex items-center gap-1">
                <h1 className="font-rpg font-bold text-base tracking-wider text-[#CCD0CF] truncate leading-tight">
                  FAE<span className="text-white">QUEST</span>
                </h1>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF] w-fit">
                RPG TODO V2.0
              </span>
            </div>
          </div>
        </div>

        {/* 2. Mini-Status: Coins & Streak */}
        <div className="px-3.5 py-2.5 border-b border-[#253745] h-[56px] flex items-center shrink-0 overflow-hidden">
          <div
            className="w-full flex items-center justify-between rounded-xl bg-[#06141B] border border-[#253745] px-2.5 py-1.5 text-xs shadow-inner"
            title={isSidebarCollapsed ? `${coins} Xu • Chuỗi ${streakDays} ngày` : undefined}
          >
            {/* Coin item */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-6 h-6 flex items-center justify-center">
                <CoinIcon size="sm" />
              </div>
              <span
                className={`text-[#CCD0CF] font-bold whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${isSidebarCollapsed
                  ? 'opacity-0 max-w-0 -translate-x-1 ml-0 pointer-events-none'
                  : 'opacity-100 max-w-[80px] translate-x-0'
                  }`}
              >
                {coins} Xu
              </span>
            </div>

            {/* Divider & Streak */}
            <div
              className={`flex items-center gap-2 whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${isSidebarCollapsed
                ? 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'
                : 'opacity-100 max-w-[120px] translate-x-0'
                }`}
            >
              <span className="text-[#4A5C6A]">•</span>
              <div className="flex items-center gap-1 text-amber-300 font-bold">
                <Flame className="w-3.5 h-3.5 shrink-0 text-amber-400 fill-amber-400" />
                <span>Chuỗi {streakDays}N</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Main Navigation Menu */}
        <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden no-scrollbar">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={
                  isSidebarCollapsed
                    ? item.badge && item.badge > 0
                      ? `${item.label} (${item.badge})`
                      : item.label
                    : undefined
                }
                className={`w-full flex items-center px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 relative ${isActive
                  ? 'bg-[#253745] text-[#CCD0CF] shadow-md border border-[#4A5C6A] scale-[1.01]'
                  : 'text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#253745]/50 border border-transparent'
                  }`}
              >
                {/* Fixed Icon Container */}
                <div className="w-6 h-6 shrink-0 flex items-center justify-center relative">
                  {item.icon}
                  {/* Collapsed Notification Dot */}
                  {isSidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#CCD0CF] border border-[#06141B] animate-pulse" />
                  )}
                </div>

                {/* Smooth Fade + Slide + Max-Width Text Container */}
                <div
                  className={`flex items-center justify-between flex-1 min-w-0 whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${isSidebarCollapsed
                    ? 'opacity-0 max-w-0 -translate-x-2 ml-0 pointer-events-none'
                    : 'opacity-100 max-w-[180px] translate-x-0 ml-3'
                    }`}
                >
                  <span className="truncate text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-extrabold shrink-0 ${isActive
                        ? 'bg-[#CCD0CF] text-[#06141B]'
                        : 'bg-[#253745] text-[#CCD0CF] border border-[#4A5C6A]'
                        }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* 4. Footer of Sidebar: Settings & Collapse Toggle pushed to bottom */}
        <div className="mt-auto p-3.5 border-t border-[#253745] space-y-2 bg-[#06141B]/95 shrink-0 overflow-hidden">
          {/* Settings Button */}
          <button
            onClick={() => setSettingsOpen(true)}
            title={isSidebarCollapsed ? 'Cài Đặt Hệ Thống' : undefined}
            className="w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-[#CCD0CF] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A]"
          >
            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
              <Settings className="w-4 h-4 text-[#CCD0CF]" />
            </div>
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${isSidebarCollapsed
                ? 'opacity-0 max-w-0 -translate-x-2 ml-0 pointer-events-none'
                : 'opacity-100 max-w-[180px] translate-x-0 ml-3'
                }`}
            >
              Cài Đặt
            </span>
          </button>

          {/* Collapse/Expand Sidebar Button */}
          <button
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? 'Mở rộng Sidebar' : 'Thu gọn Sidebar'}
            className="w-full flex items-center px-3.5 py-2.5 rounded-xl text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#253745] border border-[#253745] transition"
          >
            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-[#CCD0CF]" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-[#CCD0CF]" />
              )}
            </div>
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-200 ease-out text-xs font-medium ${isSidebarCollapsed
                ? 'opacity-0 max-w-0 -translate-x-2 ml-0 pointer-events-none'
                : 'opacity-100 max-w-[180px] translate-x-0 ml-3'
                }`}
            >
              Thu gọn Sidebar
            </span>
          </button>
        </div>
      </aside>

      {/* ================= MOBILE BOTTOM NAVIGATION (< 768px) ================= */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-[#11212D]/95 backdrop-blur-lg border-t border-[#253745] px-2 py-1 flex items-center justify-around shadow-2xl"
      >
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-1.5 rounded-xl transition relative flex-1 min-w-0 ${
                isActive
                  ? 'text-[#CCD0CF] font-bold'
                  : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-[#CCD0CF] text-[#06141B] shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] truncate max-w-[56px] leading-tight ${isActive ? 'text-[#CCD0CF] font-bold' : 'text-[#9BA8AB]'}`}>
                {item.mobileLabel}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ================= MOBILE TOP HEADER (< 768px) ================= */}
      <header className="md:hidden sticky top-0 z-30 bg-[#11212D]/95 backdrop-blur-md border-b border-[#253745] px-3.5 py-2.5 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#06141B] overflow-hidden flex items-center justify-center shadow border border-[#4A5C6A] shrink-0">
            <img
              src="/assets/logo.png"
              alt="FaeQuest Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-rpg font-extrabold text-sm tracking-wider text-[#CCD0CF]">
              FAE<span className="text-white">QUEST</span>
            </h1>
          </div>
        </div>

        {/* Middle: Coins & Streak */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#06141B] border border-[#253745] text-xs font-bold shadow-sm">
            <CoinIcon size="xs" />
            <span className="text-[#CCD0CF]">{coins}</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#06141B] border border-[#253745] text-xs font-bold text-amber-300 shadow-sm">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
            <span>{streakDays}N</span>
          </div>
        </div>

        {/* Right: Quick Action Buttons (Hộp Thư, Khế Ước & Cài Đặt) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setUserInboxOpen(true)}
            className="p-1.5 rounded-lg bg-[#06141B] border border-[#253745] text-[#CCD0CF] hover:border-[#4A5C6A] transition shadow-sm relative cursor-pointer"
            title="Hộp Thư Thợ Săn"
          >
            <Mail className="w-4 h-4" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-[#06141B] animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setOathOpen(true)}
            className="p-1.5 rounded-lg bg-[#06141B] border border-[#253745] text-[#CCD0CF] hover:border-[#4A5C6A] transition shadow-sm"
            title="Khế Ước Thợ Săn"
          >
            <Scroll className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded-lg bg-[#06141B] border border-[#253745] text-[#9BA8AB] hover:text-[#CCD0CF] hover:border-[#4A5C6A] transition shadow-sm"
            title="Cài Đặt Hệ Thống"
          >
            <Settings className="w-4 h-4 text-[#CCD0CF]" />
          </button>
        </div>
      </header>
    </>
  );
};
