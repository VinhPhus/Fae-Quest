import React, { useEffect, useState } from 'react';

export interface CoinBurstEvent {
  id: string;
  x: number;
  y: number;
  particles: {
    id: string;
    dx: number;
    dy: number;
    size: number;
    delay: number;
  }[];
}

type CoinBurstListener = (event: CoinBurstEvent) => void;
const listeners = new Set<CoinBurstListener>();

export function triggerCoinBurst(x: number, y: number, count = 8) {
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
    const distance = Math.floor(Math.random() * 60) + 40;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 35; // bias upward
    const size = Math.floor(Math.random() * 8) + 16; // 16px to 24px
    const delay = Math.random() * 0.15;
    return {
      id: 'p_' + Math.random().toString(36).substring(2, 7),
      dx,
      dy,
      size,
      delay,
    };
  });

  const event: CoinBurstEvent = {
    id: 'burst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    x,
    y,
    particles,
  };

  listeners.forEach((fn) => fn(event));
}

export const CoinBurstOverlay: React.FC = () => {
  const [bursts, setBursts] = useState<CoinBurstEvent[]>([]);

  useEffect(() => {
    const listener: CoinBurstListener = (event) => {
      setBursts((prev) => [...prev, event]);
      setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== event.id));
      }, 1200);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (bursts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bursts.map((burst) => (
        <div
          key={burst.id}
          className="absolute"
          style={{ left: `${burst.x}px`, top: `${burst.y}px` }}
        >
          {burst.particles.map((p) => (
            <div
              key={p.id}
              className="absolute coin-particle-animate"
              style={
                {
                  '--dx': `${p.dx}px`,
                  '--dy': `${p.dy}px`,
                  animationDelay: `${p.delay}s`,
                } as React.CSSProperties
              }
            >
              <img
                src="/assets/coin.png"
                alt="coin particle"
                className="select-none"
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.9))',
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
