import React, { useEffect, useRef } from 'react';

const Orb: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple pulsing orb animation
    let radius = 50;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.arc(100, 100, radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.fill();
      radius = 50 + 10 * Math.sin(Date.now() / 500);
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return <canvas ref={canvasRef} width={200} height={200} />;
};

export default Orb;
