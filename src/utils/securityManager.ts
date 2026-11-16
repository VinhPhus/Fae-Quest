/**
 * FaeQuest Security Manager
 * Zero-Trust Client Storage & DevTools Anti-Tampering Engine
 */

export const purgeLegacySensitiveLocalStorage = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    // 1. Danh sách các storage key cũ từng lưu trữ exp/coins/tasks ở client
    const legacyKeys = [
      'faequest_rpg_todo_storage_v2',
      'faequest_rpg_todo_storage',
      'faequest-storage',
      'rpg_todo_storage',
    ];

    legacyKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // bỏ qua nếu không xóa được
      }
    });

    // 2. Quét toàn bộ LocalStorage để tìm bất kỳ key nào còn chứa dữ liệu nhạy cảm
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Giữ lại session đăng nhập của Supabase và hunterId định danh
      if (
        key === 'faequest_auth_session' ||
        key === 'faequest_hunter_id' ||
        key === 'faequest_ui_preferences'
      ) {
        continue;
      }

      try {
        const val = localStorage.getItem(key) || '';
        if (
          val.includes('"exp"') ||
          val.includes('"coins"') ||
          val.includes('"tasks"') ||
          val.includes('"inventory"') ||
          val.includes('"rank"')
        ) {
          keysToRemove.push(key);
        }
      } catch {
        // bỏ qua lỗi đọc key
      }
    }

    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
  } catch (err) {
    console.debug('LocalStorage security cleanup:', err);
  }
};

/**
 * Ngăn chặn việc gắn các biến nhạy cảm lên window object trong môi trường trình duyệt
 */
export const lockGlobalWindowVariables = (): void => {
  if (typeof window === 'undefined') return;

  try {
    // Đảm bảo không gắn supabase hay store lên window
    const w = window as any;
    if (w.supabase) delete w.supabase;
    if (w.store) delete w.store;
    if (w.useFaeQuestStore) delete w.useFaeQuestStore;
  } catch {}
};
