import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { ActivityLog } from '../../types';
import { CoinIcon } from '../ui/CoinIcon';
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
  Filter,
} from 'lucide-react';

export const AdminLiveOpsTab: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [onlyFlagged, setOnlyFlagged] = useState<boolean>(false);

  // System Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeBans: 0,
    flagged24h: 0,
    totalExp: 0,
    totalCoins: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch system profiles stats
      const { data: profiles } = await supabase.from('profiles').select('exp, coins, banned_until');
      if (profiles) {
        const totalUsers = profiles.length;
        const activeBans = profiles.filter(
          (p) => p.banned_until && new Date(p.banned_until).getTime() > Date.now()
        ).length;
        const totalExp = profiles.reduce((sum, p) => sum + (p.exp || 0), 0);
        const totalCoins = profiles.reduce((sum, p) => sum + (p.coins || 0), 0);
        setStats((prev) => ({ ...prev, totalUsers, activeBans, totalExp, totalCoins }));
      }

      // 2. Fetch global logs
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: logsData, error } = await query;
      if (!error && logsData) {
        setLogs(logsData as ActivityLog[]);
        const oneDayAgo = Date.now() - 24 * 3600 * 1000;
        const flaggedCount = logsData.filter(
          (l) => l.is_flagged && new Date(l.created_at).getTime() >= oneDayAgo
        ).length;
        setStats((prev) => ({ ...prev, flagged24h: flaggedCount }));
      }
    } catch (e) {
      console.error('Error in AdminLiveOpsTab:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (onlyFlagged && !l.is_flagged) return false;
    if (filterAction !== 'all' && l.action_type !== filterAction) return false;
    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'TASK_COMPLETE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
            <Zap className="w-3 h-3" />
            <span>Nhiệm Vụ</span>
          </span>
        );
      case 'FOCUS_COMPLETE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
            <Clock className="w-3 h-3" />
            <span>Fae Focus</span>
          </span>
        );
      case 'SHOP_PURCHASE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
            <ShoppingBag className="w-3 h-3" />
            <span>Mua Quà</span>
          </span>
        );
      case 'STREAK_CHECKIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300">
            <Flame className="w-3 h-3" />
            <span>Điểm Danh</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#253745] text-[#CCD0CF]">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 KPI Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
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

        {/* Metric 2 */}
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

        {/* Metric 3 */}
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

        {/* Metric 4 */}
        <div className="bg-[#11212D] border border-[#253745] p-4.5 rounded-3xl space-y-1 shadow-md">
          <div className="flex items-center justify-between text-[#9BA8AB] text-xs font-semibold">
            <span>Tổng EXP Toàn Server</span>
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

      {/* Global Activity Feed Stream */}
      <div className="bg-[#11212D] border border-[#253745] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#253745] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shadow-inner">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-rpg tracking-wide">
                Dòng Hoạt Động Thời Gian Thực (Live-Ops Activity Feed)
              </h3>
              <p className="text-xs text-[#9BA8AB]">
                Giám sát 100 hoạt động gần nhất diễn ra trong toàn bộ hệ thống FaeQuest
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-xs font-semibold text-[#CCD0CF] flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#06141B] p-3 rounded-2xl border border-[#253745]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#9BA8AB] flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Lọc:</span>
            </span>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'TASK_COMPLETE', label: 'Nhiệm vụ' },
              { id: 'FOCUS_COMPLETE', label: 'Fae Focus' },
              { id: 'SHOP_PURCHASE', label: 'Đổi quà' },
              { id: 'STREAK_CHECKIN', label: 'Điểm danh' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterAction(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterAction === f.id
                    ? 'bg-[#CCD0CF] text-[#06141B]'
                    : 'bg-[#11212D] text-[#9BA8AB] hover:text-[#CCD0CF]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Checkbox only flagged */}
          <label className="flex items-center gap-2 text-xs font-bold text-amber-300 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyFlagged}
              onChange={(e) => setOnlyFlagged(e.target.checked)}
              className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
            />
            <span>Chỉ xem bản ghi bị Gắn Cờ ({logs.filter((l) => l.is_flagged).length})</span>
          </label>
        </div>

        {/* Logs list */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#9BA8AB]">Đang cập nhật dòng hoạt động...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-[#9BA8AB] text-sm">
            Không có hoạt động nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto no-scrollbar">
            {filteredLogs.map((log) => {
              const formattedTime = new Date(log.created_at).toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });

              return (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-2xl border transition ${
                    log.is_flagged
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-[#06141B]/70 border-[#253745]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-white text-xs">
                        {log.username || 'Thợ Săn Fae'}
                      </span>
                      {getActionBadge(log.action_type)}
                      {log.category && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#11212D] border border-[#253745] text-[#CCD0CF]">
                          {log.category}
                        </span>
                      )}
                      {log.difficulty && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#11212D] border border-[#253745] text-amber-300 font-bold uppercase">
                          {log.difficulty}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {log.exp_delta > 0 && (
                        <span className="text-xs font-bold text-cyan-400">
                          +{log.exp_delta} EXP
                        </span>
                      )}
                      {log.coins_delta !== 0 && (
                        <span
                          className={`text-xs font-bold flex items-center gap-1 ${
                            log.coins_delta > 0 ? 'text-amber-300' : 'text-rose-400'
                          }`}
                        >
                          <CoinIcon size="xs" />
                          <span>
                            {log.coins_delta > 0 ? `+${log.coins_delta}` : log.coins_delta} Xu
                          </span>
                        </span>
                      )}
                      <span className="text-[11px] text-[#9BA8AB]">{formattedTime}</span>
                    </div>
                  </div>

                  {log.is_flagged && (
                    <div className="mt-2 pt-2 border-t border-rose-500/30 flex items-center gap-2 text-xs text-rose-300 font-semibold bg-rose-950/40 px-2.5 py-1.5 rounded-xl">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{log.flag_reason || 'Tần suất hoàn thành nhiệm vụ nhanh bất thường'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
