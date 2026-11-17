import React, { useEffect } from 'react';
import { useFaeQuestStore } from './store/useFaeQuestStore';
import { AuthScreen } from './components/auth/AuthScreen';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { TopBentoHeader } from './components/layout/TopBentoHeader';
import { HeroBentoBanner } from './components/bento/HeroBentoBanner';
import { QuestBentoGrid } from './components/bento/QuestBentoGrid';
import { FocusDock } from './components/bento/FocusDock';
import { RightMiniLeaderboardStrip } from './components/bento/RightMiniLeaderboardStrip';
import { CreateQuestDrawer } from './components/modals/CreateQuestDrawer';
import { SystemQuestsHeader, SystemQuestsView } from './components/system-quests/SystemQuestsView';
import { PomodoroTimerModal } from './components/quests/PomodoroTimerModal';
import { RewardShopHeader, RewardShopGrid } from './components/shop/RewardShopGrid';
import { AddShopItemModal } from './components/shop/AddShopItemModal';
import { InventoryHeader, InventoryList } from './components/shop/InventoryList';
import { LeaderboardHeader, LeaderboardTable } from './components/leaderboard/LeaderboardTable';
import { AddRivalModal } from './components/leaderboard/AddRivalModal';
import { ProductivityAnalyticsHeader, ProductivityAnalytics } from './components/analytics/ProductivityAnalytics';
import { RankUpModal } from './components/modals/RankUpModal';
import { RankRoadmapModal } from './components/modals/RankRoadmapModal';
import { RenameModal } from './components/modals/RenameModal';
import { ResetModal } from './components/modals/ResetModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { HuntersOathModal } from './components/modals/HuntersOathModal';
import { UserInboxModal } from './components/modals/UserInboxModal';
import { AdminWarningModal } from './components/modals/AdminWarningModal';
import { ChangeCoverModal } from './components/modals/ChangeCoverModal';
import { AdminPortalHeader, AdminPortalView } from './components/admin/AdminPortalView';
import { BannedScreen } from './components/auth/BannedScreen';
import { Toast } from './components/ui/Toast';
import { FloatingReward } from './components/ui/FloatingReward';
import { CoinBurstOverlay } from './components/ui/CoinBurstOverlay';
import { useRealtimeSync } from './hooks/useRealtimeSync';

export const App: React.FC = () => {
  useRealtimeSync();

  const {
    currentUser,
    authLoading,
    initAuth,
    activeTab,
    bannedUntil,
    checkDailyReset,
    checkSystemMilestones,
    cleanupExpiredInventory,
  } = useFaeQuestStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (currentUser) {
      checkDailyReset();
      checkSystemMilestones();
      cleanupExpiredInventory();
      // Tự động đồng bộ nhẹ lên Supabase khi khởi chạy ứng dụng
      useFaeQuestStore.getState().syncToCloud(true);
    }
  }, [currentUser, checkDailyReset, checkSystemMilestones, cleanupExpiredInventory]);

  // Periodic 30s background check for inventory item lifecycle (auto-cleanup) and midnight daily reset
  useEffect(() => {
    cleanupExpiredInventory();
    checkDailyReset();
    const interval = setInterval(() => {
      cleanupExpiredInventory();
      checkDailyReset();
    }, 30000);
    return () => clearInterval(interval);
  }, [cleanupExpiredInventory, checkDailyReset]);

  // Clean up inventory whenever switching tabs
  useEffect(() => {
    cleanupExpiredInventory();
  }, [activeTab, cleanupExpiredInventory]);

  // Loading state while checking authentication session
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-thorn-dark thorn-pattern p-4">
        <div className="relative flex flex-col items-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-[#06141B] overflow-hidden border-2 border-[#4A5C6A] flex items-center justify-center shadow-[0_0_35px_rgba(204,208,207,0.35)] rank-pulse-fx relative">
            <img
              src="/assets/logo.png"
              alt="FaeQuest Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-parchment tracking-wide">
            <div className="w-4 h-4 border-2 border-fae border-t-transparent rounded-full animate-spin" />
            <span>Đang mở Cổng Thợ Săn FaeQuest...</span>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show the Dark Fantasy Auth Screen
  if (!currentUser) {
    return (
      <>
        <AuthScreen />
        <Toast />
      </>
    );
  }

  // Kiểm tra tài khoản bị tạm khóa (Banned until > NOW)
  const isAccountBanned = Boolean(
    bannedUntil && new Date(bannedUntil).getTime() > Date.now()
  );

  if (isAccountBanned) {
    return (
      <>
        <BannedScreen />
        <Toast />
      </>
    );
  }

  return (
    <div className="thorn-pattern antialiased min-h-screen md:h-screen md:overflow-hidden selection:bg-fae selection:text-thorn-dark flex flex-col md:flex-row bg-[#06141B]">
      {/* 1. Collapsible Left Sidebar on Desktop / Bottom Navigation on Mobile */}
      <LeftSidebar />

      {/* 2. Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col h-auto md:h-screen overflow-visible md:overflow-hidden bg-[#06141B]">
        {/* Phân vùng 1: Top Sticky Section (Hồ Sơ & Header - Giữ cố định trên Desktop) */}
        <header className="relative md:flex-shrink-0 md:z-20 bg-[#06141B] px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-3 md:pb-4 border-b border-[#253745]/40 md:shadow-[0_8px_30px_rgba(6,20,27,0.85)]">
          <div className="max-w-7xl w-full mx-auto space-y-3">
            {/* Top Bento Header with Greeting, Search, and Quick Actions */}
            <TopBentoHeader />

            {/* Dedicated Top Profile / Banner per Active Tab */}
            {activeTab === 'quests' && <HeroBentoBanner />}
            {activeTab === 'system-quests' && <SystemQuestsHeader />}
            {activeTab === 'shop' && <RewardShopHeader />}
            {activeTab === 'leaderboard' && <LeaderboardHeader />}
            {activeTab === 'inventory' && <InventoryHeader />}
            {activeTab === 'analytics' && <ProductivityAnalyticsHeader />}
            {activeTab === 'admin' && <AdminPortalHeader />}
          </div>
        </header>

        {/* Phân vùng 2: Scrollable Content Section (Cuộn độc lập) */}
        <main className="flex-1 overflow-visible md:overflow-y-auto px-3 sm:px-6 lg:px-8 pt-4 pb-24 md:pb-8 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#06141B] [&::-webkit-scrollbar-thumb]:bg-[#253745] hover:[&::-webkit-scrollbar-thumb]:bg-[#4A5C6A] [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="max-w-7xl w-full mx-auto space-y-5">
            {/* Tab 1: Bento Dashboard (Quests Module) */}
            {activeTab === 'quests' && (
              <section className="animate-in fade-in duration-200 space-y-5 sm:space-y-6">
                {/* Nhiệm Vụ Chinh Phục (Lưới Thẻ Bento) */}
                <QuestBentoGrid />

                {/* Thanh Dock Đáy — Phiên Tập Trung Tiêu Điểm */}
                <FocusDock />
              </section>
            )}

            {/* Tab: System Quests & Titles Module */}
            {activeTab === 'system-quests' && (
              <section className="animate-in fade-in duration-200">
                <SystemQuestsView />
              </section>
            )}

            {/* Tab 2: Shop Module */}
            {activeTab === 'shop' && (
              <section className="animate-in fade-in duration-200">
                <RewardShopGrid />
              </section>
            )}

            {/* Tab 3: Leaderboard Module */}
            {activeTab === 'leaderboard' && (
              <section className="animate-in fade-in duration-200">
                <LeaderboardTable />
              </section>
            )}

            {/* Tab 4: Inventory Module */}
            {activeTab === 'inventory' && (
              <section className="animate-in fade-in duration-200">
                <InventoryList />
              </section>
            )}

            {/* Tab 5: Analytics Module */}
            {activeTab === 'analytics' && (
              <section className="animate-in fade-in duration-200">
                <ProductivityAnalytics />
              </section>
            )}

            {/* Tab: Admin Live-Ops Portal */}
            {activeTab === 'admin' && (
              <section className="animate-in fade-in duration-200">
                <AdminPortalView />
              </section>
            )}
          </div>
        </main>
      </div>

      {/* 3. Khóa Cố Định Dải Mini BXH (Fixed Right Sidebar trên xl:flex) */}
      {activeTab === 'quests' && <RightMiniLeaderboardStrip />}

      {/* Modals & Overlays */}
      <RankUpModal />
      <RankRoadmapModal />
      <AddShopItemModal />
      <AddRivalModal />
      <RenameModal />
      <ResetModal />
      <SettingsModal />
      <PomodoroTimerModal />
      <HuntersOathModal />
      <CreateQuestDrawer />
      <UserInboxModal />
      <AdminWarningModal />
      <ChangeCoverModal />

      {/* Interactive FX */}
      <FloatingReward />
      <CoinBurstOverlay />
      <Toast />
    </div>
  );
};

export default App;
