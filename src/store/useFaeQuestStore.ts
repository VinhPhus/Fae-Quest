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
  MailRewardItem,
  RivalProfileData,
  JournalEntry,
  JournalMood,
  RewardPopupData,
  SeasonAnnouncement,
  AdminAsset,
  AdminAssetCategory,
} from '../types';
import { supabase } from '../utils/supabaseClient';
import { getTodayString, getTomorrowString, isTomorrowOrFutureDate } from '../utils/dateUtils';
import { RANK_TIERS, getRankIndexByExp } from '../constants/ranks';
import { DIFFICULTIES } from '../constants/categories';
import {
  INITIAL_TASKS,
  INITIAL_SHOP_ITEMS,
  INITIAL_INVENTORY,
} from '../constants/initialData';
import {
  INITIAL_SYSTEM_QUESTS,
  SYSTEM_TITLES,
  syncSystemTitlesWithAchievements,
  isDefaultSystemTitle,
  isTitleUnlocked,
  resolveTitleObject,
} from '../constants/systemQuests';
import { playSoundEffect } from '../utils/soundEffects';
import { playSound, setMasterVolume, startFocusAmbient, stopFocusAmbient, AmbientType } from '../utils/soundEngine';
import { triggerCoinBurst } from '../components/ui/CoinBurstOverlay';
import { deleteCloudinaryImages } from '../utils/cloudinaryDelete';
import { localizeError } from '../utils/errorLocalization';
import {
  syncProfileAndStateToCloud,
  restoreUserStateFromCloud,
  getOrInitHunterId,
  setStoredHunterId,
  UserStateCloud,
  HunterProfileCloud,
  fetchCommunityLeaderboard,
} from '../utils/syncManager';

export const MAX_INVENTORY_SLOTS = 50;

export const DEFAULT_ADMIN_ASSETS: AdminAsset[] = [
  {
    id: 'default-asset-1',
    name: 'Logo FaeQuest RPG',
    url: '/assets/logo.png',
    category: 'all',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-asset-coin',
    name: 'Xu Vàng Pixel',
    url: '/assets/coin.png',
    category: 'all',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-asset-title-tan-binh',
    name: 'Danh Hiệu: Tân Binh Gai Đỏ',
    url: '/assets/titles/title-tan-binh.png',
    category: 'achievement',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-asset-title-chien-binh',
    name: 'Danh Hiệu: Chiến Binh Bất Khuất',
    url: '/assets/titles/title-chien-binh.png',
    category: 'achievement',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-asset-title-che-ngu',
    name: 'Danh Hiệu: Kẻ Chế Ngự Thời Gian',
    url: '/assets/titles/title-che-ngu.png',
    category: 'achievement',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-asset-title-the-phach',
    name: 'Danh Hiệu: Thể Phách Kim Cương',
    url: '/assets/titles/title-the-phach.png',
    category: 'achievement',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-asset-title-hoc-gia',
    name: 'Danh Hiệu: Học Giả Huyền Bí',
    url: '/assets/titles/title-hoc-gia.png',
    category: 'achievement',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-asset-title-tho-san',
    name: 'Danh Hiệu: Thợ Săn Nhiệm Vụ',
    url: '/assets/titles/title-tho-san.png',
    category: 'achievement',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-asset-title-hien-nhan',
    name: 'Danh Hiệu: Hiền Nhân Tập Trung',
    url: '/assets/titles/title-hien-nhan.png',
    category: 'achievement',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-asset-title-doc-co',
    name: 'Danh Hiệu: Độc Cô Cầu Bại',
    url: '/assets/titles/title-doc-co.png',
    category: 'achievement',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-rank-dong',
    name: 'Rank Pixel: Đồng',
    url: '/assets/ranks/rank-dong.png',
    category: 'all',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-rank-bac',
    name: 'Rank Pixel: Bạc',
    url: '/assets/ranks/rank-bac.png',
    category: 'all',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-rank-vang',
    name: 'Rank Pixel: Vàng',
    url: '/assets/ranks/rank-vang.png',
    category: 'all',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-rank-luc-bao',
    name: 'Rank Pixel: Lục Bảo',
    url: '/assets/ranks/rank-luc-bao.png',
    category: 'all',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-rank-cao-thu',
    name: 'Rank Pixel: Cao Thủ',
    url: '/assets/ranks/rank-cao-thu.png',
    category: 'all',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-rank-dai-cao-thu',
    name: 'Rank Pixel: Đại Cao Thủ',
    url: '/assets/ranks/rank-dai-cao-thu.png',
    category: 'all',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-rank-thach-dau',
    name: 'Rank Pixel: Thách Đấu',
    url: '/assets/ranks/rank-thach-dau.png',
    category: 'all',
    created_at: new Date().toISOString(),
  },
];

interface FaeQuestState {
  playerName: string;
  avatarUrl: string;
  coverUrl?: string;
  exp: number;
  coins: number;
  stars: number;
  completedTotal: number;
  streakDays: number;
  lastActiveDate: string;
  soundEnabled: boolean;
  soundVolume: number;
  focusAmbient: AmbientType;
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
  adminPortalTab: 'users' | 'shop' | 'achievements' | 'analytics' | 'announcements' | 'assets';
  adminAssets: AdminAsset[];
  seasonAnnouncements: SeasonAnnouncement[];
  isSeasonAnnouncementsModalOpen: boolean;
  isSeasonResetModalOpen: boolean;
  unreadAnnouncementsCount: number;
  systemShopItems: SystemShopItem[];
  systemAchievements: SystemAchievement[];
  userMessages: UserMessage[];
  unreadMessagesCount: number;
  isUserInboxOpen: boolean;
  activeWarningMessage: UserMessage | null;

  // UI state
  activeTab: ActiveTab;
  shopSubTab: 'shop' | 'inventory';
  activeCategoryFilter: string;
  activeStatusFilter: string;
  activeDayTab: 'today' | 'tomorrow';
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
  communityProfiles: HunterProfileCloud[];
  activePomodoroTaskId: string | null;
  activeFocusTaskId: string | null;
  isFocusRunning: boolean;
  focusTimeLeft: number;
  focusTargetMinutes: number;
  isFocusModalOpen: boolean;
  hasSeenTutorial: boolean;
  deferredInstallPrompt: any | null;
  setDeferredInstallPrompt: (prompt: any | null) => void;
  isAppStandalone: boolean;
  setIsAppStandalone: (isStandalone: boolean) => void;
  isOathOpen: boolean;
  isChangeCoverOpen: boolean;
  selectedRivalForModal: RivalProfileData | null;
  isRivalModalOpen: boolean;
  journals: JournalEntry[];
  isWriteJournalOpen: boolean;
  editingJournal: JournalEntry | null;
  editingTask: Task | null;
  isEditQuestOpen: boolean;
  confirmEarlyTask: { task: Task; coords?: { x: number; y: number } } | null;
  lastCompletedTimestamp: number;
  floatingRewards: FloatingRewardItem[];
  rewardPopup: RewardPopupData | null;
  toasts: ToastMessage[];

  // Actions
  setWriteJournalOpen: (open: boolean, journalToEdit?: JournalEntry | null) => void;
  fetchJournals: () => Promise<void>;
  saveJournal: (entry: { id?: string; date: string; mood: JournalMood; content: string; images: string[] }) => Promise<boolean>;
  deleteJournal: (id: string) => Promise<boolean>;
  clearAllJournalsAndImages: () => Promise<boolean>;
  syncJournalRealtime: (payload: any) => void;
  setUserRole: (role: UserRole) => void;
  setAdminPortalTab: (tab: 'users' | 'shop' | 'achievements' | 'analytics' | 'announcements' | 'assets') => void;
  fetchAdminAssets: () => Promise<void>;
  addAdminAsset: (item: { name: string; url: string; category?: AdminAssetCategory }) => Promise<boolean>;
  deleteAdminAsset: (id: string) => Promise<boolean>;
  setSeasonAnnouncementsModalOpen: (open: boolean) => void;
  setSeasonResetModalOpen: (open: boolean) => void;
  fetchSeasonAnnouncements: () => Promise<void>;
  addSeasonAnnouncement: (item: Omit<SeasonAnnouncement, 'id' | 'created_at'>) => Promise<boolean>;
  updateSeasonAnnouncement: (id: string, item: Partial<SeasonAnnouncement>) => Promise<boolean>;
  deleteSeasonAnnouncement: (id: string) => Promise<boolean>;
  togglePinSeasonAnnouncement: (id: string, is_pinned: boolean) => Promise<boolean>;
  resetSeasonRank: (seasonTitle?: string, customNotice?: string) => Promise<{ success: boolean; affectedCount: number; error?: string }>;
  markAnnouncementsAsRead: () => void;
  setUserInboxOpen: (open: boolean) => void;
  setActiveWarningMessage: (msg: UserMessage | null) => void;
  fetchUserMessages: () => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  markAllMessagesAsRead: () => Promise<void>;
  deleteUserMessage: (messageId: string) => Promise<boolean>;
  clearClaimedMessages: () => Promise<number>;
  fetchSystemShopItems: () => Promise<void>;
  addSystemShopItem: (item: Omit<SystemShopItem, 'id' | 'created_at'>) => Promise<boolean>;
  updateSystemShopItem: (id: string, item: Partial<SystemShopItem>) => Promise<boolean>;
  deleteSystemShopItem: (id: string) => Promise<boolean>;
  fetchSystemAchievements: () => Promise<void>;
  checkAndUnlockAchievements: () => void;
  addSystemAchievement: (achievement: Omit<SystemAchievement, 'id' | 'created_at'>) => Promise<boolean>;
  updateSystemAchievement: (id: string, achievement: Partial<SystemAchievement>) => Promise<boolean>;
  deleteSystemAchievement: (id: string) => Promise<boolean>;
  adminSendMail: (
    receiverId: string,
    subject: string,
    content: string,
    type?: 'warning' | 'notice' | 'gift',
    rewardExp?: number,
    rewardCoins?: number,
    rewardStars?: number,
    rewardItems?: MailRewardItem[]
  ) => Promise<boolean>;
  claimMailReward: (messageId: string) => Promise<{ success: boolean; error?: string }>;
  adminBanUser: (targetUserId: string, hours: number, reason: string) => Promise<boolean>;
  adminDeleteUser: (targetUserId: string) => Promise<boolean>;
  adminSetUserRole: (targetUserId: string, newRole: UserRole) => Promise<boolean>;
  setLanguage: (lang: string) => void;
  setPlayerName: (name: string) => void;
  setAvatarUrl: (url: string) => Promise<void>;
  setCoverUrl: (url: string) => Promise<void>;
  setChangeCoverOpen: (open: boolean) => void;
  openRivalModal: (data: RivalProfileData) => void;
  closeRivalModal: () => void;
  toggleSound: () => void;
  setSoundVolume: (volume: number) => void;
  setFocusAmbient: (ambient: AmbientType) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setShopSubTab: (subTab: 'shop' | 'inventory') => void;
  setCategoryFilter: (cat: string) => void;
  setStatusFilter: (status: string) => void;
  setActiveDayTab: (tab: 'today' | 'tomorrow') => void;
  addTask: (
    title: string,
    category: TaskCategory,
    difficulty: TaskDifficulty,
    isDailyRecurring?: boolean,
    focusDuration?: number | null,
    description?: string,
    target_date?: string
  ) => void;
  updateTaskFocusDuration: (taskId: string, duration: number) => void;
  toggleTask: (id: string, coords?: { x: number; y: number }, forceSkipAgeCheck?: boolean) => Promise<void> | void;
  confirmEarlyTaskCompletion: () => void;
  cancelEarlyTaskConfirmation: () => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  setEditingTask: (task: Task | null) => void;
  completePomodoro: (taskId: string, elapsedMinutes?: number, targetMinutes?: number) => Promise<void> | void;
  buyShopItem: (itemId: string, coords?: { x: number; y: number }) => Promise<void> | void;
  addShopItem: (title: string, desc: string, cost: number, emoji: string) => void;
  deleteShopItem: (itemId: string) => void;
  useInventoryTicket: (ticketId: string) => void;
  grantDemoBoost: (amount?: number) => void;
  triggerRewardPopup: (data: Omit<RewardPopupData, 'isOpen'>) => void;
  closeRewardPopup: () => void;
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
  setActivePomodoroTaskId: (id: string | null) => void;
  startFocusForTask: (taskId: string, durationMinutes?: number) => void;
  toggleFocusRunning: () => void;
  setFocusRunning: (running: boolean) => void;
  setFocusTimeLeft: (seconds: number) => void;
  setFocusTargetMinutes: (minutes: number) => void;
  tickFocusTimer: () => void;
  cancelFocus: () => void;
  setFocusModalOpen: (open: boolean) => void;
  resetAllData: () => Promise<boolean>;
  addToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
  checkDailyReset: () => void;
  checkInStreakQuest: (questId: string) => Promise<void> | void;
  resetStreakQuest: (questId: string) => void;
  claimSystemQuestReward: (questId: string) => void;
  equipTitle: (titleId: string) => void;
  checkSystemMilestones: () => void;
  cleanupExpiredInventory: () => void;
  setHasSeenTutorial: (seen: boolean) => Promise<void>;
  setHunterId: (id: string) => void;
  syncToCloud: (silent?: boolean) => Promise<boolean>;
  restoreFromCloud: (targetHunterId: string) => Promise<boolean>;
  fetchCommunityProfiles: () => Promise<HunterProfileCloud[]>;

  // Authentication Actions
  initAuth: () => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

let autoSyncTimer: any = null;
let rewardPopupTimer: any = null;
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
      coverUrl: '',
      exp: 0,
      coins: 25,
      stars: 0,
      completedTotal: 0,
      streakDays: 0,
      lastActiveDate: getTodayString(),
      soundEnabled: true,
      soundVolume: 75,
      focusAmbient: 'rain',
      dailyCompletedCount: 0,
      dailyBossCompletedCount: 0,
      tasks: INITIAL_TASKS,
      shopItems: INITIAL_SHOP_ITEMS,
      inventory: INITIAL_INVENTORY,
      rivals: [],
      communityProfiles: [],
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
      adminAssets: DEFAULT_ADMIN_ASSETS,
      seasonAnnouncements: [],
      isSeasonAnnouncementsModalOpen: false,
      isSeasonResetModalOpen: false,
      unreadAnnouncementsCount: 0,
      systemShopItems: [],
      systemAchievements: [],
      userMessages: [],
      unreadMessagesCount: 0,
      isUserInboxOpen: false,
      activeWarningMessage: null,

      activeTab: 'quests',
      shopSubTab: 'shop',
      activeCategoryFilter: 'all',
      activeStatusFilter: 'all',
      activeDayTab: 'today',
      setActiveDayTab: (tab: 'today' | 'tomorrow') => set({ activeDayTab: tab }),
      searchQuery: '',
      isCreateQuestOpen: false,
      questViewMode: 'bento',
      rankUpData: null,
      isRoadmapOpen: false,
      isRenameOpen: false,
      isResetOpen: false,
      isSettingsOpen: false,
      deferredInstallPrompt: null,
      isAppStandalone: false,
      isChangeCoverOpen: false,
      selectedRivalForModal: null,
      isRivalModalOpen: false,
      journals: [],
      rewardPopup: null,
      isWriteJournalOpen: false,
      editingJournal: null,
      isOathOpen: typeof window !== 'undefined' ? localStorage.getItem('faequest_oath_accepted') !== 'true' : false,
      confirmEarlyTask: null,
      lastCompletedTimestamp: 0,
      isSidebarCollapsed: false,
      language: 'vi',
      setLanguage: (lang: string) => set({ language: lang }),
      setUserRole: (role: UserRole) => set({ userRole: role }),
      setAdminPortalTab: (tab: 'users' | 'shop' | 'achievements' | 'analytics' | 'announcements' | 'assets') => set({ adminPortalTab: tab }),
      setSeasonAnnouncementsModalOpen: (open: boolean) => set({ isSeasonAnnouncementsModalOpen: open }),
      setSeasonResetModalOpen: (open: boolean) => set({ isSeasonResetModalOpen: open }),
      setUserInboxOpen: (open: boolean) => set({ isUserInboxOpen: open }),
      setActiveWarningMessage: (msg: UserMessage | null) => set({ activeWarningMessage: msg }),

      setWriteJournalOpen: (open: boolean, journalToEdit?: JournalEntry | null) =>
        set({ isWriteJournalOpen: open, editingJournal: journalToEdit || null }),

      fetchJournals: async () => {
        const currentUser = get().currentUser;
        const userId = currentUser?.id;
        if (!userId) return;

        try {
          const { data, error } = await supabase
            .from('journals')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

          if (error) {
            console.error('Supabase fetch journals error:', error);
            return;
          }

          if (data) {
            set({ journals: data as JournalEntry[] });
          }
        } catch (e) {
          console.error('Exception fetching journals:', e);
        }
      },

      saveJournal: async (entry: { id?: string; date: string; mood: JournalMood; content: string; images: string[] }) => {
        const currentUser = get().currentUser;
        if (!currentUser?.id) {
          get().addToast('Vui lòng đăng nhập để lưu nhật ký!', 'error');
          return false;
        }
        const userId = currentUser.id;
        const nowIso = new Date().toISOString();
        const isUpdate = Boolean(entry.id);

        try {
          if (isUpdate && entry.id) {
            const { data, error } = await supabase
              .from('journals')
              .update({
                date: entry.date,
                mood: entry.mood,
                content: entry.content,
                images: entry.images || [],
                updated_at: nowIso,
              })
              .eq('id', entry.id)
              .eq('user_id', userId)
              .select('*')
              .single();

            if (error || !data) {
              console.error('Supabase update journal error:', error);
              get().addToast(localizeError(error, 'Lỗi khi cập nhật nhật ký lên máy chủ!'), 'error');
              return false;
            }

            const updatedRecord = data as JournalEntry;
            const existing = get().journals || [];
            const nextList = existing.map((j) => (j.id === updatedRecord.id ? updatedRecord : j));
            nextList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            set({ journals: nextList, isWriteJournalOpen: false, editingJournal: null });
            playSound('scroll_open');
            get().addToast('Cập nhật trang nhật ký thành công!', 'success');
            return true;
          } else {
            const { data, error } = await supabase
              .from('journals')
              .insert({
                user_id: userId,
                date: entry.date,
                mood: entry.mood,
                content: entry.content,
                images: entry.images || [],
                created_at: nowIso,
                updated_at: nowIso,
              })
              .select('*')
              .single();

            if (error || !data) {
              console.error('Supabase insert journal error:', error);
              get().addToast(localizeError(error, 'Lỗi khi lưu nhật ký lên máy chủ!'), 'error');
              return false;
            }

            const newRecord = data as JournalEntry;
            const existing = get().journals || [];
            const nextList = [newRecord, ...existing.filter((j) => j.id !== newRecord.id)];
            nextList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            set({ journals: nextList, isWriteJournalOpen: false, editingJournal: null });
            playSound('scroll_open');
            get().addToast('Đã ghi lại nhật ký hành trình hôm nay!', 'success');
            return true;
          }
        } catch (err: any) {
          console.error('Exception saving journal to Supabase:', err);
          get().addToast(localizeError(err, 'Lỗi kết nối máy chủ khi lưu nhật ký!'), 'error');
          return false;
        }
      },

      deleteJournal: async (id: string) => {
        const currentUser = get().currentUser;
        if (!currentUser?.id) return false;

        const targetJournal = get().journals.find((j) => j.id === id);

        try {
          const { error } = await supabase
            .from('journals')
            .delete()
            .eq('id', id)
            .eq('user_id', currentUser.id);

          if (error) {
            console.error('Supabase delete journal error:', error);
            get().addToast('Không thể xóa bài nhật ký trên máy chủ!', 'error');
            return false;
          }

          // Tự động xóa các ảnh đính kèm của bài viết trên Cloudinary
          if (targetJournal?.images && targetJournal.images.length > 0) {
            deleteCloudinaryImages(targetJournal.images).catch((e) =>
              console.warn('Lỗi tự động dọn dẹp ảnh Cloudinary khi xóa nhật ký:', e)
            );
          }

          set((state) => ({
            journals: state.journals.filter((j) => j.id !== id),
          }));
          get().addToast('Đã xóa bài nhật ký và dọn dẹp ảnh đính kèm!', 'info');
          return true;
        } catch (err: any) {
          console.error('Exception deleting journal:', err);
          get().addToast('Lỗi khi xóa bài nhật ký!', 'error');
          return false;
        }
      },

      clearAllJournalsAndImages: async (): Promise<boolean> => {
        const currentUser = get().currentUser;
        if (!currentUser?.id) return false;

        try {
          // 1. Gom tất cả URL ảnh từ toàn bộ bài nhật ký của user
          const allImages: string[] = [];
          get().journals.forEach((j) => {
            if (Array.isArray(j.images)) {
              j.images.forEach((img) => {
                if (img) allImages.push(img);
              });
            }
          });

          // 2. Xóa các ảnh trên Cloudinary song song
          if (allImages.length > 0) {
            await deleteCloudinaryImages(allImages).catch((e) =>
              console.warn('Lỗi dọn dẹp ảnh nhật ký trên Cloudinary:', e)
            );
          }

          // 3. Xóa toàn bộ bản ghi journals trên Supabase
          const { error } = await supabase
            .from('journals')
            .delete()
            .eq('user_id', currentUser.id);

          if (error) {
            console.error('Lỗi khi xóa tất cả nhật ký trên Supabase:', error);
            get().addToast('Lỗi khi xóa nhật ký trên máy chủ!', 'error');
            return false;
          }

          // 4. Cập nhật state
          set({ journals: [] });
          get().addToast('Đã xóa sạch toàn bộ Nhật Ký và giải phóng bộ nhớ ảnh!', 'success');
          return true;
        } catch (err) {
          console.error('Lỗi ngoại lệ khi xóa toàn bộ nhật ký:', err);
          get().addToast('Không thể hoàn tất dọn dẹp nhật ký!', 'error');
          return false;
        }
      },

      syncJournalRealtime: (payload: any) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        if (eventType === 'INSERT' && newRecord) {
          set((state) => {
            const exists = state.journals.some((j) => j.id === newRecord.id);
            if (exists) return state;
            const updated = [newRecord as JournalEntry, ...state.journals];
            updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return { journals: updated };
          });
        } else if (eventType === 'UPDATE' && newRecord) {
          set((state) => {
            const updated = state.journals.map((j) =>
              j.id === newRecord.id ? (newRecord as JournalEntry) : j
            );
            updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return { journals: updated };
          });
        } else if (eventType === 'DELETE' && oldRecord) {
          set((state) => ({
            journals: state.journals.filter((j) => j.id !== oldRecord.id),
          }));
        } else {
          get().fetchJournals();
        }
      },

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

      deleteUserMessage: async (messageId: string) => {
        const state = get();
        const msg = state.userMessages.find((m) => m.id === messageId);
        if (!msg) return false;

        const hasRewards = Boolean(
          (msg.reward_exp && msg.reward_exp > 0) ||
          (msg.reward_coins && msg.reward_coins > 0) ||
          (msg.reward_stars && msg.reward_stars > 0) ||
          (msg.reward_items && msg.reward_items.length > 0)
        );

        if (hasRewards && !msg.is_claimed) {
          get().addToast('⚠️ Thư có phần thưởng chưa nhận, không thể xóa!', 'error');
          return false;
        }

        try {
          const { error } = await supabase.from('user_messages').delete().eq('id', messageId);
          if (error) {
            await supabase.rpc('rpc_delete_user_message', { p_message_id: messageId });
          }

          set((prev) => {
            const filtered = prev.userMessages.filter((m) => m.id !== messageId);
            return {
              userMessages: filtered,
              unreadMessagesCount: filtered.filter((m) => !m.is_read).length,
            };
          });

          playSoundEffect('trash', get().soundEnabled);
          get().addToast('🗑️ Đã xóa thư khỏi hộp thư.', 'info');
          return true;
        } catch (err: any) {
          get().addToast(localizeError(err, 'Lỗi khi xóa thư'), 'error');
          return false;
        }
      },

      clearClaimedMessages: async () => {
        const state = get();
        const deletable = state.userMessages.filter((m) => {
          const hasRewards = Boolean(
            (m.reward_exp && m.reward_exp > 0) ||
            (m.reward_coins && m.reward_coins > 0) ||
            (m.reward_stars && m.reward_stars > 0) ||
            (m.reward_items && m.reward_items.length > 0)
          );
          return m.is_claimed || (!hasRewards && m.is_read);
        });

        if (deletable.length === 0) {
          get().addToast('Không có thư đã nhận hoặc đã đọc nào để dọn dẹp', 'info');
          return 0;
        }

        const ids = deletable.map((m) => m.id);
        try {
          const { error } = await supabase.from('user_messages').delete().in('id', ids);
          if (error) {
            await supabase.rpc('rpc_clear_claimed_user_messages');
          }

          set((prev) => {
            const remaining = prev.userMessages.filter((m) => !ids.includes(m.id));
            return {
              userMessages: remaining,
              unreadMessagesCount: remaining.filter((m) => !m.is_read).length,
            };
          });

          playSoundEffect('trash', get().soundEnabled);
          get().addToast(`🗑️ Đã dọn dẹp ${ids.length} thư khỏi hộp thư thành công!`, 'success');
          return ids.length;
        } catch (err: any) {
          get().addToast(localizeError(err, 'Lỗi khi dọn dẹp hộp thư'), 'error');
          return 0;
        }
      },

      fetchAdminAssets: async () => {
        try {
          const { data, error } = await supabase
            .from('admin_assets')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            set({ adminAssets: data as AdminAsset[] });
          } else {
            if (typeof window !== 'undefined') {
              const cached = localStorage.getItem('faequest_local_admin_assets');
              if (cached) {
                try {
                  const parsed = JSON.parse(cached);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    set({ adminAssets: parsed });
                    return;
                  }
                } catch { }
              }
            }
            set({ adminAssets: DEFAULT_ADMIN_ASSETS });
          }
        } catch (e) {
          console.error('Error fetching admin assets:', e);
          set({ adminAssets: DEFAULT_ADMIN_ASSETS });
        }
      },

      addAdminAsset: async ({ name, url, category = 'all' }) => {
        const cleanName = (name || '').trim();
        const cleanUrl = (url || '').trim();
        if (!cleanName || !cleanUrl) {
          get().addToast('Vui lòng nhập tên và link ảnh!', 'error');
          return false;
        }

        const payload = {
          name: cleanName,
          url: cleanUrl,
          category: category || 'all',
        };

        try {
          const { error } = await supabase.from('admin_assets').insert([payload]);

          if (error) {
            console.warn('Supabase add asset warning, using local fallback:', error);
            const newLocalItem: AdminAsset = {
              id: `asset_${Date.now()}`,
              name: cleanName,
              url: cleanUrl,
              category: category || 'all',
              created_at: new Date().toISOString(),
            };
            const current = get().adminAssets;
            const updated = [newLocalItem, ...current];
            set({ adminAssets: updated });
            if (typeof window !== 'undefined') {
              localStorage.setItem('faequest_local_admin_assets', JSON.stringify(updated));
            }
            get().addToast('Đã lưu tài nguyên vào kho!', 'success');
            return true;
          }

          await get().fetchAdminAssets();
          get().addToast('Đã lưu tài nguyên vào kho thành công!', 'success');
          return true;
        } catch (e: any) {
          get().addToast(localizeError(e, 'Lỗi khi lưu tài nguyên'), 'error');
          return false;
        }
      },

      deleteAdminAsset: async (id: string) => {
        try {
          const { error } = await supabase.from('admin_assets').delete().eq('id', id);

          if (error) {
            console.warn('Supabase delete asset warning, using local fallback:', error);
          }
          const updated = get().adminAssets.filter((a) => a.id !== id);
          set({ adminAssets: updated });
          if (typeof window !== 'undefined') {
            localStorage.setItem('faequest_local_admin_assets', JSON.stringify(updated));
          }
          get().addToast('Đã xóa tài nguyên khỏi kho', 'info');
          return true;
        } catch (e: any) {
          get().addToast(localizeError(e, 'Lỗi khi xóa tài nguyên'), 'error');
          return false;
        }
      },

      fetchSeasonAnnouncements: async () => {
        try {
          const { data, error } = await supabase
            .from('season_announcements')
            .select('*')
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false });

          if (!error && data) {
            set({ seasonAnnouncements: data as SeasonAnnouncement[] });
            const lastSeen = typeof window !== 'undefined' ? localStorage.getItem('faequest_last_seen_announcement_time') : null;
            if (!lastSeen) {
              set({ unreadAnnouncementsCount: data.length });
            } else {
              const lastTime = new Date(lastSeen).getTime();
              const unread = data.filter((item) => new Date(item.created_at).getTime() > lastTime).length;
              set({ unreadAnnouncementsCount: unread });
            }
          } else {
            if (typeof window !== 'undefined') {
              const cached = localStorage.getItem('faequest_local_season_announcements');
              if (cached) {
                try {
                  const parsed = JSON.parse(cached);
                  set({ seasonAnnouncements: parsed });
                } catch { }
              }
            }
          }
        } catch (e) {
          console.error('Error fetching season announcements:', e);
        }
      },

      addSeasonAnnouncement: async (item) => {
        try {
          const payload = {
            season_tag: item.season_tag || 'Mùa 1',
            title: item.title,
            content: item.content,
            image_url: item.image_url || null,
            is_pinned: item.is_pinned ?? false,
            created_by: get().currentUser?.name || get().playerName || 'Quản Trị Viên',
          };

          const { error } = await supabase
            .from('season_announcements')
            .insert([payload]);

          if (error) {
            console.warn('Supabase add announcement warning, using local fallback:', error);
            const newLocalItem: SeasonAnnouncement = {
              id: `local_ann_${Date.now()}`,
              season_tag: item.season_tag || 'Mùa 1',
              title: item.title,
              content: item.content,
              image_url: item.image_url || null,
              is_pinned: item.is_pinned ?? false,
              created_by: get().currentUser?.name || get().playerName || 'Quản Trị Viên',
              created_at: new Date().toISOString(),
            };
            const current = get().seasonAnnouncements;
            const updated = [newLocalItem, ...current];
            set({ seasonAnnouncements: updated });
            if (typeof window !== 'undefined') {
              localStorage.setItem('faequest_local_season_announcements', JSON.stringify(updated));
            }
            get().addToast('Đã đăng thông báo mùa giải lên BXH!', 'success');
            return true;
          }

          await get().fetchSeasonAnnouncements();
          get().addToast('Đã đăng thông báo mùa giải lên BXH!', 'success');
          return true;
        } catch (e: any) {
          get().addToast(localizeError(e, 'Lỗi khi đăng thông báo'), 'error');
          return false;
        }
      },

      updateSeasonAnnouncement: async (id, item) => {
        try {
          const { error } = await supabase
            .from('season_announcements')
            .update(item)
            .eq('id', id);

          if (error) {
            console.warn('Supabase update announcement warning, using local fallback:', error);
            const updated = get().seasonAnnouncements.map((a) =>
              a.id === id ? { ...a, ...item } : a
            );
            set({ seasonAnnouncements: updated });
            if (typeof window !== 'undefined') {
              localStorage.setItem('faequest_local_season_announcements', JSON.stringify(updated));
            }
            get().addToast('Đã cập nhật thông báo thành công!', 'success');
            return true;
          }

          await get().fetchSeasonAnnouncements();
          get().addToast('Đã cập nhật thông báo thành công!', 'success');
          return true;
        } catch (e: any) {
          get().addToast(localizeError(e, 'Lỗi cập nhật thông báo'), 'error');
          return false;
        }
      },

      deleteSeasonAnnouncement: async (id) => {
        try {
          const { error } = await supabase
            .from('season_announcements')
            .delete()
            .eq('id', id);

          if (error) {
            console.warn('Supabase delete announcement warning, using local fallback:', error);
            const updated = get().seasonAnnouncements.filter((a) => a.id !== id);
            set({ seasonAnnouncements: updated });
            if (typeof window !== 'undefined') {
              localStorage.setItem('faequest_local_season_announcements', JSON.stringify(updated));
            }
            get().addToast('Đã xóa thông báo mùa giải', 'info');
            return true;
          }

          await get().fetchSeasonAnnouncements();
          get().addToast('Đã xóa thông báo mùa giải', 'info');
          return true;
        } catch (e: any) {
          get().addToast(localizeError(e, 'Lỗi khi xóa thông báo'), 'error');
          return false;
        }
      },

      togglePinSeasonAnnouncement: async (id, is_pinned) => {
        return get().updateSeasonAnnouncement(id, { is_pinned });
      },

      markAnnouncementsAsRead: () => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('faequest_last_seen_announcement_time', new Date().toISOString());
        }
        set({ unreadAnnouncementsCount: 0 });
      },

      resetSeasonRank: async (seasonTitle = 'Mùa Mới', customNotice) => {
        try {
          // 1. Fetch all non-admin profiles from Supabase
          const { data: profiles, error: pErr } = await supabase
            .from('profiles')
            .select('id, username, exp, rank_id, role')
            .neq('role', 'admin');

          if (pErr) throw pErr;

          if (!profiles || profiles.length === 0) {
            return { success: true, affectedCount: 0 };
          }

          let affectedCount = 0;
          const currentUserId = get().currentUser?.id || get().hunterId;

          // 2. Compute new rank and exp for each player
          for (const p of profiles) {
            const currentExp = Number(p.exp) || 0;
            const currentIdx = getRankIndexByExp(currentExp);
            const newIdx = Math.max(0, currentIdx - 2);
            const newExp = RANK_TIERS[newIdx].minExp;
            const newTierId = RANK_TIERS[newIdx].id;

            // Update public.profiles
            const { error: updErr } = await supabase
              .from('profiles')
              .update({
                exp: newExp,
                rank_id: newTierId,
                updated_at: new Date().toISOString(),
              })
              .eq('id', p.id);

            if (!updErr) {
              affectedCount++;

              // Update public.user_states if exists
              try {
                const { data: userStateRow } = await supabase
                  .from('user_states')
                  .select('state_json')
                  .eq('user_id', p.id)
                  .maybeSingle();

                if (userStateRow && userStateRow.state_json) {
                  const updatedState = { ...userStateRow.state_json, exp: newExp };
                  await supabase
                    .from('user_states')
                    .update({
                      state_json: updatedState,
                      updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', p.id);
                }
              } catch (stateErr) {
                console.warn(`Error updating user_states for ${p.id}:`, stateErr);
              }

              // If this is the current active player, update local store state
              if (p.id === currentUserId) {
                set({ exp: newExp });
              }
            }
          }

          // 3. Automatically post a system announcement
          const noticeContent =
            customNotice ||
            `⚔️ Mùa giải "${seasonTitle}" đã chính thức khởi tranh!\nToàn bộ Thợ Săn trên Đấu Trường đã được giảm 2 bậc Rank để sẵn sàng cho cuộc đua vinh quang mới.\n\nHãy hoàn thành nhiệm vụ mỗi ngày, thắp sáng ngọn lửa kỷ luật và khắc tên bạn lên Bục Vinh Quang!`;

          await get().addSeasonAnnouncement({
            season_tag: seasonTitle,
            title: `⚔️ Khởi Tranh Mùa Giải: ${seasonTitle}`,
            content: noticeContent,
            is_pinned: true,
            image_url: null,
          });

          // 4. Reload leaderboard
          await get().fetchCommunityProfiles();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('faequest:reload_leaderboard'));
          }

          get().addToast(`Đã Reset Rank thành công cho ${affectedCount} Thợ Săn!`, 'success');
          return { success: true, affectedCount };
        } catch (err: any) {
          console.error('Error resetting season rank:', err);
          get().addToast(localizeError(err, 'Lỗi khi Reset Rank Mùa Giải'), 'error');
          return { success: false, affectedCount: 0, error: err.message };
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
          get().addToast(localizeError(e, 'Lỗi thêm vật phẩm hệ thống'), 'error');
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
          get().addToast(localizeError(e, 'Lỗi cập nhật vật phẩm'), 'error');
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
          get().addToast(localizeError(e, 'Lỗi xóa vật phẩm'), 'error');
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

            // Đồng bộ dynamic titles vào SYSTEM_TITLES
            syncSystemTitlesWithAchievements(achievements);

            const validAchIds = new Set(achievements.map((a) => a.id));
            const currentQuests = get().systemQuests;

            // Map lưu giữ tiến độ cá nhân của người dùng cho từng quest
            const progressMap = new Map<string, Partial<SystemQuest>>();
            for (const q of currentQuests) {
              progressMap.set(q.id, {
                currentStreak: q.currentStreak,
                lastCheckInDate: q.lastCheckInDate,
                lastResetDate: q.lastResetDate,
                isCompleted: q.isCompleted,
                isRewardClaimed: q.isRewardClaimed,
              });
            }

            // 1. Quests mặc định cố định từ INITIAL_SYSTEM_QUESTS
            const newQuests: SystemQuest[] = INITIAL_SYSTEM_QUESTS.map((base) => {
              const prev = progressMap.get(base.id);
              if (prev) {
                return {
                  ...base,
                  currentStreak: prev.currentStreak ?? base.currentStreak,
                  lastCheckInDate: prev.lastCheckInDate ?? base.lastCheckInDate,
                  lastResetDate: prev.lastResetDate ?? base.lastResetDate,
                  isCompleted: prev.isCompleted ?? base.isCompleted,
                  isRewardClaimed: prev.isRewardClaimed ?? base.isRewardClaimed,
                };
              }
              return base;
            });

            // 2. Thành tựu động hiện hữu từ Supabase (SINGLE SOURCE OF TRUTH)
            let unlockedTitlesUpdated = [...get().unlockedTitleIds];
            let unlockedChanged = false;

            for (const ach of achievements) {
              const questId = `sys_${ach.id}`;
              const prev = progressMap.get(questId) || progressMap.get(ach.id);
              const isStreak = ach.achievement_type === 'streak_counter';
              let milestoneKey: 'completedTasks' | 'focusSessions' | undefined;
              if (ach.achievement_type === 'milestone_tasks') milestoneKey = 'completedTasks';
              if (ach.achievement_type === 'milestone_focus') milestoneKey = 'focusSessions';

              let autoCompleted = false;
              if (isStreak) {
                autoCompleted = (prev?.currentStreak || 0) >= ach.target_value;
              } else if (ach.achievement_type === 'milestone_tasks') {
                autoCompleted = get().completedTotal >= ach.target_value;
              } else if (ach.achievement_type === 'milestone_focus') {
                autoCompleted = get().focusSessionsCompleted >= ach.target_value;
              } else if (ach.achievement_type === 'milestone_exp') {
                autoCompleted = get().exp >= ach.target_value;
              }

              const isCompleted = prev?.isCompleted || autoCompleted;
              const titleName = (ach.granted_title_name && ach.granted_title_name.trim())
                ? ach.granted_title_name.trim()
                : (ach.title || 'Vinh Quang Fae');
              const rewardTitleId = `sys_title_${ach.id}`;

              // Mở khóa danh hiệu tự động khi hoàn thành
              if (isCompleted) {
                if (!unlockedTitlesUpdated.includes(rewardTitleId)) {
                  unlockedTitlesUpdated.push(rewardTitleId);
                  unlockedChanged = true;
                }
              }

              newQuests.push({
                id: questId,
                type: isStreak ? 'streak_counter' : 'milestone',
                title: ach.title,
                description: ach.description,
                targetDays: isStreak ? ach.target_value : undefined,
                currentStreak: isStreak ? (prev?.currentStreak || 0) : undefined,
                lastCheckInDate: prev?.lastCheckInDate || '',
                lastResetDate: prev?.lastResetDate || '',
                targetMilestone: !isStreak ? ach.target_value : undefined,
                milestoneKey,
                expReward: ach.reward_exp,
                coinReward: ach.reward_coins,
                rewardTitleId,
                rewardTitleName: titleName,
                isCompleted,
                isRewardClaimed: prev?.isRewardClaimed || false,
              });
            }

            // 3. Tự động dọn dẹp nếu danh hiệu đang trang bị bị Admin xóa
            let currentEquipped = get().equippedTitleId;
            let equippedChanged = false;
            if (currentEquipped.startsWith('sys_title_') || (currentEquipped.startsWith('title_') && !isDefaultSystemTitle(currentEquipped))) {
              const achId = currentEquipped.replace('sys_title_', '').replace('title_', '');
              if (!validAchIds.has(achId)) {
                currentEquipped = 'title_tan_binh_gai_do';
                equippedChanged = true;
              }
            }

            // 4. Dọn dẹp unlockedTitleIds khỏi các thành tựu đã bị xóa
            unlockedTitlesUpdated = unlockedTitlesUpdated.filter((tid) => {
              if (tid.startsWith('sys_title_') || tid.startsWith('title_')) {
                if (isDefaultSystemTitle(tid)) return true;
                const achId = tid.replace('sys_title_', '').replace('title_', '');
                return validAchIds.has(achId);
              }
              return true;
            });

            set({
              systemQuests: newQuests,
              unlockedTitleIds: unlockedTitlesUpdated,
              equippedTitleId: currentEquipped,
            });

            if (equippedChanged && get().currentUser) {
              supabase
                .from('profiles')
                .update({ equipped_title: currentEquipped })
                .eq('id', get().currentUser!.id);
            }
          }
        } catch (e) {
          console.error('Error fetching system achievements:', e);
        }
      },

      checkAndUnlockAchievements: () => {
        const state = get();
        const achievements = state.systemAchievements;
        if (!achievements || achievements.length === 0) return;

        let unlockedTitles = [...state.unlockedTitleIds];
        let hasNew = false;

        const updatedQuests = state.systemQuests.map((q) => {
          if (!q.id.startsWith('sys_')) return q;
          const achId = q.id.replace('sys_', '');
          const ach = achievements.find((a) => a.id === achId);
          if (!ach) return q;

          let autoCompleted = false;
          if (ach.achievement_type === 'milestone_tasks') {
            autoCompleted = state.completedTotal >= ach.target_value;
          } else if (ach.achievement_type === 'milestone_focus') {
            autoCompleted = state.focusSessionsCompleted >= ach.target_value;
          } else if (ach.achievement_type === 'milestone_exp') {
            autoCompleted = state.exp >= ach.target_value;
          } else if (ach.achievement_type === 'streak_counter') {
            autoCompleted = (q.currentStreak || 0) >= ach.target_value;
          }

          if (autoCompleted) {
            const titleId = `sys_title_${ach.id}`;
            if (!unlockedTitles.includes(titleId)) {
              unlockedTitles.push(titleId);
              hasNew = true;
            }
            if (!q.isCompleted) {
              hasNew = true;
              return { ...q, isCompleted: true };
            }
          }
          return q;
        });

        if (hasNew) {
          set({ unlockedTitleIds: unlockedTitles, systemQuests: updatedQuests });
          debouncedAutoSync(get());
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
          get().addToast(localizeError(e, 'Lỗi tạo thành tựu mới'), 'error');
          return false;
        }
      },

      updateSystemAchievement: async (id, achievement) => {
        try {
          const { error } = await supabase
            .from('system_achievements')
            .update(achievement)
            .eq('id', id);
          if (error) throw error;
          await get().fetchSystemAchievements();
          return true;
        } catch (e: any) {
          get().addToast(localizeError(e, 'Lỗi cập nhật thành tựu'), 'error');
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

          // Xóa dọn danh hiệu đang trang bị nếu trùng
          const state = get();
          let newEquipped = state.equippedTitleId;
          if (
            state.equippedTitleId === `sys_title_${id}` ||
            state.equippedTitleId === `title_${id}`
          ) {
            newEquipped = 'title_tan_binh_gai_do';
            set({ equippedTitleId: newEquipped });
            if (state.currentUser) {
              await supabase
                .from('profiles')
                .update({ equipped_title: newEquipped })
                .eq('id', state.currentUser.id);
            }
          }

          // Dọn dẹp unlockedTitleIds
          set({
            unlockedTitleIds: state.unlockedTitleIds.filter(
              (t) => t !== `sys_title_${id}` && t !== `title_${id}`
            ),
          });

          await get().fetchSystemAchievements();
          get().addToast('Đã xóa thành tựu khỏi hệ thống', 'info');
          return true;
        } catch (e: any) {
          get().addToast(localizeError(e, 'Lỗi xóa thành tựu'), 'error');
          return false;
        }
      },

      adminSendMail: async (
        receiverId,
        subject,
        content,
        type = 'notice',
        rewardExp = 0,
        rewardCoins = 0,
        rewardStars = 0,
        rewardItems = []
      ) => {
        try {
          const { error } = await supabase.rpc('rpc_admin_send_mail', {
            p_receiver_id: receiverId,
            p_subject: subject,
            p_content: content,
            p_type: type,
            p_reward_exp: rewardExp,
            p_reward_coins: rewardCoins,
            p_reward_stars: rewardStars,
            p_reward_items: rewardItems,
          });

          if (error) {
            const { error: insErr } = await supabase.from('user_messages').insert({
              receiver_id: receiverId,
              subject,
              content,
              message_type: type,
              is_read: false,
              reward_exp: rewardExp,
              reward_coins: rewardCoins,
              reward_stars: rewardStars,
              reward_items: rewardItems,
              is_claimed: false,
            });
            if (insErr) throw insErr;
          }
          return true;
        } catch (e: any) {
          get().addToast(localizeError(e, 'Lỗi khi gửi thư'), 'error');
          return false;
        }
      },

      claimMailReward: async (messageId: string) => {
        const state = get();
        const msg = state.userMessages.find((m) => m.id === messageId);
        if (!msg) {
          get().addToast('Không tìm thấy thư yêu cầu nhận thưởng', 'error');
          return { success: false, error: 'Thư không tồn tại' };
        }

        if (msg.is_claimed) {
          get().addToast('Phần thưởng trong thư này đã được nhận rồi!', 'info');
          return { success: false, error: 'Đã nhận thưởng' };
        }

        const rewardItems = msg.reward_items || [];
        const itemsCount = rewardItems.reduce((acc, it) => acc + (it.count || 1), 0);
        if (state.inventory.length + itemsCount > 50) {
          playSound('error_block', state.soundEnabled);
          get().addToast('⚠️ Túi Đồ đã đầy (tối đa 50 ô). Hãy dùng bớt vật phẩm trong Túi Đồ trước khi nhận thưởng!', 'error');
          return { success: false, error: 'Túi Đồ đã đầy (tối đa 50 ô)' };
        }

        try {
          const { data, error } = await supabase.rpc('rpc_claim_mail_reward', {
            p_message_id: messageId,
          });

          if (error) {
            get().addToast(localizeError(error, 'Lỗi khi nhận quà từ thư'), 'error');
            return { success: false, error: localizeError(error) };
          }

          const newExp = data?.new_exp ?? (state.exp + (msg.reward_exp || 0));
          const newCoins = data?.new_coins ?? (state.coins + (msg.reward_coins || 0));
          const newStars = data?.new_stars ?? (state.stars + (msg.reward_stars || 0));
          const claimedItems = (data?.reward_items || rewardItems) as MailRewardItem[];

          // Chuyển reward_items thành InventoryTicket với thời hạn 7 ngày
          const newTickets: InventoryTicket[] = (claimedItems || []).flatMap((it) => {
            const count = it.count || 1;
            return Array.from({ length: count }, (_, idx) => ({
              id: `mail_reward_${Date.now()}_${it.id}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
              title: it.name,
              emoji: it.icon,
              cost: it.cost || 0,
              redeemedAt: new Date().toISOString(),
              purchasedAt: Date.now(),
              expiresAt: Date.now() + 7 * 24 * 3600 * 1000, // Hạn sử dụng 7 ngày
              used: false,
              isSystem: true,
            }));
          });

          set((prev) => ({
            exp: newExp,
            coins: newCoins,
            stars: newStars,
            inventory: [...newTickets, ...prev.inventory],
            userMessages: prev.userMessages.map((m) =>
              m.id === messageId
                ? { ...m, is_claimed: true, is_read: true, claimed_at: new Date().toISOString() }
                : m
            ),
          }));

          playSound('coin_purchase', get().soundEnabled);
          get().addToast('🎁 Nhận toàn bộ phần thưởng thành công! Vật phẩm đã được chuyển vào Túi Đồ.', 'success');
          debouncedAutoSync(get());
          return { success: true };
        } catch (err: any) {
          get().addToast(localizeError(err, 'Lỗi khi nhận thưởng'), 'error');
          return { success: false, error: localizeError(err) };
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
          get().addToast(localizeError(e, 'Lỗi khóa tài khoản'), 'error');
          return false;
        }
      },

      adminDeleteUser: async (targetUserId) => {
        try {
          // 1. Ưu tiên gọi RPC admin_delete_user với tham số target_user_id (chuẩn theo yêu cầu)
          let rpcError: any = null;
          const { error: err1 } = await supabase.rpc('admin_delete_user', {
            target_user_id: targetUserId,
          });

          if (err1) {
            rpcError = err1;
            // 2. Fallback thử gọi rpc_admin_delete_user với tham số p_target_user_id
            const { error: err2 } = await supabase.rpc('rpc_admin_delete_user', {
              p_target_user_id: targetUserId,
            });
            if (!err2) {
              rpcError = null;
            }
          }

          // 3. Nếu chưa có RPC trên Supabase, fallback dọn dẹp trực tiếp qua các bảng nghiệp vụ
          if (rpcError) {
            console.warn('RPC delete user failed, performing direct table deletes:', rpcError);
            await supabase.from('activity_logs').delete().eq('user_id', targetUserId);
            await supabase.from('user_messages').delete().eq('receiver_id', targetUserId);
            await supabase.from('journals').delete().eq('user_id', targetUserId);
            await supabase.from('user_states').delete().eq('user_id', targetUserId);
            const { error: delProfileErr } = await supabase.from('profiles').delete().eq('id', targetUserId);
            if (delProfileErr) {
              console.error('Error deleting profile directly:', delProfileErr);
              get().addToast(`Lỗi khi xóa hồ sơ người dùng: ${localizeError(delProfileErr)}`, 'error');
              return false;
            }
          }

          // Cập nhật lại danh sách Thợ Săn trong Admin
          get().fetchCommunityProfiles();
          return true;
        } catch (e: any) {
          get().addToast(localizeError(e, 'Lỗi khi xóa tài khoản'), 'error');
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
              get().addToast('⚠️ Chức năng phân quyền đang bảo trì, vui lòng thử lại sau!', 'error');
              return false;
            }
            throw error;
          }
          return true;
        } catch (e: any) {
          get().addToast(localizeError(e, 'Lỗi khi cập nhật phân quyền'), 'error');
          return false;
        }
      },
      isAddShopItemOpen: false,
      activePomodoroTaskId: null,
      activeFocusTaskId: null,
      isFocusRunning: false,
      focusTimeLeft: 25 * 60,
      focusTargetMinutes: 25,
      isFocusModalOpen: false,
      editingTask: null,
      isEditQuestOpen: false,
      hasSeenTutorial: false,
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

      setAvatarUrl: async (url: string) => {
        set({ avatarUrl: url });
        const targetUserId = get().currentUser?.id || get().hunterId;
        if (targetUserId) {
          try {
            await supabase
              .from('profiles')
              .update({
                avatar_url: url || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', targetUserId);
          } catch (e) {
            console.error('Lỗi cập nhật avatar_url lên profiles:', e);
          }
        }
        await get().syncToCloud(true);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('faequest:reload_leaderboard'));
        }
      },

      setCoverUrl: async (url: string) => {
        const cleanUrl = url && url.trim() ? url.trim() : null;
        set({ coverUrl: cleanUrl || '' });
        const targetUserId = get().currentUser?.id || get().hunterId;
        if (targetUserId) {
          try {
            const { error: updErr } = await supabase
              .from('profiles')
              .update({
                cover_url: cleanUrl,
                updated_at: new Date().toISOString(),
              })
              .eq('id', targetUserId);

            if (updErr) {
              console.error('Lỗi cập nhật cover_url lên profiles:', updErr);
              get().addToast(localizeError(updErr, 'Không thể lưu ảnh bìa lên máy chủ, vui lòng thử lại!'), 'error');
            } else {
              get().fetchCommunityProfiles();
            }
          } catch (e: any) {
            console.error('Lỗi cập nhật cover_url lên profiles:', e);
            get().addToast(localizeError(e, 'Kết nối máy chủ bị gián đoạn khi cập nhật ảnh bìa!'), 'error');
          }
        }
        await get().syncToCloud(true);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('faequest:reload_leaderboard'));
        }
      },

      toggleSound: () => {
        const next = !get().soundEnabled;
        set({ soundEnabled: next });
        setMasterVolume(get().soundVolume || 75, next);
        get().addToast(next ? 'Đã bật hiệu ứng âm thanh RPG' : 'Đã tắt âm thanh', 'info');
      },

      setSoundVolume: (volume: number) => {
        const clean = Math.max(0, Math.min(100, Math.round(volume)));
        set({ soundVolume: clean });
        setMasterVolume(clean, get().soundEnabled);
      },

      setFocusAmbient: (ambient: AmbientType) => {
        set({ focusAmbient: ambient });
      },

      setActiveTab: (tab: ActiveTab) => {
        playSound('ui_click', get().soundEnabled);
        if (tab === 'inventory') {
          set({ activeTab: 'shop', shopSubTab: 'inventory' });
          get().cleanupExpiredInventory();
          return;
        }
        if (tab === 'analytics') {
          set({ activeTab: 'profile' });
          get().cleanupExpiredInventory();
          return;
        }
        set({ activeTab: tab });
        get().cleanupExpiredInventory();
      },

      setShopSubTab: (subTab: 'shop' | 'inventory') => {
        playSound('ui_click', get().soundEnabled);
        set({ shopSubTab: subTab });
      },

      setCategoryFilter: (cat: string) => {
        playSound('ui_click', get().soundEnabled);
        set({ activeCategoryFilter: cat });
      },

      setStatusFilter: (status: string) => {
        playSound('ui_click', get().soundEnabled);
        set({ activeStatusFilter: status });
      },

      addTask: (
        title,
        category = 'ca-nhan',
        difficulty = 'medium',
        isDailyRecurring = false,
        focusDuration = null,
        description = '',
        target_date
      ) => {
        const trimmed = title.trim();
        if (!trimmed) return;

        const duration = focusDuration ? Math.min(180, Math.max(5, Number(focusDuration))) : null;
        const assignedTargetDate = target_date || getTodayString();
        const isTargetToday = assignedTargetDate === getTodayString();

        const newTask: Task = {
          id: 'task_' + Date.now(),
          title: trimmed,
          description: description?.trim() || undefined,
          category,
          difficulty,
          completed: false,
          rewardClaimed: false,
          isDailyRecurring: isDailyRecurring && isTargetToday,
          focusDuration: duration,
          pomodoroMinutes: duration,
          focusRewardClaimed: false,
          createdAt: Date.now(),
          target_date: assignedTargetDate,
        };

        set((state) => ({
          tasks: [newTask, ...state.tasks],
        }));

        playSound('quest_create', get().soundEnabled);
        get().addToast(
          isTargetToday
            ? 'Đã khắc lệnh nhiệm vụ mới cho Hôm Nay!'
            : 'Đã lên lịch nhiệm vụ thành công cho Ngày Mai!',
          'success'
        );
        debouncedAutoSync(get());
      },

      updateTask: (id: string, updates: Partial<Task>) => {
        const titleTrimmed = updates.title !== undefined ? updates.title.trim() : undefined;
        if (titleTrimmed !== undefined && !titleTrimmed) return;

        const duration =
          updates.focusDuration !== undefined
            ? updates.focusDuration
              ? Math.min(180, Math.max(5, Number(updates.focusDuration)))
              : null
            : undefined;

        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== id) return t;
            return {
              ...t,
              ...(titleTrimmed !== undefined && { title: titleTrimmed }),
              ...(updates.description !== undefined && { description: updates.description.trim() || undefined }),
              ...(updates.category !== undefined && { category: updates.category }),
              ...(updates.difficulty !== undefined && { difficulty: updates.difficulty }),
              ...(updates.isDailyRecurring !== undefined && { isDailyRecurring: updates.isDailyRecurring }),
              ...(duration !== undefined && { focusDuration: duration, pomodoroMinutes: duration }),
              ...(updates.target_date !== undefined && { target_date: updates.target_date }),
            };
          }),
          editingTask: null,
          isEditQuestOpen: false,
        }));

        if (get().activeFocusTaskId === id && duration !== undefined && duration !== null) {
          get().setFocusTargetMinutes(duration);
        }

        playSound('ui_click', get().soundEnabled);
        get().addToast('Đã lưu thay đổi nhiệm vụ thành công!', 'success');
        debouncedAutoSync(get());
      },

      setEditingTask: (task: Task | null) => {
        set({ editingTask: task, isEditQuestOpen: Boolean(task) });
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

        // Chống gian lận: Khóa hoàn thành đối với nhiệm vụ thuộc Ngày Mai / Tương lai
        const today = getTodayString();
        if (task.target_date && task.target_date > today) {
          playSoundEffect('warning', state.soundEnabled);
          get().addToast('🌅 Nhiệm vụ này được lên lịch cho Ngày Mai. Chưa thể nghiệm thu trước hạn!', 'info');
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
            let { data: rpcRes, error: rpcErr } = await supabase.rpc('rpc_complete_task', {
              p_difficulty: task.difficulty,
              p_focus_minutes: 0,
              p_is_focus_completed: false,
              p_category: task.category,
            });

            if (rpcErr && rpcErr.message?.includes('ProfileNotFound')) {
              try { await supabase.rpc('rpc_ensure_profile'); } catch { }
              await get().syncToCloud(true);
              const retry = await supabase.rpc('rpc_complete_task', {
                p_difficulty: task.difficulty,
                p_focus_minutes: 0,
                p_is_focus_completed: false,
                p_category: task.category,
              });
              rpcRes = retry.data;
              rpcErr = retry.error;
            }

            if (rpcErr) {
              playSoundEffect('warning', state.soundEnabled);
              get().addToast(`⚠️ ${localizeError(rpcErr.message, 'Không thể hoàn thành nhiệm vụ!')}`, 'error');
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

        const diffSoundMap: Record<string, 'quest_easy' | 'quest_medium' | 'quest_hard' | 'quest_boss'> = {
          easy: 'quest_easy',
          medium: 'quest_medium',
          hard: 'quest_hard',
          boss: 'quest_boss',
        };
        const questSound = diffSoundMap[task.difficulty] || 'quest_medium';

        const newRankIdx = getRankIndexByExp(newExp);
        const isLevelUp = newRankIdx > oldRankIdx;
        const effectiveTier = newRankTier || RANK_TIERS[newRankIdx];

        // Kích hoạt Floating Reward & Level Up Overlay
        get().triggerRewardPopup({
          avatarUrl: state.avatarUrl,
          oldExp: state.exp,
          newExp,
          maxExp: effectiveTier.maxExp,
          addedExp: awardedExp,
          addedCoins: awardedCoins,
          isLevelUp,
          newRankName: effectiveTier.name,
        });

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
          playSound('rank_up', state.soundEnabled);
          // Đợi RewardPopupOverlay phát xong 3s mới hiển thị RankUpModal chi tiết
          setTimeout(() => {
            set({ rankUpData: { achievedTier: newRankTier, bonusCoins: rankUpBonus } });
          }, 3200);
        } else {
          playSound(questSound, state.soundEnabled);
          get().addToast(`Hoàn thành! Nhận +${awardedExp} EXP và +${awardedCoins} Xu`, 'success');
        }
        debouncedAutoSync(get());
      },

      deleteTask: (id: string) => {
        if (get().activeFocusTaskId === id || get().activePomodoroTaskId === id) {
          get().cancelFocus();
        }
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
        const oldRankIdx = getRankIndexByExp(state.exp);
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
            let { data: rpcRes, error: rpcErr } = await supabase.rpc('rpc_complete_task', {
              p_difficulty: task.difficulty,
              p_focus_minutes: cleanElapsed,
              p_is_focus_completed: true,
              p_category: task.category,
            });

            if (rpcErr && rpcErr.message?.includes('ProfileNotFound')) {
              try { await supabase.rpc('rpc_ensure_profile'); } catch { }
              await get().syncToCloud(true);
              const retry = await supabase.rpc('rpc_complete_task', {
                p_difficulty: task.difficulty,
                p_focus_minutes: cleanElapsed,
                p_is_focus_completed: true,
                p_category: task.category,
              });
              rpcRes = retry.data;
              rpcErr = retry.error;
            }

            if (rpcErr) {
              playSoundEffect('warning', state.soundEnabled);
              get().addToast(`⚠️ ${localizeError(rpcErr.message, 'Không thể hoàn thành nhiệm vụ!')}`, 'error');
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

        stopFocusAmbient(0);

        set((prev) => ({
          exp: newExp,
          coins: finalCoins,
          activePomodoroTaskId: null,
          activeFocusTaskId: null,
          isFocusRunning: false,
          isFocusModalOpen: false,
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

        const diffSoundMap: Record<string, 'quest_easy' | 'quest_medium' | 'quest_hard' | 'quest_boss'> = {
          easy: 'quest_easy',
          medium: 'quest_medium',
          hard: 'quest_hard',
          boss: 'quest_boss',
        };
        const questSound = diffSoundMap[task.difficulty] || 'quest_medium';

        const newRankIdx = getRankIndexByExp(newExp);
        const isLevelUp = newRankIdx > oldRankIdx;
        const effectiveTier = newRankTier || RANK_TIERS[newRankIdx];

        get().triggerRewardPopup({
          avatarUrl: state.avatarUrl,
          oldExp: state.exp,
          newExp,
          maxExp: effectiveTier.maxExp,
          addedExp: totalExp,
          addedCoins: totalCoins,
          isLevelUp,
          newRankName: effectiveTier.name,
        });

        if (newRankTier) {
          try {
            confetti({
              particleCount: 90,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#CCD0CF', '#9BA8AB', '#4A5C6A', '#253745', '#FFFFFF', '#FBBF24'],
            });
          } catch (e) { }
          playSound('rank_up', state.soundEnabled);
          setTimeout(() => {
            set({ rankUpData: { achievedTier: newRankTier, bonusCoins: rankUpBonus } });
          }, 3200);
        } else {
          playSound(questSound, state.soundEnabled);
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
          playSound('error_block', state.soundEnabled);
          get().addToast('🎒 Túi Đồ đã đầy (50/50)! Hãy sử dụng bớt vật phẩm trước khi đổi thêm.', 'error');
          return;
        }

        if (state.coins < item.cost) {
          playSound('error_block', state.soundEnabled);
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
              playSound('error_block', state.soundEnabled);
              get().addToast(`⚠️ Giao dịch thất bại: ${localizeError(rpcErr.message, 'Số dư không đủ hoặc có sự cố kết nối!')}`, 'error');
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

        playSound('coin_purchase', state.soundEnabled);
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
        playSound('item_use', state.soundEnabled);

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

        const effectiveTier = newRankTier || RANK_TIERS[newRankIdx];
        get().triggerRewardPopup({
          avatarUrl: state.avatarUrl,
          oldExp: state.exp,
          newExp,
          maxExp: effectiveTier.maxExp,
          addedExp: amount,
          addedCoins: rankUpBonus,
          isLevelUp: newRankIdx > oldRankIdx,
          newRankName: effectiveTier.name,
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
          setTimeout(() => {
            set({ rankUpData: { achievedTier: newRankTier, bonusCoins: rankUpBonus } });
          }, 3200);
        } else {
          playSoundEffect('complete', state.soundEnabled);
          get().addToast(`Đã cộng thử +${amount} EXP!`, 'success');
        }
        debouncedAutoSync(get());
      },

      triggerRewardPopup: (data: Omit<RewardPopupData, 'isOpen'>) => {
        if (rewardPopupTimer) {
          clearTimeout(rewardPopupTimer);
          rewardPopupTimer = null;
        }
        set({
          rewardPopup: {
            ...data,
            isOpen: true,
          },
        });
        rewardPopupTimer = setTimeout(() => {
          get().closeRewardPopup();
        }, 3000);
      },

      closeRewardPopup: () => {
        if (rewardPopupTimer) {
          clearTimeout(rewardPopupTimer);
          rewardPopupTimer = null;
        }
        const current = get().rewardPopup;
        if (current) {
          set({
            rewardPopup: {
              ...current,
              isOpen: false,
            },
          });
        }
      },

      closeRankUpModal: () => set({ rankUpData: null }),

      setRoadmapOpen: (open: boolean) => set({ isRoadmapOpen: open }),
      setRenameOpen: (open: boolean) => set({ isRenameOpen: open }),
      setResetOpen: (open: boolean) => set({ isResetOpen: open }),
      setSettingsOpen: (open: boolean) => set({ isSettingsOpen: open }),
      setDeferredInstallPrompt: (prompt: any | null) => set({ deferredInstallPrompt: prompt }),
      setIsAppStandalone: (isStandalone: boolean) => set({ isAppStandalone: isStandalone }),
      setChangeCoverOpen: (open: boolean) => set({ isChangeCoverOpen: open }),
      openRivalModal: (data: RivalProfileData) => {
        playSound('ui_click', get().soundEnabled);
        set({ selectedRivalForModal: data, isRivalModalOpen: true });
      },
      closeRivalModal: () => set({ isRivalModalOpen: false, selectedRivalForModal: null }),
      setOathOpen: (open: boolean) => set({ isOathOpen: open }),
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setCreateQuestOpen: (open: boolean) => set({ isCreateQuestOpen: open }),
      setQuestViewMode: (mode: 'bento' | 'list') => set({ questViewMode: mode }),
      acceptOath: () => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('faequest_oath_accepted', 'true');
        }
        set({ isOathOpen: false });
        playSound('scroll_open', get().soundEnabled);
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
      setActivePomodoroTaskId: (id: string | null) => {
        if (!id) {
          get().cancelFocus();
        } else {
          get().startFocusForTask(id);
        }
      },

      startFocusForTask: (taskId: string, durationMinutes?: number) => {
        const task = get().tasks.find((t) => t.id === taskId);
        if (!task) return;
        const targetMin = durationMinutes || task.focusDuration || 25;
        if (!task.focusDuration) {
          get().updateTaskFocusDuration(taskId, targetMin);
        }
        set({
          activeFocusTaskId: taskId,
          activePomodoroTaskId: taskId,
          focusTargetMinutes: targetMin,
          focusTimeLeft: targetMin * 60,
          isFocusRunning: true,
          isFocusModalOpen: false,
        });
        const { soundEnabled, soundVolume, focusAmbient } = get();
        if (soundEnabled && focusAmbient !== 'off') {
          startFocusAmbient(focusAmbient, soundVolume);
        }
      },

      toggleFocusRunning: () => {
        const nextState = !get().isFocusRunning;
        set({ isFocusRunning: nextState });
        const { soundEnabled, soundVolume, focusAmbient } = get();
        if (nextState && soundEnabled && focusAmbient !== 'off') {
          startFocusAmbient(focusAmbient, soundVolume);
        } else if (!nextState) {
          stopFocusAmbient(0.3);
        }
      },

      setFocusRunning: (running: boolean) => {
        set({ isFocusRunning: running });
        const { soundEnabled, soundVolume, focusAmbient } = get();
        if (running && soundEnabled && focusAmbient !== 'off') {
          startFocusAmbient(focusAmbient, soundVolume);
        } else if (!running) {
          stopFocusAmbient(0.3);
        }
      },

      setFocusTimeLeft: (seconds: number) => {
        set({ focusTimeLeft: seconds });
      },

      setFocusTargetMinutes: (minutes: number) => {
        const clean = Math.min(180, Math.max(5, minutes));
        set({
          focusTargetMinutes: clean,
          focusTimeLeft: clean * 60,
        });
        const activeId = get().activeFocusTaskId;
        if (activeId) {
          get().updateTaskFocusDuration(activeId, clean);
        }
      },

      tickFocusTimer: () => {
        const { focusTimeLeft, activeFocusTaskId, focusTargetMinutes, soundEnabled } = get();
        if (!activeFocusTaskId) return;

        if (focusTimeLeft <= 1) {
          stopFocusAmbient(0);
          playSound('quest_easy', soundEnabled);
          const task = get().tasks.find((t) => t.id === activeFocusTaskId);
          if (task) {
            get().completePomodoro(task.id, focusTargetMinutes, focusTargetMinutes);
          }
          set({
            activeFocusTaskId: null,
            activePomodoroTaskId: null,
            isFocusRunning: false,
            focusTimeLeft: 0,
            isFocusModalOpen: false,
          });
        } else {
          set({ focusTimeLeft: focusTimeLeft - 1 });
        }
      },

      cancelFocus: () => {
        stopFocusAmbient(0);
        set({
          activeFocusTaskId: null,
          activePomodoroTaskId: null,
          isFocusRunning: false,
          isFocusModalOpen: false,
        });
      },

      setFocusModalOpen: (open: boolean) => {
        set({ isFocusModalOpen: open });
      },

      setHasSeenTutorial: async (seen: boolean) => {
        set({ hasSeenTutorial: seen });
        const hunterId = get().currentUser?.id || get().hunterId;
        if (hunterId && typeof window !== 'undefined') {
          if (seen) {
            localStorage.setItem('faequest_tour_seen_' + hunterId, 'true');
            localStorage.setItem('faequest_tour_completed_' + hunterId, 'true');
          } else {
            localStorage.removeItem('faequest_tour_seen_' + hunterId);
            localStorage.removeItem('faequest_tour_completed_' + hunterId);
          }
        }
        if (hunterId) {
          try {
            await supabase.from('profiles').update({ has_seen_tutorial: seen }).eq('id', hunterId);
          } catch (e) {
            console.warn('Failed to update has_seen_tutorial to profiles:', e);
          }
        }
        debouncedAutoSync(get());
      },

      resetAllData: async (): Promise<boolean> => {
        const state = get();
        const currentUser = state.currentUser;
        const hunterId = currentUser?.id || state.hunterId;

        if (autoSyncTimer) {
          clearTimeout(autoSyncTimer);
          autoSyncTimer = null;
        }

        const defaultStarterTasks: Task[] = [
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

        const nowIso = new Date().toISOString();

        // 0. Gom và dọn sạch toàn bộ ảnh cá nhân trên Cloudinary (Avatar, Cover, Ảnh bài viết nhật ký)
        try {
          const personalImages: string[] = [];
          if (state.avatarUrl) personalImages.push(state.avatarUrl);
          if (state.coverUrl) personalImages.push(state.coverUrl);
          state.journals.forEach((j) => {
            if (Array.isArray(j.images)) {
              j.images.forEach((img) => {
                if (img) personalImages.push(img);
              });
            }
          });

          if (personalImages.length > 0) {
            deleteCloudinaryImages(personalImages).catch((e) =>
              console.warn('Lỗi dọn dẹp ảnh Cloudinary khi reset tài khoản:', e)
            );
          }
        } catch (e) {
          console.warn('Lỗi trích xuất ảnh khi reset:', e);
        }

        // 1. Quy trình Database-First: Ghi đè trực tiếp lên Supabase trước nếu đã đăng nhập
        if (hunterId && currentUser) {
          try {
            // A. Ưu tiên gọi hàm RPC rpc_reset_user_journey (chạy với quyền SECURITY DEFINER, tránh hoàn toàn lỗi permission denied)
            let rpcSucceeded = false;
            try {
              const { error: rpcError } = await supabase.rpc('rpc_reset_user_journey');
              if (!rpcError) {
                rpcSucceeded = true;
              } else {
                console.warn('RPC rpc_reset_user_journey not yet registered on Supabase:', rpcError);
              }
            } catch (e) {
              console.warn('Exception calling rpc_reset_user_journey:', e);
            }

            // B. Nếu chưa có RPC trên Supabase, thử cập nhật trực tiếp bảng profiles
            if (!rpcSucceeded) {
              const { error: profileError } = await supabase
                .from('profiles')
                .update({
                  exp: 0,
                  coins: 25,
                  stars: 0,
                  rank_id: 'dong',
                  equipped_title: 'title_tan_binh_gai_do',
                  avatar_url: null,
                  cover_url: null,
                  streak: 0,
                  completed_tasks_count: 0,
                  updated_at: nowIso,
                })
                .eq('id', hunterId);

              if (profileError) {
                console.warn('Direct update on profiles failed (column permissions restricted):', profileError);
                // Fallback: Ghi đè các cột client có quyền truy cập
                try {
                  await supabase
                    .from('profiles')
                    .update({
                      equipped_title: 'title_tan_binh_gai_do',
                      updated_at: nowIso,
                    })
                    .eq('id', hunterId);
                } catch { }
              }
            }

            // C. Ghi đè snapshot public.user_states về cấu trúc mặc định (chủ sở hữu luôn có toàn quyền)
            const freshStateJson: UserStateCloud & { resetAt: string } = {
              playerName: currentUser.name || state.playerName || 'Thợ Săn Fae',
              avatarUrl: '',
              coverUrl: '',
              exp: 0,
              coins: 25,
              stars: 0,
              completedTotal: 0,
              streakDays: 0,
              dailyCompletedCount: 0,
              dailyBossCompletedCount: 0,
              tasks: defaultStarterTasks,
              shopItems: INITIAL_SHOP_ITEMS,
              inventory: [],
              rivals: [],
              systemQuests: INITIAL_SYSTEM_QUESTS,
              unlockedTitleIds: ['title_tan_binh_gai_do'],
              equippedTitleId: 'title_tan_binh_gai_do',
              focusSessionsCompleted: 0,
              hasSeenTutorial: true,
              resetAt: nowIso,
            };

            const { error: stateError } = await supabase
              .from('user_states')
              .upsert(
                {
                  user_id: hunterId,
                  state_json: freshStateJson,
                  updated_at: nowIso,
                },
                { onConflict: 'user_id' }
              );

            if (stateError) {
              console.error('Supabase reset user_states error:', stateError);
              state.addToast(`Lỗi đặt lại dữ liệu trên máy chủ: ${localizeError(stateError)}`, 'error');
              return false;
            }

            // D. Dọn sạch bảng nhật ký public.journals
            try {
              const { error: journalError } = await supabase
                .from('journals')
                .delete()
                .eq('user_id', hunterId);
              if (journalError && !journalError.message?.includes('schema cache')) {
                console.warn('Supabase delete journals error:', journalError);
              }
            } catch (err) {
              console.warn('Lỗi xóa bảng journals:', err);
            }

            // E. Dọn sạch bảng lịch sử hoạt động public.activity_logs nếu có
            try {
              await supabase.from('activity_logs').delete().eq('user_id', hunterId);
            } catch (err) {
              console.warn('Lỗi xóa bảng activity_logs:', err);
            }
          } catch (err: any) {
            console.error('Ngoại lệ khi thực thi reset Database:', err);
            state.addToast(`Lỗi kết nối máy chủ: ${localizeError(err, 'Không thể đặt lại dữ liệu')}`, 'error');
            return false;
          }
        }

        // 2. Dọn dẹp LocalStorage & SessionStorage (Bảo toàn nguyên vẹn token đăng nhập Supabase)
        if (typeof window !== 'undefined') {
          try {
            const preservedAuthKeys: Record<string, string> = {};
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.startsWith('sb-') || key.includes('supabase.auth'))) {
                const val = localStorage.getItem(key);
                if (val !== null) preservedAuthKeys[key] = val;
              }
            }
            localStorage.clear();
            Object.entries(preservedAuthKeys).forEach(([k, v]) => {
              localStorage.setItem(k, v);
            });
            if (hunterId) {
              localStorage.setItem(`faequest_tour_seen_${hunterId}`, 'true');
              localStorage.setItem(`faequest_tour_completed_${hunterId}`, 'true');
            }
          } catch (err) {
            console.warn('Lỗi khi dọn dẹp localStorage:', err);
          }

          try {
            sessionStorage.clear();
          } catch (err) {
            console.warn('Lỗi khi dọn dẹp sessionStorage:', err);
          }
        }

        // 3. Cập nhật Zustand Store về giá trị khởi điểm ban đầu
        set({
          playerName: currentUser?.name || state.playerName || 'Thợ Săn Fae',
          avatarUrl: '',
          coverUrl: '',
          exp: 0,
          coins: 25,
          stars: 0,
          completedTotal: 0,
          streakDays: 0,
          dailyCompletedCount: 0,
          dailyBossCompletedCount: 0,
          lastActiveDate: getTodayString(),
          tasks: defaultStarterTasks,
          shopItems: INITIAL_SHOP_ITEMS,
          inventory: [],
          rivals: [],
          systemQuests: INITIAL_SYSTEM_QUESTS,
          unlockedTitleIds: ['title_tan_binh_gai_do'],
          equippedTitleId: 'title_tan_binh_gai_do',
          focusSessionsCompleted: 0,
          journals: [],
          hasSeenTutorial: true,
          isResetOpen: false,
          isSettingsOpen: false,
          isChangeCoverOpen: false,
          cloudSyncStatus: 'synced',
        });

        playSound('scroll_open', state.soundEnabled);
        state.addToast('✨ Đã khởi tạo lại toàn bộ hành trình về trạng thái ban đầu!', 'success');
        return true;
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

        // BẢO MẬT MÁY CHỦ: Xác thực ngày điểm danh theo máy chủ (Asia/Ho_Chi_Minh)
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
              // Xử lý thông minh khi máy chủ Supabase chưa chạy migration timezone Asia/Ho_Chi_Minh
              // (lỗi chênh lệch 7 tiếng của UTC khiến 00:00 - 07:00 sáng bị nhầm là ngày hôm qua)
              const isTimezoneLag =
                (rpcErr.message?.includes('AlreadyCheckedIn') && quest.lastCheckInDate !== today) ||
                (rpcErr.message?.includes('ResetCooldown') && quest.lastResetDate !== today);

              if (isTimezoneLag) {
                console.warn(
                  '[Streak Check-in] Máy chủ Supabase đang ở múi giờ UTC (lệch giờ 00:00 - 07:00 sáng). Đang áp dụng cơ chế tự động xử lý theo giờ Việt Nam.'
                );
                try {
                  const targetBonusExp = isCompleted ? (quest.expReward || 0) : 0;
                  const targetBonusCoins = isCompleted ? (quest.coinReward || 0) : 0;
                  await supabase
                    .from('profiles')
                    .update({
                      streak: Math.max(state.streakDays || 0, nextStreak),
                      exp: (state.exp || 0) + targetBonusExp,
                      coins: (state.coins || 0) + targetBonusCoins,
                      last_checkin_date: today,
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', state.currentUser.id);

                  if (targetBonusExp > 0 || targetBonusCoins > 0) {
                    set({
                      exp: (state.exp || 0) + targetBonusExp,
                      coins: (state.coins || 0) + targetBonusCoins,
                    });
                  }
                } catch (fallbackErr) {
                  console.warn('Lỗi ghi profile trực tiếp:', fallbackErr);
                }
              } else {
                playSoundEffect('warning', state.soundEnabled);
                get().addToast(`⚠️ ${localizeError(rpcErr.message, 'Không thể điểm danh chuỗi hôm nay!')}`, 'error');
                return;
              }
            }

            if (rpcRes) {
              nextStreak = rpcRes.new_streak ?? nextStreak;
              // Chỉ nhận today_server nếu không bị thụt lùi ngày so với múi giờ thực của client
              if (rpcRes.today_server && rpcRes.today_server >= today) {
                today = rpcRes.today_server;
              }
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

        let unlockedTitles = state.unlockedTitleIds;
        if (isCompleted && quest.rewardTitleId && !unlockedTitles.includes(quest.rewardTitleId)) {
          unlockedTitles = [...unlockedTitles, quest.rewardTitleId];
        }

        set({ systemQuests: updatedQuests, unlockedTitleIds: unlockedTitles });
        playSound('streak_flame', state.soundEnabled);
        triggerCoinBurst(window.innerWidth / 2, window.innerHeight * 0.45, 6);

        if (isCompleted) {
          playSound('rank_up', state.soundEnabled);
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
        if (!isTitleUnlocked(titleId, state.unlockedTitleIds)) {
          get().addToast('Danh hiệu này chưa được mở khóa!', 'error');
          return;
        }
        const titleInfo = resolveTitleObject(titleId);
        set({ equippedTitleId: titleId });
        const targetUserId = state.currentUser?.id || state.hunterId;
        if (targetUserId) {
          supabase
            .from('profiles')
            .update({
              equipped_title: titleId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetUserId)
            .then(() => { });
        }
        playSound('scroll_open', state.soundEnabled);
        get().addToast(`Đã trang bị danh hiệu "${titleInfo?.name || titleId}"!`, 'success');
        debouncedAutoSync(get());
      },

      checkSystemMilestones: () => {
        const state = get();
        const currentRankIdx = getRankIndexByExp(state.exp);

        let hasNewCompleted = false;
        let unlockedTitles = [...state.unlockedTitleIds];
        let titleChanged = false;

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

          if (isAchieved) {
            if (q.rewardTitleId && !unlockedTitles.includes(q.rewardTitleId)) {
              unlockedTitles.push(q.rewardTitleId);
              titleChanged = true;
            }
            if (!q.isCompleted) {
              hasNewCompleted = true;
              return { ...q, isCompleted: true };
            }
          }
          return q;
        });

        if (hasNewCompleted || titleChanged) {
          set({ systemQuests: updatedQuests, unlockedTitleIds: unlockedTitles });
          if (hasNewCompleted) {
            playSoundEffect('complete', state.soundEnabled);
            get().addToast('🎖️ Bạn vừa hoàn thành một Cột Mốc Thành Tựu! Hãy vào nhận thưởng!', 'success');
          }
          debouncedAutoSync(get());
        }

        // Tự động kiểm tra và mở khóa thành tựu của Admin
        get().checkAndUnlockAchievements();
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
          coverUrl: state.coverUrl,
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
            get().addToast('☁️ Đã đồng bộ dữ liệu lên máy chủ thành công!', 'success');
          }
          return true;
        } else {
          set({ cloudSyncStatus: 'error' });
          if (!silent) {
            get().addToast(`⚠️ Lỗi đồng bộ đám mây: ${localizeError(res.error, 'Kết nối gián đoạn')}`, 'error');
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
            coverUrl: s.coverUrl || '',
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
            `🎉 Đã khôi phục thành công dữ liệu của "${s.playerName || cleanId}"!`,
            'success'
          );
          return true;
        } else {
          set({ cloudSyncStatus: 'error' });
          get().addToast(`❌ Khôi phục thất bại: ${localizeError(res.error, 'Không tìm thấy dữ liệu hoặc mã không hợp lệ')}`, 'error');
          return false;
        }
      },

      fetchCommunityProfiles: async () => {
        try {
          const res = await fetchCommunityLeaderboard(50);
          const list = res.profiles || [];
          set({ communityProfiles: list });
          return list;
        } catch {
          return [];
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

            // CHỐT CHẶN BẢO VỆ: Nếu có phiên đăng nhập nhưng không tìm thấy profile trên máy chủ
            // Điều này có nghĩa tài khoản ĐÃ BỊ QUẢN TRỊ VIÊN XÓA! Tuyệt đối KHÔNG tự động tái tạo profile!
            if (!profile) {
              console.warn('Phiên đăng nhập tồn tại nhưng hồ sơ không có trên máy chủ (Tài khoản đã bị xóa):', hunterId);
              try {
                await supabase.auth.signOut();
              } catch { }

              if (typeof window !== 'undefined') {
                try {
                  localStorage.clear();
                  sessionStorage.clear();
                } catch { }
              }

              set({
                currentUser: null,
                hunterId: '',
                authLoading: false,
              });

              get().addToast('⚠️ Tài khoản của bạn đã bị Quản Trị Viên xóa khỏi hệ thống!', 'error');
              return;
            }

            let userRole: UserRole = (profile?.role === 'admin' || isAdminCandidate) ? 'admin' : 'user';
            // Tự động đồng bộ quyền Admin nếu tài khoản thuộc diện Quản Trị nhưng chưa được gán role
            if (profile?.role !== 'admin' && isAdminCandidate) {
              try { await supabase.rpc('rpc_admin_set_user_role', { p_target_user_id: hunterId, p_new_role: 'admin' }); } catch { }
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

            const isLocallySeen = typeof window !== 'undefined' && hunterId
              ? (localStorage.getItem('faequest_tour_seen_' + hunterId) === 'true' ||
                localStorage.getItem('faequest_tour_completed_' + hunterId) === 'true')
              : false;

            if (stateRow?.state_json) {
              const s = stateRow.state_json;
              const isVeteranPlayer =
                (profile?.completed_tasks_count || 0) > 0 ||
                (profile?.exp || 0) > 0 ||
                (s?.completedTotal || 0) > 0 ||
                (s?.exp || 0) > 0;

              const hasSeenTutorialVal =
                isLocallySeen
                  ? true
                  : (profile?.has_seen_tutorial !== undefined && profile?.has_seen_tutorial !== null)
                    ? Boolean(profile.has_seen_tutorial)
                    : s?.hasSeenTutorial !== undefined
                      ? Boolean(s.hasSeenTutorial)
                      : isVeteranPlayer;

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
                coverUrl:
                  profile?.cover_url !== undefined && profile?.cover_url !== null
                    ? profile.cover_url
                    : (s.coverUrl || ''),
                exp: (s as any)?.resetAt && (!profile?.updated_at || new Date((s as any).resetAt).getTime() >= new Date(profile.updated_at).getTime() - 2000)
                  ? (s?.exp ?? 0)
                  : (profile?.exp !== undefined ? profile.exp : (typeof s.exp === 'number' ? s.exp : 0)),
                coins: (s as any)?.resetAt && (!profile?.updated_at || new Date((s as any).resetAt).getTime() >= new Date(profile.updated_at).getTime() - 2000)
                  ? (s?.coins ?? 25)
                  : (profile?.coins !== undefined ? profile.coins : (typeof s.coins === 'number' ? s.coins : 25)),
                stars: profile?.stars !== undefined ? profile.stars : (typeof s.stars === 'number' ? s.stars : 0),
                completedTotal: (s as any)?.resetAt && (!profile?.updated_at || new Date((s as any).resetAt).getTime() >= new Date(profile.updated_at).getTime() - 2000)
                  ? 0
                  : (profile?.completed_tasks_count !== undefined ? profile.completed_tasks_count : (typeof s.completedTotal === 'number' ? s.completedTotal : 0)),
                streakDays: (s as any)?.resetAt && (!profile?.updated_at || new Date((s as any).resetAt).getTime() >= new Date(profile.updated_at).getTime() - 2000)
                  ? 0
                  : (profile?.streak !== undefined ? profile.streak : (typeof s.streakDays === 'number' ? s.streakDays : 0)),
                dailyCompletedCount: s.dailyCompletedCount || 0,
                dailyBossCompletedCount: s.dailyBossCompletedCount || 0,
                tasks: Array.isArray(s.tasks) ? s.tasks : [],
                shopItems: Array.isArray(s.shopItems) ? s.shopItems : INITIAL_SHOP_ITEMS,
                inventory: Array.isArray(s.inventory) ? s.inventory : [],
                rivals: [],
                systemQuests: Array.isArray(s.systemQuests) ? s.systemQuests : INITIAL_SYSTEM_QUESTS,
                unlockedTitleIds: Array.isArray(s.unlockedTitleIds) ? s.unlockedTitleIds : ['title_tan_binh_gai_do'],
                equippedTitleId: s.equippedTitleId || profile?.equipped_title || 'title_tan_binh_gai_do',
                focusSessionsCompleted: s.focusSessionsCompleted || 0,
                hasSeenTutorial: hasSeenTutorialVal,
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
                coverUrl: profile?.cover_url || '',
                exp: profile?.exp || 0,
                coins: profile?.coins || 25,
                stars: profile?.stars || 0,
                completedTotal: 0,
                streakDays: 0,
                dailyCompletedCount: 0,
                dailyBossCompletedCount: 0,
                tasks: starterTasks,
                shopItems: INITIAL_SHOP_ITEMS,
                inventory: [],
                rivals: [],
                systemQuests: INITIAL_SYSTEM_QUESTS,
                unlockedTitleIds: ['title_tan_binh_gai_do'],
                equippedTitleId: 'title_tan_binh_gai_do',
                focusSessionsCompleted: 0,
                hasSeenTutorial:
                  isLocallySeen
                    ? true
                    : (profile?.has_seen_tutorial !== undefined && profile?.has_seen_tutorial !== null)
                      ? Boolean(profile.has_seen_tutorial)
                      : false,
                cloudSyncStatus: 'synced',
                authLoading: false,
              });

              await get().syncToCloud(true);
            }

            // Đồng bộ dữ liệu Live-Ops: Hộp thư, Cửa hàng hệ thống, Thành tựu động, BXH thật, Nhật ký
            get().fetchUserMessages();
            get().fetchSystemShopItems();
            get().fetchSystemAchievements();
            get().fetchJournals();
            get().fetchSeasonAnnouncements();
            get().fetchAdminAssets();
            get().fetchCommunityProfiles();
            get().fetchJournals();
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
            return { success: false, error: localizeError(error, 'Đăng ký không thành công, vui lòng thử lại') };
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
            rivals: [],
            systemQuests: INITIAL_SYSTEM_QUESTS,
            unlockedTitleIds: ['title_tan_binh_gai_do'],
            equippedTitleId: 'title_tan_binh_gai_do',
            focusSessionsCompleted: 0,
            hasSeenTutorial: false,
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
              stars: 0,
              completedTotal: 0,
              streakDays: 0,
              dailyCompletedCount: 0,
              dailyBossCompletedCount: 0,
              tasks: starterTasks,
              shopItems: INITIAL_SHOP_ITEMS,
              inventory: [],
              rivals: [],
              systemQuests: INITIAL_SYSTEM_QUESTS,
              unlockedTitleIds: ['title_tan_binh_gai_do'],
              equippedTitleId: 'title_tan_binh_gai_do',
              focusSessionsCompleted: 0,
              hasSeenTutorial: false,
              isOathOpen: isAdmin ? false : true,
              cloudSyncStatus: 'synced',
              authLoading: false,
              lastSyncedAt: new Date().toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            });
            get().fetchUserMessages();
            get().fetchSystemShopItems();
            get().fetchSystemAchievements();
            get().fetchJournals();
            playSound('coin_purchase', get().soundEnabled);
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
                stars: 0,
                completedTotal: 0,
                streakDays: 0,
                dailyCompletedCount: 0,
                dailyBossCompletedCount: 0,
                tasks: starterTasks,
                shopItems: INITIAL_SHOP_ITEMS,
                inventory: [],
                rivals: [],
                systemQuests: INITIAL_SYSTEM_QUESTS,
                unlockedTitleIds: ['title_tan_binh_gai_do'],
                equippedTitleId: 'title_tan_binh_gai_do',
                focusSessionsCompleted: 0,
                hasSeenTutorial: false,
                isOathOpen: isAdmin ? false : true,
                cloudSyncStatus: 'synced',
                authLoading: false,
              });
              get().fetchUserMessages();
              get().fetchSystemShopItems();
              get().fetchSystemAchievements();
              playSound('coin_purchase', get().soundEnabled);
              get().addToast(`🎉 Chào mừng Tân Binh "${cleanName}"! Tặng ngay 25 Xu Vàng!`, 'success');
              return { success: true };
            }

            return {
              success: true,
              error: 'Đăng ký thành công! Vui lòng kiểm tra email xác nhận hoặc đăng nhập ngay.',
            };
          }
        } catch (err: any) {
          return { success: false, error: localizeError(err, 'Lỗi kết nối khi đăng ký tài khoản') };
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
            return {
              success: false,
              error: localizeError(error, 'Email hoặc mật khẩu không chính xác'),
            };
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

          // CHỐT CHẶN BẢO VỆ: Nếu đăng nhập Auth thành công nhưng không tìm thấy profile trên máy chủ
          // Điều này có nghĩa tài khoản ĐÃ BỊ QUẢN TRỊ VIÊN XÓA! Tuyệt đối KHÔNG tự động tái tạo profile!
          if (!profile) {
            console.warn('Đăng nhập thành công nhưng hồ sơ không tồn tại trên máy chủ (Tài khoản đã bị xóa):', userId);
            try {
              await supabase.auth.signOut();
            } catch { }

            set({
              currentUser: null,
              hunterId: '',
              authLoading: false,
            });

            get().addToast('⚠️ Tài khoản này đã bị Quản Trị Viên xóa khỏi hệ thống!', 'error');
            return { success: false, error: 'Tài khoản này đã bị Quản Trị Viên xóa khỏi hệ thống!' };
          }

          let userRole: UserRole = (profile?.role === 'admin' || isAdminCandidate) ? 'admin' : 'user';
          // Tự động đồng bộ quyền Admin nếu tài khoản thuộc diện Quản Trị nhưng chưa được gán role
          if (profile?.role !== 'admin' && isAdminCandidate) {
            try { await supabase.rpc('rpc_admin_set_user_role', { p_target_user_id: userId, p_new_role: 'admin' }); } catch { }
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

          const isLocallySeen = typeof window !== 'undefined' && userId
            ? (localStorage.getItem('faequest_tour_seen_' + userId) === 'true' ||
              localStorage.getItem('faequest_tour_completed_' + userId) === 'true')
            : false;

          if (stateRow?.state_json) {
            const s = stateRow.state_json;
            const isVeteranPlayer =
              (profile?.completed_tasks_count || 0) > 0 ||
              (profile?.exp || 0) > 0 ||
              (s?.completedTotal || 0) > 0 ||
              (s?.exp || 0) > 0;

            const hasSeenTutorialVal =
              isLocallySeen
                ? true
                : (profile?.has_seen_tutorial !== undefined && profile?.has_seen_tutorial !== null)
                  ? Boolean(profile.has_seen_tutorial)
                  : s?.hasSeenTutorial !== undefined
                    ? Boolean(s.hasSeenTutorial)
                    : isVeteranPlayer;

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
              coverUrl:
                profile?.cover_url !== undefined && profile?.cover_url !== null
                  ? profile.cover_url
                  : (s.coverUrl || ''),
              exp: (s as any)?.resetAt && (!profile?.updated_at || new Date((s as any).resetAt).getTime() >= new Date(profile.updated_at).getTime() - 2000)
                ? (s?.exp ?? 0)
                : (profile?.exp !== undefined ? profile.exp : (typeof s.exp === 'number' ? s.exp : 0)),
              coins: (s as any)?.resetAt && (!profile?.updated_at || new Date((s as any).resetAt).getTime() >= new Date(profile.updated_at).getTime() - 2000)
                ? (s?.coins ?? 25)
                : (profile?.coins !== undefined ? profile.coins : (typeof s.coins === 'number' ? s.coins : 25)),
              stars: profile?.stars !== undefined ? profile.stars : (typeof s.stars === 'number' ? s.stars : 0),
              completedTotal: (s as any)?.resetAt && (!profile?.updated_at || new Date((s as any).resetAt).getTime() >= new Date(profile.updated_at).getTime() - 2000)
                ? 0
                : (profile?.completed_tasks_count !== undefined ? profile.completed_tasks_count : (typeof s.completedTotal === 'number' ? s.completedTotal : 0)),
              streakDays: (s as any)?.resetAt && (!profile?.updated_at || new Date((s as any).resetAt).getTime() >= new Date(profile.updated_at).getTime() - 2000)
                ? 0
                : (profile?.streak !== undefined ? profile.streak : (typeof s.streakDays === 'number' ? s.streakDays : 0)),
              dailyCompletedCount: s.dailyCompletedCount || 0,
              dailyBossCompletedCount: s.dailyBossCompletedCount || 0,
              tasks: Array.isArray(s.tasks) ? s.tasks : [],
              shopItems: Array.isArray(s.shopItems) ? s.shopItems : INITIAL_SHOP_ITEMS,
              inventory: Array.isArray(s.inventory) ? s.inventory : [],
              rivals: Array.isArray(s.rivals) ? s.rivals : [],
              systemQuests: Array.isArray(s.systemQuests) ? s.systemQuests : INITIAL_SYSTEM_QUESTS,
              unlockedTitleIds: Array.isArray(s.unlockedTitleIds) ? s.unlockedTitleIds : ['title_tan_binh_gai_do'],
              equippedTitleId: s.equippedTitleId || profile?.equipped_title || 'title_tan_binh_gai_do',
              focusSessionsCompleted: s.focusSessionsCompleted || 0,
              hasSeenTutorial: hasSeenTutorialVal,
              cloudSyncStatus: 'synced',
              authLoading: false,
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
              coverUrl: profile?.cover_url || '',
              exp: profile?.exp || 0,
              coins: profile?.coins || 25,
              stars: profile?.stars || 0,
              completedTotal: 0,
              streakDays: 0,
              dailyCompletedCount: 0,
              dailyBossCompletedCount: 0,
              tasks: starterTasks,
              shopItems: INITIAL_SHOP_ITEMS,
              inventory: [],
              rivals: [],
              systemQuests: INITIAL_SYSTEM_QUESTS,
              unlockedTitleIds: ['title_tan_binh_gai_do'],
              equippedTitleId: 'title_tan_binh_gai_do',
              focusSessionsCompleted: 0,
              hasSeenTutorial:
                isLocallySeen
                  ? true
                  : (profile?.has_seen_tutorial !== undefined && profile?.has_seen_tutorial !== null)
                    ? Boolean(profile.has_seen_tutorial)
                    : false,
              cloudSyncStatus: 'synced',
              authLoading: false,
            });
            await get().syncToCloud(true);
          }

          // Đồng bộ dữ liệu Live-Ops
          get().fetchUserMessages();
          get().fetchSystemShopItems();
          get().fetchSystemAchievements();
          get().fetchJournals();
          get().fetchSeasonAnnouncements();
          get().fetchAdminAssets();

          playSoundEffect('complete', get().soundEnabled);
          get().addToast(`⚔️ Chào mừng Thợ Săn "${hunterName}" trở lại Đấu Trường!`, 'success');
          return { success: true };
        } catch (err: any) {
          return { success: false, error: localizeError(err, 'Lỗi kết nối máy chủ khi đăng nhập') };
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
          rivals: [],
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
        soundVolume: state.soundVolume ?? 75,
        focusAmbient: state.focusAmbient ?? 'rain',
        language: state.language || 'vi',
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    }
  )
);
