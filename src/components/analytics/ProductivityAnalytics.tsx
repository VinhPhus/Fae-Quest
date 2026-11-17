import React, { useState } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CATEGORIES, DIFFICULTIES } from '../../constants/categories';
import { TaskCategory, TaskDifficulty } from '../../types';
import {
  Flame,
  CheckCircle,
  TrendingUp,
  Award,
  Sparkles,
  PieChart,
  BookOpen,
  Briefcase,
  Dumbbell,
  Heart,
  Palette,
  Shield,
  Zap,
  Info,
} from 'lucide-react';

interface RadarStat {
  key: string;
  name: string;
  shortName: string;
  score: number;
  completedTasks: number;
  totalTasks: number;
  expGained: number;
  description: string;
  icon: React.ReactNode;
}

export const ProductivityAnalyticsHeader: React.FC = () => {
  const { tasks, completedTotal, streakDays, exp } = useFaeQuestStore();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Header Banner */}
      <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-[#11212D] border border-[#253745] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#253745] border border-[#4A5C6A] text-xs font-bold text-[#CCD0CF] mb-1 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>SƠ ĐỒ LỤC GIÁC NĂNG LỰC & CHỈ SỐ HIỆU SUẤT</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-rpg tracking-wide">
            Phân Tích Năng Suất Cá Nhân
          </h2>
          <p className="text-xs text-[#9BA8AB] mt-1 max-w-2xl leading-relaxed hidden sm:block">
            Theo dõi tiến độ hoàn thành các mục tiêu rèn luyện và duy trì cân bằng 6 trụ cột năng lực Thợ Săn.
          </p>
        </div>

        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#06141B] border border-[#253745] shrink-0 shadow-inner">
          <div className="text-right">
            <span className="text-[10px] text-[#9BA8AB] uppercase font-bold block">Chuỗi Kỷ Luật</span>
            <span className="text-sm font-extrabold text-orange-300">{streakDays} Ngày Liên Tiếp</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-sm shadow">
            🔥
          </div>
        </div>
      </div>

      {/* TẦNG 1: 4 Thẻ KPI Tóm Tắt (Summary Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Chuỗi Kỷ Luật */}
        <div className="rounded-2xl p-3 sm:p-3.5 bg-[#11212D] border border-[#253745] flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 shadow-inner">
            <Flame className="w-5 h-5 fill-orange-400" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-[#9BA8AB] block font-semibold">Chuỗi Kỷ Luật</span>
            <span className="text-base font-black text-orange-300 truncate block">
              {streakDays} Ngày
            </span>
          </div>
        </div>

        {/* Card 2: Tỷ Lệ Hoàn Thành */}
        <div className="rounded-2xl p-3 sm:p-3.5 bg-[#11212D] border border-[#253745] flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-[#9BA8AB] block font-semibold">Tỷ Lệ Hoàn Thành</span>
            <span className="text-base font-black text-emerald-300 truncate block">
              {completionRate}% ({completedTasks}/{totalTasks})
            </span>
          </div>
        </div>

        {/* Card 3: Tổng EXP Tích Lũy */}
        <div className="rounded-2xl p-3 sm:p-3.5 bg-[#11212D] border border-[#253745] flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 shadow-inner">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-[#9BA8AB] block font-semibold">Tổng EXP</span>
            <span className="text-base font-black text-cyan-300 truncate block">
              {exp.toLocaleString()} EXP
            </span>
          </div>
        </div>

        {/* Card 4: Tổng Đã Hoàn Tất */}
        <div className="rounded-2xl p-3 sm:p-3.5 bg-[#11212D] border border-[#253745] flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-[#9BA8AB] block font-semibold">Đã Hoàn Tất</span>
            <span className="text-base font-black text-amber-300 truncate block">
              {completedTotal} Việc
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProductivityAnalytics: React.FC = () => {
  const { tasks, completedTotal, streakDays, exp, focusSessionsCompleted } = useFaeQuestStore();

  const [activeStatIndex, setActiveStatIndex] = useState<number | null>(null);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Breakdown by category and difficulty
  const categoryData: Record<
    TaskCategory,
    { total: number; completed: number; expGained: number }
  > = {
    'hoc-tap': { total: 0, completed: 0, expGained: 0 },
    'cong-viec': { total: 0, completed: 0, expGained: 0 },
    'the-luc': { total: 0, completed: 0, expGained: 0 },
    'ca-nhan': { total: 0, completed: 0, expGained: 0 },
    'sang-tao': { total: 0, completed: 0, expGained: 0 },
  };

  const difficultyCounts: Record<TaskDifficulty, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
    boss: 0,
  };

  tasks.forEach((t) => {
    if (categoryData[t.category]) {
      categoryData[t.category].total += 1;
      if (t.completed) {
        categoryData[t.category].completed += 1;
        const awarded = t.lastAwardedExp || DIFFICULTIES[t.difficulty]?.exp || 40;
        categoryData[t.category].expGained += awarded;

        if (difficultyCounts[t.difficulty] !== undefined) {
          difficultyCounts[t.difficulty] += 1;
        }
      }
    }
  });

  // Calculate 6 RPG Ability Parameters (0.0 -> 5.0)
  // 1. TRÍ TUỆ (Học tập)
  const calcScore = (completed: number, expG: number) => {
    const raw = 1.0 + completed * 0.7 + expG / 250;
    return Math.min(5.0, Math.max(1.0, parseFloat(raw.toFixed(1))));
  };

  const triTueScore = calcScore(
    categoryData['hoc-tap'].completed,
    categoryData['hoc-tap'].expGained
  );

  const suNghiepScore = calcScore(
    categoryData['cong-viec'].completed,
    categoryData['cong-viec'].expGained
  );

  const theLucScore = calcScore(
    categoryData['the-luc'].completed,
    categoryData['the-luc'].expGained
  );

  const rawKyLuat = 1.0 + (focusSessionsCompleted || 0) * 0.6 + (streakDays || 0) * 0.4;
  const kyLuatScore = Math.min(5.0, Math.max(1.0, parseFloat(rawKyLuat.toFixed(1))));

  const tuChuScore = calcScore(
    categoryData['ca-nhan'].completed,
    categoryData['ca-nhan'].expGained
  );

  const sangTaoScore = calcScore(
    categoryData['sang-tao'].completed,
    categoryData['sang-tao'].expGained
  );

  // 6 Radar Stats in clock-wise order starting from top (-90 deg):
  // 0: TRÍ TUỆ (Top)
  // 1: SỰ NGHIỆP (Top-Right)
  // 2: THỂ CHẤT (Bottom-Right)
  // 3: KỶ LUẬT (Bottom)
  // 4: TỰ CHỦ (Bottom-Left)
  // 5: SÁNG TẠO (Top-Left)
  const radarStats: RadarStat[] = [
    {
      key: 'tri-tue',
      name: 'TRÍ TUỆ',
      shortName: 'Trí Tuệ',
      score: triTueScore,
      completedTasks: categoryData['hoc-tap'].completed,
      totalTasks: categoryData['hoc-tap'].total,
      expGained: categoryData['hoc-tap'].expGained,
      description: 'Học tập, đọc sách, nghiên cứu tri thức và rèn luyện trí tuệ.',
      icon: <BookOpen className="w-3.5 h-3.5 text-cyan-300" />,
    },
    {
      key: 'su-nghiep',
      name: 'SỰ NGHIỆP',
      shortName: 'Sự Nghiệp',
      score: suNghiepScore,
      completedTasks: categoryData['cong-viec'].completed,
      totalTasks: categoryData['cong-viec'].total,
      expGained: categoryData['cong-viec'].expGained,
      description: 'Công việc chuyên môn, quản lý dự án và các mục tiêu thăng tiến.',
      icon: <Briefcase className="w-3.5 h-3.5 text-blue-300" />,
    },
    {
      key: 'the-chat',
      name: 'THỂ CHẤT',
      shortName: 'Thể Chất',
      score: theLucScore,
      completedTasks: categoryData['the-luc'].completed,
      totalTasks: categoryData['the-luc'].total,
      expGained: categoryData['the-luc'].expGained,
      description: 'Thể thao, gym, chạy bộ, dinh dưỡng và tái tạo năng lượng.',
      icon: <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      key: 'ky-luat',
      name: 'KỶ LUẬT',
      shortName: 'Kỷ Luật',
      score: kyLuatScore,
      completedTasks: focusSessionsCompleted || 0,
      totalTasks: focusSessionsCompleted || 0,
      expGained: (streakDays || 0) * 50,
      description: 'Chuỗi ngày liên tiếp và các phiên tập trung Fae Focus không xao nhãng.',
      icon: <Flame className="w-3.5 h-3.5 text-orange-400" />,
    },
    {
      key: 'tu-chu',
      name: 'TỰ CHỦ',
      shortName: 'Tự Chủ',
      score: tuChuScore,
      completedTasks: categoryData['ca-nhan'].completed,
      totalTasks: categoryData['ca-nhan'].total,
      expGained: categoryData['ca-nhan'].expGained,
      description: 'Kế hoạch cá nhân, thói quen sinh hoạt và quản lý cuộc sống.',
      icon: <Heart className="w-3.5 h-3.5 text-pink-400" />,
    },
    {
      key: 'sang-tao',
      name: 'SÁNG TẠO',
      shortName: 'Sáng Tạo',
      score: sangTaoScore,
      completedTasks: categoryData['sang-tao'].completed,
      totalTasks: categoryData['sang-tao'].total,
      expGained: categoryData['sang-tao'].expGained,
      description: 'Nghệ thuật, viết lách, ý tưởng đổi mới và giải pháp đột phá.',
      icon: <Palette className="w-3.5 h-3.5 text-amber-300" />,
    },
  ];

  // Radar geometry calculations
  const cx = 190;
  const cy = 160;
  const radius = 95;
  const totalLevels = 5;

  const angles = [
    -Math.PI / 2, // 0: Top (-90 deg)
    -Math.PI / 6, // 1: Top-Right (-30 deg)
    Math.PI / 6, // 2: Bottom-Right (30 deg)
    Math.PI / 2, // 3: Bottom (90 deg)
    (5 * Math.PI) / 6, // 4: Bottom-Left (150 deg)
    (7 * Math.PI) / 6, // 5: Top-Left (210 deg)
  ];

  // Helper to generate polygon points string for a given level
  const getHexagonPoints = (r: number) => {
    return angles
      .map((ang) => {
        const x = cx + r * Math.cos(ang);
        const y = cy + r * Math.sin(ang);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Player polygon points
  const playerPoints = radarStats
    .map((stat, idx) => {
      const valRadius = (Math.max(0.6, Math.min(5.0, stat.score)) / 5.0) * radius;
      const x = cx + valRadius * Math.cos(angles[idx]);
      const y = cy + valRadius * Math.sin(angles[idx]);
      return { x, y, score: stat.score, name: stat.name };
    });

  const playerPointsString = playerPoints
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  // Archetype & Power Rank Computation
  const sortedStats = [...radarStats].sort((a, b) => b.score - a.score);
  const avgScore = parseFloat(
    (radarStats.reduce((sum, s) => sum + s.score, 0) / 6).toFixed(1)
  );

  const getArchetype = () => {
    const diff = sortedStats[0].score - sortedStats[5].score;
    if (diff <= 0.6) {
      return {
        title: 'Chiến Binh Toàn Năng',
        badge: '🔥 Toàn Năng',
        description: 'Chỉ số phát triển đồng đều, cân bằng hoàn hảo giữa kỷ luật, trí tuệ và sự nghiệp.',
      };
    }
    const pair = `${sortedStats[0].key}_${sortedStats[1].key}`;
    if (pair.includes('tri-tue') && pair.includes('ky-luat')) {
      return {
        title: 'Học Giả Kỷ Luật',
        badge: '⚔️ Trí Tuệ & Ý Chí',
        description: 'Ý chí sắt đá kết hợp kiến thức sâu rộng, biến việc rèn luyện thành sức mạnh tuyệt đối.',
      };
    }
    if (pair.includes('su-nghiep') && pair.includes('ky-luat')) {
      return {
        title: 'Chỉ Huy Tinh Anh',
        badge: '👑 Lãnh Đạo',
        description: 'Hiệu suất công việc vượt trội cùng tính kỷ luật nghiêm ngặt, luôn làm chủ mọi mục tiêu.',
      };
    }
    if (pair.includes('the-chat') && pair.includes('ky-luat')) {
      return {
        title: 'Đấu Sĩ Thép',
        badge: '🛡️ Thể Chất Vững Vàng',
        description: 'Thể lực dồi dào và tinh thần thép kiên định, không bao giờ chùn bước trước nghịch cảnh.',
      };
    }
    if (pair.includes('sang-tao') && pair.includes('su-nghiep')) {
      return {
        title: 'Kiến Trúc Sư Đổi Mới',
        badge: '✨ Sáng Tạo & Đột Phá',
        description: 'Tư duy đổi mới không ngừng kết hợp năng lực thực thi sắc bén trong công việc.',
      };
    }
    if (pair.includes('tri-tue') && pair.includes('sang-tao')) {
      return {
        title: 'Hiền Nhân Khai Phá',
        badge: '🔮 Khai Phóng',
        description: 'Trí tuệ uyên thâm cùng óc sáng tạo không giới hạn, luôn tìm ra lối đi riêng.',
      };
    }
    if (pair.includes('tu-chu') && pair.includes('ky-luat')) {
      return {
        title: 'Thợ Săn Khắc Kỷ',
        badge: '📜 Khắc Kỷ',
        description: 'Bậc thầy kiểm soát tâm trí và thói quen, vững vàng trước mọi cám dỗ thường nhật.',
      };
    }
    return {
      title: `${sortedStats[0].shortName} & ${sortedStats[1].shortName}`,
      badge: '⚡ Tinh Anh',
      description: `Thiên hướng phát triển mạnh mẽ nhất ở nhóm ${sortedStats[0].shortName} và ${sortedStats[1].shortName}.`,
    };
  };

  const archetype = getArchetype();

  const getPowerRank = (avg: number) => {
    if (avg >= 4.5) {
      return {
        rank: 'S',
        title: 'Huyền Thoại (Legendary)',
        badgeClass: 'text-amber-300 border-amber-400/50 bg-amber-500/20 shadow-amber-500/20',
      };
    }
    if (avg >= 3.8) {
      return {
        rank: 'A',
        title: 'Bậc Thầy (Master)',
        badgeClass: 'text-purple-300 border-purple-400/50 bg-purple-500/20 shadow-purple-500/20',
      };
    }
    if (avg >= 3.0) {
      return {
        rank: 'B',
        title: 'Tinh Anh (Elite)',
        badgeClass: 'text-cyan-300 border-cyan-400/50 bg-cyan-500/20 shadow-cyan-500/20',
      };
    }
    if (avg >= 2.2) {
      return {
        rank: 'C',
        title: 'Tiêu Chuẩn (Standard)',
        badgeClass: 'text-emerald-300 border-emerald-400/50 bg-emerald-500/20 shadow-emerald-500/20',
      };
    }
    if (avg >= 1.5) {
      return {
        rank: 'D',
        title: 'Tân Binh (Novice)',
        badgeClass: 'text-[#CCD0CF] border-[#4A5C6A] bg-[#253745]/40',
      };
    }
    return {
      rank: 'E',
      title: 'Khởi Đầu (Initiate)',
      badgeClass: 'text-[#9BA8AB] border-[#253745] bg-[#06141B]',
    };
  };

  const powerRank = getPowerRank(avgScore);

  const activeStat = activeStatIndex !== null ? radarStats[activeStatIndex] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* TẦNG 2: BENTO GRID 2 CỘT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* CỘT TRÁI (6/12): Card "🕸️ SƠ ĐỒ LỤC GIÁC NĂNG LỰC (THANG ĐIỂM 5)" */}
        <div className="lg:col-span-6 rounded-3xl p-5 sm:p-6 bg-[#11212D] border border-[#253745] shadow-[0_16px_40px_rgba(0,0,0,0.7)] flex flex-col justify-between space-y-4">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#253745]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF]">
                <Zap className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <h3 className="font-rpg font-bold text-base text-white tracking-wide">
                  Sơ Đồ Lục Giác Năng Lực
                </h3>
                <span className="text-[10px] text-[#9BA8AB] uppercase tracking-wider font-semibold">
                  Ability Parameters (Thang Điểm 5.0)
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-[#06141B] border border-[#4A5C6A] text-[11px] font-mono font-bold text-amber-300">
              Avg: {avgScore} / 5.0
            </span>
          </div>

          {/* SVG Hexagonal Radar */}
          <div className="relative py-2 flex flex-col items-center justify-center">
            <svg
              viewBox="0 0 380 340"
              className="w-full h-auto max-w-[340px] sm:max-w-[380px] overflow-visible drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]"
            >
              <defs>
                <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="poly-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#CCD0CF" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#4A5C6A" stopOpacity="0.12" />
                </linearGradient>
              </defs>

              {/* 5 Concentric Hexagonal Grids */}
              {Array.from({ length: totalLevels }, (_, i) => i + 1).map((lvl) => {
                const r = (lvl / totalLevels) * radius;
                const isOuter = lvl === totalLevels;
                return (
                  <polygon
                    key={lvl}
                    points={getHexagonPoints(r)}
                    fill="none"
                    stroke={isOuter ? '#4A5C6A' : '#253745'}
                    strokeWidth={isOuter ? 1.5 : 1}
                    strokeDasharray={isOuter ? undefined : '3 3'}
                  />
                );
              })}

              {/* 6 Radial Axes */}
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
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Axis Level Numbers along the Top Axis */}
              {Array.from({ length: totalLevels }, (_, i) => i + 1).map((lvl) => {
                const r = (lvl / totalLevels) * radius;
                return (
                  <text
                    key={lvl}
                    x={cx + 6}
                    y={cy - r + 3}
                    fill="#9BA8AB"
                    fontSize="8"
                    fontFamily="monospace"
                    className="select-none pointer-events-none opacity-80"
                  >
                    {lvl}
                  </text>
                );
              })}

              {/* Player Data Polygon Area */}
              <polygon
                points={playerPointsString}
                fill="url(#poly-gradient)"
                stroke="#CCD0CF"
                strokeWidth="2.5"
                filter="url(#radar-glow)"
                className="transition-all duration-300"
              />

              {/* Data Vertices & Pulsing Dots */}
              {playerPoints.map((p, idx) => {
                const isHovered = activeStatIndex === idx;
                return (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setActiveStatIndex(idx)}
                    onMouseLeave={() => setActiveStatIndex(null)}
                    onClick={() => setActiveStatIndex(isHovered ? null : idx)}
                  >
                    {/* Invisible larger hover hotspot */}
                    <circle cx={p.x} cy={p.y} r="16" fill="transparent" />

                    {/* Outer Glow Halo */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 8 : 5}
                      fill="#CCD0CF"
                      fillOpacity={isHovered ? 0.6 : 0.25}
                      className="transition-all duration-200"
                    />

                    {/* Center Point */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 4.5 : 3.5}
                      fill={isHovered ? '#FFFFFF' : '#CCD0CF'}
                      stroke="#06141B"
                      strokeWidth="1.5"
                      className="transition-all duration-200"
                    />
                  </g>
                );
              })}

              {/* Outer Vertex Labels */}
              {radarStats.map((stat, idx) => {
                const isHovered = activeStatIndex === idx;

                // Label positions around vertices
                let lx = cx;
                let ly = cy;
                let anchor: 'start' | 'middle' | 'end' = 'middle';

                if (idx === 0) {
                  // TRÍ TUỆ (Top)
                  lx = cx;
                  ly = cy - radius - 14;
                  anchor = 'middle';
                } else if (idx === 1) {
                  // SỰ NGHIỆP (Top-Right)
                  lx = cx + radius * Math.cos(angles[idx]) + 10;
                  ly = cy + radius * Math.sin(angles[idx]) - 4;
                  anchor = 'start';
                } else if (idx === 2) {
                  // THỂ CHẤT (Bottom-Right)
                  lx = cx + radius * Math.cos(angles[idx]) + 10;
                  ly = cy + radius * Math.sin(angles[idx]) + 14;
                  anchor = 'start';
                } else if (idx === 3) {
                  // KỶ LUẬT (Bottom)
                  lx = cx;
                  ly = cy + radius + 22;
                  anchor = 'middle';
                } else if (idx === 4) {
                  // TỰ CHỦ (Bottom-Left)
                  lx = cx - radius * Math.cos(Math.PI / 6) - 10;
                  ly = cy + radius * Math.sin(angles[idx]) + 14;
                  anchor = 'end';
                } else if (idx === 5) {
                  // SÁNG TẠO (Top-Left)
                  lx = cx - radius * Math.cos(Math.PI / 6) - 10;
                  ly = cy + radius * Math.sin(angles[idx]) - 4;
                  anchor = 'end';
                }

                return (
                  <g
                    key={stat.key}
                    className="cursor-pointer"
                    onMouseEnter={() => setActiveStatIndex(idx)}
                    onMouseLeave={() => setActiveStatIndex(null)}
                    onClick={() => setActiveStatIndex(isHovered ? null : idx)}
                  >
                    <text
                      x={lx}
                      y={ly}
                      textAnchor={anchor}
                      fontSize="10"
                      fontWeight="bold"
                      fill={isHovered ? '#FFFFFF' : '#CCD0CF'}
                      className="select-none transition-colors duration-200"
                    >
                      {stat.name}
                    </text>
                    <text
                      x={lx}
                      y={ly + 11}
                      textAnchor={anchor}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="600"
                      fill={isHovered ? '#FBBF24' : '#9BA8AB'}
                      className="select-none transition-colors duration-200"
                    >
                      {stat.score.toFixed(1)} / 5.0
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Interactive Tooltip Banner */}
            <div className="w-full mt-2 min-h-[48px] px-3.5 py-2 rounded-2xl bg-[#06141B] border border-[#253745] flex items-center justify-between gap-2 shadow-inner">
              {activeStat ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF] shrink-0">
                    {activeStat.icon}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                      <span>{activeStat.name}:</span>
                      <span className="text-amber-300 font-mono font-black">{activeStat.score.toFixed(1)} / 5.0</span>
                    </span>
                    <p className="text-[11px] text-[#9BA8AB] truncate">
                      {activeStat.key === 'ky-luat'
                        ? `${focusSessionsCompleted} phiên Focus • ${streakDays} ngày chuỗi`
                        : `Đã hoàn thành ${activeStat.completedTasks} nhiệm vụ (+${activeStat.expGained} EXP)`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-[#9BA8AB]">
                  <Info className="w-3.5 h-3.5 text-[#4A5C6A] shrink-0" />
                  <span className="text-[11px]">Rê chuột hoặc chạm vào từng đỉnh lục giác để xem chi tiết chỉ số.</span>
                </div>
              )}

              {activeStat && (
                <span className="text-[10px] font-mono font-bold text-cyan-300 shrink-0 px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/30">
                  Đỉnh #{activeStatIndex! + 1}
                </span>
              )}
            </div>
          </div>

          {/* Archetype & Combat Rank Showcase Footer */}
          <div className="pt-3 border-t border-[#253745] space-y-2.5">
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#06141B] via-[#11212D] to-[#06141B] border border-[#253745] flex items-center justify-between gap-3 shadow-sm">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#253745] border border-[#4A5C6A] text-[10px] font-extrabold text-amber-300">
                    {archetype.badge}
                  </span>
                  <h4 className="font-rpg font-bold text-sm text-white truncate">
                    ⚔️ Thiên Hướng: {archetype.title}
                  </h4>
                </div>
                <p className="text-[11px] text-[#9BA8AB] line-clamp-1 leading-relaxed">
                  {archetype.description}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-[#9BA8AB] block uppercase">Chiến Lực</span>
                <span className="text-xs font-black text-cyan-300 font-mono">Rank {powerRank.rank}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (6/12): Card "📊 PHÂN BỔ HOẠT ĐỘNG & ĐỘ KHÓ NHIỆM VỤ" */}
        <div className="lg:col-span-6 rounded-3xl p-5 sm:p-6 bg-[#11212D] border border-[#253745] shadow-[0_16px_40px_rgba(0,0,0,0.7)] flex flex-col justify-between space-y-5">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#253745]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF]">
                <PieChart className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-rpg font-bold text-base text-white tracking-wide">
                  Phân Bổ Hoạt Động & Độ Khó
                </h3>
                <span className="text-[10px] text-[#9BA8AB] uppercase tracking-wider font-semibold">
                  Breakdown by Category & Difficulty
                </span>
              </div>
            </div>

            <span className="text-xs text-[#9BA8AB]">
              {completedTasks} / {totalTasks} hoàn thành
            </span>
          </div>

          {/* NỬA TRÊN: 5 Thanh Tiến Độ Phân Bổ Hoạt Động Theo Nhóm */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-[#CCD0CF] flex items-center justify-between">
              <span>Tiến Độ Theo Nhóm Hoạt Động</span>
              <span className="text-[10px] text-[#9BA8AB]">Điểm Lục Giác / 5.0</span>
            </span>

            <div className="space-y-2.5">
              {(Object.keys(CATEGORIES) as TaskCategory[]).map((catKey) => {
                const cat = CATEGORIES[catKey];
                const stat = categoryData[catKey];
                const pct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;

                // Match with radar stat
                const matchingRadar = radarStats.find((r) => r.key === catKey.replace('-', ''));
                const catScore = matchingRadar ? matchingRadar.score : calcScore(stat.completed, stat.expGained);

                return (
                  <div key={catKey} className="p-2.5 rounded-2xl bg-[#06141B] border border-[#253745] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-white flex items-center gap-1.5 truncate">
                          <span>{cat.label}</span>
                        </span>
                        <span className="text-[10px] font-mono text-cyan-300/90 font-semibold">
                          +{stat.expGained} EXP
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono shrink-0">
                        <span className="text-amber-300 font-bold text-[11px]">
                          ⭐ {catScore.toFixed(1)}/5
                        </span>
                        <span className="text-[#9BA8AB] text-[11px]">
                          ({stat.completed}/{stat.total} - {pct}%)
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-[#11212D] h-2 rounded-full overflow-hidden border border-[#253745]">
                      <div
                        className="bg-gradient-to-r from-[#4A5C6A] via-[#9BA8AB] to-[#CCD0CF] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NỬA DƯỚI: 4 Thẻ Phân Bổ Tỷ Trọng Độ Khó Đã Chinh Phục */}
          <div className="pt-3 border-t border-[#253745] space-y-2.5">
            <span className="text-xs font-bold text-[#CCD0CF] block">
              Tỷ Trọng Độ Khó Đã Chinh Phục
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Khởi Động */}
              <div className="p-3 rounded-2xl bg-[#06141B] border border-[#253745] hover:border-emerald-500/40 transition flex flex-col justify-between space-y-1.5">
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="text-sm">🌱</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30 font-bold">
                    Dễ
                  </span>
                </div>
                <div>
                  <span className="text-lg font-black text-white font-mono block leading-none">
                    {difficultyCounts.easy}
                  </span>
                  <span className="text-[10px] text-[#9BA8AB] block mt-0.5 font-semibold">
                    Khởi Động
                  </span>
                </div>
                <span className="text-[9px] text-[#9BA8AB]/70 font-mono">
                  +30 EXP / task
                </span>
              </div>

              {/* Tiêu Chuẩn */}
              <div className="p-3 rounded-2xl bg-[#06141B] border border-[#253745] hover:border-cyan-500/40 transition flex flex-col justify-between space-y-1.5">
                <div className="flex items-center justify-between text-cyan-300">
                  <span className="text-sm">⚔️</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/30 font-bold">
                    Vừa
                  </span>
                </div>
                <div>
                  <span className="text-lg font-black text-white font-mono block leading-none">
                    {difficultyCounts.medium}
                  </span>
                  <span className="text-[10px] text-[#9BA8AB] block mt-0.5 font-semibold">
                    Tiêu Chuẩn
                  </span>
                </div>
                <span className="text-[9px] text-[#9BA8AB]/70 font-mono">
                  +60 EXP / task
                </span>
              </div>

              {/* Thử Thách */}
              <div className="p-3 rounded-2xl bg-[#06141B] border border-[#253745] hover:border-orange-500/40 transition flex flex-col justify-between space-y-1.5">
                <div className="flex items-center justify-between text-orange-400">
                  <span className="text-sm">🔥</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-500/10 border border-orange-500/30 font-bold">
                    Khó
                  </span>
                </div>
                <div>
                  <span className="text-lg font-black text-white font-mono block leading-none">
                    {difficultyCounts.hard}
                  </span>
                  <span className="text-[10px] text-[#9BA8AB] block mt-0.5 font-semibold">
                    Thử Thách
                  </span>
                </div>
                <span className="text-[9px] text-[#9BA8AB]/70 font-mono">
                  +110 EXP / task
                </span>
              </div>

              {/* Trùm Cuối */}
              <div className="p-3 rounded-2xl bg-[#06141B] border border-[#253745] hover:border-rose-500/40 transition flex flex-col justify-between space-y-1.5">
                <div className="flex items-center justify-between text-rose-400">
                  <span className="text-sm">👑</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 border border-rose-500/30 font-bold">
                    Boss
                  </span>
                </div>
                <div>
                  <span className="text-lg font-black text-white font-mono block leading-none">
                    {difficultyCounts.boss}
                  </span>
                  <span className="text-[10px] text-[#9BA8AB] block mt-0.5 font-semibold">
                    Trùm Cuối
                  </span>
                </div>
                <span className="text-[9px] text-[#9BA8AB]/70 font-mono">
                  +200 EXP / task
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
