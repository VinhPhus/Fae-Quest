import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { dataUrlToFile } from '../../utils/imageExportHelper';
import { X, Share2, Download, Sparkles, Check, Smartphone, Maximize2, Minimize2 } from 'lucide-react';

interface BattleCardPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  playerName: string;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const BattleCardPreviewModal: React.FC<BattleCardPreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  playerName,
  onShowToast,
}) => {
  useBodyScrollLock(isOpen);
  const [isSharing, setIsSharing] = React.useState(false);
  const [downloadSuccess, setDownloadSuccess] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Close fullscreen on modal close or ESC key
  React.useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        e.stopPropagation();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen]);

  // Check if Web Share API with files is supported
  const canShareFiles = React.useMemo(() => {
    if (typeof navigator === 'undefined' || !navigator.share) return false;
    try {
      const testFile = new File([''], 'test.png', { type: 'image/png' });
      return !!navigator.canShare && navigator.canShare({ files: [testFile] });
    } catch {
      return false;
    }
  }, []);

  const handleShare = async () => {
    if (!imageUrl) return;

    try {
      setIsSharing(true);
      const file = dataUrlToFile(imageUrl, `FaeQuest-ChienTich-${playerName}.png`);

      if (canShareFiles) {
        await navigator.share({
          title: 'Thẻ Chiến Tích FaeQuest',
          text: `Chiến tích Thợ Săn của ${playerName} trên FaeQuest RPG Todo!`,
          files: [file],
        });
        onShowToast?.('Chia sẻ Thẻ Chiến Tích thành công!', 'success');
      } else if (navigator.share) {
        // Fallback share without files
        await navigator.share({
          title: 'Thẻ Chiến Tích FaeQuest',
          text: `Chiến tích Thợ Săn của ${playerName} trên FaeQuest RPG Todo! Truy cập faequest.vercel.app`,
          url: 'https://faequest.vercel.app',
        });
        onShowToast?.('Đã mở bảng chia sẻ!', 'info');
      } else {
        // Fallback to auto-download
        handleDownload();
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Web Share failed, downloading instead:', err);
        handleDownload();
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `FaeQuest-ChienTich-${playerName.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      onShowToast?.('Đã tải Thẻ Chiến Tích về máy!', 'success');
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Download card error:', err);
      onShowToast?.('Không thể tải ảnh. Hãy nhấn giữ vào ảnh để lưu!', 'error');
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md transition-all"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative z-10 w-full max-w-md bg-[#11212D] border border-[#253745] rounded-3xl shadow-2xl p-4 sm:p-6 flex flex-col items-center gap-4 my-auto max-h-[96vh]"
          >
            {/* Top Close & Header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-[#253745]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#06141B] border border-[#4A5C6A] flex items-center justify-center text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-rpg font-black text-base sm:text-lg text-[#CCD0CF] leading-tight">
                    Thẻ Chiến Tích Thợ Săn
                  </h3>
                  <span className="text-[11px] text-[#9BA8AB]">Chuẩn 9:16 (1080x1920) Story & TikTok</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    className="w-8 h-8 rounded-full bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] hover:text-amber-400 flex items-center justify-center transition cursor-pointer"
                    title="Xem toàn màn hình"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image Preview Container (Hiển thị trực tiếp thẻ ảnh, bấm vào để mở toàn màn hình) */}
            <div className="flex items-center justify-center w-full my-auto">
              {imageUrl ? (
                <div
                  className="relative group cursor-zoom-in flex items-center justify-center max-w-full"
                  onClick={() => setIsFullscreen(true)}
                  title="Nhấn để phóng to toàn màn hình"
                >
                  <img
                    src={imageUrl}
                    alt="Thẻ Chiến Tích FaeQuest"
                    className="max-h-[50vh] sm:max-h-[56vh] w-auto aspect-[9/16] object-contain rounded-2xl overflow-hidden shadow-2xl border border-white/15 select-none transition-transform duration-200 group-hover:scale-[1.01]"
                  />
                  {/* Overlay nút gợi ý khi hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center pointer-events-none">
                    <div className="px-3.5 py-1.5 rounded-full bg-[#06141B]/95 border border-white/25 text-white text-xs font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md">
                      <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Xem Toàn Màn Hình</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-sm text-[#9BA8AB]">
                  Đang rèn thẻ chiến tích...
                </div>
              )}
            </div>

            {/* Instruction tooltip for iOS & Fullscreen hint */}
            <div className="w-full px-3 py-2 rounded-xl bg-[#06141B]/80 border border-[#253745] flex items-center gap-2 text-center justify-center">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <p className="text-[11px] text-[#9BA8AB] leading-snug">
                Chạm vào ảnh để <strong className="text-amber-300">xem toàn màn hình</strong> hoặc nhấn giữ để Lưu ảnh.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full grid grid-cols-2 gap-3 pt-1">
              {/* Button Chia Sẻ */}
              <button
                type="button"
                onClick={handleShare}
                disabled={isSharing || !imageUrl}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#06141B] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                <Share2 className="w-4 h-4 stroke-[2.5]" />
                <span>{canShareFiles ? 'Chia Sẻ Ngay' : 'Chia Sẻ'}</span>
              </button>

              {/* Button Tải Về */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={!imageUrl}
                className="w-full py-3 px-4 rounded-xl bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] hover:text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                    <span className="text-emerald-400">Đã Tải Xong</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Tải Ảnh Về Máy</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* ================= CHẾ ĐỘ XEM TOÀN MÀN HÌNH (FULL-SCREEN LIGHTBOX) ================= */}
          <AnimatePresence>
            {isFullscreen && imageUrl && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-3 sm:p-5 select-none"
              >
                {/* Top Bar trong chế độ Full-screen */}
                <div className="w-full max-w-4xl flex items-center justify-between pb-2 border-b border-white/10 z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center text-amber-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-rpg font-black text-sm sm:text-base text-white">
                        Thẻ Chiến Tích Thợ Săn • Toàn Màn Hình
                      </h3>
                      <span className="text-[10px] text-[#9BA8AB]">Chuẩn 9:16 (1080x1920) Siêu Nét</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFullscreen(false)}
                      className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[#CCD0CF] hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Thu Nhỏ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFullscreen(false)}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[#CCD0CF] hover:text-white flex items-center justify-center transition cursor-pointer"
                      title="Đóng toàn màn hình"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Vùng hiển thị ảnh lớn cực đại */}
                <div
                  className="flex-1 w-full flex items-center justify-center p-2 overflow-hidden cursor-zoom-out"
                  onClick={() => setIsFullscreen(false)}
                >
                  <motion.img
                    initial={{ scale: 0.93, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.93, y: 10 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 320 }}
                    src={imageUrl}
                    alt="Thẻ Chiến Tích Full Screen"
                    className="max-h-[78vh] sm:max-h-[82vh] w-auto aspect-[9/16] object-contain rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.95)] border border-white/25 select-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Bottom Bar trong Full-screen */}
                <div className="w-full max-w-md grid grid-cols-2 gap-3 pt-2 z-10">
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={isSharing}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#06141B] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 stroke-[2.5]" />
                    <span>{canShareFiles ? 'Chia Sẻ Ngay' : 'Chia Sẻ'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition cursor-pointer"
                  >
                    {downloadSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                        <span className="text-emerald-400">Đã Tải Xong</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 stroke-[2.5]" />
                        <span>Tải Ảnh Về Máy</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
