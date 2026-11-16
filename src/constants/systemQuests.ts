import { SystemQuest, UserTitle, Title } from '../types';

export const TITLE_DATA: Title[] = [
  {
    id: 'tan-binh',
    name: 'Tân Binh Gai Đỏ',
    description: 'Huy hiệu dành cho những chiến binh vừa bước chân vào thế giới kỷ luật FaeQuest.',
    source: 'Khởi Đầu Hành Trình (10 nhiệm vụ)',
    rarity: 'COMMON',
    iconUrl: '/assets/titles/title-tan-binh.png',
  },
  {
    id: 'chien-binh',
    name: 'Chiến Binh Bất Khuất',
    description: 'Minh chứng cho ý chí thép, chiến thắng bản ngã và làm chủ bản thân trong 30 ngày.',
    source: 'Thử Thách NoFap 30 Ngày (Chiến Binh Thép)',
    rarity: 'EPIC',
    iconUrl: '/assets/titles/title-chien-binh.png',
  },
  {
    id: 'che-ngu',
    name: 'Kẻ Chế Ngự Thời Gian',
    description: 'Dành cho bậc thầy kỷ luật 7 ngày không trì hoãn, biến từng giây phút thành giá trị.',
    source: '7 Ngày Kỷ Luật Sắt (Không Trì Hoãn)',
    rarity: 'RARE',
    iconUrl: '/assets/titles/title-che-ngu.png',
  },
  {
    id: 'the-phach',
    name: 'Thể Phách Kim Cương',
    description: 'Thần thể tráng kiện, năng lượng dồi dào qua 14 ngày ăn uống thanh lọc và tập luyện.',
    source: '14 Ngày Thanh Lọc Cơ Thể (Clean Eating & Gym)',
    rarity: 'RARE',
    iconUrl: '/assets/titles/title-the-phach.png',
  },
  {
    id: 'hoc-gia',
    name: 'Học Giả Huyền Bí',
    description: 'Tâm trí uyên bác được rèn giũa qua 21 ngày liên tục đắm mình trong tri thức sách vở.',
    source: '21 Ngày Đọc Sách & Rèn Tư Duy',
    rarity: 'EPIC',
    iconUrl: '/assets/titles/title-hoc-gia.png',
  },
  {
    id: 'tho-san',
    name: 'Thợ Săn Nhiệm Vụ',
    description: 'Chinh phục 50 mục tiêu lớn nhỏ, trở thành cỗ máy thực thi đáng tin cậy.',
    source: 'Thợ Săn Nhiệm Vụ (50 nhiệm vụ)',
    rarity: 'RARE',
    iconUrl: '/assets/titles/title-tho-san.png',
  },
  {
    id: 'hien-nhan',
    name: 'Hiền Nhân Tập Trung',
    description: '10 phiên Fae Focus tĩnh lặng, rèn giũa khả năng Deep Work không xao nhãng.',
    source: 'Bậc Thầy Tập Trung (10 phiên Fae Focus)',
    rarity: 'EPIC',
    iconUrl: '/assets/titles/title-hien-nhan.png',
  },
  {
    id: 'doc-co',
    name: 'Độc Cô Cầu Bại',
    description: 'Bước vào hàng ngũ Cao Thủ, đứng trên đỉnh cao vạn người ngưỡng mộ.',
    source: 'Chinh Phục Đỉnh Cao (Rank Cao Thủ+)',
    rarity: 'LEGENDARY',
    iconUrl: '/assets/titles/title-doc-co.png',
  },
];

export const SYSTEM_TITLES: Record<string, UserTitle> = {
  title_tan_binh_gai_do: {
    id: 'title_tan_binh_gai_do',
    name: 'Tân Binh Gai Đỏ',
    description: 'Huy hiệu dành cho những chiến binh vừa bước chân vào thế giới kỷ luật FaeQuest.',
    sourceQuestTitle: 'Khởi Đầu Hành Trình (10 nhiệm vụ)',
    color: 'text-rose-400',
    badgeBg: 'bg-rose-500/20 text-rose-300',
    borderColor: 'border-rose-400/40',
    icon: '🌱',
    iconUrl: '/assets/titles/title-tan-binh.png',
    rarity: 'common',
  },
  title_chien_binh_bat_khuat: {
    id: 'title_chien_binh_bat_khuat',
    name: 'Chiến Binh Bất Khuất',
    description: 'Minh chứng cho ý chí thép, chiến thắng bản ngã và làm chủ bản thân trong 30 ngày.',
    sourceQuestTitle: 'Thử Thách NoFap 30 Ngày (Chiến Binh Thép)',
    color: 'text-amber-400',
    badgeBg: 'bg-gradient-to-r from-amber-500/20 via-[#253745] to-[#4A5C6A]/20 text-amber-300',
    borderColor: 'border-[#4A5C6A]',
    icon: '🔥',
    iconUrl: '/assets/titles/title-chien-binh.png',
    rarity: 'epic',
  },
  title_ke_che_ngu_thoi_gian: {
    id: 'title_ke_che_ngu_thoi_gian',
    name: 'Kẻ Chế Ngự Thời Gian',
    description: 'Dành cho bậc thầy kỷ luật 7 ngày không trì hoãn, biến từng giây phút thành giá trị.',
    sourceQuestTitle: '7 Ngày Kỷ Luật Sắt (Không Trì Hoãn)',
    color: 'text-purple-300',
    badgeBg: 'bg-purple-900/40 text-purple-200',
    borderColor: 'border-purple-400/50',
    icon: '⏳',
    iconUrl: '/assets/titles/title-che-ngu.png',
    rarity: 'rare',
  },
  title_the_phach_kim_cuong: {
    id: 'title_the_phach_kim_cuong',
    name: 'Thể Phách Kim Cương',
    description: 'Thân thể tráng kiện, năng lượng dồi dào qua 14 ngày ăn uống thanh lọc và tập luyện.',
    sourceQuestTitle: '14 Ngày Thanh Lọc Cơ Thể (Clean Eating & Gym)',
    color: 'text-emerald-300',
    badgeBg: 'bg-emerald-950/40 text-emerald-300',
    borderColor: 'border-emerald-400/50',
    icon: '💎',
    iconUrl: '/assets/titles/title-the-phach.png',
    rarity: 'rare',
  },
  title_hoc_gia_huyen_bi: {
    id: 'title_hoc_gia_huyen_bi',
    name: 'Học Giả Huyền Bí',
    description: 'Tâm trí uyên bác được rèn giũa qua 21 ngày liên tục đắm mình trong tri thức sách vở.',
    sourceQuestTitle: '21 Ngày Đọc Sách & Rèn Tư Duy',
    color: 'text-amber-300',
    badgeBg: 'bg-amber-950/40 text-amber-200',
    borderColor: 'border-amber-400/50',
    icon: '📜',
    iconUrl: '/assets/titles/title-hoc-gia.png',
    rarity: 'epic',
  },
  title_tho_san_nhiem_vu: {
    id: 'title_tho_san_nhiem_vu',
    name: 'Thợ Săn Nhiệm Vụ',
    description: 'Chinh phục 50 mục tiêu lớn nhỏ, trở thành cỗ máy thực thi đáng tin cậy.',
    sourceQuestTitle: 'Thợ Săn Nhiệm Vụ (50 nhiệm vụ)',
    color: 'text-pink-300',
    badgeBg: 'bg-[#253745] text-[#CCD0CF]',
    borderColor: 'border-[#4A5C6A]',
    icon: '🎯',
    iconUrl: '/assets/titles/title-tho-san.png',
    rarity: 'rare',
  },
  title_hien_nhan_tap_trung: {
    id: 'title_hien_nhan_tap_trung',
    name: 'Hiền Nhân Tập Trung',
    description: '10 phiên Fae Focus tĩnh lặng, rèn giũa khả năng Deep Work không xao nhãng.',
    sourceQuestTitle: 'Bậc Thầy Tập Trung (10 phiên Fae Focus)',
    color: 'text-cyan-300',
    badgeBg: 'bg-cyan-950/40 text-cyan-200',
    borderColor: 'border-cyan-400/50',
    icon: '🧘',
    iconUrl: '/assets/titles/title-hien-nhan.png',
    rarity: 'epic',
  },
  title_doc_co_cau_bai: {
    id: 'title_doc_co_cau_bai',
    name: 'Độc Cô Cầu Bại',
    description: 'Bước vào hàng ngũ Cao Thủ, đứng trên đỉnh cao vạn người ngưỡng mộ.',
    sourceQuestTitle: 'Chinh Phục Đỉnh Cao (Rank Cao Thủ+)',
    color: 'text-amber-200',
    badgeBg: 'bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-purple-500/30 text-amber-200',
    borderColor: 'border-amber-300/80 shadow-[0_0_12px_rgba(245,158,11,0.5)]',
    icon: '👑',
    iconUrl: '/assets/titles/title-doc-co.png',
    rarity: 'legendary',
  },
};

// Aliases for short IDs so both 'title_...' and 'tan-binh' work
SYSTEM_TITLES['tan-binh'] = SYSTEM_TITLES.title_tan_binh_gai_do;
SYSTEM_TITLES['chien-binh'] = SYSTEM_TITLES.title_chien_binh_bat_khuat;
SYSTEM_TITLES['che-ngu'] = SYSTEM_TITLES.title_ke_che_ngu_thoi_gian;
SYSTEM_TITLES['the-phach'] = SYSTEM_TITLES.title_the_phach_kim_cuong;
SYSTEM_TITLES['hoc-gia'] = SYSTEM_TITLES.title_hoc_gia_huyen_bi;
SYSTEM_TITLES['tho-san'] = SYSTEM_TITLES.title_tho_san_nhiem_vu;
SYSTEM_TITLES['hien-nhan'] = SYSTEM_TITLES.title_hien_nhan_tap_trung;
SYSTEM_TITLES['doc-co'] = SYSTEM_TITLES.title_doc_co_cau_bai;

export interface UnifiedTitle {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  sourceText: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  isCustom?: boolean;
}

export const DEFAULT_TITLE_IDS = new Set([
  'tan-binh',
  'chien-binh',
  'che-ngu',
  'the-phach',
  'hoc-gia',
  'tho-san',
  'hien-nhan',
  'doc-co',
  'title_tan_binh_gai_do',
  'title_chien_binh_bat_khuat',
  'title_ke_che_ngu_thoi_gian',
  'title_the_phach_kim_cuong',
  'title_hoc_gia_huyen_bi',
  'title_tho_san_nhiem_vu',
  'title_hien_nhan_tap_trung',
  'title_doc_co_cau_bai',
]);

export function isDefaultSystemTitle(id: string): boolean {
  return DEFAULT_TITLE_IDS.has(id);
}

export function getRarityStyle(rarity: string) {
  const r = (rarity || 'RARE').toUpperCase();
  switch (r) {
    case 'LEGENDARY':
      return {
        color: 'text-amber-200',
        badgeBg: 'bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-purple-500/30 text-amber-200',
        borderColor: 'border-amber-300/80 shadow-[0_0_12px_rgba(245,158,11,0.5)]',
        rarity: 'legendary' as const,
      };
    case 'EPIC':
      return {
        color: 'text-purple-300',
        badgeBg: 'bg-purple-900/40 text-purple-200',
        borderColor: 'border-purple-400/50',
        rarity: 'epic' as const,
      };
    case 'RARE':
      return {
        color: 'text-cyan-300',
        badgeBg: 'bg-cyan-950/40 text-cyan-200',
        borderColor: 'border-cyan-400/50',
        rarity: 'rare' as const,
      };
    default:
      return {
        color: 'text-rose-400',
        badgeBg: 'bg-rose-500/20 text-rose-300',
        borderColor: 'border-rose-400/40',
        rarity: 'common' as const,
      };
  }
}

export function syncSystemTitlesWithAchievements(achievements: any[] = []) {
  const activeAchIds = new Set(achievements.map((a) => a.id));

  // 1. Dọn dẹp danh hiệu động đã bị Admin xóa khỏi SYSTEM_TITLES
  Object.keys(SYSTEM_TITLES).forEach((key) => {
    if (key.startsWith('sys_title_')) {
      const achId = key.replace('sys_title_', '');
      if (!activeAchIds.has(achId)) {
        delete SYSTEM_TITLES[key];
      }
    } else if (key.startsWith('title_') && !isDefaultSystemTitle(key)) {
      const achId = key.replace('title_', '');
      if (!activeAchIds.has(achId)) {
        delete SYSTEM_TITLES[key];
      }
    }
  });

  // 2. Đăng ký các danh hiệu động mới hoặc cập nhật từ system_achievements
  achievements.forEach((ach) => {
    if (ach.granted_title_name && ach.granted_title_name.trim()) {
      const style = getRarityStyle(ach.rarity);
      const userTitle: UserTitle = {
        id: `sys_title_${ach.id}`,
        name: ach.granted_title_name.trim(),
        description: ach.description || `Thành tựu hệ thống: ${ach.title}`,
        sourceQuestTitle: `Nguồn: ${ach.title} (${ach.target_value})`,
        color: style.color,
        badgeBg: style.badgeBg,
        borderColor: style.borderColor,
        icon: '👑',
        iconUrl: ach.icon_url || '/assets/titles/title-tan-binh.png',
        rarity: style.rarity,
      };
      SYSTEM_TITLES[`sys_title_${ach.id}`] = userTitle;
      SYSTEM_TITLES[`title_${ach.id}`] = userTitle;
    }
  });
}

export function getAllUnifiedTitles(achievements: any[] = []): UnifiedTitle[] {
  syncSystemTitlesWithAchievements(achievements);
  const list: UnifiedTitle[] = [];

  // 1. Tám danh hiệu mặc định
  TITLE_DATA.forEach((t) => {
    const style = getRarityStyle(t.rarity);
    list.push({
      id: t.id,
      name: t.name,
      description: t.description,
      iconUrl: t.iconUrl,
      rarity: t.rarity,
      sourceText: `Nguồn: ${t.source}`,
      color: style.color,
      badgeBg: style.badgeBg,
      borderColor: style.borderColor,
      isCustom: false,
    });
  });

  // 2. Danh hiệu từ system_achievements của Admin
  achievements.forEach((ach) => {
    if (ach.granted_title_name && ach.granted_title_name.trim()) {
      const style = getRarityStyle(ach.rarity);
      list.push({
        id: `sys_title_${ach.id}`,
        name: ach.granted_title_name.trim(),
        description: ach.description || `Thử thách: ${ach.title}`,
        iconUrl: ach.icon_url || '/assets/titles/title-tan-binh.png',
        rarity: ach.rarity,
        sourceText: `Nguồn: ${ach.title} (${ach.target_value})`,
        color: style.color,
        badgeBg: style.badgeBg,
        borderColor: style.borderColor,
        isCustom: true,
      });
    }
  });

  return list;
}

export function isTitleUnlocked(titleId: string, unlockedTitleIds: string[] = []): boolean {
  if (!titleId) return false;
  if (titleId === 'tan-binh' || titleId === 'title_tan_binh_gai_do') return true;
  if (unlockedTitleIds.includes(titleId)) return true;

  if (titleId.startsWith('sys_title_')) {
    const alt = titleId.replace('sys_title_', 'title_');
    if (unlockedTitleIds.includes(alt)) return true;
  }
  if (titleId.startsWith('title_')) {
    const alt = titleId.replace('title_', 'sys_title_');
    if (unlockedTitleIds.includes(alt)) return true;
  }

  const aliasMap: Record<string, string> = {
    'chien-binh': 'title_chien_binh_bat_khuat',
    'che-ngu': 'title_ke_che_ngu_thoi_gian',
    'the-phach': 'title_the_phach_kim_cuong',
    'hoc-gia': 'title_hoc_gia_huyen_bi',
    'tho-san': 'title_tho_san_nhiem_vu',
    'hien-nhan': 'title_hien_nhan_tap_trung',
    'doc-co': 'title_doc_co_cau_bai',
  };
  if (aliasMap[titleId] && unlockedTitleIds.includes(aliasMap[titleId])) return true;
  return false;
}

export function isTitleEquipped(titleId: string, equippedTitleId: string = ''): boolean {
  if (!titleId || !equippedTitleId) return false;
  if (titleId === equippedTitleId) return true;
  if (
    (titleId === 'tan-binh' || titleId === 'title_tan_binh_gai_do') &&
    (equippedTitleId === 'tan-binh' || equippedTitleId === 'title_tan_binh_gai_do')
  ) {
    return true;
  }
  if (titleId.startsWith('sys_title_') && equippedTitleId === titleId.replace('sys_title_', 'title_')) return true;
  if (titleId.startsWith('title_') && equippedTitleId === titleId.replace('title_', 'sys_title_')) return true;

  const aliasMap: Record<string, string> = {
    'chien-binh': 'title_chien_binh_bat_khuat',
    'che-ngu': 'title_ke_che_ngu_thoi_gian',
    'the-phach': 'title_the_phach_kim_cuong',
    'hoc-gia': 'title_hoc_gia_huyen_bi',
    'tho-san': 'title_tho_san_nhiem_vu',
    'hien-nhan': 'title_hien_nhan_tap_trung',
    'doc-co': 'title_doc_co_cau_bai',
  };
  if (aliasMap[titleId] && equippedTitleId === aliasMap[titleId]) return true;
  return false;
}

export function resolveTitleObject(titleId: string | undefined | null): UserTitle {
  if (!titleId) return SYSTEM_TITLES.title_tan_binh_gai_do;
  if (SYSTEM_TITLES[titleId]) return SYSTEM_TITLES[titleId];
  if (titleId.startsWith('sys_title_')) {
    const alt = titleId.replace('sys_title_', 'title_');
    if (SYSTEM_TITLES[alt]) return SYSTEM_TITLES[alt];
  }
  if (titleId.startsWith('title_')) {
    const alt = titleId.replace('title_', 'sys_title_');
    if (SYSTEM_TITLES[alt]) return SYSTEM_TITLES[alt];
  }
  return SYSTEM_TITLES.title_tan_binh_gai_do;
}


export const INITIAL_SYSTEM_QUESTS: SystemQuest[] = [
  // --- LOẠI 1: STREAK COUNTERS ---
  {
    id: 'sq_nofap_30',
    type: 'streak_counter',
    title: 'Thử Thách NoFap 30 Ngày (Chiến Binh Thép)',
    description: 'Chiến thắng cám dỗ, làm chủ bản thân 30 ngày liên tục để đánh thức sức mạnh nội tại.',
    targetDays: 30,
    currentStreak: 0,
    lastCheckInDate: '',
    expReward: 300,
    coinReward: 50,
    rewardTitleId: 'title_chien_binh_bat_khuat',
    rewardTitleName: 'Chiến Binh Bất Khuất',
    isCompleted: false,
    isRewardClaimed: false,
  },
  {
    id: 'sq_iron_discipline_7',
    type: 'streak_counter',
    title: '7 Ngày Kỷ Luật Sắt (Không Trì Hoãn)',
    description: '7 ngày liên tục thực hiện đúng cam kết mỗi sáng, nói không với viện cớ.',
    targetDays: 7,
    currentStreak: 0,
    lastCheckInDate: '',
    expReward: 100,
    coinReward: 20,
    rewardTitleId: 'title_ke_che_ngu_thoi_gian',
    rewardTitleName: 'Kẻ Chế Ngự Thời Gian',
    isCompleted: false,
    isRewardClaimed: false,
  },
  {
    id: 'sq_clean_body_14',
    type: 'streak_counter',
    title: '14 Ngày Thanh Lọc Cơ Thể (Clean Eating & Gym)',
    description: '14 ngày ăn sạch, uống đủ nước và rèn luyện thể chất kiên trì để xây dựng thể phách kim cương.',
    targetDays: 14,
    currentStreak: 0,
    lastCheckInDate: '',
    expReward: 180,
    coinReward: 35,
    rewardTitleId: 'title_the_phach_kim_cuong',
    rewardTitleName: 'Thể Phách Kim Cương',
    isCompleted: false,
    isRewardClaimed: false,
  },
  {
    id: 'sq_reading_21',
    type: 'streak_counter',
    title: '21 Ngày Đọc Sách & Rèn Tư Duy',
    description: 'Mỗi ngày đọc sách và nâng tầm tư duy trong 21 ngày liên tiếp để khai mở tri thức.',
    targetDays: 21,
    currentStreak: 0,
    lastCheckInDate: '',
    expReward: 250,
    coinReward: 40,
    rewardTitleId: 'title_hoc_gia_huyen_bi',
    rewardTitleName: 'Học Giả Huyền Bí',
    isCompleted: false,
    isRewardClaimed: false,
  },

  // --- LOẠI 2: MILESTONES ---
  {
    id: 'sq_milestone_10_tasks',
    type: 'milestone',
    title: 'Khởi Đầu Hành Trình',
    description: 'Hoàn thành 10 nhiệm vụ đầu tiên trên hành trình rèn luyện bản thân.',
    targetMilestone: 10,
    milestoneKey: 'completedTasks',
    expReward: 50,
    coinReward: 10,
    rewardTitleId: 'title_tan_binh_gai_do',
    rewardTitleName: 'Tân Binh Gai Đỏ',
    isCompleted: false,
    isRewardClaimed: false,
  },
  {
    id: 'sq_milestone_50_tasks',
    type: 'milestone',
    title: 'Thợ Săn Nhiệm Vụ',
    description: 'Hoàn thành tích lũy 50 nhiệm vụ mục tiêu cuộc sống.',
    targetMilestone: 50,
    milestoneKey: 'completedTasks',
    expReward: 200,
    coinReward: 40,
    rewardTitleId: 'title_tho_san_nhiem_vu',
    rewardTitleName: 'Thợ Săn Nhiệm Vụ',
    isCompleted: false,
    isRewardClaimed: false,
  },
  {
    id: 'sq_milestone_10_focus',
    type: 'milestone',
    title: 'Bậc Thầy Tập Trung',
    description: 'Hoàn thành 10 phiên đồng hồ Fae Focus tập trung cao độ.',
    targetMilestone: 10,
    milestoneKey: 'focusSessions',
    expReward: 150,
    coinReward: 30,
    rewardTitleId: 'title_hien_nhan_tap_trung',
    rewardTitleName: 'Hiền Nhân Tập Trung',
    isCompleted: false,
    isRewardClaimed: false,
  },
  {
    id: 'sq_milestone_rank_cao_thu',
    type: 'milestone',
    title: 'Chinh Phục Đỉnh Cao',
    description: 'Thăng cấp đạt đến bậc Rank Cao Thủ (từ 1,801 EXP trở lên).',
    targetMilestone: 4, // index 4 is Cao Thủ
    milestoneKey: 'rankIdx',
    expReward: 0,
    coinReward: 100,
    rewardTitleId: 'title_doc_co_cau_bai',
    rewardTitleName: 'Độc Cô Cầu Bại',
    isCompleted: false,
    isRewardClaimed: false,
  },
];
