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
  CategoryStatRecord,
  DailyActivityRecord,
} from '../types';
import { supabase } from '../utils/supabaseClient';
import {
  getTodayString,
  getTomorrowString,
  isTomorrowOrFutureDate,
  getLocalDateStr,
  getYesterdayString,
} from '../utils/dateUtils';
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
import { playSound, setMasterVolume, AmbientType } from '../utils/soundEngine';
import { getFocusRemainingMs, getFocusRewardMinutes, readFocusSession, saveFocusSession, type FocusSession } from '../utils/focusSession';
import { notifyFocusCompletion, requestFocusNotifications, stopFocusMedia, syncFocusMedia, updateFocusMediaTitle } from '../utils/focusMedia';
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
  // --- BỘ 24 TÀI NGUYÊN PIXEL ART MỚI (NHÂN VẬT, HUY HIỆU, PHÁP BẢO) ---
  // 1. Nhóm Nhân Vật & Chiến Binh (Characters & Avatars - Category: 'all')
  {
    id: 'vault-char-knight-blue',
    name: 'Nhân Vật: Hiệp Sĩ Lam Khiên',
    url: '/assets/vault/char-knight-blue.png',
    category: 'all',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-char-knight-dark',
    name: 'Nhân Vật: Hắc Ám Kiếm Sĩ',
    url: '/assets/vault/char-knight-dark.png',
    category: 'all',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-char-paladin-gold',
    name: 'Nhân Vật: Thánh Kỵ Sĩ Ánh Sáng',
    url: '/assets/vault/char-paladin-gold.png',
    category: 'all',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-char-dragon-warrior',
    name: 'Nhân Vật: Long Chiến Binh Viêm Thương',
    url: '/assets/vault/char-dragon-warrior.png',
    category: 'all',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-char-knight-green',
    name: 'Nhân Vật: Chiến Binh Rìu Lục Bảo',
    url: '/assets/vault/char-knight-green.png',
    category: 'all',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-char-frost-knight',
    name: 'Nhân Vật: Băng Phong Chiến Tướng',
    url: '/assets/vault/char-frost-knight.png',
    category: 'all',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-char-desert-assassin',
    name: 'Nhân Vật: Thích Khách Sa Mạc',
    url: '/assets/vault/char-desert-assassin.png',
    category: 'all',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-char-crimson-guard',
    name: 'Nhân Vật: Hoàng Gia Cận Vệ Thương',
    url: '/assets/vault/char-crimson-guard.png',
    category: 'all',
    created_at: new Date().toISOString(),
  },

  // 2. Nhóm Huy Hiệu & Danh Hiệu (Badges & Achievements - Category: 'achievement')
  {
    id: 'vault-badge-crown',
    name: 'Huy Hiệu: Vương Miện Hoàng Đế',
    url: '/assets/vault/badge-crown.png',
    category: 'achievement',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-badge-dragon-crest',
    name: 'Huy Hiệu: Gia Huy Rồng Vàng',
    url: '/assets/vault/badge-dragon-crest.png',
    category: 'achievement',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-badge-night-wolf',
    name: 'Huy Hiệu: Sói Đêm Huyền Bí',
    url: '/assets/vault/badge-night-wolf.png',
    category: 'achievement',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-badge-phoenix',
    name: 'Huy Hiệu: Phượng Hoàng Lửa',
    url: '/assets/vault/badge-phoenix.png',
    category: 'achievement',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-badge-astral-star',
    name: 'Huy Hiệu: Tinh Bàn Bí Thuật',
    url: '/assets/vault/badge-astral-star.png',
    category: 'achievement',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-badge-crossed-swords',
    name: 'Huy Hiệu: Song Kiếm Hoàng Gia',
    url: '/assets/vault/badge-crossed-swords.png',
    category: 'achievement',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-badge-demon-skull',
    name: 'Huy Hiệu: Linh Dương Cổ Đại',
    url: '/assets/vault/badge-demon-skull.png',
    category: 'achievement',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-badge-sun-laurel',
    name: 'Huy Hiệu: Nguyệt Quế Lam Ngọc',
    url: '/assets/vault/badge-sun-laurel.png',
    category: 'achievement',
    created_at: new Date().toISOString(),
  },

  // 3. Nhóm Vật Phẩm & Pháp Bảo (Shop Artifacts - Category: 'shop')
  {
    id: 'vault-item-crystal-orb',
    name: 'Vật Phẩm: Quả Cầu Lam Hỏa',
    url: '/assets/vault/item-crystal-orb.png',
    category: 'shop',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-item-magic-potion',
    name: 'Vật Phẩm: Độc Dược Huyền Bí',
    url: '/assets/vault/item-magic-potion.png',
    category: 'shop',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-item-spellbook',
    name: 'Vật Phẩm: Cổ Thư Toàn Tri',
    url: '/assets/vault/item-spellbook.png',
    category: 'shop',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-item-shadow-dagger',
    name: 'Vật Phẩm: Dao Găm Bóng Tối',
    url: '/assets/vault/item-shadow-dagger.png',
    category: 'shop',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-item-kraken-ring',
    name: 'Vật Phẩm: Nhẫn Thần Hải Quái',
    url: '/assets/vault/item-kraken-ring.png',
    category: 'shop',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-item-royal-scroll',
    name: 'Vật Phẩm: Cuộn Khế Ước Cổ',
    url: '/assets/vault/item-royal-scroll.png',
    category: 'shop',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-item-spirit-lantern',
    name: 'Vật Phẩm: Đèn Lồng Linh Hồn',
    url: '/assets/vault/item-spirit-lantern.png',
    category: 'shop',
    created_at: new Date().toISOString(),
  },
  {
    id: 'vault-item-arcane-crystal',
    name: 'Vật Phẩm: Tinh Thể Gai Tím',
    url: '/assets/vault/item-arcane-crystal.png',
    category: 'shop',
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
  lastStreakDate?: string;
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
  cumulativeCategoryStats: Record<TaskCategory, CategoryStatRecord>;
  cumulativeDifficultyStats: Record<TaskDifficulty, number>;
  dailyActivityHistory: Record<string, DailyActivityRecord>;

  // Anti-Cheat & Concurrency Lock
  processingTaskIds: string[];
  taskLocks: Record<string, number>;
  taskToggleHistory: Record<string, number[]>;

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
  focusSession: FocusSession | null;
  isFocusCompleting: boolean;
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
  completeQuest: (id: string, options?: { completedViaFocus?: boolean; coords?: { x: number; y: number }; forceSkipAgeCheck?: boolean }) => Promise<boolean>;
  confirmEarlyTaskCompletion: () => void;
  cancelEarlyTaskConfirmation: () => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  setEditingTask: (task: Task | null) => void;
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
  setFocusTargetMinutes: (minutes: number) => void;
  tickFocusTimer: () => void;
  restoreFocusSession: () => void;
  refreshFocusMedia: () => void;
  cancelFocus: () => void;
  setFocusModalOpen: (open: boolean) => void;
  resetAllData: () => Promise<boolean>;
  addToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
  checkDailyReset: () => void;
  syncDailyLoginStreak: (profileInput?: any) => Promise<number | null>;
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
let cloudWrite = Promise.resolve();
let authInitInFlight = false;
let authListenerRegistered = false;

function queueCloudWrite<T>(write: () => Promise<T>): Promise<T> {
  const next = cloudWrite.then(write);
  cloudWrite = next.then(() => {}, () => {});
  return next;
}

function cloudSnapshot(state: FaeQuestState): UserStateCloud {
  return {
    playerName: state.playerName,
    avatarUrl: state.avatarUrl,
    coverUrl: state.coverUrl,
    exp: state.exp,
    coins: state.coins,
    stars: state.stars,
    completedTotal: state.completedTotal,
    streakDays: state.streakDays,
    lastStreakDate: state.lastStreakDate || '',
    lastActiveDate: state.lastActiveDate || getTodayString(),
    dailyCompletedCount: state.dailyCompletedCount,
    dailyBossCompletedCount: state.dailyBossCompletedCount,
    hasSeenTutorial: state.hasSeenTutorial,
    tasks: state.tasks,
    shopItems: state.shopItems,
    inventory: state.inventory,
    rivals: state.rivals,
    systemQuests: state.systemQuests,
    unlockedTitleIds: state.unlockedTitleIds,
    equippedTitleId: state.equippedTitleId,
    focusSessionsCompleted: state.focusSessionsCompleted,
    cumulativeCategoryStats: state.cumulativeCategoryStats,
    cumulativeDifficultyStats: state.cumulativeDifficultyStats,
    dailyActivityHistory: state.dailyActivityHistory,
  };
}

const focusOwner = (state: FaeQuestState) => state.currentUser?.id || state.hunterId;

function focusState(session: FocusSession | null) {
  return {
    focusSession: session,
    activeFocusTaskId: session?.questId ?? null,
    activePomodoroTaskId: session?.questId ?? null,
    isFocusRunning: Boolean(session && !session.isPaused),
    focusTargetMinutes: session ? session.durationMs / 60_000 : 25,
    focusTimeLeft: session ? Math.ceil(getFocusRemainingMs(session) / 1000) : 0,
  };
}
const debouncedAutoSync = (store: any) => {
  if (autoSyncTimer) clearTimeout(autoSyncTimer);
  autoSyncTimer = setTimeout(() => {
    store.syncToCloud(true);
  }, 500);
};

const QUICK_COMPLETION_SESSION_KEY = 'faequest_quick_completions';

export const getQuickCompletions = (): number[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(QUICK_COMPLETION_SESSION_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    const tenMinsAgo = Date.now() - 10 * 60 * 1000;
    return arr.filter((t) => typeof t === 'number' && t > tenMinsAgo);
  } catch {
    return [];
  }
};

export const recordQuickCompletion = () => {
  if (typeof window === 'undefined') return;
  try {
    const current = getQuickCompletions();
    current.push(Date.now());
    sessionStorage.setItem(QUICK_COMPLETION_SESSION_KEY, JSON.stringify(current));
  } catch { }
};

let isSyncingStreakLock = false;

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
      lastStreakDate: '',
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
      cumulativeCategoryStats: {
        'hoc-tap': { completed: 0, expGained: 0 },
        'cong-viec': { completed: 0, expGained: 0 },
        'the-luc': { completed: 0, expGained: 0 },
        'ca-nhan': { completed: 0, expGained: 0 },
        'sang-tao': { completed: 0, expGained: 0 },
      },
      cumulativeDifficultyStats: {
        easy: 0,
        medium: 0,
        hard: 0,
        boss: 0,
      },
      dailyActivityHistory: {},

      // Anti-Cheat & Concurrency Lock
      processingTaskIds: [],
      taskLocks: {},
      taskToggleHistory: {},

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
            // Đảm bảo các tài nguyên mặc định từ DEFAULT_ADMIN_ASSETS luôn có mặt đầy đủ
            const existingUrls = new Set(data.map((d: any) => d.url));
            const missingDefaults = DEFAULT_ADMIN_ASSETS.filter((def) => !existingUrls.has(def.url));
            set({ adminAssets: [...data, ...missingDefaults] as AdminAsset[] });
          } else {
            if (typeof window !== 'undefined') {
              const cached = localStorage.getItem('faequest_local_admin_assets');
              if (cached) {
                try {
                  const parsed = JSON.parse(cached);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    const existingUrls = new Set(parsed.map((d: any) => d.url));
                    const missingDefaults = DEFAULT_ADMIN_ASSETS.filter((def) => !existingUrls.has(def.url));
                    set({ adminAssets: [...parsed, ...missingDefaults] });
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
          const currentUserId = get().currentUser?.id || get().hunterId;

          // 1. Thử gọi RPC public.rpc_admin_reset_season_rank trên Supabase (chạy với quyền SECURITY DEFINER)
          let rpcSuccess = false;
          let affectedCount = 0;

          try {
            const { data: rpcData, error: rpcErr } = await supabase.rpc(
              'rpc_admin_reset_season_rank',
              {
                p_season_title: seasonTitle,
                p_custom_notice: customNotice || null,
                p_admin_id: currentUserId,
              }
            );

            if (!rpcErr && rpcData && rpcData.success) {
              rpcSuccess = true;
              affectedCount = rpcData.affected_count || 0;
            } else if (rpcErr) {
              console.warn('RPC rpc_admin_reset_season_rank warning, attempting client fallback:', rpcErr);
            }
          } catch (rpcEx) {
            console.warn('Exception calling rpc_admin_reset_season_rank:', rpcEx);
          }

          // 2. Cập nhật Rank của chính người chơi hiện tại (Local State & Sync)
          const myExp = get().exp || 0;
          const myCurIdx = getRankIndexByExp(myExp);
          const myNewIdx = Math.max(0, myCurIdx - 2);
          const myNewExp = RANK_TIERS[myNewIdx].minExp;
          const myNewTierId = RANK_TIERS[myNewIdx].id;

          set({ exp: myNewExp });
          debouncedAutoSync(get());

          // 3. Nếu RPC chưa được nạp lên Supabase SQL, thực hiện Fallback cập nhật tốt nhất có thể
          if (!rpcSuccess) {
            // Lấy danh sách profiles mà KHÔNG dùng .neq('role', 'admin') ở cấp SQL (tránh rơi mất dòng có role IS NULL)
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, username, exp, rank_id, role');

            if (profiles && profiles.length > 0) {
              const targetProfiles = profiles.filter((p) => p.role !== 'admin');
              for (const p of targetProfiles) {
                const currentExp = Number(p.exp) || 0;
                const currentIdx = getRankIndexByExp(currentExp);
                const newIdx = Math.max(0, currentIdx - 2);
                const newExp = RANK_TIERS[newIdx].minExp;
                const newTierId = RANK_TIERS[newIdx].id;

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
                }
              }
            }

            // Đăng thông báo mùa giải nếu RPC chưa tạo
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
          }

          // 4. Đồng bộ profile của chính mình lên Supabase
          if (get().currentUser) {
            await supabase
              .from('profiles')
              .update({
                exp: myNewExp,
                rank_id: myNewTierId,
                updated_at: new Date().toISOString(),
              })
              .eq('id', get().currentUser!.id);
          }

          // 5. Làm mới ngay lập tức danh sách communityProfiles trong store để giao diện cập nhật tức thì
          set((prev) => ({
            communityProfiles: prev.communityProfiles.map((p) => {
              if (p.role === 'admin') return p;
              const pExp = Number(p.exp) || 0;
              const pIdx = getRankIndexByExp(pExp);
              const pNewIdx = Math.max(0, pIdx - 2);
              return {
                ...p,
                exp: RANK_TIERS[pNewIdx].minExp,
                rank_id: RANK_TIERS[pNewIdx].id,
              };
            }),
          }));

          // Tải lại BXH từ máy chủ
          await get().fetchCommunityProfiles();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('faequest:reload_leaderboard'));
          }

          if (rpcSuccess) {
            get().addToast(`⚔️ Đã Reset Rank thành công cho ${affectedCount} Thợ Săn!`, 'success');
          } else {
            get().addToast(
              `⚔️ Đã Reset Rank cho tài khoản của bạn! Hãy chạy file SQL "supabase_reset_season_rank.sql" trên Supabase để hoàn tất cho toàn bộ Thợ Săn khác.`,
              'info'
            );
          }

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
      focusSession: null,
      isFocusCompleting: false,
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

        const session = get().focusSession;
        if (session?.questId === id) {
          if (titleTrimmed !== undefined) {
            const updated = { ...session, questTitle: titleTrimmed };
            saveFocusSession(focusOwner(get()), updated);
            set({ focusSession: updated });
            get().refreshFocusMedia();
          }
          if (duration !== undefined && duration !== null) get().setFocusTargetMinutes(duration);
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

      toggleTask: async (id, coords, forceSkipAgeCheck) => {
        await get().completeQuest(id, { coords, forceSkipAgeCheck });
      },

      completeQuest: async (id, { completedViaFocus = false, coords, forceSkipAgeCheck = false } = {}) => {
        const initial = get();
        const owner = focusOwner(initial);
        const task = initial.tasks.find((t) => t.id === id);
        if (!task || initial.authLoading || initial.processingTaskIds.includes(id)) return false;

        const now = Date.now();
        const today = getTodayString();
        const session = completedViaFocus ? initial.focusSession : null;
        if (completedViaFocus && (!session || session.questId !== id || initial.isFocusCompleting)) return false;

        if (!session) {
          if (task.completed && task.completedAt && getLocalDateStr(new Date(task.completedAt)) === today) return false;
          const lockUntil = initial.taskLocks[id] || 0;
          if (lockUntil > now) {
            playSoundEffect('warning', initial.soundEnabled);
            initial.addToast(`Thao tác quá nhanh! Nút trạng thái của nhiệm vụ này đang bị tạm khóa trong ${Math.ceil((lockUntil - now) / 1000)} giây.`, 'info');
            return false;
          }
          const recentToggles = (initial.taskToggleHistory[id] || []).filter((t) => t > now - 60_000);
          const isLocked = recentToggles.length >= 2;
          set({
            taskToggleHistory: { ...initial.taskToggleHistory, [id]: [...recentToggles, now] },
            ...(isLocked && { taskLocks: { ...initial.taskLocks, [id]: now + 30_000 } }),
          });
          if (isLocked) {
            playSoundEffect('warning', initial.soundEnabled);
            initial.addToast('Phát hiện thao tác liên tục! Nút hoàn thành của nhiệm vụ này đã bị tạm khóa trong 30 giây.', 'info');
            return false;
          }
          if (task.target_date && task.target_date > today) {
            playSoundEffect('warning', initial.soundEnabled);
            initial.addToast('🌅 Nhiệm vụ này được lên lịch cho Ngày Mai. Chưa thể nghiệm thu trước hạn!', 'info');
            return false;
          }
          const createdAt = task.createdAt || Date.parse((task as Task & { created_at?: string }).created_at ?? '');
          const ageMs = Number.isFinite(createdAt) ? Math.max(0, now - createdAt) : 0;
          if (!forceSkipAgeCheck && task.focusDuration && task.focusDuration >= 15 && ageMs < task.focusDuration * 18_000) {
            playSoundEffect('warning', initial.soundEnabled);
            initial.addToast('Thử thách cần thêm thời gian rèn luyện hoặc hãy bật chế độ Focus để nghiệm thu!', 'info');
            return false;
          }
          if (ageMs < 120_000) {
            if (getQuickCompletions().length >= 2) {
              playSoundEffect('warning', initial.soundEnabled);
              initial.addToast('Lệnh vừa khắc chưa đủ thời gian tôi luyện. Hãy hoàn thành thử thách thực tế trước khi nghiệm thu!', 'info');
              return false;
            }
            recordQuickCompletion();
          }
        }

        let focusMinutes: number | null = null;
        if (session) {
          const remainingMs = getFocusRemainingMs(session, now);
          const elapsedMs = session.durationMs - remainingMs;
          if (!session.finishRequested && elapsedMs < session.durationMs / 2) return false;
          focusMinutes = getFocusRewardMinutes(elapsedMs);
          const pending = { ...session, isPaused: true, remainingWhenPaused: remainingMs, finishRequested: true };
          saveFocusSession(owner, pending);
          set({ ...focusState(pending), isFocusCompleting: true });
          stopFocusMedia(!session.finishRequested && initial.soundEnabled ? initial.soundVolume : 0);
        }
        set((state) => ({ processingTaskIds: [...state.processingTaskIds, id] }));

        return queueCloudWrite(async () => {
          try {
            const state = get();
            const currentTask = state.tasks.find((t) => t.id === id);
            if (focusOwner(state) !== owner || state.authLoading || !currentTask) return false;

            const completedAt = Date.now();
            const completedDate = getTodayString();
            const sameDay = state.lastActiveDate === completedDate;
            const currentDailyCount = sameDay ? state.dailyCompletedCount : 0;
            const difficulty = DIFFICULTIES[currentTask.difficulty] || DIFFICULTIES.medium;
            const streakBonus = state.streakDays >= 3 ? 1.2 : 1;
            const oldRank = getRankIndexByExp(state.exp);
            const localCap = currentDailyCount >= 20;
            const bonusMinutes = focusMinutes && !currentTask.focusRewardClaimed ? focusMinutes : 0;
            const localExp = localCap ? 0 : Math.round(difficulty.exp * streakBonus) + bonusMinutes;
            const localCoins = localCap ? 0 : difficulty.coins + (bonusMinutes ? Math.max(1, Math.floor(bonusMinutes * 0.4)) : 0);
            const localRank = getRankIndexByExp(state.exp + localExp);
            const localRankBonus = RANK_TIERS.slice(oldRank + 1, localRank + 1).reduce((sum, rank) => sum + rank.coinBonus, 0);
            let result = {
              task: {
                ...currentTask,
                completed: true,
                completedAt,
                completionDate: completedDate,
                rewardClaimed: !localCap,
                focusRewardClaimed: session ? !localCap : currentTask.focusRewardClaimed,
                lastAwardedExp: localExp,
                lastAwardedCoins: localCoins,
                lastRankUpBonus: localRankBonus,
              },
              awarded_exp: localExp,
              awarded_coins: localCoins,
              new_exp: state.exp + localExp,
              new_coins: state.coins + localCoins + localRankBonus,
              rank_bonus_coins: localRankBonus,
              completed_total: state.completedTotal + 1,
              daily_completed_count: currentDailyCount + 1,
              daily_boss_completed_count: (sameDay ? state.dailyBossCompletedCount : 0) + Number(currentTask.difficulty === 'boss'),
              focus_sessions_completed: state.focusSessionsCompleted + Number(Boolean(session)),
              reward_cap: localCap,
              already_completed: Boolean(currentTask.completed && currentTask.completedAt &&
                getLocalDateStr(new Date(currentTask.completedAt)) === completedDate),
            };

            if (state.currentUser) {
              const args = { p_quest_id: id, p_focus_minutes: focusMinutes, p_focus_session_id: session?.id ?? null };
              let { data, error } = await supabase.rpc('rpc_complete_quest', args);
              // A quest created moments ago can still be waiting for autosave.
              if (error?.message?.includes('QuestNotFound') && focusOwner(get()) === owner) {
                const saved = await syncProfileAndStateToCloud(owner, cloudSnapshot(get()));
                if (saved.success && focusOwner(get()) === owner) {
                  ({ data, error } = await supabase.rpc('rpc_complete_quest', args));
                }
              }
              if (error || !data?.task) throw error ?? new Error('QuestCompletionMissing');
              if (focusOwner(get()) !== owner) return false;
              result = data;
            }

            const { awarded_exp: awardedExp, awarded_coins: awardedCoins, new_exp: newExp, task: savedTask } = result;
            if (state.currentUser || !result.already_completed) {
              const isCompletedToday = savedTask.completed && savedTask.completedAt &&
                getLocalDateStr(new Date(savedTask.completedAt)) === completedDate;
              set((prev) => {
                const targetCategory = (savedTask.category || currentTask.category || 'ca-nhan') as TaskCategory;
                const targetDiff = (savedTask.difficulty || currentTask.difficulty || 'medium') as TaskDifficulty;
                const currentCatStats = prev.cumulativeCategoryStats || {
                  'hoc-tap': { completed: 0, expGained: 0 },
                  'cong-viec': { completed: 0, expGained: 0 },
                  'the-luc': { completed: 0, expGained: 0 },
                  'ca-nhan': { completed: 0, expGained: 0 },
                  'sang-tao': { completed: 0, expGained: 0 },
                };
                const currentDiffStats = prev.cumulativeDifficultyStats || { easy: 0, medium: 0, hard: 0, boss: 0 };
                const currentDailyHist = prev.dailyActivityHistory || {};
                const dayRec = currentDailyHist[completedDate] || { completedCount: 0, expGained: 0 };

                const nextCatStats = {
                  ...currentCatStats,
                  [targetCategory]: {
                    completed: (currentCatStats[targetCategory]?.completed || 0) + 1,
                    expGained: (currentCatStats[targetCategory]?.expGained || 0) + (awardedExp || 0),
                  },
                };
                const nextDiffStats = {
                  ...currentDiffStats,
                  [targetDiff]: (currentDiffStats[targetDiff] || 0) + 1,
                };
                const nextDailyHist = {
                  ...currentDailyHist,
                  [completedDate]: {
                    completedCount: dayRec.completedCount + 1,
                    expGained: dayRec.expGained + (awardedExp || 0),
                  },
                };

                return {
                  exp: newExp,
                  coins: result.new_coins,
                  completedTotal: result.completed_total,
                  focusSessionsCompleted: result.focus_sessions_completed,
                  cumulativeCategoryStats: nextCatStats,
                  cumulativeDifficultyStats: nextDiffStats,
                  dailyActivityHistory: nextDailyHist,
                  ...((!result.already_completed || isCompletedToday) && {
                    dailyCompletedCount: result.daily_completed_count,
                    dailyBossCompletedCount: result.daily_boss_completed_count,
                    lastActiveDate: completedDate,
                    lastCompletedTimestamp: savedTask.completedAt,
                    tasks: prev.tasks.map((t) => t.id === id ? {
                      ...t,
                      completed: savedTask.completed,
                      completedAt: savedTask.completedAt,
                      completionDate: savedTask.completionDate,
                      lastFocusSessionId: savedTask.lastFocusSessionId ?? t.lastFocusSessionId,
                      rewardClaimed: savedTask.rewardClaimed,
                      focusRewardClaimed: savedTask.focusRewardClaimed,
                      lastAwardedExp: savedTask.lastAwardedExp,
                      lastAwardedCoins: savedTask.lastAwardedCoins,
                      lastRankUpBonus: savedTask.lastRankUpBonus,
                    } : t),
                  }),
                };
              });
            }

            if (session) {
              const savedSession = readFocusSession(owner);
              if (savedSession?.id === session.id) saveFocusSession(owner, null);
              if (get().focusSession?.id === session.id) {
                set({ ...focusState(null), isFocusModalOpen: false, isFocusCompleting: false });
              }
              if (!result.already_completed || (savedSession?.id === session.id && savedTask.lastFocusSessionId === session.id)) {
                void notifyFocusCompletion(session);
              }
            } else if (get().activeFocusTaskId === id && !get().isFocusCompleting) {
              get().cancelFocus();
            }

            if (result.already_completed) return true;
            get().checkSystemMilestones();
            debouncedAutoSync(get());

            const newRank = getRankIndexByExp(newExp);
            const tier = RANK_TIERS[newRank];
            if (awardedExp > 0 || awardedCoins > 0) {
              if (coords) {
                triggerCoinBurst(coords.x, coords.y, 8);
                const rewardId = 'fl_' + Math.random().toString(36).substring(2, 9);
                const bonusText = streakBonus > 1 ? ' (+20% Streak!)' : '';
                const text = `+${awardedExp} EXP${bonusText}  •  +${awardedCoins} Xu`;
                set((prev) => ({
                  floatingRewards: [...prev.floatingRewards, { id: rewardId, x: coords.x, y: coords.y, text }],
                }));
                setTimeout(() => {
                  set((prev) => ({ floatingRewards: prev.floatingRewards.filter((r) => r.id !== rewardId) }));
                }, 1400);
              } else if (session) {
                triggerCoinBurst(window.innerWidth / 2, window.innerHeight * 0.45, 16);
              }
              get().triggerRewardPopup({
                avatarUrl: state.avatarUrl,
                oldExp: state.exp,
                newExp,
                maxExp: tier.maxExp,
                addedExp: awardedExp,
                addedCoins: awardedCoins,
                isLevelUp: newRank > oldRank,
                newRankName: tier.name,
              });
              if (newRank > oldRank) {
                triggerCoinBurst(window.innerWidth / 2, window.innerHeight * 0.45, 18);
                try {
                  confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#CCD0CF', '#9BA8AB', '#4A5C6A', '#253745', '#FFFFFF', '#FBBF24'],
                  });
                } catch { }
                if (!session) playSound('rank_up', state.soundEnabled);
                setTimeout(() => {
                  set({ rankUpData: { achievedTier: tier, bonusCoins: result.rank_bonus_coins } });
                }, 3200);
              }
              get().addToast(`${session ? '⚔️ Hoàn thành Focus!' : 'Hoàn thành!'} Nhận +${awardedExp} EXP và +${awardedCoins} Xu`, 'success');
            }
            if (result.reward_cap) {
              get().addToast('Nhiệm vụ đã được nghiệm thu. Thợ săn đã chạm ngưỡng thể lực hôm nay.', 'info');
            }
            if (!session && newRank <= oldRank) playSound(`quest_${currentTask.difficulty}`, state.soundEnabled);
            return true;
          } catch (error) {
            if (focusOwner(get()) === owner) {
              const fallback = session
                ? 'Chưa thể nghiệm thu Focus. Phiên đã lưu, hãy thử lại khi có kết nối.'
                : 'Không thể hoàn thành nhiệm vụ!';
              get().addToast(localizeError(error, fallback), 'error');
              if (!session) playSoundEffect('warning', get().soundEnabled);
            }
            return false;
          } finally {
            if (focusOwner(get()) === owner) {
              set((prev) => ({
                processingTaskIds: prev.processingTaskIds.filter((taskId) => taskId !== id),
                ...(session && prev.focusSession?.id === session.id && { isFocusCompleting: false }),
              }));
            }
          }
        });
      },

      deleteTask: (id: string) => {
        if (get().processingTaskIds.includes(id)) return;
        if (get().activeFocusTaskId === id || get().activePomodoroTaskId === id) {
          get().cancelFocus();
        }
        set((prev) => ({
          tasks: prev.tasks.filter((t) => t.id !== id),
        }));
        get().addToast('Đã xóa nhiệm vụ khỏi danh sách', 'info');
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
        debouncedAutoSync(get());
        get().syncToCloud(true);
      },

      deleteShopItem: (itemId: string) => {
        set((prev) => ({
          shopItems: prev.shopItems.filter((i) => i.id !== itemId),
        }));
        get().addToast('Đã xóa món quà khỏi Cửa Hàng', 'info');
        debouncedAutoSync(get());
        get().syncToCloud(true);
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
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task || task.completed || state.authLoading || (task.target_date && task.target_date > getTodayString())) return;
        if (state.focusSession?.questId === taskId) {
          set({ isFocusModalOpen: true });
          state.refreshFocusMedia();
          return;
        }
        if (state.focusSession?.finishRequested || state.isFocusCompleting) {
          state.addToast('Phiên Focus trước đang chờ nghiệm thu.', 'info');
          return;
        }
        if (state.focusSession && getFocusRemainingMs(state.focusSession) === 0) {
          state.tickFocusTimer();
          return;
        }
        const targetMin = Math.max(5, Math.min(180, Math.round(durationMinutes || task.focusDuration || 25)));
        if (!task.focusDuration) state.updateTaskFocusDuration(taskId, targetMin);
        const durationMs = targetMin * 60_000;
        const session: FocusSession = {
          id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          questId: taskId,
          questTitle: task.title,
          durationMs,
          endTime: Date.now() + durationMs,
          isPaused: false,
          remainingWhenPaused: 0,
        };
        saveFocusSession(focusOwner(state), session);
        set({ ...focusState(session), isFocusModalOpen: false });
        state.refreshFocusMedia();
        requestFocusNotifications();
      },

      toggleFocusRunning: () => {
        const state = get();
        state.setFocusRunning(!state.isFocusRunning);
      },

      setFocusRunning: (running: boolean) => {
        const state = get();
        const session = state.focusSession;
        if (!session || session.finishRequested || state.isFocusCompleting) return;
        const now = Date.now();
        const remainingMs = getFocusRemainingMs(session, now);
        if (remainingMs === 0) {
          state.tickFocusTimer();
          return;
        }
        if (running === session.isPaused) {
          const updated = {
            ...session,
            isPaused: !running,
            endTime: running ? now + remainingMs : session.endTime,
            remainingWhenPaused: running ? 0 : remainingMs,
          };
          saveFocusSession(focusOwner(state), updated);
          set(focusState(updated));
        }
        state.refreshFocusMedia();
      },

      setFocusTargetMinutes: (minutes: number) => {
        const state = get();
        const session = state.focusSession;
        if (!session || session.finishRequested || !Number.isFinite(minutes)) return;
        if (getFocusRemainingMs(session) === 0) {
          state.tickFocusTimer();
          return;
        }
        const clean = Math.min(180, Math.max(5, Math.round(minutes)));
        const durationMs = clean * 60_000;
        const updated = {
          ...session,
          durationMs,
          endTime: Date.now() + durationMs,
          remainingWhenPaused: session.isPaused ? durationMs : 0,
        };
        saveFocusSession(focusOwner(state), updated);
        set(focusState(updated));
        state.updateTaskFocusDuration(session.questId, clean);
        state.refreshFocusMedia();
      },

      tickFocusTimer: () => {
        const state = get();
        const session = state.focusSession;
        if (!session || state.authLoading || state.isFocusCompleting) return;
        const remainingMs = getFocusRemainingMs(session);
        const seconds = Math.ceil(remainingMs / 1000);
        if (seconds !== state.focusTimeLeft) set({ focusTimeLeft: seconds });
        if (session.finishRequested || remainingMs === 0) {
          void state.completeQuest(session.questId, { completedViaFocus: true });
        } else if (!session.isPaused) {
          updateFocusMediaTitle(session, seconds);
        }
      },

      restoreFocusSession: () => {
        const state = get();
        if (state.authLoading || state.isFocusCompleting) return;
        const session = readFocusSession(focusOwner(state));
        if (!session && !state.focusSession) return;
        if (!session) stopFocusMedia();
        set({ ...focusState(session), isFocusModalOpen: session?.id === state.focusSession?.id && state.isFocusModalOpen });
        state.tickFocusTimer();
        state.refreshFocusMedia();
      },

      refreshFocusMedia: () => {
        const { focusSession, focusTimeLeft, focusAmbient, soundEnabled, soundVolume, setFocusRunning } = get();
        if (!focusSession || focusSession.finishRequested || getFocusRemainingMs(focusSession) === 0) return;
        syncFocusMedia(focusSession, focusTimeLeft, soundEnabled ? focusAmbient : 'off', soundVolume, setFocusRunning);
      },

      cancelFocus: () => {
        const state = get();
        if (state.isFocusCompleting) return;
        saveFocusSession(focusOwner(state), null);
        stopFocusMedia();
        set({ ...focusState(null), isFocusModalOpen: false });
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
        if (state.isFocusCompleting) return false;
        if (state.focusSession) state.cancelFocus();
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

        const today = getLocalDateStr();
        const yesterday = getYesterdayString();

        if (quest.lastCheckInDate === today) {
          get().addToast('Hôm nay bạn đã điểm danh thử thách này rồi! Hãy quay lại vào ngày mai.', 'info');
          return;
        }

        // Logic chuỗi kỷ luật:
        // - Nếu hôm qua có điểm danh: tăng tiếp tục (+1 ngày)
        // - Nếu hôm qua KHÔNG điểm danh: đứt chuỗi, bắt đầu lại từ Ngày 1
        const nextStreak = quest.lastCheckInDate === yesterday ? (quest.currentStreak || 0) + 1 : 1;
        const isCompleted = nextStreak >= (quest.targetDays || 1);

        // Đồng bộ phần thưởng khi hoàn thành
        if (state.currentUser && isCompleted) {
          try {
            const targetBonusExp = quest.expReward || 0;
            const targetBonusCoins = quest.coinReward || 0;
            if (targetBonusExp > 0 || targetBonusCoins > 0) {
              set({
                exp: (state.exp || 0) + targetBonusExp,
                coins: (state.coins || 0) + targetBonusCoins,
              });
              await supabase
                .from('profiles')
                .update({
                  exp: (state.exp || 0) + targetBonusExp,
                  coins: (state.coins || 0) + targetBonusCoins,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', state.currentUser.id);
            }
          } catch (e: any) {
            console.warn('Lỗi ghi profile sau checkin streak quest:', e);
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
        } else if (quest.lastCheckInDate === yesterday) {
          get().addToast(`🔥 Điểm danh thành công ngày ${nextStreak}/${quest.targetDays}! Giữ vững ngọn lửa kỷ luật!`, 'success');
        } else {
          get().addToast(`🔥 Bắt đầu chuỗi mới: Ngày ${nextStreak}/${quest.targetDays}! Hãy kiên trì mỗi ngày!`, 'success');
        }
        debouncedAutoSync(get());
      },

      resetStreakQuest: (questId: string) => {
        const state = get();
        const updatedQuests = state.systemQuests.map((q) => {
          if (q.id === questId) {
            return {
              ...q,
              currentStreak: 0,
              lastCheckInDate: '',
              isCompleted: false,
              isRewardClaimed: false,
            };
          }
          return q;
        });
        set({ systemQuests: updatedQuests });
        get().addToast('🔄 Đã đưa bộ đếm về Ngày 0 để bắt đầu lại!', 'info');
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
        const today = getLocalDateStr();
        const yesterday = getYesterdayString();
        const isNewDay = state.lastActiveDate !== today;

        // Số nhiệm vụ thực tế đã hoàn thành trong ngày hôm nay
        const actualCompletedToday = state.tasks.filter(
          (t) => t.completed && t.completedAt && getLocalDateStr(new Date(t.completedAt)) === today
        ).length;

        const actualBossCompletedToday = state.tasks.filter(
          (t) => t.completed && t.difficulty === 'boss' && t.completedAt && getLocalDateStr(new Date(t.completedAt)) === today
        ).length;

        // Kiểm tra xem có nhiệm vụ nào hoàn thành từ những ngày trước không
        const hasTasksFromPreviousDays = state.tasks.some(
          (t) => t.completed && (!t.completedAt || getLocalDateStr(new Date(t.completedAt)) < today)
        );

        // Bộ đếm dailyCompletedCount bị sai lệch (ví dụ mang giá trị 20 từ hôm qua sang, trong khi hôm nay mới hoàn thành ít hơn)
        const isDailyCountDesynced = (state.dailyCompletedCount || 0) > actualCompletedToday;
        const isDailyBossDesynced = (state.dailyBossCompletedCount || 0) > actualBossCompletedToday;

        // Tự động kiểm tra và reset toàn bộ bộ đếm ngày nếu hôm qua không bấm điểm danh
        const updatedQuests = state.systemQuests.map((q) => {
          if (q.type === 'streak_counter' && !q.isCompleted && (q.currentStreak || 0) > 0) {
            // Nếu hôm qua không bấm điểm danh và hôm nay chưa điểm danh -> tự động đưa về Ngày 0
            if (q.lastCheckInDate !== yesterday && q.lastCheckInDate !== today) {
              return {
                ...q,
                currentStreak: 0,
                lastCheckInDate: '',
              };
            }
          }
          return q;
        });

        if (isNewDay || hasTasksFromPreviousDays || isDailyCountDesynced || isDailyBossDesynced) {
          // Ngày mới hoặc có nhiệm vụ ngày trước chưa reset, hoặc bộ đếm bị lệch!
          const updatedTasks = state.tasks.map((task) => {
            const isCompletedBeforeToday =
              task.completed &&
              (!task.completedAt || getLocalDateStr(new Date(task.completedAt)) < today);

            if ((isNewDay && task.isDailyRecurring) || isCompletedBeforeToday) {
              return {
                ...task,
                completed: false,
                rewardClaimed: false,
                completedAt: undefined,
                focusRewardClaimed: false,
                target_date: today,
              };
            }
            return {
              ...task,
              focusRewardClaimed: isNewDay ? false : task.focusRewardClaimed,
            };
          });

          const recalculatedTodayCount = updatedTasks.filter(
            (t) => t.completed && t.completedAt && getLocalDateStr(new Date(t.completedAt)) === today
          ).length;

          const recalculatedBossCount = updatedTasks.filter(
            (t) => t.completed && t.difficulty === 'boss' && t.completedAt && getLocalDateStr(new Date(t.completedAt)) === today
          ).length;

          set({
            tasks: updatedTasks,
            systemQuests: updatedQuests,
            dailyCompletedCount: recalculatedTodayCount,
            dailyBossCompletedCount: recalculatedBossCount,
            lastActiveDate: today,
          });

          // Lưu snapshot sạch lên cloud
          get().syncToCloud(true);
        } else {
          // Cùng ngày: nếu có bộ đếm nào bị đứt chuỗi cần cập nhật
          const hasStreakChanged = updatedQuests.some(
            (q, i) => q.currentStreak !== state.systemQuests[i]?.currentStreak
          );
          if (hasStreakChanged) {
            set({ systemQuests: updatedQuests });
          }
        }
      },

      syncDailyLoginStreak: async (targetUserId?: string): Promise<number | null> => {
        if (isSyncingStreakLock) return null;
        isSyncingStreakLock = true;

        try {
          const state = get();
          const userId = targetUserId || state.currentUser?.id || state.hunterId;

          // Chặn chạy logic chuỗi khi hồ sơ chưa tải xong hoặc đang đăng xuất
          if (!userId) {
            return null;
          }

          const today = getLocalDateStr();
          const yesterday = getYesterdayString();

          // 1. Mọi lần kiểm tra BẮT BUỘC phải truy vấn trực tiếp dữ liệu mới nhất từ Supabase trước
          const { data: freshProfile, error } = await supabase
            .from('profiles')
            .select('id, streak, last_streak_date')
            .eq('id', String(userId))
            .maybeSingle();

          const profileStreak = typeof freshProfile?.streak === 'number' ? freshProfile.streak : 0;
          const currentStreak = Math.max(profileStreak, state.streakDays || 0);
          const savedDate = String(freshProfile?.last_streak_date || state.lastStreakDate || '').slice(0, 10);

          // 2. Nếu savedDate === today: Đã điểm danh hôm nay -> dừng ngay, đồng bộ hiển thị
          if (savedDate === today) {
            if (state.streakDays !== currentStreak || state.lastStreakDate !== today) {
              set({ streakDays: currentStreak, lastStreakDate: today });
            }
            return currentStreak;
          }

          // 3. Tính toán chuỗi ngày mới
          let nextStreak = 1;
          if (savedDate === yesterday) {
            // Duy trì liên tiếp từ hôm qua
            nextStreak = currentStreak + 1;
          } else if (!savedDate) {
            // Chưa có ngày điểm danh nhưng đã có chuỗi kỷ luật
            nextStreak = currentStreak > 0 ? currentStreak + 1 : 1;
          } else {
            // savedDate cũ hơn hôm qua: Kiểm tra nếu state bộ nhớ có ghi nhận hôm qua
            if (state.lastStreakDate === yesterday) {
              nextStreak = currentStreak + 1;
            } else {
              nextStreak = 1;
            }
          }

          // 4. Cập nhật lên Supabase profiles
          let updatedProfile: { streak: number; last_streak_date?: string | null } | null = null;
          try {
            const { data: updated, error: updateError } = await supabase
              .from('profiles')
              .update({
                streak: nextStreak,
                last_streak_date: today,
              })
              .eq('id', String(userId))
              .select('streak, last_streak_date')
              .maybeSingle();

            if (!updateError && updated) {
              updatedProfile = updated;
            } else if (updateError) {
              console.warn('Streak update with last_streak_date failed, trying fallback:', updateError);
              const { data: fallbackUpdated } = await supabase
                .from('profiles')
                .update({ streak: nextStreak })
                .eq('id', String(userId))
                .select('streak')
                .maybeSingle();
              if (fallbackUpdated) {
                updatedProfile = { streak: fallbackUpdated.streak, last_streak_date: today };
              }
            }
          } catch (dbErr) {
            console.warn('Database streak update exception:', dbErr);
          }

          const finalStreak = updatedProfile?.streak ?? nextStreak;

          // 5. Luôn cập nhật state giao diện và thông báo ăn mừng
          set({
            streakDays: finalStreak,
            lastStreakDate: today,
          });

          if (finalStreak > currentStreak || currentStreak === 0) {
            get().addToast(`🔥 Điểm danh ngày mới! Chuỗi kỷ luật đạt ${finalStreak}N`, 'success');
            playSoundEffect('rankup', get().soundEnabled);
          }

          // Đồng bộ snapshot state lên user_states để lưu trữ bền vững
          get().syncToCloud(true);

          return finalStreak;
        } catch (err) {
          console.error('Streak sync error:', err);
          return null;
        } finally {
          isSyncingStreakLock = false;
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
        const initial = get();
        if (initial.authLoading || (silent && !initial.currentUser)) return false;
        const owner = focusOwner(initial);
        return queueCloudWrite(async () => {
          const state = get();
          if (!owner || focusOwner(state) !== owner || state.authLoading || (silent && !state.currentUser)) return false;
          set({ cloudSyncStatus: 'syncing' });
          const res = await syncProfileAndStateToCloud(owner, cloudSnapshot(state));
          if (focusOwner(get()) !== owner) return false;
          if (res.success) {
            const nowStr = new Date().toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            set({ cloudSyncStatus: 'synced', lastSyncedAt: nowStr });
            if (!silent) get().addToast('☁️ Đã đồng bộ dữ liệu lên máy chủ thành công!', 'success');
            return true;
          }
          set({ cloudSyncStatus: 'error' });
          if (!silent) get().addToast(`⚠️ Lỗi đồng bộ đám mây: ${localizeError(res.error, 'Kết nối gián đoạn')}`, 'error');
          return false;
        });
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
          const today = getLocalDateStr();
          const savedActiveDate = s.lastActiveDate || '';
          const isCloudNewDay = !savedActiveDate || savedActiveDate < today;

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
            dailyCompletedCount: isCloudNewDay ? 0 : (s.dailyCompletedCount || 0),
            dailyBossCompletedCount: isCloudNewDay ? 0 : (s.dailyBossCompletedCount || 0),
            lastActiveDate: isCloudNewDay ? today : savedActiveDate,
            lastStreakDate: s.lastStreakDate || '',
            tasks: Array.isArray(s.tasks) ? s.tasks : get().tasks,
            shopItems: Array.isArray(s.shopItems) ? s.shopItems : get().shopItems,
            inventory: Array.isArray(s.inventory) ? s.inventory : get().inventory,
            rivals: Array.isArray(s.rivals) ? s.rivals : get().rivals,
            systemQuests: Array.isArray(s.systemQuests) ? s.systemQuests : get().systemQuests,
            unlockedTitleIds: Array.isArray(s.unlockedTitleIds) ? s.unlockedTitleIds : get().unlockedTitleIds,
            equippedTitleId: s.equippedTitleId || get().equippedTitleId,
            focusSessionsCompleted: s.focusSessionsCompleted || 0,
            cumulativeCategoryStats: s.cumulativeCategoryStats || get().cumulativeCategoryStats,
            cumulativeDifficultyStats: s.cumulativeDifficultyStats || get().cumulativeDifficultyStats,
            dailyActivityHistory: s.dailyActivityHistory || get().dailyActivityHistory,
            cloudSyncStatus: 'synced',
            lastSyncedAt: new Date().toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          });
          get().checkDailyReset();
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
          if (res.error) {
            console.error('Leaderboard fetch error:', res.error);
          }
          const list = res.profiles || [];
          set({ communityProfiles: list });
          return list;
        } catch (error) {
          console.error('Leaderboard fetch error:', error);
          return [];
        }
      },

      initAuth: async () => {
        if (authInitInFlight) return;
        authInitInFlight = true;
        set({ authLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const user = session.user;
            const hunterId = user.id;
            setStoredHunterId(hunterId);

            // Fetch user profile and state from Supabase
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', hunterId)
              .maybeSingle();
            if (profileError) throw profileError;

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

            const { data: stateRow, error: stateError } = await supabase
              .from('user_states')
              .select('*')
              .eq('user_id', hunterId)
              .maybeSingle();
            if (stateError) throw stateError;

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

              const today = getLocalDateStr();
              const savedActiveDate = s.lastActiveDate || '';
              const isCloudNewDay = !savedActiveDate || savedActiveDate < today;

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
                dailyCompletedCount: isCloudNewDay ? 0 : (s.dailyCompletedCount || 0),
                dailyBossCompletedCount: isCloudNewDay ? 0 : (s.dailyBossCompletedCount || 0),
                lastActiveDate: isCloudNewDay ? today : savedActiveDate,
                lastStreakDate: profile?.last_streak_date || s.lastStreakDate || '',
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

              get().checkDailyReset();
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

            // Tự động kiểm tra & đồng bộ chuỗi kỷ luật ngày mới
            await get().syncDailyLoginStreak(hunterId);

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
        } finally {
          authInitInFlight = false;
        }

        // Keep auth session listener
        if (authListenerRegistered) return;
        authListenerRegistered = true;
        supabase.auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_OUT') {
            stopFocusMedia();
            set({
              ...focusState(null),
              isFocusModalOpen: false,
              isFocusCompleting: false,
              processingTaskIds: [],
              currentUser: null,
              cloudSyncStatus: 'idle',
            });
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

            const today = getLocalDateStr();
            const savedActiveDate = s.lastActiveDate || '';
            const isCloudNewDay = !savedActiveDate || savedActiveDate < today;

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
              dailyCompletedCount: isCloudNewDay ? 0 : (s.dailyCompletedCount || 0),
              dailyBossCompletedCount: isCloudNewDay ? 0 : (s.dailyBossCompletedCount || 0),
              lastActiveDate: isCloudNewDay ? today : savedActiveDate,
              lastStreakDate: profile?.last_streak_date || s.lastStreakDate || '',
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

            get().checkDailyReset();
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

          // Điểm danh ngày mới & đồng bộ chuỗi kỷ luật
          await get().syncDailyLoginStreak(userId);

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
        stopFocusMedia();
        set({
          ...focusState(null),
          isFocusModalOpen: false,
          isFocusCompleting: false,
          processingTaskIds: [],
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
