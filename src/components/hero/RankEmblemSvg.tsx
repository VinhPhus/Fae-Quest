import React from 'react';

interface RankEmblemProps {
  iconUrl?: string;
  svgString?: string;
  alt?: string;
  className?: string;
  showShine?: boolean;
  showPulse?: boolean;
}

export const RankEmblem: React.FC<RankEmblemProps> = ({
  iconUrl,
  svgString,
  alt = 'Huy hiệu Rank',
  className = 'w-full h-full',
  showShine = true,
  showPulse = true,
}) => {
  if (iconUrl) {
    return (
      <div className={`relative flex items-center justify-center ${showShine ? 'rank-shine-fx rounded-2xl' : ''}`}>
        <img
          src={iconUrl}
          alt={alt}
          className={`${className} object-contain select-none rank-badge-interactive ${showPulse ? 'rank-pulse-fx' : ''}`}
          loading="eager"
        />
      </div>
    );
  }

  if (svgString) {
    return (
      <div
        className={`${className} rank-badge-interactive ${showPulse ? 'rank-pulse-fx' : ''}`}
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    );
  }

  return null;
};

// Also export RankEmblemSvg for backward compatibility
export const RankEmblemSvg = RankEmblem;
