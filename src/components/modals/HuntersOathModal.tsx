import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFaeQuestStore } from '../../store/useFaeQuestStore';
import { CoinIcon } from '../ui/CoinIcon';
import { playSoundEffect } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  Scroll,
  Swords,
  Scale,
  Shield,
  AlertCircle,
  X,
  Sparkles,
  CheckCircle,
  ChevronUp,
} from 'lucide-react';

export const HuntersOathModal: React.FC = () => {
  const { isOathOpen, setOathOpen, acceptOath, soundEnabled, userRole } = useFaeQuestStore();

  const [isScrollOpen, setIsScrollOpen] = useState(false);
  const [isBreakingSeal, setIsBreakingSeal] = useState(false);
  const [isStamped, setIsStamped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Check if oath was previously accepted in localStorage
  const isPreviouslyAccepted =
    typeof window !== 'undefined'
      ? localStorage.getItem('faequest_oath_accepted') === 'true'
      : false;

  // Reset internal states whenever modal opens
  useEffect(() => {
    if (isOathOpen) {
      setIsScrollOpen(false);
      setIsBreakingSeal(false);
      setIsStamped(false);
      setTilt({ x: 0, y: 0 });
    }
  }, [isOathOpen]);

  const isOpen = Boolean(isOathOpen && userRole !== 'admin');
  useBodyScrollLock(isOpen);

  // Tài khoản Admin được bỏ qua hoàn toàn bước tuyên thệ Cuộn Khế Ước 3D
  if (!isOpen || typeof document === 'undefined') return null;

  // Handle 3D Mouse Tilt over the closed scroll
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isScrollOpen || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    // Moderate tilt angles for realistic 3D feel
    setTilt({
      x: -y * 18,
      y: x * 22,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  // Open the 3D scroll with sound and elastic physics
  const handleOpenScroll = () => {
    if (isScrollOpen || isBreakingSeal) return;

    setIsBreakingSeal(true);
    playSoundEffect('unseal', soundEnabled);

    // Unseal animation delay
    setTimeout(() => {
      setIsScrollOpen(true);
      setIsBreakingSeal(false);
    }, 280);
  };

  // Close / Roll up the scroll
  const handleRollUp = () => {
    playSoundEffect('click', soundEnabled);
    setIsScrollOpen(false);
    setIsStamped(false);
  };

  // Sign Oath action with Stamping Animation
  const handleSignOath = () => {
    if (isStamped) return;

    setIsStamped(true);
    playSoundEffect('stamp', soundEnabled);

    // Confetti burst
    try {
      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#CCD0CF', '#9BA8AB', '#4A5C6A', '#253745', '#FFFFFF'],
      });
    } catch {
      // ignore
    }

    // Wait 900ms so user can appreciate the wax stamp before closing
    setTimeout(() => {
      acceptOath();
      setIsStamped(false);
      setIsScrollOpen(false);
    }, 950);
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setOathOpen(false);
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      className="fixed inset-0 w-screen h-[100dvh] z-[100] bg-[#06141B]/85 backdrop-blur-md touch-none overscroll-none flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain touch-pan-y"
    >
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-gradient-to-r from-[#253745]/30 via-[#4A5C6A]/20 to-transparent rounded-full blur-[100px] opacity-70 animate-pulse" />
      </div>

      {/* Close button at top right */}
      <button
        onClick={() => setOathOpen(false)}
        className="fixed top-4 right-4 text-[#CCD0CF]/60 hover:text-[#CCD0CF] p-2 rounded-full bg-[#11212D]/80 border border-[#253745] hover:border-[#4A5C6A] transition z-50 backdrop-blur-sm cursor-pointer"
        title="Đóng khế ước"
      >
        <X className="w-5 h-5" />
      </button>

      {/* 3D PERSPECTIVE CONTAINER */}
      <div className="relative z-10 w-[94vw] sm:w-full max-w-xl perspective-1200 flex flex-col items-center justify-center py-4 sm:py-6 scale-90 sm:scale-100 origin-center transition-transform">
        {/* ============================================================ */}
        {/* STATE 1: CUỘN GIẤY ĐANG ĐÓNG (isScrollOpen = false)         */}
        {/* ============================================================ */}
        {!isScrollOpen && (
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            onClick={handleOpenScroll}
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered ? 1.04 : 1
                })`,
              transition: isHovered
                ? 'transform 0.08s ease-out'
                : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            className="group cursor-pointer select-none relative flex flex-col items-center justify-center py-8 px-4 w-full max-w-md preserve-3d"
          >
            {/* Shimmering Halo when hovered */}
            <div
              className={`absolute inset-0 bg-gradient-to-r from-[#CCD0CF]/10 via-[#4A5C6A]/20 to-[#CCD0CF]/10 rounded-3xl blur-2xl transition-opacity duration-500 pointer-events-none ${isHovered ? 'opacity-100 scale-110' : 'opacity-40 scale-95'
                }`}
            />

            {/* 3D CLOSED SCROLL CYLINDER TUBE */}
            <div className="relative w-full max-w-[360px] sm:max-w-[400px] flex flex-col items-center preserve-3d">
              {/* TOP ROLLER CYLINDER */}
              <div className="relative w-full h-8 sm:h-9 scroll-roller-wood rounded-t-full border-t border-[#CCD0CF]/30 z-10 flex items-center justify-between px-1">
                {/* Left Finial */}
                <div className="absolute -left-4 sm:-left-5 w-5 sm:w-6 h-8 sm:h-9 scroll-finial rounded-full border border-[#CCD0CF]/40" />
                {/* Right Finial */}
                <div className="absolute -right-4 sm:-right-5 w-5 sm:w-6 h-8 sm:h-9 scroll-finial rounded-full border border-[#CCD0CF]/40" />
              </div>

              {/* CENTER ROLLED PARCHMENT SEAM */}
              <div className="w-[96%] h-4 sm:h-5 bg-gradient-to-r from-[#06141B] via-[#253745] to-[#06141B] border-y border-[#4A5C6A]/40 shadow-inner flex items-center justify-center">
                <div className="w-full h-[1px] bg-[#CCD0CF]/30" />
              </div>

              {/* BOTTOM ROLLER CYLINDER */}
              <div className="relative w-full h-8 sm:h-9 scroll-roller-wood rounded-b-full border-b border-black/60 z-10 flex items-center justify-between px-1">
                {/* Left Finial */}
                <div className="absolute -left-4 sm:-left-5 w-5 sm:w-6 h-8 sm:h-9 scroll-finial rounded-full border border-[#CCD0CF]/40" />
                {/* Right Finial */}
                <div className="absolute -right-4 sm:-right-5 w-5 sm:w-6 h-8 sm:h-9 scroll-finial rounded-full border border-[#CCD0CF]/40" />
              </div>

              {/* ABSOLUTE CENTER WRAPPER FOR WAX SEAL */}
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div
                  style={{
                    transform: isBreakingSeal
                      ? 'scale(1.4)'
                      : 'translateZ(28px)',
                    transition: 'all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    opacity: isBreakingSeal ? 0 : 1,
                  }}
                  className="pointer-events-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full wax-seal-3d wax-seal-pulse flex flex-col items-center justify-center text-[#CCD0CF] shadow-2xl select-none"
                >
                  {/* Concentric Silver Borders */}
                  <div className="w-[84%] h-[84%] rounded-full border-2 border-dashed border-[#CCD0CF]/70 flex flex-col items-center justify-center relative">
                    <span className="absolute -top-1 text-[7px] font-extrabold uppercase tracking-widest text-[#CCD0CF]">
                      ★ FAEQUEST ★
                    </span>
                    <div className="relative flex items-center justify-center my-0.5">
                      <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-[#CCD0CF] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                      <Swords className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#9BA8AB] absolute drop-shadow" />
                    </div>
                    <span className="text-[8px] font-bold text-white tracking-wider">
                      KỶ LUẬT
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pulsing Guide Text */}
            <div className="mt-8 text-center space-y-1.5 transition-transform duration-300 group-hover:scale-105">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#11212D] border border-[#4A5C6A] shadow-lg">
                <span className="text-xs sm:text-sm font-extrabold tracking-wider text-[#CCD0CF] uppercase">
                  📜 NHẤN VÀO CUỘN KHẾ ƯỚC ĐỂ KHAI MỞ
                </span>
              </div>
              <p className="text-xs text-[#9BA8AB] italic">
                Bản tuyên ngôn kỷ luật dành cho Thợ Săn FaeQuest
              </p>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STATE 2: CUỘN GIẤY ĐÃ KHAI MỞ (isScrollOpen = true)          */}
        {/* ============================================================ */}
        {isScrollOpen && (
          <div
            style={{
              animation: 'unrollScroll 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
            className="w-full relative flex flex-col items-center max-w-xl preserve-3d"
          >
            {/* TOP 3D ROLLER */}
            <div className="relative w-full h-7 sm:h-8 scroll-roller-wood rounded-full border-t border-[#CCD0CF]/30 z-20 flex items-center justify-between px-2 shadow-2xl">
              {/* Left Finial */}
              <div className="absolute -left-4 sm:-left-5 w-5 sm:w-6 h-8 sm:h-9 scroll-finial rounded-full border border-[#CCD0CF]/40 shadow-lg" />
              {/* Center Decorative Band */}
              <div className="mx-auto w-24 h-1.5 bg-gradient-to-r from-transparent via-[#CCD0CF]/60 to-transparent rounded-full" />
              {/* Right Finial */}
              <div className="absolute -right-4 sm:-right-5 w-5 sm:w-6 h-8 sm:h-9 scroll-finial rounded-full border border-[#CCD0CF]/40 shadow-lg" />
            </div>

            {/* UNROLLED ANCIENT PARCHMENT PAPER BODY */}
            <div className="relative w-[96%] sm:w-[97%] -my-1 parchment-gold-border border-x-2 border-[#4A5C6A] shadow-2xl overflow-hidden z-10 px-4 sm:px-6 py-5 sm:py-6">
              {/* Inner Dashed Border */}
              <div className="absolute inset-2 border border-dashed border-[#4A5C6A]/40 rounded-lg pointer-events-none" />

              {/* Corners */}
              <div className="absolute top-3 left-3 text-[#9BA8AB]/40 text-xs select-none">❖</div>
              <div className="absolute top-3 right-3 text-[#9BA8AB]/40 text-xs select-none">❖</div>
              <div className="absolute bottom-3 left-3 text-[#9BA8AB]/40 text-xs select-none">❖</div>
              <div className="absolute bottom-3 right-3 text-[#9BA8AB]/40 text-xs select-none">❖</div>

              {/* Scroll Content */}
              <div className="relative z-10 space-y-4 max-h-[68vh] overflow-y-auto pr-1 custom-scrollbar">
                {/* Header Badge & Title */}
                <div className="text-center space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06141B] border border-[#253745] shadow-inner">
                    <CoinIcon size="sm" />
                    <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#CCD0CF]">
                      Bản Tuyên Ngôn Kỷ Luật Thợ Săn
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-[#CCD0CF]" />
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <Scroll className="w-6 h-6 text-[#CCD0CF] shrink-0" />
                    <h3 className="font-rpg font-extrabold text-2xl sm:text-3xl text-[#CCD0CF] tracking-wide drop-shadow">
                      KHẾ ƯỚC THỢ SĂN FAEQUEST
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-[#9BA8AB] max-w-md mx-auto italic font-sans font-medium">
                    "Nơi danh dự và kỷ luật rèn nên bậc Thách Đấu thực thụ"
                  </p>
                </div>

                {/* 3 Honor Oaths */}
                <div className="space-y-2.5">
                  {/* Oath 1: Danh Dự Thực Chiến */}
                  <div className="rounded-xl p-3.5 bg-[#11212D] border border-[#253745] shadow-md flex items-start gap-3 transition hover:border-[#4A5C6A]">
                    <div className="w-9 h-9 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shrink-0 shadow-inner">
                      <Swords className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs sm:text-sm font-extrabold text-[#CCD0CF] flex items-center gap-1.5">
                        <span> Danh Dự Thực Chiến</span>
                      </h4>
                      <p className="text-xs text-[#9BA8AB] leading-relaxed">
                        Chỉ tích hoàn thành khi bạn đã thực sự làm xong công việc đó ngoài đời thực. Gian lận điểm EXP chỉ đánh lừa chính bản thân bạn.
                      </p>
                    </div>
                  </div>

                  {/* Oath 2: Phân Định Công Tâm */}
                  <div className="rounded-xl p-3.5 bg-[#11212D] border border-[#253745] shadow-md flex items-start gap-3 transition hover:border-[#4A5C6A]">
                    <div className="w-9 h-9 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shrink-0 shadow-inner">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs sm:text-sm font-extrabold text-[#CCD0CF] flex items-center gap-1.5">
                        <span> Phân Định Công Tâm</span>
                      </h4>
                      <p className="text-xs text-[#9BA8AB] leading-relaxed">
                        Nhiệm vụ được thực hiện một cách công bằng, chủ yếu tự dựa vào ý thức, tinh thần của người chơi thì FaeQuest mới có ý nghĩa
                      </p>
                    </div>
                  </div>

                  {/* Oath 3: Kỷ Luật Tự Thưởng */}
                  <div className="rounded-xl p-3.5 bg-[#11212D] border border-[#253745] shadow-md flex items-start gap-3 transition hover:border-[#4A5C6A]">
                    <div className="w-9 h-9 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shrink-0 shadow-inner">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs sm:text-sm font-extrabold text-[#CCD0CF] flex items-center gap-1.5">
                        <span> Kỷ Luật Tự Thưởng</span>
                      </h4>
                      <p className="text-xs text-[#9BA8AB] leading-relaxed">
                        Mỗi đồng Xu Vàng là mồ hôi và sự kiên trì. Hãy chi tiêu xứng đáng trong Cửa Hàng Tự Thưởng.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Soft Anti-Cheat Notice */}
                <div className="px-3.5 py-2.5 rounded-xl bg-[#06141B] border border-[#253745] flex items-center gap-2.5 text-xs text-[#9BA8AB]">
                  <AlertCircle className="w-4 h-4 text-[#CCD0CF] shrink-0" />
                  <p className="leading-tight">
                    <strong className="text-[#CCD0CF] font-semibold">Quy tắc hệ thống:</strong> Áp dụng cơ chế chống spam: Nhiệm vụ cần thời gian ủ tối thiểu 1 phút, trần 15 nhiệm vụ & 2 Trùm Cuối/ngày; Đồng hồ Fae Focus chỉ mở Xong Sớm khi tập trung từ 50% thời gian.
                  </p>
                </div>

                {/* ACTION AREA */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                  {/* Primary Signing Button (CTA) */}
                  <button
                    onClick={handleSignOath}
                    disabled={isStamped}
                    className="flex-1 w-full py-3.5 px-5 rounded-xl bg-[#CCD0CF] hover:bg-white text-[#06141B] font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl hover:shadow-[0_4px_20px_rgba(204,208,207,0.3)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] border border-white/40 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#06141B]" />
                    <span>
                      {isPreviouslyAccepted
                        ? '✔ ĐÃ HIỂU VÀ XÁC NHẬN LẠI KHẾ ƯỚC'
                        : '✔ TÔI ĐỒNG Ý KÝ KHẾ ƯỚC & BẮT ĐẦU'}
                    </span>
                  </button>

                  {/* Roll up / Close button */}
                  <button
                    onClick={handleRollUp}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#11212D] hover:bg-[#253745] text-[#9BA8AB] hover:text-[#CCD0CF] text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#253745] hover:border-[#4A5C6A] transition cursor-pointer"
                    title="Cuộn lại cuộn giấy"
                  >
                    <ChevronUp className="w-4 h-4" />
                    <span>Cuộn lại</span>
                  </button>
                </div>
              </div>

              {/* STAMPED WAX SEAL OVERLAY ANIMATION */}
              {isStamped && (
                <div className="absolute bottom-6 right-6 z-40 animate-stamp-slam pointer-events-none select-none">
                  <div className="w-32 h-32 rounded-full wax-seal-3d border-4 border-[#CCD0CF] flex flex-col items-center justify-center text-[#CCD0CF] shadow-2xl p-2 rotate-[-12deg]">
                    <div className="w-full h-full rounded-full border-2 border-dashed border-[#CCD0CF]/70 flex flex-col items-center justify-center text-center p-1">
                      <span className="text-[7px] font-extrabold uppercase tracking-widest text-[#CCD0CF]">
                        ★ FAEQUEST SEAL ★
                      </span>
                      <div className="my-0.5">
                        <Shield className="w-6 h-6 text-[#CCD0CF] mx-auto" />
                      </div>
                      <span className="text-[10px] font-black uppercase text-white tracking-wider leading-none">
                        ĐÃ ẤN ĐỊNH
                      </span>
                      <span className="text-[9px] font-extrabold uppercase text-[#CCD0CF] tracking-tight">
                        KHẾ ƯỚC
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM 3D ROLLER */}
            <div className="relative w-full h-7 sm:h-8 scroll-roller-wood rounded-full border-b border-black/70 z-20 flex items-center justify-between px-2 shadow-2xl">
              {/* Left Finial */}
              <div className="absolute -left-4 sm:-left-5 w-5 sm:w-6 h-8 sm:h-9 scroll-finial rounded-full border border-[#CCD0CF]/40 shadow-lg" />
              {/* Center Decorative Band */}
              <div className="mx-auto w-24 h-1.5 bg-gradient-to-r from-transparent via-[#CCD0CF]/60 to-transparent rounded-full" />
              {/* Right Finial */}
              <div className="absolute -right-4 sm:-right-5 w-5 sm:w-6 h-8 sm:h-9 scroll-finial rounded-full border border-[#CCD0CF]/40 shadow-lg" />
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
