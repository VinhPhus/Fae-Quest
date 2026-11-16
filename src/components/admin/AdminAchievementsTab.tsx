import React, { useState, useRef } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { SystemAchievement } from '../../types';
import { uploadImageToCloudinary } from '../../utils/cloudinaryUpload';
import { CoinIcon } from '../ui/CoinIcon';
import {
  Trophy,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Sparkles,
  Award,
  Check,
  X,
  Flame,
  CheckSquare,
  Zap,
  Clock,
  Layers,
} from 'lucide-react';

export const AdminAchievementsTab: React.FC = () => {
  const {
    systemAchievements,
    addSystemAchievement,
    updateSystemAchievement,
    deleteSystemAchievement,
    addToast,
  } = useFaeQuestStore();

  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [editingAchievement, setEditingAchievement] = useState<SystemAchievement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Form states
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [iconUrl, setIconUrl] = useState<string>('/assets/titles/title-tan-binh.png');
  const [category, setCategory] = useState<string>('Kỷ Luật');
  const [rarity, setRarity] = useState<'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'>('RARE');
  const [achievementType, setAchievementType] = useState<
    'streak_counter' | 'milestone_tasks' | 'milestone_exp' | 'milestone_focus'
  >('streak_counter');
  const [targetValue, setTargetValue] = useState<number>(14);
  const [rewardExp, setRewardExp] = useState<number>(200);
  const [rewardCoins, setRewardCoins] = useState<number>(50);
  const [grantedTitleName, setGrantedTitleName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Preset RPG 2D Title Icons
  const presetTitleIcons = [
    { label: 'Tân Binh', url: '/assets/titles/title-tan-binh.png' },
    { label: 'Chiến Binh', url: '/assets/titles/title-chien-binh.png' },
    { label: 'Chế Ngự', url: '/assets/titles/title-che-ngu.png' },
    { label: 'Thể Phách', url: '/assets/titles/title-the-phach.png' },
    { label: 'Học Giả', url: '/assets/titles/title-hoc-gia.png' },
    { label: 'Thợ Săn', url: '/assets/titles/title-tho-san.png' },
    { label: 'Hiền Nhân', url: '/assets/titles/title-hien-nhan.png' },
    { label: 'Độc Cô', url: '/assets/titles/title-doc-co.png' },
    { label: 'Bạc', url: '/assets/ranks/rank-bac.png' },
    { label: 'Vàng', url: '/assets/ranks/rank-vang.png' },
    { label: 'Lục Bảo', url: '/assets/ranks/rank-luc-bao.png' },
    { label: 'Thách Đấu', url: '/assets/ranks/rank-thach-dau.png' },
  ];

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIconUrl('/assets/titles/title-tan-binh.png');
    setCategory('Kỷ Luật');
    setRarity('RARE');
    setAchievementType('streak_counter');
    setTargetValue(14);
    setRewardExp(200);
    setRewardCoins(50);
    setGrantedTitleName('');
    setEditingAchievement(null);
    setIsAdding(false);
  };

  const handleEditClick = (ach: SystemAchievement) => {
    setEditingAchievement(ach);
    setTitle(ach.title);
    setDescription(ach.description || '');
    setIconUrl(ach.icon_url || '/assets/titles/title-tan-binh.png');
    setCategory(ach.category || 'Kỷ Luật');
    setRarity(ach.rarity || 'RARE');
    setAchievementType(ach.achievement_type || 'streak_counter');
    setTargetValue(ach.target_value);
    setRewardExp(ach.reward_exp);
    setRewardCoins(ach.reward_coins);
    setGrantedTitleName(ach.granted_title_name || '');
    setIsAdding(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setIconUrl(url);
      addToast('Tải ảnh biểu tượng lên Cloudinary thành công!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi tải ảnh lên Cloudinary', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Vui lòng nhập tên thành tựu', 'error');
      return;
    }
    if (targetValue <= 0) {
      addToast('Mục tiêu cần đạt phải lớn hơn 0', 'error');
      return;
    }

    if (editingAchievement) {
      const success = await updateSystemAchievement(editingAchievement.id, {
        title: title.trim(),
        description: description.trim(),
        icon_url: iconUrl,
        category: category.trim() || 'Chung',
        rarity,
        achievement_type: achievementType,
        target_value: targetValue,
        reward_exp: rewardExp,
        reward_coins: rewardCoins,
        granted_title_name: grantedTitleName.trim() || undefined,
      });

      if (success) {
        addToast(`Đã cập nhật thành tựu "${title}"!`, 'success');
        resetForm();
      }
    } else {
      const success = await addSystemAchievement({
        title: title.trim(),
        description: description.trim(),
        icon_url: iconUrl,
        category: category.trim() || 'Chung',
        rarity,
        achievement_type: achievementType,
        target_value: targetValue,
        reward_exp: rewardExp,
        reward_coins: rewardCoins,
        granted_title_name: grantedTitleName.trim() || undefined,
      });

      if (success) {
        addToast(`Đã tạo thành tựu mới "${title}"!`, 'success');
        resetForm();
      }
    }
  };

  const getRarityBadge = (r: string) => {
    switch (r) {
      case 'LEGENDARY':
        return 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border-amber-500/40';
      case 'EPIC':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'RARE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-[#253745] text-[#CCD0CF] border-[#4A5C6A]';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'streak_counter':
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      case 'milestone_tasks':
        return <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />;
      case 'milestone_exp':
        return <Zap className="w-3.5 h-3.5 text-yellow-400" />;
      case 'milestone_focus':
        return <Clock className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Trophy className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'streak_counter':
        return 'Bộ đếm chuỗi ngày (Streak)';
      case 'milestone_tasks':
        return 'Cột mốc Tổng Nhiệm vụ';
      case 'milestone_exp':
        return 'Cột mốc Tổng EXP';
      case 'milestone_focus':
        return 'Cột mốc Phiên Fae Focus';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#11212D] border border-[#253745] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06141B] border border-[#4A5C6A] text-xs font-bold text-[#CCD0CF]">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>Đại Sảnh Khắc Danh</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white font-rpg tracking-wide">
            Quản Lý Thành Tựu & Danh Hiệu (Achievement Creator)
          </h2>
          <p className="text-xs sm:text-sm text-[#9BA8AB] max-w-2xl leading-relaxed">
            Thiết kế các thử thách chuỗi kỷ luật hoặc cột mốc tự động, gắn kèm danh hiệu mở khóa để truyền cảm hứng mạnh mẽ cho cộng đồng Thợ Săn.
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
          <span>{isAdding ? (editingAchievement ? 'Hủy Chỉnh Sửa' : 'Đóng Biểu Mẫu') : 'Tạo Thành Tựu Mới'}</span>
        </button>
      </div>

      {/* Add / Edit Achievement Form */}
      {isAdding && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className={`bg-[#11212D] border-2 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in duration-200 ${
            editingAchievement
              ? 'border-cyan-400/70 shadow-[0_0_30px_rgba(6,182,212,0.15)]'
              : 'border-cyan-500/40'
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#253745] pb-3">
            <div className="flex items-center gap-2">
              {editingAchievement ? (
                <Edit2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <Award className="w-4 h-4 text-cyan-400" />
              )}
              <h3 className="text-base font-bold text-white font-rpg tracking-wide flex items-center gap-2">
                <span>{editingAchievement ? 'Chỉnh Sửa Thành Tựu Hệ Thống' : 'Khắc Ghi Thành Tựu & Danh Hiệu Mới'}</span>
                {editingAchievement && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                    Đang chỉnh sửa
                  </span>
                )}
              </h3>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="text-[#9BA8AB] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 Cols: Basic Info & Logic */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#9BA8AB] block">
                    Tên Thành Tựu *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Chiến Binh Thép 30 Ngày..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06141B] border border-[#253745] text-xs sm:text-sm text-[#CCD0CF] focus:outline-none focus:border-[#4A5C6A]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#9BA8AB] block">
                    Phân Loại
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Kỷ Luật / Thực Thi / Tập Trung..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06141B] border border-[#253745] text-xs sm:text-sm text-[#CCD0CF] focus:outline-none focus:border-[#4A5C6A]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9BA8AB] block">
                  Mô Tả Thử Thách
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ý nghĩa và tinh thần của thử thách..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06141B] border border-[#253745] text-xs sm:text-sm text-[#CCD0CF] focus:outline-none focus:border-[#4A5C6A] resize-none"
                />
              </div>

              {/* Rarity & Achievement Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#9BA8AB] block">
                    Độ Hiếm (Rarity)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRarity(r)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold transition cursor-pointer border ${
                          rarity === r
                            ? `${getRarityBadge(r)} shadow-sm`
                            : 'bg-[#06141B] text-[#9BA8AB] border-[#253745]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#9BA8AB] block">
                    Cơ Chế Tính Tiến Độ
                  </label>
                  <select
                    value={achievementType}
                    onChange={(e) => setAchievementType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#06141B] border border-[#253745] text-xs text-[#CCD0CF] focus:outline-none focus:border-[#4A5C6A] cursor-pointer"
                  >
                    <option value="streak_counter">1. Bộ đếm chuỗi ngày (Streak)</option>
                    <option value="milestone_tasks">2. Cột mốc Tổng Nhiệm Vụ</option>
                    <option value="milestone_exp">3. Cột mốc Tổng EXP</option>
                    <option value="milestone_focus">4. Cột mốc Số Phiên Focus</option>
                  </select>
                </div>
              </div>

              {/* Target & Rewards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#9BA8AB] block">
                    Mục Tiêu Đạt *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={targetValue}
                    onChange={(e) => setTargetValue(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-xl bg-[#06141B] border border-[#253745] text-xs text-white font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#9BA8AB] block">
                    Thưởng EXP
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={rewardExp}
                    onChange={(e) => setRewardExp(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl bg-[#06141B] border border-[#253745] text-xs text-cyan-400 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#9BA8AB] block">
                    Thưởng Xu Vàng
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={rewardCoins}
                    onChange={(e) => setRewardCoins(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl bg-[#06141B] border border-[#253745] text-xs text-amber-300 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9BA8AB] block">
                  Tên Danh Hiệu Kèm Theo (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={grantedTitleName}
                  onChange={(e) => setGrantedTitleName(e.target.value)}
                  placeholder="Ví dụ: Kỷ Luật Chi Thần (Người dùng có thể trang bị danh hiệu này)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06141B] border border-[#253745] text-xs text-[#CCD0CF] focus:outline-none focus:border-[#4A5C6A]"
                />
              </div>
            </div>

            {/* Right 5 Cols: Icon selection & Cloudinary */}
            <div className="lg:col-span-5 space-y-3.5 bg-[#06141B] p-4 rounded-2xl border border-[#253745]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#9BA8AB] block">
                  Ảnh / Icon Biểu Tượng
                </label>

                {/* Live Preview */}
                <div className="w-14 h-14 rounded-2xl bg-[#11212D] border border-[#4A5C6A] p-1.5 flex items-center justify-center shadow-inner overflow-hidden">
                  <img src={iconUrl} alt="preview" className="w-full h-full object-contain drop-shadow" />
                </div>
              </div>

              {/* Upload to Cloudinary */}
              <div>
                <label className="w-full py-2 px-3 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] border border-[#4A5C6A] text-xs font-semibold text-white flex items-center justify-center gap-2 cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Đang tải lên Cloudinary...' : 'Tải Ảnh Mới Lên Cloudinary'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>

              {/* Direct URL input */}
              <div className="space-y-1">
                <span className="text-[11px] text-[#9BA8AB]">Hoặc dán URL ảnh trực tiếp:</span>
                <input
                  type="text"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="https://... hoặc /assets/..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#11212D] border border-[#253745] text-xs text-[#CCD0CF]"
                />
              </div>

              {/* Preset 2D RPG Titles */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-[#9BA8AB]">Chọn Từ Bộ Icon RPG 2D:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {presetTitleIcons.map((t) => (
                    <button
                      key={t.url}
                      type="button"
                      onClick={() => setIconUrl(t.url)}
                      className={`p-1 rounded-xl flex flex-col items-center justify-center gap-1 border transition cursor-pointer ${
                        iconUrl === t.url
                          ? 'bg-[#253745] border-cyan-400 scale-105 shadow-sm'
                          : 'bg-[#11212D] border-[#253745] hover:bg-[#253745]'
                      }`}
                      title={t.label}
                    >
                      <img src={t.url} alt={t.label} className="w-7 h-7 object-contain" />
                      <span className="text-[9px] text-[#9BA8AB] truncate max-w-full">{t.label}</span>
                    </button>
                  ))}
                </div>
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
              <span>{editingAchievement ? 'Cập Nhật Thành Tựu' : 'Lưu Thành Tựu Vào Hệ Thống'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Existing Achievements Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#CCD0CF] font-rpg tracking-wide">
            Danh Sách Thành Tựu Hệ Thống ({systemAchievements.length})
          </h3>
          <span className="text-xs text-[#9BA8AB]">
            Đồng bộ thời gian thực tới Đại Sảnh Vinh Dự của mọi người dùng
          </span>
        </div>

        {systemAchievements.length === 0 ? (
          <div className="py-12 bg-[#11212D] border border-[#253745] rounded-3xl text-center text-[#9BA8AB] text-sm">
            Chưa có thành tựu động nào được thêm. Hãy bấm "Tạo Thành Tựu Mới"!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemAchievements.map((ach) => (
              <div
                key={ach.id}
                className={`rounded-3xl p-5 bg-[#11212D] border flex flex-col justify-between gap-4 transition shadow-md ${
                  editingAchievement?.id === ach.id
                    ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                    : 'border-[#253745] hover:border-[#4A5C6A]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#06141B] border border-[#253745] p-2 flex items-center justify-center shrink-0 shadow-inner">
                    <img src={ach.icon_url} alt={ach.title} className="w-full h-full object-contain drop-shadow" />
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getRarityBadge(
                        ach.rarity
                      )}`}
                    >
                      {ach.rarity}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#9BA8AB]">
                      {getTypeIcon(ach.achievement_type)}
                      <span>Mục tiêu: {ach.target_value}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">{ach.title}</h4>
                  <p className="text-xs text-[#9BA8AB] line-clamp-2 leading-relaxed">
                    {ach.description || 'Thử thách rèn luyện kỷ luật Thợ Săn.'}
                  </p>
                </div>

                {/* Rewards Bar */}
                <div className="p-2.5 rounded-xl bg-[#06141B] border border-[#253745] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-400 font-bold">+{ach.reward_exp} EXP</span>
                    <span className="text-amber-300 font-bold flex items-center gap-1">
                      <CoinIcon size="xs" />
                      <span>+{ach.reward_coins} Xu</span>
                    </span>
                  </div>

                  {ach.granted_title_name && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
                      👑 {ach.granted_title_name}
                    </span>
                  )}
                </div>

                {/* Actions: Edit & Delete buttons */}
                <div className="pt-2 border-t border-[#253745] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditClick(ach)}
                    className="py-1 px-3 rounded-xl bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sửa</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`Bạn có chắc chắn muốn xóa thành tựu "${ach.title}"?`)) {
                        await deleteSystemAchievement(ach.id);
                        if (editingAchievement?.id === ach.id) {
                          resetForm();
                        }
                      }
                    }}
                    className="py-1 px-3 rounded-xl bg-[#06141B] hover:bg-rose-950/70 border border-[#253745] hover:border-rose-500/50 text-[#9BA8AB] hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
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
