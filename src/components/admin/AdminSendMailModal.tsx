import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { AdminUserOverview, MailRewardItem } from '../../types';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  Mail,
  X,
  Send,
  AlertTriangle,
  Bell,
  Gift,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Coins,
  Star,
  Package,
} from 'lucide-react';

interface Props {
  user: AdminUserOverview | null;
  onClose: () => void;
  defaultType?: 'warning' | 'notice' | 'gift';
  defaultSubject?: string;
  defaultContent?: string;
}

export const AdminSendMailModal: React.FC<Props> = ({
  user,
  onClose,
  defaultType = 'warning',
  defaultSubject = '',
  defaultContent = '',
}) => {
  const { adminSendMail, addToast, systemShopItems, fetchSystemShopItems } = useFaeQuestStore();

  const [messageType, setMessageType] = useState<'warning' | 'notice' | 'gift'>(defaultType);
  const [subject, setSubject] = useState<string>(
    defaultSubject || (defaultType === 'warning' ? 'Cảnh báo hoạt động bất thường' : 'Thông báo từ Ban Quản Trị')
  );
  const [content, setContent] = useState<string>(defaultContent);
  const [sending, setSending] = useState<boolean>(false);

  // Rewards state
  const [isRewardsOpen, setIsRewardsOpen] = useState<boolean>(defaultType === 'gift');
  const [rewardExp, setRewardExp] = useState<number | ''>(0);
  const [rewardCoins, setRewardCoins] = useState<number | ''>(0);
  const [rewardStars, setRewardStars] = useState<number | ''>(0);
  const [rewardItems, setRewardItems] = useState<MailRewardItem[]>([]);

  // Item selector state
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number | ''>(1);

  useEffect(() => {
    fetchSystemShopItems();
  }, [fetchSystemShopItems]);

  useEffect(() => {
    if (systemShopItems.length > 0 && !selectedItemId) {
      setSelectedItemId(systemShopItems[0].id);
    }
  }, [systemShopItems, selectedItemId]);

  useBodyScrollLock(!!user);

  if (!user) return null;

  const applyTemplate = (type: 'warning' | 'contract' | 'gift') => {
    if (type === 'warning') {
      setMessageType('warning');
      setSubject('⚠️ Cảnh báo: Phát hiện tần suất hoàn thành nhiệm vụ bất thường');
      setContent(
        `Chào Thợ Săn ${user.username},\n\nHệ thống Live-Ops vừa ghi nhận tài khoản của bạn có chuỗi hoàn thành nhiệm vụ hoặc tích lũy EXP với tốc độ bất thường trong thời gian ngắn.\n\nFaeQuest được tạo ra nhằm rèn luyện tính kỷ luật và phát triển bản thân thực thụ, không phải để chạy đua bằng thủ thuật spam. Vui lòng điều chỉnh lại tốc độ để bảo vệ uy danh Thợ Săn của mình.`
      );
    } else if (type === 'contract') {
      setMessageType('notice');
      setSubject('📜 Nhắc nhở tinh thần Khế Ước Thợ Săn');
      setContent(
        `Chào Thợ Săn ${user.username},\n\nBan Quản Trị gửi lời chào thân ái. Hãy nhớ rằng mỗi nhiệm vụ hoàn thành là một bước tiến của bạn ngoài đời thực. Hãy tập trung vào chất lượng công việc và duy trì chuỗi kỷ luật bền bỉ mỗi ngày nhé!`
      );
    } else if (type === 'gift') {
      setMessageType('gift');
      setIsRewardsOpen(true);
      setSubject('🎁 Quà Tặng Động Viên Từ Ban Quản Trị');
      setContent(
        `Chào Thợ Săn ${user.username},\n\nBan Quản Trị đánh giá cao tinh thần nỗ lực và sự kiên trì của bạn tại FaeQuest. Chúc bạn tiếp tục gặt hái nhiều thành tựu rực rỡ trên Đấu Trường!`
      );
      if (rewardExp === 0 && rewardCoins === 0) {
        setRewardExp(100);
        setRewardCoins(25);
      }
    }
  };

  const handleSelectMessageType = (type: 'warning' | 'notice' | 'gift') => {
    setMessageType(type);
    if (type === 'gift') {
      setIsRewardsOpen(true);
    }
  };

  const handleAttachItem = () => {
    if (!selectedItemId) {
      addToast('Vui lòng chọn vật phẩm từ Cửa Hàng Hệ Thống', 'error');
      return;
    }
    const item = systemShopItems.find((s) => s.id === selectedItemId);
    if (!item) return;

    const qty = Math.max(1, typeof selectedQuantity === 'number' ? selectedQuantity : 1);
    setRewardItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, count: p.count + qty } : p
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          icon: item.icon,
          cost: item.cost,
          count: qty,
          description: item.description,
        },
      ];
    });
    setSelectedQuantity(1);
  };

  const handleRemoveAttachedItem = (id: string) => {
    setRewardItems((prev) => prev.filter((p) => p.id !== id));
  };

  const expNum = typeof rewardExp === 'number' ? rewardExp : 0;
  const coinsNum = typeof rewardCoins === 'number' ? rewardCoins : 0;
  const starsNum = typeof rewardStars === 'number' ? rewardStars : 0;
  const totalItemsCount = rewardItems.reduce((acc, it) => acc + (it.count || 1), 0);
  const hasRewards = expNum > 0 || coinsNum > 0 || starsNum > 0 || rewardItems.length > 0;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      addToast('Vui lòng điền đầy đủ tiêu đề và nội dung thư', 'error');
      return;
    }

    setSending(true);
    try {
      const success = await adminSendMail(
        user.id,
        subject.trim(),
        content.trim(),
        messageType,
        expNum,
        coinsNum,
        starsNum,
        rewardItems
      );
      if (success) {
        addToast(
          hasRewards
            ? `🎁 Đã gửi thư kèm quà tặng tới Thợ Săn "${user.username}" thành công!`
            : `Đã gửi thư tới Thợ Săn "${user.username}"`,
          'success'
        );
        onClose();
      }
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-[100dvh] z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#06141B]/80 backdrop-blur-md animate-in fade-in duration-200 touch-none overscroll-none"
      onClick={onClose}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div
        className="relative w-full max-w-xl bg-[#11212D] border border-[#253745] rounded-3xl shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden text-[#CCD0CF] overscroll-contain touch-pan-y"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#253745] flex items-center justify-between bg-[#06141B]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shadow-inner">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-rpg tracking-wide">
                Gửi Thư / Cảnh Báo Trực Tiếp
              </h3>
              <p className="text-xs text-[#9BA8AB]">
                Gửi tới Thợ Săn: <span className="text-amber-300 font-bold">{user.username}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#9BA8AB] hover:text-white hover:bg-[#253745] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[70vh] no-scrollbar">
          {/* Quick Templates Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#9BA8AB] block">
              Mẫu Thư Nhanh
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyTemplate('warning')}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition cursor-pointer flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Cảnh báo bất thường</span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('contract')}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition cursor-pointer flex items-center gap-1.5"
              >
                <Bell className="w-3 h-3" />
                <span>Tinh thần Khế Ước</span>
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('gift')}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer flex items-center gap-1.5"
              >
                <Gift className="w-3 h-3" />
                <span>Khen thưởng (+Quà)</span>
              </button>
            </div>
          </div>

          {/* Message Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#9BA8AB] block">
              Loại Thư
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'warning', label: 'Cảnh Báo', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                { id: 'notice', label: 'Thông Báo', icon: <Bell className="w-3.5 h-3.5" /> },
                { id: 'gift', label: 'Quà Tặng', icon: <Gift className="w-3.5 h-3.5" /> },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectMessageType(t.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
                    messageType === t.id
                      ? 'bg-[#CCD0CF] text-[#06141B] border-white shadow-sm'
                      : 'bg-[#06141B] text-[#9BA8AB] border-[#253745] hover:text-[#CCD0CF]'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#9BA8AB] block">
              Tiêu Đề Thư
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Nhập tiêu đề thư..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#06141B] border border-[#253745] text-xs sm:text-sm text-[#CCD0CF] focus:outline-none focus:border-[#4A5C6A] transition"
              required
            />
          </div>

          {/* Content Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#9BA8AB] block">
              Nội Dung Thư
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung nhắc nhở hoặc chỉ thị..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#06141B] border border-[#253745] text-xs sm:text-sm text-[#CCD0CF] focus:outline-none focus:border-[#4A5C6A] transition resize-none leading-relaxed"
              required
            />
            {messageType === 'warning' && (
              <p className="text-[11px] text-amber-400/90 italic">
                * Thư loại Cảnh Báo sẽ tự động bật Modal trang trọng trên màn hình của người dùng khi họ mở ứng dụng.
              </p>
            )}
          </div>

          {/* Expandable Reward Attachment Section */}
          <div className="border border-[#253745] rounded-2xl bg-[#06141B]/60 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsRewardsOpen(!isRewardsOpen)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#253745]/30 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-[#CCD0CF] tracking-wide">
                  🎁 Đính Kèm Phần Thưởng
                </span>
                {hasRewards && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                    Đã chọn quà
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#9BA8AB]">
                <span>{isRewardsOpen ? 'Thu gọn' : 'Tùy chỉnh'}</span>
                {isRewardsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isRewardsOpen && (
              <div className="p-4 pt-1 border-t border-[#253745] space-y-4">
                {/* Row 1: 3 Stat Input Fields (EXP, Xu Vàng, Sao Vinh Dự) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* EXP */}
                  <div className="p-2.5 rounded-xl bg-[#11212D] border border-[#253745] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#9BA8AB]">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Điểm EXP</span>
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={rewardExp}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') setRewardExp('');
                        else {
                          const parsed = parseInt(val, 10);
                          setRewardExp(isNaN(parsed) ? '' : parsed);
                        }
                      }}
                      onBlur={() => {
                        if (rewardExp === '' || rewardExp < 0) setRewardExp(0);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#06141B] border border-[#253745] text-xs font-mono font-bold text-[#CCD0CF] focus:outline-none focus:border-cyan-500/50"
                      placeholder="0"
                    />
                    <div className="flex items-center gap-1 pt-0.5">
                      {[50, 100, 300].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setRewardExp((prev) => (typeof prev === 'number' ? prev + v : v))}
                          className="flex-1 py-0.5 text-[10px] font-semibold bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] rounded transition cursor-pointer"
                        >
                          +{v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Xu Vàng */}
                  <div className="p-2.5 rounded-xl bg-[#11212D] border border-[#253745] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#9BA8AB]">
                      <span className="flex items-center gap-1 text-amber-300">
                        <Coins className="w-3.5 h-3.5" />
                        <span>Xu Vàng</span>
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={rewardCoins}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') setRewardCoins('');
                        else {
                          const parsed = parseInt(val, 10);
                          setRewardCoins(isNaN(parsed) ? '' : parsed);
                        }
                      }}
                      onBlur={() => {
                        if (rewardCoins === '' || rewardCoins < 0) setRewardCoins(0);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#06141B] border border-[#253745] text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500/50"
                      placeholder="0"
                    />
                    <div className="flex items-center gap-1 pt-0.5">
                      {[10, 25, 50].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setRewardCoins((prev) => (typeof prev === 'number' ? prev + v : v))}
                          className="flex-1 py-0.5 text-[10px] font-semibold bg-[#253745] hover:bg-[#4A5C6A] text-amber-300 rounded transition cursor-pointer"
                        >
                          +{v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sao Vinh Dự */}
                  <div className="p-2.5 rounded-xl bg-[#11212D] border border-[#253745] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#9BA8AB]">
                      <span className="flex items-center gap-1 text-yellow-300">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span>Sao Vinh Dự</span>
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={rewardStars}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') setRewardStars('');
                        else {
                          const parsed = parseInt(val, 10);
                          setRewardStars(isNaN(parsed) ? '' : parsed);
                        }
                      }}
                      onBlur={() => {
                        if (rewardStars === '' || rewardStars < 0) setRewardStars(0);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#06141B] border border-[#253745] text-xs font-mono font-bold text-yellow-300 focus:outline-none focus:border-yellow-500/50"
                      placeholder="0"
                    />
                    <div className="flex items-center gap-1 pt-0.5">
                      {[1, 3, 5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setRewardStars((prev) => (typeof prev === 'number' ? prev + v : v))}
                          className="flex-1 py-0.5 text-[10px] font-semibold bg-[#253745] hover:bg-[#4A5C6A] text-yellow-300 rounded transition cursor-pointer"
                        >
                          +{v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 2: Attach System Shop Items */}
                <div className="p-3 rounded-xl bg-[#11212D] border border-[#253745] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#CCD0CF] flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#9BA8AB]" />
                      <span>Đính Kèm Vật Phẩm từ Cửa Hàng Hệ Thống</span>
                    </label>
                  </div>

                  {systemShopItems.length === 0 ? (
                    <p className="text-xs text-[#9BA8AB]/70 italic">
                      Chưa có vật phẩm hệ thống nào. Bạn có thể thêm trong tab Cửa Hàng Admin.
                    </p>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <select
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        className="flex-1 w-full px-3 py-2 rounded-xl bg-[#06141B] border border-[#253745] text-xs text-[#CCD0CF] focus:outline-none focus:border-[#4A5C6A]"
                      >
                        {systemShopItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.icon} {item.name} ({item.cost} Xu)
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={selectedQuantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') setSelectedQuantity('');
                            else {
                              const parsed = parseInt(val, 10);
                              setSelectedQuantity(isNaN(parsed) ? '' : parsed);
                            }
                          }}
                          onBlur={() => {
                            if (selectedQuantity === '' || selectedQuantity < 1) setSelectedQuantity(1);
                            else if (selectedQuantity > 10) setSelectedQuantity(10);
                          }}
                          className="w-16 px-2.5 py-2 rounded-xl bg-[#06141B] border border-[#253745] text-xs font-mono text-center text-[#CCD0CF] focus:outline-none focus:border-[#4A5C6A]"
                          title="Số lượng"
                        />
                        <button
                          type="button"
                          onClick={handleAttachItem}
                          className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-[#4A5C6A]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Đính kèm</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Attached Items Chip List */}
                  {rewardItems.length > 0 && (
                    <div className="pt-2 border-t border-[#253745]/60 flex flex-wrap gap-2">
                      {rewardItems.map((item) => (
                        <div
                          key={item.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#06141B] border border-[#4A5C6A] text-xs font-semibold text-[#CCD0CF] shadow-sm animate-in fade-in"
                        >
                          <span>{item.icon}</span>
                          <span>{item.name}</span>
                          <span className="font-mono text-amber-300 font-bold">x{item.count}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachedItem(item.id)}
                            className="p-0.5 ml-1 rounded-md text-[#9BA8AB] hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Gỡ vật phẩm này"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Package Preview Banner */}
          {hasRewards && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#11212D] to-cyan-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2 shadow-sm animate-in fade-in">
              <Package className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="font-bold">📦 Gói quà đính kèm: </span>
                <span className="font-mono text-white">
                  {expNum > 0 && `+${expNum} EXP • `}
                  {coinsNum > 0 && `+${coinsNum} Xu • `}
                  {starsNum > 0 && `+${starsNum} Sao • `}
                  {totalItemsCount > 0 ? `${totalItemsCount} Vật phẩm` : ''}
                </span>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#253745]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#06141B] hover:bg-[#253745] text-xs font-semibold text-[#9BA8AB] transition cursor-pointer border border-[#253745]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2 rounded-xl bg-[#CCD0CF] hover:bg-white text-[#06141B] text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Đang gửi...' : 'Gửi Thư'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
