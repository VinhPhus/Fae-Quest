import React, { useEffect } from 'react';
import { useFaeQuestStore } from './store/useFaeQuestStore';
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

export const App: React.FC = () => {
  const { activeTab, checkDailyReset, checkSystemMilestones } = useFaeQuestStore();

  useEffect(() => {
    checkDailyReset();
    checkSystemMilestones();
  }, [checkDailyReset, checkSystemMilestones]);

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
