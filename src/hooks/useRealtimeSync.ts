import { useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useFaeQuestStore } from '../store/useFaeQuestStore';
import { playSoundEffect } from '../utils/soundEffects';

/**
 * Hook lắng nghe thời gian thực (Supabase Real-Time Sync) giữa Admin và Người Dùng
 * Đăng ký postgres_changes trên 4 bảng chính:
 * 1. system_achievements (Thêm, Sửa, Xóa Thành tựu & Danh hiệu)
 * 2. system_shop_items (Thêm, Sửa, Xóa Vật phẩm Hệ thống)
 * 3. user_messages (Thư mới, Quà tặng, Cảnh báo trực tiếp cho user)
 * 4. profiles (Khóa tài khoản, Thay đổi Role, Cập nhật EXP/Xu/Sao từ Admin)
 */
export const useRealtimeSync = (): void => {
  const currentUser = useFaeQuestStore((s) => s.currentUser);
  const soundEnabled = useFaeQuestStore((s) => s.soundEnabled);
  const addToast = useFaeQuestStore((s) => s.addToast);

  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    const channelName = `faequest-realtime-${currentUser.id}`;
    const channel = supabase.channel(channelName);

    // 1. Lắng nghe thay đổi Thành Tựu Hệ Thống (system_achievements)
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'system_achievements',
      },
      () => {
        // Tự động tải lại danh sách thành tựu & danh hiệu đồng bộ ngay lập tức
        useFaeQuestStore.getState().fetchSystemAchievements();
      }
    );

    // 2. Lắng nghe thay đổi Cửa Hàng Hệ Thống (system_shop_items)
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'system_shop_items',
      },
      () => {
        // Tự động tải lại vật phẩm Cửa Hàng Hệ Thống
        useFaeQuestStore.getState().fetchSystemShopItems();
      }
    );

    // 3. Lắng nghe Thư / Cảnh báo / Quà gửi riêng cho user hiện tại (user_messages)
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_messages',
        filter: `receiver_id=eq.${currentUser.id}`,
      },
      (payload) => {
        // Cập nhật lại danh sách thư & số thư chưa đọc
        useFaeQuestStore.getState().fetchUserMessages();

        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new as any;
          if (newMsg) {
            if (newMsg.message_type === 'warning') {
              playSoundEffect('warning', soundEnabled);
              useFaeQuestStore.setState({ activeWarningMessage: newMsg });
              addToast('⚠️ Bạn nhận được một Cảnh Báo khẩn cấp từ Quản Trị Viên!', 'error');
            } else if (newMsg.message_type === 'gift') {
              playSoundEffect('rankup', soundEnabled);
              addToast('🎁 Bạn vừa nhận được Thư Kèm Quà Tặng từ Quản Trị Viên! Hãy mở Hộp Thư để nhận!', 'success');
            } else {
              playSoundEffect('complete', soundEnabled);
              addToast('📬 Bạn có thư thông báo mới từ Quản Trị Viên.', 'info');
            }
          }
        }
      }
    );

    // 4. Lắng nghe thay đổi trên Profile của chính user (profiles)
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${currentUser.id}`,
      },
      async (payload) => {
        // CƠ CHẾ ĐỒNG BỘ REALTIME: BẮT SỰ KIỆN ADMIN XÓA TÀI KHOẢN (DELETE)
        if (payload.eventType === 'DELETE') {
          console.warn('Realtime sync phát hiện tài khoản của bạn bị Quản Trị Viên xóa:', currentUser.id);
          playSoundEffect('warning', soundEnabled);
          addToast('⚠️ Tài khoản của bạn đã bị Quản Trị Viên xóa khỏi hệ thống!', 'error');

          try {
            await supabase.auth.signOut();
          } catch { }

          if (typeof window !== 'undefined') {
            try {
              localStorage.clear();
              sessionStorage.clear();
            } catch { }
          }

          useFaeQuestStore.getState().signOut();
          return;
        }

        if (payload.new) {
          const p = payload.new as any;
          const patch: any = {};

          // Khóa tài khoản Realtime
          if (p.banned_until !== undefined) {
            patch.bannedUntil = p.banned_until;
          }
          if (p.ban_reason !== undefined) {
            patch.banReason = p.ban_reason;
          }

          // Phân quyền Realtime
          if (p.role !== undefined) {
            patch.userRole = p.role;
          }

          // Chỉ số EXP / Coins / Stars cập nhật từ máy chủ
          if (typeof p.exp === 'number' && p.exp !== useFaeQuestStore.getState().exp) {
            patch.exp = p.exp;
          }
          if (typeof p.coins === 'number' && p.coins !== useFaeQuestStore.getState().coins) {
            patch.coins = p.coins;
          }
          if (typeof p.stars === 'number' && p.stars !== useFaeQuestStore.getState().stars) {
            patch.stars = p.stars;
          }

          // Cập nhật Chuỗi Kỷ Luật & Ngày Điểm Danh Realtime
          if (typeof p.streak === 'number' && p.streak !== useFaeQuestStore.getState().streakDays) {
            patch.streakDays = p.streak;
          }
          if (p.last_streak_date !== undefined) {
            patch.lastStreakDate = p.last_streak_date || '';
          }

          // Cập nhật ảnh bìa & Avatar Realtime cho chính tài khoản hiện tại
          if (p.cover_url !== undefined && p.cover_url !== useFaeQuestStore.getState().coverUrl) {
            patch.coverUrl = p.cover_url || '';
          }
          if (p.avatar_url !== undefined && p.avatar_url !== useFaeQuestStore.getState().avatarUrl) {
            patch.avatarUrl = p.avatar_url || '';
          }

          if (Object.keys(patch).length > 0) {
            useFaeQuestStore.setState(patch);
          }
        }
      }
    );

    let profilesDebounceTimer: NodeJS.Timeout | null = null;

    // 5. Lắng nghe thay đổi toàn cầu trên profiles (Ảnh bìa, Avatar, Danh hiệu, EXP, Thứ hạng)
    // Giúp mọi người chơi thấy ngay ảnh bìa và hồ sơ mới theo thời gian thực (Real-time) mà không cần F5
    // Áp dụng Debounce 500ms để chống giật khung hình khi nhiều người chơi cùng hoàn thành nhiệm vụ
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
      },
      async (payload) => {
        // Bắt thêm ở kênh toàn cầu phòng trường hợp filter channel 4 không kích hoạt sự kiện DELETE
        if (payload.eventType === 'DELETE' && (payload.old as any)?.id === currentUser.id) {
          console.warn('Realtime sync phát hiện tài khoản bị xóa từ kênh toàn cầu:', currentUser.id);
          playSoundEffect('warning', soundEnabled);
          addToast('⚠️ Tài khoản của bạn đã bị Quản Trị Viên xóa khỏi hệ thống!', 'error');

          try {
            await supabase.auth.signOut();
          } catch { }

          if (typeof window !== 'undefined') {
            try {
              localStorage.clear();
              sessionStorage.clear();
            } catch { }
          }

          useFaeQuestStore.getState().signOut();
          return;
        }

        if (profilesDebounceTimer) {
          clearTimeout(profilesDebounceTimer);
        }
        profilesDebounceTimer = setTimeout(() => {
          useFaeQuestStore.getState().fetchCommunityProfiles();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('faequest:reload_leaderboard', { detail: payload }));
          }
        }, 500);
      }
    );

    // 6. Kênh lắng nghe Realtime riêng cho Nhật Ký Thợ Săn (public:journals)
    const journalChannel = supabase
      .channel(`public:journals:${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journals',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          useFaeQuestStore.getState().syncJournalRealtime(payload);
        }
      )
      .subscribe();

    // 7. Kênh lắng nghe Realtime Thông Báo Mùa Giải (public:season_announcements)
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'season_announcements',
      },
      (payload) => {
        useFaeQuestStore.getState().fetchSeasonAnnouncements();
        if (payload.eventType === 'INSERT') {
          playSoundEffect('complete', soundEnabled);
          addToast('📢 Có thông báo Mùa Giải mới trên Đấu Trường!', 'info');
        }
      }
    );

    // 8. Kênh lắng nghe Realtime user_states để đồng bộ danh sách nhạc Chilly giữa PC & Điện thoại
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_states',
        filter: `user_id=eq.${currentUser.id}`,
      },
      (payload) => {
        const cloudTracks = (payload.new as any)?.state_json?.chillyTracks;
        if (Array.isArray(cloudTracks)) {
          useFaeQuestStore.setState({ chillyTracks: cloudTracks });
        }
      }
    );

    channel.subscribe();

    return () => {
      if (profilesDebounceTimer) {
        clearTimeout(profilesDebounceTimer);
      }
      supabase.removeChannel(channel);
      supabase.removeChannel(journalChannel);
    };
  }, [currentUser?.id, soundEnabled, addToast]);
};
