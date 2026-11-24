import React, { useEffect, useRef } from 'react';

export const MoonlitFirefliesCanvas: React.FC<{ isFullscreen?: boolean }> = ({ isFullscreen = false }) => {
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

    // Các ngôi sao pixel nhấp nháy
    const stars = Array.from({ length: 45 }, () => ({
      x: Math.random() * W,
      y: Math.random() * 110,
      phase: Math.random() * Math.PI * 2,
      speed: 0.03 + Math.random() * 0.05,
      size: Math.random() > 0.8 ? 2 : 1,
    }));

    // Bầy đom đóm xanh ngọc bay lượn (Emerald / Mint Fireflies)
    const fireflyCount = 42;
    const fireflies = Array.from({ length: fireflyCount }, () => ({
      x: Math.random() * W,
      y: 70 + Math.random() * 130,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.35,
      freqX: 0.02 + Math.random() * 0.04,
      freqY: 0.03 + Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.04 + Math.random() * 0.06,
      size: Math.random() > 0.7 ? 2 : 1,
      baseColor: Math.random() > 0.3 ? '#7EE8C0' : '#A7F3D0',
    }));

    const render = () => {
      tick++;
      ctx.imageSmoothingEnabled = false;

      // 1. Nền bầu trời đêm rừng thẳm
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#02090E');
      skyGrad.addColorStop(0.55, '#051820');
      skyGrad.addColorStop(1, '#082329');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // 2. Ngôi sao nhấp nháy
      for (const st of stars) {
        const starAlpha = 0.3 + 0.7 * Math.abs(Math.sin(tick * st.speed + st.phase));
        ctx.fillStyle = `rgba(220, 245, 255, ${starAlpha})`;
        ctx.fillRect(Math.floor(st.x), Math.floor(st.y), st.size, st.size);
      }

      // 3. Trăng Khuyết Pixel (Crescent Moon)
      const moonX = 275;
      const moonY = 48;
      // Vầng sáng trăng
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, 55);
      moonGlow.addColorStop(0, 'rgba(126, 232, 192, 0.28)');
      moonGlow.addColorStop(0.5, 'rgba(126, 232, 192, 0.08)');
      moonGlow.addColorStop(1, 'rgba(6, 20, 27, 0)');
      ctx.fillStyle = moonGlow;
      ctx.fillRect(moonX - 60, moonY - 60, 120, 120);

      // Thân trăng pixel
      ctx.fillStyle = '#E6FFFA';
      ctx.beginPath();
      ctx.arc(moonX, moonY, 14, 0, Math.PI * 2);
      ctx.fill();
      // Khuyết trăng bằng cách đè vòng cung nền
      ctx.fillStyle = '#051820';
      ctx.beginPath();
      ctx.arc(moonX - 6, moonY - 3, 13, 0, Math.PI * 2);
      ctx.fill();

      // 4. Các lớp rặng cây rừng cổ thụ (Parallax silhouettes)
      // Lớp xa (Deep background trees)
      ctx.fillStyle = '#04151C';
      for (let tx = 0; tx < W; tx += 28) {
        const treeH = 65 + Math.sin(tx * 0.3) * 15;
        ctx.beginPath();
        ctx.moveTo(tx, H);
        ctx.lineTo(tx + 14, H - treeH);
        ctx.lineTo(tx + 28, H);
        ctx.fill();
      }

      // Đồi rêu uốn lượn trung cảnh
      ctx.fillStyle = '#041D22';
      ctx.beginPath();
      ctx.moveTo(0, H - 35);
      ctx.quadraticCurveTo(80, H - 55, 170, H - 40);
      ctx.quadraticCurveTo(270, H - 25, W, H - 45);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.fill();

      // Cây thông cận cảnh hai bên sườn
      ctx.fillStyle = '#021013';
      // Cây bên trái
      ctx.fillRect(20, 70, 8, H - 70);
      for (let y = 80; y < 180; y += 16) {
        const w = (y - 70) * 0.45;
        ctx.beginPath();
        ctx.moveTo(24 - w, y + 14);
        ctx.lineTo(24, y);
        ctx.lineTo(24 + w, y + 14);
        ctx.fill();
      }
      // Cây bên phải
      ctx.fillRect(325, 90, 7, H - 90);
      for (let y = 100; y < 190; y += 14) {
        const w = (y - 90) * 0.4;
        ctx.beginPath();
        ctx.moveTo(328 - w, y + 12);
        ctx.lineTo(328, y);
        ctx.lineTo(328 + w, y + 12);
        ctx.fill();
      }

      // Nấm phát sáng cổ tích (Luminescent fairy mushrooms)
      const mushrooms = [
        { x: 95, y: 195, color: '#7EE8C0' },
        { x: 104, y: 198, color: '#5EEAD4' },
        { x: 220, y: 202, color: '#A78BFA' },
        { x: 232, y: 200, color: '#7EE8C0' },
      ];
      for (const m of mushrooms) {
        ctx.fillStyle = '#020C0E';
        ctx.fillRect(m.x + 2, m.y + 4, 2, 6); // chân nấm
        // Mũ nấm
        ctx.fillStyle = m.color;
        ctx.fillRect(m.x, m.y, 6, 4);
        ctx.fillRect(m.x + 1, m.y - 1, 4, 1);
        // Hào quang nấm
        const mGlow = ctx.createRadialGradient(m.x + 3, m.y + 2, 1, m.x + 3, m.y + 2, 12);
        mGlow.addColorStop(0, `${m.color}66`);
        mGlow.addColorStop(1, 'rgba(6,20,27,0)');
        ctx.fillStyle = mGlow;
        ctx.fillRect(m.x - 10, m.y - 10, 26, 26);
      }

      // 5. Bầy đom đóm xanh ngọc bay lượn (Emerald Fireflies)
      for (const ff of fireflies) {
        ff.x += ff.vx + Math.sin(tick * ff.freqX + ff.phase) * 0.4;
        ff.y += ff.vy + Math.cos(tick * ff.freqY + ff.phase) * 0.3;

        // Giới hạn biên màn hình mềm mại
        if (ff.x < 10) ff.vx = Math.abs(ff.vx);
        if (ff.x > W - 10) ff.vx = -Math.abs(ff.vx);
        if (ff.y < 45) ff.vy = Math.abs(ff.vy);
        if (ff.y > H - 15) ff.vy = -Math.abs(ff.vy);

        // Nhịp thở sáng/tắt lập lòe
        const pulse = 0.25 + 0.75 * Math.pow(Math.sin(tick * ff.pulseSpeed + ff.phase), 2);

        // Vầng sáng quanh đom đóm
        if (pulse > 0.4) {
          const aura = ctx.createRadialGradient(ff.x, ff.y, 0, ff.x, ff.y, 7 * pulse);
          aura.addColorStop(0, 'rgba(126, 232, 192, 0.45)');
          aura.addColorStop(0.5, 'rgba(52, 211, 153, 0.15)');
          aura.addColorStop(1, 'rgba(6, 20, 27, 0)');
          ctx.fillStyle = aura;
          ctx.fillRect(ff.x - 8, ff.y - 8, 16, 16);
        }

        // Hạt đom đóm pixel trung tâm
        ctx.fillStyle = ff.baseColor;
        ctx.globalAlpha = pulse;
        ctx.fillRect(Math.floor(ff.x), Math.floor(ff.y), ff.size, ff.size);
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
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_60%,rgba(6,20,27,0.55)_100%)]" />
    </div>
  );
};
