import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import confetti from 'canvas-confetti';
import {
  Task,
  TaskCategory,
  TaskDifficulty,
  ShopItem,
  InventoryTicket,
  Rival,
  RankTier,
  ActiveTab,
  FloatingRewardItem,
  ToastMessage,
  SystemQuest,
  UserTitle,
} from '../types';
import { RANK_TIERS, getRankIndexByExp } from '../constants/ranks';
import { DIFFICULTIES } from '../constants/categories';
import {
  INITIAL_TASKS,
  INITIAL_SHOP_ITEMS,
  INITIAL_INVENTORY,
  INITIAL_RIVALS,
} from '../constants/initialData';
import { INITIAL_SYSTEM_QUESTS, SYSTEM_TITLES } from '../constants/systemQuests';
import { playSoundEffect } from '../utils/soundEffects';
import { triggerCoinBurst } from '../components/ui/CoinBurstOverlay';

interface FaeQuestState {
  playerName: string;
  avatarUrl: string;
  exp: number;
  coins: number;
  completedTotal: number;
  streakDays: number;
  lastActiveDate: string;
  soundEnabled: boolean;
  dailyCompletedCount: number;
  dailyBossCompletedCount: number;
  tasks: Task[];
  shopItems: ShopItem[];
  inventory: InventoryTicket[];
  rivals: Rival[];
  systemQuests: SystemQuest[];
  unlockedTitleIds: string[];
  equippedTitleId: string;
  focusSessionsCompleted: number;

  // UI state
  activeTab: ActiveTab;
  activeCategoryFilter: string;
  activeStatusFilter: string;
  rankUpData: { achievedTier: RankTier; bonusCoins: number } | null;
  isRoadmapOpen: boolean;
  isRenameOpen: boolean;
  isResetOpen: boolean;
  isSettingsOpen: boolean;
  isSidebarCollapsed: boolean;
  isAddShopItemOpen: boolean;
  isAddRivalOpen: boolean;
  activePomodoroTaskId: string | null;
  isOathOpen: boolean;
  confirmEarlyTask: { task: Task; coords?: { x: number; y: number } } | null;
  lastCompletedTimestamp: number;
  floatingRewards: FloatingRewardItem[];
  toasts: ToastMessage[];

  // Actions
  setPlayerName: (name: string) => void;
  setAvatarUrl: (url: string) => void;
  toggleSound: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  setCategoryFilter: (cat: string) => void;
  setStatusFilter: (status: string) => void;
  addTask: (title: string, category: TaskCategory, difficulty: TaskDifficulty, isDailyRecurring?: boolean, focusDuration?: number | null) => void;
  updateTaskFocusDuration: (taskId: string, duration: number) => void;
  toggleTask: (id: string, coords?: { x: number; y: number }, forceSkipAgeCheck?: boolean) => void;
  confirmEarlyTaskCompletion: () => void;
  cancelEarlyTaskConfirmation: () => void;
  deleteTask: (id: string) => void;
  completePomodoro: (taskId: string, elapsedMinutes?: number, targetMinutes?: number) => void;
  buyShopItem: (itemId: string, coords?: { x: number; y: number }) => void;
  addShopItem: (title: string, desc: string, cost: number, emoji: string) => void;
  deleteShopItem: (itemId: string) => void;
  useInventoryTicket: (ticketId: string) => void;
  simulateRivalActivity: () => void;
  addRival: (name: string, title: string, exp: number, avatar: string) => void;
  grantDemoBoost: (amount?: number) => void;
  closeRankUpModal: () => void;
  setRoadmapOpen: (open: boolean) => void;
  setRenameOpen: (open: boolean) => void;
  setResetOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setOathOpen: (open: boolean) => void;
  acceptOath: () => void;
  setConfirmEarlyTask: (data: { task: Task; coords?: { x: number; y: number } } | null) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAddShopItemOpen: (open: boolean) => void;
  setAddRivalOpen: (open: boolean) => void;
  setActivePomodoroTaskId: (id: string | null) => void;
  resetAllData: () => void;
  addToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
  checkDailyReset: () => void;
  checkInStreakQuest: (questId: string) => void;
  resetStreakQuest: (questId: string) => void;
  claimSystemQuestReward: (questId: string) => void;
  equipTitle: (titleId: string) => void;
  checkSystemMilestones: () => void;
}

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useFaeQuestStore = create<FaeQuestState>()(
  persist(
    (set, get) => ({
      playerName: 'Thợ Săn Fae',
      avatarUrl: '',
      exp: 110,
      coins: 25,
      completedTotal: 2,
      streakDays: 3,
      lastActiveDate: getTodayString(),
      soundEnabled: true,
      dailyCompletedCount: 0,
      dailyBossCompletedCount: 0,
      tasks: INITIAL_TASKS,
      shopItems: INITIAL_SHOP_ITEMS,
      inventory: INITIAL_INVENTORY,
      rivals: INITIAL_RIVALS,
      systemQuests: INITIAL_SYSTEM_QUESTS,
      unlockedTitleIds: ['title_tan_binh_gai_do'],
      equippedTitleId: 'title_tan_binh_gai_do',
      focusSessionsCompleted: 2,

      activeTab: 'quests',
      activeCategoryFilter: 'all',
      activeStatusFilter: 'all',
      rankUpData: null,
      isRoadmapOpen: false,
      isRenameOpen: false,
      isResetOpen: false,
      isSettingsOpen: false,
      isOathOpen: typeof window !== 'undefined' ? localStorage.getItem('faequest_oath_accepted') !== 'true' : false,
      confirmEarlyTask: null,
      lastCompletedTimestamp: 0,
      isSidebarCollapsed: false,
      isAddShopItemOpen: false,
      isAddRivalOpen: false,
      activePomodoroTaskId: null,
      floatingRewards: [],
      toasts: [],

      setPlayerName: (name: string) => {
        const trimmed = name.trim();
        if (trimmed) {
          set({ playerName: trimmed });
          get().addToast(`Đã đổi tên nhân vật thành "${trimmed}"`, 'success');
        }
      },

      setAvatarUrl: (url: string) => {
        set({ avatarUrl: url });
      },

      toggleSound: () => {
        const next = !get().soundEnabled;
        set({ soundEnabled: next });
        get().addToast(next ? 'Đã bật hiệu ứng âm thanh RPG' : 'Đã tắt âm thanh', 'info');
      },

      setActiveTab: (tab: ActiveTab) => set({ activeTab: tab }),

      setCategoryFilter: (cat: string) => set({ activeCategoryFilter: cat }),

      setStatusFilter: (status: string) => set({ activeStatusFilter: status }),

      addTask: (title, category, difficulty, isDailyRecurring = false, focusDuration = null) => {
        const trimmed = title.trim();
        if (!trimmed) return;

        const duration = focusDuration ? Math.min(180, Math.max(5, Number(focusDuration))) : null;

        const newTask: Task = {
          id: 'task_' + Date.now(),
          title: trimmed,
          category,
          difficulty,
          completed: false,
          rewardClaimed: false,
          isDailyRecurring,
          focusDuration: duration,
          pomodoroMinutes: duration,
          focusRewardClaimed: false,
          createdAt: Date.now(),
        };

        set((state) => ({
          tasks: [newTask, ...state.tasks],
        }));

        playSoundEffect('complete', get().soundEnabled);
        get().addToast('Đã khắc nhiệm vụ mới lên bảng!', 'success');
      },

      updateTaskFocusDuration: (taskId: string, duration: number) => {
        const clean = Math.min(180, Math.max(5, Number(duration) || 25));
        set((prev) => ({
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? { ...t, focusDuration: clean, pomodoroMinutes: clean } : t
          ),
        }));
      },

      toggleTask: (id: string, coords) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === id);
        if (!task) return;

        const diff = DIFFICULTIES[task.difficulty] || DIFFICULTIES.medium;
        const oldRankIdx = getRankIndexByExp(state.exp);
        const now = Date.now();

        if (!task.completed) {
          // Anti-Cheat 1: 3-second Cooldown between completions
          if (now - state.lastCompletedTimestamp < 3000) {
            playSoundEffect('warning', state.soundEnabled);
            get().addToast('⏳ Chậm lại nào Thợ Săn! Hãy nghỉ 3 giây trước khi nghiệm thu nhiệm vụ tiếp theo.', 'info');
            return;
          }

          // Anti-Cheat 2: Minimum Task Age (60 seconds)
          const taskAge = now - (task.createdAt || 0);
          if (taskAge < 60000) {
            playSoundEffect('warning', state.soundEnabled);
            get().addToast('⏳ Nhiệm vụ vừa được khắc lệnh chưa đầy 1 phút! Hãy thực hiện ít nhất 1 phút trước khi nghiệm thu.', 'info');
            return;
          }

          // Anti-Cheat 3: Daily Cap (Max 15 tasks/day with rewards)
          if (state.dailyCompletedCount >= 15) {
            playSoundEffect('warning', state.soundEnabled);
            get().addToast('🛡️ Đã đạt giới hạn 15 nhiệm vụ nhận thưởng trong ngày! Hãy nghỉ ngơi để bảo toàn thể lực.', 'info');
            return;
          }

          // Anti-Cheat 4: Daily Boss Cap (Max 2 Boss tasks/day)
          if (task.difficulty === 'boss' && state.dailyBossCompletedCount >= 2) {
            playSoundEffect('warning', state.soundEnabled);
            get().addToast('⚔️ Đã đạt giới hạn 2 nhiệm vụ Trùm Cuối hôm nay! Danh dự Thách Đấu không cho phép vắt kiệt sức.', 'info');
            return;
          }

          // Marking completed
          const streakBonusMultiplier = state.streakDays >= 3 ? 1.2 : 1.0;
          const awardedExp = Math.round(diff.exp * streakBonusMultiplier);
          const awardedCoins = diff.coins;

          const newExp = state.exp + awardedExp;
          const newCoins = state.coins + awardedCoins;
          const newRankIdx = getRankIndexByExp(newExp);

          // Update streak if needed
          const today = getTodayString();
          let newStreak = state.streakDays;
          if (state.lastActiveDate !== today) {
            newStreak = state.streakDays + 1;
          }

          // Check for Rank Up
          let rankUpBonus = 0;
          let newRankTier: RankTier | null = null;
          if (newRankIdx > oldRankIdx) {
            for (let i = oldRankIdx + 1; i <= newRankIdx; i++) {
              rankUpBonus += RANK_TIERS[i].coinBonus;
            }
            newRankTier = RANK_TIERS[newRankIdx];
          }

          const finalCoins = newCoins + rankUpBonus;

          // Spawn floating reward & coin particles
          if (coords) {
            triggerCoinBurst(coords.x, coords.y, 8);
            const rewardId = 'fl_' + Math.random().toString(36).substring(2, 9);
            const text = streakBonusMultiplier > 1
              ? `+${awardedExp} EXP (+20% Streak!)  •  +${awardedCoins} Xu`
              : `+${awardedExp} EXP  •  +${awardedCoins} Xu`;
            set((prev) => ({
              floatingRewards: [...prev.floatingRewards, { id: rewardId, x: coords.x, y: coords.y, text }],
            }));
            setTimeout(() => {
              set((prev) => ({
                floatingRewards: prev.floatingRewards.filter((r) => r.id !== rewardId),
              }));
            }, 1400);
          }

          set((prev) => ({
            exp: newExp,
            coins: finalCoins,
            completedTotal: prev.completedTotal + 1,
            dailyCompletedCount: prev.dailyCompletedCount + 1,
            dailyBossCompletedCount: task.difficulty === 'boss' ? prev.dailyBossCompletedCount + 1 : prev.dailyBossCompletedCount,
            streakDays: newStreak,
            lastActiveDate: today,
            lastCompletedTimestamp: now,
            tasks: prev.tasks.map((t) =>
              t.id === id
                ? {
                    ...t,
                    completed: true,
                    rewardClaimed: true,
                    completedAt: now,
                    lastAwardedExp: awardedExp,
                    lastAwardedCoins: awardedCoins,
                    lastRankUpBonus: rankUpBonus,
                  }
                : t
            ),
          }));

          get().checkSystemMilestones();

          if (newRankTier) {
            triggerCoinBurst(window.innerWidth / 2, window.innerHeight * 0.45, 18);
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#D97352', '#6850AD', '#6B0733', '#FFF5EE'],
              });
            } catch (e) {}
            playSoundEffect('rankup', state.soundEnabled);
            set({ rankUpData: { achievedTier: newRankTier, bonusCoins: rankUpBonus } });
          } else {
            playSoundEffect('complete', state.soundEnabled);
            get().addToast(`Hoàn thành! Nhận +${awardedExp} EXP và +${awardedCoins} Xu`, 'success');
          }
        } else {
          // Anti-Cheat: Uncheck Task - Check if coins are sufficient to revoke
          const streakBonusMultiplier = state.streakDays >= 3 ? 1.2 : 1.0;
          const defaultExp = Math.round(diff.exp * streakBonusMultiplier);
          const deductedExp = task.lastAwardedExp ?? defaultExp;
          const deductedCoins = (task.lastAwardedCoins ?? diff.coins) + (task.lastRankUpBonus ?? 0);

          if (state.coins < deductedCoins) {
            playSoundEffect('warning', state.soundEnabled);
            get().addToast(`⚠️ Không thể hoàn tác! Bạn đã tiêu hết số Xu thưởng của nhiệm vụ này (cần ${deductedCoins} Xu để thu hồi).`, 'error');
            return;
          }

          set((prev) => ({
            exp: Math.max(0, prev.exp - deductedExp),
            coins: Math.max(0, prev.coins - deductedCoins),
            completedTotal: Math.max(0, prev.completedTotal - 1),
            dailyCompletedCount: Math.max(0, prev.dailyCompletedCount - 1),
            dailyBossCompletedCount: task.difficulty === 'boss'
              ? Math.max(0, prev.dailyBossCompletedCount - 1)
              : prev.dailyBossCompletedCount,
            tasks: prev.tasks.map((t) =>
              t.id === id
                ? {
                    ...t,
                    completed: false,
                    rewardClaimed: false,
                    completedAt: undefined,
                    lastAwardedExp: undefined,
                    lastAwardedCoins: undefined,
                    lastRankUpBonus: undefined,
                  }
                : t
            ),
          }));

          get().addToast(`Đã hoàn tác nhiệm vụ (-${deductedExp} EXP, -${deductedCoins} Xu)`, 'info');
        }
      },

      deleteTask: (id: string) => {
        set((prev) => ({
          tasks: prev.tasks.filter((t) => t.id !== id),
        }));
        get().addToast('Đã xóa nhiệm vụ khỏi danh sách', 'info');
      },

      completePomodoro: (taskId: string, elapsedMinutes?: number, targetMinutes?: number) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        const target = targetMinutes || task.focusDuration || 25;
        const maxFocusExp = Math.round(target * 1);
        const maxFocusCoins = Math.max(1, Math.floor(target * 0.4));

        let earnedFocusExp = maxFocusExp;
        let earnedFocusCoins = maxFocusCoins;

        if (elapsedMinutes !== undefined && elapsedMinutes < target) {
          const ratio = Math.min(1, Math.max(0, elapsedMinutes / target));
          earnedFocusExp = Math.max(1, Math.floor(maxFocusExp * ratio));
          earnedFocusCoins = Math.max(1, Math.floor(maxFocusCoins * ratio));
        }

        // If focus reward was already claimed today for this task, focus bonus is 0
        if (task.focusRewardClaimed) {
          earnedFocusExp = 0;
          earnedFocusCoins = 0;
        }

        // Task base rewards (if task is not already completed)
        const diff = DIFFICULTIES[task.difficulty] || DIFFICULTIES.medium;
        const streakBonusMultiplier = state.streakDays >= 3 ? 1.2 : 1.0;
        const isAlreadyCompleted = Boolean(task.completed);
        const taskExp = !isAlreadyCompleted ? Math.round(diff.exp * streakBonusMultiplier) : 0;
        const taskCoins = !isAlreadyCompleted ? diff.coins : 0;

        const totalExp = taskExp + earnedFocusExp;
        const totalCoins = taskCoins + earnedFocusCoins;

        const oldRankIdx = getRankIndexByExp(state.exp);
        const newExp = state.exp + totalExp;
        const newRankIdx = getRankIndexByExp(newExp);

        let rankUpBonus = 0;
        let newRankTier: RankTier | null = null;
        if (newRankIdx > oldRankIdx) {
          for (let i = oldRankIdx + 1; i <= newRankIdx; i++) {
            rankUpBonus += RANK_TIERS[i].coinBonus;
          }
          newRankTier = RANK_TIERS[newRankIdx];
        }

        const finalCoins = state.coins + totalCoins + rankUpBonus;
        const today = getTodayString();
        const now = Date.now();
        let newStreak = state.streakDays;
        if (state.lastActiveDate !== today) {
          newStreak = state.streakDays + 1;
        }

        set((prev) => ({
          exp: newExp,
          coins: finalCoins,
          activePomodoroTaskId: null,
          completedTotal: !isAlreadyCompleted ? prev.completedTotal + 1 : prev.completedTotal,
          dailyCompletedCount: !isAlreadyCompleted ? prev.dailyCompletedCount + 1 : prev.dailyCompletedCount,
          dailyBossCompletedCount:
            !isAlreadyCompleted && task.difficulty === 'boss'
              ? prev.dailyBossCompletedCount + 1
              : prev.dailyBossCompletedCount,
          focusSessionsCompleted: prev.focusSessionsCompleted + 1,
          streakDays: newStreak,
          lastActiveDate: today,
          lastCompletedTimestamp: now,
          tasks: prev.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  completed: true,
                  rewardClaimed: true,
                  focusRewardClaimed: true,
                  completedAt: now,
                  lastAwardedExp: taskExp,
                  lastAwardedCoins: taskCoins,
                  lastRankUpBonus: rankUpBonus,
                }
              : t
          ),
        }));

        get().checkSystemMilestones();

        triggerCoinBurst(window.innerWidth / 2, window.innerHeight * 0.45, 16);

        if (newRankTier) {
          try {
            confetti({
              particleCount: 90,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#D97352', '#6850AD', '#6B0733', '#FFF5EE'],
            });
          } catch (e) {}
          playSoundEffect('rankup', state.soundEnabled);
          set({ rankUpData: { achievedTier: newRankTier, bonusCoins: rankUpBonus } });
        } else {
          playSoundEffect('complete', state.soundEnabled);
        }

        get().addToast(
          `🎉 Tuyệt vời! Đã hoàn thành nhiệm vụ & phiên Focus: Nhận tổng +${totalExp} EXP và +${totalCoins} Xu Vàng!`,
          'success'
        );
      },

      buyShopItem: (itemId: string, coords) => {
        const state = get();
        const item = state.shopItems.find((i) => i.id === itemId);
        if (!item) return;

        if (state.coins < item.cost) {
          get().addToast(`Bạn cần thêm ${item.cost - state.coins} Xu nữa để mua "${item.title}"!`, 'error');
          return;
        }

        const newTicket: InventoryTicket = {
          id: 'inv_' + Date.now(),
          title: item.title,
          emoji: item.emoji,
          cost: item.cost,
          redeemedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' hôm nay',
          used: false,
        };

        if (coords) {
          const rewardId = 'fl_' + Math.random().toString(36).substring(2, 9);
          set((prev) => ({
            floatingRewards: [
              ...prev.floatingRewards,
              { id: rewardId, x: coords.x, y: coords.y, text: `Đã đổi ${item.emoji} -${item.cost} Xu` },
            ],
          }));
          setTimeout(() => {
            set((prev) => ({
              floatingRewards: prev.floatingRewards.filter((r) => r.id !== rewardId),
            }));
          }, 1400);
        }

        set((prev) => ({
          coins: prev.coins - item.cost,
          inventory: [newTicket, ...prev.inventory],
        }));

        playSoundEffect('coin', state.soundEnabled);
        get().addToast(`Đã đổi "${item.title}"! Kiểm tra trong Kho Phần Thưởng nhé.`, 'success');
      },

      addShopItem: (title, desc, cost, emoji) => {
        const newItem: ShopItem = {
          id: 'shop_' + Date.now(),
          title: title.trim(),
          desc: desc.trim(),
          cost: Math.max(1, cost),
          emoji: emoji || '🎁',
        };
        set((prev) => ({
          shopItems: [...prev.shopItems, newItem],
          isAddShopItemOpen: false,
        }));
        get().addToast(`Đã thêm món quà "${newItem.title}" vào Cửa Hàng!`, 'success');
      },

      deleteShopItem: (itemId: string) => {
        set((prev) => ({
          shopItems: prev.shopItems.filter((i) => i.id !== itemId),
        }));
        get().addToast('Đã xóa món quà khỏi Cửa Hàng', 'info');
      },

      useInventoryTicket: (ticketId: string) => {
        set((prev) => ({
          inventory: prev.inventory.map((t) => (t.id === ticketId ? { ...t, used: true } : t)),
        }));
        playSoundEffect('complete', get().soundEnabled);
        get().addToast('Đã đánh dấu sử dụng phần thưởng ngoài đời thực!', 'success');
      },

      simulateRivalActivity: () => {
        const state = get();
        const updated = state.rivals.map((r) => {
          const randomGain = Math.floor(Math.random() * 41) + 10; // 10 to 50 EXP
          return { ...r, exp: r.exp + randomGain };
        });

        set({ rivals: updated });
        playSoundEffect('complete', state.soundEnabled);
        get().addToast('Các đối thủ vừa hoàn thành nhiệm vụ và gia tăng EXP!', 'info');
      },

      addRival: (name, title, exp, avatar) => {
        const newRival: Rival = {
          id: 'rival_' + Date.now(),
          name: name.trim(),
          title: title.trim(),
          exp: Math.max(0, exp),
          avatar: avatar || '⚔️',
        };

        set((prev) => ({
          rivals: [...prev.rivals, newRival],
          isAddRivalOpen: false,
        }));

        get().addToast(`Đã triệu hồi chiến binh "${newRival.name}" vào bảng xếp hạng!`, 'success');
      },

      grantDemoBoost: (amount = 150) => {
        const state = get();
        const oldRankIdx = getRankIndexByExp(state.exp);
        const newExp = state.exp + amount;
        const newRankIdx = getRankIndexByExp(newExp);

        let rankUpBonus = 0;
        let newRankTier: RankTier | null = null;
        if (newRankIdx > oldRankIdx) {
          for (let i = oldRankIdx + 1; i <= newRankIdx; i++) {
            rankUpBonus += RANK_TIERS[i].coinBonus;
          }
          newRankTier = RANK_TIERS[newRankIdx];
        }

        const newCoins = state.coins + rankUpBonus;

        set({
          exp: newExp,
          coins: newCoins,
        });

        if (newRankTier) {
          triggerCoinBurst(window.innerWidth / 2, window.innerHeight * 0.45, 18);
          try {
            confetti({
              particleCount: 90,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#D97352', '#6850AD', '#6B0733', '#FFF5EE'],
            });
          } catch (e) {}
          playSoundEffect('rankup', state.soundEnabled);
          set({ rankUpData: { achievedTier: newRankTier, bonusCoins: rankUpBonus } });
        } else {
          playSoundEffect('complete', state.soundEnabled);
          get().addToast(`Đã cộng thử +${amount} EXP!`, 'success');
        }
      },

      closeRankUpModal: () => set({ rankUpData: null }),

      setRoadmapOpen: (open: boolean) => set({ isRoadmapOpen: open }),
      setRenameOpen: (open: boolean) => set({ isRenameOpen: open }),
      setResetOpen: (open: boolean) => set({ isResetOpen: open }),
      setSettingsOpen: (open: boolean) => set({ isSettingsOpen: open }),
      setOathOpen: (open: boolean) => set({ isOathOpen: open }),
      acceptOath: () => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('faequest_oath_accepted', 'true');
        }
        set({ isOathOpen: false });
        playSoundEffect('complete', get().soundEnabled);
        get().addToast('Chào mừng Thợ Săn! Khế ước danh dự đã được thiết lập.', 'success');
      },
      setConfirmEarlyTask: (data) => set({ confirmEarlyTask: data }),
      confirmEarlyTaskCompletion: () => {
        const early = get().confirmEarlyTask;
        if (early) {
          set({ confirmEarlyTask: null });
          get().toggleTask(early.task.id, early.coords, true);
        }
      },
      cancelEarlyTaskConfirmation: () => set({ confirmEarlyTask: null }),
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed: boolean) => set({ isSidebarCollapsed: collapsed }),
      setAddShopItemOpen: (open: boolean) => set({ isAddShopItemOpen: open }),
      setAddRivalOpen: (open: boolean) => set({ isAddRivalOpen: open }),
      setActivePomodoroTaskId: (id: string | null) => set({ activePomodoroTaskId: id }),

      resetAllData: () => {
        set({
          playerName: 'Thợ Săn Fae',
          avatarUrl: '',
          exp: 110,
          coins: 25,
          completedTotal: 2,
          streakDays: 1,
          dailyCompletedCount: 0,
          dailyBossCompletedCount: 0,
          lastActiveDate: getTodayString(),
          tasks: INITIAL_TASKS,
          shopItems: INITIAL_SHOP_ITEMS,
          inventory: INITIAL_INVENTORY,
          rivals: INITIAL_RIVALS,
          systemQuests: INITIAL_SYSTEM_QUESTS,
          unlockedTitleIds: ['title_tan_binh_gai_do'],
          equippedTitleId: 'title_tan_binh_gai_do',
          focusSessionsCompleted: 0,
          isResetOpen: false,
          isSettingsOpen: false,
        });
        get().addToast('Đã khởi tạo lại toàn bộ dữ liệu ban đầu!', 'info');
      },

      checkInStreakQuest: (questId: string) => {
        const state = get();
        const quest = state.systemQuests.find((q) => q.id === questId);
        if (!quest || quest.type !== 'streak_counter') return;

        const today = getTodayString();

        if (quest.lastResetDate === today) {
          get().addToast('Hôm nay bạn đã Reset bộ đếm này. Hãy quay lại điểm danh sau 00:00 đêm nay nhé!', 'info');
          return;
        }

        if (quest.lastCheckInDate === today) {
          get().addToast('Hôm nay bạn đã điểm danh thử thách này rồi! Hãy quay lại vào ngày mai.', 'info');
          return;
        }

        const nextStreak = (quest.currentStreak || 0) + 1;
        const isCompleted = nextStreak >= (quest.targetDays || 1);

        const updatedQuests = state.systemQuests.map((q) => {
          if (q.id === questId) {
            return {
              ...q,
              currentStreak: nextStreak,
              lastCheckInDate: today,
              isCompleted: isCompleted,
            };
          }
          return q;
        });

        set({ systemQuests: updatedQuests });
        playSoundEffect('complete', state.soundEnabled);
        triggerCoinBurst(window.innerWidth / 2, window.innerHeight * 0.45, 6);

        if (isCompleted) {
          playSoundEffect('rankup', state.soundEnabled);
          get().addToast(`🔥 XUẤT SẮC! Hoàn thành chuỗi ${quest.targetDays} ngày của "${quest.title}"! Hãy nhận thưởng!`, 'success');
        } else {
          get().addToast(`🔥 Điểm danh thành công ngày ${nextStreak}/${quest.targetDays}! Giữ vững ngọn lửa kỷ luật!`, 'success');
        }
      },

      resetStreakQuest: (questId: string) => {
        const state = get();
        const today = getTodayString();
        const updatedQuests = state.systemQuests.map((q) => {
          if (q.id === questId) {
            return {
              ...q,
              currentStreak: 0,
              lastCheckInDate: '',
              lastResetDate: today,
              isCompleted: false,
              isRewardClaimed: false,
            };
          }
          return q;
        });
        set({ systemQuests: updatedQuests });
        playSoundEffect('warning', state.soundEnabled);
        get().addToast(
          '🔄 Đã đưa bộ đếm về Ngày 0! Vì hôm nay bạn đã Reset, hãy chấn chỉnh lại tinh thần và bắt đầu điểm danh Ngày 1 sau 00:00 đêm nay.',
          'info'
        );
      },

      claimSystemQuestReward: (questId: string) => {
        const state = get();
        const quest = state.systemQuests.find((q) => q.id === questId);
        if (!quest || !quest.isCompleted || quest.isRewardClaimed) return;

        const newExp = state.exp + quest.expReward;
        const newCoins = state.coins + quest.coinReward;
        const unlockedTitleIds = state.unlockedTitleIds.includes(quest.rewardTitleId)
          ? state.unlockedTitleIds
          : [...state.unlockedTitleIds, quest.rewardTitleId];

        const updatedQuests = state.systemQuests.map((q) => {
          if (q.id === questId) {
            return {
              ...q,
              isRewardClaimed: true,
            };
          }
          return q;
        });

        set({
          exp: newExp,
          coins: newCoins,
          unlockedTitleIds,
          systemQuests: updatedQuests,
        });

        playSoundEffect('rankup', state.soundEnabled);
        triggerCoinBurst(window.innerWidth / 2, window.innerHeight * 0.45, 16);
        try {
          confetti({
            particleCount: 75,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#D97352', '#6850AD', '#6B0733', '#FFF5EE'],
          });
        } catch (e) {}

        get().addToast(
          `🎉 Nhận thưởng thành công: +${quest.expReward} EXP, +${quest.coinReward} Xu và mở khóa Danh hiệu "${quest.rewardTitleName}"!`,
          'success'
        );
      },

      equipTitle: (titleId: string) => {
        const state = get();
        if (!state.unlockedTitleIds.includes(titleId)) {
          get().addToast('Danh hiệu này chưa được mở khóa!', 'error');
          return;
        }
        const titleInfo = SYSTEM_TITLES[titleId];
        set({ equippedTitleId: titleId });
        playSoundEffect('click', state.soundEnabled);
        get().addToast(`Đã trang bị danh hiệu "${titleInfo?.name || titleId}"!`, 'success');
      },

      checkSystemMilestones: () => {
        const state = get();
        const currentRankIdx = getRankIndexByExp(state.exp);

        let hasNewCompleted = false;
        const updatedQuests = state.systemQuests.map((q) => {
          if (q.type !== 'milestone') return q;

          let isAchieved = false;
          if (q.milestoneKey === 'completedTasks') {
            isAchieved = state.completedTotal >= (q.targetMilestone || 0);
          } else if (q.milestoneKey === 'focusSessions') {
            isAchieved = state.focusSessionsCompleted >= (q.targetMilestone || 0);
          } else if (q.milestoneKey === 'rankIdx') {
            isAchieved = currentRankIdx >= (q.targetMilestone || 0);
          }

          if (isAchieved && !q.isCompleted) {
            hasNewCompleted = true;
            return { ...q, isCompleted: true };
          }
          return q;
        });

        if (hasNewCompleted) {
          set({ systemQuests: updatedQuests });
          playSoundEffect('complete', state.soundEnabled);
          get().addToast('🎖️ Bạn vừa hoàn thành một Cột Mốc Thành Tựu! Hãy vào nhận thưởng!', 'success');
        }
      },

      addToast: (text, type = 'info') => {
        const id = 'toast_' + Math.random().toString(36).substring(2, 9);
        set((prev) => ({
          toasts: [...prev.toasts, { id, text, type }],
        }));
        setTimeout(() => {
          set((prev) => ({
            toasts: prev.toasts.filter((t) => t.id !== id),
          }));
        }, 3500);
      },

      removeToast: (id: string) => {
        set((prev) => ({
          toasts: prev.toasts.filter((t) => t.id !== id),
        }));
      },

      checkDailyReset: () => {
        const state = get();
        const today = getTodayString();
        if (state.lastActiveDate !== today) {
          // It's a new day! Reset daily recurring tasks, focus reward claim limits, and daily caps
          const updatedTasks = state.tasks.map((task) => ({
            ...task,
            focusRewardClaimed: false,
            completed: task.isDailyRecurring ? false : task.completed,
            completedAt: task.isDailyRecurring ? undefined : task.completedAt,
          }));
          set({
            tasks: updatedTasks,
            dailyCompletedCount: 0,
            dailyBossCompletedCount: 0,
            lastActiveDate: today,
          });
        }
      },
    }),
    {
      name: 'faequest_rpg_todo_storage_v2',
      partialize: (state) => ({
        playerName: state.playerName,
        avatarUrl: state.avatarUrl,
        exp: state.exp,
        coins: state.coins,
        completedTotal: state.completedTotal,
        streakDays: state.streakDays,
        dailyCompletedCount: state.dailyCompletedCount,
        dailyBossCompletedCount: state.dailyBossCompletedCount,
        lastActiveDate: state.lastActiveDate,
        soundEnabled: state.soundEnabled,
        tasks: state.tasks,
        shopItems: state.shopItems,
        inventory: state.inventory,
        rivals: state.rivals,
        systemQuests: state.systemQuests,
        unlockedTitleIds: state.unlockedTitleIds,
        equippedTitleId: state.equippedTitleId,
        focusSessionsCompleted: state.focusSessionsCompleted,
      }),
    }
  )
);
