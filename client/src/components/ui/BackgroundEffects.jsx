import { useEffect, useRef, useMemo, useCallback, memo } from 'react';

const BackgroundEffects = memo(({ particleCount = 50, connectionDistance = 100 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Particle class
  const Particle = useMemo(() => {
    return class {
      constructor(canvas) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update(canvas) {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around edges
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw(ctx) {
        ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    };
  }, []);

  // Mouse move handler
  const handleMouseMove = useCallback((e) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let isActive = true;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Recreate particles on resize
      const actualCount = Math.floor((canvas.width * canvas.height) / 15000);
      particlesRef.current = Array.from(
        { length: Math.min(actualCount, particleCount) }, 
        () => new Particle(canvas)
      );
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);

    // Initialize particles
    const actualCount = Math.floor((canvas.width * canvas.height) / 15000);
    particlesRef.current = Array.from(
      { length: Math.min(actualCount, particleCount) }, 
      () => new Particle(canvas)
    );

    // Animation loop with RAF and performance optimization
    let lastTime = 0;
    const fps = 60;
    const interval = 1000 / fps;

    const animate = (currentTime) => {
      if (!isActive) return;

      const deltaTime = currentTime - lastTime;

      if (deltaTime >= interval) {
        lastTime = currentTime - (deltaTime % interval);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update and draw particles
        particlesRef.current.forEach((particle) => {
          particle.update(canvas);
          particle.draw(ctx);
        });

        // Draw connections (optimized - only check nearby particles)
        for (let i = 0; i < particlesRef.current.length; i++) {
          const particleA = particlesRef.current[i];
          
          for (let j = i + 1; j < particlesRef.current.length; j++) {
            const particleB = particlesRef.current[j];
            const dx = particleA.x - particleB.x;
            const dy = particleA.y - particleB.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectionDistance) {
              ctx.strokeStyle = `rgba(99, 102, 241, ${0.15 * (1 - distance / connectionDistance)})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(particleA.x, particleA.y);
              ctx.lineTo(particleB.x, particleB.y);
              ctx.stroke();
            }
          }

          // Connect to mouse
          const dx = particleA.x - mouseRef.current.x;
          const dy = particleA.y - mouseRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.3 * (1 - distance / 150)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particleA.x, particleA.y);
            ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
            ctx.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [Particle, particleCount, connectionDistance, handleMouseMove]);

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
        zIndex: 0,
        opacity: 0.4,
      }}
    />
  );
});

BackgroundEffects.displayName = 'BackgroundEffects';

export default BackgroundEffects;
