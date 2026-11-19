export type TaskCategory = 'hoc-tap' | 'cong-viec' | 'the-luc' | 'ca-nhan' | 'sang-tao';
export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'boss';
export type RankId = 'dong' | 'bac' | 'vang' | 'luc-bao' | 'cao-thu' | 'dai-cao-thu' | 'thach-dau';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  completed: boolean;
  rewardClaimed?: boolean;
  isDailyRecurring?: boolean;
  pomodoroMinutes?: number | null;
  focusDuration?: number | null; // Đơn vị: phút (null hoặc 0 = không dùng Fae Focus)
  focusRewardClaimed?: boolean; // Tối đa 1 lần nhận thưởng Focus/ngày
  createdAt: number;
  completedAt?: number;
  lastAwardedExp?: number;
  lastAwardedCoins?: number;
  lastRankUpBonus?: number;
}

export interface Rank {
  id: string;
  name: string;
  minExp: number;
  maxExp: number;
  bonusCoins: number;
  iconUrl: string; // Đường dẫn đến ảnh tương ứng vừa cắt
}

export interface RankTier extends Rank {
  id: RankId;
  coinBonus: number;
  quote: string;
  badgeBg: string;
  accentColor: string;
  svg?: string;
}

export interface ShopItem {
  id: string;
  title: string;
  desc: string;
  cost: number;
  emoji: string;
  isSystem?: boolean;
}

export interface InventoryTicket {
  id: string;
  title: string;
  emoji: string;
  cost: number;
  redeemedAt: string;
  purchasedAt?: number;
  expiresAt?: number;
  used: boolean;
  usedAt?: number | null;
  isSystem?: boolean;
}

export type InventoryItem = InventoryTicket;

export interface Rival {
  id: string;
  name: string;
  title: string;
  exp: number;
  avatar: string;
}

export interface RivalProfileData {
  id: string;
  name: string;
  avatarUrl: string | null;
  coverUrl?: string | null;
  cover_url?: string | null;
  exp: number;
  streak: number;
  completedTasks: number;
  equippedTitle?: string;
  stars?: number;
  rankPos?: number;
  isPlayer?: boolean;
}

export interface FloatingRewardItem {
  id: string;
  x: number;
  y: number;
  text: string;
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'error';
}

export type ActiveTab =
  | 'quests'
  | 'system-quests'
  | 'shop'
  | 'leaderboard'
  | 'inventory'
  | 'chronicles'
  | 'analytics'
  | 'profile'
  | 'admin';

export type JournalMood = 'Tuyệt vời' | 'Tốt' | 'Bình thường' | 'Căng thẳng' | 'Tệ';

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  mood: JournalMood;
  content: string; // HTML format from RichText
  images: string[];
  created_at: string;
  updated_at: string;
}

export type UserRole = 'user' | 'admin';

export interface ActivityLog {
  id: string;
  user_id: string;
  username?: string;
  action_type: 'TASK_COMPLETE' | 'FOCUS_COMPLETE' | 'SHOP_PURCHASE' | 'STREAK_CHECKIN';
  category?: string;
  difficulty?: string;
  exp_delta: number;
  coins_delta: number;
  is_flagged: boolean;
  flag_reason?: string;
  created_at: string;
}

export interface MailRewardItem {
  id: string;
  name: string;
  icon: string;
  cost?: number;
  count: number;
  description?: string;
}

export interface UserMessage {
  id: string;
  receiver_id: string;
  subject: string;
  content: string;
  message_type: 'warning' | 'notice' | 'gift';
  is_read: boolean;
  reward_exp?: number;
  reward_coins?: number;
  reward_stars?: number;
  reward_items?: MailRewardItem[];
  is_claimed?: boolean;
  claimed_at?: string;
  created_at: string;
}

export interface SystemShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  is_system: boolean;
  created_at?: string;
}

export interface SystemAchievement {
  id: string;
  title: string;
  description: string;
  icon_url: string;
  category: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  achievement_type: 'streak_counter' | 'milestone_tasks' | 'milestone_exp' | 'milestone_focus';
  target_value: number;
  reward_exp: number;
  reward_coins: number;
  granted_title_name?: string;
  created_at?: string;
}

export interface AdminUserOverview {
  id: string;
  username: string;
  avatar_url?: string;
  exp: number;
  coins: number;
  rank_id: string;
  equipped_title?: string;
  role: UserRole;
  banned_until?: string | null;
  ban_reason?: string | null;
  updated_at: string;
  flagged_count_24h?: number;
  exp_gained_24h?: number;
  latest_flag_reason?: string | null;
}

export type SystemQuestType = 'streak_counter' | 'milestone';

export interface SystemQuest {
  id: string;
  type: SystemQuestType;
  title: string;
  description: string;
  targetDays?: number; // for streak_counter
  currentStreak?: number; // for streak_counter
  lastCheckInDate?: string; // for streak_counter (YYYY-MM-DD)
  lastResetDate?: string; // for streak_counter (YYYY-MM-DD, lock until 00:00 midnight)
  targetMilestone?: number; // for milestone
  milestoneKey?: 'completedTasks' | 'focusSessions' | 'rankIdx'; // for milestone
  expReward: number;
  coinReward: number;
  rewardTitleId: string;
  rewardTitleName: string;
  isCompleted: boolean;
  isRewardClaimed: boolean;
}

export interface Title {
  id: string;
  name: string;
  description: string;
  source: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  iconUrl: string;
}

export interface UserTitle {
  id: string;
  name: string;
  description: string;
  sourceQuestTitle: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  icon: string;
  iconUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface HunterUser {
  id: string;
  email: string;
  name: string;
}

export interface RewardPopupData {
  isOpen: boolean;
  avatarUrl?: string;
  oldExp: number;
  newExp: number;
  maxExp: number;
  addedExp: number;
  addedCoins: number;
  isLevelUp: boolean;
  newRankName?: string;
}

export interface SeasonAnnouncement {
  id: string;
  season_tag: string;
  title: string;
  content: string;
  image_url?: string | null;
  is_pinned: boolean;
  created_by?: string;
  created_at: string;
}

export type AdminAssetCategory = 'all' | 'achievement' | 'shop';

export interface AdminAsset {
  id: string;
  name: string;
  url: string;
  category: AdminAssetCategory;
  created_at: string;
}

