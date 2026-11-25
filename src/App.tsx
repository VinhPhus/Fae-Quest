import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from './store/useFaeQuestStore';
import { AuthScreen } from './components/auth/AuthScreen';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { TopBentoHeader } from './components/layout/TopBentoHeader';
import { ProfileHeader, ProfileView } from './components/profile/ProfileView';
import { QuestBentoGrid } from './components/bento/QuestBentoGrid';
import { FocusFloatingBar } from './components/quests/FocusFloatingBar';
import { RightMiniLeaderboardStrip } from './components/bento/RightMiniLeaderboardStrip';
import { CreateQuestDrawer } from './components/modals/CreateQuestDrawer';
import { EditQuestModal } from './components/modals/EditQuestModal';
import { SystemQuestsHeader, SystemQuestsView } from './components/system-quests/SystemQuestsView';
import { PomodoroTimerModal } from './components/quests/PomodoroTimerModal';
import { RewardShopHeader, RewardShopGrid } from './components/shop/RewardShopGrid';
import { AddShopItemModal } from './components/shop/AddShopItemModal';
import { InventoryHeader, InventoryList } from './components/shop/InventoryList';
import { ChroniclesHeader, ChroniclesView } from './components/chronicles/ChroniclesView';
import { LeaderboardHeader, LeaderboardTable } from './components/leaderboard/LeaderboardTable';
import { ProductivityAnalyticsHeader, ProductivityAnalytics } from './components/analytics/ProductivityAnalytics';
import { RankUpModal } from './components/modals/RankUpModal';
import { StreakCelebrationModal } from './components/modals/StreakCelebrationModal';
import { RewardPopupOverlay } from './components/modals/RewardPopupOverlay';
import { RankRoadmapModal } from './components/modals/RankRoadmapModal';
import { RenameModal } from './components/modals/RenameModal';
import { ResetModal } from './components/modals/ResetModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { HuntersOathModal } from './components/modals/HuntersOathModal';
import { UserInboxModal } from './components/modals/UserInboxModal';
import { AdminWarningModal } from './components/modals/AdminWarningModal';
import { ChangeCoverModal } from './components/modals/ChangeCoverModal';
import { RivalProfileModal } from './components/modals/RivalProfileModal';
import { SeasonAnnouncementsModal } from './components/modals/SeasonAnnouncementsModal';
import { SeasonResetModal } from './components/modals/SeasonResetModal';
import { AdminPortalHeader, AdminPortalView } from './components/admin/AdminPortalView';
import { ChillyHealingView } from './components/chilly/ChillyHealingView';
import { ChillyGlobalAudioHost } from './components/chilly/ChillyGlobalAudioHost';
import { BannedScreen } from './components/auth/BannedScreen';
import { Toast } from './components/ui/Toast';
import { FloatingReward } from './components/ui/FloatingReward';
import { CoinBurstOverlay } from './components/ui/CoinBurstOverlay';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { useFocusTimer } from './hooks/useFocusTimer';
import { PAGE_VARIANTS, EASING_SPRING } from './constants/motion';
import { startOnboardingTour } from './utils/onboardingTour';

export const App: React.FC = () => {
  useRealtimeSync();
  useFocusTimer();

  const {
    currentUser,
    authLoading,
    initAuth,
    activeTab,
    hasSeenTutorial,
    isOathOpen,
    bannedUntil,
    checkDailyReset,
    checkSystemMilestones,
    cleanupExpiredInventory,
  } = useFaeQuestStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    const retryAuth = () => {
      const state = useFaeQuestStore.getState();
      if (!state.currentUser && !state.authLoading) void state.initAuth();
    };
    window.addEventListener('online', retryAuth);
    return () => window.removeEventListener('online', retryAuth);
  }, []);

  // Lưu trữ sự kiện cài đặt PWA (beforeinstallprompt) ở cấp độ toàn cục ngay khi trang tải
  useEffect(() => {
    const checkStandalone = () => {
      try {
        const isStandalone =
          Boolean(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
          (window.navigator as any).standalone === true;
        useFaeQuestStore.getState().setIsAppStandalone(isStandalone);
      } catch {
        useFaeQuestStore.getState().setIsAppStandalone(false);
      }
    };

    checkStandalone();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      useFaeQuestStore.getState().setDeferredInstallPrompt(e);
      (window as any).__faequest_install_prompt = e;
    };

    const handleAppInstalled = () => {
      useFaeQuestStore.getState().setIsAppStandalone(true);
      useFaeQuestStore.getState().setDeferredInstallPrompt(null);
      (window as any).__faequest_install_prompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const hasCheckedAutoTourRef = useRef(false);

  // Tự động kích hoạt chuỗi hướng dẫn tân thủ duy nhất một lần cho account mới tạo sau khi hoàn tất Khế Ước Thợ Săn
  useEffect(() => {
    if (hasCheckedAutoTourRef.current) return;

    if (!authLoading && currentUser?.id && !isOathOpen) {
      const userId = currentUser.id;
      const isLocallySeen =
        localStorage.getItem(`faequest_tour_seen_${userId}`) === 'true' ||
        localStorage.getItem(`faequest_tour_completed_${userId}`) === 'true';

      // Điều kiện kích hoạt tự động: chưa từng xem trên DB/store và chưa có cờ trong localStorage
      if (!hasSeenTutorial && !isLocallySeen) {
        hasCheckedAutoTourRef.current = true;
        const timer = setTimeout(() => {
          startOnboardingTour(false);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        hasCheckedAutoTourRef.current = true;
      }
    }
  }, [currentUser, authLoading, hasSeenTutorial, isOathOpen]);

  useEffect(() => {
    if (currentUser) {
      checkDailyReset();
      checkSystemMilestones();
      cleanupExpiredInventory();
      // Tự động kiểm tra điểm danh & chuỗi ngày mới khi đăng nhập
      useFaeQuestStore.getState().syncDailyLoginStreak(currentUser.id);
      // Tự động đồng bộ nhẹ lên Supabase khi khởi chạy ứng dụng
      useFaeQuestStore.getState().syncToCloud(true);
    }
  }, [currentUser, checkDailyReset, checkSystemMilestones, cleanupExpiredInventory]);

  // Periodic 30s background check for inventory item lifecycle (auto-cleanup), daily reset & streak
  useEffect(() => {
    cleanupExpiredInventory();
    checkDailyReset();
    const currUser = useFaeQuestStore.getState().currentUser;
    if (currUser) {
      useFaeQuestStore.getState().syncDailyLoginStreak(currUser.id);
    }
    const interval = setInterval(() => {
      cleanupExpiredInventory();
      checkDailyReset();
      const user = useFaeQuestStore.getState().currentUser;
      if (user) {
        useFaeQuestStore.getState().syncDailyLoginStreak(user.id);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [cleanupExpiredInventory, checkDailyReset]);

  // Tự động kích hoạt khi người dùng quay lại ứng dụng (visibilitychange & focus)
  useEffect(() => {
    const handleAppResume = () => {
      if (document.visibilityState === 'visible') {
        checkDailyReset();
        const user = useFaeQuestStore.getState().currentUser;
        if (user) {
          useFaeQuestStore.getState().syncDailyLoginStreak(user.id);
        }
      }
    };
    document.addEventListener('visibilitychange', handleAppResume);
    window.addEventListener('focus', handleAppResume);
    return () => {
      document.removeEventListener('visibilitychange', handleAppResume);
      window.removeEventListener('focus', handleAppResume);
    };
  }, [checkDailyReset]);

  // Bộ hẹn giờ đúng mốc 00:00:02 đêm để tự động nhảy chuỗi & reset nhiệm vụ mà không cần F5
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    const scheduleMidnightStreak = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
      const msUntilMidnight = Math.max(1000, tomorrow.getTime() - now.getTime());

      timerId = setTimeout(() => {
        checkDailyReset();
        const user = useFaeQuestStore.getState().currentUser;
        if (user) {
          useFaeQuestStore.getState().syncDailyLoginStreak(user.id);
        }
        scheduleMidnightStreak();
      }, msUntilMidnight);
    };

    scheduleMidnightStreak();
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [checkDailyReset]);

  // Clean up inventory whenever switching tabs
  useEffect(() => {
    cleanupExpiredInventory();
  }, [activeTab, cleanupExpiredInventory]);

  // Loading state while checking authentication session
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-thorn-dark thorn-pattern p-4">
        <div className="relative flex flex-col items-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-[#06141B] overflow-hidden border-2 border-[#4A5C6A] flex items-center justify-center shadow-[0_0_35px_rgba(204,208,207,0.35)] rank-pulse-fx relative p-1.5">
            <img
              src="/assets/logo.png"
              alt="FaeQuest Logo"
              className="w-full h-full object-contain [image-rendering:pixelated]"
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
    <div className="thorn-pattern antialiased min-h-screen md:h-screen md:overflow-hidden selection:bg-fae selection:text-thorn-dark flex flex-col md:flex-row bg-[#06141B] overflow-x-clip max-w-[100vw]">
      {/* 1. Collapsible Left Sidebar on Desktop / Bottom Navigation on Mobile */}
      <LeftSidebar />

      {/* 2. Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col h-auto md:h-screen overflow-visible md:overflow-hidden bg-[#06141B] overflow-x-clip max-w-[100vw]">
        {/* Phân vùng 1: Top Sticky Section (Hồ Sơ & Header - Giữ cố định trên Desktop) */}
        <motion.header
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.05, ease: EASING_SPRING }}
          className="relative md:flex-shrink-0 md:z-20 bg-[#06141B] px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-3 md:pb-4 border-b border-[#253745]/40 md:shadow-[0_8px_30px_rgba(6,20,27,0.85)]"
        >
          <div className="max-w-7xl w-full mx-auto space-y-3">
            {/* Top Bento Header with Greeting, Search, and Quick Actions */}
            <TopBentoHeader />

            {/* Dedicated Top Profile / Banner per Active Tab (Quests is streamlined, no huge card) */}
            {activeTab === 'system-quests' && <SystemQuestsHeader />}
            {(activeTab === 'shop' || activeTab === 'inventory') && <RewardShopHeader />}
            {activeTab === 'leaderboard' && <LeaderboardHeader />}
            {activeTab === 'chronicles' && <ChroniclesHeader />}
            {activeTab === 'profile' && <ProfileHeader />}
            {activeTab === 'analytics' && <ProductivityAnalyticsHeader />}
            {activeTab === 'admin' && <AdminPortalHeader />}
          </div>
        </motion.header>

        {/* Phân vùng 2: Scrollable Content Section (Cuộn độc lập) */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1, ease: EASING_SPRING }}
          className="flex-1 overflow-visible md:overflow-y-auto px-3 sm:px-6 lg:px-8 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-8 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#06141B] [&::-webkit-scrollbar-thumb]:bg-[#253745] hover:[&::-webkit-scrollbar-thumb]:bg-[#4A5C6A] [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          <div className="max-w-7xl w-full mx-auto space-y-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={PAGE_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {/* Tab 1: Bento Dashboard (Quests Module) - Streamlined, elevated task grid */}
                {activeTab === 'quests' && (
                  <section className="space-y-5 sm:space-y-6">
                    {/* Nhiệm Vụ Chinh Phục (Lưới Thẻ Bento) */}
                    <QuestBentoGrid />
                  </section>
                )}

                {/* Tab 2: Leaderboard Module */}
                {activeTab === 'leaderboard' && (
                  <section>
                    <LeaderboardTable />
                  </section>
                )}

                {/* Tab 3: Unified Shop & Inventory Module */}
                {(activeTab === 'shop' || activeTab === 'inventory') && (
                  <section>
                    <RewardShopGrid />
                  </section>
                )}

                {/* Tab 4: Hunter Chronicles Module */}
                {activeTab === 'chronicles' && (
                  <section>
                    <ChroniclesView />
                  </section>
                )}

                {/* Tab 5: System Quests & Titles Module */}
                {activeTab === 'system-quests' && (
                  <section>
                    <SystemQuestsView />
                  </section>
                )}

                {/* Tab 6: Profile & Reputation Module */}
                {activeTab === 'profile' && (
                  <section>
                    <ProfileView />
                  </section>
                )}

                {/* Fallback Tab: Analytics Module */}
                {activeTab === 'analytics' && (
                  <section>
                    <ProductivityAnalytics />
                  </section>
                )}

                {/* Tab: Chilly Healing Module */}
                {activeTab === 'chilly-healing' && (
                  <section>
                    <ChillyHealingView />
                  </section>
                )}

                {/* Tab: Admin Live-Ops Portal */}
                {activeTab === 'admin' && (
                  <section>
                    <AdminPortalView />
                  </section>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.main>
      </div>

      {/* 3. Khóa Cố Định Dải Mini BXH (Fixed Right Sidebar trên xl:flex) */}
      {activeTab === 'quests' && <RightMiniLeaderboardStrip />}

      {/* Modals & Overlays */}
      <RewardPopupOverlay />
      <RankUpModal />
      <StreakCelebrationModal />
      <RankRoadmapModal />
      <ChillyGlobalAudioHost />
      <AddShopItemModal />
      <RenameModal />
      <ResetModal />
      <SettingsModal />
      <PomodoroTimerModal />
      <HuntersOathModal />
      <CreateQuestDrawer />
      <EditQuestModal />
      <UserInboxModal />
      <AdminWarningModal />
      <ChangeCoverModal />
      <RivalProfileModal />
      <SeasonAnnouncementsModal />
      <SeasonResetModal />

      {/* Global Focus Floating Bar */}
      <FocusFloatingBar />

      {/* Interactive FX */}
      <FloatingReward />
      <CoinBurstOverlay />
      <Toast />
    </div>
  );
};

export default App;
