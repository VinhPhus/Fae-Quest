import React, { useEffect } from 'react';
import { useFaeQuestStore } from './store/useFaeQuestStore';
import { AuthScreen } from './components/auth/AuthScreen';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { TopBentoHeader } from './components/layout/TopBentoHeader';
import { HeroBentoBanner } from './components/bento/HeroBentoBanner';
import { QuestBentoGrid } from './components/bento/QuestBentoGrid';
import { FocusDock } from './components/bento/FocusDock';
import { DailyFocusWidget } from './components/bento/DailyFocusWidget';
import { HunterStatisticsWidget } from './components/bento/HunterStatisticsWidget';
import { RightMiniLeaderboardStrip } from './components/bento/RightMiniLeaderboardStrip';
import { CreateQuestDrawer } from './components/modals/CreateQuestDrawer';
import { PlayerStatusCard } from './components/hero/PlayerStatusCard';
import { AddQuestForm } from './components/quests/AddQuestForm';
import { QuestFilterBar } from './components/quests/QuestFilterBar';
import { QuestList } from './components/quests/QuestList';
import { SystemQuestsView } from './components/system-quests/SystemQuestsView';
import { PomodoroTimerModal } from './components/quests/PomodoroTimerModal';
import { RewardShopGrid } from './components/shop/RewardShopGrid';
import { AddShopItemModal } from './components/shop/AddShopItemModal';
import { InventoryList } from './components/shop/InventoryList';
import { LeaderboardTable } from './components/leaderboard/LeaderboardTable';
import { AddRivalModal } from './components/leaderboard/AddRivalModal';
import { ProductivityAnalytics } from './components/analytics/ProductivityAnalytics';
import { RankUpModal } from './components/modals/RankUpModal';
import { RankRoadmapModal } from './components/modals/RankRoadmapModal';
import { RenameModal } from './components/modals/RenameModal';
import { ResetModal } from './components/modals/ResetModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { HuntersOathModal } from './components/modals/HuntersOathModal';
import { UserInboxModal } from './components/modals/UserInboxModal';
import { AdminWarningModal } from './components/modals/AdminWarningModal';
import { AdminPortalView } from './components/admin/AdminPortalView';
import { BannedScreen } from './components/auth/BannedScreen';
import { Toast } from './components/ui/Toast';
import { FloatingReward } from './components/ui/FloatingReward';
import { CoinBurstOverlay } from './components/ui/CoinBurstOverlay';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { Sword } from 'lucide-react';

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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fae to-bargain border-2 border-fae flex items-center justify-center text-parchment shadow-[0_0_30px_rgba(217,119,82,0.6)] rank-pulse-fx">
            <Sword className="w-8 h-8 text-parchment" />
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
    <div className="thorn-pattern antialiased min-h-screen selection:bg-fae selection:text-thorn-dark flex flex-col md:flex-row">
      {/* 1. Collapsible Left Sidebar on Desktop / Bottom Navigation on Mobile */}
      <LeftSidebar />

      {/* 2. Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col pb-24 md:pb-8">
        <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-5">
          {/* Top Bento Header with Greeting, Search, and Quick Actions */}
          <TopBentoHeader />

          {/* Tab 1: Bento Dashboard (Quests Module) */}
          {activeTab === 'quests' && (
            <section className="animate-in fade-in duration-200">
              <div className="flex gap-5 sm:gap-6 items-start">
                {/* 2-Column Bento Grid Container (~66% Center + ~34% Right) */}
                <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
                  {/* KHU VỰC A — CỘT CHÍNH GIỮA (Left-Center Column, lg:col-span-8) */}
                  <div className="lg:col-span-8 space-y-5 sm:space-y-6">
                    {/* 1. Hero Banner Hồ Sơ & Bậc Rank */}
                    <HeroBentoBanner />

                    {/* 2. Nhiệm Vụ Chinh Phục (Lưới Thẻ Bento) */}
                    <QuestBentoGrid />

                    {/* 3. Thanh Dock Đáy — Phiên Tập Trung Tiêu Điểm */}
                    <FocusDock />
                  </div>

                  {/* KHU VỰC B — CỘT WIDGET BÊN PHẢI (Right Column, lg:col-span-4) */}
                  <div className="lg:col-span-4 space-y-5 sm:space-y-6 lg:sticky lg:top-4">
                    {/* 1. Widget Nhiệm Vụ Hằng Ngày / Tiêu Điểm Nhanh */}
                    <DailyFocusWidget />

                    {/* 2. Widget Thống Kê Thợ Săn */}
                    <HunterStatisticsWidget />
                  </div>
                </div>

                {/* KHU VỰC C — DẢI MINI BXH BÊN MÉP PHẢI (Chỉ hiện trên màn hình lớn xl:flex) */}
                <RightMiniLeaderboardStrip />
              </div>
            </section>
          )}

          {/* On other tabs, show PlayerStatusCard for profile continuity */}
          {activeTab !== 'quests' && (
            <div className="mb-4">
              <PlayerStatusCard />
            </div>
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
        </main>
      </div>

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

      {/* Interactive FX */}
      <FloatingReward />
      <CoinBurstOverlay />
      <Toast />
    </div>
  );
};

export default App;
