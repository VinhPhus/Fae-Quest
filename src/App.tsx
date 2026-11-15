import React, { useEffect } from 'react';
import { useFaeQuestStore } from './store/useFaeQuestStore';
import { AuthScreen } from './components/auth/AuthScreen';
import { LeftSidebar } from './components/layout/LeftSidebar';
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
import { Toast } from './components/ui/Toast';
import { FloatingReward } from './components/ui/FloatingReward';
import { CoinBurstOverlay } from './components/ui/CoinBurstOverlay';
import { Sword } from 'lucide-react';

export const App: React.FC = () => {
  const {
    currentUser,
    authLoading,
    initAuth,
    activeTab,
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

  // Periodic 30s background check for inventory item lifecycle (auto-cleanup)
  useEffect(() => {
    cleanupExpiredInventory();
    const interval = setInterval(() => {
      cleanupExpiredInventory();
    }, 30000);
    return () => clearInterval(interval);
  }, [cleanupExpiredInventory]);

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

  return (
    <div className="thorn-pattern antialiased min-h-screen selection:bg-fae selection:text-thorn-dark flex flex-col md:flex-row">
      {/* 1. Collapsible Left Sidebar on Desktop / Bottom Navigation on Mobile */}
      <LeftSidebar />

      {/* 2. Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col pb-24 md:pb-12">
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-5">
          {/* Streamlined Profile Header Card */}
          <PlayerStatusCard />

          {/* Tab 1: Quests Module */}
          {activeTab === 'quests' && (
            <section className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Column: Add Task Form (4 cols) */}
                <div className="lg:col-span-4 lg:sticky lg:top-4">
                  <AddQuestForm />
                </div>

                {/* Right Column: Filters & Quest List (8 cols) */}
                <div className="lg:col-span-8 space-y-3.5">
                  <QuestFilterBar />
                  <QuestList />
                </div>
              </div>
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

      {/* Interactive FX */}
      <FloatingReward />
      <CoinBurstOverlay />
      <Toast />
    </div>
  );
};

export default App;
