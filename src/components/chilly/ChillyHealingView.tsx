import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChillySharpness, ChillyFrameMode } from '../../types';
import { DefaultPixelArtView } from './pixelScenes/DefaultPixelArtView';
import { ChillyMusicPlayer } from './ChillyMusicPlayer';
import { useChillyAudioStore } from '../../store/useChillyAudioStore';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import {
  saveCustomPixelArtBlob,
  getCustomPixelArtBlob,
  removeCustomPixelArtBlob,
  saveChillySetting,
  getChillySetting,
} from '../../utils/chillyStorage';
import {
  HeartPulse,
  Maximize2,
  Minimize2,
  Upload,
  EyeOff,
  Music,
  RotateCcw,
  RotateCw,
  Sparkles,
  Layers,
  Play,
  Pause,
  ChevronUp,
} from 'lucide-react';

export const ChillyHealingView: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUiVisibleInFullscreen, setIsUiVisibleInFullscreen] = useState(true);
  const [isPlayerVisibleInFullscreen, setIsPlayerVisibleInFullscreen] = useState(true);
  const [isPlayerPillCollapsed, setIsPlayerPillCollapsed] = useState(false);
  const [customArtUrl, setCustomArtUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Bộ lọc làm nét ảnh & Khung hình
  const [sharpness, setSharpness] = useState<ChillySharpness>('none');
  const [frameMode, setFrameMode] = useState<ChillyFrameMode>('cover');

  // Trạng thái thiết bị & xoay ngang Hybrid Landscape
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isCoarsePointer:
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(pointer: coarse)').matches
        : false,
  }));
  const [preferLandscape, setPreferLandscape] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const zenTimerRef = useRef<any>(null);

  // Store nhạc để render viên thuốc phát nhạc mini khi thu gọn ở màn ngang nhỏ
  const {
    playlist,
    currentTrackIndex,
    isPlaying,
    togglePlay,
    isDrawerOpen,
    setIsChillyFullscreen,
  } = useChillyAudioStore();
  const currentTrack = playlist[currentTrackIndex] || playlist[0];

  useEffect(() => {
    setIsChillyFullscreen(isFullscreen);
    return () => setIsChillyFullscreen(false);
  }, [isFullscreen, setIsChillyFullscreen]);

  // Kéo danh sách nhạc mới nhất từ đám mây mỗi khi mở Chilly Healing
  useEffect(() => {
    useFaeQuestStore.getState().pullChillyTracksFromCloud();
  }, []);

  const isMobileDevice = viewport.isCoarsePointer || viewport.width <= 1024;
  const isPortraitScreen = viewport.height > viewport.width;
  const isRotatedLandscape = isFullscreen && isMobileDevice && preferLandscape && isPortraitScreen;
  const effectiveHeight = isRotatedLandscape ? viewport.width : viewport.height;
  const isSmallLandscape = isFullscreen && effectiveHeight < 460;

  // 1. Lắng nghe resize & orientationchange để tự tắt CSS rotation khi xoay máy ngang thật
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        isCoarsePointer: window.matchMedia
          ? window.matchMedia('(pointer: coarse)').matches
          : false,
      });
    };
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  // 2. Khóa cuộn nền (Body Scroll Lock) khi đang ở Fullscreen
  useEffect(() => {
    if (!isFullscreen || typeof document === 'undefined') return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
    };
  }, [isFullscreen]);

  // 3. Tải ảnh tùy chỉnh và cài đặt hiển thị từ IndexedDB khi mở trang
  useEffect(() => {
    async function loadInitial() {
      const savedArt = await getCustomPixelArtBlob();
      if (savedArt?.url) {
        setCustomArtUrl(savedArt.url);
      }
      const savedSharpness = await getChillySetting<ChillySharpness>('last_sharpness', 'none');
      const savedFrameMode = await getChillySetting<ChillyFrameMode>('last_frame_mode', 'cover');
      setSharpness(savedSharpness);
      setFrameMode(savedFrameMode);
    }
    loadInitial();
  }, []);

  // 4. Tải file ảnh/GIF/video mới từ máy
  const handleArtFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const newUrl = await saveCustomPixelArtBlob(file);
      setCustomArtUrl(newUrl);
    } catch (err) {
      console.error('Lỗi tải ảnh cá nhân:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Khôi phục ảnh mặc định hệ thống
  const handleResetToDefaultArt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await removeCustomPixelArtBlob();
    setCustomArtUrl(null);
  };

  // 5. Tự động ẩn thanh công cụ sau 4 giây không tương tác trong Fullscreen
  const resetZenTimer = useCallback(() => {
    if (!isFullscreen) return;
    setIsUiVisibleInFullscreen(true);
    if (zenTimerRef.current) clearTimeout(zenTimerRef.current);
    zenTimerRef.current = setTimeout(() => {
      // Không tự ẩn thanh điều khiển nếu người dùng đang mở ngăn kéo tìm nhạc
      if (!useChillyAudioStore.getState().isDrawerOpen) {
        setIsUiVisibleInFullscreen(false);
      }
    }, 4000);
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      resetZenTimer();
    } else if (zenTimerRef.current) {
      clearTimeout(zenTimerRef.current);
    }
    return () => {
      if (zenTimerRef.current) clearTimeout(zenTimerRef.current);
    };
  }, [isFullscreen, isDrawerOpen, resetZenTimer]);

  // 6. Bật / Tắt Chế độ Fullscreen (Hybrid Landscape Android + iOS)
  const handleEnterFullscreen = useCallback(() => {
    setIsFullscreen(true);
    setIsUiVisibleInFullscreen(true);
    setIsPlayerPillCollapsed(false);
    if (isMobileDevice) {
      setPreferLandscape(true);
    }
    // Khi phóng to toàn màn hình, mặc định bật Nét nhẹ nếu đang ở mức 'none'
    if (sharpness === 'none') {
      setSharpness('soft');
    }

    const lockLandscape = () => {
      if (isMobileDevice && typeof screen !== 'undefined') {
        try {
          (screen.orientation as any)?.lock?.('landscape')?.catch?.(() => {});
        } catch {}
      }
    };

    if (document.documentElement.requestFullscreen) {
      document.documentElement
        .requestFullscreen()
        .then(lockLandscape)
        .catch(lockLandscape);
    } else {
      lockLandscape();
    }
  }, [isMobileDevice, sharpness]);

  const handleExitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setIsPlayerPillCollapsed(false);
    if (typeof screen !== 'undefined') {
      try {
        (screen.orientation as any)?.unlock?.();
      } catch {}
    }
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Toggle Xoay Ngang / Dọc thủ công trên thiết bị di động
  const handleToggleOrientation = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetZenTimer();
    const nextPreferLandscape = !preferLandscape;
    setPreferLandscape(nextPreferLandscape);
    if (typeof screen !== 'undefined') {
      try {
        if (nextPreferLandscape) {
          (screen.orientation as any)?.lock?.('landscape')?.catch?.(() => {});
        } else {
          (screen.orientation as any)?.unlock?.();
        }
      } catch {}
    }
  };

  // Lắng nghe phím ESC hoặc phím F để đóng / mở Fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        handleExitFullscreen();
      }
      if (
        (e.key === 'f' || e.key === 'F') &&
        !['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())
      ) {
        if (isFullscreen) {
          handleExitFullscreen();
        } else {
          handleEnterFullscreen();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, handleEnterFullscreen, handleExitFullscreen]);

  // Xoay vòng bộ lọc làm nét ảnh: Gốc -> Nét nhẹ -> Siêu nét HD -> Gốc
  const handleCycleSharpness = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetZenTimer();
    const cycleMap: Record<ChillySharpness, ChillySharpness> = {
      none: 'soft',
      soft: 'hd',
      hd: 'none',
    };
    const next = cycleMap[sharpness];
    setSharpness(next);
    saveChillySetting('last_sharpness', next);
  };

  // Xoay vòng khung hình: Tràn viền -> Nét gốc -> Pixel -> Tràn viền
  const handleCycleFrameMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetZenTimer();
    const cycleMap: Record<ChillyFrameMode, ChillyFrameMode> = {
      cover: 'contain',
      contain: 'pixel',
      pixel: 'cover',
    };
    const next = cycleMap[frameMode];
    setFrameMode(next);
    saveChillySetting('last_frame_mode', next);
  };

  const getSharpnessLabel = () => {
    switch (sharpness) {
      case 'soft':
        return 'Nét nhẹ';
      case 'hd':
        return 'Siêu nét HD';
      default:
        return 'Gốc';
    }
  };

  const getFrameModeLabel = () => {
    switch (frameMode) {
      case 'contain':
        return 'Nét gốc';
      case 'pixel':
        return 'Pixel';
      default:
        return 'Tràn viền';
    }
  };

  // Đệm vùng an toàn (Tai thỏ / Dynamic Island / Home Bar) theo đúng chiều xoay hiện tại
  const safeAreaOverlayStyle: React.CSSProperties = isRotatedLandscape
    ? {
        paddingTop: 'max(12px, env(safe-area-inset-left))',
        paddingRight: 'max(16px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-right))',
        paddingLeft: 'max(16px, env(safe-area-inset-bottom))',
      }
    : {
        paddingTop: 'max(14px, env(safe-area-inset-top))',
        paddingRight: 'max(16px, env(safe-area-inset-right))',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(16px, env(safe-area-inset-left))',
      };

  return (
    <div className="space-y-6">
      {/* Ẩn file input upload ảnh */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/gif,image/webp,image/png,image/jpeg,image/*"
        className="hidden"
        onChange={handleArtFileChange}
      />

      {/* ================= HEADER TRANG CHILLY HEALING ================= */}
      <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-[#11212D] border border-[#253745] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#06141B] border border-[#4A5C6A] text-xs font-bold text-[#CCD0CF]">
              <HeartPulse className="w-3.5 h-3.5 text-[#7EE8C0] animate-pulse drop-shadow-[0_0_6px_rgba(126,232,192,0.8)]" />
              <span>Khoảnh Khắc Hồi Phục Thợ Săn</span>
            </span>
            <span className="text-xs font-extrabold text-[#7EE8C0] px-2 py-0.5 rounded-full bg-[#7EE8C0]/10 border border-[#7EE8C0]/30 hidden sm:inline-block">
              Thư Giãn
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#CCD0CF] font-rpg tracking-wide flex items-center gap-2">
            <span>Chilly Healing</span>
          </h2>
          <p className="text-xs text-[#9BA8AB] max-w-xl leading-relaxed">
            Nơi bạn tạm gác lại chuỗi nhiệm vụ cam go, sống chậm ngắm những bức tranh nghệ thuật thư thái và hòa mình vào giai điệu yêu thích.
          </p>
        </div>

        {/* Nút Đổi Ảnh trong Header (tối thiểu 44px chạm trên Mobile) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-xs font-bold text-[#CCD0CF] flex items-center gap-1.5 transition cursor-pointer"
            title="Tải ảnh hoặc GIF của bạn từ thiết bị"
          >
            <Upload className="w-4 h-4 text-[#7EE8C0]" />
            <span>{customArtUrl ? 'Đổi Ảnh Của Tôi' : 'Tải Ảnh Của Tôi'}</span>
          </button>

          {customArtUrl && (
            <button
              type="button"
              onClick={handleResetToDefaultArt}
              className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-[#06141B] hover:bg-rose-950/60 border border-[#253745] text-[#9BA8AB] hover:text-rose-300 text-xs font-bold transition flex items-center justify-center cursor-pointer"
              title="Khôi phục lại tranh Hiệp Sĩ mặc định"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= BỐ CỤC CHÍNH (TIÊU CHUẨN MOBILE-FIRST) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Khung Tranh Nghệ Thuật Tiêu Chuẩn (aspect-[16/10] gọn gàng trên cả Mobile & Desktop) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative w-full aspect-[16/10] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#06141B] group">
            {/* Nội dung ảnh */}
            <div className="w-full h-full">
              <DefaultPixelArtView
                customArtUrl={customArtUrl}
                isFullscreen={false}
                sharpness={sharpness}
                frameMode={frameMode}
              />
            </div>

            {/* Nút Đổi Ảnh & Khôi phục góc dưới trái (vùng chạm >= 44x44px, tự mờ khi không hover trên Desktop) */}
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 opacity-90 md:opacity-75 group-hover:opacity-100 transition-opacity duration-300">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#06141B]/80 hover:bg-[#06141B] backdrop-blur-md border border-white/15 text-xs font-bold text-[#CCD0CF] hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                title="Đổi ảnh hoặc GIF từ thiết bị"
              >
                <Upload className="w-3.5 h-3.5 text-[#7EE8C0]" />
                <span>Đổi Ảnh</span>
              </button>

              {customArtUrl && (
                <button
                  type="button"
                  onClick={handleResetToDefaultArt}
                  className="min-w-[44px] min-h-[44px] px-3 py-2 rounded-xl bg-[#06141B]/80 hover:bg-rose-950/80 backdrop-blur-md border border-white/15 text-xs font-bold text-[#9BA8AB] hover:text-rose-300 transition flex items-center justify-center gap-1 cursor-pointer shadow-lg"
                  title="Khôi phục ảnh Hiệp Sĩ mặc định"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ảnh gốc</span>
                </button>
              )}
            </div>

            {/* Nút Fullscreen nổi rõ góc trên phải dễ bấm ngón cái (>= 44x44px) */}
            <button
              type="button"
              onClick={handleEnterFullscreen}
              className="absolute top-3 right-3 z-20 min-w-[44px] min-h-[44px] p-2.5 rounded-2xl bg-[#06141B]/80 hover:bg-[#06141B] backdrop-blur-md border border-white/20 hover:border-[#7EE8C0]/80 text-[#CCD0CF] hover:text-[#7EE8C0] shadow-xl opacity-90 md:opacity-70 group-hover:opacity-100 transition duration-300 flex items-center justify-center cursor-pointer"
              title="Phóng to Toàn Màn Hình (Nhấn F hoặc icon)"
            >
              <Maximize2 className="w-5 h-5 hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Trình Phát Nhạc Lucian #474 Căn Giữa Bên Dưới Trên Mobile / Cột Phải Trên Desktop */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center w-full">
          <div className="w-full flex flex-col items-center">
            <ChillyMusicPlayer />
          </div>
        </div>
      </div>

      {/* ================= CHẾ ĐỘ FULL MÀN HÌNH (PORTAL TO BODY + HYBRID LANDSCAPE) ================= */}
      {isFullscreen &&
        createPortal(
          <div
            onMouseMove={resetZenTimer}
            onTouchStart={resetZenTimer}
            onClick={() => {
              const nextVis = !isUiVisibleInFullscreen;
              setIsUiVisibleInFullscreen(nextVis);
              if (nextVis) {
                if (zenTimerRef.current) clearTimeout(zenTimerRef.current);
                zenTimerRef.current = setTimeout(() => {
                  if (!useChillyAudioStore.getState().isDrawerOpen) {
                    setIsUiVisibleInFullscreen(false);
                  }
                }, 4000);
              }
            }}
            className={`z-[9999] bg-[#06141B] overflow-hidden flex items-center justify-center select-none overscroll-none touch-none transition-transform duration-300 ${
              isRotatedLandscape
                ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 w-[100dvh] h-[100dvw]'
                : 'fixed inset-0 rotate-0 w-screen h-[100dvh]'
            }`}
          >
            {/* Lớp nền Tranh Nghệ Thuật Toàn Màn Hình */}
            <div className="absolute inset-0 w-full h-full z-0">
              <DefaultPixelArtView
                customArtUrl={customArtUrl}
                isFullscreen={true}
                sharpness={sharpness}
                frameMode={frameMode}
              />
            </div>

            {/* Khung Overlay Safe-Area chứa Thanh Công Cụ Trên & Thẻ Nhạc Dưới */}
            <div
              style={safeAreaOverlayStyle}
              className="absolute inset-0 z-30 flex flex-col justify-between pointer-events-none"
            >
              {/* Thanh Điều Khiển Nổi Phía Trên (Top Floating Header) */}
              <div
                onClick={(e) => e.stopPropagation()}
                className={`flex items-center justify-between gap-2 pointer-events-auto transition-all duration-300 ${
                  isUiVisibleInFullscreen
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 -translate-y-4 pointer-events-none'
                }`}
              >
                {/* Badge Tiêu Đề */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#06141B]/80 backdrop-blur-md border border-white/20 text-xs font-bold text-[#CCD0CF] shadow-2xl shrink-0">
                  <HeartPulse className="w-4 h-4 text-[#7EE8C0] animate-pulse" />
                  <span className="font-rpg tracking-wide hidden sm:inline">CHILLY HEALING</span>
                  <span className="font-rpg tracking-wide sm:hidden">CHILLY</span>
                </div>

                {/* Dải Nút Điều Khiển Chất Lượng Ảnh, Xoay Ngang/Dọc & Thoát Fullscreen */}
                <div className="flex items-center flex-wrap justify-end gap-1 sm:gap-1.5 bg-[#06141B]/85 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-2xl">
                  {/* Nút xoay vòng Làm Nét: Gốc -> Nét nhẹ -> Siêu nét HD */}
                  <button
                    type="button"
                    onClick={handleCycleSharpness}
                    className="min-h-[38px] sm:min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-[#CCD0CF] hover:text-[#7EE8C0] border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
                    title="Đổi bộ lọc Làm Nét Ảnh: Gốc -> Nét nhẹ -> Siêu nét HD"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span className="text-[11px] font-semibold whitespace-nowrap">
                      {getSharpnessLabel()}
                    </span>
                  </button>

                  {/* Nút xoay vòng Khung hình: Tràn viền -> Nét gốc -> Pixel */}
                  <button
                    type="button"
                    onClick={handleCycleFrameMode}
                    className="min-h-[38px] sm:min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-[#CCD0CF] hover:text-[#7EE8C0] border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
                    title="Đổi tỷ lệ Khung Hình: Tràn viền -> Nét gốc (chống vỡ ảnh) -> Pixel"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                    <span className="text-[11px] font-semibold whitespace-nowrap">
                      {getFrameModeLabel()}
                    </span>
                  </button>

                  {/* Nút Xoay Ngang / Dọc (Chỉ hiện trên Thiết bị Di động) */}
                  {isMobileDevice && (
                    <button
                      type="button"
                      onClick={handleToggleOrientation}
                      className={`min-w-[38px] min-h-[38px] p-2 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                        preferLandscape
                          ? 'text-[#7EE8C0] bg-white/10'
                          : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
                      }`}
                      title={preferLandscape ? 'Chuyển về màn hình dọc' : 'Xoay sang màn hình ngang'}
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  )}

                  <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

                  {/* Nút Ẩn/Hiện Player */}
                  <button
                    type="button"
                    onClick={() => {
                      resetZenTimer();
                      setIsPlayerVisibleInFullscreen(!isPlayerVisibleInFullscreen);
                    }}
                    className={`min-w-[38px] min-h-[38px] p-2 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                      isPlayerVisibleInFullscreen
                        ? 'text-[#7EE8C0] bg-white/10'
                        : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
                    }`}
                    title={isPlayerVisibleInFullscreen ? 'Ẩn Trình Phát Nhạc' : 'Hiện Trình Phát Nhạc'}
                  >
                    <Music className="w-4 h-4" />
                  </button>

                  {/* Nút Zen Mode (Ẩn Toàn Bộ UI) */}
                  <button
                    type="button"
                    onClick={() => setIsUiVisibleInFullscreen(false)}
                    className="min-w-[38px] min-h-[38px] p-2 rounded-xl text-xs font-bold text-[#9BA8AB] hover:text-[#CCD0CF] transition flex items-center justify-center cursor-pointer"
                    title="Chế độ ngắm cảnh tĩnh lặng (Ẩn UI)"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>

                  {/* Nút Thoát Fullscreen */}
                  <button
                    type="button"
                    onClick={handleExitFullscreen}
                    className="min-w-[38px] min-h-[38px] p-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-rose-900/60 text-[#CCD0CF] hover:text-white transition flex items-center justify-center cursor-pointer"
                    title="Thoát Toàn Màn Hình (Esc)"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Trình Phát Nhạc Nổi Phía Dưới (Thông minh trên Màn Ngang Nhỏ < 460px) */}
              <div
                onClick={(e) => e.stopPropagation()}
                className={`flex pointer-events-auto transition-all duration-300 ${
                  isSmallLandscape ? 'justify-start items-end' : 'justify-center items-end'
                } ${
                  isUiVisibleInFullscreen && isPlayerVisibleInFullscreen
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8 pointer-events-none'
                }`}
              >
                {isSmallLandscape && isPlayerPillCollapsed ? (
                  /* Nút viên thuốc phát nhạc mini gọn gàng ở góc dưới trái để không che tranh */
                  <div className="inline-flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-full bg-[#0B1720]/85 backdrop-blur-xl border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.75)] max-w-[290px]">
                    <button
                      type="button"
                      onClick={() => {
                        resetZenTimer();
                        togglePlay();
                      }}
                      className="w-9 h-9 min-w-[36px] rounded-full bg-[#7EE8C0]/15 hover:bg-[#7EE8C0]/25 text-[#7EE8C0] flex items-center justify-center transition cursor-pointer shrink-0"
                      aria-label={isPlaying ? 'Tạm dừng' : 'Phát nhạc'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>

                    <div
                      onClick={() => {
                        resetZenTimer();
                        setIsPlayerPillCollapsed(false);
                      }}
                      className="min-w-0 flex-1 cursor-pointer px-1"
                    >
                      <div className="text-xs font-bold text-[#CCD0CF] truncate">
                        {currentTrack?.title || 'Chilly Music'}
                      </div>
                      <div className="text-[10px] text-[#7EE8C0] truncate">
                        {isPlaying ? 'Đang phát • Chạm để mở rộng' : 'Đang dừng • Chạm để mở'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        resetZenTimer();
                        setIsPlayerPillCollapsed(false);
                      }}
                      className="w-9 h-9 rounded-full hover:bg-white/10 text-[#9BA8AB] hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
                      title="Mở rộng thẻ phát nhạc"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.85)] rounded-[26px] transition-transform duration-300 ${
                      isSmallLandscape ? 'scale-[0.82] origin-bottom-left' : ''
                    }`}
                  >
                    <ChillyMusicPlayer
                      isCompact
                      isRotatedLandscape={isRotatedLandscape}
                      onCollapseToPill={
                        isSmallLandscape ? () => setIsPlayerPillCollapsed(true) : undefined
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Gợi ý chạm để hiện lại UI khi đang ở Zen Mode */}
            {!isUiVisibleInFullscreen && (
              <div
                style={{
                  paddingBottom: isRotatedLandscape
                    ? 'max(14px, env(safe-area-inset-right))'
                    : 'max(14px, env(safe-area-inset-bottom))',
                }}
                className="absolute bottom-0 inset-x-0 flex justify-center z-20 pointer-events-none"
              >
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white/55 animate-pulse">
                  Chạm bất kỳ đâu để hiện lại thanh điều khiển • Nhấn Esc để thoát
                </span>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
