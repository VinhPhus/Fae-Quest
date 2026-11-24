import React, { useState, useEffect } from 'react';
import { RainySanctuaryCanvas } from './RainySanctuaryCanvas';
import { ChillySharpness, ChillyFrameMode } from '../../../types';

interface DefaultPixelArtViewProps {
  customArtUrl?: string | null;
  isFullscreen?: boolean;
  sharpness?: ChillySharpness;
  frameMode?: ChillyFrameMode;
}

export const DefaultPixelArtView: React.FC<DefaultPixelArtViewProps> = ({
  customArtUrl,
  isFullscreen = false,
  sharpness = 'none',
  frameMode = 'cover',
}) => {
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
          {/* Lớp nền mờ 50% cùng ảnh đó để tạo chiều sâu ambient, chống vỡ hạt 100% */}
          <img
            src={imgSrc}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50 scale-105 pointer-events-none select-none"
          />
          {/* Ảnh gốc hiển thị ở tâm với tỷ lệ nguyên bản, áp dụng bộ lọc làm nét */}
          <img
            src={imgSrc}
            alt="Healing Scene"
            onLoad={() => setIsLoaded(true)}
            onError={handleImageError}
            className={`relative z-10 max-w-full max-h-full object-contain drop-shadow-[0_15px_40px_rgba(0,0,0,0.85)] transition-all duration-500 ease-in-out ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{
              filter: filterStyle,
              imageRendering: imageRenderingStyle,
            }}
          />
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

      {/* Lớp hạt ambient dust / ánh sáng tàn lửa bồng bềnh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,transparent_50%,rgba(6,20,27,0.35)_100%)]" />
        <div className="absolute bottom-10 left-1/3 w-1.5 h-1.5 rounded-full bg-amber-400/60 blur-[0.5px] animate-pulse" />
        <div className="absolute bottom-20 left-1/2 w-1 h-1 rounded-full bg-orange-400/50 animate-ping" />
        <div className="absolute bottom-14 left-2/5 w-1 h-1 rounded-full bg-amber-300/70" />
      </div>
    </div>
  );
};
