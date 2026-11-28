import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { playSoundEffect } from '../../utils/soundEffects';
import { playSound, AmbientType } from '../../utils/soundEngine';
import { CoinIcon } from '../ui/CoinIcon';
import { InstallAppButton } from '../ui/InstallAppButton';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  MAX_HUNTER_NAME_LENGTH,
  MIN_HUNTER_NAME_LENGTH,
  collapseHunterNameSpaces,
  normalizeStoredHunterName,
  validateHunterName,
} from '../../utils/hunterName';
import {
  Settings,
  X,
  Volume2,
  VolumeX,
  User,
  RotateCcw,
  Download,
  Upload,
  ShieldAlert,
  Sparkles,
  Check,
  Coffee,
  Copy,
  Maximize2,
  Building2,
  QrCode,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Headphones,
  Sliders,
  Swords,
  Flame,
  CloudRain,
  Radio,
  Compass,
  HardDrive,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { startOnboardingTour } from '../../utils/onboardingTour';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    soundEnabled,
    toggleSound,
    soundVolume = 75,
    setSoundVolume,
    focusAmbient = 'rain',
    setFocusAmbient,
    playerName,
    setPlayerName,
    setResetOpen,
    addToast,
    hunterId,
    currentUser,
    signOut,
    cloudSyncStatus,
    lastSyncedAt,
    syncToCloud,
    restoreFromCloud,
    clearAllJournalsAndImages,
  } = useFaeQuestStore();

  const [activeTab, setActiveTab] = useState<'general' | 'data' | 'about'>('general');
  const [editingName, setEditingName] = useState(playerName);
  const [isQrZoomed, setIsQrZoomed] = useState(false);
  const [copiedStk, setCopiedStk] = useState(false);
  const [inputHunterId, setInputHunterId] = useState('');
  const [copiedHunterId, setCopiedHunterId] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [deleteJournalsStep, setDeleteJournalsStep] = useState<0 | 1 | 2>(0);
  const [isDeletingJournals, setIsDeletingJournals] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useBodyScrollLock(isSettingsOpen);

  useEffect(() => {
    setEditingName(playerName);
  }, [playerName, isSettingsOpen]);

  if (!isSettingsOpen || typeof document === 'undefined') return null;

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      // 1. Xóa Service Worker Cache & Dynamic Cache
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((k) => caches.delete(k)));
      }

      // 2. Dọn localStorage an toàn, BẢO TOÀN phiên đăng nhập Supabase và ID Thợ Săn
      if (typeof window !== 'undefined') {
        const preserved: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith('sb-') ||
              key.includes('supabase.auth.token') ||
              key.startsWith('faequest_hunter_id') ||
              key.startsWith('faequest_tour_'))
          ) {
            preserved[key] = localStorage.getItem(key) || '';
          }
        }
        localStorage.clear();
        Object.entries(preserved).forEach(([k, v]) => localStorage.setItem(k, v));
      }

      addToast('✨ Đã dọn sạch bộ nhớ đệm và tối ưu dung lượng thành công!', 'success');
    } catch (err) {
      console.error('Lỗi dọn dẹp cache:', err);
      addToast('Không thể dọn dẹp bộ nhớ đệm, vui lòng thử lại!', 'error');
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleConfirmDeleteJournals = async () => {
    setIsDeletingJournals(true);
    try {
      const ok = await clearAllJournalsAndImages();
      if (ok) {
        setDeleteJournalsStep(0);
      }
    } finally {
      setIsDeletingJournals(false);
    }
  };

  const handleLogout = async () => {
    setSettingsOpen(false);
    await signOut();
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateHunterName(editingName);
    if (!res.valid) {
      addToast(res.error || `Tên Thợ Săn cần từ ${MIN_HUNTER_NAME_LENGTH} đến ${MAX_HUNTER_NAME_LENGTH} ký tự`, 'error');
      return;
    }
    setPlayerName(res.cleanName);
  };

  const handleCopySTK = () => {
    const stk = '6511259236164';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(stk);
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = stk;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedStk(true);
    addToast('Đã sao chép STK: 6511259236164', 'success');
    setTimeout(() => setCopiedStk(false), 3000);
  };

  const handleCopyHunterId = () => {
    if (!hunterId) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(hunterId);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = hunterId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedHunterId(true);
    addToast('Đã sao chép Mã Định Danh Thợ Săn!', 'success');
    setTimeout(() => setCopiedHunterId(false), 3000);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncToCloud(false);
    setIsSyncing(false);
  };

  const handleRestoreFromCloud = async () => {
    if (!inputHunterId.trim()) {
      addToast('Vui lòng nhập Mã Định Danh Thợ Săn để khôi phục!', 'error');
      return;
    }
    setIsRestoring(true);
    const success = await restoreFromCloud(inputHunterId.trim());
    setIsRestoring(false);
    if (success) {
      setInputHunterId('');
    }
  };

  // Export current localStorage data as JSON file
  const handleExportData = () => {
    try {
      const state = useFaeQuestStore.getState();
      const exportObject = {
        playerName: state.playerName,
        exp: state.exp,
        coins: state.coins,
        completedTotal: state.completedTotal,
        streakDays: state.streakDays,
        lastActiveDate: state.lastActiveDate,
        soundEnabled: state.soundEnabled,
        tasks: state.tasks,
        shopItems: state.shopItems,
        inventory: state.inventory,
        rivals: state.rivals,
        systemQuests: state.systemQuests,
        unlockedTitleIds: state.unlockedTitleIds,
        equippedTitleId: state.equippedTitleId,
        focusSessionsCompleted: state.focusSessionsCompleted,
        exportedAt: new Date().toISOString(),
        version: '2.0',
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `FaeQuest_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      addToast('Đã xuất file sao lưu dữ liệu thành công!', 'success');
    } catch (err) {
      addToast('Không thể xuất dữ liệu sao lưu.', 'error');
    }
  };

  // Import JSON backup file
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
          throw new Error('Dữ liệu sao lưu không đúng cấu trúc.');
        }

        useFaeQuestStore.setState({
          playerName: normalizeStoredHunterName(parsed.playerName).name,
          exp: typeof parsed.exp === 'number' ? parsed.exp : 110,
          coins: typeof parsed.coins === 'number' ? parsed.coins : 25,
          completedTotal: typeof parsed.completedTotal === 'number' ? parsed.completedTotal : 2,
          streakDays: typeof parsed.streakDays === 'number' ? parsed.streakDays : 1,
          lastActiveDate: parsed.lastActiveDate || new Date().toISOString().split('T')[0],
          soundEnabled: parsed.soundEnabled ?? true,
          tasks: parsed.tasks,
          shopItems: parsed.shopItems || [],
          inventory: parsed.inventory || [],
          rivals: parsed.rivals || [],
          systemQuests: parsed.systemQuests || undefined,
          unlockedTitleIds: parsed.unlockedTitleIds || ['title_tan_binh_gai_do'],
          equippedTitleId: parsed.equippedTitleId || 'title_tan_binh_gai_do',
          focusSessionsCompleted: typeof parsed.focusSessionsCompleted === 'number' ? parsed.focusSessionsCompleted : 0,
        });

        addToast('Đã phục hồi dữ liệu từ file sao lưu thành công!', 'success');
        setSettingsOpen(false);
      } catch (err) {
        addToast('Lỗi khi đọc file sao lưu. Vui lòng kiểm tra lại file!', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const vietQrFallbackUrl =
    'https://img.vietqr.io/image/VBA-6511259236164-compact2.png?accountName=DOAN%20PHAN%20VINH%20PHU&addInfo=Ung%20ho%20FaeQuest';

  return createPortal(
    <div
      onClick={() => setSettingsOpen(false)}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      className="fixed inset-0 w-screen h-[100dvh] z-[100] bg-[#06141B]/80 backdrop-blur-md touch-none overscroll-none flex items-center justify-center p-3 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rpg-card rounded-2xl sm:rounded-3xl max-w-xl w-[94vw] sm:w-full max-h-[90dvh] flex flex-col overflow-hidden overscroll-contain touch-pan-y border border-[#253745] shadow-2xl relative"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-parchment/10 flex items-center justify-between bg-thorn-dark/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fae to-bargain flex items-center justify-center text-parchment shadow-md border border-fae/40">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-rpg font-bold text-lg sm:text-xl text-parchment">
                Cài Đặt Hệ Thống
              </h3>
              <p className="text-xs text-parchment/70">
                Tùy chỉnh trải nghiệm, âm thanh và quản lý dữ liệu hành trình
              </p>
            </div>
          </div>

          <button
            onClick={() => setSettingsOpen(false)}
            className="text-parchment/40 hover:text-parchment p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-parchment/10 bg-thorn-dark/40 shrink-0">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition ${activeTab === 'general'
              ? 'border-fae text-fae'
              : 'border-transparent text-parchment/60 hover:text-parchment'
              }`}
          >
            Chung & Âm Thanh
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition ${activeTab === 'data'
              ? 'border-fae text-fae'
              : 'border-transparent text-parchment/60 hover:text-parchment'
              }`}
          >
            Sao Lưu & Đặt Lại
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition ${activeTab === 'about'
              ? 'border-fae text-fae'
              : 'border-transparent text-parchment/60 hover:text-parchment'
              }`}
          >
            Thông Tin & Ủng Hộ
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* TAB 1: GENERAL & AUDIO */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Account & Supabase Auth Info Section */}
              {currentUser && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#11212D] via-[#06141B] to-[#253745]/50 border border-[#253745] shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fae to-bargain border border-fae/50 flex items-center justify-center text-parchment shadow">
                        <ShieldCheck className="w-5 h-5 text-parchment" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-rpg font-bold text-sm text-parchment">
                            {currentUser.name || playerName}
                          </h4>
                          <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                            Thợ Săn Đã Ký Khế Ước
                          </span>
                        </div>
                        <p className="text-xs text-parchment/60 font-mono mt-0.5">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-parchment/10 text-xs">
                    <div className="flex items-center gap-1.5 text-parchment/70">
                      <Cloud className="w-3.5 h-3.5 text-fae" />
                      <span>Trạng thái:</span>
                      {cloudSyncStatus === 'synced' ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Đã lưu đám mây {lastSyncedAt ? `(${lastSyncedAt})` : ''}</span>
                        </span>
                      ) : cloudSyncStatus === 'syncing' ? (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Đang đồng bộ...</span>
                        </span>
                      ) : (
                        <span className="text-parchment/60 font-semibold">
                          Sẵn sàng đồng bộ
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setIsSyncing(true);
                          await syncToCloud(false);
                          setIsSyncing(false);
                        }}
                        disabled={isSyncing}
                        className="px-3 py-1.5 rounded-xl bg-opal/40 hover:bg-opal/60 border border-opal/50 text-parchment text-xs font-bold transition flex items-center gap-1.5 shadow disabled:opacity-50"
                        title="Lưu dữ liệu mới nhất lên máy chủ"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-fae ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Đang lưu...' : 'Lưu Ngay'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="px-3 py-1.5 rounded-xl bg-[#253745] hover:bg-rose-950/70 border border-[#4A5C6A] hover:border-rose-500/50 text-[#CCD0CF] hover:text-rose-200 text-xs font-bold transition flex items-center gap-1.5 shadow hover:scale-105 active:scale-95 cursor-pointer"
                        title="Đăng xuất khỏi tài khoản"
                      >
                        <LogOut className="w-3.5 h-3.5 text-[#CCD0CF]" />
                        <span>Đăng Xuất</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Mục: Ứng Dụng & Thiết Bị (Cài Đặt App) */}
              <InstallAppButton variant="settings" />

              {/* Profile Rename Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-parchment/80 flex items-center gap-2">
                    <User className="w-4 h-4 text-fae" />
                    <span>Biệt Danh Nhân Vật</span>
                  </label>
                  <span className="text-[11px] font-mono font-bold text-parchment/60 tabular-nums">
                    {collapseHunterNameSpaces(editingName).length}/{MAX_HUNTER_NAME_LENGTH} ký tự
                  </span>
                </div>
                <form onSubmit={handleSaveName} className="flex gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    minLength={MIN_HUNTER_NAME_LENGTH}
                    maxLength={MAX_HUNTER_NAME_LENGTH}
                    placeholder={`Nhập tên nhân vật (${MIN_HUNTER_NAME_LENGTH}–${MAX_HUNTER_NAME_LENGTH} ký tự)...`}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-thorn-dark border border-opal/40 text-sm text-parchment focus:border-fae focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl rpg-btn-primary font-bold text-xs text-parchment shadow flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu</span>
                  </button>
                </form>
              </div>

              {/* Sound & Audio Effects */}
              <div className="space-y-4 pt-3 border-t border-parchment/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-parchment/80 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>Hiệu Ứng Âm Thanh RPG</span>
                  </label>
                  <button
                    onClick={toggleSound}
                    className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${soundEnabled
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                      : 'bg-[#06141B] text-[#9BA8AB] border border-[#253745]'
                      }`}
                  >
                    {soundEnabled ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Đang Bật</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-[#9BA8AB]" />
                        <span>Đang Tắt</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Master Volume Slider */}
                <div className="p-4 rounded-2xl bg-[#06141B] border border-[#253745] space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#CCD0CF] flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Âm Lượng Tổng Thể:</span>
                    </span>
                    <span className="font-mono font-bold text-cyan-300 px-2 py-0.5 rounded-md bg-[#11212D] border border-[#253745]">
                      {soundVolume}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <VolumeX className="w-4 h-4 text-[#4A5C6A] shrink-0" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={soundVolume}
                      onChange={(e) => setSoundVolume(Number(e.target.value))}
                      className="flex-1 h-2 bg-[#11212D] rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-[#253745]"
                    />
                    <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  </div>
                </div>

                {/* Ambient Focus Sound Default */}
                <div className="p-4 rounded-2xl bg-[#06141B] border border-[#253745] space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#CCD0CF] flex items-center gap-1.5">
                      <Headphones className="w-3.5 h-3.5 text-amber-400" />
                      <span>Âm Nền Mặc Định Cho Fae Focus:</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {[
                      { id: 'rain', label: 'Mưa Cổ Thành', icon: '🌧️' },
                      { id: 'hearth', label: 'Lửa Trại', icon: '🔥' },
                      { id: 'abyss', label: 'Gió Hư Không', icon: '🌌' },
                      { id: 'off', label: 'Tắt Âm Nền', icon: '🔇' },
                    ].map((amb) => {
                      const isSelected = focusAmbient === amb.id;
                      return (
                        <button
                          key={amb.id}
                          type="button"
                          onClick={() => setFocusAmbient(amb.id as AmbientType)}
                          className={`px-2 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${isSelected
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-md'
                            : 'bg-[#11212D] text-[#9BA8AB] hover:text-[#CCD0CF] border-[#253745]'
                            }`}
                        >
                          <span className="text-sm shrink-0">{amb.icon}</span>
                          <span className="whitespace-nowrap">{amb.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hunter Soundboard */}
                <div className="p-4 rounded-2xl bg-[#06141B] border border-[#253745] space-y-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <h4 className="font-rpg font-bold text-xs uppercase tracking-wide text-[#CCD0CF]">
                        🔊 Bảng Thử Hiệu Ứng Âm Thanh
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#9BA8AB]">
                      Bấm vào từng nút để thử trước các hiệu ứng âm thanh sống động trong chuyến phiêu lưu:
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => playSound('quest_medium', true)}
                      className="p-2.5 rounded-xl bg-[#11212D] hover:bg-[#253745] border border-[#253745] hover:border-cyan-400/50 text-left transition active:scale-95 cursor-pointer shadow-sm group"
                      title="Kiếm Thép (Nhiệm Vụ Vừa)"
                    >
                      <div className="text-base group-hover:scale-110 transition">⚔️</div>
                      <div className="font-bold text-xs text-[#CCD0CF] mt-1">Kiếm Thép</div>
                      <div className="text-[10px] text-[#9BA8AB]">Chém gươm & hợp âm thép</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => playSound('quest_boss', true)}
                      className="p-2.5 rounded-xl bg-[#11212D] hover:bg-[#253745] border border-[#253745] hover:border-rose-400/50 text-left transition active:scale-95 cursor-pointer shadow-sm group"
                      title="Hạ Trùm Cuối (Chiêng trận trầm hùng)"
                    >
                      <div className="text-base group-hover:scale-110 transition">👹</div>
                      <div className="font-bold text-xs text-rose-300 mt-1">Hạ Trùm Cuối</div>
                      <div className="text-[10px] text-[#9BA8AB]">Chiêng trận & kèn khải hoàn</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => playSound('rank_up', true)}
                      className="p-2.5 rounded-xl bg-[#11212D] hover:bg-[#253745] border border-[#253745] hover:border-amber-400/50 text-left transition active:scale-95 cursor-pointer shadow-sm group"
                      title="Thăng Rank (Kèn hoàng gia)"
                    >
                      <div className="text-base group-hover:scale-110 transition">👑</div>
                      <div className="font-bold text-xs text-amber-300 mt-1">Thăng Rank</div>
                      <div className="text-[10px] text-[#9BA8AB]">Kèn lệnh & chuông ngân</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => playSound('coin_purchase', true)}
                      className="p-2.5 rounded-xl bg-[#11212D] hover:bg-[#253745] border border-[#253745] hover:border-yellow-400/50 text-left transition active:scale-95 cursor-pointer shadow-sm group"
                      title="Túi Xu Vàng (Mua sắm & nhận thư)"
                    >
                      <div className="text-base group-hover:scale-110 transition">💰</div>
                      <div className="font-bold text-xs text-yellow-300 mt-1">Túi Xu Vàng</div>
                      <div className="text-[10px] text-[#9BA8AB]">Xóc túi xu leng keng</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => playSound('item_use', true)}
                      className="p-2.5 rounded-xl bg-[#11212D] hover:bg-[#253745] border border-[#253745] hover:border-emerald-400/50 text-left transition active:scale-95 cursor-pointer shadow-sm group"
                      title="Thuốc Phép (Kích hoạt túi đồ)"
                    >
                      <div className="text-base group-hover:scale-110 transition">🧪</div>
                      <div className="font-bold text-xs text-emerald-300 mt-1">Thuốc Phép</div>
                      <div className="text-[10px] text-[#9BA8AB]">Sủi bọt & chuông ma pháp</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => playSound('streak_flame', true)}
                      className="p-2.5 rounded-xl bg-[#11212D] hover:bg-[#253745] border border-[#253745] hover:border-orange-400/50 text-left transition active:scale-95 cursor-pointer shadow-sm group"
                      title="Ngọn Đuốc (Điểm danh chuỗi kỷ luật)"
                    >
                      <div className="text-base group-hover:scale-110 transition">🔥</div>
                      <div className="font-bold text-xs text-orange-300 mt-1">Ngọn Đuốc</div>
                      <div className="text-[10px] text-[#9BA8AB]">Đuốc bùng cháy & âm trầm</div>
                    </button>
                  </div>
                </div>

                {/* 📖 Hướng Dẫn & Trợ Giúp Tân Thủ */}
                <div className="p-4 rounded-2xl bg-[#06141B] border border-[#253745] space-y-3">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <h4 className="font-rpg font-bold text-xs uppercase tracking-wide text-[#CCD0CF]">
                      Hướng Dẫn & Trợ Giúp
                    </h4>
                  </div>
                  <p className="text-xs text-[#9BA8AB] leading-relaxed">
                    Xem lại toàn bộ chuỗi hướng dẫn tương tác để nắm rõ các cơ chế nhận EXP, tích lũy Xu Vàng, Fae Focus và tự thưởng trong FaeQuest.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      setTimeout(() => {
                        startOnboardingTour(true);
                      }, 250);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-[#253745] hover:border-[#4A5C6A] bg-[#11212D] hover:bg-[#253745] text-[#CCD0CF] hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-98"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-300" />
                    <span>🔄 Xem Lại Hướng Dẫn Tân Thủ</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA & BACKUP & RESET */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Cloud Sync */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-parchment/80 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-fae" />
                  <span>Đồng Bộ Đám Mây (Lưu Trữ An Toàn)</span>
                </label>

                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#06141B] via-[#11212D] to-[#06141B] border border-[#253745] shadow-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-rpg font-bold text-sm text-parchment">
                        Mã Định Danh Thợ Săn (Sync Code)
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border w-fit ${cloudSyncStatus === 'syncing'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 animate-pulse'
                        : cloudSyncStatus === 'synced'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                          : cloudSyncStatus === 'error'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                            : 'bg-thorn text-parchment/60 border-parchment/20'
                        }`}
                    >
                      {cloudSyncStatus === 'syncing'
                        ? '🔄 Đang đồng bộ...'
                        : cloudSyncStatus === 'synced'
                          ? `✓ Đã đồng bộ: ${lastSyncedAt || 'Vừa xong'}`
                          : cloudSyncStatus === 'error'
                            ? '⚠️ Lỗi đồng bộ'
                            : 'Sẵn sàng'}
                    </span>
                  </div>

                  <p className="text-xs text-parchment/70 leading-relaxed">
                    Mã này đại diện cho nhân vật của bạn trên hệ thống máy chủ. Sử dụng mã này để đồng bộ và tiếp tục hành trình trên máy tính hoặc điện thoại khác.
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 px-3 py-2 rounded-xl bg-thorn font-mono text-xs font-bold text-fae border border-opal/40 select-all truncate">
                      {hunterId}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyHunterId}
                      className="px-3.5 py-2 rounded-xl bg-thorn-dark hover:bg-thorn border border-fae/40 text-xs font-bold text-parchment flex items-center justify-center gap-1.5 transition"
                    >
                      <Copy className="w-3.5 h-3.5 text-fae" />
                      <span>{copiedHunterId ? 'Đã Chép' : 'Sao Chép'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      className="px-4 py-2 rounded-xl rpg-btn-primary text-xs font-bold text-parchment flex items-center justify-center gap-1.5 shadow hover:scale-105 transition disabled:opacity-50"
                    >
                      <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
                      <span>{isSyncing ? 'Đang Đẩy...' : 'Đồng Bộ Ngay'}</span>
                    </button>
                  </div>

                  {/* Khôi Phục Dữ Liệu Bằng Mã Định Danh */}
                  <div className="pt-3 border-t border-parchment/10 space-y-2">
                    <label className="text-[11px] font-bold uppercase text-parchment/80 block">
                      Khôi Phục Dữ Liệu Bằng Mã Định Danh
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={inputHunterId}
                        onChange={(e) => setInputHunterId(e.target.value)}
                        placeholder="Dán mã hunter_xxx..."
                        className="flex-1 px-3 py-2 rounded-xl bg-thorn border border-opal/40 text-xs text-parchment font-mono placeholder-parchment/40 focus:outline-none focus:border-fae"
                      />
                      <button
                        type="button"
                        onClick={handleRestoreFromCloud}
                        disabled={isRestoring}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow disabled:opacity-50"
                      >
                        <CloudDownload className={`w-3.5 h-3.5 ${isRestoring ? 'animate-bounce' : ''}`} />
                        <span>{isRestoring ? 'Đang Khôi Phục...' : 'Tải Dữ Liệu Về Máy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Backup & Restore */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-parchment/80 flex items-center gap-2">
                  <Download className="w-4 h-4 text-opal-light" />
                  <span>Sao Lưu & Phục Hồi Dữ Liệu</span>
                </label>
                <p className="text-xs text-parchment/70 leading-relaxed">
                  Dữ liệu hiện được lưu trên trình duyệt của máy bạn. Bạn có thể xuất file sao lưu để chuyển sang máy khác hoặc dự phòng:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={handleExportData}
                    className="p-3.5 rounded-2xl bg-thorn-dark/90 hover:bg-thorn border border-opal/40 text-left transition flex items-center gap-3 shadow"
                  >
                    <div className="w-9 h-9 rounded-xl bg-opal/30 border border-opal/50 flex items-center justify-center text-opal-light shrink-0">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-parchment">Xuất File Sao Lưu (.json)</p>
                      <p className="text-[11px] text-parchment/60">Tải dữ liệu về máy</p>
                    </div>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3.5 rounded-2xl bg-thorn-dark/90 hover:bg-thorn border border-opal/40 text-left transition flex items-center gap-3 shadow"
                  >
                    <div className="w-9 h-9 rounded-xl bg-fae/30 border border-fae/50 flex items-center justify-center text-fae shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-parchment">Nhập File Khôi Phục</p>
                      <p className="text-[11px] text-parchment/60">Phục hồi từ file .json</p>
                    </div>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportData}
                    accept=".json"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Quản lý Bộ nhớ & Dữ liệu Tài khoản */}
              <div className="space-y-3 pt-4 border-t border-[#253745]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#CCD0CF] flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span>Bộ Nhớ & Dữ Liệu Tài Khoản</span>
                </label>
                <p className="text-xs text-[#9BA8AB] leading-relaxed">
                  Tối ưu dung lượng lưu trữ trên thiết bị, dọn dẹp các tệp bộ nhớ tạm hoặc giải phóng hình ảnh trên đám mây:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Action 1: Dọn dẹp cache */}
                  <div className="p-3.5 rounded-2xl bg-[#06141B] border border-[#253745] flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#CCD0CF]">
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Dọn dẹp bộ nhớ đệm</span>
                      </div>
                      <p className="text-[11px] text-[#9BA8AB] leading-relaxed">
                        Làm sạch dữ liệu đệm tạm thời để ứng dụng luôn nhẹ mượt (không làm mất phiên đăng nhập).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearCache}
                      disabled={isClearingCache}
                      className="w-full py-2 px-3 rounded-xl bg-[#11212D] hover:bg-[#253745] border border-[#4A5C6A] text-xs font-bold text-[#CCD0CF] hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isClearingCache ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                          <span>Đang dọn dẹp...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Dọn Dẹp Ngay</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Action 2: Xóa toàn bộ Nhật ký & Ảnh */}
                  <div className="p-3.5 rounded-2xl bg-[#06141B] border border-amber-500/20 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <Trash2 className="w-4 h-4 text-amber-400" />
                        <span>Xóa toàn bộ Nhật Ký & Ảnh</span>
                      </div>
                      <p className="text-[11px] text-[#9BA8AB] leading-relaxed">
                        Xóa sạch toàn bộ bài viết Nhật Ký và giải phóng 100% dung lượng ảnh đã tải lên kho lưu trữ.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeleteJournalsStep(1)}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa Hết Nhật Ký & Ảnh</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone: Reset Data */}
              <div className="space-y-3 pt-4 border-t border-rose-900/40">
                <label className="block text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Vùng Nguy Hiểm (Đặt Lại Tiến Trình)</span>
                </label>

                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-3">
                  <p className="text-xs text-[#9BA8AB] leading-relaxed">
                    Xóa toàn bộ ảnh cá nhân trên kho lưu trữ, đặt lại điểm EXP, Rank Đồng, xóa toàn bộ nhiệm vụ, lịch sử mua đồ và đưa dữ liệu về ban đầu (yêu cầu nhập chữ <strong className="text-rose-400">XAC NHAN</strong>).
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      setResetOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 border border-rose-400/50 font-bold text-xs text-white flex items-center gap-2 transition shadow-lg cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Đặt Lại Tiến Trình / Xóa Dữ Liệu</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ABOUT & DONATE */}
          {activeTab === 'about' && (
            <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-4 animate-in fade-in duration-200">
              {/* Card 1: App Info */}
              <div className="p-4 rounded-2xl bg-thorn-dark/80 border border-opal/30 space-y-2">
                <div className="flex items-center gap-2.5 text-sm font-bold text-parchment">
                  <div className="w-6 h-6 rounded-md bg-[#06141B] overflow-hidden border border-[#4A5C6A] flex items-center justify-center shrink-0 p-0.5">
                    <img src="/assets/logo.png" alt="FaeQuest" className="w-full h-full object-contain [image-rendering:pixelated]" />
                  </div>
                  <span>FaeQuest — Gamified RPG Todo v2.0</span>
                </div>
                <p className="text-xs text-parchment/70 leading-relaxed">
                  Ứng dụng biến mục tiêu rèn luyện kỷ luật cá nhân mỗi ngày thành hành trình chinh phục đỉnh cao Thách Đấu. Hoàn thành nhiệm vụ, tích lũy EXP, mở khóa Danh Hiệu và tự thưởng xứng đáng.
                </p>
              </div>

              {/* Card 2: Donate / Support Developer */}
              <div className="rounded-2xl border border-[#253745] bg-[#11212D] p-4 sm:p-5 shadow-xl space-y-4 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
                  {/* Left Column: Information, Message, Copy Action */}
                  <div className="space-y-3 flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-fae/20 border border-fae/40 flex items-center justify-center text-fae shrink-0 shadow-sm">
                        <CoinIcon size="sm" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm sm:text-base font-extrabold text-parchment font-rpg tracking-wide">
                          Tiếp Sức Nhà Phát Hành
                        </h4>
                        <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-fae/20 border border-fae/50 text-fae-light uppercase shadow-sm">
                          DONATE
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-parchment/75 leading-relaxed">
                      Nếu <strong className="text-fae-light">FaeQuest</strong> giúp bạn kỷ luật và thăng hạng mỗi ngày, bạn có thể mời tác giả một ly cà phê để duy trì và phát triển thêm tính năng mới!
                    </p>

                    <div className="bg-thorn-dark/90 p-3 sm:p-3.5 rounded-xl border border-opal/30 space-y-1.5 text-xs text-parchment/80">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-parchment/60">Ngân hàng:</span>
                        <span className="font-bold text-parchment flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-fae" />
                          Agribank (CN H. Lấp Vò - Đồng Tháp)
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-parchment/60">Chủ tài khoản:</span>
                        <strong className="text-parchment font-bold">DOAN PHAN VINH PHU</strong>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-parchment/10">
                        <span className="text-parchment/60">Số tài khoản:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-sm text-fae tracking-wider">
                            6511259236164
                          </span>
                          <button
                            type="button"
                            onClick={handleCopySTK}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition ${copiedStk
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                              : 'bg-fae/20 hover:bg-fae/30 text-fae-light border border-fae/40'
                              }`}
                            title="Sao chép số tài khoản"
                          >
                            {copiedStk ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedStk ? 'Đã chép' : 'Sao chép'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: QR Image with Click to Zoom */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div
                      onClick={() => setIsQrZoomed(true)}
                      className="bg-white p-2 rounded-xl shadow-2xl w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center cursor-pointer group hover:scale-105 transition-all duration-300 relative border-2 border-fae/40"
                      title="Nhấn để phóng to mã QR quét chuyển khoản"
                    >
                      <img
                        src="/assets/donate-qr.png"
                        alt="Mã QR Chuyển Khoản Ủng Hộ FaeQuest"
                        className="w-full h-full object-contain rounded-lg"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = vietQrFallbackUrl;
                        }}
                      />
                      <div className="absolute inset-0 bg-thorn-dark/60 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition-opacity text-parchment gap-1 font-bold text-xs">
                        <Maximize2 className="w-4 h-4 text-fae" />
                        <span>Phóng to</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-parchment/60 mt-1.5 flex items-center gap-1">
                      <QrCode className="w-3 h-3 text-fae" />
                      <span>Chạm để phóng to QR</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-thorn-dark/90 border-t border-parchment/10 flex justify-end shrink-0">
          <button
            onClick={() => setSettingsOpen(false)}
            className="px-5 py-2.5 rounded-xl rpg-btn-primary font-bold text-xs text-parchment shadow hover:scale-105 active:scale-95 transition"
          >
            Đóng Cài Đặt
          </button>
        </div>
      </div>

      {/* QR Lightbox / Preview Modal */}
      {isQrZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-thorn-dark/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsQrZoomed(false)}
        >
          <div
            className="rpg-card rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center space-y-4 border-2 border-fae shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsQrZoomed(false)}
              className="absolute top-4 right-4 text-parchment/50 hover:text-parchment p-1 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-2 text-fae">
              <Coffee className="w-5 h-5" />
              <h3 className="font-rpg font-bold text-lg text-parchment">Quét Mã VietQR Ủng Hộ</h3>
            </div>

            <div className="bg-white p-3 rounded-2xl shadow-inner mx-auto max-w-[280px]">
              <img
                src="/assets/donate-qr.png"
                alt="QR Donate Phóng To"
                className="w-full h-auto object-contain rounded-xl"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = vietQrFallbackUrl;
                }}
              />
            </div>

            <div className="text-xs text-parchment/80 space-y-1">
              <p>Chủ tài khoản: <strong className="text-parchment font-bold">DOAN PHAN VINH PHU</strong></p>
              <p>Ngân hàng: <strong className="text-fae font-bold">Agribank</strong> • STK: <strong className="font-mono text-fae">6511259236164</strong></p>
              <p className="text-[11px] text-parchment/60 pt-1">
                Hỗ trợ ứng dụng bất kỳ ngân hàng nào tại Việt Nam qua chuẩn VietQR
              </p>
            </div>

            <button
              onClick={() => setIsQrZoomed(false)}
              className="w-full py-2.5 rounded-xl rpg-btn-primary font-bold text-xs text-parchment shadow"
            >
              Đóng Xem Lại
            </button>
          </div>
        </div>
      )}

      {/* 2-Step Confirmation Modal: Xóa toàn bộ Nhật Ký & Ảnh */}
      {deleteJournalsStep > 0 && (
        <div
          className="fixed inset-0 w-screen h-[100dvh] z-[120] bg-[#06141B]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => !isDeletingJournals && setDeleteJournalsStep(0)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[#11212D] border border-amber-500/40 p-5 sm:p-6 space-y-4 text-center shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center text-amber-300 shadow">
              <AlertTriangle className="w-6 h-6" />
            </div>

            {deleteJournalsStep === 1 ? (
              <>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    Bước 1 / 2
                  </span>
                  <h3 className="font-bold text-base text-[#CCD0CF]">
                    Xác Nhận Xóa Toàn Bộ Nhật Ký?
                  </h3>
                  <p className="text-xs text-[#9BA8AB] leading-relaxed">
                    Toàn bộ bài viết cùng tất cả hình ảnh đính kèm sẽ được xóa sạch trên máy chủ và kho lưu trữ để giải phóng dung lượng.
                  </p>
                </div>

                <div className="flex justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteJournalsStep(0)}
                    className="px-4 py-2 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] text-xs font-semibold text-[#CCD0CF] transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteJournalsStep(2)}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-[#06141B] transition shadow cursor-pointer"
                  >
                    Tiếp Tục ➔
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                    Bước 2 / 2 • Xác Nhận Cuối
                  </span>
                  <h3 className="font-bold text-base text-rose-300">
                    Bạn Có Chắc Chắn 100% Không?
                  </h3>
                  <p className="text-xs text-[#9BA8AB] leading-relaxed">
                    Hành động này <strong className="text-rose-400">KHÔNG THỂ hoàn tác</strong>! Sau khi xóa, tất cả ảnh và bài viết sẽ vĩnh viễn biến mất khỏi đám mây.
                  </p>
                </div>

                <div className="flex justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={isDeletingJournals}
                    onClick={() => setDeleteJournalsStep(1)}
                    className="px-4 py-2 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] text-xs font-semibold text-[#CCD0CF] transition cursor-pointer disabled:opacity-50"
                  >
                    Quay Lại
                  </button>
                  <button
                    type="button"
                    disabled={isDeletingJournals}
                    onClick={handleConfirmDeleteJournals}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-xs font-bold text-white transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isDeletingJournals ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang xóa sạch...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa Sạch Toàn Bộ</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
