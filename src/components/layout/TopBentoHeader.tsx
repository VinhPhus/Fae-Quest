import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { resolveTitleObject } from '../../constants/systemQuests';
import { Search, X, Scroll, Settings, Plus, Mail, ShieldAlert } from 'lucide-react';

export const TopBentoHeader: React.FC = () => {
  const {
    playerName,
    equippedTitleId,
    setActiveTab,
    setOathOpen,
    setSettingsOpen,
    setCreateQuestOpen,
    searchQuery,
    setSearchQuery,
    unreadMessagesCount,
    setUserInboxOpen,
    userRole,
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
    <header className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 pb-2">
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

      {/* Right: Search Input + Quick Actions + New Task CTA */}
      <div className="flex items-center gap-2 sm:gap-2.5 self-end md:self-auto w-full md:w-auto justify-end">
        {/* Search Input */}
        <div className="relative flex-1 sm:w-60 md:w-64 max-w-xs">
          <Search className="w-3.5 h-3.5 text-[#9BA8AB] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm nhiệm vụ..."
            className="w-full pl-9 pr-8 py-2 rounded-full bg-[#06141B] border border-[#253745] text-xs text-[#CCD0CF] placeholder-[#9BA8AB]/50 focus:outline-none focus:border-[#4A5C6A] focus:ring-1 focus:ring-[#4A5C6A] transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9BA8AB] hover:text-[#CCD0CF] p-0.5"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 📬 User Inbox Button with Red Badge */}
        <button
          type="button"
          onClick={() => setUserInboxOpen(true)}
          className="relative p-2 sm:p-2.5 rounded-full bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] hover:text-white hover:scale-105 active:scale-95 transition shadow-sm cursor-pointer shrink-0"
          title={unreadMessagesCount > 0 ? `Hộp Thư (${unreadMessagesCount} chưa đọc)` : 'Hộp Thư Thợ Săn'}
        >
          <Mail className="w-4 h-4 text-[#CCD0CF]" />
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-500 text-white shadow-sm border border-[#06141B] animate-pulse">
              {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
            </span>
          )}
        </button>

        {/* Hunter's Oath Quick Button (chỉ hiện trên Mobile < md) */}
        <button
          type="button"
          onClick={() => setOathOpen(true)}
          className="flex md:hidden p-2.5 rounded-full bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] hover:scale-105 active:scale-95 transition shadow-sm cursor-pointer shrink-0"
          title="Khế Ước Thợ Săn"
        >
          <Scroll className="w-4 h-4" />
        </button>

        {/* Settings Quick Button (chỉ hiện trên Mobile < md) */}
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex md:hidden p-2.5 rounded-full bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] hover:scale-105 active:scale-95 transition shadow-sm cursor-pointer shrink-0"
          title="Cài Đặt Hệ Thống"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Primary CTA: + Khắc Lệnh Mới Button */}
        <button
          id="tour-add-task"
          type="button"
          onClick={() => setCreateQuestOpen(true)}
          className="px-3.5 sm:px-4 py-2 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs flex items-center gap-1.5 shadow-[0_4px_20px_rgba(204,208,207,0.2)] active:scale-95 transition cursor-pointer shrink-0"
          title="Tạo Nhiệm Vụ Mới"
        >
          <Plus className="w-4 h-4 text-[#06141B] stroke-[3]" />
          <span className="hidden sm:inline">Khắc Lệnh Mới</span>
        </button>
      </div>
    </header>
  );
};
