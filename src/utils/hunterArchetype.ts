import { DIFFICULTIES } from '../constants/categories';
import { Task, TaskCategory, TaskDifficulty, CategoryStatRecord } from '../types';

export interface HunterArchetypeInput {
  tasks: Task[];
  completedTotal: number;
  exp: number;
  streakDays: number;
  focusSessionsCompleted: number;
  cumulativeCategoryStats?: Record<TaskCategory, CategoryStatRecord>;
}

export interface BlackCardRankTheme {
  id: string;
  tierLabel: string;
  bgGradient: string;
  backGradient: string;
  accent: string;
  accentSoft: string;
  accentBorder: string;
  badgeBg: string;
  badgeText: string;
  glowRgba: string;
  progressGlow: string;
}

/**
 * Bảng màu Hắc Thẻ tự động biến đổi theo Bậc Rank hiện tại của Thợ Săn.
 * Chỉ dùng giá trị rgba() tường minh (không dùng keyword transparent) để xuất ảnh PNG an toàn trên Safari/WebKit.
 */
export const BLACK_CARD_RANK_THEMES: Record<string, BlackCardRankTheme> = {
  dong: {
    id: 'dong',
    tierLabel: 'ĐỒNG',
    bgGradient: 'linear-gradient(135deg, #1E130D 0%, #44281A 48%, #0A151D 100%)',
    backGradient: 'linear-gradient(145deg, #160F0B 0%, #2C1B13 50%, #081218 100%)',
    accent: '#E09F73',
    accentSoft: 'rgba(224, 159, 115, 0.16)',
    accentBorder: 'rgba(224, 159, 115, 0.42)',
    badgeBg: 'rgba(224, 159, 115, 0.14)',
    badgeText: '#F6C6A5',
    glowRgba: 'rgba(224, 159, 115, 0.24)',
    progressGlow: 'linear-gradient(90deg, #B97246 0%, #F0B489 100%)',
  },
  bac: {
    id: 'bac',
    tierLabel: 'BẠC',
    bgGradient: 'linear-gradient(135deg, #101C26 0%, #2B3F52 48%, #08131A 100%)',
    backGradient: 'linear-gradient(145deg, #0D1720 0%, #1E2E3D 52%, #071117 100%)',
    accent: '#CBD5E1',
    accentSoft: 'rgba(203, 213, 225, 0.16)',
    accentBorder: 'rgba(203, 213, 225, 0.42)',
    badgeBg: 'rgba(203, 213, 225, 0.14)',
    badgeText: '#F1F5F9',
    glowRgba: 'rgba(203, 213, 225, 0.22)',
    progressGlow: 'linear-gradient(90deg, #7C92A8 0%, #E2E8F0 100%)',
  },
  vang: {
    id: 'vang',
    tierLabel: 'VÀNG',
    bgGradient: 'linear-gradient(135deg, #2B1F09 0%, #664912 48%, #0D1922 100%)',
    backGradient: 'linear-gradient(145deg, #1D1507 0%, #44310D 50%, #0A141C 100%)',
    accent: '#FBBF24',
    accentSoft: 'rgba(251, 191, 36, 0.18)',
    accentBorder: 'rgba(251, 191, 36, 0.46)',
    badgeBg: 'rgba(251, 191, 36, 0.15)',
    badgeText: '#FDE68A',
    glowRgba: 'rgba(251, 191, 36, 0.28)',
    progressGlow: 'linear-gradient(90deg, #D97706 0%, #FDE047 100%)',
  },
  'luc-bao': {
    id: 'luc-bao',
    tierLabel: 'LỤC BẢO',
    bgGradient: 'linear-gradient(135deg, #07241D 0%, #0F4C3A 48%, #091821 100%)',
    backGradient: 'linear-gradient(145deg, #061A15 0%, #0B362A 50%, #07131B 100%)',
    accent: '#34D399',
    accentSoft: 'rgba(52, 211, 153, 0.18)',
    accentBorder: 'rgba(52, 211, 153, 0.45)',
    badgeBg: 'rgba(52, 211, 153, 0.14)',
    badgeText: '#A7F3D0',
    glowRgba: 'rgba(52, 211, 153, 0.28)',
    progressGlow: 'linear-gradient(90deg, #059669 0%, #6EE7B7 100%)',
  },
  'cao-thu': {
    id: 'cao-thu',
    tierLabel: 'CAO THỦ',
    bgGradient: 'linear-gradient(135deg, #2A0D14 0%, #5C1B24 48%, #0E1A24 100%)',
    backGradient: 'linear-gradient(145deg, #1E090E 0%, #3E121A 50%, #0A141C 100%)',
    accent: '#F5B942',
    accentSoft: 'rgba(245, 185, 66, 0.18)',
    accentBorder: 'rgba(245, 185, 66, 0.48)',
    badgeBg: 'rgba(245, 185, 66, 0.15)',
    badgeText: '#FDE68A',
    glowRgba: 'rgba(245, 185, 66, 0.28)',
    progressGlow: 'linear-gradient(90deg, #E11D48 0%, #F5B942 100%)',
  },
  'dai-cao-thu': {
    id: 'dai-cao-thu',
    tierLabel: 'ĐẠI CAO THỦ',
    bgGradient: 'linear-gradient(135deg, #2E0919 0%, #6B1330 48%, #0B1620 100%)',
    backGradient: 'linear-gradient(145deg, #200712 0%, #480E22 50%, #09131C 100%)',
    accent: '#FDA4AF',
    accentSoft: 'rgba(251, 113, 133, 0.2)',
    accentBorder: 'rgba(253, 164, 175, 0.48)',
    badgeBg: 'rgba(244, 63, 94, 0.18)',
    badgeText: '#FFE4E6',
    glowRgba: 'rgba(244, 63, 94, 0.30)',
    progressGlow: 'linear-gradient(90deg, #E11D48 0%, #FBBF24 100%)',
  },
  'thach-dau': {
    id: 'thach-dau',
    tierLabel: 'THÁCH ĐẤU',
    bgGradient: 'linear-gradient(135deg, #1C1407 0%, #5B4010 46%, #09151E 100%)',
    backGradient: 'linear-gradient(145deg, #140F06 0%, #3A290B 50%, #07121A 100%)',
    accent: '#FFD43B',
    accentSoft: 'rgba(255, 212, 59, 0.22)',
    accentBorder: 'rgba(255, 212, 59, 0.54)',
    badgeBg: 'rgba(255, 212, 59, 0.18)',
    badgeText: '#FFF3BF',
    glowRgba: 'rgba(255, 212, 59, 0.34)',
    progressGlow: 'linear-gradient(90deg, #F59E0B 0%, #FFF3BF 100%)',
  },
};

export function getBlackCardRankTheme(tierId: string): BlackCardRankTheme {
  return BLACK_CARD_RANK_THEMES[tierId] || BLACK_CARD_RANK_THEMES.dong;
}

const calcAxisScore = (expGained: number, completedCount = 0): number => {
  const effectiveExp = Math.max(0, expGained) + Math.min(100, completedCount * 12);
  let score = 1.0;

  if (effectiveExp <= 0) {
    score = completedCount > 0 ? 1.0 + Math.min(0.5, completedCount * 0.1) : 1.0;
  } else if (effectiveExp < 100) {
    score = 1.0 + (effectiveExp / 100) * 1.0;
  } else if (effectiveExp < 300) {
    score = 2.0 + ((effectiveExp - 100) / 200) * 1.0;
  } else if (effectiveExp < 600) {
    score = 3.0 + ((effectiveExp - 300) / 300) * 1.0;
  } else if (effectiveExp < 1000) {
    score = 4.0 + ((effectiveExp - 600) / 400) * 1.0;
  } else {
    score = 5.0;
  }

  return Math.min(5.0, Math.max(1.0, parseFloat(score.toFixed(1))));
};

/**
 * Tính tên Hệ Thợ Săn khớp với Sơ Đồ Lục Giác Năng Lực.
 */
export function computeHunterArchetypeTitle(input: HunterArchetypeInput): string {
  const {
    tasks,
    completedTotal,
    exp,
    streakDays,
    focusSessionsCompleted,
    cumulativeCategoryStats,
  } = input;

  const catData: Record<TaskCategory, { completed: number; expGained: number }> = {
    'hoc-tap': { completed: 0, expGained: 0 },
    'cong-viec': { completed: 0, expGained: 0 },
    'the-luc': { completed: 0, expGained: 0 },
    'ca-nhan': { completed: 0, expGained: 0 },
    'sang-tao': { completed: 0, expGained: 0 },
  };

  tasks.forEach((t) => {
    const cat = catData[t.category] ? t.category : 'ca-nhan';
    if (t.completed) {
      catData[cat].completed += 1;
      catData[cat].expGained += t.lastAwardedExp || DIFFICULTIES[t.difficulty]?.exp || 40;
    }
  });

  const allCategories: TaskCategory[] = ['hoc-tap', 'cong-viec', 'the-luc', 'ca-nhan', 'sang-tao'];
  allCategories.forEach((cat) => {
    const cum = cumulativeCategoryStats?.[cat];
    if (cum) {
      catData[cat].completed = Math.max(catData[cat].completed, cum.completed || 0);
      catData[cat].expGained = Math.max(catData[cat].expGained, cum.expGained || 0);
    }
  });

  const currentCompletedSum = allCategories.reduce((acc, c) => acc + catData[c].completed, 0);
  const targetCompleted = Math.max(completedTotal || 0, currentCompletedSum);
  if (targetCompleted > currentCompletedSum) {
    const missing = targetCompleted - currentCompletedSum;
    const perCat = Math.floor(missing / 5);
    const rem = missing % 5;
    allCategories.forEach((cat, idx) => {
      catData[cat].completed += perCat + (idx < rem ? 1 : 0);
    });
  }

  const currentExpSum = allCategories.reduce((acc, c) => acc + catData[c].expGained, 0);
  if (exp > currentExpSum && (currentExpSum === 0 || currentCompletedSum === 0)) {
    const perCatExp = Math.floor((exp - currentExpSum) / 5);
    allCategories.forEach((cat) => {
      catData[cat].expGained += perCatExp;
    });
  }

  const disciplinePoints =
    (streakDays || 0) * 65 +
    (focusSessionsCompleted || 0) * 85 +
    Math.min(300, (targetCompleted || 0) * 15);

  const stats = [
    { key: 'tri-tue', score: calcAxisScore(catData['hoc-tap'].expGained, catData['hoc-tap'].completed) },
    { key: 'su-nghiep', score: calcAxisScore(catData['cong-viec'].expGained, catData['cong-viec'].completed) },
    { key: 'the-chat', score: calcAxisScore(catData['the-luc'].expGained, catData['the-luc'].completed) },
    {
      key: 'ky-luat',
      score: calcAxisScore(disciplinePoints, (streakDays || 0) + (focusSessionsCompleted || 0)),
    },
    { key: 'tu-chu', score: calcAxisScore(catData['ca-nhan'].expGained, catData['ca-nhan'].completed) },
    { key: 'sang-tao', score: calcAxisScore(catData['sang-tao'].expGained, catData['sang-tao'].completed) },
  ];

  const sorted = [...stats].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const avgScore = parseFloat((stats.reduce((sum, s) => sum + s.score, 0) / 6).toFixed(1));

  if (strongest.score - weakest.score <= 0.5 && avgScore >= 2.0) {
    return 'Thợ Săn Toàn Diện';
  }

  switch (strongest.key) {
    case 'tri-tue':
      return 'Học Giả Hắc Ám';
    case 'the-chat':
      return 'Chiến Binh Thép';
    case 'su-nghiep':
      return 'Chiến Lược Gia';
    case 'tu-chu':
      return 'Hành Giả Tĩnh Tâm';
    case 'sang-tao':
      return 'Nghệ Sĩ Hư Không';
    case 'ky-luat':
      return 'Bậc Thầy Thiết Luật';
    default:
      return 'Thợ Săn Tinh Anh';
  }
}

/**
 * Định dạng số Hắc Thẻ theo nhóm 4 ký tự: FQ26 • XXXX • YYYY • #002
 */
export function formatBlackCardNumber(
  hunterId: string,
  rankPos: number,
  isMasked: boolean
): { prefix: string; seg1: string; seg2: string; rankTag: string } {
  const clean = (hunterId || 'FAEQUEST00').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().padEnd(8, '0');
  const rankTag = `#${String(Math.max(1, rankPos)).padStart(3, '0')}`;
  return {
    prefix: 'FQ26',
    seg1: isMasked ? '••••' : clean.slice(0, 4),
    seg2: isMasked ? '••••' : clean.slice(4, 8),
    rankTag,
  };
}
