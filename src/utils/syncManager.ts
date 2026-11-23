import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getRankIndexByExp, RANK_TIERS } from '../constants/ranks';
import { Task, ShopItem, InventoryTicket, Rival, SystemQuest, UserRole, TaskCategory, TaskDifficulty, CategoryStatRecord, DailyActivityRecord } from '../types';

export interface HunterProfileCloud {
  id: string;
  username: string;
  avatar_url: string | null;
  cover_url?: string | null;
  exp: number;
  coins: number;
  stars?: number;
  rank_id: string;
  equipped_title: string;
  streak: number;
  last_streak_date?: string | null;
  completed_tasks_count: number;
  role?: string;
  has_seen_tutorial?: boolean;
  updated_at: string;
}

export interface UserStateCloud {
  playerName: string;
  avatarUrl?: string;
  coverUrl?: string;
  exp: number;
  coins: number;
  stars?: number;
  completedTotal: number;
  streakDays: number;
  lastStreakDate?: string;
  lastActiveDate?: string;
  dailyCompletedCount: number;
  hasSeenTutorial?: boolean;
  dailyBossCompletedCount: number;
  tasks: Task[];
  shopItems: ShopItem[];
  inventory: InventoryTicket[];
  rivals: Rival[];
  systemQuests: SystemQuest[];
  unlockedTitleIds: string[];
  equippedTitleId: string;
  focusSessionsCompleted: number;
  cumulativeCategoryStats?: Record<TaskCategory, CategoryStatRecord>;
  cumulativeDifficultyStats?: Record<TaskDifficulty, number>;
  dailyActivityHistory?: Record<string, DailyActivityRecord>;
}

const HUNTER_ID_KEY = 'faequest_hunter_id';

/**
 * Lấy hoặc khởi tạo Mã Định Danh Thợ Săn (Hunter ID / Sync Code)
 */
export const getOrInitHunterId = (): string => {
  if (typeof window === 'undefined') return 'hunter_guest';
  let id = localStorage.getItem(HUNTER_ID_KEY);
  if (!id || id.trim() === '') {
    const randomPart = Math.random().toString(36).substring(2, 8);
    const timePart = Date.now().toString(36);
    id = `hunter_${randomPart}_${timePart}`;
    localStorage.setItem(HUNTER_ID_KEY, id);
  }
  return id;
};

/**
 * Lưu mã định danh mới vào LocalStorage (khi người dùng đổi mã để khôi phục)
 */
export const setStoredHunterId = (newId: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HUNTER_ID_KEY, newId.trim());
};

/**
 * Đẩy dữ liệu Profile & Toàn bộ State lên Supabase
 */
export const syncProfileAndStateToCloud = async (
  hunterId: string,
  state: UserStateCloud,
  initialRole?: UserRole
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Chưa cấu hình kết nối máy chủ' };
  }

  try {
    const rankIdx = getRankIndexByExp(state.exp);
    const tier = RANK_TIERS[rankIdx];

    // 1. Cập nhật hoặc khởi tạo thông tin trên public.profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', hunterId)
      .maybeSingle();

    if (!existingProfile) {
      // Tự động nhận diện role admin nếu email hoặc tên chứa từ khóa quản trị
      const lowerName = (state.playerName || '').toLowerCase();
      const detectedRole: UserRole = initialRole || (
        lowerName.includes('quản trị') || lowerName.includes('admin') ? 'admin' : 'user'
      );

      const { error: insErr } = await supabase.from('profiles').insert({
        id: hunterId,
        username: state.playerName || 'Thợ Săn Fae',
        avatar_url: state.avatarUrl || null,
        cover_url: state.coverUrl || null,
        exp: state.exp || 0,
        coins: state.coins || 25,
        stars: state.stars || 0,
        rank_id: tier?.id || 'dong',
        equipped_title: state.equippedTitleId || 'title_tan_binh_gai_do',
        streak: state.streakDays || 0,
        completed_tasks_count: state.completedTotal || 0,
        role: detectedRole,
        has_seen_tutorial: state.hasSeenTutorial ?? false,
        updated_at: new Date().toISOString(),
      });

      if (insErr) {
        // Fallback insert nếu bảng profiles chưa có cột role/stars
        await supabase.from('profiles').insert({
          id: hunterId,
          username: state.playerName || 'Thợ Săn Fae',
          avatar_url: state.avatarUrl || null,
          cover_url: state.coverUrl || null,
          exp: state.exp || 0,
          coins: state.coins || 25,
          rank_id: 'dong',
          equipped_title: state.equippedTitleId || 'title_tan_binh_gai_do',
          streak: state.streakDays || 0,
          completed_tasks_count: state.completedTotal || 0,
          updated_at: new Date().toISOString(),
        });
      }
    } else {
      const { data: updatedProfile, error: updErr } = await supabase.from('profiles').update({
        username: state.playerName || 'Thợ Săn Fae',
        avatar_url: state.avatarUrl || null,
        cover_url: state.coverUrl || null,
        equipped_title: state.equippedTitleId || 'title_tan_binh_gai_do',
        exp: state.exp || 0,
        coins: state.coins || 0,
        stars: state.stars || 0,
        streak: state.streakDays || 0,
        completed_tasks_count: state.completedTotal || 0,
        has_seen_tutorial: state.hasSeenTutorial ?? false,
        updated_at: new Date().toISOString(),
      })
        .eq('id', hunterId)
        // Quest completion updates the profile and increments this counter in one transaction.
        .eq('completed_tasks_count', state.completedTotal || 0)
        .select('id')
        .maybeSingle();

      if (updErr || !updatedProfile) {
        // A stale snapshot can still save display preferences.
        await supabase.from('profiles').update({
          username: state.playerName || 'Thợ Săn Fae',
          avatar_url: state.avatarUrl || null,
          cover_url: state.coverUrl || null,
          equipped_title: state.equippedTitleId || 'title_tan_binh_gai_do',
          updated_at: new Date().toISOString(),
        }).eq('id', hunterId);
      }
    }

    // 2. Upsert public.user_states (Lưu snapshot nhiệm vụ, shop, kho đồ của chính user)
    const { error: stateErr } = await supabase.from('user_states').upsert(
      {
        user_id: hunterId,
        state_json: state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (stateErr) throw stateErr;

    return { success: true };
  } catch (err: any) {
    console.error('Lỗi khi đồng bộ lên Supabase:', err);
    return { success: false, error: err.message || 'Lỗi không xác định khi đồng bộ' };
  }
};

/**
 * Lấy danh sách Top 50 Thợ Săn có EXP cao nhất từ Supabase
 */
export const fetchCommunityLeaderboard = async (
  limit = 50
): Promise<{ profiles: HunterProfileCloud[]; error?: string }> => {
  if (!isSupabaseConfigured) {
    return { profiles: [], error: 'Chưa cấu hình kết nối máy chủ' };
  }

  try {
    // Truy vấn trực tiếp từ bảng profiles (sắp xếp exp giảm dần, giới hạn 50 người)
    // Dùng select('*') để bảo đảm không bị lỗi cột không tồn tại
    // KHÔNG lọc .eq('id', user.id) và KHÔNG lọc bỏ những người chơi có last_streak_date là null
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('exp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Leaderboard fetch error:', error);
      return { profiles: [], error: error.message };
    }

    // Đảm bảo loại bỏ tuyệt đối bất kỳ tài khoản nào mang role admin
    const nonAdminProfiles = ((data as HunterProfileCloud[]) || []).filter(
      (p) => p.role !== 'admin'
    );
    return { profiles: nonAdminProfiles };
  } catch (err: any) {
    console.error('Leaderboard fetch error:', err);
    return { profiles: [], error: 'Không thể tải bảng xếp hạng từ máy chủ' };
  }
};

/**
 * Khôi phục dữ liệu từ Supabase bằng Mã Định Danh Thợ Săn (Hunter ID)
 */
export const restoreUserStateFromCloud = async (
  hunterId: string
): Promise<{ success: boolean; state?: UserStateCloud; error?: string }> => {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Chưa cấu hình kết nối máy chủ' };
  }

  try {
    const cleanId = hunterId.trim();
    // 1. Lấy snapshot từ user_states
    const { data, error } = await supabase
      .from('user_states')
      .select('*')
      .eq('user_id', cleanId)
      .maybeSingle();

    if (error) throw error;
    if (!data || !data.state_json) {
      return { success: false, error: 'Không tìm thấy dữ liệu cho mã Thợ Săn này' };
    }

    // 2. Lấy profile chính chủ từ public.profiles để luôn ưu tiên cover_url & avatar_url chuẩn
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', cleanId)
      .maybeSingle();

    const rawState = data.state_json as UserStateCloud;
    const finalState: UserStateCloud = {
      ...rawState,
      // Luôn đọc cover_url từ profiles làm nguồn chuẩn
      coverUrl:
        profileData?.cover_url !== undefined && profileData?.cover_url !== null
          ? profileData.cover_url
          : (rawState.coverUrl || ''),
      avatarUrl:
        profileData?.avatar_url !== undefined && profileData?.avatar_url !== null
          ? profileData.avatar_url
          : (rawState.avatarUrl || ''),
      streakDays:
        profileData?.streak !== undefined && profileData?.streak !== null
          ? profileData.streak
          : (rawState.streakDays || 0),
      lastStreakDate: profileData?.last_streak_date || rawState.lastStreakDate || '',
    };

    return { success: true, state: finalState };
  } catch (err: any) {
    return { success: false, error: 'Lỗi kết nối khi khôi phục dữ liệu' };
  }
};
