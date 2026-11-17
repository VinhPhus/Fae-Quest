import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { ActiveTab } from '../../types';
import { CheckSquare, ShoppingBag, Trophy, Backpack, BookOpen, BarChart2 } from 'lucide-react';

export const NavigationTabs: React.FC = () => {
  const { activeTab, setActiveTab, tasks, inventory } = useFaeQuestStore();

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const now = Date.now();
  const validUnusedInventoryCount = inventory.filter(
    (i) => !i.used && (!i.expiresAt || i.expiresAt > now)
  ).length;

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'quests',
      label: 'Bảng Nhiệm Vụ',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: pendingCount,
    },
    {
      id: 'shop',
      label: 'Cửa Hàng Tự Thưởng',
      icon: <ShoppingBag className="w-4 h-4" />,
    },
    {
      id: 'leaderboard',
      label: 'Đấu Trường BXH',
      icon: <Trophy className="w-4 h-4" />,
    },
    {
      id: 'inventory',
      label: 'Túi Đồ',
      icon: <Backpack className="w-4 h-4" />,
      badge: validUnusedInventoryCount,
    },
    {
      id: 'chronicles',
      label: 'Nhật Ký',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'analytics',
      label: 'Thống Kê Năng Suất',
      icon: <BarChart2 className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-opal/30">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap ${
              isActive
                ? 'bg-gradient-to-r from-fae to-bargain text-parchment shadow-md border border-fae/50 scale-[1.02]'
                : 'bg-thorn-dark/70 text-parchment/70 hover:text-parchment hover:bg-thorn-dark border border-opal/20'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  isActive ? 'bg-thorn-dark text-fae' : 'bg-fae/30 text-fae-light'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
