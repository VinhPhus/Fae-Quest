import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { CoinIcon } from '../ui/CoinIcon';
import { Sparkles, ShoppingBag, Plus, Trash2, Backpack, Ticket, Loader2 } from 'lucide-react';
import { EASING_SPRING } from '../../constants/motion';
import { InventoryTicket } from '../../types';
import { FlyToBagOverlay } from './FlyToBagOverlay';
import {
  registerFloatingBagTarget,
  registerHeaderBagTarget,
  setHeaderBagVisibility,
  subscribeBagHits,
  triggerShopFlyToBag,
} from './shopFlyBridge';
import './ShopFlyFX.css';

/**
 * Header for Unified Shop & Inventory Page
 * Contains Switcher Tabs: "🛒 Cửa Hàng" & "🎒 Túi Đồ của tôi (X/50)"
 */
export const RewardShopHeader: React.FC = () => {
  const {
    coins,
    setAddShopItemOpen,
    exp,
    inventory,
    shopSubTab,
    setShopSubTab,
  } = useFaeQuestStore();

  const currentRankIdx = getRankIndexByExp(exp);
  const currentTier = RANK_TIERS[currentRankIdx];

  const now = Date.now();
  const validUnusedInventoryCount = inventory.filter(
    (i) => !i.used && (!i.expiresAt || i.expiresAt > now)
  ).length;

  const headerBagBtnRef = useRef<HTMLButtonElement | null>(null);
  const floatingBagBtnRef = useRef<HTMLButtonElement | null>(null);
  const [isHeaderBagVisible, setIsHeaderBagVisible] = useState<boolean>(true);
  const [isBagHit, setIsBagHit] = useState<boolean>(false);
  const [walletFlash, setWalletFlash] = useState<boolean>(false);
  const prevCoinsRef = useRef<number>(coins);
  const hitTimerRef = useRef<number | null>(null);

  // Theo dõi khi nút Túi Đồ trên Header cuộn khuất màn hình -> bật Floating Mini Bag
  useEffect(() => {
    const btn = headerBagBtnRef.current;
    registerHeaderBagTarget(btn);

    if (!btn || typeof IntersectionObserver === 'undefined') {
      setHeaderBagVisibility(true);
      setIsHeaderBagVisible(true);
      return () => registerHeaderBagTarget(null);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const visible = Boolean(entry?.isIntersecting);
        setIsHeaderBagVisible(visible);
        setHeaderBagVisibility(visible);
      },
      { threshold: 0.1 }
    );
    observer.observe(btn);

    return () => {
      observer.disconnect();
      registerHeaderBagTarget(null);
    };
  }, []);

  // Đăng ký nút Túi Đồ tròn nổi cho hệ thống FlyToBag
  const showFloatingMiniBag = !isHeaderBagVisible && shopSubTab === 'shop';
  useEffect(() => {
    registerFloatingBagTarget(showFloatingMiniBag ? floatingBagBtnRef.current : null);
    return () => registerFloatingBagTarget(null);
  }, [showFloatingMiniBag]);

  // Kích hoạt rung lắc túi & nảy badge đúng khoảnh khắc vật phẩm chạm đích
  useEffect(() => {
    const unsub = subscribeBagHits(() => {
      if (hitTimerRef.current) {
        window.clearTimeout(hitTimerRef.current);
      }
      setIsBagHit(false);
      requestAnimationFrame(() => {
        setIsBagHit(true);
        hitTimerRef.current = window.setTimeout(() => {
          setIsBagHit(false);
        }, 620);
      });
    });

    return () => {
      unsub();
      if (hitTimerRef.current) {
        window.clearTimeout(hitTimerRef.current);
      }
    };
  }, []);

  // Ánh nháy nhẹ trên dòng Số dư ví khi Xu Vàng giảm xuống
  useEffect(() => {
    if (coins < prevCoinsRef.current) {
      setWalletFlash(false);
      requestAnimationFrame(() => {
        setWalletFlash(true);
      });
      const timer = window.setTimeout(() => setWalletFlash(false), 580);
      prevCoinsRef.current = coins;
      return () => window.clearTimeout(timer);
    }
    prevCoinsRef.current = coins;
  }, [coins]);

  return (
    <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-[#11212D] border border-[#253745] flex flex-col gap-4 shadow-xl">
      {/* Hàng 1: Tiêu đề + Cụm Switcher Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06141B] border border-[#4A5C6A] text-xs font-bold text-[#CCD0CF]">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Thương Hội & Túi Đồ Tự Thưởng</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#253745] border border-[#4A5C6A] text-[11px] font-extrabold text-[#CCD0CF]">
              <img src={currentTier.iconUrl} alt={currentTier.name} className="w-3.5 h-3.5 object-contain [image-rendering:pixelated]" />
              <span>{currentTier.name.toUpperCase()}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#CCD0CF] font-rpg tracking-wide">
            {shopSubTab === 'shop' ? 'Cửa Hàng Tự Thưởng Bản Thân' : 'Túi Đồ Thợ Săn'}
          </h2>
          <p className="text-xs text-[#9BA8AB] max-w-2xl leading-relaxed hidden sm:block">
            {shopSubTab === 'shop'
              ? 'Dùng Xu Vàng tích lũy từ nhiệm vụ để đổi lấy những phần thưởng xứng đáng ngoài đời thực!'
              : 'Nơi cất giữ các vật phẩm tự thưởng bạn đã quy đổi bằng Xu Vàng. Hãy kích hoạt sử dụng trước khi hết hạn!'}
          </p>
        </div>

        {/* 2 Switcher Tabs: Cửa Hàng vs Túi Đồ */}
        <div className="flex items-center p-1 rounded-2xl bg-[#06141B] border border-[#253745] shadow-inner self-stretch sm:self-auto justify-center">
          {/* Tab 1: Cửa Hàng */}
          <button
            type="button"
            onClick={() => setShopSubTab('shop')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all relative cursor-pointer ${
              shopSubTab === 'shop'
                ? 'text-[#CCD0CF]'
                : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
            }`}
          >
            {shopSubTab === 'shop' && (
              <motion.div
                layoutId="activeShopSubTab"
                className="absolute inset-0 rounded-xl bg-[#253745] border border-[#4A5C6A] shadow-md z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Cửa Hàng</span>
            </span>
          </button>

          {/* Tab 2: Túi Đồ */}
          <button
            ref={headerBagBtnRef}
            id="tour-inventory"
            type="button"
            onClick={() => setShopSubTab('inventory')}
            className={`u442-target ${isBagHit ? 'is-hit' : ''} px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all relative cursor-pointer ${
              shopSubTab === 'inventory'
                ? 'text-[#CCD0CF]'
                : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
            }`}
          >
            {shopSubTab === 'inventory' && (
              <motion.div
                layoutId="activeShopSubTab"
                className="absolute inset-0 rounded-xl bg-[#253745] border border-[#4A5C6A] shadow-md z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Backpack className="u442-bag-ic w-4 h-4 text-[#CCD0CF] shrink-0" />
              <span>Túi Đồ ({inventory.length}/50)</span>
              {validUnusedInventoryCount > 0 && (
                <span className="u442-bag-badge px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-500 text-white shadow-sm border border-[#06141B] animate-pulse">
                  {validUnusedInventoryCount}
                </span>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Hàng 2: Thanh Thông Số Chi Tiết Phụ Thuộc Vào Tab Đang Chọn */}
      <div className="pt-3 border-t border-[#253745]/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {shopSubTab === 'shop' ? (
          <>
            <div className="flex items-center gap-2.5">
              <CoinIcon size="md" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs text-[#9BA8AB]">Số dư ví:</span>
                <span
                  className={`text-lg font-black text-amber-300 font-rpg inline-block tabular-nums ${
                    walletFlash ? 'u442-coin-flash' : ''
                  }`}
                >
                  {coins.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-[#CCD0CF]">Xu Vàng</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAddShopItemOpen(true)}
              className="px-4 py-2 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(204,208,207,0.2)] active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Thêm Món Tự Thưởng</span>
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#06141B] border border-[#253745] text-xs font-bold shadow-inner">
                <span className="text-[#9BA8AB]">Sức chứa túi đồ:</span>
                <span
                  className={
                    inventory.length >= 50
                      ? 'text-rose-400 font-black'
                      : inventory.length >= 40
                      ? 'text-amber-400 font-black'
                      : 'text-[#CCD0CF] font-black'
                  }
                >
                  {inventory.length} / 50 ô
                </span>
              </div>
              <span className="text-xs text-[#9BA8AB] hidden sm:inline">
                • {validUnusedInventoryCount} vật phẩm sẵn sàng sử dụng
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShopSubTab('shop')}
              className="px-4 py-2 rounded-full bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-[#CCD0CF] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-amber-300" />
              <span>Ghé Cửa Hàng Mua Thêm</span>
            </button>
          </>
        )}
      </div>

      {/* Floating Mini Bag (#442) — tự trượt hiện khi cuộn khuất nút Túi Đồ gốc */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showFloatingMiniBag && (
              <motion.button
                ref={floatingBagBtnRef}
                type="button"
                initial={{ opacity: 0, scale: 0.72, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.76, y: 10 }}
                transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                onClick={() => setShopSubTab('inventory')}
                aria-label={`Mở Túi Đồ (${inventory.length}/50)`}
                title={`Mở Túi Đồ (${inventory.length}/50)`}
                className={`u442-cart u442-target ${
                  isBagHit ? 'is-hit' : ''
                } fixed z-[65] bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-4 md:bottom-auto md:top-6 md:right-7`}
              >
                <Backpack className="u442-bag-ic w-5 h-5 text-amber-300" />
                {validUnusedInventoryCount > 0 && (
                  <span className="u442-bag-badge absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#06141B] shadow-md">
                    {validUnusedInventoryCount}
                  </span>
                )}
              </motion.button>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

/**
 * Unified Body Grid: Renders Shop items or Inventory tickets depending on shopSubTab
 */
export const RewardShopGrid: React.FC = () => {
  const {
    shopItems,
    systemShopItems,
    coins,
    inventory,
    purchasingShopItemIds,
    buyShopItem,
    deleteShopItem,
    useInventoryTicket,
    shopSubTab,
    setShopSubTab,
  } = useFaeQuestStore();

  const [usingTicketId, setUsingTicketId] = useState<string | null>(null);
  const itemIconRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isInventoryFull = inventory.length >= 50;

  // Ghép nối vật phẩm hệ thống do Admin thiết lập và các vật phẩm tự thưởng cá nhân
  const allShopItems = [
    ...systemShopItems.map((sys) => ({
      id: `sys_${sys.id}`,
      title: sys.name,
      desc: sys.description,
      cost: sys.cost,
      emoji: sys.icon,
      isSystem: true,
    })),
    ...shopItems.map((item) => ({
      ...item,
      isSystem: false,
    })),
  ];

  const handleUseTicket = (id: string) => {
    setUsingTicketId(id);
    setTimeout(() => {
      useInventoryTicket(id);
      setUsingTicketId(null);
    }, 250);
  };

  const formatItemTimeStatus = (item: InventoryTicket) => {
    const now = Date.now();

    let purchaseTime = '';
    if (item.purchasedAt) {
      purchaseTime = new Date(item.purchasedAt).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (item.redeemedAt) {
      purchaseTime = item.redeemedAt;
    } else {
      purchaseTime = 'Gần đây';
    }

    const expiresAt = item.expiresAt || ((item.purchasedAt || now) + 7 * 24 * 60 * 60 * 1000);
    const timeLeftMs = expiresAt - now;

    if (timeLeftMs <= 0) {
      return (
        <span className="text-rose-400 font-semibold text-xs inline-flex items-center gap-1">
          <span>🕒 Đổi lúc: {purchaseTime} • Đã hết hạn</span>
        </span>
      );
    }

    const hoursLeft = Math.ceil(timeLeftMs / (60 * 60 * 1000));
    const daysLeft = Math.ceil(timeLeftMs / (24 * 60 * 60 * 1000));

    if (timeLeftMs < 24 * 60 * 60 * 1000) {
      return (
        <span className="text-xs text-[#9BA8AB] inline-flex items-center gap-1">
          <span>🕒 Đổi lúc: {purchaseTime} •</span>
          <span className="text-amber-300 font-bold">Hạn dùng: còn {hoursLeft} giờ</span>
        </span>
      );
    }

    return (
      <span className="text-xs text-[#9BA8AB] inline-flex items-center gap-1">
        <span>🕒 Đổi lúc: {purchaseTime} •</span>
        <span className="text-[#CCD0CF]">Hạn dùng: còn {daysLeft} ngày</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* ================= TAB 1: CỬA HÀNG ================= */}
        {shopSubTab === 'shop' && (
          <motion.div
            key="shop-tab"
            id="tour-shop-items"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: EASING_SPRING }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {allShopItems.map((item) => {
              const canAfford = coins >= item.cost;
              const isPurchasing = purchasingShopItemIds.includes(item.id);
              const isItemIconUrl =
                item.emoji.startsWith('http') || item.emoji.startsWith('/') || item.emoji.startsWith('data:');

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`rounded-[28px] p-5 bg-[#11212D] border transition-colors duration-200 shadow-md group flex flex-col justify-between gap-4 ${
                    item.isSystem
                      ? 'border-amber-500/30 hover:border-amber-500/60'
                      : 'border-[#253745] hover:border-[#4A5C6A]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      ref={(el) => {
                        itemIconRefs.current[item.id] = el;
                      }}
                      className="w-14 h-14 rounded-2xl bg-[#06141B] border border-[#253745] group-hover:border-[#4A5C6A] flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition overflow-hidden p-1"
                    >
                      {isItemIconUrl ? (
                        <img src={item.emoji} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <span>{item.emoji}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {item.isSystem && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[9px] font-extrabold text-amber-300 uppercase tracking-wider">
                          🏛️ Vật Phẩm Hệ Thống
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full bg-[#06141B] border border-[#253745] text-sm font-extrabold text-amber-300 flex items-center gap-1.5 shadow-sm">
                        <CoinIcon size="sm" />
                        <span>{item.cost} Xu</span>
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-[#CCD0CF]">{item.title}</h4>
                    <p className="text-xs text-[#9BA8AB] mt-1 leading-relaxed">
                      {item.desc || 'Phần thưởng xứng đáng cho nỗ lực của bạn.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#253745] flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!canAfford || isInventoryFull || isPurchasing) return;
                        const sourceEl = itemIconRefs.current[item.id];
                        const ok = await buyShopItem(item.id);
                        if (ok) {
                          triggerShopFlyToBag({
                            sourceEl,
                            emoji: item.emoji,
                            title: item.title,
                            isSystem: Boolean(item.isSystem),
                          });
                        }
                      }}
                      disabled={!canAfford || isInventoryFull || isPurchasing}
                      className={`u442-buy-btn flex-1 py-2.5 px-4 rounded-full font-extrabold text-xs flex items-center justify-center gap-1.5 ${
                        canAfford && !isInventoryFull
                          ? 'bg-[#CCD0CF] hover:bg-white text-[#06141B] shadow-[0_4px_16px_rgba(204,208,207,0.2)] cursor-pointer'
                          : isInventoryFull && canAfford
                          ? 'bg-[#253745] border border-amber-400/40 text-amber-300/70 cursor-not-allowed'
                          : 'bg-[#06141B] border border-[#253745] text-[#9BA8AB]/40 cursor-not-allowed'
                      }`}
                      title={isInventoryFull ? 'Túi Đồ đã đầy (50/50)' : undefined}
                    >
                      {isPurchasing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShoppingBag className="w-4 h-4" />
                      )}
                      <span>
                        {!canAfford
                          ? `Thiếu ${item.cost - coins} Xu`
                          : isInventoryFull
                          ? 'Túi Đồ Đầy (50/50)'
                          : isPurchasing
                          ? 'Đang đổi...'
                          : 'Đổi Phần Thưởng'}
                      </span>
                    </button>

                    {!item.isSystem && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteShopItem(item.id)}
                        className="p-2.5 rounded-full bg-[#06141B] hover:bg-rose-950/70 border border-[#253745] hover:border-rose-500/50 text-[#9BA8AB] hover:text-rose-300 transition cursor-pointer"
                        title="Xóa vật phẩm tự thưởng này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ================= TAB 2: TÚI ĐỒ ================= */}
        {shopSubTab === 'inventory' && (
          <motion.div
            key="inventory-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: EASING_SPRING }}
          >
            {inventory.length === 0 ? (
              <div className="rounded-[28px] p-10 text-center space-y-4 bg-[#11212D] border border-[#253745] shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-[#06141B] border border-[#4A5C6A] mx-auto flex items-center justify-center text-[#CCD0CF] shadow-inner">
                  <Backpack className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-[#CCD0CF]">Túi Đồ Đang Trống</h4>
                <p className="text-xs text-[#9BA8AB] max-w-md mx-auto leading-relaxed">
                  Bạn chưa đổi phần thưởng nào. Hãy ghé tab Cửa Hàng để tự thưởng cho mình những món quà xứng đáng nhé!
                </p>
                <button
                  type="button"
                  onClick={() => setShopSubTab('shop')}
                  className="px-5 py-2.5 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs inline-flex items-center gap-2 shadow-[0_4px_18px_rgba(204,208,207,0.2)] hover:scale-105 active:scale-95 transition cursor-pointer"
                >
                  <Ticket className="w-4 h-4 text-[#06141B]" />
                  <span>Ghé Tab Cửa Hàng Ngay</span>
                </button>
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {inventory.map((ticket) => {
                    const isUsing = usingTicketId === ticket.id;
                    return (
                      <motion.div
                        layout
                        key={ticket.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={
                          isUsing
                            ? {
                                scale: 1.04,
                                opacity: 0,
                                filter: 'drop-shadow(0 0 16px rgba(204,208,207,0.8))',
                              }
                            : { opacity: 1, scale: 1, filter: 'drop-shadow(0 0 0px rgba(0,0,0,0))' }
                        }
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.28, ease: EASING_SPRING }}
                        className="rounded-[24px] p-5 bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] flex items-center justify-between gap-4 transition-colors duration-200 shadow-md group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-14 h-14 rounded-2xl bg-[#06141B] border border-[#253745] group-hover:border-[#4A5C6A] flex items-center justify-center text-3xl shrink-0 shadow-inner group-hover:scale-105 transition overflow-hidden">
                            {ticket.emoji}
                          </div>
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm sm:text-base font-bold text-[#CCD0CF] truncate">
                                {ticket.title}
                              </h4>
                              <span className="text-[11px] text-amber-300 font-bold inline-flex items-center gap-0.5 shrink-0">
                                <span>({ticket.cost}</span>
                                <CoinIcon size="xs" />
                                <span>)</span>
                              </span>
                            </div>

                            <div>{formatItemTimeStatus(ticket)}</div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <motion.button
                            whileTap={{ scale: 0.94 }}
                            type="button"
                            disabled={isUsing}
                            onClick={() => handleUseTicket(ticket.id)}
                            className="px-4 py-2 rounded-full bg-[#CCD0CF] hover:bg-white text-[#06141B] font-extrabold text-xs shadow-[0_4px_16px_rgba(204,208,207,0.2)] flex items-center gap-1.5 hover:scale-105 transition cursor-pointer disabled:opacity-50"
                            title="Kích hoạt và sử dụng phần thưởng ngay"
                          >
                            <Ticket className="w-4 h-4 text-[#06141B]" />
                            <span>Sử Dụng Ngay</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <FlyToBagOverlay />
    </div>
  );
};
