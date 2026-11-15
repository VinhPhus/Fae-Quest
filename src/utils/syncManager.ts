import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getRankIndexByExp, RANK_TIERS } from '../constants/ranks';
import { Task, ShopItem, InventoryTicket, Rival, SystemQuest } from '../types';

export interface HunterProfileCloud {
  id: string;
  username: string;
  avatar_url: string | null;
  exp: number;
  coins: number;
  rank_id: string;
  equipped_title: string;
  streak: number;
  completed_tasks_count: number;
  updated_at: string;
}

export interface UserStateCloud {
  playerName: string;
  avatarUrl?: string;
  exp: number;
  coins: number;
  completedTotal: number;
  streakDays: number;
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
  state: UserStateCloud
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Chưa cấu hình Supabase URL hoặc Anon Key' };
  }

  try {
    const rankIdx = getRankIndexByExp(state.exp);
    const tier = RANK_TIERS[rankIdx];

    // 1. Upsert public.profiles (Dành cho BXH & tìm kiếm)
    const { error: profileErr } = await supabase.from('profiles').upsert(
      {
        id: hunterId,
        username: state.playerName || 'Thợ Săn Fae',
        avatar_url: state.avatarUrl || null,
        exp: state.exp || 0,
        coins: state.coins || 0,
        rank_id: tier ? tier.id : 'dong',
        equipped_title: state.equippedTitleId || 'title_tan_binh_gai_do',
        streak: state.streakDays || 0,
        completed_tasks_count: state.completedTotal || 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (profileErr) throw profileErr;

    // 2. Upsert public.user_states (Lưu snapshot đầy đủ của toàn bộ ứng dụng)
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
    return { profiles: [], error: 'Chưa cấu hình Supabase' };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('exp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { profiles: (data as HunterProfileCloud[]) || [] };
  } catch (err: any) {
    console.error('Lỗi khi tải BXH Supabase:', err);
    return { profiles: [], error: err.message || 'Không thể tải BXH từ đám mây' };
  }
};

/**
 * Khôi phục dữ liệu từ Supabase bằng Mã Định Danh Thợ Săn (Hunter ID)
 */
export const restoreUserStateFromCloud = async (
  hunterId: string
): Promise<{ success: boolean; state?: UserStateCloud; error?: string }> => {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Chưa cấu hình Supabase' };
  }

  try {
    const { data, error } = await supabase
      .from('user_states')
      .select('*')
      .eq('user_id', hunterId.trim())
      .single();

    if (error) throw error;
    if (!data || !data.state_json) {
      return { success: false, error: 'Không tìm thấy dữ liệu cho mã thợ săn này' };
    }

    return { success: true, state: data.state_json as UserStateCloud };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi khi khôi phục dữ liệu' };
  }
};
