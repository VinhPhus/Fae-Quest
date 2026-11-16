import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { AdminUserOverview, ActivityLog } from '../../types';
import {
  Scroll,
  X,
  Lock,
  AlertTriangle,
  Clock,
  Sparkles,
  Zap,
  ShoppingBag,
  Flame,
} from 'lucide-react';
import { CoinIcon } from '../ui/CoinIcon';

interface Props {
  user: AdminUserOverview | null;
  onClose: () => void;
}

export const AdminUserLogsModal: React.FC<Props> = ({ user, onClose }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          setLogs(data as ActivityLog[]);
        }
      } catch (e) {
        console.error('Error fetching user logs:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user]);

  if (!user) return null;

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
            <span>Mua Đồ</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#11212D] border border-[#253745] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#CCD0CF]">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#253745] flex items-center justify-between bg-[#06141B]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shadow-inner">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-rpg tracking-wide">
                  Nhật Ký Hoạt Động Thợ Săn
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#253745] text-amber-300 font-bold border border-[#4A5C6A]">
                  {user.username}
                </span>
              </div>
              <p className="text-xs text-[#9BA8AB]">
                Xem xét tần suất nhận thưởng & lịch sử hoạt động để thẩm tra nghi vấn
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

        {/* Privacy Banner - Absolute Rule */}
        <div className="bg-[#06141B] px-5 py-2.5 border-b border-[#253745] flex items-center gap-2 text-xs text-emerald-400 font-medium">
          <Lock className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>🔒 Tên nhiệm vụ cá nhân đã được ẩn để bảo vệ quyền riêng tư người dùng.</span>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 max-h-[60vh] no-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#9BA8AB]">Đang trích xuất nhật ký hoạt động...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-[#9BA8AB] text-sm">
              Chưa có nhật ký hoạt động nào được ghi nhận cho tài khoản này.
            </div>
          ) : (
            <div className="space-y-2.5">
              {logs.map((log) => {
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
                        ? 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                        : 'bg-[#06141B]/70 border-[#253745]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getActionBadge(log.action_type)}
                        {log.category && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#11212D] border border-[#253745] text-[#CCD0CF]">
                            {log.category}
                          </span>
                        )}
                        {log.difficulty && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#11212D] border border-[#253745] text-amber-300 font-bold uppercase">
                            Độ khó: {log.difficulty}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {log.exp_delta > 0 && (
                          <span className="text-xs font-bold text-cyan-400 flex items-center gap-0.5">
                            <Sparkles className="w-3 h-3" />
                            <span>+{log.exp_delta} EXP</span>
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
                        <span className="text-[11px] text-[#9BA8AB] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#4A5C6A]" />
                          <span>{formattedTime}</span>
                        </span>
                      </div>
                    </div>

                    {log.is_flagged && (
                      <div className="mt-2.5 pt-2 border-t border-rose-500/30 flex items-start gap-2 text-xs text-rose-300 font-semibold bg-rose-950/40 p-2 rounded-xl">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                        <div>
                          <span>CẢNH BÁO BẤT THƯỜNG: </span>
                          <span className="font-normal">{log.flag_reason || 'Tần suất hoàn thành đột biến'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#253745] bg-[#06141B]/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] text-white text-xs font-bold transition cursor-pointer border border-[#4A5C6A]"
          >
            Đóng Nhật Ký
          </button>
        </div>
      </div>
    </div>
  );
};
