import React from 'react';

export type CoinIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'hero';

interface CoinIconProps {
  size?: CoinIconSize;
  className?: string;
  animate?: boolean;
  alt?: string;
}

const sizeClasses: Record<CoinIconSize, string> = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
  '2xl': 'w-9 h-9',
  hero: 'w-12 h-12',
};

export const CoinIcon: React.FC<CoinIconProps> = ({
  size = 'md',
  className = '',
  animate = true,
  alt = 'Xu Vàng',
}) => {
  return (
    <img
      src="/assets/coin.png"
      alt={alt}
      className={`inline-block object-contain [image-rendering:pixelated] select-none shrink-0 ${sizeClasses[size]} ${
        animate ? 'coin-interactive-fx' : ''
      } ${className}`}
      loading="eager"
      draggable={false}
    />
  );
};
