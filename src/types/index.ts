export type TaskCategory = 'hoc-tap' | 'cong-viec' | 'the-luc' | 'ca-nhan' | 'sang-tao';
export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'boss';
export type RankId = 'dong' | 'bac' | 'vang' | 'luc-bao' | 'cao-thu' | 'dai-cao-thu' | 'thach-dau';

export interface Task {
  id: string;
  title: string;
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
}

export interface InventoryTicket {
  id: string;
  title: string;
  emoji: string;
  cost: number;
  redeemedAt: string;
  used: boolean;
}

export interface Rival {
  id: string;
  name: string;
  title: string;
  exp: number;
  avatar: string;
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

export type ActiveTab = 'quests' | 'system-quests' | 'shop' | 'leaderboard' | 'inventory' | 'analytics';

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
