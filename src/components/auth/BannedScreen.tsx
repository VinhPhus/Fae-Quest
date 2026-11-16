import React, { useState, useEffect } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { ShieldAlert, Clock, LogOut, AlertTriangle, Shield } from 'lucide-react';

export const BannedScreen: React.FC = () => {
  const { bannedUntil, banReason, signOut, playerName } = useFaeQuestStore();
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPermanent: boolean;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPermanent: false, isExpired: false });

  useEffect(() => {
    const calculateTime = () => {
      if (!bannedUntil) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPermanent: false, isExpired: true });
        return;
      }

      const unbanTime = new Date(bannedUntil).getTime();
      const now = Date.now();
      const diffMs = unbanTime - now;

      if (diffMs <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPermanent: false, isExpired: true });
        return;
      }

      // If banned > 365 days, treat as permanent
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (days > 365) {
        setTimeLeft({ days: 999, hours: 0, minutes: 0, seconds: 0, isPermanent: true, isExpired: false });
        return;
      }

      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPermanent: false, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [bannedUntil]);

  const formattedUnbanDate = bannedUntil
    ? new Date(bannedUntil).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#06141B] thorn-pattern antialiased text-[#CCD0CF]">
      <div className="max-w-lg w-full bg-[#11212D] border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(244,63,94,0.15)] relative overflow-hidden space-y-6">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Warning Icon Badge */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-20 h-20 rounded-2xl bg-[#06141B] border-2 border-rose-500/50 flex items-center justify-center shadow-inner relative group">
            <ShieldAlert className="w-10 h-10 text-rose-500 animate-pulse" />
            <div className="absolute -inset-1 bg-rose-500/20 rounded-2xl blur-sm -z-10" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300">
              Lệnh Hạn Chế Từ Quản Trị Viên
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-rpg tracking-wide text-white">
              TÀI KHOẢN ĐANG BỊ TẠM KHÓA
            </h1>
            <p className="text-xs sm:text-sm text-[#9BA8AB]">
              Thợ Săn <span className="text-white font-bold">{playerName}</span> tạm thời bị đình chỉ tham gia Đấu Trường FaeQuest.
            </p>
          </div>
        </div>

        {/* Reason Card */}
        <div className="bg-[#06141B] border border-[#253745] rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Lý Do Áp Dụng Lệnh Phạt</span>
          </div>
          <p className="text-sm text-[#CCD0CF] leading-relaxed bg-[#11212D] p-3 rounded-xl border border-[#253745]/70">
            {banReason || 'Phát hiện hoạt động tăng chỉ số bất thường hoặc vi phạm quy tắc công bằng của Đấu Trường FaeQuest.'}
          </p>
        </div>

        {/* Countdown Box */}
        <div className="bg-[#06141B] border border-[#253745] rounded-2xl p-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-[#9BA8AB] text-xs font-semibold">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Thời Gian Tự Động Mở Khóa Còn Lại</span>
          </div>

          {timeLeft.isPermanent ? (
            <div className="py-2 text-rose-400 font-extrabold text-xl tracking-wider uppercase">
              Khóa Vĩnh Viễn
            </div>
          ) : timeLeft.isExpired ? (
            <div className="py-2 text-emerald-400 font-extrabold text-base">
              Hạn khóa đã kết thúc! Vui lòng đăng nhập lại để làm mới phiên.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 pt-1">
              <div className="bg-[#11212D] border border-[#253745] py-2 px-1 rounded-xl">
                <span className="block text-2xl font-extrabold text-white font-mono">{timeLeft.days}</span>
                <span className="text-[10px] text-[#9BA8AB] uppercase">Ngày</span>
              </div>
              <div className="bg-[#11212D] border border-[#253745] py-2 px-1 rounded-xl">
                <span className="block text-2xl font-extrabold text-white font-mono">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-[#9BA8AB] uppercase">Giờ</span>
              </div>
              <div className="bg-[#11212D] border border-[#253745] py-2 px-1 rounded-xl">
                <span className="block text-2xl font-extrabold text-white font-mono">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-[#9BA8AB] uppercase">Phút</span>
              </div>
              <div className="bg-[#11212D] border border-[#253745] py-2 px-1 rounded-xl">
                <span className="block text-2xl font-extrabold text-amber-300 font-mono">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-[#9BA8AB] uppercase">Giây</span>
              </div>
            </div>
          )}

          {formattedUnbanDate && !timeLeft.isPermanent && (
            <div className="text-[11px] text-[#9BA8AB]/70">
              Dự kiến mở khóa: <span className="text-[#CCD0CF] font-medium">{formattedUnbanDate}</span>
            </div>
          )}
        </div>

        {/* Rule Notice */}
        <div className="text-center text-[11px] text-[#9BA8AB] leading-relaxed">
          Trong thời gian áp dụng lệnh khóa, quyền hoàn thành nhiệm vụ, điểm danh chuỗi và đổi vật phẩm tại Cửa Hàng sẽ bị đình chỉ để đảm bảo tính công bằng.
        </div>

        {/* Sign Out CTA */}
        <div className="pt-2">
          <button
            onClick={() => signOut()}
            className="w-full py-3 px-4 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] text-white font-bold text-sm flex items-center justify-center gap-2 transition duration-200 shadow-md cursor-pointer border border-[#4A5C6A]"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất Tài Khoản</span>
          </button>
        </div>
      </div>
    </div>
  );
};
