import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CATEGORIES, DIFFICULTIES } from '../../constants/categories';
import { TaskCategory } from '../../types';
import { BarChart3, PieChart, Flame, CheckCircle, TrendingUp, Award } from 'lucide-react';

export const ProductivityAnalytics: React.FC = () => {
  const { tasks, completedTotal, streakDays, exp, coins } = useFaeQuestStore();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Breakdown by category
  const categoryCounts: Record<TaskCategory, { total: number; completed: number }> = {
    'hoc-tap': { total: 0, completed: 0 },
    'cong-viec': { total: 0, completed: 0 },
    'the-luc': { total: 0, completed: 0 },
    'ca-nhan': { total: 0, completed: 0 },
    'sang-tao': { total: 0, completed: 0 },
  };

  tasks.forEach((t) => {
    if (categoryCounts[t.category]) {
      categoryCounts[t.category].total += 1;
      if (t.completed) categoryCounts[t.category].completed += 1;
    }
  });

  return (
    <div className="space-y-6">
      {/* Analytics Banner */}
      <div className="rpg-card rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-opal/30 border border-opal-light/50 text-xs font-bold text-parchment mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-fae" />
            <span>Chỉ Số Hiệu Suất Chiến Binh</span>
          </div>
          <h2 className="text-2xl font-extrabold text-parchment">Phân Tích Năng Suất Cá Nhân</h2>
          <p className="text-sm text-parchment/75 mt-1">
            Theo dõi tiến độ hoàn thành các mục tiêu rèn luyện và duy trì chuỗi kỷ luật thép mỗi ngày.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rpg-card rounded-2xl p-4 border border-fae/40 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-fae/20 border border-fae/40 flex items-center justify-center text-fae shrink-0">
            <Flame className="w-6 h-6 fill-fae" />
          </div>
          <div>
            <span className="text-xs text-parchment/60 block font-medium">Chuỗi Kỷ Luật</span>
            <span className="text-xl font-extrabold text-parchment">{streakDays} Ngày Liên Tiếp</span>
          </div>
        </div>

        <div className="rpg-card rounded-2xl p-4 border border-emerald-500/40 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-parchment/60 block font-medium">Tỷ Lệ Hoàn Thành</span>
            <span className="text-xl font-extrabold text-emerald-300">{completionRate}% Mục Tiêu</span>
          </div>
        </div>

        <div className="rpg-card rounded-2xl p-4 border border-opal/40 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-opal/20 border border-opal/40 flex items-center justify-center text-opal-light shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-parchment/60 block font-medium">Tổng EXP Tích Lũy</span>
            <span className="text-xl font-extrabold text-fae">{exp.toLocaleString()} EXP</span>
          </div>
        </div>

        <div className="rpg-card rounded-2xl p-4 border border-amber-500/40 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-parchment/60 block font-medium">Tổng Đã Hoàn Tất</span>
            <span className="text-xl font-extrabold text-parchment">{completedTotal} Nhiệm Vụ</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Progress Bars */}
      <div className="rpg-card rounded-3xl p-6 border border-opal/30 space-y-5">
        <h3 className="font-rpg font-bold text-lg text-parchment flex items-center gap-2">
          <PieChart className="w-5 h-5 text-fae" />
          <span>Phân Bổ Hoạt Động Theo Nhóm</span>
        </h3>

        <div className="space-y-4">
          {(Object.keys(CATEGORIES) as TaskCategory[]).map((catKey) => {
            const cat = CATEGORIES[catKey];
            const stat = categoryCounts[catKey];
            const pct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;

            return (
              <div key={catKey} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-parchment flex items-center gap-1.5">
                    <span className={cat.color}>{cat.label}</span>
                  </span>
                  <span className="text-parchment/70 font-semibold">
                    {stat.completed}/{stat.total} xong ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-thorn-dark h-3 rounded-full overflow-hidden border border-opal/30">
                  <div
                    className="bg-gradient-to-r from-opal to-fae h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
