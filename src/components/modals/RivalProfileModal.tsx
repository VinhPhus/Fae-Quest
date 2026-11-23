import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { RANK_TIERS, getRankIndexByExp } from '../../constants/ranks';
import { SYSTEM_TITLES, resolveTitleObject } from '../../constants/systemQuests';
import { DEFAULT_COVER_URL } from './ChangeCoverModal';
import { EASING_SPRING } from '../../constants/motion';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { supabase } from '../../utils/supabaseClient';
import { calcExpMilestoneScore } from '../analytics/ProductivityAnalytics';
import { TaskCategory } from '../../types';
import {
  X,
  Trophy,
  Flame,
  Swords,
  Sparkles,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Equal,
  Hexagon,
  Loader2,
  BookOpen,
  Briefcase,
  Dumbbell,
  Heart,
  Palette,
  CheckCircle,
} from 'lucide-react';

interface RadarStatMini {
  key: string;
  name: string;
  shortName: string;
  score: number;
  icon: React.ReactNode;
}

export const RivalProfileModal: React.FC = () => {
  const {
    isRivalModalOpen,
    selectedRivalForModal: rival,
    closeRivalModal,
    playerName,
    avatarUrl,
    coverUrl,
    exp: myExp,
    streakDays: myStreak,
    completedTotal: myTasks,
    focusSessionsCompleted: myFocusSessions,
    cumulativeCategoryStats: myCumulativeCategoryStats,
    tasks: myTasksList,
    communityProfiles,
  } = useFaeQuestStore();

  const [activeTab, setActiveTab] = useState<'stats' | 'radar'>('stats');
  const [isComparing, setIsComparing] = useState(false);
  const [isComparingWithMe, setIsComparingWithMe] = useState(false);

  // Dữ liệu danh mục nhiệm vụ của đối thủ
  const [rivalCategoryStats, setRivalCategoryStats] = useState<Record<TaskCategory, { completed: number; expGained: number }> | null>(null);
  const [rivalFocusCount, setRivalFocusCount] = useState<number>(0);
  const [isLoadingRadar, setIsLoadingRadar] = useState<boolean>(false);

  const isOpen = Boolean(isRivalModalOpen && rival);
  useBodyScrollLock(isOpen);

  // 1. TÍNH CHỈ SỐ NĂNG LỰC CỦA CHÍNH NGƯỜI DÙNG (ĐỂ SO KÈO)
  const myAbilityScores = useMemo(() => {
    const catMap: Record<TaskCategory, { completed: number; expGained: number }> = {
      'hoc-tap': { completed: 0, expGained: 0 },
      'cong-viec': { completed: 0, expGained: 0 },
      'the-luc': { completed: 0, expGained: 0 },
      'ca-nhan': { completed: 0, expGained: 0 },
      'sang-tao': { completed: 0, expGained: 0 },
    };

    // Quét task hiện có
    myTasksList.forEach((t) => {
      const cat = catMap[t.category] ? t.category : 'ca-nhan';
      if (t.completed) {
        catMap[cat].completed += 1;
        catMap[cat].expGained += t.lastAwardedExp || 40;
      }
    });

    // Kết hợp cumulativeCategoryStats
    (['hoc-tap', 'cong-viec', 'the-luc', 'ca-nhan', 'sang-tao'] as TaskCategory[]).forEach((cat) => {
      const cum = myCumulativeCategoryStats?.[cat];
      if (cum) {
        catMap[cat].completed = Math.max(catMap[cat].completed, cum.completed || 0);
        catMap[cat].expGained = Math.max(catMap[cat].expGained, cum.expGained || 0);
      }
    });

    // Bù đắp bảo tồn nếu người dùng xóa task cũ
    const currentCompletedSum = Object.values(catMap).reduce((acc, c) => acc + c.completed, 0);
    if (myTasks > currentCompletedSum) {
      const diff = myTasks - currentCompletedSum;
      const perCat = Math.floor(diff / 5);
      (['hoc-tap', 'cong-viec', 'the-luc', 'ca-nhan', 'sang-tao'] as TaskCategory[]).forEach((cat) => {
        catMap[cat].completed += perCat;
      });
    }

    const currentExpSum = Object.values(catMap).reduce((acc, c) => acc + c.expGained, 0);
    if (myExp > currentExpSum && (currentExpSum === 0 || currentCompletedSum === 0)) {
      const diffExp = myExp - currentExpSum;
      const perCatExp = Math.floor(diffExp / 5);
      (['hoc-tap', 'cong-viec', 'the-luc', 'ca-nhan', 'sang-tao'] as TaskCategory[]).forEach((cat) => {
        catMap[cat].expGained += perCatExp;
      });
    }

    const triTue = calcExpMilestoneScore(catMap['hoc-tap'].expGained, catMap['hoc-tap'].completed);
    const suNghiep = calcExpMilestoneScore(catMap['cong-viec'].expGained, catMap['cong-viec'].completed);
    const theLuc = calcExpMilestoneScore(catMap['the-luc'].expGained, catMap['the-luc'].completed);
    const tuChu = calcExpMilestoneScore(catMap['ca-nhan'].expGained, catMap['ca-nhan'].completed);
    const sangTao = calcExpMilestoneScore(catMap['sang-tao'].expGained, catMap['sang-tao'].completed);

    const discPoints = (myStreak || 0) * 65 + (myFocusSessions || 0) * 85 + Math.min(300, (myTasks || 0) * 15);
    const kyLuat = calcExpMilestoneScore(discPoints, (myStreak || 0) + (myFocusSessions || 0));

    return [triTue, suNghiep, theLuc, kyLuat, tuChu, sangTao];
  }, [myTasksList, myCumulativeCategoryStats, myTasks, myExp, myStreak, myFocusSessions]);

  // 2. TẢI DỮ LIỆU NĂNG LỰC CỦA ĐỐI THỦ (QUA RPC AN TOÀN + FALLBACK THÔNG MINH)
  useEffect(() => {
    if (!isOpen || !rival) return;

    // Reset state khi mở modal mới
    setActiveTab('stats');
    setIsComparingWithMe(false);

    if (rival.isPlayer) {
      // Nếu là chính người chơi hiện tại, lấy từ dữ liệu của mình
      setRivalCategoryStats(myCumulativeCategoryStats || null);
      setRivalFocusCount(myFocusSessions || 0);
      setIsLoadingRadar(false);
      return;
    }

    let isMounted = true;
    setIsLoadingRadar(true);

    const fetchRivalStats = async () => {
      try {
        const { data, error } = await supabase.rpc('rpc_get_hunter_ability_stats', {
          p_hunter_id: rival.id,
        });

        if (!isMounted) return;

        if (!error && data && data.cumulativeCategoryStats) {
          setRivalCategoryStats(data.cumulativeCategoryStats);
          setRivalFocusCount(data.focusSessionsCompleted || 0);
          setIsLoadingRadar(false);
          return;
        }
      } catch (err) {
        console.warn('RPC rpc_get_hunter_ability_stats error, fallbacking to simulated stats:', err);
      }

      if (!isMounted) return;

      // FALLBACK THÔNG MINH: Tái cấu trúc mô phỏng năng lực từ EXP và Nhiệm vụ hoàn thành
      // Sử dụng seed hash từ rival.id để giữ kết quả cố định và nhất quán cho mỗi đối thủ
      const seed = rival.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const totalExp = rival.exp || 0;
      const totalCompleted = rival.completedTasks || 0;

      // Phân bổ tỷ lệ mô phỏng dựa trên seed hash
      const weights = [
        0.18 + (seed % 10) * 0.01,
        0.22 + ((seed >> 2) % 10) * 0.01,
        0.20 + ((seed >> 4) % 10) * 0.01,
        0.20 + ((seed >> 6) % 10) * 0.01,
        0.20 + ((seed >> 8) % 10) * 0.01,
      ];
      const sumWeight = weights.reduce((a, b) => a + b, 0);
      const normWeights = weights.map((w) => w / sumWeight);

      const simStats: Record<TaskCategory, { completed: number; expGained: number }> = {
        'hoc-tap': {
          completed: Math.round(totalCompleted * normWeights[0]),
          expGained: Math.round(totalExp * normWeights[0]),
        },
        'cong-viec': {
          completed: Math.round(totalCompleted * normWeights[1]),
          expGained: Math.round(totalExp * normWeights[1]),
        },
        'the-luc': {
          completed: Math.round(totalCompleted * normWeights[2]),
          expGained: Math.round(totalExp * normWeights[2]),
        },
        'ca-nhan': {
          completed: Math.round(totalCompleted * normWeights[3]),
          expGained: Math.round(totalExp * normWeights[3]),
        },
        'sang-tao': {
          completed: Math.round(totalCompleted * normWeights[4]),
          expGained: Math.round(totalExp * normWeights[4]),
        },
      };

      setRivalCategoryStats(simStats);
      setRivalFocusCount(Math.min(20, Math.round((rival.streak || 0) * 0.8 + (seed % 5))));
      setIsLoadingRadar(false);
    };

    fetchRivalStats();

    return () => {
      isMounted = false;
    };
  }, [isOpen, rival?.id]);

  if (!isOpen || !rival || typeof document === 'undefined') return null;

  const rivalRankIdx = getRankIndexByExp(rival.exp);
  const rivalTier = RANK_TIERS[rivalRankIdx];

  // Resolve matching title
  const matchingTitle =
    Object.values(SYSTEM_TITLES).find(
      (t) => t.name === rival.equippedTitle || t.id === rival.equippedTitle
    ) || resolveTitleObject(rival.equippedTitle);

  // Tìm profile mới nhất trong danh sách communityProfiles nếu có
  const liveProfile = (communityProfiles || []).find((p) => p.id === rival.id);
  const candidateCover = rival.isPlayer
    ? (coverUrl && coverUrl.trim() ? coverUrl : (liveProfile?.cover_url || rival.coverUrl || rival.cover_url))
    : (liveProfile?.cover_url || rival.coverUrl || rival.cover_url);

  const coverImage =
    candidateCover && typeof candidateCover === 'string' && candidateCover.trim() !== ''
      ? candidateCover.trim()
      : DEFAULT_COVER_URL;

  // Comparison deltas
  const expDiff = myExp - rival.exp;
  const streakDiff = myStreak - rival.streak;
  const tasksDiff = myTasks - rival.completedTasks;

  // 3. TÍNH 6 ĐỈNH NĂNG LỰC CỦA ĐỐI THỦ
  const rivalRadarStats: RadarStatMini[] = [
    {
      key: 'tri-tue',
      name: 'TRÍ TUỆ',
      shortName: 'Trí Tuệ',
      score: calcExpMilestoneScore(
        rivalCategoryStats?.['hoc-tap']?.expGained || 0,
        rivalCategoryStats?.['hoc-tap']?.completed || 0
      ),
      icon: <BookOpen className="w-3 h-3 text-cyan-300" />,
    },
    {
      key: 'su-nghiep',
      name: 'SỰ NGHIỆP',
      shortName: 'Sự Nghiệp',
      score: calcExpMilestoneScore(
        rivalCategoryStats?.['cong-viec']?.expGained || 0,
        rivalCategoryStats?.['cong-viec']?.completed || 0
      ),
      icon: <Briefcase className="w-3 h-3 text-blue-400" />,
    },
    {
      key: 'the-chat',
      name: 'THỂ CHẤT',
      shortName: 'Thể Chất',
      score: calcExpMilestoneScore(
        rivalCategoryStats?.['the-luc']?.expGained || 0,
        rivalCategoryStats?.['the-luc']?.completed || 0
      ),
      icon: <Dumbbell className="w-3 h-3 text-emerald-400" />,
    },
    {
      key: 'ky-luat',
      name: 'KỶ LUẬT',
      shortName: 'Kỷ Luật',
      score: calcExpMilestoneScore(
        (rival.streak || 0) * 65 + (rivalFocusCount || 0) * 85 + Math.min(300, (rival.completedTasks || 0) * 15),
        (rival.streak || 0) + (rivalFocusCount || 0)
      ),
      icon: <Flame className="w-3 h-3 text-orange-400" />,
    },
    {
      key: 'tu-chu',
      name: 'TỰ CHỦ',
      shortName: 'Tự Chủ',
      score: calcExpMilestoneScore(
        rivalCategoryStats?.['ca-nhan']?.expGained || 0,
        rivalCategoryStats?.['ca-nhan']?.completed || 0
      ),
      icon: <Heart className="w-3 h-3 text-pink-400" />,
    },
    {
      key: 'sang-tao',
      name: 'SÁNG TẠO',
      shortName: 'Sáng Tạo',
      score: calcExpMilestoneScore(
        rivalCategoryStats?.['sang-tao']?.expGained || 0,
        rivalCategoryStats?.['sang-tao']?.completed || 0
      ),
      icon: <Palette className="w-3 h-3 text-amber-300" />,
    },
  ];

  // Điểm trung bình của đối thủ
  const rivalAvgScore = parseFloat(
    (rivalRadarStats.reduce((sum, s) => sum + s.score, 0) / 6).toFixed(1)
  );

  // Xác định Hệ Thợ Săn của đối thủ
  const getRivalArchetype = () => {
    const sorted = [...rivalRadarStats].sort((a, b) => b.score - a.score);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];
    const diff = strongest.score - weakest.score;

    if (diff <= 0.5 && rivalAvgScore >= 2.0) {
      return { title: 'Thợ Săn Toàn Diện', badge: '⭐ Toàn Diện' };
    }
    switch (strongest.key) {
      case 'tri-tue':
        return { title: 'Học Giả Hắc Ám', badge: '📜 Trí Tuệ' };
      case 'the-chat':
        return { title: 'Chiến Binh Thép', badge: '🛡️ Thể Chất' };
      case 'su-nghiep':
        return { title: 'Chiến Lược Gia', badge: '👑 Sự Nghiệp' };
      case 'tu-chu':
        return { title: 'Hành Giả Tĩnh Tâm', badge: '🧘 Tự Chủ' };
      case 'sang-tao':
        return { title: 'Nghệ Sĩ Hư Không', badge: '🎨 Sáng Tạo' };
      case 'ky-luat':
        return { title: 'Bậc Thầy Thiết Luật', badge: '⚡ Kỷ Luật' };
      default:
        return { title: 'Thợ Săn Tinh Anh', badge: '⚔️ Tinh Anh' };
    }
  };

  const rivalArchetype = getRivalArchetype();

  // 4. HÌNH HỌC LỤC GIÁC MINI (ViewBox 0 0 320 280, cx=160, cy=135, r=68)
  const cx = 160;
  const cy = 135;
  const radius = 68;
  const totalLevels = 5;

  const angles = [
    -Math.PI / 2, // 0: Top (-90 deg)
    -Math.PI / 6, // 1: Top-Right (-30 deg)
    Math.PI / 6, // 2: Bottom-Right (30 deg)
    Math.PI / 2, // 3: Bottom (90 deg)
    (5 * Math.PI) / 6, // 4: Bottom-Left (150 deg)
    (7 * Math.PI) / 6, // 5: Top-Left (210 deg)
  ];

  const getMiniHexagonPoints = (r: number) => {
    return angles
      .map((ang) => {
        const x = cx + r * Math.cos(ang);
        const y = cy + r * Math.sin(ang);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Đa giác đối thủ
  const rivalPoints = rivalRadarStats.map((stat, idx) => {
    const valRadius = (Math.max(0.6, Math.min(5.0, stat.score)) / 5.0) * radius;
    const x = cx + valRadius * Math.cos(angles[idx]);
    const y = cy + valRadius * Math.sin(angles[idx]);
    return { x, y, score: stat.score, name: stat.name };
  });

  const rivalPointsString = rivalPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Đa giác của chính người dùng (khi bật so kèo)
  const myPoints = myAbilityScores.map((score, idx) => {
    const valRadius = (Math.max(0.6, Math.min(5.0, score)) / 5.0) * radius;
    const x = cx + valRadius * Math.cos(angles[idx]);
    const y = cy + valRadius * Math.sin(angles[idx]);
    return { x, y, score };
  });

  const myPointsString = myPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const renderAvatar = (name: string, url: string | null | undefined) => {
    const isUrl = url && (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:'));
    if (isUrl) {
      return (
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    const initial = name ? name.trim().charAt(0).toUpperCase() : '?';
    return (
      <div className="w-full h-full rounded-full bg-[#253745] flex items-center justify-center text-xl font-black text-[#CCD0CF]">
        {url && url.length <= 4 ? url : initial}
      </div>
    );
  };

  const renderDeltaPill = (diff: number, unit = '') => {
    if (diff > 0) {
      return (
        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          <span>+{diff.toLocaleString()} {unit} (Dẫn trước)</span>
        </span>
      );
    }
    if (diff < 0) {
      return (
        <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-400/30 flex items-center gap-1">
          <TrendingDown className="w-3 h-3" />
          <span>{diff.toLocaleString()} {unit} (Bám đuổi)</span>
        </span>
      );
    }
    return (
      <span className="text-[11px] font-bold text-[#CCD0CF] bg-[#253745] px-2 py-0.5 rounded-full border border-[#4A5C6A] flex items-center gap-1">
        <Equal className="w-3 h-3" />
        <span>Bằng nhau</span>
      </span>
    );
  };

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 w-screen h-[100dvh] z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 touch-none overscroll-none"
        onClick={closeRivalModal}
        onTouchMove={(e) => {
          if (e.target === e.currentTarget) e.preventDefault();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.28, ease: EASING_SPRING }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[440px] max-h-[90dvh] flex flex-col rounded-3xl bg-[#0B1720] border border-white/15 overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.85)]"
        >
          {/* NÚT ĐÓNG CỐ ĐỊNH Ở GÓC TRÊN BÊN PHẢI (KHÔNG BỊ CUỘN THEO NỘI DUNG) */}
          <button
            type="button"
            onClick={closeRivalModal}
            className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-[#06141B]/80 hover:bg-[#06141B] backdrop-blur-md text-[#CCD0CF] hover:text-white border border-white/20 flex items-center justify-center transition cursor-pointer shadow-lg"
            title="Đóng thẻ hồ sơ"
          >
            <X className="w-4 h-4" />
          </button>

          {/* VÙNG CUỘN NỘI DUNG CHÍNH (FLEX-1 OVERFLOW-Y-AUTO OVERScroll-CONTAIN) */}
          <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-3.5 sm:p-4 space-y-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#06141B] [&::-webkit-scrollbar-thumb]:bg-[#253745] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#4A5C6A]">
            {/* Phần 1 — Ảnh Bìa Thu Gọn h-[124px] */}
            <div className="h-[124px] w-full rounded-[20px] overflow-hidden relative bg-[#06141B] shrink-0 border border-[#253745]">
              <img
                src={coverImage}
                alt={`${rival.name} Cover`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_COVER_URL;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1720] via-transparent to-black/40" />

              {/* Badge Thứ Hạng Góc Trái */}
              <div className="absolute top-3 left-3 z-10">
                {rival.isPlayer ? (
                  <div className="px-2.5 py-1 rounded-full bg-[#06141B]/85 backdrop-blur-md border border-[#4A5C6A] text-xs font-black text-[#CCD0CF] flex items-center gap-1.5 shadow-md">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>HỒ SƠ CỦA BẠN</span>
                  </div>
                ) : rival.rankPos ? (
                  <div className="px-2.5 py-1 rounded-full bg-[#06141B]/85 backdrop-blur-md border border-amber-400/50 text-xs font-black text-amber-300 flex items-center gap-1.5 shadow-md">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hạng #{rival.rankPos}</span>
                  </div>
                ) : (
                  <div className="px-2.5 py-1 rounded-full bg-[#06141B]/85 backdrop-blur-md border border-[#4A5C6A] text-xs font-bold text-[#CCD0CF] flex items-center gap-1.5 shadow-md">
                    <Swords className="w-3.5 h-3.5 text-[#CCD0CF]" />
                    <span>Thợ Săn Fae</span>
                  </div>
                )}
              </div>
            </div>

            {/* Phần 2 — Avatar Chồng Biên & Huy Hiệu Rank */}
            <div className="flex items-end justify-between -mt-9 px-2 relative z-10">
              <div className="w-[72px] h-[72px] rounded-full p-1 bg-gradient-to-tr from-[#253745] via-[#4A5C6A] to-[#CCD0CF] ring-4 ring-[#0B1720] shadow-xl relative group shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#06141B]">
                  {renderAvatar(rival.name, (rival.isPlayer ? avatarUrl : rival.avatarUrl) || (rival as any).avatar)}
                </div>
                {/* Rank Icon Badge on Avatar */}
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#06141B] border border-[#4A5C6A] flex items-center justify-center shadow"
                  title={`Bậc ${rivalTier.name}`}
                >
                  <img
                    src={rivalTier.iconUrl}
                    alt={rivalTier.name}
                    className="w-4 h-4 object-contain [image-rendering:pixelated]"
                  />
                </div>
              </div>

              {/* Badge Bậc Rank */}
              <div className="mb-1 flex items-center gap-1.5">
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#06141B] border border-[#4A5C6A] text-[#CCD0CF] shadow-inner flex items-center gap-1">
                  <img src={rivalTier.iconUrl} alt={rivalTier.name} className="w-3.5 h-3.5 object-contain [image-rendering:pixelated]" />
                  <span>{rivalTier.name}</span>
                </span>
              </div>
            </div>

            {/* Phần 3 — Tên Thợ Săn, Danh Hiệu & NÚT ICON LỤC GIÁC */}
            <div className="flex items-start justify-between gap-3 px-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-[#CCD0CF] font-rpg truncate tracking-wide leading-tight">
                  {rival.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#9BA8AB] flex-wrap">
                  <span>⚔️ Bậc {rivalTier.name}</span>
                  {Boolean(rival.stars && rival.stars > 0) && (
                    <>
                      <span>•</span>
                      <span className="text-amber-300 font-bold">⭐ {rival.stars} Sao</span>
                    </>
                  )}
                  {/* NÚT ICON SƠ ĐỒ LỤC GIÁC THIẾT KẾ GỌN GÀNG */}
                  <button
                    type="button"
                    onClick={() => setActiveTab((prev) => (prev === 'radar' ? 'stats' : 'radar'))}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold transition-all shadow-sm ${
                      activeTab === 'radar'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
                        : 'border-white/15 bg-white/5 hover:border-amber-400/50 text-[#CCD0CF] hover:text-white'
                    }`}
                    title="Xem Sơ Đồ Lục Giác Năng Lực"
                  >
                    <Hexagon className="w-3 h-3 text-cyan-300 fill-cyan-400/20" />
                    <span>Lục Giác</span>
                  </button>
                </div>
              </div>

              {/* Danh Hiệu Đang Trang Bị */}
              <div
                className="bg-[#253745]/80 border border-[#4A5C6A] rounded-full px-3 py-1 flex items-center gap-1.5 shrink-0 shadow-sm max-w-[160px]"
                title={`Danh hiệu: ${matchingTitle.name}`}
              >
                {matchingTitle.iconUrl ? (
                  <img
                    src={matchingTitle.iconUrl}
                    alt={matchingTitle.name}
                    className="w-3.5 h-3.5 object-contain [image-rendering:pixelated] shrink-0 drop-shadow"
                  />
                ) : (
                  <span className="text-xs shrink-0">{matchingTitle.icon || '🏷️'}</span>
                )}
                <span className="text-[11px] font-semibold text-[#CCD0CF] truncate">
                  {matchingTitle.name}
                </span>
              </div>
            </div>

            {/* Phần 4 — Hàng 3 Chỉ Số Cốt Lõi (Kỷ Luật, Nhiệm Vụ, EXP) */}
            <div className="border-y border-[#253745]/80 py-2.5 px-2 grid grid-cols-3 text-center divide-x divide-[#253745]/60 bg-[#06141B]/40 rounded-2xl">
              <div className="px-1 flex flex-col items-center">
                <div className="flex items-center gap-1 text-base font-bold text-[#CCD0CF]">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                  <span>{rival.streak}N</span>
                </div>
                <span className="text-[10px] text-[#9BA8AB] mt-0.5 font-medium">Chuỗi Kỷ Luật</span>
              </div>

              <div className="px-1 flex flex-col items-center">
                <div className="flex items-center gap-1 text-base font-bold text-[#CCD0CF]">
                  <Swords className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{rival.completedTasks}</span>
                </div>
                <span className="text-[10px] text-[#9BA8AB] mt-0.5 font-medium">Task Đã Xong</span>
              </div>

              <div className="px-1 flex flex-col items-center">
                <div className="flex items-center gap-1 text-base font-bold text-[#CCD0CF]">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{rival.exp.toLocaleString()}</span>
                </div>
                <span className="text-[10px] text-[#9BA8AB] mt-0.5 font-medium">Tổng EXP</span>
              </div>
            </div>

            {/* Phần 5 — NỘI DUNG ĐỔI TAB: TAB MINI SƠ ĐỒ LỤC GIÁC VS CHỈ SỐ ĐỐI CHIẾU */}
            {activeTab === 'radar' ? (
              /* ================= TAB MINI: SƠ ĐỒ LỤC GIÁC NĂNG LỰC ================= */
              <motion.div
                key="radar-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl p-3 bg-[#06141B] border border-[#253745] space-y-2.5 shadow-inner"
              >
                {/* Header Tab Mini: Hệ Thợ Săn, Điểm Trung Bình & Nút So Kèo */}
                <div className="flex items-center justify-between pb-2 border-b border-[#253745] gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-extrabold text-cyan-300 truncate">
                      {rivalArchetype.badge}
                    </span>
                    <span className="font-rpg font-bold text-white text-xs truncate">
                      {rivalArchetype.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-amber-300 text-xs">
                      Avg: {rivalAvgScore} / 5.0
                    </span>

                    {/* NÚT GẠT SO KÈO LỤC GIÁC VỚI BẠN */}
                    <button
                      type="button"
                      onClick={() => setIsComparingWithMe(!isComparingWithMe)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                        isComparingWithMe
                          ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                          : 'bg-[#11212D] border-[#4A5C6A] text-[#9BA8AB] hover:text-[#CCD0CF]'
                      }`}
                      title="Vẽ đè đa giác năng lực của bạn lên để so sánh"
                    >
                      <Swords className="w-3 h-3" />
                      <span>{isComparingWithMe ? 'Đang so kèo' : 'So kèo với bạn'}</span>
                    </button>
                  </div>
                </div>

                {/* Loading state nếu đang fetch dữ liệu */}
                {isLoadingRadar ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#9BA8AB] text-xs">
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                    <span>Đang phân tích năng lực Thợ Săn...</span>
                  </div>
                ) : (
                  <>
                    {/* SVG BIỂU ĐỒ LỤC GIÁC MINI (ViewBox 320x270, Đỉnh Dưới Kỷ Luật An Toàn Tuyệt Đối) */}
                    <div className="relative py-1 flex flex-col items-center justify-center">
                      <svg
                        viewBox="0 0 320 270"
                        className="w-full h-auto max-w-[290px] overflow-visible drop-shadow-[0_8px_20px_rgba(0,0,0,0.8)]"
                      >
                        <defs>
                          <filter id="mini-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2.5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                          <linearGradient id="rival-poly-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.38" />
                            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.18" />
                          </linearGradient>
                        </defs>

                        {/* 5 Vòng Lục Giác Đồng Tâm */}
                        {Array.from({ length: totalLevels }, (_, i) => i + 1).map((lvl) => {
                          const r = (lvl / totalLevels) * radius;
                          const isOuter = lvl === totalLevels;
                          return (
                            <polygon
                              key={lvl}
                              points={getMiniHexagonPoints(r)}
                              fill="none"
                              stroke={isOuter ? '#4A5C6A' : '#1C2C38'}
                              strokeWidth={isOuter ? 1.2 : 0.8}
                              strokeDasharray={isOuter ? undefined : '2 2'}
                            />
                          );
                        })}

                        {/* 6 Trục Hướng Tâm */}
                        {angles.map((ang, i) => {
                          const x2 = cx + radius * Math.cos(ang);
                          const y2 = cy + radius * Math.sin(ang);
                          return (
                            <line
                              key={i}
                              x1={cx}
                              y1={cy}
                              x2={x2}
                              y2={y2}
                              stroke="#253745"
                              strokeWidth="1"
                            />
                          );
                        })}

                        {/* Đa Giác Của Đối Thủ (Xanh Ngọc Lam) */}
                        <polygon
                          points={rivalPointsString}
                          fill="url(#rival-poly-grad)"
                          stroke="#22D3EE"
                          strokeWidth="2"
                          filter="url(#mini-glow)"
                          className="transition-all duration-300"
                        />

                        {/* 6 Đỉnh Đối Thủ */}
                        {rivalPoints.map((p, idx) => (
                          <g key={idx}>
                            <circle cx={p.x} cy={p.y} r="4" fill="#22D3EE" fillOpacity="0.4" />
                            <circle cx={p.x} cy={p.y} r="2.5" fill="#FFFFFF" stroke="#06141B" strokeWidth="1" />
                          </g>
                        ))}

                        {/* ĐA GIÁC CỦA CHÍNH BẠN (KHI BẬT SO KÈO: Nét Đứt Vàng Ánh Kim) */}
                        {isComparingWithMe && (
                          <>
                            <polygon
                              points={myPointsString}
                              fill="rgba(245, 158, 11, 0.16)"
                              stroke="#FBBF24"
                              strokeWidth="1.8"
                              strokeDasharray="4 3"
                              className="transition-all duration-300"
                            />
                            {myPoints.map((p, idx) => (
                              <circle key={idx} cx={p.x} cy={p.y} r="2.5" fill="#FBBF24" stroke="#06141B" strokeWidth="1" />
                            ))}
                          </>
                        )}

                        {/* Nhãn 6 Đỉnh (Khoảng Cách Đã Mở Rộng, Tuyệt Đối Không Cắt Mép) */}
                        {rivalRadarStats.map((stat, idx) => {
                          let lx = cx;
                          let ly = cy;
                          let anchor: 'start' | 'middle' | 'end' = 'middle';

                          if (idx === 0) {
                            // TRÍ TUỆ (Top)
                            lx = cx;
                            ly = cy - radius - 10;
                            anchor = 'middle';
                          } else if (idx === 1) {
                            // SỰ NGHIỆP (Top-Right)
                            lx = cx + radius * Math.cos(angles[idx]) + 8;
                            ly = cy + radius * Math.sin(angles[idx]) - 2;
                            anchor = 'start';
                          } else if (idx === 2) {
                            // THỂ CHẤT (Bottom-Right)
                            lx = cx + radius * Math.cos(angles[idx]) + 8;
                            ly = cy + radius * Math.sin(angles[idx]) + 10;
                            anchor = 'start';
                          } else if (idx === 3) {
                            // KỶ LUẬT (Bottom)
                            lx = cx;
                            ly = cy + radius + 16;
                            anchor = 'middle';
                          } else if (idx === 4) {
                            // TỰ CHỦ (Bottom-Left)
                            lx = cx - radius * Math.cos(Math.PI / 6) - 8;
                            ly = cy + radius * Math.sin(angles[idx]) + 10;
                            anchor = 'end';
                          } else if (idx === 5) {
                            // SÁNG TẠO (Top-Left)
                            lx = cx - radius * Math.cos(Math.PI / 6) - 8;
                            ly = cy + radius * Math.sin(angles[idx]) - 2;
                            anchor = 'end';
                          }

                          return (
                            <g key={stat.key}>
                              <text
                                x={lx}
                                y={ly}
                                textAnchor={anchor}
                                fontSize="8.5"
                                fontWeight="bold"
                                fill="#CCD0CF"
                                className="select-none"
                              >
                                {stat.name}
                              </text>
                              <text
                                x={lx}
                                y={ly + 10}
                                textAnchor={anchor}
                                fontSize="8"
                                fontFamily="monospace"
                                fontWeight="bold"
                                fill="#22D3EE"
                                className="select-none"
                              >
                                {stat.score.toFixed(1)}
                                {isComparingWithMe && (
                                  <tspan fill="#FBBF24"> vs {myAbilityScores[idx].toFixed(1)}</tspan>
                                )}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Chú Thích Màu Sắc Khi So Kèo */}
                    {isComparingWithMe && (
                      <div className="flex items-center justify-center gap-4 pt-1 border-t border-[#253745] text-[10px] font-bold">
                        <span className="flex items-center gap-1.5 text-cyan-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                          <span>{rival.name}</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-amber-300">
                          <span className="w-2.5 h-0.5 border-t border-dashed border-amber-400 inline-block" />
                          <span>Bạn ({playerName})</span>
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Nút quay lại xem đối chiếu chỉ số */}
                <button
                  type="button"
                  onClick={() => setActiveTab('stats')}
                  className="w-full mt-1 py-1.5 rounded-xl bg-[#11212D] hover:bg-[#253745] border border-[#253745] text-xs font-semibold text-[#CCD0CF] hover:text-white flex items-center justify-center gap-1.5 transition"
                >
                  <ArrowLeftRight className="w-3 h-3 text-cyan-400" />
                  <span>Xem Chi Tiết Chỉ Số Đối Chiếu</span>
                </button>
              </motion.div>
            ) : (
              /* ================= TAB 2: CHỈ SỐ ĐỐI CHIẾU MỞ RỘNG (GỠ BỎ MAX-H CẮT CHỮ) ================= */
              <div className="space-y-3">
                {/* Khung So Sánh Chỉ Số Mở Rộng (Hiển thị đầy đủ 100% không bị cắt) */}
                <AnimatePresence initial={false}>
                  {isComparing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: EASING_SPRING }}
                      className="overflow-visible"
                    >
                      <div className="rounded-2xl p-3.5 bg-[#06141B] border border-[#253745] space-y-3 shadow-inner">
                        <div className="flex items-center justify-between pb-2 border-b border-[#253745] text-xs">
                          <span className="text-[#9BA8AB] font-bold">Chỉ số đối chiếu</span>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#CCD0CF]">Bạn</span>
                            <span className="text-[#4A5C6A]">vs</span>
                            <span className="font-extrabold text-amber-300">{rival.name}</span>
                          </div>
                        </div>

                        {/* So sánh EXP */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#9BA8AB] flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>Kinh Nghiệm:</span>
                            </span>
                            {renderDeltaPill(expDiff, 'EXP')}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-[#9BA8AB] font-mono px-1">
                            <span>Bạn: {myExp.toLocaleString()}</span>
                            <span>Đối thủ: {rival.exp.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* So sánh Chuỗi Ngày */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#9BA8AB] flex items-center gap-1">
                              <Flame className="w-3 h-3 text-amber-400" />
                              <span>Chuỗi Ngày:</span>
                            </span>
                            {renderDeltaPill(streakDiff, 'ngày')}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-[#9BA8AB] font-mono px-1">
                            <span>Bạn: {myStreak} ngày</span>
                            <span>Đối thủ: {rival.streak} ngày</span>
                          </div>
                        </div>

                        {/* So sánh Nhiệm Vụ Đã Xong */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#9BA8AB] flex items-center gap-1">
                              <Swords className="w-3 h-3 text-cyan-400" />
                              <span>Nhiệm Vụ Đã Xong:</span>
                            </span>
                            {renderDeltaPill(tasksDiff, 'task')}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-[#9BA8AB] font-mono px-1">
                            <span>Bạn: {myTasks} task</span>
                            <span>Đối thủ: {rival.completedTasks} task</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Nút Bật/Tắt So Sánh Chỉ Số Đối Chiếu */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setIsComparing((prev) => !prev)}
                  className="w-full rounded-2xl bg-[#06141B] hover:bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] p-2.5 flex items-center justify-between transition-all group cursor-pointer shadow-md"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#253745] group-hover:bg-[#4A5C6A] text-[#CCD0CF] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>

                  <span className="text-xs font-extrabold text-[#CCD0CF] group-hover:text-white tracking-wide px-2">
                    {isComparing ? 'Thu Gọn Chỉ Số Đối Chiếu' : '⚔️ So Sánh Chỉ Số Với Bạn'}
                  </span>

                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9BA8AB] group-hover:text-[#CCD0CF]">
                    {isComparing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
