import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Smartphone,
  Laptop,
  Download,
  Check,
  X,
  ArrowUpRight,
  ArrowDown,
  AlertCircle,
} from 'lucide-react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { toast } from '../../store/useToastStore';
import { playSound } from '../../utils/soundEngine';
import './InstallApp393.css';

export type PlatformTabId = 'ios' | 'android' | 'desktop';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PlatformConfig {
  id: PlatformTabId;
  label: string;
  buttonText: string;
  metaText: string;
  steps: [
    { title: string; desc: string },
    { title: string; desc: string },
    { title: string; desc: string },
  ];
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'ios',
    label: 'iOS',
    buttonText: 'Cài cho iPhone / iPad',
    metaText: 'FaeQuest V2.0 • Chạy toàn màn hình qua Safari • ~2MB',
    steps: [
      { title: 'Bấm nút Chia sẻ', desc: 'Chạm biểu tượng Chia sẻ ở thanh dưới Safari' },
      {
        title: 'Thêm vào MH chính',
        desc: 'Chọn "Thêm vào Màn hình chính" (Add to Home Screen)',
      },
      {
        title: 'Mở như App gốc',
        desc: 'Chạm biểu tượng FaeQuest ngoài màn hình để vào Đấu Trường',
      },
    ],
  },
  {
    id: 'android',
    label: 'Android',
    buttonText: 'Cài đặt cho Android',
    metaText: 'FaeQuest V2.0 • Cài 1 chạm qua Chrome • Chạy mượt 60fps',
    steps: [
      {
        title: 'Chạm Cài đặt',
        desc: 'Xác nhận hộp thoại cài đặt của trình duyệt (hoặc mở menu ⋮)',
      },
      {
        title: 'Chờ 3 giây',
        desc: 'Hệ thống tự tạo biểu tượng FaeQuest ngoài màn hình chính',
      },
      {
        title: 'Đăng nhập',
        desc: 'Tiếp tục giữ chuỗi kỷ luật và nhận thông báo mọi lúc',
      },
    ],
  },
  {
    id: 'desktop',
    label: 'PC / Mac',
    buttonText: 'Cài cho Máy tính',
    metaText: 'FaeQuest V2.0 • Windows / macOS • Cửa sổ độc lập không viền',
    steps: [
      {
        title: 'Nhấn Cài đặt',
        desc: 'Xác nhận popup cài ứng dụng từ thanh địa chỉ Chrome/Edge',
      },
      {
        title: 'Ghim vào Taskbar',
        desc: 'Giữ ứng dụng sẵn trên thanh tác vụ để mở tức thì',
      },
      {
        title: 'Vào Đấu Trường',
        desc: 'Đồng bộ 100% nhiệm vụ, Focus và Hắc Thẻ từ Supabase',
      },
    ],
  },
];

export function detectDevicePlatform(): PlatformTabId {
  if (typeof window === 'undefined') return 'desktop';
  const ua = window.navigator.userAgent || '';
  const isIos =
    /iPhone|iPad|iPod/i.test(ua) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  if (isIos) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

function isInAppEmbeddedBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent || '';
  return /FBAN|FBAV|Zalo|Line|TikTok|Instagram|Messenger/i.test(ua);
}

interface InstallAppCard393Props {
  onClose?: () => void;
  embedded?: boolean;
}

export const InstallAppCard393: React.FC<InstallAppCard393Props> = ({
  onClose,
  embedded = false,
}) => {
  const {
    soundEnabled,
    deferredInstallPrompt,
    setDeferredInstallPrompt,
    isAppStandalone,
    setIsAppStandalone,
  } = useFaeQuestStore();

  const [activePlatform, setActivePlatform] = useState<PlatformTabId>(() => detectDevicePlatform());
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);
  const [guideMode, setGuideMode] = useState<boolean>(false);
  const [litSteps, setLitSteps] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [inAppHint, setInAppHint] = useState<boolean>(false);
  const [swapTick, setSwapTick] = useState<number>(0);

  // Giữ nội dung cũ phục vụ Slot-Swap trượt dọc (-100% <-> +100%)
  const [prevBtnLabel, setPrevBtnLabel] = useState<string | null>(null);
  const [prevMetaText, setPrevMetaText] = useState<string | null>(null);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stepTimersRef = useRef<number[]>([]);

  const isStandaloneNow = useMemo(() => {
    if (isAppStandalone) return true;
    if (typeof window === 'undefined') return false;
    try {
      return (
        Boolean(window.matchMedia?.('(display-mode: standalone)').matches) ||
        (window.navigator as any).standalone === true
      );
    } catch {
      return false;
    }
  }, [isAppStandalone]);

  const clearStepTimers = () => {
    stepTimersRef.current.forEach((t) => window.clearTimeout(t));
    stepTimersRef.current = [];
  };

  useEffect(() => {
    return () => clearStepTimers();
  }, []);

  const currentPlatformIndex = PLATFORMS.findIndex((p) => p.id === activePlatform);
  const currentConfig = PLATFORMS[currentPlatformIndex] || PLATFORMS[2];

  const resolvedButtonText = isStandaloneNow
    ? 'Đã cài đặt trên thiết bị này'
    : installSuccess
    ? 'Đã bắt đầu cài đặt'
    : guideMode
    ? 'Làm theo 3 bước bên dưới'
    : currentConfig.buttonText;

  const resolvedMetaText = isStandaloneNow
    ? 'FaeQuest đang chạy ở chế độ ứng dụng độc lập toàn màn hình'
    : currentConfig.metaText;

  const lastBtnRef = useRef<string>(resolvedButtonText);
  const lastMetaRef = useRef<string>(resolvedMetaText);

  // Kích hoạt Slot-Swap trượt dọc mỗi khi chữ nút hoặc dòng thông số thay đổi
  useEffect(() => {
    let changed = false;
    if (lastBtnRef.current !== resolvedButtonText) {
      setPrevBtnLabel(lastBtnRef.current);
      lastBtnRef.current = resolvedButtonText;
      changed = true;
    }
    if (lastMetaRef.current !== resolvedMetaText) {
      setPrevMetaText(lastMetaRef.current);
      lastMetaRef.current = resolvedMetaText;
      changed = true;
    }
    if (changed) {
      setSwapTick((t) => t + 1);
      const timer = window.setTimeout(() => {
        setPrevBtnLabel(null);
        setPrevMetaText(null);
      }, 420);
      return () => window.clearTimeout(timer);
    }
  }, [resolvedButtonText, resolvedMetaText]);

  const handleSelectPlatform = (id: PlatformTabId) => {
    if (id === activePlatform) return;
    clearStepTimers();
    setActivePlatform(id);
    setInstallSuccess(false);
    setGuideMode(false);
    setLitSteps([false, false, false]);
    setInAppHint(false);
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (currentPlatformIndex + 1) % PLATFORMS.length;
      handleSelectPlatform(PLATFORMS[next].id);
      tabRefs.current[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (currentPlatformIndex - 1 + PLATFORMS.length) % PLATFORMS.length;
      handleSelectPlatform(PLATFORMS[prev].id);
      tabRefs.current[prev]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      handleSelectPlatform(PLATFORMS[0].id);
      tabRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = PLATFORMS.length - 1;
      handleSelectPlatform(PLATFORMS[last].id);
      tabRefs.current[last]?.focus();
    }
  };

  // Bật sáng 3 bước hướng dẫn lệch nhịp 350ms + k * 450ms (#393)
  const igniteThreeSteps = () => {
    clearStepTimers();
    setLitSteps([false, false, false]);

    const reducedMotion =
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

    if (reducedMotion) {
      setLitSteps([true, true, true]);
      return;
    }

    [0, 1, 2].forEach((k) => {
      const t = window.setTimeout(() => {
        setLitSteps((prev) => {
          const next: [boolean, boolean, boolean] = [...prev] as [boolean, boolean, boolean];
          next[k] = true;
          return next;
        });
      }, 350 + k * 450);
      stepTimersRef.current.push(t);
    });
  };

  const handleInstallClick = async () => {
    if (isStandaloneNow) {
      toast.ok('FaeQuest đã sẵn sàng', 'Ứng dụng đang chạy độc lập trên thiết bị này');
      return;
    }

    playSound('ui_click', soundEnabled);
    setInAppHint(false);

    // Kịch bản iOS (Safari không hỗ trợ beforeinstallprompt)
    if (activePlatform === 'ios') {
      setGuideMode(true);
      igniteThreeSteps();
      if (isInAppEmbeddedBrowser()) {
        setInAppHint(true);
      }
      toast.info(
        'Hướng dẫn cài trên iOS',
        'Chạm nút Chia sẻ ở đáy Safari ➔ Thêm vào Màn hình chính'
      );
      return;
    }

    // Kịch bản Android / PC: ưu tiên gọi Native beforeinstallprompt nếu trình duyệt cung cấp
    const promptToUse = (deferredInstallPrompt ||
      (window as any).__faequest_install_prompt) as BeforeInstallPromptEvent | null;

    if (promptToUse && typeof promptToUse.prompt === 'function') {
      try {
        await promptToUse.prompt();
        const choice = await promptToUse.userChoice;
        if (choice.outcome === 'accepted') {
          setInstallSuccess(true);
          setGuideMode(false);
          igniteThreeSteps();
          setDeferredInstallPrompt(null);
          (window as any).__faequest_install_prompt = null;
          setIsAppStandalone(true);
          toast.ok(
            'Đang cài đặt FaeQuest',
            'Biểu tượng Đấu Trường sẽ xuất hiện trên màn hình chính'
          );
          return;
        }
      } catch (err) {
        console.warn('PWA prompt warning:', err);
      }
    }

    // Fallback: hướng dẫn cài đặt thủ công 3 bước + cảnh báo nhẹ nếu mở qua trình duyệt nhúng
    setGuideMode(true);
    igniteThreeSteps();
    if (isInAppEmbeddedBrowser()) {
      setInAppHint(true);
    }
    toast.info(
      'Làm theo 3 bước bên dưới',
      'Mở menu trình duyệt hoặc biểu tượng cài đặt trên thanh địa chỉ'
    );
  };

  const hasNativePrompt = Boolean(
    deferredInstallPrompt ||
      (typeof window !== 'undefined' && (window as any).__faequest_install_prompt)
  );
  const showTopRightArrow =
    !isStandaloneNow &&
    !installSuccess &&
    activePlatform !== 'ios' &&
    (!hasNativePrompt || guideMode);
  const showIosBottomArrow = !isStandaloneNow && activePlatform === 'ios';

  const renderTabIcon = (id: PlatformTabId) => {
    if (id === 'ios') {
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" aria-hidden="true">
          <path d="M16.36 12.82c-.02-2.16 1.76-3.2 1.84-3.25-1-1.47-2.57-1.67-3.12-1.69-1.31-.14-2.59.79-3.26.79-.68 0-1.71-.77-2.82-.75-1.44.02-2.78.85-3.52 2.15-1.51 2.62-.38 6.49 1.08 8.61.72 1.03 1.56 2.19 2.68 2.15 1.08-.04 1.49-.7 2.8-.7 1.3 0 1.67.7 2.81.67 1.16-.02 1.9-1.05 2.61-2.09.84-1.21 1.18-2.39 1.2-2.45-.03-.01-2.29-.88-2.3-3.44ZM14.22 6.45c.59-.72.99-1.71.88-2.7-.85.03-1.89.57-2.5 1.28-.54.63-1.02 1.65-.89 2.62.95.07 1.92-.48 2.51-1.2Z" />
        </svg>
      );
    }
    if (id === 'android') {
      return <Smartphone className="w-4 h-4 shrink-0" />;
    }
    return <Laptop className="w-4 h-4 shrink-0" />;
  };

  return (
    <div className={`u393-card ${embedded ? '!shadow-lg' : ''}`}>
      {/* Mũi tên nhún chỉ hướng ở góc trên phải (PC / Android) hoặc nút Đóng modal */}
      <div className="flex items-start justify-between gap-2 mb-3.5">
        <div className="min-w-0">
          <span className="inline-block text-[10.5px] font-black uppercase tracking-[0.14em] text-[#F5B942]">
            ỨNG DỤNG FAEQUEST
          </span>
          <h3 className="font-rpg font-extrabold text-lg sm:text-xl text-white tracking-wide mt-0.5">
            Mang Đấu Trường đi mọi nơi
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showTopRightArrow && (
            <span className="u393-ar hidden sm:inline-flex">
              <span>Mở tại đây</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng bảng cài đặt ứng dụng"
              className="w-10 h-10 rounded-full bg-[#06141B] hover:bg-[#162633] border border-white/15 text-[#CCD0CF] hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mũi tên nhún cho Mobile khi ở PC/Android */}
      {showTopRightArrow && (
        <div className="flex justify-end mb-2 sm:hidden">
          <span className="u393-ar">
            <span>Mở menu ⋮ góc trên</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )}

      {/* Thanh chọn 3 nền tảng có viên thuốc trượt đàn hồi */}
      <div
        role="tablist"
        aria-label="Chọn nền tảng cài đặt ứng dụng"
        onKeyDown={handleTabKeyDown}
        className="u393-tl mb-4"
      >
        <div
          aria-hidden="true"
          className="u393-pl"
          style={{ transform: `translateX(${currentPlatformIndex * 100}%)` }}
        />

        {PLATFORMS.map((platform, idx) => {
          const isSelected = activePlatform === platform.id;
          return (
            <button
              key={platform.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => handleSelectPlatform(platform.id)}
              className="u393-tab"
            >
              {renderTabIcon(platform.id)}
              <span>{platform.label}</span>
            </button>
          );
        })}
      </div>

      {/* Nút hành động chính Slot-Swap */}
      <button
        type="button"
        onClick={handleInstallClick}
        className={`u393-btn ${installSuccess || isStandaloneNow ? 'is-ok' : ''}`}
      >
        <div className="u393-sw">
          {prevBtnLabel && (
            <span key={`prev-btn-${swapTick}`} className="u393-slot-prev">
              <span>{prevBtnLabel}</span>
            </span>
          )}
          <span key={`curr-btn-${swapTick}`} className="u393-slot-curr">
            {installSuccess || isStandaloneNow ? (
              <svg
                viewBox="0 0 20 20"
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4.5 10.5l3.5 3.5L15.5 6.5" />
              </svg>
            ) : (
              <Download className="w-4 h-4 shrink-0" />
            )}
            <span>{resolvedButtonText}</span>
          </span>
        </div>
      </button>

      {/* Dòng thông số trượt dọc Slot-Swap */}
      <div className="u393-mt mt-2.5 mb-4 text-center text-[11.5px] font-semibold text-[#9BA8AB]">
        {prevMetaText && (
          <span key={`prev-meta-${swapTick}`} className="u393-slot-prev">
            {prevMetaText}
          </span>
        )}
        <span key={`curr-meta-${swapTick}`} className="u393-slot-curr">
          {resolvedMetaText}
        </span>
      </div>

      {/* Ghi chú trình duyệt nhúng nếu mở từ Facebook/Zalo/TikTok */}
      {inAppHint && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-amber-500/12 border border-amber-400/35 text-[11px] font-semibold text-amber-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
          <span>Nên mở bằng Safari / Chrome để cài mượt nhất</span>
        </div>
      )}

      {/* Trạng thái đã cài độc lập OR 3 bước hướng dẫn sáng lệch nhịp */}
      {isStandaloneNow ? (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/35 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <Check className="w-4 h-4 stroke-[2.8]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-emerald-300">
              Đã kích hoạt chế độ Ứng Dụng Độc Lập
            </p>
            <p className="text-[11px] text-[#9BA8AB] mt-0.5">
              Bạn đang trải nghiệm FaeQuest mượt mà trực tiếp từ màn hình chính.
            </p>
          </div>
        </div>
      ) : (
        <div className="u393-steps">
          {currentConfig.steps.map((st, idx) => (
            <div key={`${activePlatform}-${idx}`} className={`u393-st ${litSteps[idx] ? 'is-on' : ''}`}>
              <span className="u393-sp">{idx + 1}</span>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-[#F4F0E8] leading-snug">{st.title}</h4>
                <p className="text-[11px] text-[#9BA8AB] leading-relaxed mt-0.5">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mũi tên nhún chỉ xuống cạnh dưới chính giữa khi ở tab iOS */}
      {showIosBottomArrow && (
        <div className="mt-4 flex justify-center">
          <span className="u393-ar is-down">
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Chạm nút Chia sẻ bên dưới</span>
          </span>
        </div>
      )}
    </div>
  );
};
