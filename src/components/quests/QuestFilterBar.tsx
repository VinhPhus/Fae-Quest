import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CATEGORIES } from '../../constants/categories';
import { TaskCategory } from '../../types';

export const QuestFilterBar: React.FC = () => {
  const {
    activeCategoryFilter,
    setCategoryFilter,
    activeStatusFilter,
    setStatusFilter,
  } = useFaeQuestStore();

  return (
    <div className="rpg-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeCategoryFilter === 'all'
              ? 'bg-fae text-thorn-dark shadow'
              : 'bg-thorn-dark/70 text-parchment/75 hover:text-parchment'
          }`}
        >
          Tất cả
        </button>

        {(Object.keys(CATEGORIES) as TaskCategory[]).map((catKey) => {
          const cat = CATEGORIES[catKey];
          const isSelected = activeCategoryFilter === catKey;

          return (
            <button
              key={catKey}
              onClick={() => setCategoryFilter(catKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                isSelected
                  ? 'bg-fae text-thorn-dark font-bold shadow'
                  : 'bg-thorn-dark/70 text-parchment/75 hover:text-parchment'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-1 bg-thorn-dark/90 p-1 rounded-xl border border-opal/30 self-start sm:self-auto">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
            activeStatusFilter === 'all'
              ? 'bg-opal text-parchment'
              : 'text-parchment/70 hover:text-parchment'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
            activeStatusFilter === 'pending'
              ? 'bg-opal text-parchment font-bold'
              : 'text-parchment/70 hover:text-parchment'
          }`}
        >
          Chưa xong
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
            activeStatusFilter === 'completed'
              ? 'bg-opal text-parchment font-bold'
              : 'text-parchment/70 hover:text-parchment'
          }`}
        >
          Đã xong
        </button>
      </div>
    </div>
  );
};
