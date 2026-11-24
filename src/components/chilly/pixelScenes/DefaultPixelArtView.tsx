import React, { useState, useEffect } from 'react';
import { RainySanctuaryCanvas } from './RainySanctuaryCanvas';

interface DefaultPixelArtViewProps {
  customArtUrl?: string | null;
  isFullscreen?: boolean;
}

export const DefaultPixelArtView: React.FC<DefaultPixelArtViewProps> = ({
  customArtUrl,
  isFullscreen = false,
}) => {
  const [imgSrc, setImgSrc] = useState<string>('/pixel-art/default-healing.gif');
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
    if (customArtUrl) {
      setImgSrc(customArtUrl);
    } else {
      setImgSrc('/pixel-art/default-healing.gif');
    }
  }, [customArtUrl]);

  const handleImageError = () => {
    // Thử fallback từ .gif sang .png hoặc .jpg nếu chưa thử
    if (imgSrc.endsWith('.gif')) {
      setImgSrc('/pixel-art/default-healing.png');
    } else if (imgSrc.endsWith('.png')) {
      setImgSrc('/pixel-art/default-healing.jpg');
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    // Tự động fallback sang Cảnh hệ thống #1 nếu không tìm thấy ảnh
    return <RainySanctuaryCanvas isFullscreen={isFullscreen} />;
  }

  return (
    <div className={`w-full h-full relative overflow-hidden bg-[#06141B] flex items-center justify-center select-none ${isFullscreen ? 'cursor-default' : ''}`}>
      {/* Ảnh Pixel Art với render pixel sắc nét và hiệu ứng thở chậm nhẹ */}
      <img
        src={imgSrc}
        alt="Default Healing Pixel Art"
        onLoad={() => setIsLoaded(true)}
        onError={handleImageError}
        className={`w-full h-full object-cover [image-rendering:pixelated] transition-opacity duration-700 ease-in-out ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Lớp hạt đốm sáng / tàn lửa camp fire bay lơ lửng nhẹ tạo chiều sâu động cho ảnh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,transparent_50%,rgba(6,20,27,0.45)_100%)]" />
        {/* Animated ambient dust particles */}
        <div className="absolute bottom-10 left-1/3 w-1.5 h-1.5 rounded-full bg-amber-400/60 blur-[0.5px] animate-pulse" />
        <div className="absolute bottom-20 left-1/2 w-1 h-1 rounded-full bg-orange-400/50 animate-ping" />
        <div className="absolute bottom-14 left-2/5 w-1 h-1 rounded-full bg-amber-300/70" />
      </div>
    </div>
  );
};
