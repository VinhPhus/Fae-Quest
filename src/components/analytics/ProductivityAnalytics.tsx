import React, { useState, useMemo } from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CATEGORIES, DIFFICULTIES } from '../../constants/categories';
import { TaskCategory, TaskDifficulty, Task } from '../../types';
import { getLocalDateStr, getTodayString } from '../../utils/dateUtils';
import { StreakFlameCard } from '../streak/StreakFlameCard';
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
  BarChart3,
  Crown,
  Swords,
  Target,
  Compass,
} from 'lucide-react';

interface RadarStat {
  key: string;
  name: string;
  shortName: string;
  categoryKey?: TaskCategory;
  score: number;
  completedTasks: number;
  totalTasks: number;
  expGained: number;
  description: string;
  icon: React.ReactNode;
}

/**
 * Công thức tính điểm thang 1.0 -> 5.0 tăng tiến mượt theo mốc EXP / hoạt động:
 * 0 EXP = 1.0
 * 100 EXP = 2.0
 * 300 EXP = 3.0
 * 600 EXP = 4.0
 * >= 1000 EXP = 5.0
 * Kèm thưởng nhẹ từ số nhiệm vụ hoàn tất để điểm nở đều rõ rệt qua từng ngày.
 */
export const calcExpMilestoneScore = (expGained: number, completedCount: number = 0): number => {
  const effectiveExp = Math.max(0, expGained) + Math.min(100, completedCount * 12);
  let score = 1.0;

  if (effectiveExp <= 0) {
    score = completedCount > 0 ? 1.0 + Math.min(0.5, completedCount * 0.1) : 1.0;
  } else if (effectiveExp < 100) {
    // 0 -> 100 EXP: 1.0 -> 2.0
    score = 1.0 + (effectiveExp / 100) * 1.0;
  } else if (effectiveExp < 300) {
    // 100 -> 300 EXP: 2.0 -> 3.0
    score = 2.0 + ((effectiveExp - 100) / 200) * 1.0;
  } else if (effectiveExp < 600) {
    // 300 -> 600 EXP: 3.0 -> 4.0
    score = 3.0 + ((effectiveExp - 300) / 300) * 1.0;
  } else if (effectiveExp < 1000) {
    // 600 -> 1000 EXP: 4.0 -> 5.0
    score = 4.0 + ((effectiveExp - 600) / 400) * 1.0;
  } else {
    // >= 1000 EXP: 5.0
    score = 5.0;
  }

  return Math.min(5.0, Math.max(1.0, parseFloat(score.toFixed(1))));
};

/**
 * Helper tính toán dữ liệu phong độ 7 ngày gần nhất
 */
const getLast7DaysData = (
  tasks: Task[],
  dailyActivityHistory?: Record<string, { completedCount: number; expGained: number }>,
  todayCompletedCount?: number
) => {
  const result: Array<{
    dateStr: string;
    dayLabel: string;
    subLabel: string;
    isToday: boolean;
    completedCount: number;
    expGained: number;
  }> = [];

  const now = new Date();
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  // Map từ tasks hiện hữu trong store
  const taskMap: Record<string, { count: number; exp: number }> = {};
  tasks.forEach((t) => {
    if (t.completed) {
      let dStr = t.completionDate;
      if (!dStr && t.completedAt) {
        dStr = getLocalDateStr(new Date(t.completedAt));
      }
      if (dStr) {
        if (!taskMap[dStr]) taskMap[dStr] = { count: 0, exp: 0 };
        taskMap[dStr].count += 1;
        taskMap[dStr].exp += t.lastAwardedExp || DIFFICULTIES[t.difficulty]?.exp || 40;
      }
    }
  });

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = getLocalDateStr(d);
    const isToday = i === 0;

    const fromHistory = dailyActivityHistory?.[dateStr];
    const fromTasks = taskMap[dateStr];

    let count = Math.max(fromHistory?.completedCount || 0, fromTasks?.count || 0);
    let expVal = Math.max(fromHistory?.expGained || 0, fromTasks?.exp || 0);

    if (isToday && todayCompletedCount && count < todayCompletedCount) {
      count = todayCompletedCount;
      if (expVal === 0) expVal = count * 50;
    }

    const dayOfWeek = dayNames[d.getDay()];
    const dayOfMonth = `${d.getDate()}/${d.getMonth() + 1}`;

    result.push({
      dateStr,
      dayLabel: isToday ? 'Hôm nay' : dayOfWeek,
      subLabel: dayOfMonth,
      isToday,
      completedCount: count,
      expGained: expVal,
    });
  }

  return result;
};

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

      {/* TẦNG KPI Tóm Tắt */}
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
  const {
    tasks,
    completedTotal,
    streakDays,
    exp,
    focusSessionsCompleted,
    dailyCompletedCount,
    cumulativeCategoryStats,
    cumulativeDifficultyStats,
    dailyActivityHistory,
  } = useFaeQuestStore();

  const [activeStatIndex, setActiveStatIndex] = useState<number | null>(null);

  // 1. TỔNG HỢP & BẢO TOÀN DỮ LIỆU LỊCH SỬ KHÔNG BỊ RESET VỀ 0 KHI DỌN TASK
  const { effectiveCategoryData, effectiveDifficultyCounts, totalRecordedCompleted } = useMemo(() => {
    const catData: Record<TaskCategory, { total: number; completed: number; expGained: number }> = {
      'hoc-tap': { total: 0, completed: 0, expGained: 0 },
      'cong-viec': { total: 0, completed: 0, expGained: 0 },
      'the-luc': { total: 0, completed: 0, expGained: 0 },
      'ca-nhan': { total: 0, completed: 0, expGained: 0 },
      'sang-tao': { total: 0, completed: 0, expGained: 0 },
    };

    const diffCounts: Record<TaskDifficulty, number> = {
      easy: 0,
      medium: 0,
      hard: 0,
      boss: 0,
    };

    // Quét task hiện có trong store
    tasks.forEach((t) => {
      const cat = catData[t.category] ? t.category : 'ca-nhan';
      catData[cat].total += 1;
      if (t.completed) {
        catData[cat].completed += 1;
        const awarded = t.lastAwardedExp || DIFFICULTIES[t.difficulty]?.exp || 40;
        catData[cat].expGained += awarded;

        const diffKey = diffCounts[t.difficulty] !== undefined ? t.difficulty : 'medium';
        diffCounts[diffKey] += 1;
      }
    });

    // Kết hợp với cumulativeCategoryStats (nếu có dữ liệu tích lũy lớn hơn)
    const allCategories: TaskCategory[] = ['hoc-tap', 'cong-viec', 'the-luc', 'ca-nhan', 'sang-tao'];
    allCategories.forEach((cat) => {
      const cum = cumulativeCategoryStats?.[cat];
      if (cum) {
        catData[cat].completed = Math.max(catData[cat].completed, cum.completed || 0);
        catData[cat].expGained = Math.max(catData[cat].expGained, cum.expGained || 0);
        catData[cat].total = Math.max(catData[cat].total, catData[cat].completed);
      }
    });

    // Kết hợp với cumulativeDifficultyStats
    const allDiffs: TaskDifficulty[] = ['easy', 'medium', 'hard', 'boss'];
    allDiffs.forEach((df) => {
      const cumDiff = cumulativeDifficultyStats?.[df];
      if (typeof cumDiff === 'number') {
        diffCounts[df] = Math.max(diffCounts[df], cumDiff);
      }
    });

    // Thuật toán phục hồi & bảo tồn thông minh:
    // Nếu completedTotal lớn hơn tổng nhiệm vụ đang ghi nhận (do người dùng xóa các task cũ trước đó)
    const currentCompletedSum = allCategories.reduce((acc, c) => acc + catData[c].completed, 0);
    const targetCompleted = Math.max(completedTotal || 0, currentCompletedSum);

    if (targetCompleted > currentCompletedSum) {
      const missingTasks = targetCompleted - currentCompletedSum;
      const perCat = Math.floor(missingTasks / 5);
      const remainder = missingTasks % 5;

      allCategories.forEach((cat, index) => {
        const bonus = perCat + (index < remainder ? 1 : 0);
        catData[cat].completed += bonus;
        catData[cat].total = Math.max(catData[cat].total, catData[cat].completed);
      });

      // Phân bổ phần thiếu vào độ khó theo tỉ lệ thực tế: Dễ 30%, Vừa 40%, Khó 20%, Trùm 10%
      diffCounts.easy += Math.round(missingTasks * 0.3);
      diffCounts.medium += Math.round(missingTasks * 0.4);
      diffCounts.hard += Math.round(missingTasks * 0.2);
      diffCounts.boss += Math.max(0, missingTasks - Math.round(missingTasks * 0.3) - Math.round(missingTasks * 0.4) - Math.round(missingTasks * 0.2));
    }

    // Bảo tồn tổng EXP: nếu exp lớn hơn tổng expGained của 5 nhóm, phân bổ phần chênh lệch
    const currentExpSum = allCategories.reduce((acc, c) => acc + catData[c].expGained, 0);
    if (exp > currentExpSum && (currentExpSum === 0 || currentCompletedSum === 0)) {
      const missingExp = exp - currentExpSum;
      const perCatExp = Math.floor(missingExp / 5);
      allCategories.forEach((cat) => {
        catData[cat].expGained += perCatExp;
      });
    }

    return {
      effectiveCategoryData: catData,
      effectiveDifficultyCounts: diffCounts,
      totalRecordedCompleted: targetCompleted,
    };
  }, [tasks, completedTotal, exp, cumulativeCategoryStats, cumulativeDifficultyStats]);

  // 2. CÔNG THỨC 6 ĐỈNH NĂNG LỰC (THANG 1.0 -> 5.0)
  // Trí Tuệ ➔ Học tập
  const triTueScore = calcExpMilestoneScore(
    effectiveCategoryData['hoc-tap'].expGained,
    effectiveCategoryData['hoc-tap'].completed
  );

  // Sự Nghiệp ➔ Công việc
  const suNghiepScore = calcExpMilestoneScore(
    effectiveCategoryData['cong-viec'].expGained,
    effectiveCategoryData['cong-viec'].completed
  );

  // Thể Chất ➔ Thể lực
  const theLucScore = calcExpMilestoneScore(
    effectiveCategoryData['the-luc'].expGained,
    effectiveCategoryData['the-luc'].completed
  );

  // Tự Chủ ➔ Cá nhân
  const tuChuScore = calcExpMilestoneScore(
    effectiveCategoryData['ca-nhan'].expGained,
    effectiveCategoryData['ca-nhan'].completed
  );

  // Sáng Tạo ➔ Sáng tạo
  const sangTaoScore = calcExpMilestoneScore(
    effectiveCategoryData['sang-tao'].expGained,
    effectiveCategoryData['sang-tao'].completed
  );

  // Kỷ Luật ➔ Tổng hợp từ Chuỗi Streak + Số phiên Focus + Tỷ lệ / số lệnh hoàn thành
  const disciplinePoints =
    (streakDays || 0) * 65 +
    (focusSessionsCompleted || 0) * 85 +
    Math.min(300, (totalRecordedCompleted || 0) * 15);
  const kyLuatScore = calcExpMilestoneScore(disciplinePoints, (streakDays || 0) + (focusSessionsCompleted || 0));

  // 6 Radar Stats theo chiều kim đồng hồ bắt đầu từ đỉnh trên (-90 deg):
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
      categoryKey: 'hoc-tap',
      score: triTueScore,
      completedTasks: effectiveCategoryData['hoc-tap'].completed,
      totalTasks: effectiveCategoryData['hoc-tap'].total,
      expGained: effectiveCategoryData['hoc-tap'].expGained,
      description: 'Học tập, đọc sách, tích lũy tri thức và rèn luyện tư duy phản biện.',
      icon: <BookOpen className="w-3.5 h-3.5 text-cyan-300" />,
    },
    {
      key: 'su-nghiep',
      name: 'SỰ NGHIỆP',
      shortName: 'Sự Nghiệp',
      categoryKey: 'cong-viec',
      score: suNghiepScore,
      completedTasks: effectiveCategoryData['cong-viec'].completed,
      totalTasks: effectiveCategoryData['cong-viec'].total,
      expGained: effectiveCategoryData['cong-viec'].expGained,
      description: 'Công việc chuyên môn, quản trị dự án và các mục tiêu thăng tiến bền vững.',
      icon: <Briefcase className="w-3.5 h-3.5 text-blue-400" />,
    },
    {
      key: 'the-chat',
      name: 'THỂ CHẤT',
      shortName: 'Thể Chất',
      categoryKey: 'the-luc',
      score: theLucScore,
      completedTasks: effectiveCategoryData['the-luc'].completed,
      totalTasks: effectiveCategoryData['the-luc'].total,
      expGained: effectiveCategoryData['the-luc'].expGained,
      description: 'Thể thao, gym, chạy bộ, dinh dưỡng và tái tạo năng lượng sống.',
      icon: <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      key: 'ky-luat',
      name: 'KỶ LUẬT',
      shortName: 'Kỷ Luật',
      score: kyLuatScore,
      completedTasks: focusSessionsCompleted || 0,
      totalTasks: focusSessionsCompleted || 0,
      expGained: disciplinePoints,
      description: 'Ý chí kiên định qua chuỗi ngày liên tiếp và các phiên tập trung sâu Fae Focus.',
      icon: <Flame className="w-3.5 h-3.5 text-orange-400" />,
    },
    {
      key: 'tu-chu',
      name: 'TỰ CHỦ',
      shortName: 'Tự Chủ',
      categoryKey: 'ca-nhan',
      score: tuChuScore,
      completedTasks: effectiveCategoryData['ca-nhan'].completed,
      totalTasks: effectiveCategoryData['ca-nhan'].total,
      expGained: effectiveCategoryData['ca-nhan'].expGained,
      description: 'Kế hoạch cá nhân, thói quen sinh hoạt và khả năng làm chủ bản thân.',
      icon: <Heart className="w-3.5 h-3.5 text-pink-400" />,
    },
    {
      key: 'sang-tao',
      name: 'SÁNG TẠO',
      shortName: 'Sáng Tạo',
      categoryKey: 'sang-tao',
      score: sangTaoScore,
      completedTasks: effectiveCategoryData['sang-tao'].completed,
      totalTasks: effectiveCategoryData['sang-tao'].total,
      expGained: effectiveCategoryData['sang-tao'].expGained,
      description: 'Nghệ thuật, viết lách, giải pháp đổi mới và những sáng kiến đột phá.',
      icon: <Palette className="w-3.5 h-3.5 text-amber-300" />,
    },
  ];

  // 3. HÌNH HỌC LỤC GIÁC (SVG ViewBox 0 0 420 380, An Toàn Tuyệt Đối Cho Đỉnh Dưới)
  const cx = 210;
  const cy = 175;
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

  const getHexagonPoints = (r: number) => {
    return angles
      .map((ang) => {
        const x = cx + r * Math.cos(ang);
        const y = cy + r * Math.sin(ang);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const playerPoints = radarStats.map((stat, idx) => {
    const valRadius = (Math.max(0.6, Math.min(5.0, stat.score)) / 5.0) * radius;
    const x = cx + valRadius * Math.cos(angles[idx]);
    const y = cy + valRadius * Math.sin(angles[idx]);
    return { x, y, score: stat.score, name: stat.name, stat };
  });

  const playerPointsString = playerPoints
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  // 4. PHÂN TÍCH THIÊN HƯỚNG THỢ SĂN (Hệ Thợ Săn & Gợi Ý Phát Triển)
  const sortedStats = [...radarStats].sort((a, b) => b.score - a.score);
  const strongestStat = sortedStats[0];
  const weakestStat = sortedStats[sortedStats.length - 1];
  const scoreDiff = strongestStat.score - weakestStat.score;

  const avgScore = parseFloat(
    (radarStats.reduce((sum, s) => sum + s.score, 0) / 6).toFixed(1)
  );

  const getHunterArchetype = () => {
    // Nếu các chỉ số chênh lệch không đáng kể (<= 0.5) hoặc đều rất cao
    if (scoreDiff <= 0.5 && avgScore >= 2.0) {
      return {
        title: 'Thợ Săn Toàn Diện',
        badge: '⭐ Toàn Diện',
        icon: '⭐',
        desc: 'Cân bằng hoàn hảo cả 6 trụ cột năng lực, bản lĩnh vững vàng và không có điểm yếu nào.',
      };
    }

    switch (strongestStat.key) {
      case 'tri-tue':
        return {
          title: 'Học Giả Hắc Ám',
          badge: '📜 Học Giả Hắc Ám',
          icon: '📜',
          desc: 'Am hiểu bí thuật tri thức, lấy trí tuệ và tư duy sắc bén làm vũ khí tối thượng.',
        };
      case 'the-chat':
        return {
          title: 'Chiến Binh Thép',
          badge: '🛡️ Chiến Binh Thép',
          icon: '🛡️',
          desc: 'Sở hữu thể chất kiên cường, sức bền dẻo dai và tinh thần bất khuất qua tôi luyện.',
        };
      case 'su-nghiep':
        return {
          title: 'Chiến Lược Gia',
          badge: '👑 Chiến Lược Gia',
          icon: '👑',
          desc: 'Nhìn thấu đại cục, hoàn thành xuất sắc mọi dự án và thăng tiến vững vàng trên sự nghiệp.',
        };
      case 'tu-chu':
        return {
          title: 'Hành Giả Tĩnh Tâm',
          badge: '🧘 Hành Giả Tĩnh Tâm',
          icon: '🧘',
          desc: 'Tâm trí vững như bàn thạch, làm chủ lối sống ngăn nắp và khắc chế mọi cám dỗ thường nhật.',
        };
      case 'sang-tao':
        return {
          title: 'Nghệ Sĩ Hư Không',
          badge: '🎨 Nghệ Sĩ Hư Không',
          icon: '🎨',
          desc: 'Khơi nguồn cảm hứng vô tận, biến ý tưởng vô hình thành những kiệt tác đột phá.',
        };
      case 'ky-luat':
        return {
          title: 'Bậc Thầy Thiết Luật',
          badge: '⚡ Bậc Thầy Thiết Luật',
          icon: '⚡',
          desc: 'Ý chí sắt đá cùng chuỗi ngày bất bại, duy trì kỷ luật thép và sự tập trung cao độ.',
        };
      default:
        return {
          title: 'Thợ Săn Tinh Anh',
          badge: '⚔️ Tinh Anh',
          icon: '⚔️',
          desc: 'Phát triển nổi trội ở nhóm năng lực chủ đạo và không ngừng bứt phá giới hạn.',
        };
    }
  };

  const archetype = getHunterArchetype();

  const getPowerRank = (avg: number) => {
    if (avg >= 4.5) return { rank: 'S', title: 'Huyền Thoại (Legendary)' };
    if (avg >= 3.8) return { rank: 'A', title: 'Bậc Thầy (Master)' };
    if (avg >= 3.0) return { rank: 'B', title: 'Tinh Anh (Elite)' };
    if (avg >= 2.2) return { rank: 'C', title: 'Tiêu Chuẩn (Standard)' };
    if (avg >= 1.5) return { rank: 'D', title: 'Tân Binh (Novice)' };
    return { rank: 'E', title: 'Khởi Đầu (Initiate)' };
  };

  const powerRank = getPowerRank(avgScore);
  const activeStat = activeStatIndex !== null ? radarStats[activeStatIndex] : null;

  // Dữ liệu phong độ 7 ngày qua
  const last7Days = useMemo(
    () => getLast7DaysData(tasks, dailyActivityHistory, dailyCompletedCount),
    [tasks, dailyActivityHistory, dailyCompletedCount]
  );
  const maxDayExp = Math.max(...last7Days.map((d) => d.expGained), 100);

  // Tổng số nhiệm vụ theo độ khó để tính % Stacked Bar
  const totalDiffTasks =
    effectiveDifficultyCounts.easy +
    effectiveDifficultyCounts.medium +
    effectiveDifficultyCounts.hard +
    effectiveDifficultyCounts.boss;

  const easyPct = totalDiffTasks > 0 ? (effectiveDifficultyCounts.easy / totalDiffTasks) * 100 : 25;
  const mediumPct = totalDiffTasks > 0 ? (effectiveDifficultyCounts.medium / totalDiffTasks) * 100 : 35;
  const hardPct = totalDiffTasks > 0 ? (effectiveDifficultyCounts.hard / totalDiffTasks) * 100 : 25;
  const bossPct = totalDiffTasks > 0 ? (effectiveDifficultyCounts.boss / totalDiffTasks) * 100 : 15;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* BENTO GRID 12 CỘT: SƠ ĐỒ LỤC GIÁC + NGỌN LỬA CHUỖI KỶ LUẬT + PHÂN BỔ HOẠT ĐỘNG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* ================= CỘT TRÁI (7/12): SƠ ĐỒ LỤC GIÁC NĂNG LỰC ================= */}
        <div className="lg:col-span-7 rounded-3xl p-5 sm:p-6 bg-[#11212D] border border-[#253745] shadow-[0_16px_40px_rgba(0,0,0,0.7)] flex flex-col justify-between space-y-4">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#253745]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shadow-inner">
                <Zap className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <h3 className="font-rpg font-bold text-base text-white tracking-wide">
                  Sơ Đồ Lục Giác Năng Lực
                </h3>
                <span className="text-[10px] text-cyan-300/90 uppercase tracking-wider font-semibold">
                  6 CHỈ SỐ CỐT LÕI (THANG 5.0)
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-[#06141B] border border-[#4A5C6A] text-[11px] font-mono font-bold text-amber-300 shadow-sm">
              Avg: {avgScore} / 5.0
            </span>
          </div>

          {/* SVG Hexagonal Radar với đệm py-4 sm:py-6 bảo đảm không cắt đỉnh KỶ LUẬT */}
          <div className="relative py-4 sm:py-6 flex flex-col items-center justify-center">
            <svg
              viewBox="0 0 420 380"
              className="w-full h-auto max-w-[360px] sm:max-w-[420px] overflow-visible drop-shadow-[0_12px_28px_rgba(0,0,0,0.9)]"
            >
              <defs>
                <filter id="fae-radar-glow" x="-25%" y="-25%" width="150%" height="150%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#38BDF8" floodOpacity="0.35" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="fae-poly-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.40" />
                  <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.25" />
                </linearGradient>
              </defs>

              {/* 5 Vòng Lục Giác Đồng Tâm */}
              {Array.from({ length: totalLevels }, (_, i) => i + 1).map((lvl) => {
                const r = (lvl / totalLevels) * radius;
                const isOuter = lvl === totalLevels;
                return (
                  <polygon
                    key={lvl}
                    points={getHexagonPoints(r)}
                    fill="none"
                    stroke={isOuter ? '#4A5C6A' : '#1C2C38'}
                    strokeWidth={isOuter ? 1.5 : 1}
                    strokeDasharray={isOuter ? undefined : '3 3'}
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
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Nhãn mốc điểm 1 -> 5 trên trục thẳng đứng */}
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

              {/* Đa Giác Năng Lực Người Chơi (Dark Fantasy Gradient + Glow) */}
              <polygon
                points={playerPointsString}
                fill="url(#fae-poly-grad)"
                stroke="#38BDF8"
                strokeWidth="2.5"
                filter="url(#fae-radar-glow)"
                className="transition-all duration-300"
              />

              {/* 6 Đỉnh với Vòng Phát Sáng & Điểm Tâm */}
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
                    {/* Hotspot chạm hover lớn hơn */}
                    <circle cx={p.x} cy={p.y} r="18" fill="transparent" />

                    {/* Vòng hào quang bên ngoài */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 9 : 6}
                      fill={isHovered ? '#38BDF8' : '#22D3EE'}
                      fillOpacity={isHovered ? 0.7 : 0.3}
                      className="transition-all duration-200"
                    />

                    {/* Điểm tâm phát sáng */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 5 : 3.5}
                      fill={isHovered ? '#FFFFFF' : '#E0F2FE'}
                      stroke="#06141B"
                      strokeWidth="1.5"
                      className="transition-all duration-200"
                    />
                  </g>
                );
              })}

              {/* Nhãn Đỉnh & Điểm Số 6 Trục (Tọa độ mở rộng an toàn, không cắt mép) */}
              {radarStats.map((stat, idx) => {
                const isHovered = activeStatIndex === idx;
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
                  lx = cx + radius * Math.cos(angles[idx]) + 12;
                  ly = cy + radius * Math.sin(angles[idx]) - 4;
                  anchor = 'start';
                } else if (idx === 2) {
                  // THỂ CHẤT (Bottom-Right)
                  lx = cx + radius * Math.cos(angles[idx]) + 12;
                  ly = cy + radius * Math.sin(angles[idx]) + 14;
                  anchor = 'start';
                } else if (idx === 3) {
                  // KỶ LUẬT (Bottom) — Tọa độ y = 292 an toàn trong viewBox 380
                  lx = cx;
                  ly = cy + radius + 22;
                  anchor = 'middle';
                } else if (idx === 4) {
                  // TỰ CHỦ (Bottom-Left)
                  lx = cx - radius * Math.cos(Math.PI / 6) - 12;
                  ly = cy + radius * Math.sin(angles[idx]) + 14;
                  anchor = 'end';
                } else if (idx === 5) {
                  // SÁNG TẠO (Top-Left)
                  lx = cx - radius * Math.cos(Math.PI / 6) - 12;
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
                      y={ly + 12}
                      textAnchor={anchor}
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="700"
                      fill={isHovered ? '#FBBF24' : '#38BDF8'}
                      className="select-none transition-colors duration-200"
                    >
                      {stat.score.toFixed(1)} / 5.0
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Interactive Tooltip Banner */}
            <div className="w-full mt-2 min-h-[50px] px-3.5 py-2 rounded-2xl bg-[#06141B] border border-[#253745] flex items-center justify-between gap-2 shadow-inner">
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
                        ? `${focusSessionsCompleted || 0} phiên Focus • ${streakDays || 0} ngày chuỗi (${activeStat.expGained} EXP quy đổi)`
                        : `Đã xong ${activeStat.completedTasks} nhiệm vụ (+${activeStat.expGained} EXP tích lũy)`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-[#9BA8AB]">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-[11px]">Chạm hoặc rê chuột vào 6 đỉnh để xem EXP và số lệnh hoàn thành.</span>
                </div>
              )}

              {activeStat && (
                <span className="text-[10px] font-mono font-bold text-cyan-300 shrink-0 px-2 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/30">
                  Đỉnh #{activeStatIndex! + 1}
                </span>
              )}
            </div>
          </div>

          {/* KHUNG PHÂN TÍCH THIÊN HƯỚNG THỢ SĂN & GỢI Ý BỒI ĐẮP */}
          <div className="pt-3 border-t border-[#253745] space-y-2.5">
            {/* Thẻ Thiên Hướng Chính */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#06141B] via-[#11212D] to-[#06141B] border border-[#253745] flex items-center justify-between gap-3 shadow-sm">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#253745] border border-[#4A5C6A] text-[10px] font-extrabold text-amber-300">
                    {archetype.badge}
                  </span>
                  <h4 className="font-rpg font-bold text-sm text-white truncate">
                    ⚔️ Hệ Thợ Săn: {archetype.title}
                  </h4>
                </div>
                <p className="text-[11px] text-[#9BA8AB] line-clamp-1 leading-relaxed">
                  {archetype.desc}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-[#9BA8AB] block uppercase">Chiến Lực</span>
                <span className="text-xs font-black text-cyan-300 font-mono">Rank {powerRank.rank}</span>
              </div>
            </div>

            {/* 2 Thẻ Gợi Ý: Điểm Mạnh Nhất & Cần Bồi Đắp */}
            <div className="grid grid-cols-2 gap-2">
              {/* Điểm Mạnh Nhất */}
              <div className="p-2.5 rounded-xl bg-[#06141B]/80 border border-emerald-500/30 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 text-xs">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-bold text-emerald-400 block">Mạnh Nhất</span>
                  <span className="text-[11px] font-black text-white truncate block">
                    {strongestStat.shortName} ({strongestStat.score.toFixed(1)})
                  </span>
                </div>
              </div>

              {/* Cần Bồi Đắp */}
              <div className="p-2.5 rounded-xl bg-[#06141B]/80 border border-amber-500/30 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 text-xs">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-bold text-amber-400 block">Cần Bồi Đắp</span>
                  <span className="text-[11px] font-black text-white truncate block">
                    {weakestStat.shortName} ({weakestStat.score.toFixed(1)})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= CỘT PHẢI (5/12): THẺ NGỌN LỬA CHUỖI KỶ LUẬT ================= */}
        <div className="lg:col-span-5 rounded-3xl p-4 sm:p-5 bg-[#11212D] border border-[#253745] shadow-[0_16px_40px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center min-w-0">
          <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-[#253745]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#253745] border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-rpg font-bold text-base text-white tracking-wide truncate">
                  Chuỗi Kỷ Luật
                </h3>
                <span className="text-[10px] text-amber-300/90 uppercase tracking-wider font-semibold block truncate">
                  GIỮ LỬA RÈN LUYỆN MỖI NGÀY
                </span>
              </div>
            </div>
          </div>

          <div className="w-full flex-1 flex items-center justify-center min-w-0">
            <StreakFlameCard mode="view" />
          </div>
        </div>

        {/* ================= HÀNG DƯỚI (12/12): PHÂN BỔ HOẠT ĐỘNG, ĐỘ KHÓ & PHONG ĐỘ 7 NGÀY ================= */}
        <div className="lg:col-span-12 rounded-3xl p-5 sm:p-6 bg-[#11212D] border border-[#253745] shadow-[0_16px_40px_rgba(0,0,0,0.7)] flex flex-col justify-between space-y-4">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#253745]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shadow-inner">
                <PieChart className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-rpg font-bold text-base text-white tracking-wide">
                  Phân Bổ Hoạt Động & Độ Khó
                </h3>
                <span className="text-[10px] text-emerald-400/90 uppercase tracking-wider font-semibold">
                  THỐNG KÊ DANH MỤC, ĐỘ KHÓ & PHONG ĐỘ 7 NGÀY
                </span>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-[#CCD0CF]">
              {totalRecordedCompleted} nhiệm vụ đã xong
            </span>
          </div>

          {/* TẦNG 1: 5 Thanh Tiến Độ Phân Bổ Theo 5 Nhóm Hoạt Động */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#CCD0CF]">Tiến Độ 5 Nhóm Hoạt Động</span>
              <span className="text-[10px] text-[#9BA8AB]">Điểm Lục Giác / 5.0</span>
            </div>

            <div className="space-y-2">
              {(Object.keys(CATEGORIES) as TaskCategory[]).map((catKey) => {
                const cat = CATEGORIES[catKey];
                const stat = effectiveCategoryData[catKey];

                // Tìm radar stat tương ứng
                const radarMatch = radarStats.find((r) => r.categoryKey === catKey);
                const score = radarMatch ? radarMatch.score : calcExpMilestoneScore(stat.expGained, stat.completed);

                // Tỷ lệ % thanh tiến trình (dựa trên mốc 1000 EXP hoặc score/5)
                const barPct = Math.min(100, Math.max(6, Math.round((score / 5.0) * 100)));

                // Gradient riêng cho từng category
                let gradColor = 'from-cyan-500 to-blue-500';
                if (catKey === 'cong-viec') gradColor = 'from-blue-500 to-indigo-500';
                if (catKey === 'the-luc') gradColor = 'from-emerald-400 to-teal-500';
                if (catKey === 'ca-nhan') gradColor = 'from-pink-500 to-rose-500';
                if (catKey === 'sang-tao') gradColor = 'from-amber-400 to-orange-500';

                return (
                  <div key={catKey} className="p-2.5 rounded-2xl bg-[#06141B] border border-[#253745] space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-white flex items-center gap-1.5 truncate">
                          <span>{cat.label}</span>
                        </span>
                        <span className="text-[10px] font-mono text-cyan-300 font-semibold">
                          +{stat.expGained} EXP
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono shrink-0">
                        <span className="text-amber-300 font-black text-[11px]">
                          ⭐ {score.toFixed(1)}/5
                        </span>
                        <span className="text-[#9BA8AB] text-[10px]">
                          ({stat.completed} việc xong)
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-[#11212D] h-2 rounded-full overflow-hidden border border-[#253745]">
                      <div
                        className={`bg-gradient-to-r ${gradColor} h-full rounded-full transition-all duration-500 shadow`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TẦNG 2: Phân Bổ Theo Độ Khó (Stacked Progress Bar & 4 Ô Thống Kê) */}
          <div className="pt-2.5 border-t border-[#253745] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#CCD0CF]">Phân Bổ Độ Khó Đã Chinh Phục</span>
              <span className="text-[10px] text-[#9BA8AB] font-mono">{totalDiffTasks} nhiệm vụ</span>
            </div>

            {/* Stacked Progress Bar */}
            <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-[#06141B] border border-[#253745]">
              <div
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${easyPct}%` }}
                title={`Dễ: ${effectiveDifficultyCounts.easy} việc (${easyPct.toFixed(0)}%)`}
              />
              <div
                className="bg-cyan-500 transition-all duration-500"
                style={{ width: `${mediumPct}%` }}
                title={`Vừa: ${effectiveDifficultyCounts.medium} việc (${mediumPct.toFixed(0)}%)`}
              />
              <div
                className="bg-orange-500 transition-all duration-500"
                style={{ width: `${hardPct}%` }}
                title={`Khó: ${effectiveDifficultyCounts.hard} việc (${hardPct.toFixed(0)}%)`}
              />
              <div
                className="bg-rose-500 transition-all duration-500"
                style={{ width: `${bossPct}%` }}
                title={`Trùm: ${effectiveDifficultyCounts.boss} việc (${bossPct.toFixed(0)}%)`}
              />
            </div>

            {/* 4 Ô Thống Kê Nhỏ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Dễ */}
              <div className="p-2 rounded-xl bg-[#06141B] border border-[#253745] hover:border-emerald-500/40 transition">
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="text-xs">🌱</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30 font-bold">
                    Dễ
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-base font-black text-white font-mono block leading-none">
                    {effectiveDifficultyCounts.easy}
                  </span>
                  <span className="text-[9px] text-[#9BA8AB] block mt-0.5">Khởi Động</span>
                </div>
              </div>

              {/* Vừa */}
              <div className="p-2 rounded-xl bg-[#06141B] border border-[#253745] hover:border-cyan-500/40 transition">
                <div className="flex items-center justify-between text-cyan-300">
                  <span className="text-xs">⚔️</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/30 font-bold">
                    Vừa
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-base font-black text-white font-mono block leading-none">
                    {effectiveDifficultyCounts.medium}
                  </span>
                  <span className="text-[9px] text-[#9BA8AB] block mt-0.5">Tiêu Chuẩn</span>
                </div>
              </div>

              {/* Khó */}
              <div className="p-2 rounded-xl bg-[#06141B] border border-[#253745] hover:border-orange-500/40 transition">
                <div className="flex items-center justify-between text-orange-400">
                  <span className="text-xs">🔥</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-orange-500/10 border border-orange-500/30 font-bold">
                    Khó
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-base font-black text-white font-mono block leading-none">
                    {effectiveDifficultyCounts.hard}
                  </span>
                  <span className="text-[9px] text-[#9BA8AB] block mt-0.5">Thử Thách</span>
                </div>
              </div>

              {/* Trùm */}
              <div className="p-2 rounded-xl bg-[#06141B] border border-[#253745] hover:border-rose-500/40 transition">
                <div className="flex items-center justify-between text-rose-400">
                  <span className="text-xs">👑</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-500/10 border border-rose-500/30 font-bold">
                    Boss
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-base font-black text-white font-mono block leading-none">
                    {effectiveDifficultyCounts.boss}
                  </span>
                  <span className="text-[9px] text-[#9BA8AB] block mt-0.5">Trùm Cuối</span>
                </div>
              </div>
            </div>
          </div>

          {/* TẦNG 3: Biểu Đồ Phong Độ 7 Ngày Qua */}
          <div className="pt-2.5 border-t border-[#253745] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#CCD0CF] flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Phong Độ Rèn Luyện 7 Ngày Qua</span>
              </span>
              <span className="text-[10px] text-amber-300 font-mono font-bold">
                {last7Days.reduce((sum, d) => sum + d.completedCount, 0)} việc đã xong
              </span>
            </div>

            {/* 7 Cột Phong Độ Mini */}
            <div className="p-2.5 rounded-2xl bg-[#06141B] border border-[#253745] flex items-end justify-between gap-1.5 h-24">
              {last7Days.map((day) => {
                const heightPct = Math.max(14, Math.round((day.expGained / maxDayExp) * 100));

                let barStyle = 'bg-[#253745]/50 border border-[#253745]';
                if (day.isToday) {
                  barStyle = 'bg-gradient-to-t from-amber-500 via-amber-400 to-yellow-300 border border-amber-300/80 shadow-[0_0_12px_rgba(245,158,11,0.5)]';
                } else if (day.completedCount > 0) {
                  barStyle = 'bg-gradient-to-t from-emerald-600 to-cyan-400 border border-cyan-400/50';
                }

                return (
                  <div
                    key={day.dateStr}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                  >
                    {/* Tooltip Hover cho mỗi ngày */}
                    <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-[#11212D] border border-[#4A5C6A] px-2 py-1 rounded-lg text-[10px] font-mono text-white whitespace-nowrap shadow-xl z-20">
                      <span className="font-bold text-amber-300">{day.dateStr}:</span> {day.completedCount} việc (+{day.expGained} EXP)
                    </div>

                    {/* Cột Chiều Cao */}
                    <div className="w-full flex items-end justify-center h-14">
                      <div
                        className={`w-full max-w-[28px] rounded-t-md transition-all duration-500 ${barStyle}`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>

                    {/* Nhãn Thứ / Ngày */}
                    <span
                      className={`text-[9px] mt-1 font-mono font-bold block truncate max-w-full ${
                        day.isToday ? 'text-amber-300 font-extrabold' : 'text-[#9BA8AB]'
                      }`}
                    >
                      {day.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
