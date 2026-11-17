import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { JournalMood } from '../../types';
import { RichTextEditor } from './RichTextEditor';
import { uploadImageToCloudinary } from '../../utils/cloudinaryUpload';
import { playSound } from '../../utils/soundEngine';
import {
  X,
  Calendar,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Sparkles,
  BookOpen,
} from 'lucide-react';

const MOOD_OPTIONS: { mood: JournalMood; emoji: string; label: string; activeColor: string }[] = [
  { mood: 'Tuyệt vời', emoji: '🤩', label: 'Tuyệt vời', activeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' },
  { mood: 'Tốt', emoji: '😊', label: 'Tốt', activeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' },
  { mood: 'Bình thường', emoji: '😐', label: 'Bình thường', activeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/50' },
  { mood: 'Căng thẳng', emoji: '😫', label: 'Căng thẳng', activeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/50' },
  { mood: 'Tệ', emoji: '😞', label: 'Tệ', activeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/50' },
];

export const WriteJournalModal: React.FC = () => {
  const {
    isWriteJournalOpen,
    editingJournal,
    setWriteJournalOpen,
    saveJournal,
    tasks,
    addToast,
  } = useFaeQuestStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [mood, setMood] = useState<JournalMood>('Bình thường');
  const [content, setContent] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Điền dữ liệu khi chỉnh sửa hoặc mở mới
  useEffect(() => {
    if (editingJournal) {
      setDate(editingJournal.date);
      setMood(editingJournal.mood);
      setContent(editingJournal.content);
      setImages(editingJournal.images || []);
    } else {
      const d = new Date();
      setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      setMood('Bình thường');
      setContent('');
      setImages([]);
    }
  }, [editingJournal, isWriteJournalOpen]);

  // Kiểm tra điều kiện hoàn thành >= 3 nhiệm vụ khó trong ngày
  const hardCompletedCount = tasks.filter(
    (t) => t.completed && (t.difficulty === 'hard' || t.difficulty === 'boss')
  ).length;

  const placeholderText =
    hardCompletedCount >= 3
      ? 'Hôm nay bạn đã cày cuốc rất chăm chỉ, cảm giác hiện tại thế nào?...'
      : 'Ghi lại hành trình, bài học kỷ luật và những cảm nghĩ của bạn hôm nay...';

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImageUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const uploadedUrl = await uploadImageToCloudinary(file);
        newImageUrls.push(uploadedUrl);
      } catch (err: any) {
        console.warn('Cloudinary upload warning, fallback to base64 DataURL:', err);
        // Fallback lưu Data URL để không mất ảnh người dùng
        const reader = new FileReader();
        const dataUrlPromise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const dataUrl = await dataUrlPromise;
        newImageUrls.push(dataUrl);
      }
    }

    setImages((prev) => [...prev, ...newImageUrls]);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    addToast(`Đã thêm ${newImageUrls.length} ảnh đính kèm!`, 'success');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = async () => {
    // Kiểm tra nội dung không được để trống (bỏ qua tag html rỗng)
    const textOnly = content.replace(/<[^>]*>/g, '').trim();
    if (!textOnly && images.length === 0) {
      addToast('Vui lòng viết nội dung hoặc đính kèm ảnh trước khi lưu!', 'error');
      return;
    }

    setIsSaving(true);
    const success = await saveJournal({
      id: editingJournal?.id,
      date,
      mood,
      content,
      images,
    });
    setIsSaving(false);

    if (success) {
      setWriteJournalOpen(false);
    }
  };

  if (!isWriteJournalOpen) return null;

  // Format date display
  const [year, month, day] = date.split('-').map(Number);
  const formattedDisplayDate = `${day}/${month}/${year}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="max-w-[700px] w-full bg-[#11212D] border border-[#253745] rounded-[32px] p-5 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.95)] relative overflow-hidden my-auto"
        >
          {/* Subtle Ambient Light Glow */}
          <div className="absolute top-0 right-1/4 w-72 h-32 bg-[#4A5C6A]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#253745]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#06141B] border border-[#253745] flex items-center justify-center text-[#CCD0CF] shadow-inner">
                <BookOpen className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#CCD0CF] font-rpg tracking-wide flex items-center gap-2">
                  <span>{editingJournal ? 'Chỉnh Sửa Trang Nhật Ký' : 'Ghi Lại Trang Nhật Ký Mới'}</span>
                  {hardCompletedCount >= 3 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Chăm chỉ hôm nay
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[#9BA8AB]">Nhật ký cá nhân lưu trữ an toàn & riêng tư trên Supabase</p>
              </div>
            </div>

            <button
              onClick={() => {
                playSound('ui_click');
                setWriteJournalOpen(false);
              }}
              className="w-8 h-8 rounded-full bg-[#06141B] border border-[#253745] text-[#9BA8AB] hover:text-white hover:border-[#4A5C6A] flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 pt-4">
            {/* ================= HÀNG 1: NGÀY & TÂM TRẠNG (MOOD) ================= */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#06141B]/70 border border-[#253745]">
              {/* Ngày */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#11212D] border border-[#253745] flex items-center justify-center text-[#CCD0CF] shrink-0">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#9BA8AB] tracking-wider">Ngày ghi nhật ký</div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-[#CCD0CF] focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Bộ chọn Tâm Trạng (Mood Selector) */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                {MOOD_OPTIONS.map((item) => {
                  const isSelected = mood === item.mood;
                  return (
                    <button
                      key={item.mood}
                      type="button"
                      onClick={() => {
                        playSound('ui_click');
                        setMood(item.mood);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? item.activeColor + ' shadow-md scale-105 border'
                          : 'bg-[#11212D] text-[#9BA8AB] border border-[#253745] hover:text-[#CCD0CF] hover:border-[#4A5C6A]'
                      }`}
                      title={item.label}
                    >
                      <span className="text-sm">{item.emoji}</span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ================= HÀNG 2: RICH TEXT EDITOR (TIPTAP) ================= */}
            <div>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder={placeholderText}
              />
            </div>

            {/* ================= HÀNG 3: ĐÍNH KÈM ẢNH & LƯU ================= */}
            {/* Ảnh đã tải lên */}
            {images.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar">
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden relative group border border-[#253745] shrink-0 bg-[#06141B]"
                  >
                    <img
                      src={imgUrl}
                      alt={`Đính kèm ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                      title="Xóa ảnh này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2">
              {/* Nút đính kèm ảnh */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleImagePick}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-[#06141B] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] hover:text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Đang tải ảnh...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 text-cyan-400" />
                      <span>🖼️ Đính kèm ảnh ({images.length})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Nút Hủy & Lưu */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playSound('ui_click');
                    setWriteJournalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#06141B] border border-[#253745] text-[#9BA8AB] hover:text-[#CCD0CF] hover:border-[#4A5C6A] text-xs font-bold transition-all cursor-pointer"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  disabled={isSaving || isUploading}
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-[#CCD0CF] text-[#06141B] hover:bg-white text-xs font-extrabold flex items-center gap-2 shadow-[0_4px_16px_rgba(204,208,207,0.25)] hover:shadow-[0_4px_22px_rgba(204,208,207,0.4)] transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span>Lưu Nhật Ký</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
