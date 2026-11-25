import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { User, Sparkles, Settings, LogOut, ChevronsUpDown } from 'lucide-react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { getBlackCardRankTheme } from '../../utils/hunterArchetype';
import './AccountMenu408.css';

interface AccountMenuPopoverProps {
  variant: 'desktop' | 'mobile';
  isRail?: boolean;
}

type PopPlacement = 'pos-top-left' | 'pos-right-bottom' | 'pos-bottom-right';

interface MenuPosition {
  placement: PopPlacement;
  style: React.CSSProperties;
}

export const AccountMenuPopover: React.FC<AccountMenuPopoverProps> = ({
  variant,
  isRail = false,
}) => {
  const {
    currentUser,
    playerName,
    avatarUrl,
    exp,
    activeTab,
    isSettingsOpen,
    setActiveTab,
    setSettingsOpen,
    setBlackCardOpen,
    signOut,
  } = useFaeQuestStore();

  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition>({
    placement: variant === 'mobile' ? 'pos-bottom-right' : 'pos-top-left',
    style: {},
  });

  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const currentIdx = getRankIndexByExp(exp);
  const currentTier = RANK_TIERS[currentIdx];
  const rankTheme = getBlackCardRankTheme(currentTier.id);
  const playerInitial = (playerName?.trim()?.[0] || 'T').toUpperCase();
  const isPersonalActive = activeTab === 'profile' || isSettingsOpen;

  const updateMenuPosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl || typeof window === 'undefined') return;
    const rect = triggerEl.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    if (variant === 'mobile' || window.innerWidth < 768) {
      setMenuPos({
        placement: 'pos-bottom-right',
        style: {
          top: `${Math.min(rect.bottom + 12, window.innerHeight - 280)}px`,
          right: `${Math.max(12, window.innerWidth - rect.right)}px`,
        },
      });
      return;
    }

    if (isRail) {
      setMenuPos({
        placement: 'pos-right-bottom',
        style: {
          left: `${rect.right + 14}px`,
          bottom: `${Math.max(12, window.innerHeight - rect.bottom)}px`,
        },
      });
      return;
    }

    setMenuPos({
      placement: 'pos-top-left',
      style: {
        left: `${Math.max(12, rect.left)}px`,
        bottom: `${Math.max(12, window.innerHeight - rect.top + 12)}px`,
      },
    });
  }, [variant, isRail]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  // Đóng khi bấm ngoài vùng menu/avatar (capture phase) hoặc nhấn Tab
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownCapture = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      } else if (e.key === 'Tab') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDownCapture, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownCapture, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const focusMenuItem = (index: number) => {
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    if (items.length === 0) return;
    const target = items[(index + items.length) % items.length];
    target?.focus();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      updateMenuPosition();
      setIsOpen(true);
      const targetIdx = e.key === 'ArrowUp' ? 3 : 0;
      window.setTimeout(() => focusMenuItem(targetIdx), 40);
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    if (items.length === 0) return;
    const currentIdxInMenu = items.findIndex((el) => el === document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusMenuItem(currentIdxInMenu === -1 ? 0 : currentIdxInMenu + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusMenuItem(currentIdxInMenu === -1 ? items.length - 1 : currentIdxInMenu - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusMenuItem(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusMenuItem(items.length - 1);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updateMenuPosition();
    }
    setIsOpen((prev) => !prev);
  };

  const handleGoProfile = () => {
    setIsOpen(false);
    setActiveTab('profile');
  };

  const handleOpenBlackCard = () => {
    setIsOpen(false);
    setBlackCardOpen(true);
  };

  const handleOpenSettings = () => {
    setIsOpen(false);
    setSettingsOpen(true);
  };

  const handleSignOut = () => {
    setIsOpen(false);
    signOut();
  };

  const triggerId = variant === 'desktop' ? 'tour-sidebar-profile' : 'tour-mobile-profile';

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`Tài khoản ${playerName || 'Thợ Săn'}`}
        title={isRail || variant === 'mobile' ? `${playerName || 'Thợ Săn'} • Tài khoản` : undefined}
        style={{ '--u408-ring': rankTheme.accent } as React.CSSProperties}
        className={[
          'u408-trigger',
          variant === 'desktop' ? 'is-desktop' : 'is-mobile',
          isPersonalActive ? 'is-personal-active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className="u408-av">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={playerName || 'Thợ Săn'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-xs font-extrabold text-[#F4F0E8]">{playerInitial}</span>
          )}
          <span className="u408-dot" aria-hidden="true" />
        </span>

        {variant === 'desktop' && (
          <>
            <span className="u417-lb flex-1 min-w-0 text-left leading-tight">
              <span className="block text-[12.5px] font-bold text-[#F4F0E8] truncate">
                {playerName || 'Thợ Săn Fae'}
              </span>
              <span className="block text-[10.5px] text-white/50 truncate">
                Bậc {currentTier.name}
              </span>
            </span>

            <ChevronsUpDown
              className={`u417-lb w-3.5 h-3.5 text-white/45 shrink-0 transition-transform duration-200 ${
                isOpen ? 'text-amber-300 scale-110' : ''
              }`}
              aria-hidden="true"
            />
          </>
        )}
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label="Menu tài khoản Thợ Săn"
            onKeyDown={handleMenuKeyDown}
            style={menuPos.style}
            className={`u408-m ${menuPos.placement} ${isOpen ? 'is-open' : ''}`}
          >
            {/* Khối đầu menu (--i: 0) */}
            <div className="u408-hd u408-stagger" style={{ '--i': 0 } as React.CSSProperties}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-extrabold text-white truncate">
                  {playerName || 'Thợ Săn Fae'}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold shrink-0"
                  style={{
                    background: rankTheme.badgeBg,
                    border: `1px solid ${rankTheme.accentBorder}`,
                    color: rankTheme.badgeText,
                  }}
                >
                  {currentTier.name}
                </span>
              </div>
              <p className="text-[11px] text-[#9BA8AB] truncate mt-0.5">
                {currentUser?.email || 'tho-san@faequest.app'}
              </p>
            </div>

            {/* Mục 1: Hồ Sơ Cá Nhân (--i: 1) */}
            <button
              ref={(el) => {
                itemRefs.current[0] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={isOpen ? 0 : -1}
              onClick={handleGoProfile}
              style={{ '--i': 1 } as React.CSSProperties}
              className={`u408-it u408-stagger ${activeTab === 'profile' ? 'is-current' : ''}`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">Hồ Sơ Cá Nhân</span>
              {activeTab === 'profile' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0" />
              )}
            </button>

            {/* Mục 2: Hắc Thẻ Chiến Tích (#052) (--i: 2) */}
            <button
              ref={(el) => {
                itemRefs.current[1] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={isOpen ? 0 : -1}
              onClick={handleOpenBlackCard}
              style={{ '--i': 2 } as React.CSSProperties}
              className="u408-it u408-stagger"
            >
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="flex-1 truncate">Hắc Thẻ Chiến Tích</span>
            </button>

            {/* Mục 3: Cài Đặt (--i: 3) */}
            <button
              ref={(el) => {
                itemRefs.current[2] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={isOpen ? 0 : -1}
              onClick={handleOpenSettings}
              style={{ '--i': 3 } as React.CSSProperties}
              className={`u408-it u408-stagger ${isSettingsOpen ? 'is-current' : ''}`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">Cài Đặt</span>
            </button>

            {/* Đường phân cách (--i: 4) */}
            <div
              role="separator"
              className="u408-hr u408-stagger"
              style={{ '--i': 4 } as React.CSSProperties}
            />

            {/* Mục 4: Đăng Xuất (--i: 5) */}
            <button
              ref={(el) => {
                itemRefs.current[3] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={isOpen ? 0 : -1}
              onClick={handleSignOut}
              style={{ '--i': 5 } as React.CSSProperties}
              className="u408-it is-out u408-stagger"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">Đăng Xuất</span>
            </button>
          </div>,
          document.body
        )}
    </>
  );
};
