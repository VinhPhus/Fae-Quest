import React, { useEffect, useRef } from 'react';

export const AfterglowPixelSeaCanvas: React.FC<{ isFullscreen?: boolean }> = ({ isFullscreen = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 360;
    const H = 225;
    canvas.width = W;
    canvas.height = H;

    let animId: number;
    let tick = 0;

    // Đám mây pixel trôi nhẹ
    const clouds = [
      { x: 30, y: 35, w: 75, h: 14, speed: 0.12 },
      { x: 190, y: 50, w: 90, h: 18, speed: 0.08 },
      { x: 120, y: 20, w: 60, h: 10, speed: 0.15 },
      { x: 280, y: 30, w: 65, h: 12, speed: 0.10 },
    ];

    // Chim hải âu pixel bay
    const birds = [
      { x: 70, y: 45, vx: 0.35, vy: 0.05, wingPhase: 0 },
      { x: 95, y: 40, vx: 0.38, vy: -0.04, wingPhase: 1.5 },
      { x: 80, y: 55, vx: 0.33, vy: 0.02, wingPhase: 3.0 },
    ];

    const render = () => {
      tick++;
      ctx.imageSmoothingEnabled = false;

      const horizonY = 125;

      // 1. Bầu trời hoàng hôn chuyển sắc tím - hồng - cam rực rỡ (Lucian #474 Palette)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0.0, '#2D0A4E'); // Tím thẫm
      skyGrad.addColorStop(0.35, '#581363'); // Tím hoa cà
      skyGrad.addColorStop(0.65, '#B8285F'); // Hồng ngọc
      skyGrad.addColorStop(0.85, '#E2504C'); // Cam san hô
      skyGrad.addColorStop(1.0, '#F59E0B'); // Vàng hoàng hôn
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, horizonY);

      // 2. Mặt trời kẻ sọc Pixel Synthwave
      const sunX = 180;
      const sunY = 100;
      const sunRadius = 28;

      // Hào quang mặt trời
      const sunAura = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.4, sunX, sunY, sunRadius * 2.8);
      sunAura.addColorStop(0, 'rgba(255, 170, 50, 0.55)');
      sunAura.addColorStop(0.5, 'rgba(242, 80, 140, 0.25)');
      sunAura.addColorStop(1, 'rgba(45, 10, 78, 0)');
      ctx.fillStyle = sunAura;
      ctx.fillRect(sunX - 80, sunY - 80, 160, 160);

      // Thân mặt trời tròn
      ctx.save();
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.clip();

      const sunGrad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
      sunGrad.addColorStop(0, '#FFE66D');
      sunGrad.addColorStop(0.5, '#FF8A5B');
      sunGrad.addColorStop(1, '#F2508C');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(sunX - sunRadius, sunY - sunRadius, sunRadius * 2, sunRadius * 2);

      // Các sọc ngang cắt qua nửa dưới mặt trời (Retro striped sun)
      ctx.fillStyle = '#4E1154';
      const stripeCount = 6;
      for (let s = 1; s <= stripeCount; s++) {
        const stripeY = sunY + (s * 4);
        const stripeH = 1 + (s * 0.4);
        ctx.fillRect(sunX - sunRadius, stripeY, sunRadius * 2, stripeH);
      }
      ctx.restore();

      // 3. Mây hoàng hôn pixel lững lờ trôi
      for (const cl of clouds) {
        cl.x += cl.speed;
        if (cl.x > W + 40) cl.x = -cl.w - 20;

        ctx.fillStyle = 'rgba(78, 17, 84, 0.45)';
        ctx.fillRect(Math.floor(cl.x), Math.floor(cl.y), cl.w, cl.h);
        ctx.fillStyle = 'rgba(242, 80, 140, 0.35)';
        ctx.fillRect(Math.floor(cl.x) + 4, Math.floor(cl.y) + 3, cl.w - 8, cl.h - 5);
        ctx.fillStyle = 'rgba(255, 138, 91, 0.55)';
        ctx.fillRect(Math.floor(cl.x) + 10, Math.floor(cl.y) + cl.h - 3, cl.w - 20, 2);
      }

      // 4. Đàn hải âu bay lượn
      for (const b of birds) {
        b.x += b.vx;
        b.y += Math.sin(tick * 0.05 + b.wingPhase) * 0.2;
        if (b.x > W + 20) b.x = -20;

        // Cánh chim vẫy theo chu kỳ
        const wingFlap = Math.sin(tick * 0.2 + b.wingPhase);
        const wingYOffset = wingFlap > 0 ? -1 : 1;

        ctx.fillStyle = '#2D0A4E';
        // Thân chim
        ctx.fillRect(Math.floor(b.x), Math.floor(b.y), 2, 2);
        // Cánh trái
        ctx.fillRect(Math.floor(b.x) - 2, Math.floor(b.y) + wingYOffset, 2, 1);
        ctx.fillRect(Math.floor(b.x) - 4, Math.floor(b.y) + wingYOffset * 2, 2, 1);
        // Cánh phải
        ctx.fillRect(Math.floor(b.x) + 2, Math.floor(b.y) + wingYOffset, 2, 1);
        ctx.fillRect(Math.floor(b.x) + 4, Math.floor(b.y) + wingYOffset * 2, 2, 1);
      }

      // 5. Mặt Biển Chiều Hoàng Hôn (Ocean & Shimmer Reflection)
      const oceanGrad = ctx.createLinearGradient(0, horizonY, 0, H);
      oceanGrad.addColorStop(0.0, '#2D0A4E');
      oceanGrad.addColorStop(0.4, '#190A2E');
      oceanGrad.addColorStop(1.0, '#06141B');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, horizonY, W, H - horizonY);

      // Cột phản chiếu ánh sáng mặt trời trên sóng biển (Sun Shimmer Column)
      const shimmerWidthAtHorizon = 24;
      const shimmerWidthAtBottom = 110;

      for (let y = horizonY + 2; y < H; y += 3) {
        const progress = (y - horizonY) / (H - horizonY);
        const curWidth = shimmerWidthAtHorizon + (shimmerWidthAtBottom - shimmerWidthAtHorizon) * Math.pow(progress, 1.2);
        const startX = sunX - curWidth / 2;

        // Bước sóng nhấp nhô theo hàm sin
        const waveOffset = Math.sin(y * 0.35 + tick * 0.08) * 3;
        const waveCount = Math.floor(curWidth / 8);

        for (let seg = 0; seg < waveCount; seg++) {
          const segX = startX + seg * 8 + waveOffset + Math.sin(y + seg + tick * 0.1) * 2;
          const segLen = 3 + Math.sin(seg + y + tick * 0.05) * 2.5;

          // Màu chuyển dần từ vàng sáng ở gần đường chân trời sang hồng cam ở tiền cảnh
          if (progress < 0.25) {
            ctx.fillStyle = 'rgba(255, 230, 110, 0.85)';
          } else if (progress < 0.6) {
            ctx.fillStyle = 'rgba(255, 138, 91, 0.7)';
          } else {
            ctx.fillStyle = 'rgba(242, 80, 140, 0.55)';
          }

          ctx.fillRect(Math.floor(segX), y, Math.max(2, Math.floor(segLen)), 1);
        }
      }

      // Những gợn sóng lấp lánh ngẫu nhiên trên toàn mặt biển
      for (let y = horizonY + 4; y < H; y += 6) {
        const rowShift = (y * 17) % W;
        const waveX = (rowShift + tick * 0.4) % (W + 30) - 15;
        const waveLen = 4 + (y - horizonY) * 0.15;

        ctx.fillStyle = 'rgba(123, 77, 216, 0.35)';
        ctx.fillRect(Math.floor(waveX), y, Math.floor(waveLen), 1);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className={`w-full h-full relative overflow-hidden bg-[#06141B] flex items-center justify-center select-none ${isFullscreen ? 'cursor-default' : ''}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover [image-rendering:pixelated]"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_40%,transparent_60%,rgba(6,20,27,0.55)_100%)]" />
    </div>
  );
};
