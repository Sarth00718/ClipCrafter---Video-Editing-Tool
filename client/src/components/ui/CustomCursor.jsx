import { useEffect, useRef, useState, useCallback, memo } from 'react';

const CustomCursor = memo(() => {
  const cursorRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [trails, setTrails] = useState([]);
  const [backTrails, setBackTrails] = useState([]);
  const mousePos = useRef({ x: 0, y: 0 });
  const cursorPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const trailHistory = useRef([]);

  // Memoized event handlers
  const handleMouseMove = useCallback((e) => {
    mousePos.current = { x: e.clientX, y: e.clientY };

    // Add front trail with throttling
    if (Math.random() > 0.7) {
      const trail = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
      };
      setTrails((prev) => [...prev.slice(-10), trail]);
    }

    // Add to trail history for back trail
    trailHistory.current.push({
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    });

    // Keep only recent history (last 500ms)
    const now = Date.now();
    trailHistory.current = trailHistory.current.filter(t => now - t.time < 500);

    // Create back trail from history
    if (trailHistory.current.length > 5 && Math.random() > 0.8) {
      const oldPos = trailHistory.current[Math.floor(trailHistory.current.length / 2)];
      const backTrail = {
        id: Date.now() + Math.random(),
        x: oldPos.x,
        y: oldPos.y,
      };
      setBackTrails((prev) => [...prev.slice(-15), backTrail]);
    }
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsClicking(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsClicking(false);
  }, []);

  const handleMouseOver = useCallback((e) => {
    const target = e.target;
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.classList.contains('btn-primary') ||
      target.classList.contains('btn-ghost') ||
      target.classList.contains('btn-icon') ||
      target.closest('button') ||
      target.closest('a')
    ) {
      setIsHovering(true);
    } else {
      setIsHovering(false);
    }
  }, []);

  useEffect(() => {
    // Hide default cursor
    document.body.classList.add('no-cursor');

    // Smooth cursor animation with RAF
    const animateCursor = () => {
      const dx = mousePos.current.x - cursorPos.current.x;
      const dy = mousePos.current.y - cursorPos.current.y;

      cursorPos.current.x += dx * 0.15;
      cursorPos.current.y += dy * 0.15;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${cursorPos.current.x}px, ${cursorPos.current.y}px)`;
      }

      rafRef.current = requestAnimationFrame(animateCursor);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleMouseOver, { passive: true });

    rafRef.current = requestAnimationFrame(animateCursor);

    // Cleanup trails periodically
    const trailCleanup = setInterval(() => {
      setTrails((prev) => prev.slice(-5));
      setBackTrails((prev) => prev.slice(-8));
    }, 100);

    return () => {
      document.body.classList.remove('no-cursor');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleMouseOver);
      clearInterval(trailCleanup);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp, handleMouseOver]);

  return (
    <>
      {/* Back trails */}
      {backTrails.map((trail) => (
        <div
          key={trail.id}
          className="cursor-back-trail"
          style={{
            left: trail.x,
            top: trail.y,
          }}
        />
      ))}

      {/* Main cursor */}
      <div
        ref={cursorRef}
        className={`custom-cursor ${isHovering ? 'hover' : ''} ${isClicking ? 'click' : ''}`}
      >
        <div className="cursor-dot"></div>
        <div className="cursor-outline"></div>
      </div>

      {/* Front trails */}
      {trails.map((trail) => (
        <div
          key={trail.id}
          className="cursor-trail"
          style={{
            left: trail.x,
            top: trail.y,
          }}
        />
      ))}
    </>
  );
});

CustomCursor.displayName = 'CustomCursor';

export default CustomCursor;
