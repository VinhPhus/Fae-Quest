import { Rank, RankTier } from '../types';

export const RANK_DATA: Rank[] = [
  { id: 'dong', name: 'Đồng', minExp: 0, maxExp: 200, bonusCoins: 10, iconUrl: '/assets/ranks/rank-dong.png' },
  { id: 'bac', name: 'Bạc', minExp: 201, maxExp: 500, bonusCoins: 20, iconUrl: '/assets/ranks/rank-bac.png' },
  { id: 'vang', name: 'Vàng', minExp: 501, maxExp: 1000, bonusCoins: 35, iconUrl: '/assets/ranks/rank-vang.png' },
  { id: 'luc-bao', name: 'Lục Bảo', minExp: 1001, maxExp: 1800, bonusCoins: 50, iconUrl: '/assets/ranks/rank-luc-bao.png' },
  { id: 'cao-thu', name: 'Cao Thủ', minExp: 1801, maxExp: 3000, bonusCoins: 75, iconUrl: '/assets/ranks/rank-cao-thu.png' },
  { id: 'dai-cao-thu', name: 'Đại Cao Thủ', minExp: 3001, maxExp: 5000, bonusCoins: 100, iconUrl: '/assets/ranks/rank-dai-cao-thu.png' },
  { id: 'thach-dau', name: 'Thách Đấu', minExp: 5001, maxExp: 999999, bonusCoins: 200, iconUrl: '/assets/ranks/rank-thach-dau.png' }
];

export const RANK_TIERS: RankTier[] = [
  {
    id: 'dong',
    name: 'Đồng',
    minExp: 0,
    maxExp: 200,
    bonusCoins: 10,
    coinBonus: 10,
    iconUrl: '/assets/ranks/rank-dong.png',
    badgeBg: 'from-[#8C583A] to-[#4D2C19]',
    accentColor: '#D97352',
    quote: 'Khởi đầu hành trình rèn luyện kỷ luật bản thân.',
  },
  {
    id: 'bac',
    name: 'Bạc',
    minExp: 201,
    maxExp: 500,
    bonusCoins: 20,
    coinBonus: 20,
    iconUrl: '/assets/ranks/rank-bac.png',
    badgeBg: 'from-[#8B9BB4] to-[#4A5568]',
    accentColor: '#CBD5E1',
    quote: 'Lưỡi kiếm đã bén, thói quen tốt bắt đầu hình thành.',
  },
  {
    id: 'vang',
    name: 'Vàng',
    minExp: 501,
    maxExp: 1000,
    bonusCoins: 35,
    coinBonus: 35,
    iconUrl: '/assets/ranks/rank-vang.png',
    badgeBg: 'from-[#F59E0B] to-[#92400E]',
    accentColor: '#FBBF24',
    quote: 'Ánh hào quang rực rỡ của sự kiên trì mỗi ngày.',
  },
  {
    id: 'luc-bao',
    name: 'Lục Bảo',
    minExp: 1001,
    maxExp: 1800,
    bonusCoins: 50,
    coinBonus: 50,
    iconUrl: '/assets/ranks/rank-luc-bao.png',
    badgeBg: 'from-[#10B981] to-[#064E3B]',
    accentColor: '#34D399',
    quote: 'Sức sống mãnh liệt, năng suất vượt trội hơn số đông.',
  },
  {
    id: 'cao-thu',
    name: 'Cao Thủ',
    minExp: 1801,
    maxExp: 3000,
    bonusCoins: 75,
    coinBonus: 75,
    iconUrl: '/assets/ranks/rank-cao-thu.png',
    badgeBg: 'from-[#6850AD] to-[#2D1036]',
    accentColor: '#A78BFA',
    quote: 'Làm chủ thời gian, ngọn lửa Opal huyền bí thức tỉnh.',
  },
  {
    id: 'dai-cao-thu',
    name: 'Đại Cao Thủ',
    minExp: 3001,
    maxExp: 5000,
    bonusCoins: 100,
    coinBonus: 100,
    iconUrl: '/assets/ranks/rank-dai-cao-thu.png',
    badgeBg: 'from-[#9D0B48] to-[#4A0420]',
    accentColor: '#F43F5E',
    quote: 'Huyết ước tối thượng! Không mục tiêu nào có thể cản bước.',
  },
  {
    id: 'thach-dau',
    name: 'Thách Đấu',
    minExp: 5001,
    maxExp: 999999,
    bonusCoins: 200,
    coinBonus: 200,
    iconUrl: '/assets/ranks/rank-thach-dau.png',
    badgeBg: 'from-[#D97352] via-[#6850AD] to-[#6B0733]',
    accentColor: '#FBBF24',
    quote: 'Đỉnh cao huyền thoại! Bạn là chuẩn mực của sự kỷ luật tuyệt đối.',
  }
];

export function getRankIndexByExp(exp: number): number {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (exp >= RANK_TIERS[i].minExp) return i;
  }
  return 0;
}
