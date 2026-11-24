import React, { useEffect, useRef } from 'react';

export const RainySanctuaryCanvas: React.FC<{ isFullscreen?: boolean }> = ({ isFullscreen = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Kích thước chuẩn Pixel Art 16:10
    const W = 360;
    const H = 225;
    canvas.width = W;
    canvas.height = H;

    let animId: number;
    let tick = 0;

    // Hạt mưa pixel
    const rainCount = 130;
    const raindrops = Array.from({ length: rainCount }, () => ({
      x: Math.random() * (W + 80) - 40,
      y: Math.random() * H,
      speed: 4.5 + Math.random() * 3.5,
      len: 4 + Math.random() * 5,
      alpha: 0.25 + Math.random() * 0.45,
    }));

    // Bụi nước tạt vào bậu cửa sổ
    const splashes: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }[] = [];

    // Tàn lửa than lò sưởi bay lên
    const embers = Array.from({ length: 30 }, () => ({
      x: 280 + Math.random() * 50,
      y: 175 + Math.random() * 35,
      vx: (Math.random() - 0.6) * 0.5,
      vy: -(0.5 + Math.random() * 0.9),
      alpha: 0.4 + Math.random() * 0.6,
      size: Math.random() > 0.6 ? 2 : 1,
      color: Math.random() > 0.4 ? '#FF8A5B' : '#FFAA00',
    }));

    // Sấm chớp ngẫu nhiên
    let lightningIntensity = 0;

    const render = () => {
      tick++;
      ctx.imageSmoothingEnabled = false;

      // Kích hoạt chớp sáng bầu trời sau mỗi ~900 frames (~15s)
      if (Math.random() < 0.0018 && lightningIntensity <= 0) {
        lightningIntensity = 0.85;
      }
      if (lightningIntensity > 0) {
        lightningIntensity -= 0.04;
        if (lightningIntensity < 0) lightningIntensity = 0;
      }

      // 1. Nền bầu trời đêm
      const skyGradient = ctx.createLinearGradient(0, 0, 0, H);
      if (lightningIntensity > 0) {
        skyGradient.addColorStop(0, `rgba(50, 68, 90, ${0.4 + lightningIntensity * 0.6})`);
        skyGradient.addColorStop(1, `rgba(16, 32, 45, ${0.8 + lightningIntensity * 0.2})`);
      } else {
        skyGradient.addColorStop(0, '#040C12');
        skyGradient.addColorStop(0.65, '#081720');
        skyGradient.addColorStop(1, '#0C202B');
      }
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, W, H);

      // 2. Tòa thành cổ & Rặng núi xa xa ngoài cửa sổ
      ctx.fillStyle = '#06131A';
      // Dãy núi phía xa
      ctx.beginPath();
      ctx.moveTo(0, 160);
      ctx.lineTo(50, 130);
      ctx.lineTo(110, 145);
      ctx.lineTo(170, 115);
      ctx.lineTo(220, 150);
      ctx.lineTo(260, 135);
      ctx.lineTo(360, 160);
      ctx.lineTo(360, H);
      ctx.lineTo(0, H);
      ctx.fill();

      // Tháp lâu đài Gothic xa xa
      ctx.fillStyle = '#050E14';
      ctx.fillRect(75, 95, 20, 50);
      ctx.fillRect(80, 75, 10, 20); // đỉnh tháp
      ctx.fillRect(83, 62, 4, 13);  // ngọn spire
      ctx.fillRect(140, 105, 28, 40);
      ctx.fillRect(148, 90, 12, 15);

      // 3. Mưa rơi xiên góc
      ctx.strokeStyle = 'rgba(165, 205, 230, 0.45)';
      ctx.lineWidth = 1;
      for (let i = 0; i < rainCount; i++) {
        const drop = raindrops[i];
        drop.x -= 0.7; // góc rơi chéo nhẹ
        drop.y += drop.speed;

        if (drop.y > H) {
          drop.y = -10;
          drop.x = Math.random() * (W + 80) - 40;
          // Tạo splash nếu rơi trúng bậu cửa
          if (drop.x > 30 && drop.x < 240 && Math.random() < 0.2) {
            splashes.push({
              x: drop.x,
              y: 172,
              vx: (Math.random() - 0.5) * 1.5,
              vy: -(Math.random() * 1.8 + 0.5),
              life: 0,
              maxLife: 8 + Math.random() * 6,
            });
          }
        }

        ctx.strokeStyle = `rgba(175, 215, 240, ${drop.alpha})`;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 1.5, drop.y + drop.len);
        ctx.stroke();
      }

      // Vẽ các hạt splash bọt nước
      for (let i = splashes.length - 1; i >= 0; i--) {
        const sp = splashes[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.2; // trọng lực
        sp.life++;

        ctx.fillStyle = `rgba(180, 220, 255, ${1 - sp.life / sp.maxLife})`;
        ctx.fillRect(Math.floor(sp.x), Math.floor(sp.y), 1, 1);

        if (sp.life >= sp.maxLife) {
          splashes.splice(i, 1);
        }
      }

      // 4. Khung Cửa Sổ Vòm Đá Cổ Kính (Foreground)
      ctx.fillStyle = '#06141B';
      // Tường trái & trần
      ctx.fillRect(0, 0, 40, H);
      ctx.fillRect(0, 0, W, 25);
      // Bậu cửa sổ dưới
      ctx.fillRect(0, 175, 260, H - 175);
      // Khung nan cửa sổ pixel
      ctx.fillStyle = '#091B24';
      ctx.fillRect(38, 25, 4, 150);
      ctx.fillRect(145, 25, 4, 150);
      ctx.fillRect(252, 25, 4, 150);
      ctx.fillRect(38, 100, 218, 4);
      // Gạch đá viền cửa sổ
      ctx.fillStyle = '#0B222E';
      ctx.fillRect(35, 173, 225, 3);

      // 5. Góc Lò Sưởi Đá Ấm Áp Bên Phải (Fireplace)
      ctx.fillStyle = '#091A23';
      ctx.fillRect(256, 0, W - 256, H);
      // Ống khói / hốc đá lò sưởi
      ctx.fillStyle = '#040B0F';
      ctx.fillRect(275, 120, 70, 75);
      ctx.fillStyle = '#0B222E';
      ctx.fillRect(270, 115, 80, 6); // xà ngang đá lò sưởi

      // Bó củi than đỏ
      ctx.fillStyle = '#3A1408';
      ctx.fillRect(285, 180, 50, 8);
      ctx.fillStyle = '#5A1E0D';
      ctx.fillRect(290, 175, 40, 6);

      // Ngọn lửa pixel nhảy múa
      const fireColors = ['#FFF4B8', '#FFAA00', '#FF5500', '#D62828', '#800F2F'];
      const fireW = 36;
      for (let fx = 0; fx < fireW; fx += 2) {
        // Chiều cao ngọn lửa biến thiên theo hàm sin + nhiễu
        const wave = Math.sin((tick * 0.15) + fx * 0.4);
        const noise = Math.sin(tick * 0.3 + fx * 1.7) * 4;
        const fireH = Math.max(4, 18 + wave * 7 + noise);

        for (let fy = 0; fy < fireH; fy += 2) {
          const colorIdx = Math.min(fireColors.length - 1, Math.floor((fy / fireH) * fireColors.length));
          ctx.fillStyle = fireColors[colorIdx];
          ctx.fillRect(292 + fx, 180 - fy, 2, 2);
        }
      }

      // Ánh sáng ấm từ lò sưởi tỏa ra gian phòng
      const fireFlicker = Math.sin(tick * 0.12) * 0.05 + Math.sin(tick * 0.28) * 0.03;
      const fireGlow = ctx.createRadialGradient(310, 165, 5, 310, 165, 140);
      fireGlow.addColorStop(0, `rgba(255, 150, 50, ${0.35 + fireFlicker})`);
      fireGlow.addColorStop(0.5, `rgba(220, 80, 20, ${0.16 + fireFlicker * 0.5})`);
      fireGlow.addColorStop(1, 'rgba(6, 20, 27, 0)');
      ctx.fillStyle = fireGlow;
      ctx.fillRect(150, 50, W - 150, H - 50);

      // Tàn than lửa bay lập lờ (Embers)
      for (const em of embers) {
        em.y += em.vy;
        em.x += em.vx + Math.sin(tick * 0.08 + em.y * 0.1) * 0.3;
        em.alpha -= 0.006;

        if (em.y < 90 || em.alpha <= 0) {
          em.y = 175 + Math.random() * 15;
          em.x = 295 + Math.random() * 30;
          em.alpha = 0.6 + Math.random() * 0.4;
          em.vy = -(0.6 + Math.random() * 1.1);
        }

        ctx.fillStyle = em.color;
        ctx.globalAlpha = Math.max(0, em.alpha);
        ctx.fillRect(Math.floor(em.x), Math.floor(em.y), em.size, em.size);
        ctx.globalAlpha = 1.0;
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
      {/* Lớp hạt scanline & vignette retro nhẹ */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_60%,rgba(6,20,27,0.55)_100%)]" />
    </div>
  );
};
