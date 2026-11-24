import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelSceneId, PixelScene } from '../../types';
import { DefaultPixelArtView } from './pixelScenes/DefaultPixelArtView';
import { RainySanctuaryCanvas } from './pixelScenes/RainySanctuaryCanvas';
import { MoonlitFirefliesCanvas } from './pixelScenes/MoonlitFirefliesCanvas';
import { AfterglowPixelSeaCanvas } from './pixelScenes/AfterglowPixelSeaCanvas';
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
  Sparkles,
  Eye,
  EyeOff,
  Music,
  RotateCcw,
} from 'lucide-react';

const SCENES: PixelScene[] = [
  {
    id: 'default',
    name: 'Cảnh Của Tôi',
    tagline: 'Ảnh Pixel Art cá nhân hoặc Hiệp Sĩ Bên Lửa Trại',
    type: 'custom_image',
    icon: '🔥',
  },
  {
    id: 'rain',
    name: 'Mưa Đêm Lò Sưởi',
    tagline: 'Mưa xiên góc, sấm xa & lò sưởi ấm',
    type: 'canvas',
    icon: '🌧️',
  },
  {
    id: 'fireflies',
    name: 'Rừng Đom Đóm',
    tagline: 'Trăng khuyết, sao trời & đom đóm xanh ngọc',
    type: 'canvas',
    icon: '✨',
  },
  {
    id: 'sunset',
    name: 'Hoàng Hôn Bờ Biển',
    tagline: 'Mặt trời synthwave & sóng biển lấp lánh #474',
    type: 'canvas',
    icon: '🌅',
  },
];

export const ChillyHealingView: React.FC = () => {
  const [activeSceneId, setActiveSceneId] = useState<PixelSceneId>('default');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUiVisibleInFullscreen, setIsUiVisibleInFullscreen] = useState(true);
  const [isPlayerVisibleInFullscreen, setIsPlayerVisibleInFullscreen] = useState(true);
  const [customArtUrl, setCustomArtUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Tải ảnh tùy chỉnh và cảnh đã lưu từ IndexedDB khi mở trang
  useEffect(() => {
    async function loadInitial() {
      const savedArt = await getCustomPixelArtBlob();
      if (savedArt?.url) {
        setCustomArtUrl(savedArt.url);
      }
      const savedScene = await getChillySetting<PixelSceneId>('last_scene_id', 'default');
      setActiveSceneId(savedScene);
    }
    loadInitial();
  }, []);

  // 2. Chuyển cảnh & lưu setting
  const handleSelectScene = (sceneId: PixelSceneId) => {
    setActiveSceneId(sceneId);
    saveChillySetting('last_scene_id', sceneId);
  };

  // 3. Tải file Pixel Art mới từ máy
  const handleArtFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const newUrl = await saveCustomPixelArtBlob(file);
      setCustomArtUrl(newUrl);
      setActiveSceneId('default');
      saveChillySetting('last_scene_id', 'default');
    } catch (err) {
      console.error('Lỗi tải ảnh pixel art:', err);
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

  // 4. Bật / Tắt Chế độ Fullscreen
  const handleEnterFullscreen = () => {
    setIsFullscreen(true);
    setIsUiVisibleInFullscreen(true);
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
      if ((e.key === 'f' || e.key === 'F') && !['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        if (isFullscreen) {
          handleExitFullscreen();
        } else {
          handleEnterFullscreen();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Render Scene đang chọn
  const renderCurrentScene = (fullscreen: boolean) => {
    switch (activeSceneId) {
      case 'rain':
        return <RainySanctuaryCanvas isFullscreen={fullscreen} />;
      case 'fireflies':
        return <MoonlitFirefliesCanvas isFullscreen={fullscreen} />;
      case 'sunset':
        return <AfterglowPixelSeaCanvas isFullscreen={fullscreen} />;
      case 'default':
      default:
        return <DefaultPixelArtView customArtUrl={customArtUrl} isFullscreen={fullscreen} />;
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
            Nơi bạn tạm gác lại chuỗi nhiệm vụ cam go, sống chậm ngắm những khung cảnh Pixel Art động thư thái và thưởng thức những giai điệu yêu thích.
          </p>
        </div>

        {/* Nút hành động nhanh: Tải ảnh Pixel Art & Phím tắt */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-xs font-bold text-[#CCD0CF] flex items-center gap-1.5 transition cursor-pointer"
            title="Tải ảnh Pixel Art (.gif, .webp, .png) của riêng bạn"
          >
            <Upload className="w-3.5 h-3.5 text-[#7EE8C0]" />
            <span>{customArtUrl ? 'Đổi Ảnh Của Tôi' : 'Tải Ảnh Pixel Của Tôi'}</span>
          </button>
        </div>
      </div>

      {/* ================= BỐ CỤC CHÍNH (TIÊU CHUẨN) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Khung Pixel Art Tiêu Chuẩn (Cột Trái / 7 phần trên Desktop) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#06141B] group">
            {/* Nội dung cảnh động */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSceneId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                {renderCurrentScene(false)}
              </motion.div>
            </AnimatePresence>

            {/* Tag Cảnh hiện tại góc trên bên trái */}
            <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#06141B]/80 backdrop-blur-md border border-white/15 text-[11px] font-extrabold text-[#CCD0CF] shadow-lg">
                <span>{SCENES.find((s) => s.id === activeSceneId)?.icon}</span>
                <span>{SCENES.find((s) => s.id === activeSceneId)?.name}</span>
              </span>
            </div>

            {/* Nút Fullscreen góc trên bên phải */}
            <button
              type="button"
              onClick={handleEnterFullscreen}
              className="absolute top-3.5 right-3.5 z-20 p-2.5 rounded-2xl bg-[#06141B]/80 hover:bg-[#06141B] backdrop-blur-md border border-white/20 hover:border-[#7EE8C0]/80 text-[#CCD0CF] hover:text-[#7EE8C0] shadow-xl transition cursor-pointer group/btn"
              title="Phóng to Toàn Màn Hình (Nhấn F hoặc icon)"
            >
              <Maximize2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            </button>

            {/* Nút Khôi phục ảnh mặc định (nếu đang xem cảnh cá nhân đã đổi) */}
            {activeSceneId === 'default' && customArtUrl && (
              <button
                type="button"
                onClick={handleResetToDefaultArt}
                className="absolute bottom-3.5 right-3.5 z-20 px-2.5 py-1.5 rounded-xl bg-[#06141B]/80 hover:bg-rose-950/80 backdrop-blur-md border border-white/15 text-[10px] font-bold text-[#9BA8AB] hover:text-rose-300 transition flex items-center gap-1"
                title="Khôi phục ảnh Hiệp Sĩ mặc định"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại ảnh gốc</span>
              </button>
            )}
          </div>

          {/* Dải chọn cảnh Pixel Art dạng nút bấm bo tròn */}
          <div className="p-2 rounded-2xl bg-[#11212D] border border-[#253745] flex flex-wrap items-center gap-2 shadow-inner">
            <span className="text-[11px] font-bold text-[#9BA8AB] px-2 hidden sm:inline">Chọn Cảnh:</span>
            {SCENES.map((scene) => {
              const isSelected = activeSceneId === scene.id;
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => handleSelectScene(scene.id)}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#253745] text-[#7EE8C0] border border-[#7EE8C0]/50 shadow-md scale-[1.02]'
                      : 'bg-[#06141B] text-[#9BA8AB] hover:text-[#CCD0CF] border border-[#253745]'
                  }`}
                  title={scene.tagline}
                >
                  <span className="text-sm">{scene.icon}</span>
                  <span className="whitespace-nowrap">{scene.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trình Phát Nhạc Lucian #474 (Cột Phải / 5 phần trên Desktop) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center w-full">
          <div className="w-full flex flex-col items-center gap-3">
            <ChillyMusicPlayer />
            <div className="text-center text-[11px] text-[#9BA8AB]/70 flex items-center gap-1.5 pt-1">
              <Sparkles className="w-3 h-3 text-amber-300/80" />
              <span>Thiết kế theo chuẩn Lucian Prompt #474 • Web Audio & IndexedDB</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= CHẾ ĐỘ FULL MÀN HÌNH (PORTAL TO BODY) ================= */}
      {isFullscreen &&
        createPortal(
          <div
            onClick={() => setIsUiVisibleInFullscreen(!isUiVisibleInFullscreen)}
            className="fixed inset-0 z-[9999] w-screen h-[100dvh] bg-[#06141B] overflow-hidden flex items-center justify-center select-none"
          >
            {/* Lớp nền Cảnh Pixel Art Bung Tràn Toàn Màn Hình */}
            <div className="absolute inset-0 w-full h-full z-0">
              {renderCurrentScene(true)}
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
              {/* Badge Cảnh Hiện Tại */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#06141B]/80 backdrop-blur-md border border-white/20 text-xs font-bold text-[#CCD0CF] shadow-2xl">
                <HeartPulse className="w-4 h-4 text-[#7EE8C0] animate-pulse" />
                <span className="font-rpg tracking-wide">CHILLY HEALING</span>
                <span className="text-white/40">•</span>
                <span className="text-emerald-300">{SCENES.find((s) => s.id === activeSceneId)?.name}</span>
              </div>

              {/* Dải Nút Chuyển Cảnh Nhanh + Ẩn Hiện Player + Thoát Fullscreen */}
              <div className="flex items-center gap-2 bg-[#06141B]/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-2xl">
                {/* 4 Nút Chọn Cảnh Mini */}
                <div className="flex items-center gap-1 mr-1">
                  {SCENES.map((scene) => (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => handleSelectScene(scene.id)}
                      className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        activeSceneId === scene.id
                          ? 'bg-[#253745] text-[#7EE8C0] border border-[#7EE8C0]/50 shadow-sm'
                          : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
                      }`}
                      title={scene.name}
                    >
                      <span>{scene.icon}</span>
                      <span className="hidden md:inline text-[11px]">{scene.name}</span>
                    </button>
                  ))}
                </div>

                <div className="w-[1px] h-4 bg-white/20" />

                {/* Nút Ẩn/Hiện Player */}
                <button
                  type="button"
                  onClick={() => setIsPlayerVisibleInFullscreen(!isPlayerVisibleInFullscreen)}
                  className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isPlayerVisibleInFullscreen ? 'text-[#7EE8C0] bg-white/10' : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
                  }`}
                  title={isPlayerVisibleInFullscreen ? 'Ẩn Trình Phát Nhạc' : 'Hiện Trình Phát Nhạc'}
                >
                  <Music className="w-4 h-4" />
                </button>

                {/* Nút Ẩn/Hiện Toàn Bộ UI (Zen Mode) */}
                <button
                  type="button"
                  onClick={() => setIsUiVisibleInFullscreen(false)}
                  className="p-2 rounded-xl text-xs font-bold text-[#9BA8AB] hover:text-[#CCD0CF] transition cursor-pointer"
                  title="Chế độ ngắm cảnh thuần túy (Ẩn UI)"
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
