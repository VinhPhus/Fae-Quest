import { driver, Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useFaeQuestStore } from '../store/useFaeQuestStore';
import { supabase } from './supabaseClient';

let tourDriver: Driver | null = null;
let isTourRunning = false;

/**
 * Marks the tutorial as completed in both Zustand state and Supabase Database.
 */
export async function completeOnboardingTour(): Promise<void> {
  const store = useFaeQuestStore.getState();
  store.setHasSeenTutorial(true);

  const hunterId = store.currentUser?.id || store.hunterId;
  if (hunterId) {
    try {
      await supabase.from('profiles').update({ has_seen_tutorial: true }).eq('id', hunterId);
    } catch (err) {
      console.warn('Failed to update has_seen_tutorial on Supabase:', err);
    }
  }
}

/**
 * Returns the driver.js instance configured with FaeQuest's Obsidian & Steel theme.
 */
export function getOnboardingTourDriver(): Driver {
  if (tourDriver) {
    return tourDriver;
  }

  tourDriver = driver({
    animate: true,
    overlayColor: '#06141B',
    overlayOpacity: 0.85,
    smoothScroll: true,
    stagePadding: 8,
    stageRadius: 16,
    allowClose: true,
    showProgress: true,
    progressText: 'Bước {{current}} / {{total}}',
    nextBtnText: 'Tiếp Tục ➔',
    prevBtnText: 'Quay Lại',
    doneBtnText: 'Bắt Đầu Chiến Đấu ⚔️',
    closeBtnLabel: 'Bỏ qua',
    popoverClass: 'faequest-tour-popover',
    steps: [
      // Bước 1 (Trang Nhiệm Vụ - Không element, hiển thị trung tâm)
      {
        element: undefined,
        popover: {
          title: '✨ Chào mừng Thợ Săn!',
          description:
            'Chào mừng bạn bước chân vào thế giới rèn luyện FaeQuest! Hãy dành một phút để xem qua cách thế giới này vận hành và bắt đầu hành trình của bạn.',
          side: 'bottom',
          align: 'center',
          nextBtnText: 'Khám Phá Ngay ➔',
        },
      },

      // Bước 2: Nút Khắc Lệnh Mới
      {
        element: '#tour-add-task',
        popover: {
          title: '📜 Khắc Lệnh Nhiệm Vụ',
          description:
            'Bắt đầu một ngày rèn luyện bằng việc thêm mục tiêu bạn cần hoàn thành hôm nay. Chọn độ khó (Dễ, Trung bình, Khó, Boss) và hẹn giờ tập trung Fae Focus.',
          side: 'bottom',
          align: 'end',
        },
      },

      // Bước 3: Lưới Nhiệm Vụ
      {
        element: '#tour-task-grid',
        popover: {
          title: '⚔️ Chinh Phục & Nhận Thưởng',
          description:
            'Mỗi khi hoàn thành nhiệm vụ, bạn sẽ nhận được EXP để thăng hạng Danh Vọng và Xu Vàng. Dùng bộ lọc trạng thái và danh mục để quản lý công việc.',
          side: 'top',
          align: 'center',
        },
      },

      // Bước 4: Menu Hồ Sơ Thợ Săn
      {
        element: () => {
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            return document.querySelector('#tour-mobile-profile') as HTMLElement;
          }
          return document.querySelector('#tour-sidebar-profile') as HTMLElement;
        },
        popover: {
          title: '👤 Thẻ Căn Cước',
          description:
            'Xem lại toàn bộ hành trình rèn luyện, chuỗi kỷ luật, danh hiệu hiện tại và bảng thành tích cá nhân. Bạn cũng có thể tùy biến ảnh đại diện và ảnh bìa tại đây.',
          side: typeof window !== 'undefined' && window.innerWidth >= 768 ? 'right' : 'top',
          align: 'start',
        },
      },

      // Bước 5: Menu Cửa Hàng & Túi Đồ
      {
        element: () => {
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            return document.querySelector('#tour-mobile-shop') as HTMLElement;
          }
          return document.querySelector('#tour-sidebar-shop') as HTMLElement;
        },
        popover: {
          title: '🛒 Tự Thưởng Cho Bản Thân',
          description:
            'Dùng Xu Vàng cày được để mua các phần thưởng giải trí xứng đáng cho nỗ lực của bạn. Đừng quên kích hoạt và sử dụng chúng trong tab Túi Đồ nhé!',
          side: typeof window !== 'undefined' && window.innerWidth >= 768 ? 'right' : 'top',
          align: 'start',
        },
      },

      // Bước 6: Hoàn tất kịch bản (Không element, hiển thị trung tâm)
      {
        element: undefined,
        popover: {
          title: '🛡️ Sẵn sàng chiến đấu!',
          description:
            'Bạn đã nắm vững toàn bộ cơ chế của FaeQuest. Hãy luôn duy trì kỷ luật mỗi ngày để leo lên đỉnh Đấu Trường Danh Vọng. Chúc bạn một hành trình rực rỡ!',
          side: 'bottom',
          align: 'center',
          doneBtnText: 'Bắt Đầu Chiến Đấu ⚔️',
        },
      },
    ],

    onHighlightStarted: (_element, step, { state }) => {
      // Đảm bảo đưa người dùng về trang Nhiệm Vụ nếu bước đầu tiên hoặc kết thúc
      const activeIdx = state.activeIndex;
      if (activeIdx === 0 || activeIdx === 1 || activeIdx === 2) {
        if (useFaeQuestStore.getState().activeTab !== 'quests') {
          useFaeQuestStore.getState().setActiveTab('quests');
        }
      }
    },

    onDestroyStarted: () => {
      completeOnboardingTour();
    },

    onDestroyed: () => {
      isTourRunning = false;
      // Trả lại activeTab là quests cho người dùng
      if (useFaeQuestStore.getState().activeTab !== 'quests') {
        useFaeQuestStore.getState().setActiveTab('quests');
      }
    },
  });

  return tourDriver;
}

/**
 * Starts the onboarding tour.
 * If force is true (e.g. from Settings "Xem Lại Hướng Dẫn"), runs immediately regardless of has_seen_tutorial.
 */
export function startOnboardingTour(force = false): void {
  if (typeof window === 'undefined') return;

  const state = useFaeQuestStore.getState();
  if (!force && state.hasSeenTutorial) {
    return;
  }

  if (isTourRunning) return;
  isTourRunning = true;

  // Đảm bảo chuyển về trang Nhiệm Vụ trước khi bắt đầu để các selector DOM tồn tại
  state.setActiveTab('quests');

  setTimeout(() => {
    try {
      const driverObj = getOnboardingTourDriver();
      driverObj.drive(0);
    } catch (e) {
      console.warn('Error starting driver.js onboarding tour:', e);
      isTourRunning = false;
    }
  }, 250);
}
