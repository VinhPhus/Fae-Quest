import React, { useState, useEffect } from 'react';
import { RainySanctuaryCanvas } from './RainySanctuaryCanvas';
import { ChillySharpness, ChillyFrameMode } from '../../../types';
import { useChillyAudioStore } from '../../../store/useChillyAudioStore';

interface DefaultPixelArtViewProps {
  customArtUrl?: string | null;
  isFullscreen?: boolean;
  sharpness?: ChillySharpness;
  frameMode?: ChillyFrameMode;
}

interface FloatingMoteSpec {
  id: number;
  left: string;
  top: string;
  size: number;
  isWarm: boolean;
  duration: string;
  delay: string;
  dx: string;
  dy: string;
}

// 20 hạt sáng đom đóm cố định (GPU-accelerated translate3d + opacity)
const FLOATING_MOTES: FloatingMoteSpec[] = Array.from({ length: 20 }, (_, i) => {
  const isWarm = i % 2 === 0;
  const size = 2 + (i % 4); // 2px -> 5px
  const leftPct = ((i * 37 + 11) % 92) + 4;
  const topPct = ((i * 53 + 17) % 82) + 12;
  const duration = 11 + (i % 7) * 1.6;
  const delay = -(i * 1.45);
  const dx = ((i % 5) - 2) * 18 + 14; // bay chéo nhẹ
  const dy = -(70 + (i % 4) * 28); // trôi lên trên

  return {
    id: i,
    left: `${leftPct}%`,
    top: `${topPct}%`,
    size,
    isWarm,
    duration: `${duration.toFixed(1)}s`,
    delay: `${delay.toFixed(2)}s`,
    dx: `${dx}px`,
    dy: `${dy}px`,
  };
});

export const DefaultPixelArtView: React.FC<DefaultPixelArtViewProps> = ({
  customArtUrl,
  isFullscreen = false,
  sharpness = 'none',
  frameMode = 'cover',
}) => {
  const isPlaying = useChillyAudioStore((s) => s.isPlaying);
  const [imgSrc, setImgSrc] = useState<string>('/pixel-art/default-healing.png');
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
    if (customArtUrl) {
      setImgSrc(customArtUrl);
    } else {
      setImgSrc('/pixel-art/default-healing.png');
    }
  }, [customArtUrl]);

  const handleImageError = () => {
    if (imgSrc.endsWith('.png')) {
      setImgSrc('/pixel-art/default-healing.gif');
    } else if (imgSrc.endsWith('.gif')) {
      setImgSrc('/pixel-art/default-healing.jpg');
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return <RainySanctuaryCanvas isFullscreen={isFullscreen} />;
  }

  // Tính toán bộ lọc làm nét SVG Unsharp Mask
  let filterStyle = 'none';
  if (sharpness === 'soft') {
    filterStyle = 'url(#chilly-sharp-soft) contrast(1.04) saturate(1.05)';
  } else if (sharpness === 'hd') {
    filterStyle = 'url(#chilly-sharp-hd) contrast(1.07) saturate(1.08)';
  }

  // Tính toán kiểu render ảnh (mặc định mượt mà, chỉ pixelated khi chọn chế độ Pixel)
  const imageRenderingStyle: React.CSSProperties['imageRendering'] =
    frameMode === 'pixel' ? 'pixelated' : 'auto';

  return (
    <div
      className={`w-full h-full relative overflow-hidden bg-[#06141B] flex items-center justify-center select-none ${
        isFullscreen ? 'cursor-default' : ''
      }`}
    >
      {/* 
        Nhúng SVG Filters Unsharp Mask (Làm nét ảnh thời gian thực không vỡ hạt)
      */}
      <svg
        className="hidden"
        aria-hidden="true"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      >
        <defs>
          {/* id="chilly-sharp-soft" (Làm nét nhẹ): tăng độ trong trẻo và viền chi tiết */}
          <filter id="chilly-sharp-soft" x="0%" y="0%" width="100%" height="100%">
            <feConvolveMatrix
              order="3"
              preserveAlpha="true"
              kernelMatrix="0 -0.25 0 -0.25 2.0 -0.25 0 -0.25 0"
            />
          </filter>

          {/* id="chilly-sharp-hd" (Siêu nét HD): ma trận sắc nét cao cho màn hình lớn */}
          <filter id="chilly-sharp-hd" x="0%" y="0%" width="100%" height="100%">
            <feConvolveMatrix
              order="3"
              preserveAlpha="true"
              kernelMatrix="0 -0.45 0 -0.45 2.8 -0.45 0 -0.45 0"
            />
          </filter>
        </defs>
      </svg>

      {/* Hiển thị Khung hình: 'contain' (Nét gốc) vs 'cover'/'pixel' (Tràn viền) */}
      {frameMode === 'contain' ? (
        <>
          {/* Lớp 1: Nền Ambilight Breathing chuyển động GPU êm ái (KHÔNG animate blur) */}
          <img
            src={imgSrc}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-55 brightness-75 pointer-events-none select-none chilly-ambient-bg z-0"
          />

          {/* Lớp 2: 20 hạt sáng / đom đóm lơ lửng giữa nền mờ và bức ảnh chính */}
          <div
            aria-hidden="true"
            className={`absolute inset-0 overflow-hidden pointer-events-none z-[5] transition-opacity duration-700 ${
              isPlaying ? 'opacity-100' : 'opacity-65'
            }`}
          >
            {FLOATING_MOTES.map((mote) => {
              const bgColor = mote.isWarm
                ? isPlaying
                  ? 'rgba(253, 211, 77, 0.92)'
                  : 'rgba(253, 186, 116, 0.72)'
                : isPlaying
                ? 'rgba(126, 232, 192, 0.88)'
                : 'rgba(94, 234, 212, 0.65)';
              const glow = mote.isWarm
                ? isPlaying
                  ? '0 0 10px 2px rgba(251, 191, 36, 0.65)'
                  : '0 0 6px 1px rgba(251, 191, 36, 0.35)'
                : isPlaying
                ? '0 0 10px 2px rgba(126, 232, 192, 0.6)'
                : '0 0 6px 1px rgba(126, 232, 192, 0.32)';

              return (
                <span
                  key={mote.id}
                  className="chilly-mote"
                  style={
                    {
                      left: mote.left,
                      top: mote.top,
                      width: `${mote.size}px`,
                      height: `${mote.size}px`,
                      backgroundColor: bgColor,
                      boxShadow: glow,
                      '--mote-duration': mote.duration,
                      '--mote-delay': mote.delay,
                      '--mote-dx': mote.dx,
                      '--mote-dy': mote.dy,
                      '--mote-peak-opacity': isPlaying ? '0.88' : '0.58',
                    } as React.CSSProperties
                  }
                />
              );
            })}
          </div>

          {/* Lớp 3: Ảnh gốc nổi khối ở giữa với góc bo tinh tế, viền sáng mảnh & đổ bóng sâu */}
          <div className="relative z-10 w-full h-full p-2 sm:p-4 flex items-center justify-center pointer-events-none">
            <img
              src={imgSrc}
              alt="Healing Scene"
              onLoad={() => setIsLoaded(true)}
              onError={handleImageError}
              className={`max-w-full max-h-full object-contain rounded-xl ring-1 ring-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.65)] transition-all duration-500 ease-in-out ${
                isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              style={{
                filter: filterStyle,
                imageRendering: imageRenderingStyle,
              }}
            />
          </div>
        </>
      ) : (
        /* Tràn viền (object-cover) mượt mà hoặc pixel */
        <img
          src={imgSrc}
          alt="Healing Scene"
          onLoad={() => setIsLoaded(true)}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          style={{
            filter: filterStyle,
            imageRendering: imageRenderingStyle,
          }}
        />
      )}

      {/* Lớp vignette nhẹ tạo chiều sâu tối */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,transparent_50%,rgba(6,20,27,0.35)_100%)]" />
      </div>
    </div>
  );
};
