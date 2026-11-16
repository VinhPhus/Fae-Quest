import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { AdminUserOverview } from '../../types';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { CoinIcon } from '../ui/CoinIcon';
import { AdminUserLogsModal } from './AdminUserLogsModal';
import { AdminSendMailModal } from './AdminSendMailModal';
import { AdminBanUserModal } from './AdminBanUserModal';
import { AdminConfirmDeleteModal } from './AdminConfirmDeleteModal';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Lock,
  Unlock,
  Trash2,
  Scroll,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  Zap,
  X,
} from 'lucide-react';

export const AdminUsersTab: React.FC = () => {
  const { adminSetUserRole, addToast } = useFaeQuestStore();
  const [users, setUsers] = useState<AdminUserOverview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  // Selected User for Modals
  const [selectedUserForLogs, setSelectedUserForLogs] = useState<AdminUserOverview | null>(null);
  const [selectedUserForMail, setSelectedUserForMail] = useState<AdminUserOverview | null>(null);
  const [selectedUserForBan, setSelectedUserForBan] = useState<AdminUserOverview | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<AdminUserOverview | null>(null);
  const [selectedUserForRole, setSelectedUserForRole] = useState<AdminUserOverview | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<boolean>(false);
  const [mailDefaultReason, setMailDefaultReason] = useState<string>('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Gọi RPC rpc_admin_get_users_overview() nếu có, hoặc query profiles kết hợp activity_logs
      const { data: rpcData, error: rpcErr } = await supabase.rpc('rpc_admin_get_users_overview');
      if (!rpcErr && rpcData) {
        setUsers(rpcData as AdminUserOverview[]);
        return;
      }

      // Fallback query trực tiếp nếu RPC chưa deploy
      const { data: profileList, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .order('exp', { ascending: false });

      if (!pErr && profileList) {
        // Query recent flagged logs
        const { data: flaggedLogs } = await supabase
          .from('activity_logs')
          .select('user_id, is_flagged, exp_delta, flag_reason, created_at')
          .gte('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString());

        const enrichedUsers: AdminUserOverview[] = profileList.map((p: any) => {
          const userLogs = (flaggedLogs || []).filter((l: any) => l.user_id === p.id);
          const flaggedCount = userLogs.filter((l: any) => l.is_flagged).length;
          const exp24h = userLogs.reduce((sum: number, l: any) => sum + (l.exp_delta || 0), 0);
          const latestFlag = userLogs.find((l: any) => l.is_flagged)?.flag_reason;

          return {
            id: p.id,
            username: p.username || 'Thợ Săn Fae',
            avatar_url: p.avatar_url,
            exp: p.exp || 0,
            coins: p.coins || 0,
            rank_id: p.rank_id || 'dong',
            equipped_title: p.equipped_title,
            role: p.role || 'user',
            banned_until: p.banned_until,
            ban_reason: p.ban_reason,
            updated_at: p.updated_at || new Date().toISOString(),
            flagged_count_24h: flaggedCount,
            exp_gained_24h: exp24h,
            latest_flag_reason: latestFlag,
          };
        });

        setUsers(enrichedUsers);
      }
    } catch (e) {
      console.error('Error fetching admin users overview:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter anomaly candidates: flagged > 0 OR exp_gained_24h > 1000
  const anomalyUsers = users.filter((u) => {
    const isBanned = u.banned_until && new Date(u.banned_until).getTime() > Date.now();
    return (u.flagged_count_24h && u.flagged_count_24h > 0) || (u.exp_gained_24h && u.exp_gained_24h > 1000) || isBanned;
  });

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const userCount = users.filter((u) => u.role !== 'admin').length;

  const filteredUsers = users.filter((u) => {
    if (roleFilter === 'admin' && u.role !== 'admin') return false;
    if (roleFilter === 'user' && u.role === 'admin') return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.username.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* =========================================================================
          KHU VỰC 1: ⚡ RADAR GỢI Ý HOẠT ĐỘNG BẤT THƯỜNG (ANOMALY RADAR)
          ========================================================================= */}
      <div className="bg-[#11212D] border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#253745] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-rpg tracking-wide">
                  ⚡ RADAR GỢI Ý HOẠT ĐỘNG BẤT THƯỜNG (24 Giờ Qua)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] font-extrabold text-amber-300">
                  {anomalyUsers.length} cảnh báo
                </span>
              </div>
              <p className="text-xs text-[#9BA8AB]">
                Thuật toán RPC tự động nhận diện spam nhiệm vụ tốc độ cao & đột biến EXP
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-[#06141B] hover:bg-[#253745] border border-[#253745] hover:border-[#4A5C6A] text-xs font-semibold text-[#CCD0CF] flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Quét lại Radar</span>
          </button>
        </div>

        {/* Anomaly Cards List */}
        {anomalyUsers.length === 0 ? (
          <div className="py-6 px-4 rounded-2xl bg-[#06141B]/60 border border-[#253745] flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">
              Radar đang hoạt động chuẩn xác — Chưa phát hiện hành vi tăng chỉ số gian lận nào trong 24h qua!
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {anomalyUsers.map((u) => {
              const isBanned = u.banned_until && new Date(u.banned_until).getTime() > Date.now();
              return (
                <div
                  key={u.id}
                  className={`p-4 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between gap-3 ${
                    isBanned
                      ? 'bg-rose-950/25 border-rose-500/40'
                      : 'bg-[#06141B] border-amber-500/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#11212D] border border-[#253745] overflow-hidden shrink-0 flex items-center justify-center font-bold text-white text-base">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                        ) : (
                          u.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">{u.username}</h4>
                          {isBanned && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-rose-600 text-white">
                              ĐÃ KHÓA
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#9BA8AB] flex items-center gap-2 mt-0.5">
                          <span>EXP 24h: <strong className="text-cyan-400">+{u.exp_gained_24h || 0}</strong></span>
                          <span>•</span>
                          <span>Bất thường: <strong className="text-rose-400">{u.flagged_count_24h || 0} lần</strong></span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold shrink-0">
                      {isBanned ? 'Đang thi hành án' : 'Nghi Vấn Gian Lận'}
                    </span>
                  </div>

                  {/* Suggestion Reason text */}
                  <div className="bg-[#11212D] p-2.5 rounded-xl border border-[#253745] text-xs text-[#CCD0CF] leading-relaxed flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <span>
                      {u.latest_flag_reason ||
                        (u.exp_gained_24h && u.exp_gained_24h > 1000
                          ? 'Tần suất nhận EXP đột biến cao (> 1000 EXP trong 24h)'
                          : 'Hoàn thành nhiều nhiệm vụ liên tiếp trong thời gian cực ngắn')}
                    </span>
                  </div>

                  {/* 2 Quick action buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-[#253745]/60">
                    <button
                      type="button"
                      onClick={() => {
                        setMailDefaultReason(
                          u.latest_flag_reason || 'Phát hiện tần suất hoàn thành nhiệm vụ bất thường trong 24h qua'
                        );
                        setSelectedUserForMail(u);
                      }}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-[#4A5C6A] cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span>📩 Gửi Cảnh Báo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedUserForBan(u)}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        isBanned
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                      }`}
                    >
                      {isBanned ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>{isBanned ? 'Mở Khóa Sớm' : '🔨 Khóa Tạm Thời'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          KHU VỰC 2: DANH SÁCH TÀI KHOẢN ĐANG HOẠT ĐỘNG
          ========================================================================= */}
      <div className="bg-[#11212D] border border-[#253745] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-rpg tracking-wide">
                Danh Sách Hồ Sơ Thợ Săn Toàn Hệ Thống
              </h3>
              <p className="text-xs text-[#9BA8AB]">
                Tổng cộng {users.length} tài khoản thợ săn đã đăng ký trên máy chủ
              </p>
            </div>
          </div>

          {/* Role Filter & Search Box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#06141B] border border-[#253745]">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  roleFilter === 'all'
                    ? 'bg-[#253745] text-white shadow-sm'
                    : 'text-[#9BA8AB] hover:text-[#CCD0CF]'
                }`}
              >
                Tất cả ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('admin')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  roleFilter === 'admin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-[#9BA8AB] hover:text-amber-300'
                }`}
              >
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                <span>Admin ({adminCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('user')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  roleFilter === 'user'
                    ? 'bg-[#253745] text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-[#9BA8AB] hover:text-cyan-300'
                }`}
              >
                <span>User ({userCount})</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-[#9BA8AB] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tên / ID..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#06141B] border border-[#253745] text-xs text-[#CCD0CF] placeholder-[#9BA8AB]/50 focus:outline-none focus:border-[#4A5C6A] transition"
              />
            </div>
          </div>
        </div>

        {/* Users Table / Responsive Cards */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#9BA8AB]">Đang tải danh sách tài khoản...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-[#9BA8AB] text-sm">
            Không tìm thấy Thợ Săn nào phù hợp với từ khóa "{searchQuery}"
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar border border-[#253745] rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#06141B] text-[#9BA8AB] uppercase font-bold text-[10px] tracking-wider border-b border-[#253745]">
                <tr>
                  <th className="py-3 px-4">Thợ Săn</th>
                  <th className="py-3 px-3">Cấp Bậc & EXP</th>
                  <th className="py-3 px-3">Số Dư Xu</th>
                  <th className="py-3 px-3">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#253745]">
                {filteredUsers.map((u) => {
                  const rankIdx = getRankIndexByExp(u.exp);
                  const tier = RANK_TIERS[rankIdx];
                  const isBanned = u.banned_until && new Date(u.banned_until).getTime() > Date.now();

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[#06141B]/40 transition duration-150"
                    >
                      {/* Avatar & Username */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#06141B] border border-[#253745] overflow-hidden shrink-0 flex items-center justify-center font-bold text-white text-sm">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                            ) : (
                              u.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#CCD0CF] truncate">{u.username}</span>
                              {u.role === 'admin' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#9BA8AB] font-mono truncate block max-w-[140px]">
                              {u.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rank & EXP */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-[#CCD0CF] flex items-center gap-1">
                            <span className="text-white">{tier.name}</span>
                          </span>
                          <span className="text-[11px] text-cyan-400 font-bold block">
                            {u.exp.toLocaleString()} EXP
                          </span>
                        </div>
                      </td>

                      {/* Coins */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-bold text-amber-300">
                          <CoinIcon size="xs" />
                          <span>{u.coins.toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Ban Status */}
                      <td className="py-3 px-3">
                        {isBanned ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 border border-rose-500/40 text-rose-300">
                              <Lock className="w-3 h-3" />
                              <span>Bị Khóa</span>
                            </span>
                            <span className="text-[10px] text-[#9BA8AB] block truncate max-w-[130px]">
                              {new Date(u.banned_until!).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Hoạt Động</span>
                          </span>
                        )}
                      </td>

                      {/* 4 Admin Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* 1. Xem Log Ẩn Danh */}
                          <button
                            type="button"
                            onClick={() => setSelectedUserForLogs(u)}
                            className="p-1.5 rounded-lg bg-[#06141B] hover:bg-[#253745] text-[#9BA8AB] hover:text-white border border-[#253745] transition cursor-pointer"
                            title="📜 Xem Log Hoạt Động Ẩn Danh"
                          >
                            <Scroll className="w-4 h-4" />
                          </button>

                          {/* 2. Gửi Thư / Cảnh Báo */}
                          <button
                            type="button"
                            onClick={() => {
                              setMailDefaultReason('');
                              setSelectedUserForMail(u);
                            }}
                            className="p-1.5 rounded-lg bg-[#06141B] hover:bg-[#253745] text-cyan-400 hover:text-cyan-300 border border-[#253745] transition cursor-pointer"
                            title="✉️ Gửi Thư / Cảnh Báo"
                          >
                            <Mail className="w-4 h-4" />
                          </button>

                          {/* 3. Khóa Có Thời Hạn */}
                          <button
                            type="button"
                            onClick={() => setSelectedUserForBan(u)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isBanned
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50 hover:bg-emerald-900/60'
                                : 'bg-[#06141B] hover:bg-amber-950/60 text-amber-400 border-[#253745]'
                            }`}
                            title={isBanned ? 'Mở Khóa Tài Khoản' : '⏳ Khóa Có Thời Hạn'}
                          >
                            {isBanned ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>

                          {/* 4. Phân Quyền Admin / User */}
                          <button
                            type="button"
                            onClick={() => setSelectedUserForRole(u)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                : 'bg-[#06141B] hover:bg-[#253745] text-[#9BA8AB] hover:text-white border-[#253745]'
                            }`}
                            title={u.role === 'admin' ? '👑 Đang là Quản Trị Viên (Bấm để đổi)' : '👤 Đang là Thợ Săn (Bấm để cấp Admin)'}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>

                          {/* 5. Xóa Tài Khoản */}
                          <button
                            type="button"
                            onClick={() => setSelectedUserForDelete(u)}
                            className="p-1.5 rounded-lg bg-[#06141B] hover:bg-rose-950/70 text-rose-400 hover:text-rose-300 border border-[#253745] hover:border-rose-500/50 transition cursor-pointer"
                            title="🗑️ Xóa Vĩnh Viễn Tài Khoản"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {/* 👑 MODAL PHÂN QUYỀN (ROLE MODAL) */}
      {selectedUserForRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#11212D] border border-amber-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#253745]">
              <div className="flex items-center gap-2 text-amber-300 font-rpg font-bold text-base">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>Phân Quyền Hệ Thống</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForRole(null)}
                className="text-[#9BA8AB] hover:text-white transition p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#06141B] border border-[#253745]">
              <div className="w-12 h-12 rounded-xl bg-[#11212D] border border-[#253745] flex items-center justify-center font-bold text-white text-base overflow-hidden shrink-0">
                {selectedUserForRole.avatar_url ? (
                  <img src={selectedUserForRole.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  selectedUserForRole.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white truncate">{selectedUserForRole.username}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                    selectedUserForRole.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-[#253745] text-[#9BA8AB] border-[#4A5C6A]'
                  }`}>
                    {selectedUserForRole.role === 'admin' ? '👑 ADMIN' : '👤 USER'}
                  </span>
                </div>
                <p className="text-[11px] text-[#9BA8AB] font-mono truncate">{selectedUserForRole.id}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#CCD0CF]">
              {selectedUserForRole.role === 'admin' ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-1">
                  <p className="font-bold">⚠️ Bạn có muốn hạ quyền tài khoản này?</p>
                  <p className="text-[11px] text-amber-300/80">
                    Tài khoản sẽ bị hủy quyền truy cập vào Admin Live-Ops Portal và trở về cấp Thợ Săn thông thường.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 space-y-1">
                  <p className="font-bold">👑 Bạn có muốn bổ nhiệm tài khoản này làm Quản Trị Viên?</p>
                  <p className="text-[11px] text-cyan-300/80">
                    Tài khoản sẽ được mở khóa tab "🛡️ Quản Trị Hệ Thống", truy cập Radar phát hiện bất thường, quản lý Cửa Hàng & Thành Tựu, gửi thư và khóa tài khoản vi phạm.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserForRole(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#06141B] hover:bg-[#253745] text-[#CCD0CF] text-xs font-bold border border-[#253745] transition cursor-pointer"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                disabled={isUpdatingRole}
                onClick={async () => {
                  setIsUpdatingRole(true);
                  const targetRole = selectedUserForRole.role === 'admin' ? 'user' : 'admin';
                  const ok = await adminSetUserRole(selectedUserForRole.id, targetRole);
                  setIsUpdatingRole(false);
                  if (ok) {
                    setUsers((prev) =>
                      prev.map((item) =>
                        item.id === selectedUserForRole.id ? { ...item, role: targetRole } : item
                      )
                    );
                    addToast(
                      targetRole === 'admin'
                        ? `👑 Đã bổ nhiệm "${selectedUserForRole.username}" làm Quản Trị Viên!`
                        : `🛡️ Đã chuyển "${selectedUserForRole.username}" về Thợ Săn thường!`,
                      'success'
                    );
                    setSelectedUserForRole(null);
                  }
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  selectedUserForRole.role === 'admin'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#06141B] font-extrabold shadow-lg shadow-amber-500/20'
                }`}
              >
                {isUpdatingRole ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : selectedUserForRole.role === 'admin' ? (
                  'Hạ Quyền User'
                ) : (
                  'Cấp Quyền Admin'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminUserLogsModal
        user={selectedUserForLogs}
        onClose={() => setSelectedUserForLogs(null)}
      />

      <AdminSendMailModal
        user={selectedUserForMail}
        onClose={() => setSelectedUserForMail(null)}
        defaultContent={mailDefaultReason}
      />

      <AdminBanUserModal
        user={selectedUserForBan}
        onClose={() => {
          setSelectedUserForBan(null);
          fetchUsers();
        }}
      />

      <AdminConfirmDeleteModal
        user={selectedUserForDelete}
        onClose={() => {
          setSelectedUserForDelete(null);
          fetchUsers();
        }}
      />
    </div>
  );
};
