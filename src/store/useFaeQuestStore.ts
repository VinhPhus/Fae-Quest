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
  HunterUser,
  UserRole,
  SystemShopItem,
  SystemAchievement,
  UserMessage,
} from '../types';
import { supabase } from '../utils/supabaseClient';
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
import {
  syncProfileAndStateToCloud,
  restoreUserStateFromCloud,
  getOrInitHunterId,
  setStoredHunterId,
  UserStateCloud,
} from '../utils/syncManager';

export const MAX_INVENTORY_SLOTS = 50;

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

  // Supabase Auth & Cloud Sync
  currentUser: HunterUser | null;
  authLoading: boolean;
  hunterId: string;
  cloudSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt?: string;

  // Admin Live-Ops Portal & User Messages
  userRole: UserRole;
  bannedUntil: string | null;
  banReason: string | null;
  adminPortalTab: 'users' | 'shop' | 'achievements' | 'analytics';
  systemShopItems: SystemShopItem[];
  systemAchievements: SystemAchievement[];
  userMessages: UserMessage[];
  unreadMessagesCount: number;
  isUserInboxOpen: boolean;
  activeWarningMessage: UserMessage | null;

  // UI state
  activeTab: ActiveTab;
  activeCategoryFilter: string;
  activeStatusFilter: string;
  rankUpData: { achievedTier: RankTier; bonusCoins: number } | null;
  searchQuery: string;
  isCreateQuestOpen: boolean;
  questViewMode: 'bento' | 'list';
  isRoadmapOpen: boolean;
  isRenameOpen: boolean;
  isResetOpen: boolean;
  isSettingsOpen: boolean;
  isSidebarCollapsed: boolean;
  language: string;
  isAddShopItemOpen: boolean;
  isAddRivalOpen: boolean;
  activePomodoroTaskId: string | null;
  isOathOpen: boolean;
  confirmEarlyTask: { task: Task; coords?: { x: number; y: number } } | null;
  lastCompletedTimestamp: number;
  floatingRewards: FloatingRewardItem[];
  toasts: ToastMessage[];

  // Actions
  setUserRole: (role: UserRole) => void;
  setAdminPortalTab: (tab: 'users' | 'shop' | 'achievements' | 'analytics') => void;
  setUserInboxOpen: (open: boolean) => void;
  setActiveWarningMessage: (msg: UserMessage | null) => void;
  fetchUserMessages: () => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  markAllMessagesAsRead: () => Promise<void>;
  fetchSystemShopItems: () => Promise<void>;
  addSystemShopItem: (item: Omit<SystemShopItem, 'id' | 'created_at'>) => Promise<boolean>;
  updateSystemShopItem: (id: string, item: Partial<SystemShopItem>) => Promise<boolean>;
  deleteSystemShopItem: (id: string) => Promise<boolean>;
  fetchSystemAchievements: () => Promise<void>;
  addSystemAchievement: (achievement: Omit<SystemAchievement, 'id' | 'created_at'>) => Promise<boolean>;
  deleteSystemAchievement: (id: string) => Promise<boolean>;
  adminSendMail: (receiverId: string, subject: string, content: string, type: 'warning' | 'notice' | 'gift') => Promise<boolean>;
  adminBanUser: (targetUserId: string, hours: number, reason: string) => Promise<boolean>;
  adminDeleteUser: (targetUserId: string) => Promise<boolean>;
  adminSetUserRole: (targetUserId: string, newRole: UserRole) => Promise<boolean>;
  setLanguage: (lang: string) => void;
  setPlayerName: (name: string) => void;
  setAvatarUrl: (url: string) => void;
  toggleSound: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  setCategoryFilter: (cat: string) => void;
  setStatusFilter: (status: string) => void;
  addTask: (title: string, category: TaskCategory, difficulty: TaskDifficulty, isDailyRecurring?: boolean, focusDuration?: number | null) => void;
  updateTaskFocusDuration: (taskId: string, duration: number) => void;
  toggleTask: (id: string, coords?: { x: number; y: number }, forceSkipAgeCheck?: boolean) => Promise<void> | void;
  confirmEarlyTaskCompletion: () => void;
  cancelEarlyTaskConfirmation: () => void;
  deleteTask: (id: string) => void;
  completePomodoro: (taskId: string, elapsedMinutes?: number, targetMinutes?: number) => Promise<void> | void;
  buyShopItem: (itemId: string, coords?: { x: number; y: number }) => Promise<void> | void;
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
  setSearchQuery: (query: string) => void;
  setCreateQuestOpen: (open: boolean) => void;
  setQuestViewMode: (mode: 'bento' | 'list') => void;
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
  checkInStreakQuest: (questId: string) => Promise<void> | void;
  resetStreakQuest: (questId: string) => void;
  claimSystemQuestReward: (questId: string) => void;
  equipTitle: (titleId: string) => void;
  checkSystemMilestones: () => void;
  cleanupExpiredInventory: () => void;
  setHunterId: (id: string) => void;
  syncToCloud: (silent?: boolean) => Promise<boolean>;
  restoreFromCloud: (targetHunterId: string) => Promise<boolean>;

  // Authentication Actions
  initAuth: () => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

let autoSyncTimer: any = null;
const debouncedAutoSync = (store: any) => {
  if (autoSyncTimer) clearTimeout(autoSyncTimer);
  autoSyncTimer = setTimeout(() => {
    store.syncToCloud(true);
  }, 500);
};

export const useFaeQuestStore = create<FaeQuestState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      authLoading: true,

      playerName: 'Thợ Săn Fae',
      avatarUrl: '',
      exp: 0,
      coins: 25,
      completedTotal: 0,
      streakDays: 0,
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

      hunterId: getOrInitHunterId(),
      cloudSyncStatus: 'idle',
      lastSyncedAt: undefined,

      // Admin Live-Ops Initial State
      userRole: 'user',
      bannedUntil: null,
      banReason: null,
      adminPortalTab: 'users',
      systemShopItems: [],
      systemAchievements: [],
      userMessages: [],
      unreadMessagesCount: 0,
      isUserInboxOpen: false,
      activeWarningMessage: null,

      activeTab: 'quests',
      activeCategoryFilter: 'all',
      activeStatusFilter: 'all',
      searchQuery: '',
      isCreateQuestOpen: false,
      questViewMode: 'bento',
      rankUpData: null,
      isRoadmapOpen: false,
      isRenameOpen: false,
      isResetOpen: false,
      isSettingsOpen: false,
      isOathOpen: typeof window !== 'undefined' ? localStorage.getItem('faequest_oath_accepted') !== 'true' : false,
      confirmEarlyTask: null,
      lastCompletedTimestamp: 0,
      isSidebarCollapsed: false,
      language: 'vi',
      setLanguage: (lang: string) => set({ language: lang }),
      setUserRole: (role: UserRole) => set({ userRole: role }),
      setAdminPortalTab: (tab: 'users' | 'shop' | 'achievements' | 'analytics') => set({ adminPortalTab: tab }),
      setUserInboxOpen: (open: boolean) => set({ isUserInboxOpen: open }),
      setActiveWarningMessage: (msg: UserMessage | null) => set({ activeWarningMessage: msg }),

      fetchUserMessages: async () => {
        const userId = get().currentUser?.id;
        if (!userId) return;

        try {
          const { data, error } = await supabase
            .from('user_messages')
            .select('*')
            .eq('receiver_id', userId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            const msgs = data as UserMessage[];
            const unread = msgs.filter((m) => !m.is_read).length;
            set({ userMessages: msgs, unreadMessagesCount: unread });

            // Tự động bật Modal thông báo nếu có thư cảnh báo chưa đọc
            const unreadWarning = msgs.find((m) => !m.is_read && m.message_type === 'warning');
            if (unreadWarning && !get().activeWarningMessage) {
              set({ activeWarningMessage: unreadWarning });
            }
          }
        } catch (e) {
          console.error('Error fetching user messages:', e);
        }
      },

      markMessageAsRead: async (messageId: string) => {
        try {
          await supabase
            .from('user_messages')
            .update({ is_read: true })
            .eq('id', messageId);

          set((prev) => {
            const updated = prev.userMessages.map((m) =>
              m.id === messageId ? { ...m, is_read: true } : m
            );
            return {
              userMessages: updated,
              unreadMessagesCount: updated.filter((m) => !m.is_read).length,
            };
          });
        } catch (e) {
          console.error('Error marking message read:', e);
        }
      },

      markAllMessagesAsRead: async () => {
        const userId = get().currentUser?.id;
        if (!userId) return;
        try {
          await supabase
            .from('user_messages')
            .update({ is_read: true })
            .eq('receiver_id', userId);

          set((prev) => ({
            userMessages: prev.userMessages.map((m) => ({ ...m, is_read: true })),
            unreadMessagesCount: 0,
          }));
          get().addToast('Đã đánh dấu tất cả thư là đã đọc', 'info');
        } catch (e) {
          console.error('Error marking all messages read:', e);
        }
      },

      fetchSystemShopItems: async () => {
        try {
          const { data, error } = await supabase
            .from('system_shop_items')
            .select('*')
            .order('created_at', { ascending: true });

          if (!error && data) {
            set({ systemShopItems: data as SystemShopItem[] });
          }
        } catch (e) {
          console.error('Error fetching system shop items:', e);
        }
      },

      addSystemShopItem: async (item) => {
        try {
          const { error } = await supabase
            .from('system_shop_items')
            .insert([{ ...item, is_system: true }]);
          if (error) throw error;
          await get().fetchSystemShopItems();
          return true;
        } catch (e: any) {
          get().addToast(e.message || 'Lỗi thêm vật phẩm hệ thống', 'error');
          return false;
        }
      },

      updateSystemShopItem: async (id, item) => {
        try {
          const { error } = await supabase
            .from('system_shop_items')
            .update(item)
            .eq('id', id);
          if (error) throw error;
          await get().fetchSystemShopItems();
          return true;
        } catch (e: any) {
          get().addToast(e.message || 'Lỗi cập nhật vật phẩm', 'error');
          return false;
        }
      },

      deleteSystemShopItem: async (id) => {
        try {
          const { error } = await supabase
            .from('system_shop_items')
            .delete()
            .eq('id', id);
          if (error) throw error;
          await get().fetchSystemShopItems();
          get().addToast('Đã xóa vật phẩm khỏi Cửa Hàng Hệ Thống', 'info');
          return true;
        } catch (e: any) {
          get().addToast(e.message || 'Lỗi xóa vật phẩm', 'error');
          return false;
        }
      },

      fetchSystemAchievements: async () => {
        try {
          const { data, error } = await supabase
            .from('system_achievements')
            .select('*')
            .order('created_at', { ascending: true });

          if (!error && data) {
            const achievements = data as SystemAchievement[];
            set({ systemAchievements: achievements });

            // Đồng bộ thành tựu động vào danh sách systemQuests để người dùng thực thi
            const currentQuests = get().systemQuests;
            const updatedQuests = [...currentQuests];

            for (const ach of achievements) {
              const existingIdx = updatedQuests.findIndex(
                (q) => q.id === `sys_${ach.id}` || q.id === ach.id
              );
              const isStreak = ach.achievement_type === 'streak_counter';
              let milestoneKey: 'completedTasks' | 'focusSessions' | undefined;
              if (ach.achievement_type === 'milestone_tasks') milestoneKey = 'completedTasks';
              if (ach.achievement_type === 'milestone_focus') milestoneKey = 'focusSessions';

              let autoCompleted = false;
              if (ach.achievement_type === 'milestone_tasks') {
                autoCompleted = get().completedTotal >= ach.target_value;
              } else if (ach.achievement_type === 'milestone_focus') {
                autoCompleted = get().focusSessionsCompleted >= ach.target_value;
              } else if (ach.achievement_type === 'milestone_exp') {
                autoCompleted = get().exp >= ach.target_value;
              }

              if (existingIdx >= 0) {
                const existing = updatedQuests[existingIdx];
                updatedQuests[existingIdx] = {
                  ...existing,
                  title: ach.title,
                  description: ach.description,
                  targetDays: isStreak ? ach.target_value : undefined,
                  targetMilestone: !isStreak ? ach.target_value : undefined,
                  milestoneKey,
                  expReward: ach.reward_exp,
                  coinReward: ach.reward_coins,
                  rewardTitleName: ach.granted_title_name || 'Vinh Quang Fae',
                  isCompleted: existing.isCompleted || autoCompleted,
                };
              } else {
                updatedQuests.push({
                  id: `sys_${ach.id}`,
                  type: isStreak ? 'streak_counter' : 'milestone',
                  title: ach.title,
                  description: ach.description,
                  targetDays: isStreak ? ach.target_value : undefined,
                  currentStreak: 0,
                  targetMilestone: !isStreak ? ach.target_value : undefined,
                  milestoneKey,
                  expReward: ach.reward_exp,
                  coinReward: ach.reward_coins,
                  rewardTitleId: `title_${ach.id}`,
                  rewardTitleName: ach.granted_title_name || 'Vinh Quang Fae',
                  isCompleted: autoCompleted,
                  isRewardClaimed: false,
                });
              }
            }

            set({ systemQuests: updatedQuests });
          }
        } catch (e) {
          console.error('Error fetching system achievements:', e);
        }
      },

      addSystemAchievement: async (achievement) => {
        try {
          const { error } = await supabase
            .from('system_achievements')
            .insert([achievement]);
          if (error) throw error;
          await get().fetchSystemAchievements();
          return true;
        } catch (e: any) {
          get().addToast(e.message || 'Lỗi tạo thành tựu mới', 'error');
          return false;
        }
      },

      deleteSystemAchievement: async (id) => {
        try {
          const { error } = await supabase
            .from('system_achievements')
            .delete()
            .eq('id', id);
          if (error) throw error;
          await get().fetchSystemAchievements();
          get().addToast('Đã xóa thành tựu khỏi hệ thống', 'info');
          return true;
        } catch (e: any) {
          get().addToast(e.message || 'Lỗi xóa thành tựu', 'error');
          return false;
        }
      },

      adminSendMail: async (receiverId, subject, content, type) => {
        try {
          const { error } = await supabase.rpc('rpc_admin_send_mail', {
            p_receiver_id: receiverId,
            p_subject: subject,
            p_content: content,
            p_type: type,
          });

          if (error) {
            const { error: insErr } = await supabase.from('user_messages').insert({
              receiver_id: receiverId,
              subject,
              content,
              message_type: type,
              is_read: false,
            });
            if (insErr) throw insErr;
          }
          return true;
        } catch (e: any) {
          get().addToast(e.message || 'Lỗi khi gửi thư', 'error');
          return false;
        }
      },

      adminBanUser: async (targetUserId, hours, reason) => {
        try {
          const { error } = await supabase.rpc('rpc_admin_ban_user', {
            p_target_user_id: targetUserId,
            p_hours: hours,
            p_reason: reason,
          });

          if (error) {
            if (hours <= 0) {
              await supabase
                .from('profiles')
                .update({ banned_until: null, ban_reason: null })
                .eq('id', targetUserId);
            } else {
              const unbanDate = new Date(Date.now() + hours * 3600 * 1000).toISOString();
              await supabase
                .from('profiles')
                .update({ banned_until: unbanDate, ban_reason: reason })
                .eq('id', targetUserId);
            }
          }
          return true;
        } catch (e: any) {
          get().addToast(e.message || 'Lỗi khóa tài khoản', 'error');
          return false;
        }
      },

      adminDeleteUser: async (targetUserId) => {
        try {
          const { error } = await supabase.rpc('rpc_admin_delete_user', {
            p_target_user_id: targetUserId,
          });

          if (error) {
            await supabase.from('activity_logs').delete().eq('user_id', targetUserId);
            await supabase.from('user_messages').delete().eq('receiver_id', targetUserId);
            await supabase.from('user_states').delete().eq('user_id', targetUserId);
            await supabase.from('profiles').delete().eq('id', targetUserId);
          }
          return true;
        } catch (e: any) {
          get().addToast(e.message || 'Lỗi khi xóa tài khoản', 'error');
          return false;
        }
      },

      adminSetUserRole: async (targetUserId, newRole) => {
        try {
          const { error } = await supabase.rpc('rpc_admin_set_user_role', {
            p_target_user_id: targetUserId,
            p_new_role: newRole,
          });

          if (error) {
            if (error.code === 'PGRST202' || error.message?.includes('schema cache')) {
              get().addToast('⚠️ Bạn chưa chạy SQL tạo hàm rpc_admin_set_user_role trên Supabase SQL Editor', 'error');
              return false;
            }
            throw error;
          }
          return true;
        } catch (e: any) {
          get().addToast(e.message || 'Lỗi khi cập nhật phân quyền', 'error');
          return false;
        }
      },
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
          debouncedAutoSync(get());
        }
      },

      setAvatarUrl: (url: string) => {
        set({ avatarUrl: url });
        debouncedAutoSync(get());
      },

      toggleSound: () => {
        const next = !get().soundEnabled;
        set({ soundEnabled: next });
        get().addToast(next ? 'Đã bật hiệu ứng âm thanh RPG' : 'Đã tắt âm thanh', 'info');
      },

      setActiveTab: (tab: ActiveTab) => {
        set({ activeTab: tab });
        get().cleanupExpiredInventory();
      },

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
        debouncedAutoSync(get());
      },

      updateTaskFocusDuration: (taskId: string, duration: number) => {
        const clean = Math.min(180, Math.max(5, Number(duration) || 25));
        set((prev) => ({
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? { ...t, focusDuration: clean, pomodoroMinutes: clean } : t
          ),
        }));
        debouncedAutoSync(get());
      },

      toggleTask: async (id: string, coords) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === id);
        if (!task) return;

        const diff = DIFFICULTIES[task.difficulty] || DIFFICULTIES.medium;
        const oldRankIdx = getRankIndexByExp(state.exp);
        const now = Date.now();

        if (task.completed) {
          // Khóa thao tác hoàn thành 1 chiều: nhiệm vụ đã hoàn thành vĩnh viễn
          return;
        }

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

        let streakBonusMultiplier = state.streakDays >= 3 ? 1.2 : 1.0;
        let awardedExp = Math.round(diff.exp * streakBonusMultiplier);
        let awardedCoins = diff.coins;
        let newExp = state.exp + awardedExp;
        let finalCoins = state.coins + awardedCoins;
        let rankUpBonus = 0;
        let newRankTier: RankTier | null = null;

        // BẢO MẬT MÁY CHỦ: Xác thực qua Server-Side RPC
        if (state.currentUser) {
          try {
            const { data: rpcRes, error: rpcErr } = await supabase.rpc('rpc_complete_task', {
              p_difficulty: task.difficulty,
              p_focus_minutes: 0,
              p_is_focus_completed: false,
              p_category: task.category,
            });

            if (rpcErr) {
              playSoundEffect('warning', state.soundEnabled);
              get().addToast(`⚠️ ${rpcErr.message}`, 'error');
              return;
            }

            if (rpcRes) {
              awardedExp = rpcRes.awarded_exp ?? awardedExp;
              awardedCoins = rpcRes.awarded_coins ?? awardedCoins;
              newExp = rpcRes.new_exp ?? newExp;
              finalCoins = rpcRes.new_coins ?? finalCoins;
              rankUpBonus = rpcRes.rank_bonus_coins ?? 0;
              if (rpcRes.rank_up_occurred) {
                const newRankIdx = getRankIndexByExp(newExp);
                newRankTier = RANK_TIERS[newRankIdx];
              }
            }
          } catch (e: any) {
            console.warn('RPC complete_task error:', e);
          }
        } else {
          // Fallback offline / guest
          const newRankIdx = getRankIndexByExp(newExp);
          if (newRankIdx > oldRankIdx) {
            for (let i = oldRankIdx + 1; i <= newRankIdx; i++) {
              rankUpBonus += RANK_TIERS[i].coinBonus;
            }
            newRankTier = RANK_TIERS[newRankIdx];
          }
          finalCoins = state.coins + awardedCoins + rankUpBonus;
        }

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

        const today = getTodayString();
        let newStreak = state.streakDays;
        if (state.lastActiveDate !== today) {
          newStreak = state.streakDays + 1;
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
              colors: ['#CCD0CF', '#9BA8AB', '#4A5C6A', '#253745', '#FFFFFF', '#FBBF24'],
            });
          } catch (e) { }
          playSoundEffect('rankup', state.soundEnabled);
          set({ rankUpData: { achievedTier: newRankTier, bonusCoins: rankUpBonus } });
        } else {
          playSoundEffect('complete', state.soundEnabled);
          get().addToast(`Hoàn thành! Nhận +${awardedExp} EXP và +${awardedCoins} Xu`, 'success');
        }
        debouncedAutoSync(get());
      },

      deleteTask: (id: string) => {
        set((prev) => ({
          tasks: prev.tasks.filter((t) => t.id !== id),
        }));
        get().addToast('Đã xóa nhiệm vụ khỏi danh sách', 'info');
        debouncedAutoSync(get());
      },

      completePomodoro: async (taskId: string, elapsedMinutes?: number, targetMinutes?: number) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return;

        const target = targetMinutes || task.focusDuration || 25;
        const actualMinutes = elapsedMinutes !== undefined ? elapsedMinutes : target;
        const cleanElapsed = Math.min(180, Math.max(5, actualMinutes));

        // Task base rewards (if task is not already completed)
        const diff = DIFFICULTIES[task.difficulty] || DIFFICULTIES.medium;
        const streakBonusMultiplier = state.streakDays >= 3 ? 1.2 : 1.0;
        const isAlreadyCompleted = Boolean(task.completed);
        const taskExp = !isAlreadyCompleted ? Math.round(diff.exp * streakBonusMultiplier) : 0;
        const taskCoins = !isAlreadyCompleted ? diff.coins : 0;
        const earnedFocusExp = task.focusRewardClaimed ? 0 : Math.round(cleanElapsed * 1);
        const earnedFocusCoins = task.focusRewardClaimed ? 0 : Math.max(1, Math.floor(cleanElapsed * 0.4));

        let totalExp = taskExp + earnedFocusExp;
        let totalCoins = taskCoins + earnedFocusCoins;
        let newExp = state.exp + totalExp;
        let finalCoins = state.coins + totalCoins;
        let newRankTier: RankTier | null = null;
        let rankUpBonus = 0;

        // BẢO MẬT MÁY CHỦ: Gọi Server RPC
        if (state.currentUser) {
          try {
            const { data: rpcRes, error: rpcErr } = await supabase.rpc('rpc_complete_task', {
              p_difficulty: task.difficulty,
              p_focus_minutes: cleanElapsed,
              p_is_focus_completed: true,
              p_category: task.category,
            });

            if (rpcErr) {
              playSoundEffect('warning', state.soundEnabled);
              get().addToast(`⚠️ ${rpcErr.message}`, 'error');
              return;
            }

            if (rpcRes) {
              newExp = rpcRes.new_exp ?? newExp;
              finalCoins = rpcRes.new_coins ?? finalCoins;
              totalExp = rpcRes.awarded_exp ?? totalExp;
              totalCoins = rpcRes.awarded_coins ?? totalCoins;
              rankUpBonus = rpcRes.rank_bonus_coins ?? 0;
              if (rpcRes.rank_up_occurred) {
                const newRankIdx = getRankIndexByExp(newExp);
                newRankTier = RANK_TIERS[newRankIdx];
              }
            }
          } catch (e: any) {
            console.warn('RPC complete_task error:', e);
          }
        } else {
          const oldRankIdx = getRankIndexByExp(state.exp);
          const newRankIdx = getRankIndexByExp(newExp);
          if (newRankIdx > oldRankIdx) {
            for (let i = oldRankIdx + 1; i <= newRankIdx; i++) {
              rankUpBonus += RANK_TIERS[i].coinBonus;
            }
            newRankTier = RANK_TIERS[newRankIdx];
          }
          finalCoins = state.coins + totalCoins + rankUpBonus;
        }
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
              colors: ['#CCD0CF', '#9BA8AB', '#4A5C6A', '#253745', '#FFFFFF', '#FBBF24'],
            });
          } catch (e) { }
          playSoundEffect('rankup', state.soundEnabled);
          set({ rankUpData: { achievedTier: newRankTier, bonusCoins: rankUpBonus } });
        } else {
          playSoundEffect('complete', state.soundEnabled);
        }

        get().addToast(
          `🎉 Tuyệt vời! Đã hoàn thành nhiệm vụ & phiên Focus: Nhận tổng +${totalExp} EXP và +${totalCoins} Xu Vàng!`,
          'success'
        );
        debouncedAutoSync(get());
      },

      buyShopItem: async (itemId: string, coords) => {
        const state = get();
        // Tìm trong custom shopItems hoặc systemShopItems
        let item = state.shopItems.find((i) => i.id === itemId);
        let isSystemItem = false;
        if (!item) {
          const cleanSysId = itemId.startsWith('sys_') ? itemId.replace('sys_', '') : itemId;
          const sys = state.systemShopItems.find((s) => s.id === cleanSysId);
          if (sys) {
            item = {
              id: `sys_${sys.id}`,
              title: sys.name,
              desc: sys.description,
              cost: sys.cost,
              emoji: sys.icon,
              isSystem: true,
            };
            isSystemItem = true;
          }
        }
        if (!item) return;

        // Giới hạn sức chứa tối đa 50 vật phẩm
        if (state.inventory.length >= MAX_INVENTORY_SLOTS) {
          playSoundEffect('warning', state.soundEnabled);
          get().addToast('🎒 Túi Đồ đã đầy (50/50)! Hãy sử dụng bớt vật phẩm trước khi đổi thêm.', 'error');
          return;
        }

        if (state.coins < item.cost) {
          get().addToast(`Bạn cần thêm ${item.cost - state.coins} Xu nữa để mua "${item.title}"!`, 'error');
          return;
        }

        let finalCoins = state.coins - item.cost;

        // BẢO MẬT MÁY CHỦ: Trừ Xu nguyên tử qua Server-Side RPC
        if (state.currentUser) {
          try {
            const { data: rpcRes, error: rpcErr } = await supabase.rpc('rpc_purchase_item', {
              p_item_cost: item.cost,
              p_current_inventory_count: state.inventory.length,
            });

            if (rpcErr) {
              playSoundEffect('warning', state.soundEnabled);
              get().addToast(`⚠️ Giao dịch thất bại: ${rpcErr.message}`, 'error');
              return;
            }

            if (rpcRes?.new_coins !== undefined) {
              finalCoins = rpcRes.new_coins;
            }

            // Ghi nhật ký mua sắm vào activity_logs
            await supabase.rpc('rpc_log_activity', {
              p_action_type: 'SHOP_PURCHASE',
              p_category: isSystemItem ? 'Vật Phẩm Hệ Thống' : 'Vật Phẩm Tự Thưởng',
              p_difficulty: 'Normal',
              p_exp_delta: 0,
              p_coins_delta: -item.cost,
            });
          } catch (e: any) {
            console.warn('RPC purchase_item error:', e);
          }
        }

        const now = Date.now();
        const newTicket: InventoryTicket = {
          id: 'inv_' + now,
          title: item.title,
          emoji: item.emoji,
          cost: item.cost,
          redeemedAt: new Date(now).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' hôm nay',
          purchasedAt: now,
          expiresAt: now + 7 * 24 * 60 * 60 * 1000,
          used: false,
          usedAt: null,
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
        get().addToast('🎒 Đã thêm vật phẩm vào Túi Đồ!', 'success');
        debouncedAutoSync(get());
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
        const state = get();
        const target = state.inventory.find((t) => t.id === ticketId);
        if (!target) return;

        // 1. Kích hoạt hiệu ứng âm thanh sử dụng vật phẩm / potion phép thuật
        playSoundEffect('potion', state.soundEnabled);

        // 2. Xóa vật phẩm khỏi mảng inventory ngay lập tức
        set((prev) => ({
          inventory: prev.inventory.filter((t) => t.id !== ticketId),
        }));

        // 3. Thông báo Toast chúc mừng
        get().addToast(
          `✨ Đã kích hoạt phần thưởng "${target.title}"! Chúc Thợ Săn tận hưởng xứng đáng.`,
          'success'
        );

        // Đồng bộ ngay lên Supabase
        debouncedAutoSync(get());
      },

      cleanupExpiredInventory: () => {
        const state = get();
        const now = Date.now();
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

        let hasChanged = false;
        const cleaned = state.inventory.filter((item) => {
          // Quy tắc: Hiệu lực 7 ngày sau khi đổi đối với vật phẩm chưa sử dụng
          const expireTime = item.expiresAt || ((item.purchasedAt || 0) + SEVEN_DAYS_MS);
          if (now >= expireTime) {
            hasChanged = true;
            return false;
          }
          return true;
        });

        if (hasChanged) {
          set({ inventory: cleaned });
          debouncedAutoSync(get());
        }
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
              colors: ['#CCD0CF', '#9BA8AB', '#4A5C6A', '#253745', '#FFFFFF', '#FBBF24'],
            });
          } catch (e) { }
          playSoundEffect('rankup', state.soundEnabled);
          set({ rankUpData: { achievedTier: newRankTier, bonusCoins: rankUpBonus } });
        } else {
          playSoundEffect('complete', state.soundEnabled);
          get().addToast(`Đã cộng thử +${amount} EXP!`, 'success');
        }
        debouncedAutoSync(get());
      },

      closeRankUpModal: () => set({ rankUpData: null }),

      setRoadmapOpen: (open: boolean) => set({ isRoadmapOpen: open }),
      setRenameOpen: (open: boolean) => set({ isRenameOpen: open }),
      setResetOpen: (open: boolean) => set({ isResetOpen: open }),
      setSettingsOpen: (open: boolean) => set({ isSettingsOpen: open }),
      setOathOpen: (open: boolean) => set({ isOathOpen: open }),
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setCreateQuestOpen: (open: boolean) => set({ isCreateQuestOpen: open }),
      setQuestViewMode: (mode: 'bento' | 'list') => set({ questViewMode: mode }),
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

      checkInStreakQuest: async (questId: string) => {
        const state = get();
        const quest = state.systemQuests.find((q) => q.id === questId);
        if (!quest || quest.type !== 'streak_counter') return;

        let today = getTodayString();

        if (quest.lastResetDate === today) {
          get().addToast('Hôm nay bạn đã Reset bộ đếm này. Hãy quay lại điểm danh sau 00:00 đêm nay nhé!', 'info');
          return;
        }

        if (quest.lastCheckInDate === today) {
          get().addToast('Hôm nay bạn đã điểm danh thử thách này rồi! Hãy quay lại vào ngày mai.', 'info');
          return;
        }

        let nextStreak = (quest.currentStreak || 0) + 1;
        let isCompleted = nextStreak >= (quest.targetDays || 1);

        // BẢO MẬT MÁY CHỦ: Xác thực ngày điểm danh theo máy chủ (CURRENT_DATE)
        if (state.currentUser) {
          try {
            const { data: rpcRes, error: rpcErr } = await supabase.rpc('rpc_checkin_streak', {
              p_last_checkin_date: quest.lastCheckInDate || '',
              p_last_reset_date: quest.lastResetDate || '',
              p_target_days: quest.targetDays,
              p_current_streak: quest.currentStreak || 0,
              p_bonus_exp: quest.expReward,
              p_bonus_coins: quest.coinReward,
            });

            if (rpcErr) {
              playSoundEffect('warning', state.soundEnabled);
              get().addToast(`⚠️ ${rpcErr.message}`, 'error');
              return;
            }

            if (rpcRes) {
              nextStreak = rpcRes.new_streak ?? nextStreak;
              today = rpcRes.today_server || today;
              if (rpcRes.new_exp !== undefined) {
                set({ exp: rpcRes.new_exp, coins: rpcRes.new_coins });
              }
            }
          } catch (e: any) {
            console.warn('RPC checkin_streak error:', e);
          }
        }

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
        debouncedAutoSync(get());
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
        debouncedAutoSync(get());
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
            colors: ['#CCD0CF', '#9BA8AB', '#4A5C6A', '#253745', '#FFFFFF', '#FBBF24'],
          });
        } catch (e) { }

        get().addToast(
          `🎉 Nhận thưởng thành công: +${quest.expReward} EXP, +${quest.coinReward} Xu và mở khóa Danh hiệu "${quest.rewardTitleName}"!`,
          'success'
        );
        debouncedAutoSync(get());
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
        debouncedAutoSync(get());
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
          } else {
            isAchieved = state.exp >= (q.targetMilestone || 0);
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

      setHunterId: (id: string) => {
        const clean = id.trim();
        if (clean) {
          setStoredHunterId(clean);
          set({ hunterId: clean });
        }
      },

      syncToCloud: async (silent = false) => {
        const state = get();
        const activeUserId = state.currentUser?.id || state.hunterId;
        if (!activeUserId) return false;
        set({ cloudSyncStatus: 'syncing' });

        const snapshot: UserStateCloud = {
          playerName: state.playerName,
          avatarUrl: state.avatarUrl,
          exp: state.exp,
          coins: state.coins,
          completedTotal: state.completedTotal,
          streakDays: state.streakDays,
          dailyCompletedCount: state.dailyCompletedCount,
          dailyBossCompletedCount: state.dailyBossCompletedCount,
          tasks: state.tasks,
          shopItems: state.shopItems,
          inventory: state.inventory,
          rivals: state.rivals,
          systemQuests: state.systemQuests,
          unlockedTitleIds: state.unlockedTitleIds,
          equippedTitleId: state.equippedTitleId,
          focusSessionsCompleted: state.focusSessionsCompleted,
        };

        const res = await syncProfileAndStateToCloud(activeUserId, snapshot);
        if (res.success) {
          const nowStr = new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          set({ cloudSyncStatus: 'synced', lastSyncedAt: nowStr });
          if (!silent) {
            get().addToast('☁️ Đã đồng bộ dữ liệu lên Supabase thành công!', 'success');
          }
          return true;
        } else {
          set({ cloudSyncStatus: 'error' });
          if (!silent) {
            get().addToast(`⚠️ Lỗi đồng bộ đám mây: ${res.error}`, 'error');
          }
          return false;
        }
      },

      restoreFromCloud: async (targetHunterId: string) => {
        const cleanId = targetHunterId.trim();
        if (!cleanId) {
          get().addToast('Vui lòng nhập Mã Định Danh Thợ Săn để khôi phục!', 'error');
          return false;
        }
        set({ cloudSyncStatus: 'syncing' });
        const res = await restoreUserStateFromCloud(cleanId);
        if (res.success && res.state) {
          const s = res.state;
          setStoredHunterId(cleanId);
          set({
            hunterId: cleanId,
            playerName: s.playerName || get().playerName,
            avatarUrl: s.avatarUrl || '',
            exp: typeof s.exp === 'number' ? s.exp : get().exp,
            coins: typeof s.coins === 'number' ? s.coins : get().coins,
            completedTotal: typeof s.completedTotal === 'number' ? s.completedTotal : get().completedTotal,
            streakDays: typeof s.streakDays === 'number' ? s.streakDays : get().streakDays,
            dailyCompletedCount: s.dailyCompletedCount || 0,
            dailyBossCompletedCount: s.dailyBossCompletedCount || 0,
            tasks: Array.isArray(s.tasks) ? s.tasks : get().tasks,
            shopItems: Array.isArray(s.shopItems) ? s.shopItems : get().shopItems,
            inventory: Array.isArray(s.inventory) ? s.inventory : get().inventory,
            rivals: Array.isArray(s.rivals) ? s.rivals : get().rivals,
            systemQuests: Array.isArray(s.systemQuests) ? s.systemQuests : get().systemQuests,
            unlockedTitleIds: Array.isArray(s.unlockedTitleIds) ? s.unlockedTitleIds : get().unlockedTitleIds,
            equippedTitleId: s.equippedTitleId || get().equippedTitleId,
            focusSessionsCompleted: s.focusSessionsCompleted || 0,
            cloudSyncStatus: 'synced',
            lastSyncedAt: new Date().toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          });
          playSoundEffect('complete', get().soundEnabled);
          get().addToast(
            `🎉 Đã khôi phục thành công dữ liệu của "${s.playerName || cleanId}" từ Supabase!`,
            'success'
          );
          return true;
        } else {
          set({ cloudSyncStatus: 'error' });
          get().addToast(`❌ Khôi phục thất bại: ${res.error}`, 'error');
          return false;
        }
      },

      initAuth: async () => {
        set({ authLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const user = session.user;
            const hunterId = user.id;
            setStoredHunterId(hunterId);

            // Fetch user profile and state from Supabase
            let { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', hunterId)
              .maybeSingle();

            const hunterName =
              profile?.username ||
              user.user_metadata?.display_name ||
              user.email?.split('@')[0] ||
              'Thợ Săn Fae';

            const userEmail = user.email || '';
            const isAdminCandidate =
              userEmail.toLowerCase().includes('admin') ||
              hunterName.toLowerCase().includes('quản trị') ||
              hunterName.toLowerCase().includes('admin');

            // Tự động khởi tạo hồ sơ nếu chưa có trên máy chủ
            if (!profile) {
              const defaultRole: UserRole = isAdminCandidate ? 'admin' : 'user';
              const { data: createdProfile } = await supabase
                .from('profiles')
                .insert({
                  id: hunterId,
                  username: hunterName,
                  avatar_url: null,
                  exp: 0,
                  coins: 25,
                  rank_id: 'dong',
                  equipped_title: 'title_tan_binh_gai_do',
                  role: defaultRole,
                  streak: 0,
                  completed_tasks_count: 0,
                  updated_at: new Date().toISOString(),
                })
                .select('*')
                .maybeSingle();
              if (createdProfile) {
                profile = createdProfile;
              }
            }

            let userRole: UserRole = profile?.role === 'admin' ? 'admin' : 'user';
            // Tự động đồng bộ quyền Admin nếu tài khoản thuộc diện Quản Trị nhưng chưa được gán role
            if (userRole !== 'admin' && isAdminCandidate) {
              userRole = 'admin';
              await supabase.from('profiles').update({ role: 'admin' }).eq('id', hunterId);
            }

            const { data: stateRow } = await supabase
              .from('user_states')
              .select('*')
              .eq('user_id', hunterId)
              .maybeSingle();

            const bannedUntil = profile?.banned_until || null;
            const banReason = profile?.ban_reason || null;
            const isAdmin = userRole === 'admin';

            if (isAdmin && typeof window !== 'undefined') {
              localStorage.setItem('faequest_oath_accepted', 'true');
            }

            if (stateRow?.state_json) {
              const s = stateRow.state_json;
              set({
                currentUser: { id: user.id, email: user.email || '', name: hunterName },
                hunterId,
                userRole,
                bannedUntil,
                banReason,
                activeTab: isAdmin ? 'admin' : 'quests',
                isOathOpen: false,
                playerName: s.playerName || hunterName,
                avatarUrl: s.avatarUrl || profile?.avatar_url || '',
                exp: profile?.exp !== undefined ? profile.exp : (typeof s.exp === 'number' ? s.exp : 0),
                coins: profile?.coins !== undefined ? profile.coins : (typeof s.coins === 'number' ? s.coins : 25),
                completedTotal: profile?.completed_tasks_count !== undefined ? profile.completed_tasks_count : (typeof s.completedTotal === 'number' ? s.completedTotal : 0),
                streakDays: profile?.streak !== undefined ? profile.streak : (typeof s.streakDays === 'number' ? s.streakDays : 0),
                dailyCompletedCount: s.dailyCompletedCount || 0,
                dailyBossCompletedCount: s.dailyBossCompletedCount || 0,
                tasks: Array.isArray(s.tasks) ? s.tasks : [],
                shopItems: Array.isArray(s.shopItems) ? s.shopItems : INITIAL_SHOP_ITEMS,
                inventory: Array.isArray(s.inventory) ? s.inventory : [],
                rivals: Array.isArray(s.rivals) ? s.rivals : INITIAL_RIVALS,
                systemQuests: Array.isArray(s.systemQuests) ? s.systemQuests : INITIAL_SYSTEM_QUESTS,
                unlockedTitleIds: Array.isArray(s.unlockedTitleIds) ? s.unlockedTitleIds : ['title_tan_binh_gai_do'],
                equippedTitleId: s.equippedTitleId || profile?.equipped_title || 'title_tan_binh_gai_do',
                focusSessionsCompleted: s.focusSessionsCompleted || 0,
                cloudSyncStatus: 'synced',
                lastSyncedAt: new Date().toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                authLoading: false,
              });
            } else {
              // Brand new user profile in auth but no user_states: initialize clean
              const starterTasks: Task[] = [
                {
                  id: 'task_starter_oath',
                  title: 'Tuyên thệ Khế Ước Thợ Săn & Khám phá thế giới FaeQuest',
                  category: 'ca-nhan',
                  difficulty: 'easy',
                  completed: false,
                  createdAt: Date.now(),
                  rewardClaimed: false,
                },
                {
                  id: 'task_starter_focus',
                  title: 'Hoàn thành 1 phiên tập trung Fae Focus 25 phút đầu tiên',
                  category: 'hoc-tap',
                  difficulty: 'medium',
                  completed: false,
                  createdAt: Date.now(),
                  focusDuration: 25,
                  rewardClaimed: false,
                },
              ];

              set({
                currentUser: { id: user.id, email: user.email || '', name: hunterName },
                hunterId,
                userRole,
                bannedUntil,
                banReason,
                activeTab: isAdmin ? 'admin' : 'quests',
                isOathOpen: isAdmin ? false : true,
                playerName: hunterName,
                avatarUrl: profile?.avatar_url || '',
                exp: profile?.exp || 0,
                coins: profile?.coins || 25,
                completedTotal: 0,
                streakDays: 0,
                dailyCompletedCount: 0,
                dailyBossCompletedCount: 0,
                tasks: starterTasks,
                shopItems: INITIAL_SHOP_ITEMS,
                inventory: [],
                rivals: INITIAL_RIVALS,
                systemQuests: INITIAL_SYSTEM_QUESTS,
                unlockedTitleIds: ['title_tan_binh_gai_do'],
                equippedTitleId: 'title_tan_binh_gai_do',
                focusSessionsCompleted: 0,
                cloudSyncStatus: 'synced',
                authLoading: false,
              });

              await get().syncToCloud(true);
            }

            // Đồng bộ dữ liệu Live-Ops: Hộp thư, Cửa hàng hệ thống, Thành tựu động
            get().fetchUserMessages();
            get().fetchSystemShopItems();
            get().fetchSystemAchievements();
          } else {
            set({ currentUser: null, authLoading: false });
          }
        } catch (err) {
          console.error('Error in initAuth:', err);
          set({ currentUser: null, authLoading: false });
        }

        // Keep auth session listener
        supabase.auth.onAuthStateChange(async (event) => {
          if (event === 'SIGNED_OUT') {
            set({ currentUser: null, cloudSyncStatus: 'idle' });
          }
        });
      },

      signUp: async (name: string, email: string, password: string) => {
        const cleanName = name.trim();
        const cleanEmail = email.trim();
        if (!cleanName) return { success: false, error: 'Vui lòng nhập Tên Thợ Săn' };
        if (!cleanEmail) return { success: false, error: 'Vui lòng nhập Email' };
        if (password.length < 6) return { success: false, error: 'Mật khẩu phải chứa ít nhất 6 ký tự' };

        try {
          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                display_name: cleanName,
              },
            },
          });

          if (error) {
            return { success: false, error: error.message };
          }

          if (!data.user) {
            return { success: false, error: 'Không thể khởi tạo tài khoản Thợ Săn, vui lòng thử lại' };
          }

          const newUserId = data.user.id;
          setStoredHunterId(newUserId);

          const starterTasks: Task[] = [
            {
              id: 'task_starter_oath',
              title: 'Tuyên thệ Khế Ước Thợ Săn & Khám phá thế giới FaeQuest',
              category: 'ca-nhan',
              difficulty: 'easy',
              completed: false,
              createdAt: Date.now(),
              rewardClaimed: false,
            },
            {
              id: 'task_starter_focus',
              title: 'Hoàn thành 1 phiên tập trung Fae Focus 25 phút đầu tiên',
              category: 'hoc-tap',
              difficulty: 'medium',
              completed: false,
              createdAt: Date.now(),
              focusDuration: 25,
              rewardClaimed: false,
            },
          ];

          if (typeof window !== 'undefined') {
            localStorage.setItem('faequest_oath_accepted', 'false');
          }

          const isAdminCandidate =
            cleanEmail.toLowerCase().includes('admin') ||
            cleanName.toLowerCase().includes('quản trị') ||
            cleanName.toLowerCase().includes('admin');
          const assignedRole: UserRole = isAdminCandidate ? 'admin' : 'user';

          const freshState: UserStateCloud = {
            playerName: cleanName,
            avatarUrl: '',
            exp: 0,
            coins: 25, // Quà Tân Binh 25 Xu Vàng
            completedTotal: 0,
            streakDays: 0,
            dailyCompletedCount: 0,
            dailyBossCompletedCount: 0,
            tasks: starterTasks,
            shopItems: INITIAL_SHOP_ITEMS,
            inventory: [],
            rivals: INITIAL_RIVALS,
            systemQuests: INITIAL_SYSTEM_QUESTS,
            unlockedTitleIds: ['title_tan_binh_gai_do'],
            equippedTitleId: 'title_tan_binh_gai_do',
            focusSessionsCompleted: 0,
          };

          // Save immediately to public.profiles and public.user_states
          await syncProfileAndStateToCloud(newUserId, freshState, assignedRole);

          const isAdmin = assignedRole === 'admin';
          if (isAdmin && typeof window !== 'undefined') {
            localStorage.setItem('faequest_oath_accepted', 'true');
          }

          if (data.session) {
            set({
              currentUser: { id: newUserId, email: cleanEmail, name: cleanName },
              hunterId: newUserId,
              userRole: assignedRole,
              activeTab: isAdmin ? 'admin' : 'quests',
              playerName: cleanName,
              avatarUrl: '',
              exp: 0,
              coins: 25,
              completedTotal: 0,
              streakDays: 0,
              dailyCompletedCount: 0,
              dailyBossCompletedCount: 0,
              tasks: starterTasks,
              shopItems: INITIAL_SHOP_ITEMS,
              inventory: [],
              rivals: INITIAL_RIVALS,
              systemQuests: INITIAL_SYSTEM_QUESTS,
              unlockedTitleIds: ['title_tan_binh_gai_do'],
              equippedTitleId: 'title_tan_binh_gai_do',
              focusSessionsCompleted: 0,
              isOathOpen: isAdmin ? false : true,
              cloudSyncStatus: 'synced',
              lastSyncedAt: new Date().toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            });
            get().fetchUserMessages();
            get().fetchSystemShopItems();
            get().fetchSystemAchievements();
            playSoundEffect('rankup', get().soundEnabled);
            get().addToast(`🎉 Chào mừng Tân Binh "${cleanName}"! Tặng ngay 25 Xu Vàng!`, 'success');
            return { success: true };
          } else {
            // Auto sign in with password in case confirmation isn't blocking
            const signInRes = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });

            if (signInRes.data.session) {
              set({
                currentUser: { id: newUserId, email: cleanEmail, name: cleanName },
                hunterId: newUserId,
                userRole: assignedRole,
                activeTab: isAdmin ? 'admin' : 'quests',
                playerName: cleanName,
                avatarUrl: '',
                exp: 0,
                coins: 25,
                completedTotal: 0,
                streakDays: 0,
                dailyCompletedCount: 0,
                dailyBossCompletedCount: 0,
                tasks: starterTasks,
                shopItems: INITIAL_SHOP_ITEMS,
                inventory: [],
                rivals: INITIAL_RIVALS,
                systemQuests: INITIAL_SYSTEM_QUESTS,
                unlockedTitleIds: ['title_tan_binh_gai_do'],
                equippedTitleId: 'title_tan_binh_gai_do',
                focusSessionsCompleted: 0,
                isOathOpen: isAdmin ? false : true,
                cloudSyncStatus: 'synced',
              });
              get().fetchUserMessages();
              get().fetchSystemShopItems();
              get().fetchSystemAchievements();
              playSoundEffect('rankup', get().soundEnabled);
              get().addToast(`🎉 Chào mừng Tân Binh "${cleanName}"! Tặng ngay 25 Xu Vàng!`, 'success');
              return { success: true };
            }

            return {
              success: true,
              error: 'Đăng ký thành công! Vui lòng kiểm tra email xác nhận hoặc đăng nhập ngay.',
            };
          }
        } catch (err: any) {
          return { success: false, error: err.message || 'Lỗi khi đăng ký' };
        }
      },

      signIn: async (email: string, password: string) => {
        const cleanEmail = email.trim();
        if (!cleanEmail || !password) {
          return { success: false, error: 'Vui lòng nhập đầy đủ Email và Mật khẩu' };
        }

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (error) {
            let msg = error.message;
            if (msg.toLowerCase().includes('invalid login credentials')) {
              msg = 'Email hoặc mật khẩu không chính xác';
            }
            return { success: false, error: msg };
          }

          if (!data.user) {
            return { success: false, error: 'Không tìm thấy thông tin tài khoản' };
          }

          const userId = data.user.id;
          setStoredHunterId(userId);

          // Load profile & state
          let { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          const hunterName =
            profile?.username ||
            data.user.user_metadata?.display_name ||
            cleanEmail.split('@')[0] ||
            'Thợ Săn Fae';

          const isAdminCandidate =
            cleanEmail.toLowerCase().includes('admin') ||
            hunterName.toLowerCase().includes('quản trị') ||
            hunterName.toLowerCase().includes('admin');

          // Tự động khởi tạo hồ sơ nếu chưa có trên máy chủ
          if (!profile) {
            const defaultRole: UserRole = isAdminCandidate ? 'admin' : 'user';
            const { data: createdProfile } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                username: hunterName,
                avatar_url: null,
                exp: 0,
                coins: 25,
                rank_id: 'dong',
                equipped_title: 'title_tan_binh_gai_do',
                role: defaultRole,
                streak: 0,
                completed_tasks_count: 0,
                updated_at: new Date().toISOString(),
              })
              .select('*')
              .maybeSingle();
            if (createdProfile) {
              profile = createdProfile;
            }
          }

          let userRole: UserRole = profile?.role === 'admin' ? 'admin' : 'user';
          // Tự động đồng bộ quyền Admin nếu tài khoản thuộc diện Quản Trị nhưng chưa được gán role
          if (userRole !== 'admin' && isAdminCandidate) {
            userRole = 'admin';
            await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
          }

          const { data: stateRow } = await supabase
            .from('user_states')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          const bannedUntil = profile?.banned_until || null;
          const banReason = profile?.ban_reason || null;
          const isAdmin = userRole === 'admin';

          if (isAdmin && typeof window !== 'undefined') {
            localStorage.setItem('faequest_oath_accepted', 'true');
          }

          if (stateRow?.state_json) {
            const s = stateRow.state_json;
            set({
              currentUser: { id: userId, email: cleanEmail, name: hunterName },
              hunterId: userId,
              userRole,
              bannedUntil,
              banReason,
              activeTab: isAdmin ? 'admin' : 'quests',
              isOathOpen: false,
              playerName: s.playerName || hunterName,
              avatarUrl: s.avatarUrl || profile?.avatar_url || '',
              exp: profile?.exp !== undefined ? profile.exp : (typeof s.exp === 'number' ? s.exp : 0),
              coins: profile?.coins !== undefined ? profile.coins : (typeof s.coins === 'number' ? s.coins : 25),
              completedTotal: profile?.completed_tasks_count !== undefined ? profile.completed_tasks_count : (typeof s.completedTotal === 'number' ? s.completedTotal : 0),
              streakDays: profile?.streak !== undefined ? profile.streak : (typeof s.streakDays === 'number' ? s.streakDays : 0),
              dailyCompletedCount: s.dailyCompletedCount || 0,
              dailyBossCompletedCount: s.dailyBossCompletedCount || 0,
              tasks: Array.isArray(s.tasks) ? s.tasks : [],
              shopItems: Array.isArray(s.shopItems) ? s.shopItems : INITIAL_SHOP_ITEMS,
              inventory: Array.isArray(s.inventory) ? s.inventory : [],
              rivals: Array.isArray(s.rivals) ? s.rivals : INITIAL_RIVALS,
              systemQuests: Array.isArray(s.systemQuests) ? s.systemQuests : INITIAL_SYSTEM_QUESTS,
              unlockedTitleIds: Array.isArray(s.unlockedTitleIds) ? s.unlockedTitleIds : ['title_tan_binh_gai_do'],
              equippedTitleId: s.equippedTitleId || profile?.equipped_title || 'title_tan_binh_gai_do',
              focusSessionsCompleted: s.focusSessionsCompleted || 0,
              cloudSyncStatus: 'synced',
              lastSyncedAt: new Date().toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            });
          } else {
            // First time login with no user_states:
            const starterTasks: Task[] = [
              {
                id: 'task_starter_oath',
                title: 'Tuyên thệ Khế Ước Thợ Săn & Khám phá thế giới FaeQuest',
                category: 'ca-nhan',
                difficulty: 'easy',
                completed: false,
                createdAt: Date.now(),
                rewardClaimed: false,
              },
              {
                id: 'task_starter_focus',
                title: 'Hoàn thành 1 phiên tập trung Fae Focus 25 phút đầu tiên',
                category: 'hoc-tap',
                difficulty: 'medium',
                completed: false,
                createdAt: Date.now(),
                focusDuration: 25,
                rewardClaimed: false,
              },
            ];

            set({
              currentUser: { id: userId, email: cleanEmail, name: hunterName },
              hunterId: userId,
              userRole,
              bannedUntil,
              banReason,
              activeTab: isAdmin ? 'admin' : 'quests',
              isOathOpen: isAdmin ? false : true,
              playerName: hunterName,
              avatarUrl: profile?.avatar_url || '',
              exp: profile?.exp || 0,
              coins: profile?.coins || 25,
              completedTotal: 0,
              streakDays: 0,
              dailyCompletedCount: 0,
              dailyBossCompletedCount: 0,
              tasks: starterTasks,
              shopItems: INITIAL_SHOP_ITEMS,
              inventory: [],
              rivals: INITIAL_RIVALS,
              systemQuests: INITIAL_SYSTEM_QUESTS,
              unlockedTitleIds: ['title_tan_binh_gai_do'],
              equippedTitleId: 'title_tan_binh_gai_do',
              focusSessionsCompleted: 0,
              cloudSyncStatus: 'synced',
            });
            await get().syncToCloud(true);
          }

          // Đồng bộ dữ liệu Live-Ops
          get().fetchUserMessages();
          get().fetchSystemShopItems();
          get().fetchSystemAchievements();

          playSoundEffect('complete', get().soundEnabled);
          get().addToast(`⚔️ Chào mừng Thợ Săn "${hunterName}" trở lại Đấu Trường!`, 'success');
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err.message || 'Lỗi khi đăng nhập' };
        }
      },

      signOut: async () => {
        // 1. Final sync to Supabase
        if (get().currentUser) {
          try {
            await get().syncToCloud(true);
          } catch (e) {
            console.warn('Final sync before sign out failed:', e);
          }
        }

        // 2. Supabase sign out
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.error('Error signing out:', e);
        }

        // 3. Reset in-memory store
        set({
          currentUser: null,
          userRole: 'user',
          bannedUntil: null,
          banReason: null,
          userMessages: [],
          unreadMessagesCount: 0,
          activeWarningMessage: null,
          isUserInboxOpen: false,
          hunterId: getOrInitHunterId(),
          playerName: 'Thợ Săn Fae',
          avatarUrl: '',
          exp: 0,
          coins: 0,
          completedTotal: 0,
          streakDays: 0,
          dailyCompletedCount: 0,
          dailyBossCompletedCount: 0,
          tasks: [],
          shopItems: INITIAL_SHOP_ITEMS,
          inventory: [],
          rivals: INITIAL_RIVALS,
          systemQuests: INITIAL_SYSTEM_QUESTS,
          unlockedTitleIds: ['title_tan_binh_gai_do'],
          equippedTitleId: 'title_tan_binh_gai_do',
          focusSessionsCompleted: 0,
          cloudSyncStatus: 'idle',
          lastSyncedAt: undefined,
        });

        get().addToast('🚪 Đã đăng xuất an toàn. Dữ liệu đã được lưu trữ trên Đám Mây.', 'info');
      },
    }),
    {
      name: 'faequest_ui_preferences',
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        language: state.language || 'vi',
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    }
  )
);
