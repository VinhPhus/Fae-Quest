import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import {
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_UPLOAD_URL,
} from '../../constants/cloudinary';
import { compressImageToDataUrl } from '../../utils/imageCompressor';
import { MODAL_BACKDROP_VARIANTS, MODAL_PANEL_VARIANTS } from '../../constants/motion';
import {
  X,
  Camera,
  Upload,
  Link as LinkIcon,
  Check,
  RotateCcw,
  Sparkles,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

export const DEFAULT_COVER_URL =
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000&auto=format&fit=crop';

export const DARK_FANTASY_COVERS = [
  {
    id: 'castle',
    title: 'Lâu Đài Hắc Ám',
    subtitle: 'Mặc định • Thành lũy cô độc',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000&auto=format&fit=crop',
  },
  {
    id: 'forest',
    title: 'Rừng Gai Huyền Bí',
    subtitle: 'Cấm địa sương mù sâu thẳm',
    url: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?q=80&w=2000&auto=format&fit=crop',
  },
  {
    id: 'peaks',
    title: 'Đỉnh Núi Hư Không',
    subtitle: 'Chóp tuyết vĩnh cửu băng giá',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000&auto=format&fit=crop',
  },
  {
    id: 'nebula',
    title: 'Tàn Tích & Tinh Vân',
    subtitle: 'Ánh trăng tà trên cự thạch',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2000&auto=format&fit=crop',
  },
  {
    id: 'battlefield',
    title: 'Chiến Địa Hoàng Hôn',
    subtitle: 'Khúc bi ca của các dũng sĩ',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2000&auto=format&fit=crop',
  },
  {
    id: 'shrine',
    title: 'Cổng Đền Cổ Xưa',
    subtitle: 'Nơi khởi nguồn khế ước thợ săn',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000&auto=format&fit=crop',
  },
];

export const ChangeCoverModal: React.FC = () => {
  const { isChangeCoverOpen, setChangeCoverOpen, coverUrl, setCoverUrl, addToast } =
    useFaeQuestStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const currentCover = coverUrl || DEFAULT_COVER_URL;

  const handleSelectPreset = (url: string, title: string) => {
    setCoverUrl(url);
    addToast(`Đã chọn ảnh bìa: "${title}"`, 'success');
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customUrl.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      addToast('Vui lòng nhập đường dẫn hình ảnh hợp lệ (bắt đầu bằng http/https)!', 'error');
      return;
    }

    setCoverUrl(trimmed);
    setCustomUrl('');
    addToast('Đã cập nhật ảnh bìa từ liên kết URL thành công!', 'success');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 8 * 1024 * 1024) {
      addToast('Dung lượng ảnh tối đa 8MB. Vui lòng chọn ảnh nhỏ hơn!', 'error');
      return;
    }
    if (!file.type.startsWith('image/')) {
      addToast('Định dạng không hợp lệ. Vui lòng chọn file hình ảnh!', 'error');
      return;
    }

    try {
      setIsUploading(true);
      addToast('Đang tối ưu và tải ảnh bìa lên...', 'info');

      const localDataUrl = await compressImageToDataUrl(file).catch(() => null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (localDataUrl) {
          setCoverUrl(localDataUrl);
          addToast('Đã lưu ảnh bìa trực tiếp trên thiết bị!', 'info');
        } else {
          addToast('Tải ảnh bìa thất bại!', 'error');
        }
        return;
      }

      const data = await response.json();
      if (data.secure_url) {
        setCoverUrl(data.secure_url);
        addToast('Cập nhật ảnh bìa lên đám mây thành công!', 'success');
      } else if (localDataUrl) {
        setCoverUrl(localDataUrl);
        addToast('Đã lưu ảnh bìa vào hệ thống!', 'success');
      }
    } catch {
      try {
        const localDataUrl = await compressImageToDataUrl(file);
        setCoverUrl(localDataUrl);
        addToast('Đã lưu ảnh bìa trực tiếp trên thiết bị!', 'info');
      } catch {
        addToast('Không thể xử lý hình ảnh. Vui lòng thử lại!', 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetDefault = () => {
    setCoverUrl('');
    addToast('Đã khôi phục ảnh bìa mặc định!', 'info');
  };

  return (
    <AnimatePresence>
      {isChangeCoverOpen && (
        <motion.div
          variants={MODAL_BACKDROP_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setChangeCoverOpen(false)}
        >
          <motion.div
            variants={MODAL_PANEL_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-2xl rounded-[28px] bg-gradient-to-b from-[#11212D] via-[#11212D] to-[#06141B] shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-[#253745] overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#253745] flex items-center justify-between bg-[#06141B]/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shadow-md">
              <Camera className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-rpg font-extrabold text-base sm:text-lg text-[#CCD0CF] tracking-wide">
                Tùy Chỉnh Ảnh Bìa Thợ Săn
              </h3>
              <p className="text-xs text-[#9BA8AB]">
                Chọn cảnh quan Dark Fantasy hoặc tải ảnh lên để tạo dấu ấn riêng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setChangeCoverOpen(false)}
            className="w-8 h-8 rounded-full bg-[#06141B] border border-[#253745] hover:border-[#4A5C6A] text-[#9BA8AB] hover:text-[#CCD0CF] flex items-center justify-center transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Live Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#CCD0CF] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                <span>Xem Trước Ảnh Bìa Hiện Tại</span>
              </label>
              {coverUrl && coverUrl !== DEFAULT_COVER_URL && (
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="text-[11px] text-[#9BA8AB] hover:text-amber-300 transition flex items-center gap-1 cursor-pointer font-bold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại mặc định</span>
                </button>
              )}
            </div>

            <div className="relative h-32 sm:h-36 rounded-2xl overflow-hidden border border-[#253745] shadow-inner bg-[#06141B]">
              <img
                src={currentCover}
                alt="Cover Preview"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#06141B]/30 via-[#11212D]/60 to-[#11212D]" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#06141B]/90 border border-[#4A5C6A] text-[10px] font-bold text-[#CCD0CF] shadow">
                  Đang kích hoạt
                </span>
              </div>
            </div>
          </div>

          {/* Upload & Link Input Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Action 1: Upload from Device */}
            <div className="p-3.5 rounded-2xl bg-[#06141B] border border-[#253745] flex flex-col justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-[#CCD0CF] flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Tải Ảnh Từ Thiết Bị</span>
                </h4>
                <p className="text-[11px] text-[#9BA8AB] mt-0.5">
                  Hỗ trợ PNG, JPG, WebP tối đa 8MB
                </p>
              </div>

              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] hover:text-white transition font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#CCD0CF]" />
                    <span>Đang tải lên...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-[#CCD0CF]" />
                    <span>Chọn File Hình Ảnh</span>
                  </>
                )}
              </button>
            </div>

            {/* Action 2: Paste Direct Link URL */}
            <form
              onSubmit={handleApplyCustomUrl}
              className="p-3.5 rounded-2xl bg-[#06141B] border border-[#253745] flex flex-col justify-between gap-3"
            >
              <div>
                <h4 className="text-xs font-bold text-[#CCD0CF] flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-amber-300" />
                  <span>Dán Liên Kết Ảnh Trực Tiếp</span>
                </h4>
                <p className="text-[11px] text-[#9BA8AB] mt-0.5">
                  Nhập URL ảnh online từ trình duyệt
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#11212D] border border-[#253745] text-xs text-[#CCD0CF] placeholder-[#9BA8AB]/50 focus:outline-none focus:border-[#9BA8AB]"
                />
                <button
                  type="submit"
                  disabled={!customUrl.trim()}
                  className="px-3 py-1.5 rounded-xl bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs transition cursor-pointer disabled:opacity-40"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>

          {/* Curated Dark Fantasy Presets Grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#CCD0CF]">
                Bộ Sưu Tập Cảnh Quan Dark Fantasy FaeQuest
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {DARK_FANTASY_COVERS.map((preset) => {
                const isSelected = currentCover === preset.url;

                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.url, preset.title)}
                    className={`relative rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200 group text-left ${
                      isSelected
                        ? 'border-[#CCD0CF] shadow-[0_0_15px_rgba(204,208,207,0.35)] scale-[1.02]'
                        : 'border-[#253745] hover:border-[#4A5C6A] hover:scale-[1.01]'
                    }`}
                  >
                    {/* Image */}
                    <div className="h-24 w-full bg-[#06141B] relative overflow-hidden">
                      <img
                        src={preset.url}
                        alt={preset.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#11212D] via-transparent to-transparent" />

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#CCD0CF] text-[#06141B] flex items-center justify-center shadow-lg">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="p-2.5 bg-[#11212D]">
                      <h5 className="text-xs font-bold text-[#CCD0CF] truncate group-hover:text-white transition">
                        {preset.title}
                      </h5>
                      <p className="text-[10px] text-[#9BA8AB] truncate mt-0.5">
                        {preset.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#253745] flex items-center justify-end gap-3 bg-[#06141B]/70 shrink-0">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setChangeCoverOpen(false)}
            className="px-5 py-2 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs shadow-md transition cursor-pointer"
          >
            Hoàn Tất
          </motion.button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
