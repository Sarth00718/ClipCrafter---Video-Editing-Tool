import { useEffect, useRef, useMemo, useCallback } from 'react';

const Snowflakes = ({ count = 50, speed = 1 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const snowflakesRef = useRef([]);

  // Memoize snowflake creation
  const createSnowflake = useCallback((canvas) => {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      radius: Math.random() * 3 + 1,
      speed: Math.random() * speed + 0.5,
      drift: Math.random() * 0.5 - 0.25,
      opacity: Math.random() * 0.6 + 0.2,
      // Theme colors - indigo/purple
      color: Math.random() > 0.5 ? 'rgba(99, 102, 241,' : 'rgba(168, 85, 247,',
    };
  }, [speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let isActive = true;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Recreate snowflakes on resize
      snowflakesRef.current = Array.from({ length: count }, () => 
        createSnowflake(canvas)
      );
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize snowflakes
    snowflakesRef.current = Array.from({ length: count }, () => 
      createSnowflake(canvas)
    );

    // Animation loop with RAF
    const animate = () => {
      if (!isActive) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakesRef.current.forEach((flake) => {
        // Update position
        flake.y += flake.speed;
        flake.x += flake.drift;

        // Reset if out of bounds
        if (flake.y > canvas.height) {
          flake.y = -10;
          flake.x = Math.random() * canvas.width;
        }
        if (flake.x > canvas.width) {
          flake.x = 0;
        } else if (flake.x < 0) {
          flake.x = canvas.width;
        }

        // Draw snowflake with glow
        ctx.save();
        ctx.globalAlpha = flake.opacity;

        // Outer glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = flake.color + '0.8)';
        
        // Draw main circle
        ctx.fillStyle = flake.color + flake.opacity + ')';
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw sparkle effect (6-pointed star)
        ctx.strokeStyle = flake.color + (flake.opacity * 0.6) + ')';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const x1 = flake.x + Math.cos(angle) * flake.radius * 1.5;
          const y1 = flake.y + Math.sin(angle) * flake.radius * 1.5;
          const x2 = flake.x + Math.cos(angle) * flake.radius * 0.5;
          const y2 = flake.y + Math.sin(angle) * flake.radius * 0.5;
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      isActive = false;
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [count, createSnowflake]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9998,
        opacity: 0.6,
      }}
    />
  );
};

// Memoize component to prevent unnecessary re-renders
export default Snowflakes;
