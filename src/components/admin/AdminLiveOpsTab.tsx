import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { ActivityLog, AdminUserOverview } from '../../types';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { toast } from '../../store/useToastStore';
import { CoinIcon } from '../ui/CoinIcon';
import { AdminUserLogsModal } from './AdminUserLogsModal';
import { AdminSendMailModal } from './AdminSendMailModal';
import './AdminActivityFeed271.css';
import {
  BarChart2,
  RefreshCw,
  Users,
  ShieldAlert,
  Lock,
  Sparkles,
  Zap,
  Clock,
  ShoppingBag,
  Flame,
  AlertTriangle,
  Search,
  X,
  Radar,
  MailWarning,
  Inbox,
} from 'lucide-react';

type FilterAction = 'all' | 'TASK_COMPLETE' | 'FOCUS_COMPLETE' | 'SHOP_PURCHASE' | 'STREAK_CHECKIN';

const FILTER_OPTIONS: Array<{ id: FilterAction; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'TASK_COMPLETE', label: 'Nhiệm vụ' },
  { id: 'FOCUS_COMPLETE', label: 'Fae Focus' },
  { id: 'SHOP_PURCHASE', label: 'Đổi quà' },
  { id: 'STREAK_CHECKIN', label: 'Điểm danh' },
];

function getActionMeta(action: ActivityLog['action_type'], isFlagged: boolean) {
  if (isFlagged) {
    return {
      color: '#FB7185',
      bg: 'rgba(251, 113, 133, 0.14)',
      bd: 'rgba(251, 113, 133, 0.34)',
      tagLabel:
        action === 'FOCUS_COMPLETE'
          ? 'Fae Focus'
          : action === 'SHOP_PURCHASE'
          ? 'Đổi Quà'
          : action === 'STREAK_CHECKIN'
          ? 'Điểm Danh'
          : 'Nhiệm Vụ',
      summary:
        action === 'FOCUS_COMPLETE'
          ? 'Hoàn thành phiên Focus'
          : action === 'SHOP_PURCHASE'
          ? 'Quy đổi phần thưởng'
          : action === 'STREAK_CHECKIN'
          ? 'Điểm danh chuỗi ngày'
          : 'Nghiệm thu lệnh',
      icon:
        action === 'FOCUS_COMPLETE' ? (
          <Clock className="w-3 h-3" />
        ) : action === 'SHOP_PURCHASE' ? (
          <ShoppingBag className="w-3 h-3" />
        ) : action === 'STREAK_CHECKIN' ? (
          <Flame className="w-3 h-3" />
        ) : (
          <Zap className="w-3 h-3" />
        ),
    };
  }

  switch (action) {
    case 'TASK_COMPLETE':
      return {
        color: '#22D3EE',
        bg: 'rgba(34, 211, 238, 0.14)',
        bd: 'rgba(34, 211, 238, 0.32)',
        tagLabel: 'Nhiệm Vụ',
        summary: 'Nghiệm thu lệnh',
        icon: <Zap className="w-3 h-3" />,
      };
    case 'FOCUS_COMPLETE':
      return {
        color: '#818CF8',
        bg: 'rgba(129, 140, 248, 0.14)',
        bd: 'rgba(129, 140, 248, 0.32)',
        tagLabel: 'Fae Focus',
        summary: 'Hoàn thành phiên Focus',
        icon: <Clock className="w-3 h-3" />,
      };
    case 'SHOP_PURCHASE':
      return {
        color: '#F5B942',
        bg: 'rgba(245, 185, 66, 0.14)',
        bd: 'rgba(245, 185, 66, 0.32)',
        tagLabel: 'Đổi Quà',
        summary: 'Quy đổi phần thưởng',
        icon: <ShoppingBag className="w-3 h-3" />,
      };
    case 'STREAK_CHECKIN':
    default:
      return {
        color: '#34D399',
        bg: 'rgba(52, 211, 153, 0.14)',
        bd: 'rgba(52, 211, 153, 0.32)',
        tagLabel: 'Điểm Danh',
        summary: 'Giữ lửa chuỗi kỷ luật',
        icon: <Flame className="w-3 h-3" />,
      };
  }
}

export const AdminLiveOpsTab: React.FC = () => {
  const { userRole, setAdminPortalTab, setAdminRadarSearch } = useFaeQuestStore();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, AdminUserOverview>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [filterAction, setFilterAction] = useState<FilterAction>('all');
  const [onlyFlagged, setOnlyFlagged] = useState<boolean>(false);
  const [hunterQuery, setHunterQuery] = useState<string>('');

  // Quick Admin Modals từ Timeline
  const [selectedUserForLogs, setSelectedUserForLogs] = useState<AdminUserOverview | null>(null);
  const [selectedUserForWarning, setSelectedUserForWarning] = useState<{
    user: AdminUserOverview;
    reason: string;
  } | null>(null);

  // Đo viên thuốc trượt lò xo (#271 Segmented Control)
  const csRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillPos, setPillPos] = useState<{ x: number; w: number }>({ x: 4, w: 72 });
  const [pillNoTrans, setPillNoTrans] = useState<boolean>(true);
  const mountedRef = useRef<boolean>(false);

  // System Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeBans: 0,
    flagged24h: 0,
    totalExp: 0,
    totalCoins: 0,
  });

  const fetchData = useCallback(
    async (isManualRefresh = false) => {
      if (userRole !== 'admin') return;
      setLoading(true);
      try {
        // 1. Fetch system profiles stats + map phục vụ Soi Radar / Cảnh báo nhanh
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, equipped_title, exp, coins, role, banned_until, ban_reason, updated_at');

        if (profiles) {
          const totalUsers = profiles.length;
          const activeBans = profiles.filter(
            (p) => p.banned_until && new Date(p.banned_until).getTime() > Date.now()
          ).length;
          const totalExp = profiles.reduce((sum, p) => sum + (p.exp || 0), 0);
          const totalCoins = profiles.reduce((sum, p) => sum + (p.coins || 0), 0);
          setStats((prev) => ({ ...prev, totalUsers, activeBans, totalExp, totalCoins }));

          const map: Record<string, AdminUserOverview> = {};
          profiles.forEach((p: any) => {
            map[p.id] = {
              id: p.id,
              username: p.username || 'Thợ Săn Fae',
              avatar_url: p.avatar_url,
              exp: p.exp || 0,
              coins: p.coins || 0,
              rank_id: 'dong',
              equipped_title: p.equipped_title,
              role: p.role || 'user',
              banned_until: p.banned_until,
              ban_reason: p.ban_reason,
              updated_at: p.updated_at || new Date().toISOString(),
            };
          });
          setProfileMap(map);
        }

        // 2. Fetch 100 global logs gần nhất
        const { data: logsData, error } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && logsData) {
          setLogs(logsData as ActivityLog[]);
          const oneDayAgo = Date.now() - 24 * 3600 * 1000;
          const flaggedCount = logsData.filter(
            (l) => l.is_flagged && new Date(l.created_at).getTime() >= oneDayAgo
          ).length;
          setStats((prev) => ({ ...prev, flagged24h: flaggedCount }));
          if (isManualRefresh) {
            toast.ok('Đã cập nhật Live-Ops', `Đã đồng bộ ${logsData.length} hoạt động gần nhất`);
          }
        } else if (error && isManualRefresh) {
          toast.err('Không thể làm mới nhật ký', error.message || 'Vui lòng thử lại sau');
        }
      } catch (e) {
        console.error('Error in AdminLiveOpsTab:', e);
        if (isManualRefresh) {
          toast.err('Lỗi kết nối khi tải Live-Ops');
        }
      } finally {
        setLoading(false);
      }
    },
    [userRole]
  );

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Tính số lượng thực tế cho 5 tab lọc (cộng dồn theo ô tìm kiếm / Gắn Cờ nếu đang nhập tên)
  const filterCounts = useMemo(() => {
    const q = hunterQuery.toLowerCase().trim();
    const base = logs.filter((l) => {
      if (onlyFlagged && !l.is_flagged) return false;
      if (q && !(l.username || 'Thợ Săn Fae').toLowerCase().includes(q)) return false;
      return true;
    });

    return {
      all: base.length,
      TASK_COMPLETE: base.filter((l) => l.action_type === 'TASK_COMPLETE').length,
      FOCUS_COMPLETE: base.filter((l) => l.action_type === 'FOCUS_COMPLETE').length,
      SHOP_PURCHASE: base.filter((l) => l.action_type === 'SHOP_PURCHASE').length,
      STREAK_CHECKIN: base.filter((l) => l.action_type === 'STREAK_CHECKIN').length,
    };
  }, [logs, onlyFlagged, hunterQuery]);

  const totalFlaggedCount = useMemo(() => logs.filter((l) => l.is_flagged).length, [logs]);

  // Đo offsetLeft / offsetWidth của nút lọc đang chọn để trượt viên thuốc đàn hồi (#271)
  useLayoutEffect(() => {
    const activeIdx = FILTER_OPTIONS.findIndex((f) => f.id === filterAction);
    const activeEl = btnRefs.current[activeIdx];
    if (activeEl) {
      setPillPos({ x: activeEl.offsetLeft, w: activeEl.offsetWidth });
    }
    if (!mountedRef.current) {
      mountedRef.current = true;
      const raf = requestAnimationFrame(() => setPillNoTrans(false));
      return () => cancelAnimationFrame(raf);
    }
  }, [filterAction, filterCounts]);

  useEffect(() => {
    const csEl = csRef.current;
    if (!csEl || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const activeIdx = FILTER_OPTIONS.findIndex((f) => f.id === filterAction);
      const activeEl = btnRefs.current[activeIdx];
      if (activeEl) {
        setPillPos({ x: activeEl.offsetLeft, w: activeEl.offsetWidth });
      }
    });
    ro.observe(csEl);
    return () => ro.disconnect();
  }, [filterAction]);

  // Hỗ trợ phím mũi tên trái / phải cho thanh lọc Segmented Control
  const handleFilterKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIdx = FILTER_OPTIONS.findIndex((f) => f.id === filterAction);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = (currentIdx + 1) % FILTER_OPTIONS.length;
      setFilterAction(FILTER_OPTIONS[nextIdx].id);
      btnRefs.current[nextIdx]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIdx = (currentIdx - 1 + FILTER_OPTIONS.length) % FILTER_OPTIONS.length;
      setFilterAction(FILTER_OPTIONS[prevIdx].id);
      btnRefs.current[prevIdx]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFilterAction(FILTER_OPTIONS[0].id);
      btnRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = FILTER_OPTIONS.length - 1;
      setFilterAction(FILTER_OPTIONS[last].id);
      btnRefs.current[last]?.focus();
    }
  };

  // Chốt khóa quyền Admin tuyệt đối tại component
  if (userRole !== 'admin') {
    return null;
  }

  const resolveUserFromLog = (log: ActivityLog): AdminUserOverview => {
    return (
      profileMap[log.user_id] || {
        id: log.user_id,
        username: log.username || 'Thợ Săn Fae',
        exp: 0,
        coins: 0,
        rank_id: 'dong',
        role: 'user',
        updated_at: log.created_at,
      }
    );
  };

  const handleInspectRadar = (log: ActivityLog) => {
    const targetName = profileMap[log.user_id]?.username || log.username || log.user_id;
    setAdminRadarSearch(targetName);
    setAdminPortalTab('users');
  };

  const normalizedQuery = hunterQuery.toLowerCase().trim();
  const visibleCount = logs.reduce((acc, log) => {
    const matchFlag = !onlyFlagged || log.is_flagged;
    const matchAction = filterAction === 'all' || log.action_type === filterAction;
    const matchName =
      !normalizedQuery || (log.username || 'Thợ Săn Fae').toLowerCase().includes(normalizedQuery);
    return acc + (matchFlag && matchAction && matchName ? 1 : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* 4 KPI Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#11212D] border border-[#253745] p-4.5 rounded-3xl space-y-1 shadow-md">
          <div className="flex items-center justify-between text-[#9BA8AB] text-xs font-semibold">
            <span>Tổng Thợ Săn</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-rpg">
            {stats.totalUsers.toLocaleString()}
          </div>
          <span className="text-[11px] text-cyan-300/80">Tài khoản trên máy chủ</span>
        </div>

        <div className="bg-[#11212D] border border-amber-500/30 p-4.5 rounded-3xl space-y-1 shadow-md">
          <div className="flex items-center justify-between text-[#9BA8AB] text-xs font-semibold">
            <span>Cảnh Báo 24h</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300 font-rpg">
            {stats.flagged24h}
          </div>
          <span className="text-[11px] text-amber-300/80">Nghi vấn hoàn thành spam</span>
        </div>

        <div className="bg-[#11212D] border border-rose-500/30 p-4.5 rounded-3xl space-y-1 shadow-md">
          <div className="flex items-center justify-between text-[#9BA8AB] text-xs font-semibold">
            <span>Tài Khoản Đang Khóa</span>
            <Lock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-rpg">
            {stats.activeBans}
          </div>
          <span className="text-[11px] text-rose-300/80">Đang thi hành án hạn chế</span>
        </div>

        <div className="bg-[#11212D] border border-[#253745] p-4.5 rounded-3xl space-y-1 shadow-md">
          <div className="flex items-center justify-between text-[#9BA8AB] text-xs font-semibold">
            <span>Tổng EXP Toàn Hệ Thống</span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div className="text-2xl font-extrabold text-white font-rpg">
            {stats.totalExp.toLocaleString()}
          </div>
          <span className="text-[11px] text-amber-300/80">
            Kèm {stats.totalCoins.toLocaleString()} Xu Vàng
          </span>
        </div>
      </div>

      {/* Trục Timeline Hoạt Động Thời Gian Thực (#271) */}
      <div className="u271-card">
        {/* Header & Bộ lọc dính phía trên (.u271-hd) */}
        <div className="u271-hd p-4 sm:p-5 space-y-3.5">
          {/* Tiêu đề & nút Làm Mới */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#162633] border border-white/10 flex items-center justify-center text-cyan-300 shadow-inner shrink-0">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-extrabold text-white font-rpg tracking-wide truncate">
                  Dòng Hoạt Động Thời Gian Thực (Live-Ops Activity Feed)
                </h3>
                <p className="text-xs text-[#9BA8AB] truncate">
                  Giám sát 100 hoạt động gần nhất diễn ra trong toàn bộ hệ thống FaeQuest
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-[#06141B] hover:bg-[#162633] border border-white/10 hover:border-white/25 text-xs font-bold text-[#CCD0CF] flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer disabled:opacity-60 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-300' : ''}`} />
              <span>Làm Mới</span>
            </button>
          </div>

          {/* Hàng lọc chính: Segmented Control 5 Tab + Công tắc Gắn Cờ + Tìm tên Thợ Săn */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Thanh lọc Segmented Control 5 mục có viên thuốc trượt đàn hồi */}
            <div className="u271-cs-scroll">
              <div
                ref={csRef}
                role="radiogroup"
                aria-label="Lọc theo loại hoạt động"
                onKeyDown={handleFilterKeyDown}
                className="u271-cs"
              >
                <div
                  aria-hidden="true"
                  className={`u271-pl ${pillNoTrans ? 'is-no-trans' : ''}`}
                  style={{
                    width: `${pillPos.w}px`,
                    transform: `translate3d(${pillPos.x}px, 0, 0)`,
                  }}
                />

                {FILTER_OPTIONS.map((opt, idx) => {
                  const isSelected = filterAction === opt.id;
                  const count = filterCounts[opt.id];
                  return (
                    <button
                      key={opt.id}
                      ref={(el) => {
                        btnRefs.current[idx] = el;
                      }}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => setFilterAction(opt.id)}
                      className="u271-cbtn"
                    >
                      <span>{opt.label}</span>
                      <i>{count}</i>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cụm lọc phụ: Gắn Cờ + Tìm tên Thợ Săn */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              {/* Ô tìm kiếm Thợ Săn */}
              <div className="relative w-full sm:w-52">
                <Search className="w-3.5 h-3.5 text-[#9BA8AB] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={hunterQuery}
                  onChange={(e) => setHunterQuery(e.target.value)}
                  placeholder="Tìm tên Thợ Săn..."
                  className="w-full h-9 pl-8 pr-7 rounded-xl bg-[#06141B] border border-white/10 text-xs text-[#F4F0E8] placeholder-[#9BA8AB]/60 focus:outline-none focus:border-cyan-400/50 transition"
                />
                {hunterQuery && (
                  <button
                    type="button"
                    onClick={() => setHunterQuery('')}
                    aria-label="Xóa từ khóa lọc Thợ Săn"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9BA8AB] hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Công tắc Chỉ xem bản ghi bị Gắn Cờ */}
              <label
                className={`h-9 px-3 rounded-xl border text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition select-none shrink-0 ${
                  onlyFlagged
                    ? 'bg-rose-500/15 border-[#FB7185]/50 text-[#FB7185] shadow-[0_0_16px_-4px_rgba(251,113,133,0.45)]'
                    : 'bg-[#06141B] border-white/10 text-amber-300/90 hover:border-amber-400/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={onlyFlagged}
                  onChange={(e) => setOnlyFlagged(e.target.checked)}
                  className="rounded accent-[#FB7185] w-3.5 h-3.5 cursor-pointer"
                />
                <span>Chỉ xem bản ghi bị Gắn Cờ ({totalFlaggedCount})</span>
              </label>
            </div>
          </div>
        </div>

        {/* Vùng cuộn trục Timeline */}
        <div className="u271-scroll">
          {/* Dải mờ chuyển tiếp phía dưới Header dính */}
          <div className="u271-fade" aria-hidden="true" />

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#9BA8AB]">Đang đồng bộ dòng hoạt động toàn hệ thống...</p>
            </div>
          ) : logs.length === 0 || visibleCount === 0 ? (
            <div className="py-14 px-4 flex flex-col items-center justify-center text-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-[#06141B] border border-white/10 flex items-center justify-center text-[#9BA8AB]">
                <Inbox className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#CCD0CF]">
                Không có bản ghi hoạt động nào khớp bộ lọc
              </p>
              <span className="text-xs text-[#9BA8AB]/70">
                Thử chuyển tab phân loại hoặc xóa bộ lọc tên Thợ Săn
              </span>
            </div>
          ) : (
            <div className="u271-tl">
              {logs.map((log, index) => {
                const matchFlag = !onlyFlagged || log.is_flagged;
                const matchAction = filterAction === 'all' || log.action_type === filterAction;
                const matchName =
                  !normalizedQuery ||
                  (log.username || 'Thợ Săn Fae').toLowerCase().includes(normalizedQuery);
                const isMatch = matchFlag && matchAction && matchName;

                const meta = getActionMeta(log.action_type, log.is_flagged);
                const isTopNewest = index === 0;
                const shouldPulseRadar = isTopNewest || log.is_flagged;

                const d = new Date(log.created_at);
                const timeStr = d.toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                const dateStr = d.toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });

                const summaryDetails = [log.category, log.difficulty?.toUpperCase()]
                  .filter(Boolean)
                  .join(' • ');

                return (
                  <div
                    key={log.id}
                    aria-hidden={!isMatch}
                    className={`u271-en ${isMatch ? '' : 'is-off'}`}
                  >
                    <div className="u271-en-clip">
                      <div className="u271-in">
                        {/* Chấm tròn trạng thái + phát sóng radar */}
                        <span
                          className={`u271-dt ${shouldPulseRadar ? 'is-new' : ''}`}
                          style={{ '--c': meta.color } as React.CSSProperties}
                          aria-hidden="true"
                        />

                        {/* Nội dung nút Timeline */}
                        <div
                          className={`u271-card-item ${log.is_flagged ? 'is-flagged' : ''}`}
                          style={
                            {
                              '--c': meta.color,
                              '--c-bg': meta.bg,
                              '--c-bd': meta.bd,
                            } as React.CSSProperties
                          }
                        >
                          {/* Dòng Metadata trên cùng */}
                          <div className="u271-mt">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-[#9BA8AB]">
                                {timeStr} · {dateStr}
                              </span>

                              <span className="u271-tg">
                                {meta.icon}
                                <span>{meta.tagLabel}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {log.is_flagged ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 border border-[#FB7185]/45 text-[#FB7185]">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>⚠️ Gắn Cờ</span>
                                </span>
                              ) : isTopNewest ? (
                                <span className="u271-nw">Mới</span>
                              ) : null}
                            </div>
                          </div>

                          {/* Dòng tiêu đề chính (h4) & Thẻ chỉ số bên phải */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="min-w-0 space-y-1">
                              <h4 className="text-[13.5px] text-[#F4F0E8] leading-snug">
                                <button
                                  type="button"
                                  onClick={() => setSelectedUserForLogs(resolveUserFromLog(log))}
                                  className="font-extrabold text-white hover:text-amber-300 underline decoration-white/20 hover:decoration-amber-300/60 underline-offset-2 transition cursor-pointer mr-1.5"
                                  title="Nhấn để xem Hồ Sơ Mini & 50 log gần nhất của thành viên này"
                                >
                                  {log.username || 'Thợ Săn Fae'}
                                </button>
                                <span className="text-[#CCD0CF] font-medium">
                                  — {meta.summary}
                                  {summaryDetails ? ` (${summaryDetails})` : ''}
                                </span>
                              </h4>

                              {/* Bộ tag Danh mục & Độ khó */}
                              {(log.category || log.difficulty) && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {log.category && (
                                    <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-[#11212D] border border-white/10 text-[#CCD0CF]">
                                      {log.category}
                                    </span>
                                  )}
                                  {log.difficulty && (
                                    <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-md bg-[#11212D] border border-amber-400/25 text-amber-300 uppercase">
                                      {log.difficulty}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Cụm phần thưởng bên phải */}
                            {(log.exp_delta > 0 || log.coins_delta !== 0) && (
                              <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-0.5 md:pt-0">
                                {log.exp_delta > 0 && (
                                  <span className="px-2.5 py-1 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-xs font-extrabold font-mono text-cyan-300">
                                    +{log.exp_delta} EXP
                                  </span>
                                )}
                                {log.coins_delta !== 0 && (
                                  <span
                                    className={`px-2.5 py-1 rounded-lg border text-xs font-extrabold font-mono inline-flex items-center gap-1 ${
                                      log.coins_delta > 0
                                        ? 'bg-amber-950/45 border-amber-500/30 text-amber-300'
                                        : 'bg-rose-950/45 border-rose-500/30 text-rose-300'
                                    }`}
                                  >
                                    <CoinIcon size="xs" />
                                    <span>
                                      {log.coins_delta > 0 ? `+${log.coins_delta}` : log.coins_delta}{' '}
                                      Xu
                                    </span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Thẻ cảnh báo chi tiết riêng cho bản ghi Gắn Cờ (.u271-im) */}
                          {log.is_flagged && (
                            <div className="u271-im">
                              <div className="flex items-start gap-2 text-xs text-rose-200 font-semibold min-w-0">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-[#FB7185] mt-0.5" />
                                <span className="leading-snug">
                                  {log.flag_reason ||
                                    'Tần suất hoàn thành bất thường hoặc mốc thời gian nghi vấn'}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleInspectRadar(log)}
                                  className="px-2.5 py-1.5 rounded-xl bg-[#0B1922] hover:bg-[#162633] border border-white/15 hover:border-cyan-400/50 text-[11px] font-bold text-cyan-300 inline-flex items-center gap-1.5 transition cursor-pointer"
                                >
                                  <Radar className="w-3.5 h-3.5" />
                                  <span>Soi Radar</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedUserForWarning({
                                      user: resolveUserFromLog(log),
                                      reason:
                                        log.flag_reason ||
                                        'Phát hiện chuỗi hoạt động nhanh bất thường trong hệ thống',
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-[#FB7185]/45 text-[11px] font-bold text-rose-200 inline-flex items-center gap-1.5 transition cursor-pointer"
                                >
                                  <MailWarning className="w-3.5 h-3.5" />
                                  <span>Gửi Thư Cảnh Báo</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Hồ Sơ Mini & 50 Log của thành viên khi click vào tên */}
      <AdminUserLogsModal
        user={selectedUserForLogs}
        onClose={() => setSelectedUserForLogs(null)}
      />

      {/* Modal Gửi Thư Cảnh Báo trực tiếp cho bản ghi Gắn Cờ */}
      <AdminSendMailModal
        user={selectedUserForWarning?.user || null}
        onClose={() => setSelectedUserForWarning(null)}
        defaultType="warning"
        defaultSubject="⚠️ Cảnh báo hoạt động bất thường từ Hệ Thống Live-Ops"
        defaultContent={
          selectedUserForWarning
            ? `Chào Thợ Săn ${selectedUserForWarning.user.username},\n\nHệ thống Live-Ops vừa ghi nhận hoạt động bất thường: "${selectedUserForWarning.reason}".\n\nVui lòng rèn luyện đúng nhịp độ thực tế để bảo vệ uy danh và tài khoản của bạn.`
            : ''
        }
      />
    </div>
  );
};
