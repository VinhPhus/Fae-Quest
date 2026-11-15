import React, { useRef, useState } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { playSoundEffect } from '../../utils/soundEffects';
import { CoinIcon } from '../ui/CoinIcon';
import {
  Settings,
  X,
  Volume2,
  VolumeX,
  User,
  RotateCcw,
  Download,
  Upload,
  Zap,
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
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    soundEnabled,
    toggleSound,
    playerName,
    setPlayerName,
    grantDemoBoost,
    setResetOpen,
    addToast,
    hunterId,
    currentUser,
    signOut,
    cloudSyncStatus,
    lastSyncedAt,
    syncToCloud,
    restoreFromCloud,
  } = useFaeQuestStore();

  const [activeTab, setActiveTab] = useState<'general' | 'data' | 'about'>('general');
  const [editingName, setEditingName] = useState(playerName);
  const [isQrZoomed, setIsQrZoomed] = useState(false);
  const [copiedStk, setCopiedStk] = useState(false);
  const [inputHunterId, setInputHunterId] = useState('');
  const [copiedHunterId, setCopiedHunterId] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isSettingsOpen) return null;

  const handleLogout = async () => {
    setSettingsOpen(false);
    await signOut();
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingName.trim()) {
      setPlayerName(editingName.trim());
    }
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
          playerName: parsed.playerName || 'Thợ Săn Fae',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-thorn-dark/85 backdrop-blur-md">
      <div className="rpg-card rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-fae/50 shadow-2xl relative">
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
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'general'
                ? 'border-fae text-fae'
                : 'border-transparent text-parchment/60 hover:text-parchment'
            }`}
          >
            Chung & Âm Thanh
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'data'
                ? 'border-fae text-fae'
                : 'border-transparent text-parchment/60 hover:text-parchment'
            }`}
          >
            Sao Lưu & Đặt Lại
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'about'
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
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2D1036] via-thorn-dark to-[#6B0733]/50 border border-fae/40 shadow-lg space-y-3">
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
                        title="Đẩy dữ liệu mới nhất lên Supabase"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-fae ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Đang lưu...' : 'Lưu Ngay'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="px-3 py-1.5 rounded-xl bg-[#6B0733] hover:bg-[#850b40] border border-[#D97352] text-parchment text-xs font-bold transition flex items-center gap-1.5 shadow"
                      >
                        <LogOut className="w-3.5 h-3.5 text-fae" />
                        <span>🚪 Đăng Xuất</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Rename Section */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-parchment/80 flex items-center gap-2">
                  <User className="w-4 h-4 text-fae" />
                  <span>Biệt Danh Nhân Vật</span>
                </label>
                <form onSubmit={handleSaveName} className="flex gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    maxLength={30}
                    placeholder="Nhập tên nhân vật..."
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
              <div className="space-y-3 pt-2 border-t border-parchment/10">
                <label className="block text-xs font-bold uppercase tracking-wider text-parchment/80 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-fae" />
                  <span>Hiệu Ứng Âm Thanh RPG (Web Audio Synth)</span>
                </label>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-thorn-dark/80 border border-opal/30">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-parchment">
                      Âm thanh hoàn thành & Thăng Rank
                    </p>
                    <p className="text-xs text-parchment/60">
                      Tự động tạo âm thanh huyền bí khi tích chọn nhiệm vụ, nhận Xu và lên cấp.
                    </p>
                  </div>

                  <button
                    onClick={toggleSound}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      soundEnabled
                        ? 'bg-fae text-thorn-dark shadow-md'
                        : 'bg-thorn text-parchment/50 border border-parchment/20'
                    }`}
                  >
                    {soundEnabled ? (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>Đang Bật</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-4 h-4" />
                        <span>Đang Tắt</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => playSoundEffect('complete', true)}
                    className="px-3 py-1.5 rounded-lg bg-thorn-dark border border-opal/30 text-xs text-opal-light hover:text-parchment transition"
                  >
                    🔊 Nghe thử âm thanh Task
                  </button>
                  <button
                    type="button"
                    onClick={() => playSoundEffect('rankup', true)}
                    className="px-3 py-1.5 rounded-lg bg-thorn-dark border border-fae/30 text-xs text-fae hover:text-parchment transition"
                  >
                    🎺 Nghe thử âm thanh Thăng Rank
                  </button>
                </div>
              </div>

              {/* Developer Test Tools (Hidden neatly in settings) */}
              <div className="space-y-3 pt-2 border-t border-parchment/10">
                <label className="block text-xs font-bold uppercase tracking-wider text-parchment/80 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Công Cụ Thử Nghiệm Nhanh</span>
                </label>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-thorn-dark/60 border border-parchment/10">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-parchment">Cộng Điểm EXP Thử Nghiệm (+150 EXP)</p>
                    <p className="text-[11px] text-parchment/60">Dành để kiểm tra hiệu ứng thăng cấp Rank và bắn pháo hoa mà không cần làm task.</p>
                  </div>
                  <button
                    onClick={() => grantDemoBoost(150)}
                    className="px-3.5 py-2 rounded-xl bg-opal/40 hover:bg-opal/60 border border-opal-light/50 text-xs font-bold text-parchment flex items-center gap-1.5 transition shrink-0 ml-3"
                  >
                    <Zap className="w-3.5 h-3.5 text-fae fill-fae" />
                    <span>+150 EXP</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA & BACKUP & RESET */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Cloud Sync Supabase */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-parchment/80 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-fae" />
                  <span>Đồng Bộ Đám Mây Supabase (Cloud Sync)</span>
                </label>

                <div className="p-4 rounded-2xl bg-gradient-to-r from-thorn-dark via-[#2D1036] to-thorn-dark border border-fae/40 shadow-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-rpg font-bold text-sm text-parchment">
                        Mã Định Danh Thợ Săn (Sync Code)
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border w-fit ${
                        cloudSyncStatus === 'syncing'
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
                    Mã này đại diện cho nhân vật của bạn trên cơ sở dữ liệu Supabase. Sử dụng mã này để đồng bộ và tiếp tục hành trình trên máy tính hoặc điện thoại khác.
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

              {/* Danger Zone: Reset Data */}
              <div className="space-y-3 pt-4 border-t border-rose-900/40">
                <label className="block text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Vùng Nguy Hiểm (Khởi Tạo Lại Hành Trình)</span>
                </label>

                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-3">
                  <p className="text-xs text-parchment/75 leading-relaxed">
                    Xóa toàn bộ tiến độ nhiệm vụ, điểm EXP, bậc Rank, Xu vàng và kho phần thưởng để bắt đầu lại từ đầu như tài khoản mới.
                  </p>

                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      setResetOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 border border-rose-400/50 font-bold text-xs text-white flex items-center gap-2 transition shadow-lg"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Đặt Lại Toàn Bộ Dữ Liệu Gốc</span>
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
                <div className="flex items-center gap-2 text-sm font-bold text-parchment">
                  <Sparkles className="w-4 h-4 text-fae" />
                  <span>FaeQuest — Gamified RPG Todo v2.0</span>
                </div>
                <p className="text-xs text-parchment/70 leading-relaxed">
                  Ứng dụng biến mục tiêu rèn luyện cá nhân mỗi ngày thành hành trình chinh phục đỉnh cao Thách Đấu. Lấy cảm hứng từ bảng màu Dark Fantasy Illustration #7.
                </p>
              </div>

              {/* Card 2: Tech Specs */}
              <div className="p-4 rounded-2xl bg-thorn-dark/60 border border-parchment/10 text-xs text-parchment/60 space-y-1">
                <p>• <strong>Kiến trúc:</strong> React 18 + TypeScript + Vite + Tailwind CSS</p>
                <p>• <strong>State:</strong> Zustand + LocalStorage Persist Middleware</p>
                <p>• <strong>Âm thanh:</strong> Web Audio API Native Synthesizer</p>
                <p>• <strong>Bảo mật:</strong> 100% dữ liệu lưu trữ phía client trên trình duyệt người dùng</p>
              </div>

              {/* Card 3: Donate / Support Developer */}
              <div className="rounded-2xl border border-[#D97352]/40 bg-gradient-to-br from-[#2D1036]/90 via-[#3E174B]/40 to-[#6B0733]/30 p-4 sm:p-5 shadow-xl space-y-4 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
                  {/* Left Column: Information, Message, Copy Action */}
                  <div className="space-y-3 flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-fae/20 border border-fae/40 flex items-center justify-center text-fae">
                        <CoinIcon size="sm" />
                      </div>
                      <h4 className="text-base font-extrabold text-parchment font-rpg tracking-wide flex items-center gap-1.5">
                        <span>Tiếp Sức Nhà Phát Hành</span>
                        <span className="text-fae">(Donate)</span>
                      </h4>
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
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition ${
                              copiedStk
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
        <div className="p-4 bg-thorn-dark/90 border-t border-parchment/10 flex items-center justify-between shrink-0">
          {currentUser ? (
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-[#6B0733] hover:bg-[#850b40] border border-[#D97352] font-bold text-xs text-parchment flex items-center gap-1.5 shadow hover:scale-105 transition"
              title="Lưu dữ liệu và đăng xuất an toàn"
            >
              <LogOut className="w-4 h-4 text-fae" />
              <span>🚪 Đăng Xuất Tài Khoản</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={() => setSettingsOpen(false)}
            className="px-5 py-2.5 rounded-xl rpg-btn-primary font-bold text-xs text-parchment shadow"
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
    </div>
  );
};
