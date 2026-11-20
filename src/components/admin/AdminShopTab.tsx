import React, { useState, useMemo } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { SystemShopItem } from '../../types';
import { uploadImageToCloudinary } from '../../utils/cloudinaryUpload';
import { localizeError } from '../../utils/errorLocalization';
import { playSound } from '../../utils/soundEngine';
import { CoinIcon } from '../ui/CoinIcon';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Sparkles,
  Check,
  X,
  Image as ImageIcon,
  ClipboardPaste,
} from 'lucide-react';

export const AdminShopTab: React.FC = () => {
  const {
    systemShopItems,
    addSystemShopItem,
    updateSystemShopItem,
    deleteSystemShopItem,
    adminAssets,
    addAdminAsset,
    soundEnabled,
    addToast,
  } = useFaeQuestStore();

  const shopAssets = useMemo(() => {
    return adminAssets.filter((a) => a.category === 'all' || a.category === 'shop');
  }, [adminAssets]);

  const handleSaveToVault = async () => {
    if (!icon || !isIconUrl) return;
    const defaultName = name ? `Vật phẩm ${name}` : 'Ảnh Vật Phẩm Mới';
    const assetName = window.prompt('Nhập tên gợi nhớ để lưu vào Kho Tài Nguyên:', defaultName);
    if (assetName && assetName.trim()) {
      await addAdminAsset({
        name: assetName.trim(),
        url: icon,
        category: 'shop',
      });
    }
  };

  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<SystemShopItem | null>(null);

  // Form states
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [cost, setCost] = useState<number | ''>(100);
  const [icon, setIcon] = useState<string>('👑');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Quick Preset Icons for RPG Shop
  const presetIcons = [
    '👑', '🧋', '🎬', '☕', '🍕', '🎮', '📚', '🏖️', '🎧', '🎸',
    '🎁', '⚡', '🏆', '💎', '🛡️', '⚔️', '🪄', '🏹', '🍵', '🍣'
  ];

  const resetForm = () => {
    setName('');
    setDescription('');
    setCost(100);
    setIcon('👑');
    setEditingItem(null);
    setIsAdding(false);
  };

  const handleEditClick = (item: SystemShopItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description);
    setCost(item.cost);
    setIcon(item.icon);
    setIsAdding(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setIcon(url);
      playSound('ui_click', soundEnabled);
      addToast('Tải ảnh biểu tượng thành công!', 'success');
    } catch (err: any) {
      addToast(localizeError(err, 'Lỗi khi tải ảnh biểu tượng'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    if (isUploading) return;
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imgType = item.types.find((t) => t.startsWith('image/'));
          if (imgType) {
            const blob = await item.getType(imgType);
            const file = new File([blob], `shop_${Date.now()}.png`, { type: imgType });
            setIsUploading(true);
            try {
              const url = await uploadImageToCloudinary(file);
              setIcon(url);
              playSound('ui_click', soundEnabled);
              addToast('📋 Đã dán và tải ảnh từ Clipboard thành công!', 'success');
            } finally {
              setIsUploading(false);
            }
            return;
          }
        }
      }
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        const cleanText = text?.trim();
        if (cleanText && (cleanText.startsWith('http://') || cleanText.startsWith('https://'))) {
          setIcon(cleanText);
          playSound('ui_click', soundEnabled);
          addToast('📋 Đã dán link ảnh từ Clipboard!', 'success');
          return;
        }
      }
      addToast('Chưa có ảnh trong Clipboard! Hãy copy ảnh rồi bấm Ctrl + V.', 'info');
    } catch {
      addToast('Hãy bấm tổ hợp phím Ctrl + V để dán ảnh trực tiếp!', 'info');
    }
  };

  const handleFormPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            const file = new File([blob], `shop_${Date.now()}.png`, { type: blob.type });
            setIsUploading(true);
            uploadImageToCloudinary(file)
              .then((url) => {
                setIcon(url);
                playSound('ui_click', soundEnabled);
                addToast('📋 Đã dán và tải ảnh từ Clipboard thành công!', 'success');
              })
              .catch((err) => addToast(localizeError(err, 'Lỗi tải ảnh từ bộ nhớ tạm'), 'error'))
              .finally(() => setIsUploading(false));
            return;
          }
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Vui lòng nhập tên vật phẩm', 'error');
      return;
    }
    const finalCost = typeof cost === 'number' && cost > 0 ? cost : 1;

    if (editingItem) {
      const success = await updateSystemShopItem(editingItem.id, {
        name: name.trim(),
        description: description.trim(),
        cost: finalCost,
        icon,
      });
      if (success) {
        addToast(`Đã cập nhật vật phẩm "${name}"`, 'success');
        resetForm();
      }
    } else {
      const success = await addSystemShopItem({
        name: name.trim(),
        description: description.trim(),
        cost: finalCost,
        icon,
        is_system: true,
      });
      if (success) {
        addToast(`Đã thêm vật phẩm hệ thống "${name}"`, 'success');
        resetForm();
      }
    }
  };

  const isIconUrl = icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('data:');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#11212D] border border-[#253745] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06141B] border border-[#4A5C6A] text-xs font-bold text-[#CCD0CF]">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
            <span>Thương Hội Cung Đình</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-rpg tracking-wide">
            Quản Lý Cửa Hàng Hệ Thống (Global Shop Manager)
          </h2>
          <p className="text-xs sm:text-sm text-[#9BA8AB] max-w-2xl leading-relaxed">
            Thiết lập các phần thưởng mẫu chuẩn mực để mọi Thợ Săn trong toàn vương quốc có thể quy đổi bằng Xu Vàng nỗ lực của họ.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isAdding) {
              resetForm();
            } else {
              resetForm();
              setIsAdding(true);
            }
          }}
          className="px-4 py-2.5 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer shrink-0"
        >
          {isAdding ? <X className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4 stroke-[3]" />}
          <span>{isAdding ? 'Đóng Biểu Mẫu' : 'Thêm Vật Phẩm Mới'}</span>
        </button>
      </div>

      {/* Add / Edit Form Card */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          onPaste={handleFormPaste}
          className="bg-[#11212D] border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-[#253745] pb-3">
            <h3 className="text-base font-bold text-white font-rpg tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{editingItem ? 'Chỉnh Sửa Vật Phẩm Hệ Thống' : 'Thêm Mới Vật Phẩm Hệ Thống'}</span>
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-[#9BA8AB] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Col: Name & Cost & Desc */}
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9BA8AB] block">
                  Tên Vật Phẩm *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Vé Nghỉ Dưỡng Cuối Tuần..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06141B] border border-[#253745] text-xs sm:text-sm text-[#CCD0CF] focus:outline-none focus:border-[#4A5C6A]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9BA8AB] block">
                  Giá Xu Vàng Quy Đổi *
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <CoinIcon size="xs" />
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={cost}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setCost('');
                      } else {
                        const parsed = parseInt(val, 10);
                        setCost(isNaN(parsed) ? '' : parsed);
                      }
                    }}
                    onBlur={() => {
                      if (cost === '' || cost < 1) {
                        setCost(1);
                      }
                    }}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#06141B] border border-[#253745] text-xs sm:text-sm text-amber-300 font-bold focus:outline-none focus:border-[#4A5C6A]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9BA8AB] block">
                  Mô Tả Khích Lệ
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả trải nghiệm tự thưởng xứng đáng sau khi hoàn thành mục tiêu..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06141B] border border-[#253745] text-xs sm:text-sm text-[#CCD0CF] focus:outline-none focus:border-[#4A5C6A] resize-none"
                />
              </div>
            </div>

            {/* Right Col: Icon Picker & Cloudinary Upload */}
            <div className="space-y-3.5 bg-[#06141B] p-4 rounded-2xl border border-[#253745]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#9BA8AB] block">
                  Biểu Tượng (Emoji hoặc Ảnh Tải Lên)
                </label>

                {/* Live Preview Box */}
                <div className="w-12 h-12 rounded-xl bg-[#11212D] border border-[#4A5C6A] flex items-center justify-center text-2xl shadow-inner overflow-hidden">
                  {isIconUrl ? (
                    <img src={icon} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <span>{icon}</span>
                  )}
                </div>
              </div>

              {/* Upload to Cloudinary & Paste button */}
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
                  onClick={handlePasteFromClipboard}
                  disabled={isUploading}
                  className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-950/60 to-orange-950/60 hover:from-amber-900/60 hover:to-orange-900/60 border border-amber-500/40 text-xs font-semibold text-amber-300 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                  title="Dán ảnh trực tiếp từ bộ nhớ tạm Clipboard (Ctrl + V)"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Dán Ảnh (Ctrl+V)</span>
                </button>
              </div>

              {/* Custom input string/URL */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#9BA8AB]">Hoặc dán URL ảnh / nhập Emoji:</span>
                  {isIconUrl && (
                    <button
                      type="button"
                      onClick={handleSaveToVault}
                      className="text-[10px] text-cyan-300 hover:text-cyan-200 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                      title="Lưu link ảnh này vào Kho Tài Nguyên"
                    >
                      <span>📌 Lưu vào Kho</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="👑 hoặc https://..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#11212D] border border-[#253745] text-xs text-[#CCD0CF] focus:outline-none focus:border-[#4A5C6A]"
                />
              </div>

              {/* Quick Emojis Grid */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-[#9BA8AB]">Bộ Icon RPG Gợi Ý:</span>
                <div className="flex flex-wrap gap-1.5">
                  {presetIcons.map((emo) => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => {
                        setIcon(emo);
                        playSound('ui_click', soundEnabled);
                      }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition border cursor-pointer ${
                        icon === emo
                          ? 'bg-[#CCD0CF] border-white scale-110 shadow-sm'
                          : 'bg-[#11212D] border-[#253745] hover:bg-[#253745]'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Saved Asset Vault Selector */}
              <div className="space-y-1.5 pt-2 border-t border-[#253745]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#9BA8AB] flex items-center gap-1 font-semibold">
                    <span>🖼️ Kho Tài Nguyên Đã Lưu:</span>
                    <span className="text-[10px] text-cyan-400 font-mono">({shopAssets.length})</span>
                  </span>
                </div>

                {shopAssets.length === 0 ? (
                  <div className="p-3 rounded-xl bg-[#11212D] border border-[#253745] text-center text-[10px] text-[#9BA8AB]">
                    Chưa có ảnh nào trong kho. Dán link và bấm "📌 Lưu vào Kho"!
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                    {shopAssets.map((asset) => {
                      const isSelected = icon === asset.url;
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => {
                            setIcon(asset.url);
                            playSound('ui_click', soundEnabled);
                          }}
                          className={`p-1.5 rounded-xl flex flex-col items-center justify-center gap-1 border transition cursor-pointer ${
                            isSelected
                              ? 'border-[#CCD0CF] bg-[#253745]/60 scale-105 shadow-md ring-1 ring-[#CCD0CF]/60'
                              : 'bg-[#11212D] border-[#253745] hover:bg-[#253745] hover:border-[#4A5C6A]'
                          }`}
                          title={asset.name}
                        >
                          <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                            <img
                              src={asset.url}
                              alt={asset.name}
                              className="w-10 h-10 object-contain [image-rendering:pixelated] drop-shadow"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/assets/logo.png';
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-[#9BA8AB] truncate w-full text-center font-medium">
                            {asset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#253745]">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-xl bg-[#06141B] hover:bg-[#253745] text-xs font-semibold text-[#9BA8AB] transition cursor-pointer border border-[#253745]"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#CCD0CF] hover:bg-white text-[#06141B] text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{editingItem ? 'Lưu Thay Đổi' : 'Thêm Vào Cửa Hàng Hệ Thống'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Existing System Shop Items Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#CCD0CF] font-rpg tracking-wide">
            Danh Sách Vật Phẩm Hệ Thống Hiện Có ({systemShopItems.length})
          </h3>
          <span className="text-xs text-[#9BA8AB]">
            Tự động xuất hiện trên Cửa Hàng Tự Thưởng của tất cả người dùng
          </span>
        </div>

        {systemShopItems.length === 0 ? (
          <div className="py-12 bg-[#11212D] border border-[#253745] rounded-3xl text-center text-[#9BA8AB] text-sm">
            Chưa có vật phẩm hệ thống nào. Hãy bấm "Thêm Vật Phẩm Mới" để thiết lập!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemShopItems.map((item) => {
              const isItemIconUrl =
                item.icon.startsWith('http') || item.icon.startsWith('/') || item.icon.startsWith('data:');

              return (
                <div
                  key={item.id}
                  className="rounded-3xl p-5 bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] flex flex-col justify-between gap-4 transition shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#06141B] border border-[#253745] flex items-center justify-center text-3xl shadow-inner overflow-hidden">
                      {isItemIconUrl ? (
                        <img src={item.icon} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{item.icon}</span>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                        🏛️ Vật Phẩm Hệ Thống
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[#06141B] border border-[#253745] text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                        <CoinIcon size="xs" />
                        <span>{item.cost} Xu</span>
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{item.name}</h4>
                    <p className="text-xs text-[#9BA8AB] mt-1 line-clamp-2 leading-relaxed">
                      {item.description || 'Vật phẩm tự thưởng do Ban Quản Trị cung cấp.'}
                    </p>
                  </div>

                  {/* Admin controls */}
                  <div className="pt-3 border-t border-[#253745] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditClick(item)}
                      className="py-1.5 px-3 rounded-xl bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Sửa</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Bạn có chắc chắn muốn xóa vật phẩm hệ thống "${item.name}"?`)) {
                          await deleteSystemShopItem(item.id);
                        }
                      }}
                      className="py-1.5 px-3 rounded-xl bg-[#06141B] hover:bg-rose-950/70 border border-[#253745] hover:border-rose-500/50 text-[#9BA8AB] hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
