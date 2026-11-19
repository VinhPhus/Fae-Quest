import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { AdminAssetCategory } from '../../types';
import { uploadImageToCloudinary } from '../../utils/cloudinaryUpload';
import { playSound } from '../../utils/soundEngine';
import {
  FolderArchive,
  Upload,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  Filter,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
  ClipboardPaste,
  Clipboard,
} from 'lucide-react';

export const AdminAssetVaultTab: React.FC = () => {
  const { adminAssets, addAdminAsset, deleteAdminAsset, addToast, soundEnabled } = useFaeQuestStore();

  // Form State
  const [assetName, setAssetName] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [assetCategory, setAssetCategory] = useState<AdminAssetCategory>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'achievement' | 'shop'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Central Image File Processor (handles Local File, Clipboard Paste, Drag & Drop)
  const processImageFile = useCallback(
    async (file: File, source: 'file' | 'clipboard' | 'drop' = 'file') => {
      setIsUploading(true);
      setHasImageError(false);

      if (source === 'clipboard') {
        addToast('📋 Đang tải ảnh từ Clipboard lên Cloudinary...', 'info');
      } else if (source === 'drop') {
        addToast('✨ Đang tải ảnh kéo thả lên Cloudinary...', 'info');
      }

      try {
        const url = await uploadImageToCloudinary(file);
        setAssetUrl(url);
        playSound('ui_click', soundEnabled);

        const successMsg =
          source === 'clipboard'
            ? '📋 Đã dán và tải ảnh từ Clipboard thành công!'
            : source === 'drop'
            ? '✨ Đã kéo thả và tải ảnh thành công!'
            : 'Tải ảnh lên Cloudinary thành công!';
        addToast(successMsg, 'success');

        // Tự động gợi ý tên nếu chưa nhập
        if (!assetName.trim()) {
          if (source === 'clipboard') {
            const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            setAssetName(`Ảnh Dán Lúc ${timeStr}`);
          } else {
            const defaultName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            setAssetName(defaultName.charAt(0).toUpperCase() + defaultName.slice(1));
          }
        }
      } catch (err: any) {
        addToast(err.message || 'Lỗi khi tải ảnh lên Cloudinary', 'error');
      } finally {
        setIsUploading(false);
      }
    },
    [assetName, addToast, soundEnabled]
  );

  // File Upload via Input
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImageFile(file, 'file');
  };

  // Button: Paste from Clipboard (calls navigator.clipboard.read)
  const handlePasteFromClipboardButton = async () => {
    if (isUploading) return;
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const ext = imageType.split('/')[1] || 'png';
            const file = new File([blob], `paste_${Date.now()}.${ext}`, { type: imageType });
            await processImageFile(file, 'clipboard');
            return;
          }
        }
      }

      // If no image blob, check if text is a URL
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        const cleanText = text?.trim();
        if (cleanText && (cleanText.startsWith('http://') || cleanText.startsWith('https://'))) {
          setAssetUrl(cleanText);
          setHasImageError(false);
          playSound('ui_click', soundEnabled);
          addToast('📋 Đã dán link ảnh từ Clipboard!', 'success');
          if (!assetName.trim()) {
            setAssetName('Tài nguyên mới');
          }
          return;
        }
      }

      addToast('Chưa có ảnh trong Clipboard! Hãy copy ảnh rồi bấm Ctrl + V.', 'info');
    } catch {
      addToast('Hãy bấm tổ hợp phím Ctrl + V để dán ảnh trực tiếp!', 'info');
    }
  };

  // Global Paste Listener (Ctrl + V anywhere on this tab)
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // 1. Kiểm tra clipboard data có file ảnh binary không (screenshot, copy image)
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              e.preventDefault();
              const ext = blob.type.split('/')[1] || 'png';
              const file = new File([blob], `clipboard_${Date.now()}.${ext}`, { type: blob.type });
              processImageFile(file, 'clipboard');
              return;
            }
          }
        }
      }

      // 2. Nếu người dùng copy link URL và đang không focus vào ô Tên
      const text = e.clipboardData?.getData('text')?.trim();
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        const activeElem = document.activeElement;
        const isInputName = activeElem && activeElem.getAttribute('data-field') === 'name';
        if (!isInputName && !assetUrl) {
          setAssetUrl(text);
          setHasImageError(false);
          playSound('ui_click', soundEnabled);
          addToast('📋 Đã dán link ảnh từ Clipboard!', 'success');
          if (!assetName.trim()) {
            setAssetName('Tài nguyên mới');
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [processImageFile, assetName, assetUrl, soundEnabled, addToast]);

  // Submit Handler
  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) {
      addToast('Vui lòng nhập tên tài nguyên!', 'error');
      return;
    }
    if (!assetUrl.trim()) {
      addToast('Vui lòng dán hoặc tải lên đường dẫn ảnh (URL)!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await addAdminAsset({
        name: assetName.trim(),
        url: assetUrl.trim(),
        category: assetCategory,
      });

      if (success) {
        playSound('coin_purchase', soundEnabled);
        setAssetName('');
        setAssetUrl('');
        setAssetCategory('all');
        setHasImageError(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy URL to Clipboard
  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    playSound('ui_click', soundEnabled);
    addToast('Đã sao chép link ảnh vào clipboard!', 'success');
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
    const success = await deleteAdminAsset(id);
    if (success) {
      playSound('error_block', soundEnabled);
      setDeleteConfirmId(null);
    }
  };

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return adminAssets.filter((asset) => {
      const matchSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchCat = filterCategory === 'all' || asset.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [adminAssets, searchQuery, filterCategory]);

  const countAll = adminAssets.length;
  const countAchievement = adminAssets.filter((a) => a.category === 'achievement').length;
  const countShop = adminAssets.filter((a) => a.category === 'shop').length;

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="bg-[#11212D] border border-[#253745] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#06141B] border border-[#253745] flex items-center justify-center text-cyan-400 shadow-inner">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white font-rpg flex items-center gap-2">
              <span>Kho Hình Tài Nguyên (Admin Asset Vault)</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono">
                {countAll} tài nguyên
              </span>
            </h2>
            <p className="text-xs text-[#9BA8AB] mt-0.5">
              Lưu sẵn các đường dẫn ảnh để tái sử dụng nhanh trong Thành Tựu & Cửa Hàng Hệ Thống.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left/Top Form & Right/Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form: Thêm Tài Nguyên Mới (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#11212D] border border-[#253745] rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-[#253745]">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Thêm Tài Nguyên Mới</span>
            </h3>

            <form onSubmit={handleSaveAsset} className="space-y-4">
              {/* Live Preview & Error warning / Drag-Drop / Paste Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('image/')) {
                    processImageFile(file, 'drop');
                  }
                }}
                className={`relative flex items-center gap-3.5 p-3 rounded-xl border transition-all ${
                  isDragging
                    ? 'bg-cyan-950/40 border-cyan-400 border-dashed ring-2 ring-cyan-400/50 scale-[1.02]'
                    : 'bg-[#06141B] border-[#253745]'
                }`}
              >
                <div className="w-20 h-20 shrink-0 rounded-xl bg-[#11212D] border border-[#253745] flex items-center justify-center overflow-hidden p-1.5 shadow-inner">
                  {assetUrl && !hasImageError ? (
                    <img
                      src={assetUrl}
                      alt={assetName || 'Live Preview'}
                      className="w-full h-full object-contain drop-shadow transition-transform hover:scale-105"
                      onError={() => setHasImageError(true)}
                      onLoad={() => setHasImageError(false)}
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-[#4A5C6A]" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#9BA8AB] block">
                      Khung Xem Trước
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#253745] text-cyan-300 font-mono">
                      Ctrl + V
                    </span>
                  </div>
                  {isDragging ? (
                    <div className="text-[11px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 rounded-lg p-1.5 animate-pulse">
                      ✨ Thả ảnh vào đây để tải lên!
                    </div>
                  ) : hasImageError ? (
                    <div className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-500/30 rounded-lg p-1.5 leading-tight">
                      ⚠️ Link ảnh không hợp lệ hoặc bị chặn
                    </div>
                  ) : assetUrl ? (
                    <div className="text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-1.5 truncate">
                      ✓ Ảnh hợp lệ
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#4A5C6A] italic block leading-relaxed">
                      Dán ảnh từ Clipboard (Ctrl + V) hoặc kéo thả ảnh vào đây
                    </span>
                  )}
                </div>
              </div>

              {/* Tên tài nguyên */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#CCD0CF] flex items-center justify-between">
                  <span>Tên tài nguyên *</span>
                  <span className="text-[10px] text-[#9BA8AB]">Gợi nhớ ngắn gọn</span>
                </label>
                <input
                  type="text"
                  data-field="name"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="VD: Rương Huyền Thoại, Huy Hiệu Sói Bạc..."
                  className="w-full px-3 py-2 rounded-xl bg-[#06141B] border border-[#253745] text-xs text-white placeholder-[#4A5C6A] focus:outline-none focus:border-cyan-500/50 transition"
                  required
                />
              </div>

              {/* Upload & Paste Buttons */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#CCD0CF] block">
                    Thêm ảnh nhanh
                  </label>
                  <span className="text-[10px] text-cyan-400 font-mono">Copy rồi Ctrl + V</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="py-2 px-2.5 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] border border-[#4A5C6A] text-xs font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{isUploading ? 'Đang tải...' : 'Tải Từ Máy'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handlePasteFromClipboardButton}
                    disabled={isUploading}
                    className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 hover:from-cyan-900/60 hover:to-blue-900/60 border border-cyan-500/40 text-xs font-semibold text-cyan-300 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                    title="Dán ảnh trực tiếp từ bộ nhớ tạm Clipboard (Ctrl + V)"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Dán Ảnh (Ctrl+V)</span>
                  </button>
                </div>
              </div>

              {/* Đường dẫn ảnh (URL) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#CCD0CF] block">
                    Đường dẫn ảnh (URL) *
                  </label>
                  <span className="text-[10px] text-[#4A5C6A]">Tự điền khi dán / tải</span>
                </div>
                <input
                  type="text"
                  value={assetUrl}
                  onChange={(e) => {
                    setAssetUrl(e.target.value);
                    setHasImageError(false);
                  }}
                  placeholder="https://... hoặc /assets/..."
                  className="w-full px-3 py-2 rounded-xl bg-[#06141B] border border-[#253745] text-xs text-white placeholder-[#4A5C6A] focus:outline-none focus:border-cyan-500/50 transition font-mono"
                  required
                />
              </div>

              {/* Chọn Nhóm Áp Dụng (Category) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#CCD0CF] block">
                  Chọn Nhóm Áp Dụng
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAssetCategory('all');
                      playSound('ui_click', soundEnabled);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition text-center cursor-pointer ${
                      assetCategory === 'all'
                        ? 'bg-[#253745] border-cyan-400 text-cyan-300 shadow-sm'
                        : 'bg-[#06141B] border-[#253745] text-[#9BA8AB] hover:bg-[#11212D]'
                    }`}
                  >
                    Dùng chung
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssetCategory('achievement');
                      playSound('ui_click', soundEnabled);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition text-center cursor-pointer ${
                      assetCategory === 'achievement'
                        ? 'bg-[#253745] border-amber-400 text-amber-300 shadow-sm'
                        : 'bg-[#06141B] border-[#253745] text-[#9BA8AB] hover:bg-[#11212D]'
                    }`}
                  >
                    Thành Tựu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssetCategory('shop');
                      playSound('ui_click', soundEnabled);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition text-center cursor-pointer ${
                      assetCategory === 'shop'
                        ? 'bg-[#253745] border-emerald-400 text-emerald-300 shadow-sm'
                        : 'bg-[#06141B] border-[#253745] text-[#9BA8AB] hover:bg-[#11212D]'
                    }`}
                  >
                    Cửa Hàng
                  </button>
                </div>
              </div>

              {/* Nút Lưu */}
              <button
                type="submit"
                disabled={isSubmitting || isUploading || !assetName.trim() || !assetUrl.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang lưu...' : '💾 Lưu Vào Kho Tài Nguyên'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Saved Assets Grid (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#11212D] border border-[#253745] rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
            {/* Top Toolbar: Search & Category Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[#253745]">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => {
                    setFilterCategory('all');
                    playSound('ui_click', soundEnabled);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition shrink-0 cursor-pointer ${
                    filterCategory === 'all'
                      ? 'bg-[#253745] border-cyan-400 text-cyan-300'
                      : 'bg-[#06141B] border-[#253745] text-[#9BA8AB] hover:bg-[#253745]'
                  }`}
                >
                  Tất cả ({countAll})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterCategory('achievement');
                    playSound('ui_click', soundEnabled);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition shrink-0 cursor-pointer ${
                    filterCategory === 'achievement'
                      ? 'bg-[#253745] border-amber-400 text-amber-300'
                      : 'bg-[#06141B] border-[#253745] text-[#9BA8AB] hover:bg-[#253745]'
                  }`}
                >
                  Thành Tựu ({countAchievement})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterCategory('shop');
                    playSound('ui_click', soundEnabled);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition shrink-0 cursor-pointer ${
                    filterCategory === 'shop'
                      ? 'bg-[#253745] border-emerald-400 text-emerald-300'
                      : 'bg-[#06141B] border-[#253745] text-[#9BA8AB] hover:bg-[#253745]'
                  }`}
                >
                  Cửa Hàng ({countShop})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative sm:w-60">
                <Search className="w-3.5 h-3.5 text-[#4A5C6A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#06141B] border border-[#253745] text-xs text-white placeholder-[#4A5C6A] focus:outline-none focus:border-cyan-500/50 transition"
                />
              </div>
            </div>

            {/* Assets Grid */}
            {filteredAssets.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#06141B] border border-[#253745] flex items-center justify-center text-[#4A5C6A] mx-auto">
                  <FolderArchive className="w-6 h-6" />
                </div>
                <p className="text-xs text-[#9BA8AB]">
                  {searchQuery.trim()
                    ? 'Không tìm thấy tài nguyên nào phù hợp với từ khóa.'
                    : 'Kho tài nguyên đang trống. Hãy thêm tài nguyên đầu tiên của bạn!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredAssets.map((asset) => {
                  const isCopied = copiedId === asset.id;
                  const isDeleting = deleteConfirmId === asset.id;

                  const categoryLabel =
                    asset.category === 'achievement'
                      ? 'Thành Tựu'
                      : asset.category === 'shop'
                      ? 'Cửa Hàng'
                      : 'Chung';

                  const categoryBadgeColor =
                    asset.category === 'achievement'
                      ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                      : asset.category === 'shop'
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300';

                  return (
                    <div
                      key={asset.id}
                      className="group relative bg-[#06141B] border border-[#253745] hover:border-[#4A5C6A] rounded-2xl p-2.5 flex flex-col justify-between transition-all duration-200 hover:shadow-md"
                    >
                      {/* Image Thumbnail */}
                      <div className="relative w-full h-24 rounded-xl bg-[#11212D] border border-[#253745]/60 flex items-center justify-center p-2 overflow-hidden">
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="w-full h-full object-contain drop-shadow transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/assets/logo.png';
                          }}
                        />
                        {/* Category badge */}
                        <div className="absolute top-1.5 left-1.5">
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${categoryBadgeColor}`}
                          >
                            {categoryLabel}
                          </span>
                        </div>
                      </div>

                      {/* Info & Title */}
                      <div className="mt-2 space-y-1">
                        <h4
                          className="text-xs font-bold text-white truncate"
                          title={asset.name}
                        >
                          {asset.name}
                        </h4>
                        <p className="text-[10px] text-[#4A5C6A] truncate font-mono" title={asset.url}>
                          {asset.url}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-2.5 pt-2 border-t border-[#253745] flex items-center justify-between gap-1">
                        {/* Copy URL Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(asset.id, asset.url)}
                          className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF]'
                          }`}
                          title="Sao chép đường dẫn ảnh"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-white" />
                              <span>Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy URL</span>
                            </>
                          )}
                        </button>

                        {/* Delete Button */}
                        {isDeleting ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(asset.id)}
                              className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer transition"
                              title="Xác nhận xóa"
                            >
                              Xóa
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-1 rounded-lg bg-[#253745] text-[#9BA8AB] text-[10px] hover:text-white cursor-pointer"
                              title="Hủy"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              playSound('ui_click', soundEnabled);
                              setDeleteConfirmId(asset.id);
                            }}
                            className="p-1.5 rounded-lg bg-[#11212D] hover:bg-rose-950/40 border border-[#253745] hover:border-rose-500/40 text-[#9BA8AB] hover:text-rose-400 transition cursor-pointer"
                            title="Xóa tài nguyên khỏi kho"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
