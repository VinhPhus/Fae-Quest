import { TaskCategory, TaskDifficulty } from '../types';

export interface CategoryMeta {
  id: TaskCategory;
  label: string;
  iconName: string;
  color: string;
  badgeBg: string;
}

export const CATEGORIES: Record<TaskCategory, CategoryMeta> = {
  'hoc-tap': {
    id: 'hoc-tap',
    label: 'Học tập',
    iconName: 'BookOpen',
    color: 'text-cyan-300',
    badgeBg: 'bg-cyan-500/15 border-cyan-400/35 text-cyan-300',
  },
  'cong-viec': {
    id: 'cong-viec',
    label: 'Công việc',
    iconName: 'Briefcase',
    color: 'text-blue-400',
    badgeBg: 'bg-blue-500/15 border-blue-400/35 text-blue-300',
  },
  'the-luc': {
    id: 'the-luc',
    label: 'Thể lực',
    iconName: 'Dumbbell',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300',
  },
  'ca-nhan': {
    id: 'ca-nhan',
    label: 'Cá nhân',
    iconName: 'Heart',
    color: 'text-pink-400',
    badgeBg: 'bg-pink-500/15 border-pink-400/35 text-pink-300',
  },
  'sang-tao': {
    id: 'sang-tao',
    label: 'Sáng tạo',
    iconName: 'Palette',
    color: 'text-amber-300',
    badgeBg: 'bg-amber-500/15 border-amber-400/35 text-amber-300',
  },
};

export interface DifficultyMeta {
  id: TaskDifficulty;
  label: string;
  exp: number;
  coins: number;
  badgeClass: string;
  tagClass: string;
}

export const DIFFICULTIES: Record<TaskDifficulty, DifficultyMeta> = {
  easy: {
    id: 'easy',
    label: 'Khởi Động (Dễ)',
    exp: 30,
    coins: 2,
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    tagClass: 'text-emerald-400',
  },
  medium: {
    id: 'medium',
    label: 'Tiêu Chuẩn (Vừa)',
    exp: 60,
    coins: 5,
    badgeClass: 'bg-opal/30 text-opal-light border-opal-light/50',
    tagClass: 'text-opal-light',
  },
  hard: {
    id: 'hard',
    label: 'Thử Thách (Khó)',
    exp: 110,
    coins: 10,
    badgeClass: 'bg-fae/25 text-fae-light border-fae/50',
    tagClass: 'text-fae-light',
  },
  boss: {
    id: 'boss',
    label: 'Trùm Cuối Ngày',
    exp: 200,
    coins: 20,
    badgeClass: 'bg-bargain text-rose-300 border-rose-400/60 shadow-lg ring-1 ring-rose-500/40',
    tagClass: 'text-rose-400 font-extrabold',
  },
};
