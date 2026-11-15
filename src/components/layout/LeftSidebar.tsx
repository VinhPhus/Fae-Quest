import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { ActiveTab } from '../../types';
import { CoinIcon } from '../ui/CoinIcon';
import {
  Sword,
  CheckSquare,
  ShoppingBag,
  Trophy,
  Backpack,
  BarChart2,
  Flame,
  Volume2,
  VolumeX,
  Settings,
  Scroll,
  ChevronLeft,
  ChevronRight,
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
    soundEnabled,
    toggleSound,
    setSettingsOpen,
    setOathOpen,
    isSidebarCollapsed,
    toggleSidebar,
  } = useFaeQuestStore();

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const unusedInventoryCount = inventory.filter((i) => !i.used).length;

  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'quests',
      label: 'Bảng Nhiệm Vụ',
      icon: <CheckSquare className="w-5 h-5 shrink-0" />,
      badge: pendingCount,
    },
    {
      id: 'system-quests',
      label: 'Thành Tựu',
      icon: <Scroll className="w-5 h-5 shrink-0" />,
      badge: actionableSystemQuestsCount,
    },
    {
      id: 'shop',
      label: 'Cửa Hàng Tự Thưởng',
      icon: <ShoppingBag className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'leaderboard',
      label: 'Đấu Trường BXH',
      icon: <Trophy className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'inventory',
      label: 'Kho Phần Thưởng',
      icon: <Backpack className="w-5 h-5 shrink-0" />,
      badge: unusedInventoryCount,
    },
    {
      id: 'analytics',
      label: 'Thống Kê Năng Suất',
      icon: <BarChart2 className="w-5 h-5 shrink-0" />,
    },
  ];

  return (
    <>
      {/* ================= DESKTOP / TABLET SIDEBAR (>= 768px) ================= */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 shrink-0 z-30 bg-thorn-dark/95 backdrop-blur-md border-r border-fae/20 overflow-hidden no-scrollbar transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[width] ${
          isSidebarCollapsed ? 'w-[76px]' : 'w-[260px]'
        }`}
      >
        {/* 1. Header of Sidebar: Brand & Logo */}
        <div className="px-3.5 py-3 border-b border-parchment/10 h-[68px] flex items-center shrink-0 overflow-hidden">
          <div
            className="flex items-center gap-2.5 min-w-0 w-full"
            title={isSidebarCollapsed ? 'FaeQuest RPG Todo V2.0' : undefined}
          >
            {/* Logo Emblem Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fae to-bargain flex items-center justify-center shadow-lg border border-parchment/30 shrink-0">
              <Sword className="w-5 h-5 text-parchment" />
            </div>

            {/* Smooth Fade + Slide Brand Text */}
            <div
              className={`flex flex-col min-w-0 whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${
                isSidebarCollapsed
                  ? 'opacity-0 max-w-0 -translate-x-2 ml-0 pointer-events-none'
                  : 'opacity-100 max-w-[170px] translate-x-0 ml-1'
              }`}
            >
              <div className="flex items-center gap-1">
                <h1 className="font-rpg font-bold text-base tracking-wider text-parchment truncate leading-tight">
                  FAE<span className="text-fae">QUEST</span>
                </h1>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-opal/40 border border-opal-light/40 text-parchment w-fit">
                RPG TODO V2.0
              </span>
            </div>
          </div>
        </div>

        {/* 2. Mini-Status: Coins & Streak */}
        <div className="px-3.5 py-2.5 border-b border-parchment/10 h-[56px] flex items-center shrink-0 overflow-hidden">
          <div
            className="w-full flex items-center justify-between rounded-xl bg-thorn/80 border border-opal/30 px-2.5 py-1.5 text-xs shadow-inner"
            title={isSidebarCollapsed ? `${coins} Xu • Chuỗi ${streakDays} ngày` : undefined}
          >
            {/* Coin item */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-6 h-6 flex items-center justify-center">
                <CoinIcon size="sm" />
              </div>
              <span
                className={`text-fae font-bold whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${
                  isSidebarCollapsed
                    ? 'opacity-0 max-w-0 -translate-x-1 ml-0 pointer-events-none'
                    : 'opacity-100 max-w-[80px] translate-x-0'
                }`}
              >
                {coins} Xu
              </span>
            </div>

            {/* Divider & Streak */}
            <div
              className={`flex items-center gap-2 whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${
                isSidebarCollapsed
                  ? 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'
                  : 'opacity-100 max-w-[120px] translate-x-0'
              }`}
            >
              <span className="text-parchment/30">•</span>
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
                className={`w-full flex items-center px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-fae to-bargain text-parchment shadow-md border border-fae/50 scale-[1.01]'
                    : 'text-parchment/70 hover:text-parchment hover:bg-thorn border border-transparent'
                }`}
              >
                {/* Fixed Icon Container */}
                <div className="w-6 h-6 shrink-0 flex items-center justify-center relative">
                  {item.icon}
                  {/* Collapsed Notification Dot */}
                  {isSidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-fae border border-thorn-dark animate-pulse" />
                  )}
                </div>

                {/* Smooth Fade + Slide + Max-Width Text Container */}
                <div
                  className={`flex items-center justify-between flex-1 min-w-0 whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${
                    isSidebarCollapsed
                      ? 'opacity-0 max-w-0 -translate-x-2 ml-0 pointer-events-none'
                      : 'opacity-100 max-w-[180px] translate-x-0 ml-3'
                  }`}
                >
                  <span className="truncate text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-extrabold shrink-0 ${
                        isActive
                          ? 'bg-thorn-dark text-fae border border-fae/40'
                          : 'bg-fae text-thorn-dark'
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

        {/* 4. Footer of Sidebar: Sound, Settings, Oath, Collapse Toggle */}
        <div className="p-3.5 border-t border-parchment/10 space-y-2 bg-thorn-dark/60 shrink-0 overflow-hidden">
          {/* Hunter's Oath Button */}
          <button
            onClick={() => setOathOpen(true)}
            title={isSidebarCollapsed ? 'Khế Ước Thợ Săn' : undefined}
            className="w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-parchment hover:bg-thorn border border-opal/30 hover:border-fae/50"
          >
            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
              <Scroll className="w-4 h-4 text-fae" />
            </div>
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${
                isSidebarCollapsed
                  ? 'opacity-0 max-w-0 -translate-x-2 ml-0 pointer-events-none'
                  : 'opacity-100 max-w-[180px] translate-x-0 ml-3'
              }`}
            >
              Khế Ước Thợ Săn
            </span>
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={toggleSound}
            title={isSidebarCollapsed ? (soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh') : undefined}
            className="w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-parchment hover:bg-thorn border border-opal/30"
          >
            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-fae" />
              ) : (
                <VolumeX className="w-4 h-4 text-parchment/50" />
              )}
            </div>
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${
                isSidebarCollapsed
                  ? 'opacity-0 max-w-0 -translate-x-2 ml-0 pointer-events-none'
                  : 'opacity-100 max-w-[180px] translate-x-0 ml-3'
              }`}
            >
              {soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setSettingsOpen(true)}
            title={isSidebarCollapsed ? 'Cài Đặt Hệ Thống' : undefined}
            className="w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-parchment hover:bg-thorn border border-opal/30 hover:border-fae/50"
          >
            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
              <Settings className="w-4 h-4 text-fae" />
            </div>
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-200 ease-out ${
                isSidebarCollapsed
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
            className="w-full flex items-center px-3.5 py-2.5 rounded-xl text-parchment/60 hover:text-parchment hover:bg-thorn/90 border border-parchment/10 transition"
          >
            <div className="w-6 h-6 shrink-0 flex items-center justify-center">
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-fae" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-fae" />
              )}
            </div>
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-200 ease-out text-xs font-medium ${
                isSidebarCollapsed
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-thorn-dark/95 backdrop-blur-xl border-t border-opal/40 px-2 py-2 flex items-center justify-around shadow-2xl">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition relative ${
                isActive
                  ? 'text-fae font-bold scale-105'
                  : 'text-parchment/60 hover:text-parchment'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-fae text-thorn-dark">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] truncate max-w-[60px] leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ================= MOBILE TOP HEADER (< 768px) ================= */}
      <div className="md:hidden sticky top-0 z-30 bg-thorn-dark/95 backdrop-blur-md border-b border-opal/30 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fae to-bargain flex items-center justify-center text-parchment shadow border border-parchment/20">
            <Sword className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-rpg font-bold text-sm tracking-wider text-parchment">
              FAE<span className="text-fae">QUEST</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-thorn border border-opal/30 text-xs">
            <CoinIcon size="xs" />
            <span className="font-bold text-fae">{coins}</span>
          </div>

          <button
            onClick={() => setOathOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-thorn border border-opal/30 text-xs font-bold text-fae-light hover:text-parchment"
            title="Khế Ước Thợ Săn"
          >
            <Scroll className="w-3.5 h-3.5 text-fae" />
            <span className="hidden sm:inline">Khế Ước</span>
          </button>

          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-thorn border border-opal/30 text-parchment"
            title="Bật/Tắt âm thanh"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-fae" />
            ) : (
              <VolumeX className="w-4 h-4 text-parchment/50" />
            )}
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded-lg bg-thorn border border-opal/30 text-parchment"
            title="Cài đặt"
          >
            <Settings className="w-4 h-4 text-fae" />
          </button>
        </div>
      </div>
    </>
  );
};
