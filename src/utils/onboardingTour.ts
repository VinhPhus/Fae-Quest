import { driver, Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useFaeQuestStore } from '../store/useFaeQuestStore';
import { supabase } from './supabaseClient';

let tourDriver: Driver | null = null;
let isTourRunning = false;

/**
 * 3-tier persistence helper: Zustand store -> localStorage -> Supabase DB.
 * Guarantees that tour state is marked immediately and permanently across F5 and network blips.
 */
export async function markTutorialAsSeen(userId?: string): Promise<void> {
  const store = useFaeQuestStore.getState();
  const id = userId || store.currentUser?.id || store.hunterId;

  // 1. Cập nhật ngay state trong Zustand store để UI phản hồi tức thì
  store.setHasSeenTutorial(true);

  // 2. Lưu khóa dự phòng theo đúng ID tài khoản vào localStorage
  if (id && typeof window !== 'undefined') {
    try {
      localStorage.setItem(`faequest_tour_seen_${id}`, 'true');
      localStorage.setItem(`faequest_tour_completed_${id}`, 'true');
    } catch (e) {
      console.warn('Failed to save tour seen to localStorage:', e);
    }
  }

  // 3. Gọi API cập nhật lên Supabase
  if (id) {
    try {
      const { error } = await supabase.from('profiles').update({ has_seen_tutorial: true }).eq('id', id);
      if (error) {
        console.error('Supabase update has_seen_tutorial error:', error);
      }
    } catch (err) {
      console.error('Failed to update has_seen_tutorial on Supabase:', err);
    }
  }
}

/**
 * Backward compatibility alias for completeOnboardingTour
 */
export const completeOnboardingTour = markTutorialAsSeen;

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
    overlayOpacity: 0.9,
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

    // Bắt đủ toàn bộ sự kiện đóng của driver.js để đảm bảo không bị spam
    onCloseClick: () => {
      markTutorialAsSeen();
      if (tourDriver) {
        tourDriver.destroy();
      }
    },

    onPopoverRender: (popover, { state }) => {
      // Ở Bước 1 (activeIndex === 0), ẩn nút "Quay Lại" vì đây là bước khởi đầu
      if (state.activeIndex === 0) {
        if (popover.previousButton) {
          popover.previousButton.style.display = 'none';
        }
      } else {
        if (popover.previousButton) {
          popover.previousButton.style.display = '';
        }
      }
    },

    onDestroyStarted: () => {
      markTutorialAsSeen();
      if (tourDriver) {
        tourDriver.destroy();
      }
    },

    onDestroyed: () => {
      markTutorialAsSeen();
      isTourRunning = false;
      tourDriver = null;
      if (typeof document !== 'undefined') {
        document.querySelectorAll('.driver-overlay, .driver-popover, .driver-active-element').forEach((el) => {
          el.remove();
        });
        document.body.classList.remove('driver-active', 'driver-fade');
      }
      // Trả lại activeTab là quests cho người dùng
      if (useFaeQuestStore.getState().activeTab !== 'quests') {
        useFaeQuestStore.getState().setActiveTab('quests');
      }
    },

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
          showButtons: ['next'],
          popoverClass: 'faequest-tour-popover faequest-first-step',
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

      // Bước 3: Bảng Kanban Nhiệm Vụ
      {
        element: '#tour-task-grid',
        popover: {
          title: '⚔️ Chinh Phục & Nhận Thưởng',
          description:
            'Kéo thả hoặc chuyển thẻ qua 3 cột (Chờ Thực Hiện, Đang Rèn Luyện, Đã Nghiệm Thu), bấm Focus để tập trung sâu và dùng bộ lọc theo nhóm hoặc độ khó để quản lý mục tiêu.',
          side: 'top',
          align: 'center',
        },
      },

      // Bước 4: Nút Tài Khoản Thợ Săn (Avatar #408)
      {
        element: () => {
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            return document.querySelector('#tour-mobile-profile') as HTMLElement;
          }
          return document.querySelector('#tour-sidebar-profile') as HTMLElement;
        },
        popover: {
          title: '👤 Tài Khoản & Hắc Thẻ',
          description:
            'Chạm vào Avatar để mở nhanh Hồ Sơ Cá Nhân, xem và xuất Hắc Thẻ Chiến Tích 3D, điều chỉnh Cài Đặt hoặc Đăng Xuất an toàn.',
          side: typeof window !== 'undefined' && window.innerWidth >= 768 ? 'right' : 'bottom',
          align: typeof window !== 'undefined' && window.innerWidth >= 768 ? 'start' : 'end',
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
          onNextClick: () => {
            markTutorialAsSeen();
            if (tourDriver) {
              tourDriver.destroy();
            }
          },
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
  });

  return tourDriver;
}

/**
 * Starts the onboarding tour.
 * @param forceReplay If true (e.g. from Settings "Xem Lại Hướng Dẫn"), forces the tour to start regardless of hasSeenTutorial status.
 */
export function startOnboardingTour(forceReplay = false): void {
  if (typeof window === 'undefined') return;

  const state = useFaeQuestStore.getState();
  const userId = state.currentUser?.id || state.hunterId;

  // Nếu không phải forceReplay, kiểm tra cờ đã xem hoặc Khế Ước Thợ Săn đang mở
  if (!forceReplay) {
    const isLocallySeen = userId
      ? localStorage.getItem(`faequest_tour_seen_${userId}`) === 'true' ||
        localStorage.getItem(`faequest_tour_completed_${userId}`) === 'true'
      : false;

    if (state.hasSeenTutorial || isLocallySeen || state.isOathOpen) {
      return;
    }

    // Chốt chặn ngay lúc bắt đầu: Đánh dấu đã xem ngay lập tức để F5 không bao giờ bị lặp lại
    if (userId) {
      markTutorialAsSeen(userId);
    }
  }

  if (isTourRunning) return;
  isTourRunning = true;

  // Đảm bảo chuyển về trang Nhiệm Vụ trước khi bắt đầu để các selector DOM tồn tại
  if (state.activeTab !== 'quests') {
    state.setActiveTab('quests');
  }

  setTimeout(() => {
    try {
      const driverObj = getOnboardingTourDriver();
      driverObj.drive(0);
    } catch (e) {
      console.warn('Error starting driver.js onboarding tour:', e);
      isTourRunning = false;
      tourDriver = null;
    }
  }, 350);
}
