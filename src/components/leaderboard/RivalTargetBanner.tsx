import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { Swords, Crown } from 'lucide-react';

export const RivalTargetBanner: React.FC = () => {
  const { playerName, exp, hunterId, userRole, communityProfiles } = useFaeQuestStore();

  // Tài khoản Admin được ẩn khỏi BXH để bảo toàn tính công bằng
  if (userRole === 'admin') {
    return null;
  }

  // 1. Hồ sơ của chính mình
  const myCombatant = {
    id: hunterId || 'player_me',
    name: playerName,
    exp: typeof exp === 'number' ? exp : 0,
    isPlayer: true,
  };

  // 2. Danh sách 100% người chơi thật từ Supabase profiles (loại bỏ chính mình và tài khoản admin)
  const otherHunters = (communityProfiles || [])
    .filter((p) => p.id !== hunterId && p.role !== 'admin')
    .map((p) => ({
      id: p.id,
      name: p.username || 'Thợ Săn Ẩn Danh',
      exp: typeof p.exp === 'number' ? p.exp : 0,
      isPlayer: false,
    }));

  // Hợp nhất và xếp hạng theo điểm EXP giảm dần
  const allHunters = [myCombatant, ...otherHunters].sort((a, b) => b.exp - a.exp);

  const playerIdx = allHunters.findIndex((c) => c.isPlayer);
  const currentRank = playerIdx !== -1 ? playerIdx + 1 : 1;

  // Nếu người dùng đang đứng Hạng #1 (hoặc bảng chỉ mới có 1 người duy nhất)
  if (currentRank === 1) {
    return (
      <div className="rpg-card-opal rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-amber-400/40 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
            <Crown className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
              <span>Đỉnh Cao Bá Chủ: Hạng #1 Đấu Trường</span>
            </h4>
            <p className="text-xs text-[#CCD0CF]/90 mt-0.5 leading-relaxed">
              👑 Bạn đang thống trị ngôi vương Hạng #1 Đấu Trường Thợ Săn! Hãy tiếp tục duy trì kỷ luật để giữ vững ngai vàng.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Nếu người dùng đang đứng từ Hạng #2 trở xuống: Tìm đúng người chơi thật xếp ngay trên 1 bậc (playerIdx - 1)
  const targetHunter = allHunters[playerIdx - 1];
  const targetRankPos = currentRank - 1;
  const expDiff = Math.max(1, (targetHunter.exp - exp) + 1);

  return (
    <div className="rpg-card-opal rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-[#253745] hover:border-[#4A5C6A] shadow-lg transition-all">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
          <Swords className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#CCD0CF]">Mục Tiêu Bứt Phá Kế Tiếp</h4>
          <p className="text-xs text-[#9BA8AB] mt-0.5 leading-relaxed">
            Bạn chỉ cần thêm{' '}
            <strong className="text-cyan-400 font-extrabold">+{expDiff.toLocaleString()} EXP</strong>{' '}
            nữa để vượt qua đối thủ{' '}
            <strong className="text-white font-extrabold">"{targetHunter.name}"</strong> và
            chiếm vị trí{' '}
            <strong className="text-amber-300 font-extrabold">Hạng #{targetRankPos}</strong>!
          </p>
        </div>
      </div>
    </div>
  );
};
