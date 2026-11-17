import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminShopTab } from './AdminShopTab';
import { AdminAchievementsTab } from './AdminAchievementsTab';
import { AdminLiveOpsTab } from './AdminLiveOpsTab';
import {
  ShieldAlert,
  Users,
  ShoppingBag,
  Trophy,
  BarChart2,
  Lock,
  ArrowLeft,
} from 'lucide-react';

export const AdminPortalHeader: React.FC = () => {
  const { adminPortalTab, setAdminPortalTab, setActiveTab, userRole } = useFaeQuestStore();

  if (userRole !== 'admin') return null;

  const tabs: {
    id: 'users' | 'shop' | 'achievements' | 'analytics';
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
      id: 'analytics',
      label: 'Tổng Quan Live-Ops',
      icon: <BarChart2 className="w-4 h-4 shrink-0" />,
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

        <button
          type="button"
          onClick={() => setActiveTab('quests')}
          className="px-3.5 py-2 rounded-xl bg-[#06141B] hover:bg-[#253745] text-[#CCD0CF] text-xs font-semibold flex items-center gap-1.5 border border-[#253745] hover:border-[#4A5C6A] transition cursor-pointer self-start md:self-auto shadow"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Sảnh Đấu Trường</span>
        </button>
      </div>

      {/* 4 Dedicated Tabs Navigation Bar */}
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
  const { adminPortalTab, setAdminPortalTab, setActiveTab, userRole } = useFaeQuestStore();

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
        <button
          type="button"
          onClick={() => setActiveTab('quests')}
          className="px-5 py-2.5 rounded-full bg-[#CCD0CF] text-[#06141B] font-bold text-xs cursor-pointer hover:bg-white transition"
        >
          Quay Về Nhiệm Vụ
        </button>
      </div>
    );
  }

  const tabs: {
    id: 'users' | 'shop' | 'achievements' | 'analytics';
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'users',
      label: 'Người Dùng & Radar Bất Thường',
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
      id: 'analytics',
      label: 'Tổng Quan Live-Ops',
      icon: <BarChart2 className="w-4 h-4 shrink-0" />,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Tab Panels */}
      {adminPortalTab === 'users' && <AdminUsersTab />}
      {adminPortalTab === 'shop' && <AdminShopTab />}
      {adminPortalTab === 'achievements' && <AdminAchievementsTab />}
      {adminPortalTab === 'analytics' && <AdminLiveOpsTab />}
    </div>
  );
};
