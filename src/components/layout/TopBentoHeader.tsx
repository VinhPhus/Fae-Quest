import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { resolveTitleObject } from '../../constants/systemQuests';
import { Search, X, Plus, ShieldAlert, Scroll } from 'lucide-react';
import { InboxBellButton } from './InboxBellButton';

export const TopBentoHeader: React.FC = () => {
  const {
    playerName,
    equippedTitleId,
    setActiveTab,
    setCreateQuestOpen,
    searchQuery,
    setSearchQuery,
    userRole,
    setOathOpen,
  } = useFaeQuestStore();

  const titleObj = resolveTitleObject(equippedTitleId);

  // Determine time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Chào buổi sáng';
    if (hour >= 12 && hour < 18) return 'Chào buổi chiều';
    if (hour >= 18 && hour < 23) return 'Chào buổi tối';
    return 'Chào đêm khuya';
  };

  return (
    <header className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 md:gap-3.5 pb-1 md:pb-2">
      {/* Left: Personalized Greeting + Equipped Title Badge */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <div>
          <h1 className="font-rpg font-extrabold text-lg sm:text-2xl text-[#CCD0CF] tracking-tight flex items-center gap-2">
            <span>{getGreeting()},</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#CCD0CF] to-[#9BA8AB]">
              {playerName}
            </span>
            <span className="hidden sm:inline-block animate-pulse">✨</span>
          </h1>
        </div>

        {/* Clickable Title Badge - Obsidian & Steel */}
        <button
          type="button"
          onClick={() => setActiveTab('system-quests')}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] text-[11px] font-bold text-[#CCD0CF] shadow-sm transition hover:scale-105 cursor-pointer"
          title="Bấm để mở Kho Danh Hiệu & Đổi Danh Hiệu"
        >
          <img
            src={titleObj.iconUrl}
            alt={titleObj.name}
            className="w-3.5 h-3.5 object-contain drop-shadow"
          />
          <span className="text-[#CCD0CF] font-bold">{titleObj.name}</span>
          <span className="text-[9px] text-[#9BA8AB] font-normal">| Đổi</span>
        </button>

        {/* Prestigious Admin Badge for Admin Accounts */}
        {userRole === 'admin' && (
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 hover:border-amber-400 text-[11px] font-extrabold text-amber-300 shadow-sm transition hover:scale-105 cursor-pointer"
            title="Đặc quyền Quản Trị Viên (Admin). Bấm để truy cập Bảng Quản Trị Hệ Thống"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>BAN QUẢN TRỊ</span>
          </button>
        )}
      </div>

      {/* Right: Search Input + New Task CTA */}
      <div className="flex items-center gap-2 sm:gap-2.5 w-full md:w-auto">
        {/* Search Input - Expands with flex-1 min-w-0 to show complete placeholder */}
        <div className="relative flex-1 min-w-0 sm:w-60 md:w-64 max-w-full">
          <Search className="w-3.5 h-3.5 text-[#9BA8AB] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm nhiệm vụ..."
            className="w-full pl-9 pr-8 py-2 rounded-full bg-[#06141B] border border-[#253745] text-xs text-[#CCD0CF] placeholder-[#9BA8AB]/60 focus:outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9BA8AB] hover:text-[#CCD0CF] p-0.5 cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Desktop Utility: Cuộn Giấy (Khế Ước Thợ Săn) */}
        <button
          type="button"
          onClick={() => setOathOpen(true)}
          className="hidden md:inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-[#CCD0CF] hover:text-white transition-colors relative cursor-pointer shrink-0"
          title="Khế Ước Thợ Săn"
        >
          <Scroll className="w-4 h-4" />
        </button>

        {/* Desktop Utility: Hộp Thư Thợ Săn (#074 Bell) */}
        <InboxBellButton variant="desktop" />

        {/* Primary CTA: + Khắc Lệnh Mới Button */}
        <button
          id="tour-add-task"
          type="button"
          onClick={() => setCreateQuestOpen(true)}
          className="min-h-[40px] px-3.5 sm:px-4 py-2 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs flex items-center gap-1.5 shadow-[0_4px_20px_rgba(204,208,207,0.2)] active:scale-95 transition cursor-pointer shrink-0"
          title="Tạo Nhiệm Vụ Mới"
        >
          <Plus className="w-4 h-4 text-[#06141B] stroke-[3]" />
          <span className="sm:hidden">Khắc Lệnh</span>
          <span className="hidden sm:inline">Khắc Lệnh Mới</span>
        </button>
      </div>
    </header>
  );
};
