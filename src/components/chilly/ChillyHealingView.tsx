import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChillySharpness, ChillyFrameMode } from '../../types';
import { DefaultPixelArtView } from './pixelScenes/DefaultPixelArtView';
import { ChillyMusicPlayer } from './ChillyMusicPlayer';
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
  Sparkles,
  Layers,
} from 'lucide-react';

export const ChillyHealingView: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUiVisibleInFullscreen, setIsUiVisibleInFullscreen] = useState(true);
  const [isPlayerVisibleInFullscreen, setIsPlayerVisibleInFullscreen] = useState(true);
  const [customArtUrl, setCustomArtUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Bộ lọc làm nét ảnh & Khung hình
  const [sharpness, setSharpness] = useState<ChillySharpness>('none');
  const [frameMode, setFrameMode] = useState<ChillyFrameMode>('cover');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const zenTimerRef = useRef<any>(null);

  // 1. Tải ảnh tùy chỉnh và cài đặt hiển thị từ IndexedDB khi mở trang
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

  // 2. Tải file ảnh/GIF/video mới từ máy
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

  // 3. Bật / Tắt Chế độ Fullscreen
  const handleEnterFullscreen = () => {
    setIsFullscreen(true);
    setIsUiVisibleInFullscreen(true);
    // Khi phóng to toàn màn hình, mặc định bật Nét nhẹ nếu đang ở mức 'none'
    if (sharpness === 'none') {
      setSharpness('soft');
    }
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
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
  }, [isFullscreen, sharpness]);

  // Tự động kích hoạt Zen Mode (ẩn UI) sau 3.5s không rê chuột trong Fullscreen
  const resetZenTimer = () => {
    if (!isFullscreen) return;
    setIsUiVisibleInFullscreen(true);
    if (zenTimerRef.current) clearTimeout(zenTimerRef.current);
    zenTimerRef.current = setTimeout(() => {
      setIsUiVisibleInFullscreen(false);
    }, 3800);
  };

  // Xoay vòng bộ lọc làm nét ảnh: Gốc -> Nét nhẹ -> Siêu nét HD -> Gốc
  const handleCycleSharpness = (e: React.MouseEvent) => {
    e.stopPropagation();
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
              Relax & Lo-Fi
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#CCD0CF] font-rpg tracking-wide flex items-center gap-2">
            <span>Chilly Healing</span>
          </h2>
          <p className="text-xs text-[#9BA8AB] max-w-xl leading-relaxed">
            Nơi bạn tạm gác lại chuỗi nhiệm vụ cam go, sống chậm ngắm những bức tranh nghệ thuật thư thái và hòa mình vào giai điệu yêu thích.
          </p>
        </div>

        {/* Nút Đổi Ảnh trong Header */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-xs font-bold text-[#CCD0CF] flex items-center gap-1.5 transition cursor-pointer"
            title="Tải ảnh hoặc GIF của bạn từ thiết bị"
          >
            <Upload className="w-3.5 h-3.5 text-[#7EE8C0]" />
            <span>{customArtUrl ? 'Đổi Ảnh Của Tôi' : 'Tải Ảnh Của Tôi'}</span>
          </button>

          {customArtUrl && (
            <button
              type="button"
              onClick={handleResetToDefaultArt}
              className="p-2 rounded-xl bg-[#06141B] hover:bg-rose-950/60 border border-[#253745] text-[#9BA8AB] hover:text-rose-300 text-xs font-bold transition cursor-pointer"
              title="Khôi phục lại tranh Hiệp Sĩ mặc định"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= BỐ CỤC CHÍNH (TIÊU CHUẨN) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Khung Tranh Nghệ Thuật Tiêu Chuẩn (Cột Trái / 7 phần trên Desktop) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#06141B] group">
            {/* Nội dung ảnh */}
            <div className="w-full h-full">
              <DefaultPixelArtView
                customArtUrl={customArtUrl}
                isFullscreen={false}
                sharpness={sharpness}
                frameMode={frameMode}
              />
            </div>

            {/* Nút Đổi Ảnh & Khôi phục ở góc dưới ảnh (tự mờ đi khi không rê chuột) */}
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-xl bg-[#06141B]/80 hover:bg-[#06141B] backdrop-blur-md border border-white/15 text-[11px] font-bold text-[#CCD0CF] hover:text-white transition flex items-center gap-1 cursor-pointer shadow-lg"
                title="Đổi ảnh hoặc GIF từ thiết bị"
              >
                <Upload className="w-3 h-3 text-[#7EE8C0]" />
                <span>Đổi Ảnh</span>
              </button>

              {customArtUrl && (
                <button
                  type="button"
                  onClick={handleResetToDefaultArt}
                  className="px-2 py-1.5 rounded-xl bg-[#06141B]/80 hover:bg-rose-950/80 backdrop-blur-md border border-white/15 text-[11px] font-bold text-[#9BA8AB] hover:text-rose-300 transition flex items-center gap-1 cursor-pointer shadow-lg"
                  title="Khôi phục ảnh Hiệp Sĩ mặc định"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Ảnh gốc</span>
                </button>
              )}
            </div>

            {/* Nút Fullscreen góc trên bên phải (tự mờ đi khi không rê chuột) */}
            <button
              type="button"
              onClick={handleEnterFullscreen}
              className="absolute top-3.5 right-3.5 z-20 p-2.5 rounded-2xl bg-[#06141B]/70 hover:bg-[#06141B] backdrop-blur-md border border-white/15 hover:border-[#7EE8C0]/80 text-[#CCD0CF] hover:text-[#7EE8C0] shadow-xl opacity-70 group-hover:opacity-100 transition duration-300 cursor-pointer"
              title="Phóng to Toàn Màn Hình (Nhấn F hoặc icon)"
            >
              <Maximize2 className="w-4 h-4 hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Trình Phát Nhạc Lucian #474 Kết Nối Global Audio Engine (Cột Phải / 5 phần trên Desktop) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center w-full">
          <div className="w-full flex flex-col items-center">
            <ChillyMusicPlayer />
          </div>
        </div>
      </div>

      {/* ================= CHẾ ĐỘ FULL MÀN HÌNH (PORTAL TO BODY) ================= */}
      {isFullscreen &&
        createPortal(
          <div
            onMouseMove={resetZenTimer}
            onTouchStart={resetZenTimer}
            onClick={() => setIsUiVisibleInFullscreen(!isUiVisibleInFullscreen)}
            className="fixed inset-0 z-[9999] w-screen h-[100dvh] bg-[#06141B] overflow-hidden flex items-center justify-center select-none"
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

            {/* Thanh Điều Khiển Nổi Phía Trên (Top Floating Header) */}
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute top-4 inset-x-4 sm:top-6 sm:inset-x-8 z-30 flex items-center justify-between gap-3 pointer-events-auto transition-all duration-300 ${
                isUiVisibleInFullscreen
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-4 pointer-events-none'
              }`}
            >
              {/* Badge Tiêu Đề */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#06141B]/80 backdrop-blur-md border border-white/20 text-xs font-bold text-[#CCD0CF] shadow-2xl">
                <HeartPulse className="w-4 h-4 text-[#7EE8C0] animate-pulse" />
                <span className="font-rpg tracking-wide">CHILLY HEALING</span>
              </div>

              {/* Dải Nút Điều Khiển Chất Lượng Ảnh & Thoát Fullscreen */}
              <div className="flex items-center gap-2 bg-[#06141B]/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-2xl">
                {/* Nút xoay vòng Làm Nét: Gốc -> Nét nhẹ -> Siêu nét HD */}
                <button
                  type="button"
                  onClick={handleCycleSharpness}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-[#CCD0CF] hover:text-[#7EE8C0] border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
                  title="Đổi bộ lọc Làm Nét Ảnh: Gốc -> Nét nhẹ -> Siêu nét HD"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-[11px] font-semibold">{getSharpnessLabel()}</span>
                </button>

                {/* Nút xoay vòng Khung hình: Tràn viền -> Nét gốc -> Pixel */}
                <button
                  type="button"
                  onClick={handleCycleFrameMode}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-[#CCD0CF] hover:text-[#7EE8C0] border border-white/10 transition flex items-center gap-1.5 cursor-pointer"
                  title="Đổi tỷ lệ Khung Hình: Tràn viền -> Nét gốc (chống vỡ ảnh) -> Pixel"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-300" />
                  <span className="text-[11px] font-semibold">{getFrameModeLabel()}</span>
                </button>

                <div className="w-[1px] h-4 bg-white/20" />

                {/* Nút Ẩn/Hiện Player */}
                <button
                  type="button"
                  onClick={() => setIsPlayerVisibleInFullscreen(!isPlayerVisibleInFullscreen)}
                  className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
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
                  className="p-2 rounded-xl text-xs font-bold text-[#9BA8AB] hover:text-[#CCD0CF] transition cursor-pointer"
                  title="Chế độ ngắm cảnh tĩnh lặng (Ẩn UI)"
                >
                  <EyeOff className="w-4 h-4" />
                </button>

                {/* Nút Thoát Fullscreen */}
                <button
                  type="button"
                  onClick={handleExitFullscreen}
                  className="p-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-rose-900/60 text-[#CCD0CF] hover:text-white transition cursor-pointer"
                  title="Thoát Toàn Màn Hình (Esc)"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Trình Phát Nhạc Nổi Phía Dưới (Bottom Floating Player) */}
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute bottom-4 inset-x-4 sm:bottom-8 z-30 flex justify-center pointer-events-auto transition-all duration-300 ${
                isUiVisibleInFullscreen && isPlayerVisibleInFullscreen
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8 pointer-events-none'
              }`}
            >
              <div className="w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.85)] rounded-[26px]">
                <ChillyMusicPlayer isCompact />
              </div>
            </div>

            {/* Gợi ý chạm để hiện lại UI khi đang ở Zen Mode */}
            {!isUiVisibleInFullscreen && (
              <div className="absolute bottom-4 inset-x-0 flex justify-center z-20 pointer-events-none">
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white/50 animate-pulse">
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
