import React, { useState, useEffect, useRef } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { SeasonAnnouncement } from '../../types';
import { uploadImageToCloudinary } from '../../utils/cloudinaryUpload';
import { playSound } from '../../utils/soundEngine';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  Pin,
  PinOff,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Calendar,
  Swords,
  CheckCircle2,
  X,
  Upload,
  Link as LinkIcon,
} from 'lucide-react';

const PRESET_TAGS = [
  'Mùa 1',
  'Mùa 2',
  'Mùa 3',
  'Cập Nhật BXH',
  'Sự Kiện Đua Top',
  'Bảo Trì Hệ Thống',
  'Thông Báo Nóng',
];

export const AdminAnnouncementsTab: React.FC = () => {
  const {
    seasonAnnouncements,
    fetchSeasonAnnouncements,
    addSeasonAnnouncement,
    updateSeasonAnnouncement,
    deleteSeasonAnnouncement,
    togglePinSeasonAnnouncement,
    setSeasonResetModalOpen,
    addToast,
    soundEnabled,
  } = useFaeQuestStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [seasonTag, setSeasonTag] = useState<string>('Mùa 1');
  const [customTag, setCustomTag] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);

  useEffect(() => {
    fetchSeasonAnnouncements();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setSeasonTag('Mùa 1');
    setCustomTag('');
    setTitle('');
    setContent('');
    setImageUrl('');
    setIsPinned(false);
    setShowUrlInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (ann: SeasonAnnouncement) => {
    playSound('ui_click', soundEnabled);
    setEditingId(ann.id);
    if (PRESET_TAGS.includes(ann.season_tag)) {
      setSeasonTag(ann.season_tag);
      setCustomTag('');
    } else {
      setSeasonTag('Khác');
      setCustomTag(ann.season_tag);
    }
    setTitle(ann.title);
    setContent(ann.content);
    setImageUrl(ann.image_url || '');
    setIsPinned(ann.is_pinned);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadImageToCloudinary(file);
      setImageUrl(uploadedUrl);
      addToast('Tải ảnh banner lên thành công!', 'success');
    } catch (err: any) {
      console.warn('Cloudinary upload warning, fallback to base64 DataURL:', err);
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
        addToast('Đã lưu ảnh xem trước nội bộ!', 'info');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      addToast('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!', 'error');
      return;
    }

    const finalTag = seasonTag === 'Khác' ? customTag.trim() || 'Thông Báo' : seasonTag;

    setIsSubmitting(true);
    playSound('ui_click', soundEnabled);

    if (editingId) {
      const success = await updateSeasonAnnouncement(editingId, {
        season_tag: finalTag,
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl.trim() || null,
        is_pinned: isPinned,
      });

      if (success) {
        resetForm();
      }
    } else {
      const success = await addSeasonAnnouncement({
        season_tag: finalTag,
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl.trim() || null,
        is_pinned: isPinned,
      });

      if (success) {
        resetForm();
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, annTitle: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thông báo "${annTitle}" không?`)) {
      return;
    }
    playSound('ui_click', soundEnabled);
    await deleteSeasonAnnouncement(id);
    if (editingId === id) {
      resetForm();
    }
  };

  const handleTogglePin = async (ann: SeasonAnnouncement) => {
    playSound('ui_click', soundEnabled);
    await togglePinSeasonAnnouncement(ann.id, !ann.is_pinned);
    addToast(
      !ann.is_pinned ? 'Đã ghim thông báo lên đầu Bảng Tin!' : 'Đã bỏ ghim thông báo.',
      'info'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner with Quick Season Reset Button */}
      <div className="bg-[#11212D] border border-[#253745] rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
            <Megaphone className="w-3.5 h-3.5" />
            <span>QUẢN TRỊ THÔNG BÁO & LỊCH TRÌNH MÙA GIẢI</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-rpg tracking-wide">
            📢 Soạn Thảo Thông Báo Mùa Giải
          </h2>
          <p className="text-xs text-[#9BA8AB] max-w-2xl leading-relaxed">
            Viết và phát hành tin tức điều hành, quy tắc tính điểm, sự kiện đua Top lên Bảng Tin Đấu Trường của Thợ Săn.
          </p>
        </div>

        {/* Action Button: Season Reset Modal */}
        <button
          type="button"
          onClick={() => {
            playSound('ui_click', soundEnabled);
            setSeasonResetModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#06141B] text-xs font-black flex items-center gap-2 shadow-lg hover:shadow-amber-500/20 active:scale-95 transition cursor-pointer shrink-0"
        >
          <Swords className="w-4 h-4 text-[#06141B]" />
          <span>⚔️ Reset Rank Mùa Giải</span>
        </button>
      </div>

      {/* Journal-style Announcement Editor */}
      <div className="bg-[#11212D] border border-[#253745] rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#253745]">
          <h3 className="text-base sm:text-lg font-black text-white font-rpg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{editingId ? 'Chỉnh Sửa Thông Báo Mùa Giải' : 'Soạn Thông Báo Mới'}</span>
          </h3>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-amber-400 hover:text-white flex items-center gap-1 cursor-pointer transition font-bold"
            >
              <X className="w-4 h-4" />
              <span>Hủy Sửa & Soạn Mới</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Season Tag Pills */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#9BA8AB] mb-2">
              Nhãn Mùa Giải (Season Tag)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSeasonTag(tag);
                    setCustomTag('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    seasonTag === tag
                      ? 'bg-cyan-500 text-[#06141B] border-cyan-400 shadow-sm'
                      : 'bg-[#06141B] text-[#CCD0CF] border-[#253745] hover:border-[#4A5C6A]'
                  }`}
                >
                  {tag}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSeasonTag('Khác')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  seasonTag === 'Khác'
                    ? 'bg-cyan-500 text-[#06141B] border-cyan-400 shadow-sm'
                    : 'bg-[#06141B] text-[#CCD0CF] border-[#253745] hover:border-[#4A5C6A]'
                }`}
              >
                Tùy biến...
              </button>
            </div>

            {seasonTag === 'Khác' && (
              <div className="mt-2.5">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Nhập tên nhãn riêng (VD: Mùa Hè Rực Lửa, Đua Top Tuần)..."
                  className="w-full bg-[#06141B] border border-[#253745] focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs font-bold text-white placeholder-[#4A5C6A] outline-none transition"
                />
              </div>
            )}
          </div>

          {/* 2. Title Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#9BA8AB] mb-1.5">
              Tiêu Đề Thông Báo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: ⚔️ Khởi Tranh Mùa 2: Cuộc Đua Băng Giá & Phần Thưởng Độc Quyền"
              className="w-full bg-[#06141B] border border-[#253745] focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm sm:text-base font-black text-white placeholder-[#4A5C6A] outline-none transition"
              required
            />
          </div>

          {/* 3. Detail Content Textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#9BA8AB] mb-1.5">
              Nội Dung Chi Tiết (Luật chơi, mốc thời gian, quà thưởng)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Viết nội dung thông báo chi tiết cho Thợ Săn. Bạn có thể xuống dòng thoải mái..."
              className="w-full bg-[#06141B] border border-[#253745] focus:border-cyan-400 rounded-2xl p-4 text-xs sm:text-sm text-[#CCD0CF] placeholder-[#4A5C6A] outline-none transition resize-y leading-relaxed"
              required
            />
          </div>

          {/* 4. Image Upload & Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#9BA8AB]">
                Hình Ảnh Banner Minh Họa
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <LinkIcon className="w-3 h-3" />
                <span>{showUrlInput ? 'Ẩn ô nhập link ảnh' : 'Nhập link ảnh trực tiếp'}</span>
              </button>
            </div>

            {showUrlInput && (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Dán đường dẫn ảnh (URL) tại đây..."
                className="w-full bg-[#06141B] border border-[#253745] focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#4A5C6A] outline-none transition"
              />
            )}

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFilePick}
              accept="image/*"
              className="hidden"
            />

            {/* Image Preview Box or Upload CTA */}
            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-[#253745] bg-[#06141B] max-w-md group">
                <img
                  src={imageUrl}
                  alt="Announcement Preview"
                  className="w-full h-44 object-cover object-center"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-black/75 hover:bg-rose-600 text-white transition cursor-pointer"
                  title="Xóa ảnh"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#06141B] border border-dashed border-[#4A5C6A] hover:border-cyan-400 text-xs font-bold text-[#CCD0CF] hover:text-white flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Đang tải ảnh lên...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Chọn Ảnh Banner Từ Thiết Bị (PNG, JPG, WebP)</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* 5. Pin Switch */}
          <div className="flex items-center gap-3 pt-2">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#06141B] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
              <span className="ml-3 text-xs font-bold text-[#CCD0CF] flex items-center gap-1.5">
                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-amber-400 fill-amber-400' : 'text-[#9BA8AB]'}`} />
                Ghim thông báo này lên đầu Bảng Tin
              </span>
            </label>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-[#253745] flex items-center justify-end gap-3">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl border border-[#253745] hover:border-[#4A5C6A] bg-[#06141B] text-[#CCD0CF] hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-[#06141B] text-xs font-black shadow-lg hover:shadow-cyan-500/20 active:scale-95 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#06141B]" />
                  <span>Đang Xử Lý...</span>
                </>
              ) : (
                <>
                  <Megaphone className="w-4 h-4 text-[#06141B]" />
                  <span>{editingId ? 'Lưu Thay Đổi Thông Báo' : '📣 Đăng Thông Báo Lên BXH'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Announcements Management List */}
      <div className="bg-[#11212D] border border-[#253745] rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#253745] pb-3">
          <h3 className="text-base sm:text-lg font-black text-white font-rpg flex items-center gap-2">
            <span>Danh Sách Thông Báo Đã Đăng ({seasonAnnouncements.length})</span>
          </h3>
        </div>

        {seasonAnnouncements.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#9BA8AB]">
            Chưa có thông báo mùa giải nào. Hãy tạo thông báo đầu tiên ở biểu mẫu phía trên!
          </div>
        ) : (
          <div className="space-y-3">
            {seasonAnnouncements.map((a) => (
              <div
                key={a.id}
                className={`rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition border ${
                  a.is_pinned
                    ? 'bg-[#162938]/80 border-amber-400/50 shadow-md'
                    : 'bg-[#06141B] border-[#253745] hover:border-[#4A5C6A]'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Thumbnail (if any) */}
                  {a.image_url ? (
                    <img
                      src={a.image_url}
                      alt={a.title}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border border-[#253745]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#11212D] border border-[#253745] flex items-center justify-center text-cyan-400 shrink-0">
                      <Megaphone className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {a.is_pinned && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-[#06141B] text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                          <Pin className="w-2.5 h-2.5 fill-current" />
                          ĐÃ GHIM
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-[#253745] text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                        {a.season_tag}
                      </span>
                      <span className="text-[10px] text-[#9BA8AB]">
                        {new Date(a.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-extrabold text-white truncate">
                      {a.title}
                    </h4>
                    <p className="text-xs text-[#9BA8AB] line-clamp-2 mt-0.5 leading-relaxed">
                      {a.content}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTogglePin(a)}
                    className={`p-2 rounded-xl border transition cursor-pointer ${
                      a.is_pinned
                        ? 'bg-amber-400/10 border-amber-400/40 text-amber-300 hover:bg-amber-400/20'
                        : 'bg-[#11212D] border-[#253745] text-[#9BA8AB] hover:text-white hover:bg-[#253745]'
                    }`}
                    title={a.is_pinned ? 'Bỏ ghim khỏi đầu Bảng Tin' : 'Ghim lên đầu Bảng Tin'}
                  >
                    {a.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEdit(a)}
                    className="p-2 rounded-xl bg-[#11212D] border border-[#253745] text-[#CCD0CF] hover:text-white hover:bg-[#253745] transition cursor-pointer"
                    title="Chỉnh sửa thông báo"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(a.id, a.title)}
                    className="p-2 rounded-xl bg-[#11212D] border border-[#253745] text-rose-400 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                    title="Xóa thông báo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
