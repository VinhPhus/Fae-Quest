import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminShopTab } from './AdminShopTab';
import { AdminAchievementsTab } from './AdminAchievementsTab';
import { AdminLiveOpsTab } from './AdminLiveOpsTab';
import { AdminAnnouncementsTab } from './AdminAnnouncementsTab';
import { AdminAssetVaultTab } from './AdminAssetVaultTab';
import {
  ShieldAlert,
  Users,
  ShoppingBag,
  Trophy,
  BarChart2,
  Lock,
  ArrowLeft,
  Megaphone,
  Swords,
  FolderArchive,
} from 'lucide-react';

export const AdminPortalHeader: React.FC = () => {
  const { adminPortalTab, setAdminPortalTab, setActiveTab, userRole, setSeasonResetModalOpen } = useFaeQuestStore();

  if (userRole !== 'admin') return null;

  const tabs: {
    id: 'users' | 'shop' | 'achievements' | 'analytics' | 'announcements' | 'assets';
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'users',
      label: 'Người Dùng & Radar',
      icon: <Users className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'shop',
      label: 'Cửa Hàng Hệ Thống',
      icon: <ShoppingBag className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'achievements',
      label: 'Thành Tựu & Danh Hiệu',
      icon: <Trophy className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'assets',
      label: '🖼️ Kho Tài Nguyên',
      icon: <FolderArchive className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'analytics',
      label: 'Tổng Quan Live-Ops',
      icon: <BarChart2 className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'announcements',
      label: 'Thông Báo Mùa Giải',
      icon: <Megaphone className="w-4 h-4 shrink-0" />,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Top Main Admin Header Banner */}
      <div className="bg-[#11212D] border border-[#253745] rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-300">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>FaeQuest Live-Ops Master Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white font-rpg tracking-wide">
            🛡️ Trung Tâm Quản Trị Hệ Thống
          </h1>
          <p className="text-xs text-[#9BA8AB] max-w-2xl leading-relaxed hidden sm:block">
            Hạ tầng giám sát an ninh chống gian lận, điều phối Cửa Hàng toàn cầu, tạo lập Thành Tựu và gửi quà thư Thợ Săn.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto justify-end">
          {/* Quick Action: Reset Rank Mùa Giải */}
          <button
            type="button"
            onClick={() => setSeasonResetModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#06141B] text-xs font-black flex items-center gap-1.5 shadow transition cursor-pointer active:scale-95"
            title="Khởi tạo lại bậc Rank cho toàn bộ người chơi khi sang mùa giải mới"
          >
            <Swords className="w-3.5 h-3.5 text-[#06141B]" />
            <span>⚔️ Reset Rank Mùa Giải</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quests')}
            className="px-3.5 py-2 rounded-xl bg-[#06141B] hover:bg-[#253745] text-[#CCD0CF] text-xs font-semibold flex items-center gap-1.5 border border-[#253745] hover:border-[#4A5C6A] transition cursor-pointer shadow"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Sảnh Đấu Trường</span>
          </button>
        </div>
      </div>

      {/* 5 Dedicated Tabs Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((tab) => {
          const isActive = adminPortalTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAdminPortalTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                isActive
                  ? 'bg-[#CCD0CF] text-[#06141B] border-white shadow-md'
                  : 'bg-[#11212D] text-[#9BA8AB] border-[#253745] hover:text-[#CCD0CF] hover:bg-[#253745]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const AdminPortalView: React.FC = () => {
  const { adminPortalTab, userRole } = useFaeQuestStore();

  if (userRole !== 'admin') {
    return (
      <div className="py-20 text-center space-y-4 bg-[#11212D] border border-rose-500/30 rounded-3xl p-8">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-500 mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white font-rpg">
          Khu Vực Hạn Chế — Dành Riêng Cho Quản Trị Viên
        </h2>
        <p className="text-xs sm:text-sm text-[#9BA8AB] max-w-md mx-auto">
          Tài khoản của bạn không có đặc quyền Admin (`role = 'admin'`). Vui lòng quay lại giao diện Thợ Săn.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Tab Panels */}
      {adminPortalTab === 'users' && <AdminUsersTab />}
      {adminPortalTab === 'shop' && <AdminShopTab />}
      {adminPortalTab === 'achievements' && <AdminAchievementsTab />}
      {adminPortalTab === 'assets' && <AdminAssetVaultTab />}
      {adminPortalTab === 'analytics' && <AdminLiveOpsTab />}
      {adminPortalTab === 'announcements' && <AdminAnnouncementsTab />}
    </div>
  );
};
