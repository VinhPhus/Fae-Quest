import React from 'react';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { Settings } from 'lucide-react';

export const TopBanner: React.FC = () => {
  const { setSettingsOpen } = useFaeQuestStore();

  return (
    <div className="relative overflow-hidden border-b border-fae/30 bg-gradient-to-r from-thorn-dark via-bargain to-opal/70">
      {/* Decorative SVG Vines in Background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path d="M0,60 Q150,10 300,60 T600,60 T900,60 T1200,60" fill="none" stroke="#CCD0CF" strokeWidth="3" />
        <path d="M0,90 Q200,30 400,80 T800,50 T1200,80" fill="none" stroke="#4A5C6A" strokeWidth="2" />
        <polygon points="150,25 155,38 168,43 155,48 150,61 145,48 132,43 145,38" fill="#CCD0CF" />
        <polygon points="620,15 624,25 634,29 624,33 620,43 616,33 606,29 616,25" fill="#FFFFFF" />
        <polygon points="1040,30 1045,42 1057,47 1045,52 1040,64 1035,52 1023,47 1035,42" fill="#CCD0CF" />
      </svg>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          {/* Emblem Icon */}
          <div className="w-10 h-10 rounded-xl bg-[#06141B] overflow-hidden flex items-center justify-center shadow-lg border border-[#4A5C6A] p-0.5">
            <img
              src="/assets/logo.png"
              alt="FaeQuest Logo"
              className="w-full h-full object-contain [image-rendering:pixelated]"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-rpg font-bold text-lg sm:text-xl tracking-wider text-parchment">
                FAE<span className="text-fae">QUEST</span>
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-opal/40 border border-opal-light/50 text-parchment">
                RPG Todo v2.0
              </span>
            </div>
            <p className="text-xs text-parchment/75 hidden sm:block">
              Biến mục tiêu mỗi ngày thành hành trình chinh phục đỉnh Thách Đấu
            </p>
          </div>
        </div>

        {/* Action Controls: Settings */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-thorn-dark/80 hover:bg-thorn border border-opal/40 hover:border-fae/50 text-xs font-semibold text-parchment flex items-center gap-1.5 transition shadow-sm"
            title="Mở cài đặt hệ thống & quản lý dữ liệu"
          >
            <Settings className="w-4 h-4 text-fae" />
            <span>Cài Đặt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
